// Tenants routes
import type { FastifyInstance } from "fastify";
import { getAuth } from "../../core/auth";
import { IdParam } from "./schemas";
import * as service from "./service";

export default async function routes(app: FastifyInstance) {
  // List tenants with pagination and optional search query `q`
  app.get("/", async (req, reply) => {
    const orgId = getAuth(req)?.orgId;
    if (!orgId)
      return reply.code(400).send({ error: "Organization context required" });
    const result = await service.list(orgId, req.query);
    const { items, total, page, limit } = result;
    const to = (page - 1) * limit + limit - 1;
    return {
      items,
      page,
      limit,
      total,
      hasMore: total > to + 1,
    };
  });

  // Get one tenant by id
  app.get<{
    Params: { id: string };
  }>("/:id", async (req, reply) => {
    const orgId = getAuth(req)?.orgId;
    if (!orgId)
      return reply.code(400).send({ error: "Organization context required" });
    const { id } = IdParam.parse(req.params);
    const item = await service.get(orgId, id);
    return item;
  });

  // Create tenant
  app.post("/", async (req, reply) => {
    const orgId = getAuth(req)?.orgId;
    if (!orgId)
      return reply.code(400).send({ error: "Organization context required" });
    const created = await service.create(orgId, req.body);
    return created;
  });

  // Update tenant
  app.patch<{
    Params: { id: string };
  }>("/:id", async (req, reply) => {
    const orgId = getAuth(req)?.orgId;
    if (!orgId)
      return reply.code(400).send({ error: "Organization context required" });
    const { id } = IdParam.parse(req.params);
    const updated = await service.update(orgId, id, req.body);
    return updated;
  });

  // Delete tenant
  app.delete<{
    Params: { id: string };
  }>("/:id", async (req, reply) => {
    const orgId = getAuth(req)?.orgId;
    if (!orgId)
      return reply.code(400).send({ error: "Organization context required" });
    const { id } = IdParam.parse(req.params);
    await service.remove(orgId, id);
    return { ok: true } as const;
  });
}
