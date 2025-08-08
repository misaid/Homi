// supabase repo for Tenants module
import {
  deleteWithOrg,
  insertWithOrg,
  pageRange,
  selectOrg,
  supa,
  updateWithOrg,
} from "../../core/supabase";
import type { ListQueryInput, Tenant } from "./schemas";

const TABLE = "tenants";

export async function listTenants(orgId: string, query: ListQueryInput) {
  const { page, limit, q } = query;
  const { from, to } = pageRange(page, limit);

  if (q && q.trim()) {
    // Use text search across common fields; fallback to ilike on full_name/email/phone
    const like = `%${q.trim()}%`;
    const { data, error, count } = await supa
      .from(TABLE)
      .select("*", { count: "exact" })
      .eq("org_id", orgId)
      .or(
        [
          `full_name.ilike.${like}`,
          `email.ilike.${like}`,
          `phone.ilike.${like}`,
        ].join(",")
      )
      .range(from, to);
    if (error) throw new Error(error.message);
    return { items: (data ?? []) as Tenant[], total: count ?? 0, page, limit };
  }

  const { items, total } = await selectOrg<Tenant>(TABLE, orgId, from, to);
  return { items, total, page, limit };
}

export async function getTenant(orgId: string, id: string) {
  const { data, error } = await supa
    .from(TABLE)
    .select("*")
    .eq("id", id)
    .eq("org_id", orgId)
    .single();
  if (error) throw new Error(error.message);
  return data as Tenant;
}

export async function createTenant(
  orgId: string,
  values: Record<string, unknown>
) {
  const created = await insertWithOrg<Tenant>(TABLE, orgId, values);
  return created;
}

export async function updateTenant(
  orgId: string,
  id: string,
  values: Record<string, unknown>
) {
  const updated = await updateWithOrg<Tenant>(TABLE, orgId, id, values);
  return updated;
}

export async function deleteTenant(orgId: string, id: string) {
  await deleteWithOrg(TABLE, orgId, id);
}

export async function assertUnitBelongsToOrg(orgId: string, unitId: string) {
  const { data, error } = await supa
    .from("units")
    .select("id")
    .eq("id", unitId)
    .eq("org_id", orgId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) throw new Error("unit not found in org");
}
