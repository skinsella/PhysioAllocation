export interface MatchingInput {
  students: StudentForMatching[];
  placements: PlacementForMatching[];
  preferences: PreferenceForMatching[];
  config: MatchingConfig;
}

export interface StudentForMatching {
  id: string;
  studentId: string;
  academicRank: number;
  overallMark: number;
  additionalScore?: number;
  institution?: string;
  name: string;
}

export interface PlacementForMatching {
  id: string;
  hospitalName: string;
  speciality: string;
  capacity: number;
}

export interface PreferenceForMatching {
  studentId: string;
  placementId: string;
  rank: number;
}

export interface MatchingConfig {
  tieBreakStrategy:
    | "RANDOM_SEED"
    | "INSTITUTION_PRIORITY"
    | "ADDITIONAL_SCORE"
    | "ALPHABETICAL";
  randomSeed?: number;
  institutionPriority?: string[];
}

export interface MatchingOutput {
  allocations: AllocationResult[];
  unallocated: UnallocatedStudent[];
  statistics: MatchingStatistics;
  log: MatchingLogEntry[];
}

export interface AllocationResult {
  studentId: string;
  placementId: string;
  preferenceRank: number;
  processingOrder: number;
}

export interface UnallocatedStudent {
  studentId: string;
  reason: string;
}

export interface MatchingStatistics {
  totalStudents: number;
  totalAllocated: number;
  totalUnallocated: number;
  averagePreferenceRank: number;
  preferenceDistribution: Record<number, number>;
  fillRates: Record<string, { filled: number; capacity: number }>;
  durationMs: number;
}

export interface MatchingLogEntry {
  step: number;
  studentId: string;
  action: "ALLOCATED" | "SKIPPED_FULL" | "NO_PREFERENCES" | "ALL_FULL";
  placementId?: string;
  preferenceRank?: number;
  message: string;
}
