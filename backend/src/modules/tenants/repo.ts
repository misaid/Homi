// src/modules/tenants/repo.ts
import {
  supa,
  pageRange,
  selectOrg,
  insertWithOrg,
  updateWithOrg,
  deleteWithOrg,
} from "../../core/supabase.js";

export type Tenant = {
  id: string;
  org_id: string;
  full_name: string;
  phone?: string | null;
  email?: string | null;
  lease_start?: string | null; // ISO date
  lease_end?: string | null; // ISO date
  unit_id?: string | null;
  created_at?: string;
};

export async function listTenants(
  orgId: string,
  page: number,
  limit: number,
  q?: string
) {
  const { from, to } = pageRange(page, limit);
  let query = supa
    .from("tenants")
    .select("*", { count: "exact" })
    .eq("org_id", orgId);
  if (q && q.trim().length > 0) {
    const like = `%${q.trim()}%`;
    query = query.or(
      [
        `full_name.ilike.${like}`,
        `phone.ilike.${like}`,
        `email.ilike.${like}`,
      ].join(",")
    );
  }
  const { data, error, count } = await query.range(from, to);
  if (error) throw new Error(error.message);
  return { items: (data || []) as Tenant[], total: count ?? 0 };
}

export async function getTenant(orgId: string, id: string) {
  const { data, error } = await supa
    .from("tenants")
    .select("*")
    .eq("id", id)
    .eq("org_id", orgId)
    .single();
  if (error) throw new Error(error.message);
  return data as Tenant;
}

export async function createTenant(orgId: string, values: Partial<Tenant>) {
  const created = await insertWithOrg<Tenant>("tenants", orgId, values);
  return created;
}

export async function updateTenant(
  orgId: string,
  id: string,
  values: Partial<Tenant>
) {
  const updated = await updateWithOrg<Tenant>("tenants", orgId, id, values);
  return updated;
}

export async function deleteTenant(orgId: string, id: string) {
  await deleteWithOrg("tenants", orgId, id);
}

export async function unitBelongsToOrg(orgId: string, unitId: string) {
  const { data, error, count } = await supa
    .from("units")
    .select("id", { count: "exact" })
    .eq("id", unitId)
    .eq("org_id", orgId)
    .limit(1);
  if (error) throw new Error(error.message);
  return (count ?? 0) > 0 && Array.isArray(data) && data.length > 0;
}
