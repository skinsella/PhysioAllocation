import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { format } from "date-fns";
import { CreateCycleButton } from "./create-cycle-button";

const statusLabels: Record<string, { label: string; color: string }> = {
  DRAFT: { label: "Draft", color: "bg-gray-100 text-gray-700" },
  PREFERENCES_OPEN: { label: "Preferences Open", color: "bg-green-100 text-green-700" },
  PREFERENCES_CLOSED: { label: "Preferences Closed", color: "bg-yellow-100 text-yellow-700" },
  MATCHING_RUN: { label: "Matching Run", color: "bg-blue-100 text-blue-700" },
  RESULTS_PUBLISHED: { label: "Results Published", color: "bg-purple-100 text-purple-700" },
  ARCHIVED: { label: "Archived", color: "bg-gray-100 text-gray-500" },
};

export default async function CyclesPage() {
  const cycles = await prisma.allocationCycle.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      _count: {
        select: { placements: true, preferences: true, matchingRuns: true },
      },
    },
  });

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Allocation Cycles</h1>
          <p className="text-[var(--muted-foreground)] mt-1">
            Manage allocation cycles and their configuration.
          </p>
        </div>
        <CreateCycleButton />
      </div>

      {cycles.length === 0 ? (
        <div className="mt-6 border border-[var(--border)] rounded-lg p-8 text-center text-[var(--muted-foreground)]">
          No allocation cycles created yet. Click &quot;New Cycle&quot; to get started.
        </div>
      ) : (
        <div className="mt-6 space-y-3">
          {cycles.map((cycle) => {
            const status = statusLabels[cycle.status] ?? {
              label: cycle.status,
              color: "bg-gray-100",
            };
            return (
              <Link
                key={cycle.id}
                href={`/admin/cycles/${cycle.id}`}
                className="block border border-[var(--border)] rounded-lg p-4 hover:bg-[var(--accent)] transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="font-semibold">{cycle.name}</h2>
                    <p className="text-sm text-[var(--muted-foreground)]">
                      {cycle.academicYear}
                    </p>
                  </div>
                  <span
                    className={`text-xs font-medium px-2.5 py-1 rounded-full ${status.color}`}
                  >
                    {status.label}
                  </span>
                </div>
                <div className="mt-3 flex gap-6 text-sm text-[var(--muted-foreground)]">
                  <span>{cycle._count.placements} placements</span>
                  <span>{cycle._count.preferences} preferences</span>
                  <span>{cycle._count.matchingRuns} matching runs</span>
                  {cycle.preferencesCloseDate && (
                    <span>
                      Deadline:{" "}
                      {format(cycle.preferencesCloseDate, "dd MMM yyyy HH:mm")}
                    </span>
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
