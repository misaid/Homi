// src/modules/units/routes.ts
import multipart, { type MultipartFile } from "@fastify/multipart";
import type { FastifyInstance } from "fastify";
import { randomUUID } from "node:crypto";
import path from "node:path";
import { requireOrg } from "../../core/auth.js";
import { buckets, getPublicUrl, uploadToBucket } from "../../core/supabase.js";
import { CreateUnit, UpdateUnit } from "./schemas.js";
import * as svc from "./service.js";

export default async function routes(app: FastifyInstance) {
  // Support multipart form-data for create/update with optional single image
  await app.register(multipart, {
    limits: {
      fileSize: 5 * 1024 * 1024,
      files: 1,
      fields: 50,
      headerPairs: 2000,
    },
  });

  const ALLOWED_MIME = new Set(["image/jpeg", "image/png", "image/webp"]);

  async function streamToBuffer(file: MultipartFile["file"], maxBytes: number) {
    let total = 0;
    const chunks: Buffer[] = [];
    for await (const chunk of file) {
      const buf = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk as any);
      total += buf.length;
      if (total > maxBytes) {
        const err = new Error("File too large");
        (err as any).statusCode = 413;
        throw err;
      }
      chunks.push(buf);
    }
    return Buffer.concat(chunks);
  }

  function mimeToExt(mime: string | undefined): string {
    if (!mime) return "";
    switch (mime.toLowerCase()) {
      case "image/png":
        return ".png";
      case "image/jpeg":
        return ".jpg";
      case "image/webp":
        return ".webp";
      default:
        return "";
    }
  }

  async function parseMaybeMultipart(
    req: any
  ): Promise<Record<string, unknown>> {
    const contentType = String(req.headers["content-type"] || "").toLowerCase();
    const isMultipart = contentType.includes("multipart/form-data");
    if (!isMultipart) {
      return (req.body ?? {}) as Record<string, unknown>;
    }

    const parts = req.parts();
    const fields: Record<string, unknown> = {};
    let filePart: MultipartFile | undefined;
    for await (const part of parts) {
      if (part.type === "file" && part.fieldname === "file") {
        filePart = part as MultipartFile;
      } else if (part.type === "field") {
        const key = (part as any).fieldname as string;
        const val = String((part as any).value ?? "");
        // Coerce known numeric fields
        if (key === "monthly_rent") {
          const n = Number(val);
          if (Number.isFinite(n)) fields.monthly_rent = n;
        } else if (key === "notes") {
          fields.notes = val || undefined;
        } else if (key === "name" || key === "address") {
          fields[key] = val;
        } else if (key === "cover_image_uri") {
          fields.cover_image_uri = val || undefined;
        }
      }
    }

    if (filePart) {
      if (!filePart.mimetype || !ALLOWED_MIME.has(filePart.mimetype)) {
        const supported = Array.from(ALLOWED_MIME).join(", ");
        const err = new Error(`Invalid file type. Allowed: ${supported}`);
        (err as any).statusCode = 400;
        throw err;
      }
      const buffer = await streamToBuffer(filePart.file, 5 * 1024 * 1024);
      const originalExt = path.extname(filePart.filename || "");
      const mappedExt = mimeToExt(filePart.mimetype);
      const ext = originalExt || mappedExt || "";
      const objectPath = `unit/${randomUUID()}/${Date.now()}${ext}`;
      await uploadToBucket(
        buckets.units,
        objectPath,
        buffer,
        filePart.mimetype
      );
      const publicUrl = getPublicUrl(buckets.units, objectPath);
      fields.cover_image_uri = publicUrl;
    }

    return fields;
  }

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
      const payload = await parseMaybeMultipart(req);
      // Validate early for clearer 400s
      CreateUnit.parse(payload);
      const unit = await svc.create(orgId, payload);
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
      const payload = await parseMaybeMultipart(req);
      UpdateUnit.parse(payload);
      const unit = await svc.update(orgId, id, payload);
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
