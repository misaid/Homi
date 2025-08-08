import { z } from "zod";

// Shared model type for Units as stored in Supabase
export const UnitModel = z.object({
  id: z.string().uuid(),
  org_id: z.string().uuid(),
  name: z.string(),
  address: z.string(),
  monthly_rent: z.number(),
  notes: z.string().nullable().optional(),
  cover_image_uri: z.string().nullable().optional(),
  created_at: z.string(), // ISO timestamp
});
export type Unit = z.infer<typeof UnitModel>;

export const CreateUnit = z.object({
  name: z.string().min(1).max(200),
  address: z.string().min(1).max(500),
  monthly_rent: z.coerce.number().finite(),
  notes: z.string().trim().min(1).max(2000).optional(),
  cover_image_uri: z.string().url().optional(),
});
export type CreateUnitInput = z.infer<typeof CreateUnit>;

export const UpdateUnit = z
  .object({
    name: z.string().min(1).max(200).optional(),
    address: z.string().min(1).max(500).optional(),
    monthly_rent: z.coerce.number().finite().optional(),
    notes: z
      .string()
      .trim()
      .min(1)
      .max(2000)
      .optional()
      .or(z.literal(""))
      .optional(),
    cover_image_uri: z.string().url().optional().or(z.literal("")).optional(),
  })
  .refine((v) => Object.keys(v).length > 0, {
    message: "At least one field must be provided",
    path: ["_"],
  });
export type UpdateUnitInput = z.infer<typeof UpdateUnit>;

export const ListQuery = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
  q: z.string().trim().min(1).max(200).optional(),
});
export type ListQueryInput = z.infer<typeof ListQuery>;
