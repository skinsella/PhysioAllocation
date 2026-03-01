"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface MatchingRunInfo {
  id: string;
  status: string;
  isSimulation: boolean;
  startedAt: string;
  completedAt: string | null;
  durationMs: number | null;
  totalStudents: number | null;
  totalAllocated: number | null;
  totalUnallocated: number | null;
  tieBreakStrategy: string;
}

interface CycleInfo {
  id: string;
  name: string;
  status: string;
  tieBreakStrategy: string;
  randomSeed: number | null;
  maxPreferences: number;
}

interface MatchingPanelProps {
  cycle: CycleInfo;
  studentsWithPreferences: number;
  matchingRuns: MatchingRunInfo[];
}

export function MatchingPanel({
  cycle,
  studentsWithPreferences,
  matchingRuns,
}: MatchingPanelProps) {
  const router = useRouter();
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastResult, setLastResult] = useState<{
    matchingRunId: string;
    isSimulation: boolean;
    statistics: {
      totalStudents: number;
      totalAllocated: number;
      totalUnallocated: number;
      averagePreferenceRank: number;
      preferenceDistribution: Record<string, number>;
      durationMs: number;
    };
    unallocated: { studentId: string; reason: string }[];
  } | null>(null);

  const simulations = matchingRuns.filter((r) => r.isSimulation);
  const finalRuns = matchingRuns.filter((r) => !r.isSimulation);
  const hasFinalRun = finalRuns.length > 0;
  const canRunFinal =
    cycle.status === "PREFERENCES_CLOSED" || cycle.status === "MATCHING_RUN";
  const canSimulate =
    cycle.status === "PREFERENCES_OPEN" ||
    cycle.status === "PREFERENCES_CLOSED" ||
    cycle.status === "MATCHING_RUN";

  const runMatching = async (isSimulation: boolean) => {
    setRunning(true);
    setError(null);
    setLastResult(null);

    try {
      const res = await fetch("/api/matching", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cycleId: cycle.id, isSimulation }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Matching failed");
      }

      const result = await res.json();
      setLastResult(result);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Matching failed");
    } finally {
      setRunning(false);
    }
  };

  const statusColors: Record<string, string> = {
    PREFERENCES_OPEN: "bg-green-100 text-green-700",
    PREFERENCES_CLOSED: "bg-yellow-100 text-yellow-700",
    MATCHING_RUN: "bg-blue-100 text-blue-700",
    RESULTS_PUBLISHED: "bg-purple-100 text-purple-700",
  };

  return (
    <div className="border border-[var(--border)] rounded-lg overflow-hidden">
      {/* Header */}
      <div className="p-4 bg-[var(--muted)] flex items-center justify-between">
        <div>
          <h2 className="font-semibold text-lg">{cycle.name}</h2>
          <div className="flex items-center gap-3 mt-1 text-sm text-[var(--muted-foreground)]">
            <span
              className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                statusColors[cycle.status] || "bg-gray-100 text-gray-700"
              }`}
            >
              {cycle.status.replace(/_/g, " ")}
            </span>
            <span>{studentsWithPreferences} students submitted preferences</span>
            <span>Tie-break: {cycle.tieBreakStrategy.replace(/_/g, " ")}</span>
          </div>
        </div>
        <div className="flex gap-2">
          {canSimulate && (
            <button
              onClick={() => runMatching(true)}
              disabled={running}
              className="px-4 py-2 text-sm font-medium rounded-md border border-[var(--border)] hover:bg-[var(--accent)] disabled:opacity-50"
            >
              {running ? "Running..." : "Run Simulation"}
            </button>
          )}
          {canRunFinal && (
            <button
              onClick={() => runMatching(false)}
              disabled={running}
              className="px-4 py-2 text-sm font-medium rounded-md bg-[var(--primary)] text-[var(--primary-foreground)] hover:opacity-90 disabled:opacity-50"
            >
              {running ? "Running..." : "Run Final Matching"}
            </button>
          )}
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="p-3 bg-red-50 text-red-700 text-sm border-b border-red-200">
          {error}
        </div>
      )}

      {/* Last result */}
      {lastResult && (
        <div className="p-4 bg-green-50 border-b border-green-200">
          <h3 className="font-medium text-green-800 mb-2">
            {lastResult.isSimulation ? "Simulation" : "Final Matching"} Complete
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
            <div>
              <div className="text-green-600 font-medium">
                {lastResult.statistics.totalStudents}
              </div>
              <div className="text-green-700/70">Total Students</div>
            </div>
            <div>
              <div className="text-green-600 font-medium">
                {lastResult.statistics.totalAllocated}
              </div>
              <div className="text-green-700/70">Allocated</div>
            </div>
            <div>
              <div className="text-green-600 font-medium">
                {lastResult.statistics.totalUnallocated}
              </div>
              <div className="text-green-700/70">Unallocated</div>
            </div>
            <div>
              <div className="text-green-600 font-medium">
                {lastResult.statistics.averagePreferenceRank.toFixed(1)}
              </div>
              <div className="text-green-700/70">Avg Preference</div>
            </div>
          </div>
          {/* Preference distribution */}
          {Object.keys(lastResult.statistics.preferenceDistribution).length >
            0 && (
            <div className="mt-3">
              <div className="text-xs font-medium text-green-700 mb-1">
                Preference Distribution
              </div>
              <div className="flex gap-2 flex-wrap">
                {Object.entries(lastResult.statistics.preferenceDistribution)
                  .sort(([a], [b]) => Number(a) - Number(b))
                  .map(([rank, count]) => (
                    <span
                      key={rank}
                      className="px-2 py-0.5 bg-green-100 text-green-700 rounded text-xs"
                    >
                      #{rank}: {count}
                    </span>
                  ))}
              </div>
            </div>
          )}
          {lastResult.statistics.durationMs && (
            <div className="mt-2 text-xs text-green-700/70">
              Completed in {lastResult.statistics.durationMs.toFixed(0)}ms
            </div>
          )}
        </div>
      )}

      {/* Previous runs */}
      {matchingRuns.length > 0 && (
        <div className="p-4">
          <h3 className="font-medium text-sm mb-3">Previous Runs</h3>
          <div className="space-y-2">
            {matchingRuns.map((run) => (
              <div
                key={run.id}
                className="flex items-center justify-between p-3 bg-[var(--muted)] rounded-lg text-sm"
              >
                <div className="flex items-center gap-3">
                  <span
                    className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                      run.isSimulation
                        ? "bg-orange-100 text-orange-700"
                        : "bg-blue-100 text-blue-700"
                    }`}
                  >
                    {run.isSimulation ? "Simulation" : "Final"}
                  </span>
                  <span className="text-[var(--muted-foreground)]">
                    {new Date(run.startedAt).toLocaleString("en-IE")}
                  </span>
                </div>
                <div className="flex items-center gap-4 text-[var(--muted-foreground)]">
                  <span>
                    {run.totalAllocated}/{run.totalStudents} allocated
                  </span>
                  {run.durationMs && <span>{run.durationMs}ms</span>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
