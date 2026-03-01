import { PrismaClient } from "../generated/prisma";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";
import bcrypt from "bcryptjs";

function parseDatabaseUrl(url: string) {
  const parsed = new URL(url);
  return {
    host: parsed.hostname || "localhost",
    port: parseInt(parsed.port || "5432"),
    database: parsed.pathname.slice(1),
    user: parsed.username || undefined,
    password: parsed.password || undefined,
  };
}

const pool = new pg.Pool(parseDatabaseUrl(process.env.DATABASE_URL!));
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("Seeding database...");

  // Create admin user
  const adminPasswordHash = await bcrypt.hash("admin123", 10);
  const admin = await prisma.user.upsert({
    where: { email: "admin@ul.ie" },
    update: {},
    create: {
      email: "admin@ul.ie",
      name: "Admin User",
      role: "ADMIN",
      passwordHash: adminPasswordHash,
    },
  });
  console.log(`Created admin: ${admin.email}`);

  // Create test students
  const students = [
    {
      name: "Alice Murphy",
      studentId: "21012001",
      dob: "2000-03-15",
      mark: 78.5,
    },
    {
      name: "Brian O'Brien",
      studentId: "21012002",
      dob: "1999-07-22",
      mark: 72.3,
    },
    {
      name: "Ciara Kelly",
      studentId: "21012003",
      dob: "2000-01-10",
      mark: 85.1,
    },
    {
      name: "David Walsh",
      studentId: "21012004",
      dob: "1999-11-05",
      mark: 68.9,
    },
    {
      name: "Emma Ryan",
      studentId: "21012005",
      dob: "2000-06-18",
      mark: 72.3,
    },
    {
      name: "Fiona Doyle",
      studentId: "21012006",
      dob: "1999-09-28",
      mark: 91.2,
    },
    {
      name: "Gavin McCarthy",
      studentId: "21012007",
      dob: "2000-04-03",
      mark: 65.7,
    },
    {
      name: "Hannah Fitzgerald",
      studentId: "21012008",
      dob: "1999-12-14",
      mark: 74.8,
    },
  ];

  // Sort by mark descending to compute ranks
  const sorted = [...students].sort((a, b) => b.mark - a.mark);
  const rankMap = new Map<string, number>();
  let currentRank = 1;
  for (let i = 0; i < sorted.length; i++) {
    if (i > 0 && sorted[i].mark < sorted[i - 1].mark) {
      currentRank = i + 1;
    }
    rankMap.set(sorted[i].studentId, currentRank);
  }

  for (const s of students) {
    const user = await prisma.user.upsert({
      where: { email: `${s.studentId}@student.ul.ie` },
      update: {},
      create: {
        email: `${s.studentId}@student.ul.ie`,
        name: s.name,
        role: "STUDENT",
      },
    });

    await prisma.student.upsert({
      where: { studentId: s.studentId },
      update: {},
      create: {
        userId: user.id,
        studentId: s.studentId,
        dateOfBirth: new Date(s.dob),
        programme: "BSc Physiotherapy",
        year: 4,
        institution: "University of Limerick",
        overallMark: s.mark,
        academicRank: rankMap.get(s.studentId)!,
      },
    });
    console.log(`Created student: ${s.name} (${s.studentId})`);
  }

  // Create hospitals
  const ulh = await prisma.hospital.create({
    data: {
      name: "University Hospital Limerick",
      city: "Limerick",
      county: "Limerick",
      contactName: "Dr. Sarah Collins",
      contactEmail: "sarah.collins@hse.ie",
    },
  });

  const cuh = await prisma.hospital.create({
    data: {
      name: "Cork University Hospital",
      city: "Cork",
      county: "Cork",
      contactName: "Dr. James Hogan",
      contactEmail: "james.hogan@hse.ie",
    },
  });

  const galway = await prisma.hospital.create({
    data: {
      name: "University Hospital Galway",
      city: "Galway",
      county: "Galway",
      contactName: "Dr. Mary Brennan",
      contactEmail: "mary.brennan@hse.ie",
    },
  });

  console.log("Created hospitals");

  // Create allocation cycle
  const cycle = await prisma.allocationCycle.create({
    data: {
      name: "2025-26 Semester 2 Clinical Placement",
      academicYear: "2025-2026",
      status: "DRAFT",
      tieBreakStrategy: "RANDOM_SEED",
      randomSeed: 42,
      maxPreferences: 10,
    },
  });
  console.log(`Created cycle: ${cycle.name}`);

  // Create placements
  const placements = [
    {
      hospitalId: ulh.id,
      speciality: "Musculoskeletal",
      capacity: 2,
      supervisor: "Dr. P. Murphy",
    },
    {
      hospitalId: ulh.id,
      speciality: "Respiratory",
      capacity: 2,
      supervisor: "Dr. A. Lynch",
    },
    {
      hospitalId: cuh.id,
      speciality: "Neurology",
      capacity: 2,
      supervisor: "Dr. K. O'Connell",
    },
    {
      hospitalId: cuh.id,
      speciality: "Musculoskeletal",
      capacity: 3,
      supervisor: "Dr. T. Barry",
    },
    {
      hospitalId: galway.id,
      speciality: "Paediatrics",
      capacity: 2,
      supervisor: "Dr. R. Gallagher",
    },
  ];

  for (const p of placements) {
    await prisma.placement.create({
      data: {
        hospitalId: p.hospitalId,
        cycleId: cycle.id,
        speciality: p.speciality,
        capacity: p.capacity,
        startDate: new Date("2026-01-12"),
        endDate: new Date("2026-04-10"),
        supervisorName: p.supervisor,
        active: true,
      },
    });
  }
  console.log(`Created ${placements.length} placements`);

  console.log("Seeding complete!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
