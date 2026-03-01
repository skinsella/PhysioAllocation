import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { runSerialDictatorship } from "@/lib/matching/serial-dictatorship";
import type {
  StudentForMatching,
  PlacementForMatching,
  PreferenceForMatching,
} from "@/lib/matching/types";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user || !["ADMIN", "SYSTEM_ADMIN"].includes(session.user.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { cycleId, isSimulation = false } = body as {
    cycleId: string;
    isSimulation?: boolean;
  };

  if (!cycleId) {
    return NextResponse.json({ error: "cycleId required" }, { status: 400 });
  }

  const cycle = await prisma.allocationCycle.findUnique({
    where: { id: cycleId },
  });

  if (!cycle) {
    return NextResponse.json({ error: "Cycle not found" }, { status: 404 });
  }

  // For final matching, cycle must be in PREFERENCES_CLOSED status
  if (
    !isSimulation &&
    cycle.status !== "PREFERENCES_CLOSED" &&
    cycle.status !== "MATCHING_RUN"
  ) {
    return NextResponse.json(
      {
        error:
          "Cycle must be in PREFERENCES_CLOSED or MATCHING_RUN status for final matching",
      },
      { status: 400 }
    );
  }

  // Fetch all data for matching
  const [students, placements, preferences] = await Promise.all([
    prisma.student.findMany({
      where: { academicRank: { not: null } },
      include: { user: true },
    }),
    prisma.placement.findMany({
      where: { cycleId, active: true },
      include: { hospital: true },
    }),
    prisma.preference.findMany({ where: { cycleId } }),
  ]);

  // Transform to matching input
  const matchingStudents: StudentForMatching[] = students.map((s) => ({
    id: s.id,
    studentId: s.studentId,
    academicRank: s.academicRank!,
    overallMark: Number(s.overallMark),
    additionalScore: s.additionalScore ? Number(s.additionalScore) : undefined,
    institution: s.institution ?? undefined,
    name: s.user.name,
  }));

  const matchingPlacements: PlacementForMatching[] = placements.map((p) => ({
    id: p.id,
    hospitalName: p.hospital.name,
    speciality: p.speciality,
    capacity: p.capacity,
  }));

  const matchingPreferences: PreferenceForMatching[] = preferences.map(
    (p) => ({
      studentId: p.studentId,
      placementId: p.placementId,
      rank: p.rank,
    })
  );

  // Run algorithm
  const result = runSerialDictatorship({
    students: matchingStudents,
    placements: matchingPlacements,
    preferences: matchingPreferences,
    config: {
      tieBreakStrategy: cycle.tieBreakStrategy,
      randomSeed: cycle.randomSeed ?? undefined,
    },
  });

  // Save matching run
  const matchingRun = await prisma.matchingRun.create({
    data: {
      cycleId,
      status: isSimulation ? "SIMULATION" : "FINAL",
      isSimulation,
      randomSeed: cycle.randomSeed,
      tieBreakStrategy: cycle.tieBreakStrategy,
      completedAt: new Date(),
      durationMs: Math.round(result.statistics.durationMs),
      totalStudents: result.statistics.totalStudents,
      totalPlacements: matchingPlacements.length,
      totalAllocated: result.statistics.totalAllocated,
      totalUnallocated: result.statistics.totalUnallocated,
      configSnapshot: {
        tieBreakStrategy: cycle.tieBreakStrategy,
        randomSeed: cycle.randomSeed,
        maxPreferences: cycle.maxPreferences,
      },
      algorithmLog: result.log,
    },
  });

  // Save allocations
  if (result.allocations.length > 0) {
    await prisma.allocation.createMany({
      data: result.allocations.map((a) => ({
        studentId: a.studentId,
        placementId: a.placementId,
        cycleId,
        matchingRunId: matchingRun.id,
        preferenceRank: a.preferenceRank,
      })),
    });
  }

  // Update cycle status for final runs
  if (!isSimulation) {
    await prisma.allocationCycle.update({
      where: { id: cycleId },
      data: { status: "MATCHING_RUN" },
    });
  }

  return NextResponse.json({
    matchingRunId: matchingRun.id,
    isSimulation,
    statistics: result.statistics,
    unallocated: result.unallocated,
    allocations: result.allocations.length,
  });
}
