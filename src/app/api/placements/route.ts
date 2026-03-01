import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createPlacementSchema } from "@/lib/validators/placement";

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const cycleId = searchParams.get("cycleId");

  const placements = await prisma.placement.findMany({
    where: {
      ...(cycleId && { cycleId }),
      active: true,
    },
    include: { hospital: true },
    orderBy: [{ hospital: { name: "asc" } }, { speciality: "asc" }],
  });

  return NextResponse.json(placements);
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user || !["ADMIN", "SYSTEM_ADMIN"].includes(session.user.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const parsed = createPlacementSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", issues: parsed.error.issues },
      { status: 400 }
    );
  }

  const data = parsed.data;
  const placement = await prisma.placement.create({
    data: {
      hospitalId: data.hospitalId,
      cycleId: data.cycleId,
      speciality: data.speciality,
      capacity: data.capacity,
      startDate: new Date(data.startDate),
      endDate: new Date(data.endDate),
      description: data.description,
      location: data.location,
      supervisorName: data.supervisorName,
    },
    include: { hospital: true },
  });

  return NextResponse.json(placement, { status: 201 });
}
