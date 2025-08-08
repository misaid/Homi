// src/modules/units/routes.ts
import type { FastifyInstance } from "fastify";
import { requireOrg } from "../../core/auth.js";
import * as svc from "./service.js";
import { ListQuery, CreateUnit, UpdateUnit } from "./schemas.js";

export default async function routes(app: FastifyInstance) {
  // List
  app.get("/", async (req, reply) => {
    const need = requireOrg(req, reply);
    if (need) return; // requireOrg already sent error
    const orgId = req.auth!.orgId!;
    try {
      const result = await svc.list(orgId, req.query);
      return result;
    } catch (err) {
      const message = (err as Error).message || "Failed to list units";
      return reply.code(400).send({ error: message });
    }
  });

  // Create
  app.post("/", async (req, reply) => {
    const need = requireOrg(req, reply);
    if (need) return;
    const orgId = req.auth!.orgId!;
    try {
      // Validate early for clearer 400s
      CreateUnit.parse(req.body);
      const unit = await svc.create(orgId, req.body);
      return reply.code(201).send(unit);
    } catch (err) {
      const message = (err as Error).message || "Failed to create unit";
      return reply.code(400).send({ error: message });
    }
  });

  // Get by id
  app.get("/:id", async (req, reply) => {
    const need = requireOrg(req, reply);
    if (need) return;
    const orgId = req.auth!.orgId!;
    const id = (req.params as any).id as string;
    try {
      const unit = await svc.get(orgId, id);
      return unit;
    } catch (err) {
      const message = (err as Error).message;
      if (
        message?.toLowerCase().includes("row not found") ||
        message?.toLowerCase().includes("no rows")
      ) {
        return reply.code(404).send({ error: "Not found" });
      }
      return reply.code(400).send({ error: message || "Failed to fetch unit" });
    }
  });

  // Update
  app.put("/:id", async (req, reply) => {
    const need = requireOrg(req, reply);
    if (need) return;
    const orgId = req.auth!.orgId!;
    const id = (req.params as any).id as string;
    try {
      UpdateUnit.parse(req.body);
      const unit = await svc.update(orgId, id, req.body);
      return unit;
    } catch (err) {
      const message = (err as Error).message;
      if (
        message?.toLowerCase().includes("row not found") ||
        message?.toLowerCase().includes("no rows")
      ) {
        return reply.code(404).send({ error: "Not found" });
      }
      return reply
        .code(400)
        .send({ error: message || "Failed to update unit" });
    }
  });

  // Delete
  app.delete("/:id", async (req, reply) => {
    const need = requireOrg(req, reply);
    if (need) return;
    const orgId = req.auth!.orgId!;
    const id = (req.params as any).id as string;
    try {
      await svc.remove(orgId, id);
      return reply.code(204).send();
    } catch (err) {
      const message = (err as Error).message;
      if (
        message?.toLowerCase().includes("row not found") ||
        message?.toLowerCase().includes("no rows")
      ) {
        return reply.code(404).send({ error: "Not found" });
      }
      return reply
        .code(400)
        .send({ error: message || "Failed to delete unit" });
    }
  });
}
