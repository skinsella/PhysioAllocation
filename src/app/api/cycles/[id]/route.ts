import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { updateCycleSchema } from "@/lib/validators/cycle";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user || !["ADMIN", "SYSTEM_ADMIN"].includes(session.user.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const cycle = await prisma.allocationCycle.findUnique({
    where: { id },
    include: {
      placements: {
        include: { hospital: true },
        orderBy: { createdAt: "asc" },
      },
      _count: {
        select: { preferences: true, matchingRuns: true, allocations: true },
      },
    },
  });

  if (!cycle) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json(cycle);
}

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user || !["ADMIN", "SYSTEM_ADMIN"].includes(session.user.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const body = await req.json();
  const parsed = updateCycleSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", issues: parsed.error.issues },
      { status: 400 }
    );
  }

  const data = parsed.data;
  const cycle = await prisma.allocationCycle.update({
    where: { id },
    data: {
      ...(data.name !== undefined && { name: data.name }),
      ...(data.academicYear !== undefined && {
        academicYear: data.academicYear,
      }),
      ...(data.status !== undefined && { status: data.status }),
      ...(data.tieBreakStrategy !== undefined && {
        tieBreakStrategy: data.tieBreakStrategy,
      }),
      ...(data.randomSeed !== undefined && { randomSeed: data.randomSeed }),
      ...(data.maxPreferences !== undefined && {
        maxPreferences: data.maxPreferences,
      }),
      ...(data.preferencesOpenDate !== undefined && {
        preferencesOpenDate: data.preferencesOpenDate
          ? new Date(data.preferencesOpenDate)
          : null,
      }),
      ...(data.preferencesCloseDate !== undefined && {
        preferencesCloseDate: data.preferencesCloseDate
          ? new Date(data.preferencesCloseDate)
          : null,
      }),
    },
  });

  return NextResponse.json(cycle);
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user || !["ADMIN", "SYSTEM_ADMIN"].includes(session.user.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  // Only allow deleting DRAFT cycles
  const cycle = await prisma.allocationCycle.findUnique({ where: { id } });
  if (!cycle) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (cycle.status !== "DRAFT") {
    return NextResponse.json(
      { error: "Can only delete cycles in DRAFT status" },
      { status: 400 }
    );
  }

  await prisma.allocationCycle.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
