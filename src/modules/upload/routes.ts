import { type FastifyInstance } from "fastify";
import { randomUUID } from "node:crypto";
import path from "node:path";
import { buckets, supa } from "../../core/supabase.js";

const MAX_BYTES = 10 * 1024 * 1024; // 10 MB
const VALID_SCOPES = new Set(["unit", "tenant"]);

export default async function routes(app: FastifyInstance) {
  app.post("/", async (req, reply) => {
    try {
      // Ensure multipart plugin is used
      const isMultipart = (req as any).isMultipart?.() ?? false;
      if (!isMultipart) {
        reply.code(400);
        return { error: "multipart content required" };
      }

      // Read fields: scope and file
      const parts = (req as any).parts?.();
      if (!parts || typeof parts[Symbol.asyncIterator] !== "function") {
        reply.code(400);
        return { error: "invalid multipart" };
      }

      let scope: string | undefined;
      let fileBuffer: Buffer | null = null;
      let fileMime: string | undefined;
      let fileName: string | undefined;

      for await (const part of parts as AsyncIterable<any>) {
        if (part.type === "file" && part.fieldname === "file") {
          fileMime = part.mimetype as string | undefined;
          fileName = part.filename as string | undefined;
          if (!fileMime || !fileMime.startsWith("image/")) {
            reply.code(400);
            return { error: "only image content is allowed" };
          }

          const chunks: Buffer[] = [];
          let total = 0;
          for await (const chunk of part.file as AsyncIterable<Buffer>) {
            total += chunk.length;
            if (total > MAX_BYTES) {
              reply.code(413);
              return { error: "file too large" };
            }
            chunks.push(chunk);
          }
          fileBuffer = Buffer.concat(chunks);
        } else if (part.type === "field" && part.fieldname === "scope") {
          scope = String(part.value);
        }
      }

      if (!scope || !VALID_SCOPES.has(scope)) {
        reply.code(400);
        return { error: "invalid scope" };
      }
      if (!fileBuffer || !fileMime) {
        reply.code(400);
        return { error: "missing file" };
      }

      const uuid = randomUUID();
      const ts = Date.now();
      const ext = fileName ? path.extname(fileName) : "";
      const objectPath = `${scope}/${uuid}/${ts}${ext}`;

      const bucket = scope === "unit" ? buckets.units : buckets.tenants;
      const uploadRes = await supa.storage
        .from(bucket)
        .upload(objectPath, fileBuffer, {
          contentType: fileMime,
          upsert: true,
        });
      if (uploadRes.error) {
        reply.code(500);
        return { error: uploadRes.error.message };
      }

      const signed = await supa.storage
        .from(bucket)
        .createSignedUrl(objectPath, 3600);
      if (signed.error || !signed.data?.signedUrl) {
        reply.code(500);
        return { error: signed.error?.message || "failed to sign url" };
      }

      return { url: signed.data.signedUrl };
    } catch (err: any) {
      reply.code(500);
      return { error: err?.message || "upload failed" };
    }
  });
}
