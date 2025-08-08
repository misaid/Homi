// supabase repo for payments module
import { supa } from "../../core/supabase";
import type { PaymentRow, PaymentsListQuery } from "./schemas";

const TABLE = "payments";

export async function listPayments(orgId: string, query: PaymentsListQuery) {
  const { page, limit, status, from, to } = query;
  const start = (page - 1) * limit;
  const end = start + limit - 1;

  let q = supa
    .from(TABLE)
    .select("*", { count: "exact" })
    .eq("org_id", orgId)
    .order("due_date", { ascending: true });

  if (status) q = q.eq("status", status);
  if (from) q = q.gte("due_date", from.toISOString().slice(0, 10));
  if (to) q = q.lte("due_date", to.toISOString().slice(0, 10));

  const { data, error, count } = await q.range(start, end);
  if (error) throw new Error(error.message);
  const items = (data ?? []) as PaymentRow[];
  const total = count ?? 0;
  return { items, total };
}

export async function getPaymentById(orgId: string, id: string) {
  const { data, error } = await supa
    .from(TABLE)
    .select("*")
    .eq("org_id", orgId)
    .eq("id", id)
    .single();
  if (error) throw new Error(error.message);
  return data as PaymentRow;
}

export async function markPaymentPaid(orgId: string, id: string) {
  const nowIso = new Date().toISOString();
  const { data, error } = await supa
    .from(TABLE)
    .update({ status: "paid", paid_at: nowIso })
    .eq("org_id", orgId)
    .eq("id", id)
    .select("*")
    .single();
  if (error) throw new Error(error.message);
  return data as PaymentRow;
}

export async function tenantBelongsToOrg(orgId: string, tenantId: string) {
  const { data, error } = await supa
    .from("tenants")
    .select("id")
    .eq("org_id", orgId)
    .eq("id", tenantId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return Boolean(data);
}
