import { prisma } from "@/lib/prisma";
import { MatchingPanel } from "./matching-panel";

export default async function MatchingPage() {
  const cycles = await prisma.allocationCycle.findMany({
    where: {
      status: {
        in: ["PREFERENCES_CLOSED", "MATCHING_RUN", "RESULTS_PUBLISHED"],
      },
    },
    orderBy: { createdAt: "desc" },
  });

  // Also get cycles with preferences open (for preview)
  const openCycles = await prisma.allocationCycle.findMany({
    where: { status: "PREFERENCES_OPEN" },
    orderBy: { createdAt: "desc" },
  });

  const allCycles = [...cycles, ...openCycles];

  // Get matching runs for each cycle
  const matchingRuns = await prisma.matchingRun.findMany({
    where: { cycleId: { in: allCycles.map((c) => c.id) } },
    orderBy: { startedAt: "desc" },
  });

  // Get preference counts per cycle
  const prefCounts = await Promise.all(
    allCycles.map(async (c) => {
      const count = await prisma.preference.groupBy({
        by: ["studentId"],
        where: { cycleId: c.id },
      });
      return { cycleId: c.id, studentCount: count.length };
    })
  );

  const prefCountMap = Object.fromEntries(
    prefCounts.map((p) => [p.cycleId, p.studentCount])
  );

  return (
    <div>
      <h1 className="text-2xl font-bold">Matching</h1>
      <p className="text-[var(--muted-foreground)] mt-1">
        Configure and run the placement matching algorithm.
      </p>

      {allCycles.length === 0 ? (
        <div className="mt-6 border border-[var(--border)] rounded-lg p-8 text-center text-[var(--muted-foreground)]">
          No cycles are ready for matching. Close preferences on a cycle first.
        </div>
      ) : (
        <div className="mt-6 space-y-6">
          {allCycles.map((cycle) => (
            <MatchingPanel
              key={cycle.id}
              cycle={{
                id: cycle.id,
                name: cycle.name,
                status: cycle.status,
                tieBreakStrategy: cycle.tieBreakStrategy,
                randomSeed: cycle.randomSeed,
                maxPreferences: cycle.maxPreferences,
              }}
              studentsWithPreferences={prefCountMap[cycle.id] ?? 0}
              matchingRuns={matchingRuns
                .filter((r) => r.cycleId === cycle.id)
                .map((r) => ({
                  id: r.id,
                  status: r.status,
                  isSimulation: r.isSimulation,
                  startedAt: r.startedAt.toISOString(),
                  completedAt: r.completedAt?.toISOString() ?? null,
                  durationMs: r.durationMs,
                  totalStudents: r.totalStudents,
                  totalAllocated: r.totalAllocated,
                  totalUnallocated: r.totalUnallocated,
                  tieBreakStrategy: r.tieBreakStrategy,
                }))}
            />
          ))}
        </div>
      )}
    </div>
  );
}
