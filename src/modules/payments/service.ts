// service layer for payments module
import {
  getPaymentById,
  listPayments,
  markPaymentPaid,
  tenantBelongsToOrg,
} from "./repo";
import { PaymentRow, PaymentsListQuery } from "./schemas";

export type Paginated<T> = {
  items: T[];
  page: number;
  limit: number;
  total: number;
  hasMore: boolean;
};

export async function listPaymentsSvc(
  orgId: string,
  rawQuery: unknown
): Promise<Paginated<PaymentRow>> {
  const parsed = PaymentsListQuery.parse(rawQuery);
  const { items, total } = await listPayments(orgId, parsed);
  const { page, limit } = parsed;
  const hasMore = total > page * limit;
  return { items, page, limit, total, hasMore };
}

export async function payPaymentSvc(orgId: string, id: string) {
  const payment = await getPaymentById(orgId, id);
  const belongs = await tenantBelongsToOrg(orgId, payment.tenant_id);
  if (!belongs) throw new Error("tenant not in org");
  if (payment.status === "paid") return payment;
  const updated = await markPaymentPaid(orgId, id);
  return updated;
}
