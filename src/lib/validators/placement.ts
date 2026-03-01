import { z } from "zod/v4";

export const createHospitalSchema = z.object({
  name: z.string().min(1, "Hospital name is required"),
  address: z.string().optional(),
  city: z.string().optional(),
  county: z.string().optional(),
  contactName: z.string().optional(),
  contactEmail: z.email().optional(),
  contactPhone: z.string().optional(),
});

export const createPlacementSchema = z.object({
  hospitalId: z.string().min(1, "Hospital is required"),
  cycleId: z.string().min(1, "Cycle is required"),
  speciality: z.string().min(1, "Speciality is required"),
  capacity: z.number().int().min(1, "Capacity must be at least 1"),
  startDate: z.string().min(1, "Start date is required"),
  endDate: z.string().min(1, "End date is required"),
  description: z.string().optional(),
  location: z.string().optional(),
  supervisorName: z.string().optional(),
});

export const updatePlacementSchema = createPlacementSchema.partial();
