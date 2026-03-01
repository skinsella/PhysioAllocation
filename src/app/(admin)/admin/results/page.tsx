import { prisma } from "@/lib/prisma";
import { PublishButton } from "./publish-button";

export default async function AdminResultsPage() {
  // Find cycles that have had matching run
  const cycles = await prisma.allocationCycle.findMany({
    where: { status: { in: ["MATCHING_RUN", "RESULTS_PUBLISHED"] } },
    orderBy: { createdAt: "desc" },
  });

  if (cycles.length === 0) {
    return (
      <div>
        <h1 className="text-2xl font-bold">Results</h1>
        <p className="text-[var(--muted-foreground)] mt-1">
          View and publish matching results.
        </p>
        <div className="mt-6 border border-[var(--border)] rounded-lg p-8 text-center text-[var(--muted-foreground)]">
          No matching results available. Run the matching algorithm first.
        </div>
      </div>
    );
  }

  // Get results for the most recent cycle
  const cycle = cycles[0];

  const finalRun = await prisma.matchingRun.findFirst({
    where: { cycleId: cycle.id, isSimulation: false },
    orderBy: { startedAt: "desc" },
  });

  const allocations = finalRun
    ? await prisma.allocation.findMany({
        where: { matchingRunId: finalRun.id },
        include: {
          student: { include: { user: true } },
          placement: { include: { hospital: true } },
        },
        orderBy: { preferenceRank: "asc" },
      })
    : [];

  // Students who were not allocated
  const allocatedStudentIds = new Set(allocations.map((a) => a.studentId));
  const allStudents = await prisma.student.findMany({
    where: { academicRank: { not: null } },
    include: { user: true },
    orderBy: { academicRank: "asc" },
  });
  const unallocatedStudents = allStudents.filter(
    (s) => !allocatedStudentIds.has(s.id)
  );

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Results — {cycle.name}</h1>
          <p className="text-[var(--muted-foreground)] mt-1">
            {cycle.status === "RESULTS_PUBLISHED"
              ? "Results have been published to students."
              : "Review results before publishing."}
          </p>
        </div>
        {cycle.status === "MATCHING_RUN" && (
          <PublishButton cycleId={cycle.id} />
        )}
        {cycle.status === "RESULTS_PUBLISHED" && (
          <span className="px-3 py-1.5 bg-green-100 text-green-700 rounded-full text-sm font-medium">
            Published
          </span>
        )}
      </div>

      {/* Stats */}
      {finalRun && (
        <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="border border-[var(--border)] rounded-lg p-4">
            <div className="text-2xl font-bold">{finalRun.totalStudents}</div>
            <div className="text-sm text-[var(--muted-foreground)]">
              Total Students
            </div>
          </div>
          <div className="border border-[var(--border)] rounded-lg p-4">
            <div className="text-2xl font-bold text-green-600">
              {finalRun.totalAllocated}
            </div>
            <div className="text-sm text-[var(--muted-foreground)]">
              Allocated
            </div>
          </div>
          <div className="border border-[var(--border)] rounded-lg p-4">
            <div className="text-2xl font-bold text-red-600">
              {finalRun.totalUnallocated}
            </div>
            <div className="text-sm text-[var(--muted-foreground)]">
              Unallocated
            </div>
          </div>
          <div className="border border-[var(--border)] rounded-lg p-4">
            <div className="text-2xl font-bold">
              {finalRun.durationMs ? `${finalRun.durationMs}ms` : "-"}
            </div>
            <div className="text-sm text-[var(--muted-foreground)]">
              Duration
            </div>
          </div>
        </div>
      )}

      {/* Allocations table */}
      {allocations.length > 0 && (
        <div className="mt-6">
          <h2 className="text-lg font-semibold mb-3">Allocations</h2>
          <div className="border border-[var(--border)] rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-[var(--muted)]">
                <tr>
                  <th className="text-left p-3 font-medium">Rank</th>
                  <th className="text-left p-3 font-medium">Student</th>
                  <th className="text-left p-3 font-medium">Student ID</th>
                  <th className="text-left p-3 font-medium">Hospital</th>
                  <th className="text-left p-3 font-medium">Speciality</th>
                  <th className="text-left p-3 font-medium">Pref #</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]">
                {allocations.map((a) => (
                  <tr key={a.id} className="hover:bg-[var(--accent)]">
                    <td className="p-3 font-medium">
                      {a.student.academicRank}
                    </td>
                    <td className="p-3">{a.student.user.name}</td>
                    <td className="p-3 font-mono">{a.student.studentId}</td>
                    <td className="p-3">{a.placement.hospital.name}</td>
                    <td className="p-3 text-[var(--muted-foreground)]">
                      {a.placement.speciality}
                    </td>
                    <td className="p-3">
                      <span
                        className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                          a.preferenceRank === 1
                            ? "bg-green-100 text-green-700"
                            : a.preferenceRank && a.preferenceRank <= 3
                              ? "bg-blue-100 text-blue-700"
                              : "bg-gray-100 text-gray-700"
                        }`}
                      >
                        #{a.preferenceRank ?? "-"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Unallocated students */}
      {unallocatedStudents.length > 0 && (
        <div className="mt-6">
          <h2 className="text-lg font-semibold mb-3">
            Unallocated Students ({unallocatedStudents.length})
          </h2>
          <div className="border border-[var(--border)] rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-[var(--muted)]">
                <tr>
                  <th className="text-left p-3 font-medium">Rank</th>
                  <th className="text-left p-3 font-medium">Student</th>
                  <th className="text-left p-3 font-medium">Student ID</th>
                  <th className="text-left p-3 font-medium">Mark</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]">
                {unallocatedStudents.map((s) => (
                  <tr key={s.id} className="hover:bg-[var(--accent)]">
                    <td className="p-3 font-medium">
                      {s.academicRank ?? "-"}
                    </td>
                    <td className="p-3">{s.user.name}</td>
                    <td className="p-3 font-mono">{s.studentId}</td>
                    <td className="p-3">
                      {s.overallMark ? `${s.overallMark}%` : "-"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
