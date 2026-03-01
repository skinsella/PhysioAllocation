import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createHospitalSchema } from "@/lib/validators/placement";

export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const hospitals = await prisma.hospital.findMany({
    orderBy: { name: "asc" },
    include: { _count: { select: { placements: true } } },
  });

  return NextResponse.json(hospitals);
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user || !["ADMIN", "SYSTEM_ADMIN"].includes(session.user.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const parsed = createHospitalSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", issues: parsed.error.issues },
      { status: 400 }
    );
  }

  const hospital = await prisma.hospital.create({ data: parsed.data });
  return NextResponse.json(hospital, { status: 201 });
}
