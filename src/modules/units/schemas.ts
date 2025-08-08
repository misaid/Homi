import { z } from "zod";

export const IdParam = z.object({ id: z.string().uuid() });

export const ListQuery = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  q: z.string().min(1).max(200).optional(),
});

export const CreateUnit = z.object({
  name: z.string().min(1).max(255),
  address: z.string().min(1).max(1000),
  monthly_rent: z.coerce.number(),
  notes: z.string().max(5000).nullable().optional(),
  cover_image_uri: z.string().max(2000).nullable().optional(),
});

export const UpdateUnit = z
  .object({
    name: z.string().min(1).max(255).optional(),
    address: z.string().min(1).max(1000).optional(),
    monthly_rent: z.coerce.number().optional(),
    notes: z.string().max(5000).nullable().optional(),
    cover_image_uri: z.string().max(2000).nullable().optional(),
  })
  .refine((v) => Object.keys(v).length > 0, {
    message: "no fields to update",
  });

export type ListQueryInput = z.infer<typeof ListQuery>;
export type CreateUnitInput = z.infer<typeof CreateUnit>;
export type UpdateUnitInput = z.infer<typeof UpdateUnit>;

export type Unit = {
  id: string;
  org_id: string;
  name: string;
  address: string;
  monthly_rent: number;
  notes: string | null;
  cover_image_uri: string | null;
  created_at: string;
};
