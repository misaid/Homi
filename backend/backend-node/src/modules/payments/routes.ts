// src/modules/payments/routes.ts
import type { FastifyInstance } from "fastify";
import type { AuthContext } from "../../core/auth.js";
import {
  ListPaymentsQuerySchema,
  PayParamsSchema,
  PaymentMethodSchema,
} from "./schemas.js";
import { listPaymentsSvc, payPaymentSvc } from "./service.js";

export default async function routes(app: FastifyInstance) {
  app.get("/", async (req, reply) => {
    const orgId = (req.auth as AuthContext | undefined)?.orgId;
    if (!orgId) return reply.code(400).send({ error: "missing org" });

    const query = ListPaymentsQuerySchema.parse(req.query);
    const result = await listPaymentsSvc(orgId, query);
    return result;
  });

  app.post<{ Params: { id: string } }>("/:id/pay", async (req, reply) => {
    const orgId = (req.auth as AuthContext | undefined)?.orgId;
    if (!orgId) return reply.code(400).send({ error: "missing org" });

    const { id } = PayParamsSchema.parse(req.params);
    // Optional method and note in body
    let method: "cash" | "transfer" | "other" | undefined;
    let note: string | null | undefined;
    if (req.body && typeof req.body === "object") {
      const maybeMethod = (req.body as any).method;
      const maybeNote = (req.body as any).note;
      if (typeof maybeMethod === "string") {
        method = PaymentMethodSchema.parse(maybeMethod);
      }
      if (typeof maybeNote === "string") note = maybeNote;
      else if (maybeNote === null) note = null;
    }

    const opts: {
      method?: "cash" | "transfer" | "other";
      note?: string | null;
    } = {};
    if (method !== undefined) opts.method = method;
    if (note !== undefined) opts.note = note;

    const payment = await payPaymentSvc(orgId, id, opts);
    return payment;
  });
}
