import { PrismaClient } from "../generated/prisma";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";

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
  // Get the active cycle
  const cycle = await prisma.allocationCycle.findFirst({
    where: { status: "PREFERENCES_OPEN" },
  });
  if (!cycle) {
    console.log("No cycle with PREFERENCES_OPEN status");
    return;
  }

  const placements = await prisma.placement.findMany({
    where: { cycleId: cycle.id, active: true },
    include: { hospital: true },
  });

  const students = await prisma.student.findMany({
    orderBy: { academicRank: "asc" },
  });

  console.log(`Found ${students.length} students, ${placements.length} placements`);

  // Clear existing preferences for this cycle
  await prisma.preference.deleteMany({ where: { cycleId: cycle.id } });

  // Create varied preference lists for each student
  const prefPatterns = [
    [0, 1, 2, 3, 4], // Alice: CUH Neuro, CUH MSK, Galway Paeds, UHL MSK, UHL Resp
    [3, 4, 0, 1, 2], // Brian: UHL MSK, UHL Resp, CUH Neuro, CUH MSK, Galway
    [2, 0, 3, 1, 4], // Ciara: Galway, CUH Neuro, UHL MSK, CUH MSK, UHL Resp
    [1, 3, 0, 4, 2], // David: CUH MSK, UHL MSK, CUH Neuro, UHL Resp, Galway
    [4, 2, 1, 0, 3], // Emma: UHL Resp, Galway, CUH MSK, CUH Neuro, UHL MSK
    [0, 2, 1, 4, 3], // Fiona: CUH Neuro, Galway, CUH MSK, UHL Resp, UHL MSK
    [3, 1, 4, 2, 0], // Gavin: UHL MSK, CUH MSK, UHL Resp, Galway, CUH Neuro
    [2, 4, 3, 0, 1], // Hannah: Galway, UHL Resp, UHL MSK, CUH Neuro, CUH MSK
  ];

  for (let i = 0; i < students.length; i++) {
    const student = students[i];
    const pattern = prefPatterns[i] || prefPatterns[0];

    for (let rank = 0; rank < pattern.length; rank++) {
      await prisma.preference.create({
        data: {
          studentId: student.id,
          placementId: placements[pattern[rank]].id,
          cycleId: cycle.id,
          rank: rank + 1,
        },
      });
    }
    console.log(`Created preferences for student ${student.studentId}`);
  }

  console.log("Done seeding preferences!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
