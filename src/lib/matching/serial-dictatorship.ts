import type {
  MatchingInput,
  MatchingOutput,
  AllocationResult,
  UnallocatedStudent,
  MatchingLogEntry,
  PreferenceForMatching,
} from "./types";
import { sortStudentsWithTieBreaking } from "./tie-breaking";

/**
 * Serial Dictatorship Matching Algorithm
 *
 * PURE FUNCTION - no side effects, fully deterministic for same inputs.
 *
 * 1. Sort students by academic rank (ascending = best first)
 * 2. Apply tie-breaking for students with equal rank
 * 3. For each student in order:
 *    a. Look up their preference list (sorted by rank)
 *    b. Iterate through preferences
 *    c. If placement has remaining capacity, assign student
 *    d. If no placement available, mark as unallocated
 * 4. Return all allocations, unallocated list, stats, and full log
 */
export function runSerialDictatorship(input: MatchingInput): MatchingOutput {
  const startTime = performance.now();
  const log: MatchingLogEntry[] = [];
  const allocations: AllocationResult[] = [];
  const unallocated: UnallocatedStudent[] = [];

  // Build capacity tracker
  const remainingCapacity = new Map<string, number>();
  for (const p of input.placements) {
    remainingCapacity.set(p.id, p.capacity);
  }

  // Build preference lookup
  const preferenceMap = new Map<string, PreferenceForMatching[]>();
  for (const pref of input.preferences) {
    if (!preferenceMap.has(pref.studentId)) {
      preferenceMap.set(pref.studentId, []);
    }
    preferenceMap.get(pref.studentId)!.push(pref);
  }
  for (const [, prefs] of preferenceMap) {
    prefs.sort((a, b) => a.rank - b.rank);
  }

  // Sort students with tie-breaking
  const orderedStudents = sortStudentsWithTieBreaking(
    input.students,
    input.config
  );

  // Iterate and assign
  let step = 0;
  for (const student of orderedStudents) {
    step++;
    const prefs = preferenceMap.get(student.id) || [];

    if (prefs.length === 0) {
      unallocated.push({
        studentId: student.id,
        reason: "No preferences submitted",
      });
      log.push({
        step,
        studentId: student.id,
        action: "NO_PREFERENCES",
        message: `Student ${student.studentId} has no preferences`,
      });
      continue;
    }

    let allocated = false;
    for (const pref of prefs) {
      const remaining = remainingCapacity.get(pref.placementId) ?? 0;
      if (remaining > 0) {
        remainingCapacity.set(pref.placementId, remaining - 1);
        allocations.push({
          studentId: student.id,
          placementId: pref.placementId,
          preferenceRank: pref.rank,
          processingOrder: step,
        });
        log.push({
          step,
          studentId: student.id,
          action: "ALLOCATED",
          placementId: pref.placementId,
          preferenceRank: pref.rank,
          message: `Student ${student.studentId} allocated to placement ${pref.placementId} (preference #${pref.rank})`,
        });
        allocated = true;
        break;
      } else {
        log.push({
          step,
          studentId: student.id,
          action: "SKIPPED_FULL",
          placementId: pref.placementId,
          preferenceRank: pref.rank,
          message: `Student ${student.studentId} preference #${pref.rank} full, trying next`,
        });
      }
    }

    if (!allocated) {
      unallocated.push({
        studentId: student.id,
        reason: "All preferred placements at capacity",
      });
      log.push({
        step,
        studentId: student.id,
        action: "ALL_FULL",
        message: `Student ${student.studentId} could not be allocated (all preferences full)`,
      });
    }
  }

  // Compute statistics
  const durationMs = performance.now() - startTime;
  const preferenceDistribution: Record<number, number> = {};
  for (const a of allocations) {
    preferenceDistribution[a.preferenceRank] =
      (preferenceDistribution[a.preferenceRank] || 0) + 1;
  }

  const fillRates: Record<string, { filled: number; capacity: number }> = {};
  for (const p of input.placements) {
    fillRates[p.id] = {
      capacity: p.capacity,
      filled: p.capacity - (remainingCapacity.get(p.id) ?? 0),
    };
  }

  return {
    allocations,
    unallocated,
    statistics: {
      totalStudents: input.students.length,
      totalAllocated: allocations.length,
      totalUnallocated: unallocated.length,
      averagePreferenceRank:
        allocations.length > 0
          ? allocations.reduce((sum, a) => sum + a.preferenceRank, 0) /
            allocations.length
          : 0,
      preferenceDistribution,
      fillRates,
      durationMs,
    },
    log,
  };
}
