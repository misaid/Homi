// src/index.ts
import cors from "@fastify/cors";
import rateLimit from "@fastify/rate-limit";
import swagger from "@fastify/swagger";
import swaggerUi from "@fastify/swagger-ui";
import * as dotenv from "dotenv";
import Fastify from "fastify";
import fs from "node:fs";
import { z } from "zod";
import { authGuard, type AuthContext } from "./core/auth.js";
import unitsRoutes from "./modules/units/routes.js";

if (fs.existsSync(".env.local")) {
  dotenv.config({ path: ".env.local" });
} else {
  dotenv.config(); // falls back to .env
}

// 1) Define env schema and type first
const envSchema = z.object({
  PORT: z.coerce.number().default(3000),
  CLERK_SECRET_KEY: z.string().min(1),
  // Your auth.ts expects an issuer. If you really don't use it, remove it there too.
  CLERK_ISSUER: z.string().url().optional(),
  CLERK_JWT_ISSUER: z.string().url().optional(),
  CLERK_ISSUER_URL: z.string().url().optional(),
  CLERK_AUTHORIZED_PARTIES: z.string().optional(),

  SUPABASE_URL: z.string().url(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
  SUPABASE_STORAGE_BUCKET_UNITS: z.string().min(1),
  SUPABASE_STORAGE_BUCKET_TENANTS: z.string().min(1),
  REDIS_URL: z.string().url(),

  ENABLE_SEED: z
    .enum(["true", "false"])
    .default("false")
    .transform((v) => v === "true"),
});
type Env = z.infer<typeof envSchema>;

// 2) Parse env
const env: Env = envSchema.parse(process.env);

// 3) Fastify instance with typed config
const app = Fastify({ logger: true });

// Make env and auth available on app/req
declare module "fastify" {
  interface FastifyInstance {
    config: Env;
  }
}
app.decorate("config", env);
app.decorateRequest("auth", null as unknown as AuthContext);

// Core plugins
await app.register(cors, {
  origin: true,
  credentials: true,
  allowedHeaders: [
    "Content-Type",
    "Authorization",
    "X-Organization-Id",
    "X-Org-Id",
  ],
});
await app.register(rateLimit, { max: 100, timeWindow: "1 minute" });

// Swagger
await app.register(swagger, {
  openapi: {
    info: { title: "Homi API", version: "1.0.0" },
    components: {
      securitySchemes: {
        bearerAuth: { type: "http", scheme: "bearer", bearerFormat: "JWT" },
      },
    },
    security: [{ bearerAuth: [] }],
  },
});
await app.register(swaggerUi, { routePrefix: "/docs", staticCSP: true });
await app.register(
  async (v1) => {
    v1.addHook("preHandler", authGuard);
    await v1.register(unitsRoutes, { prefix: "/units" });
    try {
      const tenantsModulePath = "./modules/tenants/routes.js";
      const { default: tenantsRoutes } = await import(tenantsModulePath);
      await v1.register(tenantsRoutes, { prefix: "/tenants" });
    } catch (err) {
      if (
        (err as any)?.code !== "ERR_MODULE_NOT_FOUND" &&
        !(err as Error)?.message?.includes("Cannot find module")
      ) {
        throw err;
      }
    }
    try {
      const paymentsModulePath = "./modules/payments/routes.js";
      const { default: paymentsRoutes } = await import(paymentsModulePath);
      await v1.register(paymentsRoutes, { prefix: "/payments" });
    } catch (err) {
      if (
        (err as any)?.code !== "ERR_MODULE_NOT_FOUND" &&
        !(err as Error)?.message?.includes("Cannot find module")
      ) {
        throw err;
      }
    }
    try {
      const uploadModulePath = "./modules/upload/routes.js";
      const { default: uploadRoutes } = await import(uploadModulePath);
      await v1.register(uploadRoutes, { prefix: "/upload" });
    } catch (err) {
      if (
        (err as any)?.code !== "ERR_MODULE_NOT_FOUND" &&
        !(err as Error)?.message?.includes("Cannot find module")
      ) {
        throw err;
      }
    }
    try {
      const meModulePath = "./modules/me/routes.js";
      const { default: meRoutes } = await import(meModulePath);
      await v1.register(meRoutes, { prefix: "/me" });
    } catch (err) {
      if (
        (err as any)?.code !== "ERR_MODULE_NOT_FOUND" &&
        !(err as Error)?.message?.includes("Cannot find module")
      ) {
        throw err;
      }
    }
    try {
      const seedModulePath = "./modules/seed/routes.js";
      const { default: seedRoutes } = await import(seedModulePath);
      await v1.register(seedRoutes, { prefix: "/seed" });
    } catch (err) {
      if (
        (err as any)?.code !== "ERR_MODULE_NOT_FOUND" &&
        !(err as Error)?.message?.includes("Cannot find module")
      ) {
        throw err;
      }
    }
  },
  { prefix: "/v1" }
);

// Public health check
app.get("/healthz", async () => ({ ok: true }));

// Protect everything under /v1 happens inside the scoped plugin above

try {
  await app.listen({ port: env.PORT, host: "0.0.0.0" });
  app.log.info(`Server listening on ${env.PORT}`);
} catch (err) {
  app.log.error(err);
  process.exit(1);
}
