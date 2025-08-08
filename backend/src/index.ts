// src/index.ts
import Fastify from "fastify";
import rateLimit from "@fastify/rate-limit";
import swagger from "@fastify/swagger";
import swaggerUi from "@fastify/swagger-ui";
import cors from "@fastify/cors";
import { z } from "zod";
import dotenv from "dotenv";

// Load .env
dotenv.config();

// Validate environment variables
const envSchema = z.object({
  PORT: z.coerce.number().default(3000),
  CLERK_SECRET_KEY: z.string().min(1),
  SUPABASE_URL: z.string().url(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
  SUPABASE_STORAGE_BUCKET_UNITS: z.string().min(1),
  SUPABASE_STORAGE_BUCKET_TENANTS: z.string().min(1),
  REDIS_URL: z.string().url(),
  ENABLE_SEED: z
    .string()
    .transform((v) => v.toLowerCase() === "true")
    .default("false"),
});
const env = envSchema.parse(process.env);

// Create Fastify instance
const app = Fastify({
  logger: true,
});

// Global plugins
await app.register(cors, { origin: true });
await app.register(rateLimit, { max: 100, timeWindow: "1 minute" });

// Swagger docs
await app.register(swagger, {
  openapi: {
    info: {
      title: "Homi API",
      description: "Tenant management API for Homi",
      version: "1.0.0",
    },
  },
});
await app.register(swaggerUi, {
  routePrefix: "/docs",
  staticCSP: true,
});

// Health check
app.get("/healthz", async () => ({ ok: true }));

// Example: pass env into routes via decorator
app.decorate("config", env);

// Start server
try {
  await app.listen({ port: env.PORT, host: "0.0.0.0" });
  app.log.info(`Server listening on port ${env.PORT}`);
} catch (err) {
  app.log.error(err);
  process.exit(1);
}

// Types for Fastify instance with config
declare module "fastify" {
  interface FastifyInstance {
    config: typeof env;
  }
}
