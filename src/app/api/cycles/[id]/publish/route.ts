import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user || !["ADMIN", "SYSTEM_ADMIN"].includes(session.user.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const cycle = await prisma.allocationCycle.findUnique({
    where: { id },
  });

  if (!cycle) {
    return NextResponse.json({ error: "Cycle not found" }, { status: 404 });
  }

  if (cycle.status !== "MATCHING_RUN") {
    return NextResponse.json(
      { error: "Cycle must be in MATCHING_RUN status to publish results" },
      { status: 400 }
    );
  }

  // Check that a final matching run exists
  const finalRun = await prisma.matchingRun.findFirst({
    where: { cycleId: id, isSimulation: false },
    orderBy: { startedAt: "desc" },
  });

  if (!finalRun) {
    return NextResponse.json(
      { error: "No final matching run found. Run final matching first." },
      { status: 400 }
    );
  }

  // Update cycle status and matching run status
  await prisma.$transaction([
    prisma.allocationCycle.update({
      where: { id },
      data: { status: "RESULTS_PUBLISHED" },
    }),
    prisma.matchingRun.update({
      where: { id: finalRun.id },
      data: { status: "PUBLISHED" },
    }),
  ]);

  return NextResponse.json({ success: true, status: "RESULTS_PUBLISHED" });
}
