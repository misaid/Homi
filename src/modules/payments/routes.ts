// fastify routes for payments module
import type { FastifyInstance } from "fastify";
import { authGuard } from "../../core/auth";
import { IdParam } from "./schemas";
import { listPaymentsSvc, payPaymentSvc } from "./service";

export default async function routes(app: FastifyInstance) {
  app.addHook("preHandler", authGuard);
  app.get("/", async (req, reply) => {
    const orgId = req.auth?.orgId;
    if (!orgId)
      return reply.code(400).send({ error: "Organization context required" });
    try {
      const result = await listPaymentsSvc(orgId, req.query);
      return result;
    } catch (err) {
      return reply.code(400).send({ error: (err as Error).message });
    }
  });

  app.post<{ Params: { id: string } }>("/:id/pay", async (req, reply) => {
    const orgId = req.auth?.orgId;
    if (!orgId)
      return reply.code(400).send({ error: "Organization context required" });
    const { id } = IdParam.parse(req.params);
    try {
      const updated = await payPaymentSvc(orgId, id);
      return updated;
    } catch (err) {
      return reply.code(400).send({ error: (err as Error).message });
    }
  });
}
