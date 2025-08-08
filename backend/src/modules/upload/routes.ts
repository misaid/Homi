import multipart from "@fastify/multipart";
import type { MultipartFile } from "@fastify/multipart";
import type { FastifyInstance } from "fastify";
import { randomUUID } from "node:crypto";
import path from "node:path";
import { z } from "zod";
import { requireOrg } from "../../core/auth.js";
import { buckets, getSignedUrl, uploadToBucket } from "../../core/supabase.js";

const MAX_BYTES = 10 * 1024 * 1024; // 10 MB

function mimeToExt(mime: string | undefined): string {
  if (!mime) return "";
  switch (mime.toLowerCase()) {
    case "image/png":
      return ".png";
    case "image/jpeg":
      return ".jpg";
    case "image/jpg":
      return ".jpg";
    case "image/webp":
      return ".webp";
    case "image/gif":
      return ".gif";
    case "image/svg+xml":
      return ".svg";
    case "image/avif":
      return ".avif";
    default:
      return "";
  }
}

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

export default async function routes(app: FastifyInstance) {
  await app.register(multipart, {
    limits: {
      fileSize: MAX_BYTES,
      files: 1,
      fields: 5,
      headerPairs: 2000,
    },
  });

  app.post("/", async (req, reply) => {
    const need = requireOrg(req, reply);
    if (need) return;

    try {
      const parts = req.parts();
      let scopeValue: string | undefined;
      let filePart: MultipartFile | undefined;

      for await (const part of parts) {
        if (part.type === "file" && part.fieldname === "file") {
          filePart = part as MultipartFile;
        } else if (part.type === "field" && part.fieldname === "scope") {
          scopeValue = String((part as any).value ?? "").trim();
        } // ignore other fields
      }

      const { scope } = z
        .object({ scope: z.enum(["unit", "tenant"]) })
        .parse({ scope: scopeValue });

      if (!filePart) {
        return reply.code(400).send({ error: "Missing file" });
      }
      if (!filePart.mimetype || !filePart.mimetype.startsWith("image/")) {
        return reply.code(400).send({ error: "Invalid content type" });
      }

      const buffer = await streamToBuffer(filePart.file, MAX_BYTES);

      const originalExt = path.extname(filePart.filename || "");
      const mappedExt = mimeToExt(filePart.mimetype);
      const ext = originalExt || mappedExt || "";

      const objectPath = `${scope}/${randomUUID()}/${Date.now()}${ext}`;
      const bucket = scope === "unit" ? buckets.units : buckets.tenants;

      await uploadToBucket(bucket, objectPath, buffer, filePart.mimetype);
      const url = await getSignedUrl(bucket, objectPath, 3600);

      return reply.code(201).send({ url });
    } catch (err) {
      const status = (err as any)?.statusCode as number | undefined;
      const message = (err as Error).message || "Upload failed";
      if (status) return reply.code(status).send({ error: message });
      if (message.toLowerCase().includes("file too large")) {
        return reply.code(413).send({ error: "File too large" });
      }
      return reply.code(400).send({ error: message });
    }
  });
}
