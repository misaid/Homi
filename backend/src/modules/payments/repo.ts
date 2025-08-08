// src/modules/payments/repo.ts
import { supa } from "../../core/supabase.js";
import type { ListPaymentsQuery, Payment } from "./schemas.js";

const TABLE = "payments";

export async function listPayments(orgId: string, query: ListPaymentsQuery) {
  const { page, limit, status, from, to } = query;
  const start = (page - 1) * limit;
  const end = start + limit - 1;

  let builder = supa
    .from(TABLE)
    .select("*", { count: "exact" })
    .eq("org_id", orgId);

  if (status) builder = builder.eq("status", status);
  if (from) builder = builder.gte("due_date", from);
  if (to) builder = builder.lte("due_date", to);

  const { data, error, count } = await builder
    .order("due_date", { ascending: true, nullsFirst: false })
    .range(start, end);

  if (error) throw new Error(error.message);
  const items = (data ?? []) as Payment[];
  const total = count ?? 0;
  const hasMore = total > end + 1;
  return { items, page, limit, total, hasMore };
}

export async function getPaymentById(orgId: string, id: string) {
  const { data, error } = await supa
    .from(TABLE)
    .select("*")
    .eq("id", id)
    .eq("org_id", orgId)
    .single();
  if (error) throw new Error(error.message);
  return data as Payment;
}

export async function markPaymentPaid(
  orgId: string,
  id: string,
  method?: Payment["method"],
  note?: string | null
) {
  const payload: Partial<Payment> = {
    status: "paid",
    paid_at: new Date().toISOString(),
  } as Partial<Payment>;
  if (method) (payload as any).method = method;
  if (typeof note !== "undefined") (payload as any).note = note;

  const { data, error } = await supa
    .from(TABLE)
    .update(payload)
    .eq("id", id)
    .eq("org_id", orgId)
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data as Payment;
}
