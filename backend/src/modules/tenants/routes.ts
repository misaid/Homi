// src/modules/tenants/routes.ts
import type { FastifyInstance } from "fastify";
import { z } from "zod";
import type { AuthContext } from "../../core/auth.js";
import { pageRange } from "../../core/supabase.js";
import { CreateTenant, ListQuery, UpdateTenant } from "./schemas.js";
import * as service from "./service.js";

export default async function routes(app: FastifyInstance) {
  // List tenants
  app.get("/", async (req, reply) => {
    const orgId = (req.auth as AuthContext | undefined)?.orgId;
    if (!orgId) return reply.code(400).send({ error: "missing org" });

    const { page, limit, q } = ListQuery.parse(req.query);
    const { from, to } = pageRange(page, limit);
    const { items, total } = await service.list(orgId, page, limit, q);

    return {
      items,
      page,
      limit,
      total,
      hasMore: total > to + 1,
    };
  });

  // Get tenant by id
  app.get<{ Params: { id: string } }>("/:id", async (req, reply) => {
    const orgId = (req.auth as AuthContext | undefined)?.orgId;
    if (!orgId) return reply.code(400).send({ error: "missing org" });
    const Id = z.object({ id: z.string().uuid() }).parse(req.params).id;
    const item = await service.get(orgId, Id);
    return item;
  });

  // Create tenant
  app.post("/", async (req, reply) => {
    const orgId = (req.auth as AuthContext | undefined)?.orgId;
    if (!orgId) return reply.code(400).send({ error: "missing org" });
    const input = CreateTenant.parse(req.body);
    const created = await service.create(orgId, input);
    return reply.code(201).send(created);
  });

  // Update tenant
  app.patch<{ Params: { id: string } }>("/:id", async (req, reply) => {
    const orgId = (req.auth as AuthContext | undefined)?.orgId;
    if (!orgId) return reply.code(400).send({ error: "missing org" });
    const Id = z.object({ id: z.string().uuid() }).parse(req.params).id;
    const input = UpdateTenant.parse(req.body);
    const updated = await service.update(orgId, Id, input);
    return updated;
  });

  // Delete tenant
  app.delete<{ Params: { id: string } }>("/:id", async (req, reply) => {
    const orgId = (req.auth as AuthContext | undefined)?.orgId;
    if (!orgId) return reply.code(400).send({ error: "missing org" });
    const Id = z.object({ id: z.string().uuid() }).parse(req.params).id;
    await service.remove(orgId, Id);
    return reply.code(204).send();
  });
}
