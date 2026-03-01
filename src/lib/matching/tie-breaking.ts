import type { MatchingConfig, StudentForMatching } from "./types";

/**
 * Seeded PRNG (mulberry32) for deterministic random tie-breaking.
 */
function seededRandom(seed: number): () => number {
  return function () {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function sortStudentsWithTieBreaking(
  students: StudentForMatching[],
  config: MatchingConfig
): StudentForMatching[] {
  const rng =
    config.randomSeed !== undefined ? seededRandom(config.randomSeed) : undefined;

  // Pre-assign random values in deterministic order
  const randomValues = new Map<string, number>();
  if (rng) {
    const sortedById = [...students].sort((a, b) =>
      a.id.localeCompare(b.id)
    );
    for (const s of sortedById) {
      randomValues.set(s.id, rng());
    }
  }

  return [...students].sort((a, b) => {
    // Primary: academic rank ascending (1 = best = goes first)
    if (a.academicRank !== b.academicRank) {
      return a.academicRank - b.academicRank;
    }

    // Tie-breaking
    switch (config.tieBreakStrategy) {
      case "RANDOM_SEED": {
        const ra = randomValues.get(a.id) ?? 0;
        const rb = randomValues.get(b.id) ?? 0;
        return ra - rb;
      }
      case "INSTITUTION_PRIORITY": {
        const priorities = config.institutionPriority ?? [];
        const ia = priorities.indexOf(a.institution ?? "");
        const ib = priorities.indexOf(b.institution ?? "");
        const pa = ia === -1 ? priorities.length : ia;
        const pb = ib === -1 ? priorities.length : ib;
        if (pa !== pb) return pa - pb;
        return a.studentId.localeCompare(b.studentId);
      }
      case "ADDITIONAL_SCORE": {
        const sa = a.additionalScore ?? 0;
        const sb = b.additionalScore ?? 0;
        if (sa !== sb) return sb - sa; // Higher score = higher priority
        return a.studentId.localeCompare(b.studentId);
      }
      case "ALPHABETICAL":
      default:
        return a.studentId.localeCompare(b.studentId);
    }
  });
}
