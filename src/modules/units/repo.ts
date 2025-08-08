import { supa } from "../../core/supabase.js";
import type { CreateUnitInput, Unit, UpdateUnitInput } from "./schemas.js";

export async function listUnits(
  orgId: string,
  page: number,
  limit: number,
  q?: string
) {
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  let query = supa
    .from("units")
    .select("*", { count: "exact" })
    .eq("org_id", orgId)
    .order("created_at", { ascending: false })
    .range(from, to);

  if (q && q.length > 0) {
    query = query.ilike("name", `%${q}%`);
  }

  const { data, error, count } = await query;
  if (error) throw error;
  return { items: data as Unit[], total: count ?? 0 };
}

export async function getUnitById(orgId: string, id: string) {
  const { data, error } = await supa
    .from("units")
    .select("*")
    .eq("org_id", orgId)
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  return data as Unit | null;
}

export async function createUnit(orgId: string, input: CreateUnitInput) {
  const toInsert = { ...input, org_id: orgId };
  const { data, error } = await supa
    .from("units")
    .insert(toInsert)
    .select("*")
    .single();
  if (error) throw error;
  return data as Unit;
}

export async function updateUnit(
  orgId: string,
  id: string,
  input: UpdateUnitInput
) {
  const { data, error } = await supa
    .from("units")
    .update(input)
    .eq("org_id", orgId)
    .eq("id", id)
    .select("*")
    .maybeSingle();
  if (error) throw error;
  return data as Unit | null;
}

export async function deleteUnit(orgId: string, id: string) {
  const { error } = await supa
    .from("units")
    .delete()
    .eq("org_id", orgId)
    .eq("id", id);
  if (error) throw error;
}
