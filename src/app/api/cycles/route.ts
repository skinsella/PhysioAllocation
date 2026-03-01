import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createCycleSchema } from "@/lib/validators/cycle";

export async function GET() {
  const session = await auth();
  if (!session?.user || !["ADMIN", "SYSTEM_ADMIN"].includes(session.user.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const cycles = await prisma.allocationCycle.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      _count: {
        select: { placements: true, preferences: true, matchingRuns: true },
      },
    },
  });

  return NextResponse.json(cycles);
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user || !["ADMIN", "SYSTEM_ADMIN"].includes(session.user.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const parsed = createCycleSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", issues: parsed.error.issues },
      { status: 400 }
    );
  }

  const data = parsed.data;
  const cycle = await prisma.allocationCycle.create({
    data: {
      name: data.name,
      academicYear: data.academicYear,
      tieBreakStrategy: data.tieBreakStrategy,
      randomSeed: data.randomSeed,
      maxPreferences: data.maxPreferences,
      preferencesOpenDate: data.preferencesOpenDate
        ? new Date(data.preferencesOpenDate)
        : null,
      preferencesCloseDate: data.preferencesCloseDate
        ? new Date(data.preferencesCloseDate)
        : null,
    },
  });

  return NextResponse.json(cycle, { status: 201 });
}
