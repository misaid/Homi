import { type FastifyInstance } from "fastify";
import { IdParam } from "./schemas.js";
import {
  createUnitService,
  deleteUnitService,
  getUnitService,
  listUnitsService,
  updateUnitService,
} from "./service.js";

export default async function routes(app: FastifyInstance) {
  app.get("/", async (req, reply) => {
    try {
      const orgIdStr = (req as any).auth?.orgId as string | undefined;
      if (!orgIdStr) {
        reply.code(400);
        return { error: "missing org id" };
      }
      const data = await listUnitsService(orgIdStr, req.query);
      return data;
    } catch (err: any) {
      const message = err?.message ?? "failed to list";
      reply.code(400);
      return { error: message };
    }
  });

  app.post("/", async (req, reply) => {
    try {
      const orgIdStr = (req as any).auth?.orgId as string | undefined;
      if (!orgIdStr) {
        reply.code(400);
        return { error: "missing org id" };
      }
      const created = await createUnitService(orgIdStr, req.body);
      reply.code(201);
      return created;
    } catch (err: any) {
      const message = err?.message ?? "failed to create";
      reply.code(400);
      return { error: message };
    }
  });

  app.get<{ Params: { id: string } }>("/:id", async (req, reply) => {
    try {
      const orgIdStr = (req as any).auth?.orgId as string | undefined;
      if (!orgIdStr) {
        reply.code(400);
        return { error: "missing org id" };
      }
      const parse = IdParam.safeParse({ id: req.params.id });
      if (!parse.success) {
        reply.code(400);
        return { error: "invalid id" };
      }
      const unit = await getUnitService(orgIdStr, req.params.id);
      if (!unit) {
        reply.code(404);
        return { error: "not found" };
      }
      return unit;
    } catch (err: any) {
      const message = err?.message ?? "failed to get";
      reply.code(400);
      return { error: message };
    }
  });

  app.put<{ Params: { id: string } }>("/:id", async (req, reply) => {
    try {
      const orgIdStr = (req as any).auth?.orgId as string | undefined;
      if (!orgIdStr) {
        reply.code(400);
        return { error: "missing org id" };
      }
      const parse = IdParam.safeParse({ id: req.params.id });
      if (!parse.success) {
        reply.code(400);
        return { error: "invalid id" };
      }
      const updated = await updateUnitService(
        orgIdStr,
        req.params.id,
        req.body
      );
      if (!updated) {
        reply.code(404);
        return { error: "not found" };
      }
      return updated;
    } catch (err: any) {
      const message = err?.message ?? "failed to update";
      reply.code(400);
      return { error: message };
    }
  });

  app.delete<{ Params: { id: string } }>("/:id", async (req, reply) => {
    try {
      const orgIdStr = (req as any).auth?.orgId as string | undefined;
      if (!orgIdStr) {
        reply.code(400);
        return { error: "missing org id" };
      }
      const parse = IdParam.safeParse({ id: req.params.id });
      if (!parse.success) {
        reply.code(400);
        return { error: "invalid id" };
      }
      await deleteUnitService(orgIdStr, req.params.id);
      reply.code(204);
      return null as any;
    } catch (err: any) {
      const message = err?.message ?? "failed to delete";
      reply.code(400);
      return { error: message };
    }
  });
}
