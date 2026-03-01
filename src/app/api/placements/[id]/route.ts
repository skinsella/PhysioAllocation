import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { updatePlacementSchema } from "@/lib/validators/placement";

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
  const parsed = updatePlacementSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", issues: parsed.error.issues },
      { status: 400 }
    );
  }

  const data = parsed.data;
  const placement = await prisma.placement.update({
    where: { id },
    data: {
      ...(data.hospitalId !== undefined && { hospitalId: data.hospitalId }),
      ...(data.speciality !== undefined && { speciality: data.speciality }),
      ...(data.capacity !== undefined && { capacity: data.capacity }),
      ...(data.startDate !== undefined && {
        startDate: new Date(data.startDate),
      }),
      ...(data.endDate !== undefined && { endDate: new Date(data.endDate) }),
      ...(data.description !== undefined && { description: data.description }),
      ...(data.location !== undefined && { location: data.location }),
      ...(data.supervisorName !== undefined && {
        supervisorName: data.supervisorName,
      }),
    },
    include: { hospital: true },
  });

  return NextResponse.json(placement);
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
  await prisma.placement.update({
    where: { id },
    data: { active: false },
  });

  return NextResponse.json({ success: true });
}
