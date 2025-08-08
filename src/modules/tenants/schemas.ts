// zod schemas for Tenants module
import { z } from "zod";

export const IdParam = z.object({ id: z.string().uuid() });

export const ListQuery = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  q: z.string().trim().min(1).optional(),
});

export type ListQueryInput = z.infer<typeof ListQuery>;

const BaseTenant = z.object({
  full_name: z.string().trim().min(1),
  phone: z.string().trim().min(1).optional(),
  email: z.string().email().optional(),
  lease_start: z.string().datetime().optional(),
  lease_end: z.string().datetime().optional(),
  // nullable unit_id; can be omitted or explicitly null
  unit_id: z.string().uuid().nullable().optional(),
});

export const CreateTenant = BaseTenant;
export type CreateTenantInput = z.infer<typeof CreateTenant>;

export const UpdateTenant = BaseTenant.partial();
export type UpdateTenantInput = z.infer<typeof UpdateTenant>;

// DB shape helper (for reference/use in repo if desired)
export const TenantRecord = z.object({
  id: z.string().uuid(),
  org_id: z.string().uuid(),
  full_name: z.string(),
  phone: z.string().nullable().optional(),
  email: z.string().nullable().optional(),
  lease_start: z.string().nullable().optional(),
  lease_end: z.string().nullable().optional(),
  unit_id: z.string().uuid().nullable(),
});
export type Tenant = z.infer<typeof TenantRecord>;
