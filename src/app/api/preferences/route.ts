import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const cycleId = searchParams.get("cycleId");

  if (!cycleId) {
    return NextResponse.json({ error: "cycleId required" }, { status: 400 });
  }

  // Students can only see their own preferences
  if (session.user.role === "STUDENT") {
    const student = await prisma.student.findUnique({
      where: { studentId: session.user.studentId! },
    });
    if (!student) {
      return NextResponse.json({ error: "Student not found" }, { status: 404 });
    }

    const preferences = await prisma.preference.findMany({
      where: { studentId: student.id, cycleId },
      include: { placement: { include: { hospital: true } } },
      orderBy: { rank: "asc" },
    });

    return NextResponse.json(preferences);
  }

  // Admins can see all preferences
  const preferences = await prisma.preference.findMany({
    where: { cycleId },
    include: {
      student: { include: { user: true } },
      placement: { include: { hospital: true } },
    },
    orderBy: [{ student: { academicRank: "asc" } }, { rank: "asc" }],
  });

  return NextResponse.json(preferences);
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user || session.user.role !== "STUDENT") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { cycleId, rankings } = body as {
    cycleId: string;
    rankings: { placementId: string; rank: number }[];
  };

  if (!cycleId || !rankings || !Array.isArray(rankings)) {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  // Validate cycle is open
  const cycle = await prisma.allocationCycle.findUnique({
    where: { id: cycleId },
  });

  if (!cycle) {
    return NextResponse.json({ error: "Cycle not found" }, { status: 404 });
  }

  if (cycle.status !== "PREFERENCES_OPEN") {
    return NextResponse.json(
      { error: "Preference submission is not open for this cycle" },
      { status: 400 }
    );
  }

  // Check deadline
  if (cycle.preferencesCloseDate && new Date() > cycle.preferencesCloseDate) {
    return NextResponse.json(
      { error: "Submission deadline has passed" },
      { status: 400 }
    );
  }

  // Validate max preferences
  if (rankings.length > cycle.maxPreferences) {
    return NextResponse.json(
      { error: `Maximum ${cycle.maxPreferences} preferences allowed` },
      { status: 400 }
    );
  }

  // Validate sequential ranks
  const ranks = rankings.map((r) => r.rank).sort((a, b) => a - b);
  for (let i = 0; i < ranks.length; i++) {
    if (ranks[i] !== i + 1) {
      return NextResponse.json(
        { error: "Ranks must be sequential starting from 1" },
        { status: 400 }
      );
    }
  }

  // Validate no duplicate placements
  const placementIds = new Set(rankings.map((r) => r.placementId));
  if (placementIds.size !== rankings.length) {
    return NextResponse.json(
      { error: "Duplicate placements not allowed" },
      { status: 400 }
    );
  }

  const student = await prisma.student.findUnique({
    where: { studentId: session.user.studentId! },
  });

  if (!student) {
    return NextResponse.json({ error: "Student not found" }, { status: 404 });
  }

  // Delete existing preferences and insert new ones (atomic)
  await prisma.$transaction([
    prisma.preference.deleteMany({
      where: { studentId: student.id, cycleId },
    }),
    ...rankings.map((r) =>
      prisma.preference.create({
        data: {
          studentId: student.id,
          placementId: r.placementId,
          cycleId,
          rank: r.rank,
        },
      })
    ),
  ]);

  return NextResponse.json({ success: true, count: rankings.length });
}
