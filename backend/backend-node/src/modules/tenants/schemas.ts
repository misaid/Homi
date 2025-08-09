// src/modules/tenants/schemas.ts
import { z } from "zod";

// Shared list query for tenants
export const ListQuery = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
  q: z.string().trim().min(1).max(200).optional(),
});

// Create payload
export const CreateTenant = z.object({
  full_name: z.string().min(1),
  phone: z.string().trim().min(1).optional(),
  email: z.string().email().optional(),
  lease_start: z.coerce.date().optional(),
  lease_end: z.coerce.date().optional(),
  unit_id: z.string().uuid().nullable().optional(),
});

// Update payload - all optional; allow nulls to clear values
export const UpdateTenant = z.object({
  full_name: z.string().min(1).optional(),
  phone: z.string().trim().min(1).nullable().optional(),
  email: z.string().email().nullable().optional(),
  lease_start: z.coerce.date().nullable().optional(),
  lease_end: z.coerce.date().nullable().optional(),
  unit_id: z.string().uuid().nullable().optional(),
});

export type ListQueryInput = z.infer<typeof ListQuery>;
export type CreateTenantInput = z.infer<typeof CreateTenant>;
export type UpdateTenantInput = z.infer<typeof UpdateTenant>;
