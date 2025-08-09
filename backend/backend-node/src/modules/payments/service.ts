// src/modules/payments/service.ts
import { supa } from "../../core/supabase.js";
import type { ListPaymentsQuery, Payment } from "./schemas.js";
import { getPaymentById, listPayments, markPaymentPaid } from "./repo.js";

async function assertTenantBelongsToOrg(tenantId: string, orgId: string) {
  const { data, error } = await supa
    .from("tenants")
    .select("id")
    .eq("id", tenantId)
    .eq("org_id", orgId)
    .single();
  if (error || !data) {
    const message = error?.message || "Tenant not found in organization";
    const err = new Error(message);
    (err as any).statusCode = 404;
    throw err;
  }
}

export async function listPaymentsSvc(orgId: string, query: ListPaymentsQuery) {
  return listPayments(orgId, query);
}

export async function payPaymentSvc(
  orgId: string,
  id: string,
  opts?: { method?: Payment["method"]; note?: string | null }
) {
  const payment = await getPaymentById(orgId, id);
  await assertTenantBelongsToOrg(payment.tenant_id, orgId);
  if (payment.status === "paid") return payment;
  return markPaymentPaid(orgId, id, opts?.method, opts?.note ?? null);
}
