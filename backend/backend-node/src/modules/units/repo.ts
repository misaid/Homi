import { supa, pageRange } from "../../core/supabase.js";
import type { ListQueryInput, Unit } from "./schemas.js";

const TABLE = "units" as const;

export async function listUnits(orgId: string, query: ListQueryInput) {
  const { page, limit, q } = query;
  const { from, to } = pageRange(page, limit);

  let builder = supa
    .from(TABLE)
    .select("*", { count: "exact" })
    .eq("org_id", orgId)
    .range(from, to);

  if (q) {
    // name ilike filter
    builder = builder.ilike("name", `%${q}%`);
  }

  const { data, error, count } = await builder;
  if (error) throw new Error(error.message);
  const items = (data ?? []) as Unit[];
  const total = count ?? 0;
  return {
    items,
    page,
    limit,
    total,
    hasMore: total > to + 1,
  };
}

export async function getUnitById(orgId: string, id: string) {
  const { data, error } = await supa
    .from(TABLE)
    .select("*")
    .eq("id", id)
    .eq("org_id", orgId)
    .single();
  if (error) throw new Error(error.message);
  return data as Unit;
}

export async function createUnit(
  orgId: string,
  values: Omit<Unit, "id" | "org_id" | "created_at">
) {
  const payload = { ...values, org_id: orgId } as Record<string, unknown>;
  const { data, error } = await supa
    .from(TABLE)
    .insert(payload)
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data as Unit;
}

export async function updateUnit(
  orgId: string,
  id: string,
  values: Record<string, unknown>
) {
  const { data, error } = await supa
    .from(TABLE)
    .update(values)
    .eq("id", id)
    .eq("org_id", orgId)
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data as Unit;
}

export async function deleteUnit(orgId: string, id: string) {
  const { error } = await supa
    .from(TABLE)
    .delete()
    .eq("id", id)
    .eq("org_id", orgId);
  if (error) throw new Error(error.message);
}
