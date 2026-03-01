import { z } from "zod/v4";

export const createCycleSchema = z.object({
  name: z.string().min(1, "Name is required"),
  academicYear: z.string().min(1, "Academic year is required"),
  tieBreakStrategy: z.enum([
    "RANDOM_SEED",
    "INSTITUTION_PRIORITY",
    "ADDITIONAL_SCORE",
    "ALPHABETICAL",
  ]),
  randomSeed: z.number().int().optional(),
  maxPreferences: z.number().int().min(1).max(50).default(10),
  preferencesOpenDate: z.string().optional(),
  preferencesCloseDate: z.string().optional(),
});

export const updateCycleSchema = createCycleSchema.partial().extend({
  status: z
    .enum([
      "DRAFT",
      "PREFERENCES_OPEN",
      "PREFERENCES_CLOSED",
      "MATCHING_RUN",
      "RESULTS_PUBLISHED",
      "ARCHIVED",
    ])
    .optional(),
});
