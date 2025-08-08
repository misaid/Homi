import Fastify from "fastify";
import { vi } from "vitest";

// Minimal env so core/supabase.ts won't throw on import
process.env.SUPABASE_URL = process.env.SUPABASE_URL || "http://local.test";
process.env.SUPABASE_SERVICE_ROLE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY || "test-key";
process.env.SUPABASE_STORAGE_BUCKET_UNITS =
  process.env.SUPABASE_STORAGE_BUCKET_UNITS || "unit-media";
process.env.SUPABASE_STORAGE_BUCKET_TENANTS =
  process.env.SUPABASE_STORAGE_BUCKET_TENANTS || "tenant-media";
process.env.CLERK_SECRET_KEY = process.env.CLERK_SECRET_KEY || "sk_test";
process.env.CLERK_ISSUER = process.env.CLERK_ISSUER || "https://issuer.test";

// Central mutable state for mocks
export type ClerkPayload = {
  sub: string;
  sid?: string | null;
  org_id?: string | null;
  orgId?: string | null;
  email?: string;
  [k: string]: unknown;
};
const tokenMap = new Map<string, ClerkPayload>();

export function resetAuthTokens() {
  tokenMap.clear();
}

export function setValidToken(token: string, payload: ClerkPayload) {
  tokenMap.set(token, payload);
}

export function makeAuthHeader(token: string) {
  return { Authorization: `Bearer ${token}` } as const;
}

// Install Clerk mock
vi.mock("@clerk/clerk-sdk-node", () => {
  return {
    verifyToken: async (token: string) => {
      const p = tokenMap.get(token);
      if (!p) {
        const err = new Error("invalid");
        (err as any).status = 401;
        throw err;
      }
      return p as any;
    },
  };
});

// Supabase client mock factory and install into @supabase/supabase-js
import {
  createFakeSupabaseClient,
  supabaseMockState,
} from "./__mocks__/supabase.mock.js";

const fakeClient = createFakeSupabaseClient();
vi.mock("@supabase/supabase-js", () => {
  return {
    createClient: () => fakeClient,
  };
});

export function resetSupabase() {
  supabaseMockState.reset();
}

export function setTableData(table: string, rows: any[]) {
  supabaseMockState.setTable(table, rows);
}

export function setSelectError(table: string, message: string) {
  supabaseMockState.setSelectError(table, message);
}

export function setInsertError(table: string, message: string) {
  supabaseMockState.setInsertError(table, message);
}

export function setStorageUploadError(message: string) {
  supabaseMockState.setStorageUploadError(message);
}

export async function makeTestApp(options?: { enableSeed?: boolean }) {
  const app = Fastify({ logger: false });

  // Decorate config, request.auth like in src/index.ts
  (app as any).decorate("config", {
    ENABLE_SEED: options?.enableSeed ?? false,
    PORT: 3000,
    CLERK_SECRET_KEY: "sk_test",
    CLERK_ISSUER: "https://issuer.test",
    SUPABASE_URL: "http://local.test",
    SUPABASE_SERVICE_ROLE_KEY: "test-key",
    SUPABASE_STORAGE_BUCKET_UNITS: "unit-media",
    SUPABASE_STORAGE_BUCKET_TENANTS: "tenant-media",
    REDIS_URL: "http://redis.test",
  });
  (app as any).decorateRequest("auth", null);

  // Public health endpoint
  app.get("/healthz", async () => ({ ok: true }));

  // Register v1 scope with auth and all modules
  await app.register(
    async (v1) => {
      const modAuth = await import("../src/core/auth.js");
      v1.addHook("preHandler", modAuth.authGuard);

      // Register routes like src/index.ts
      const unitsRoutes = (await import("../src/modules/units/routes.js"))
        .default;
      await v1.register(unitsRoutes, { prefix: "/units" });

      try {
        const tenantsRoutes = (await import("../src/modules/tenants/routes.js"))
          .default;
        await v1.register(tenantsRoutes, { prefix: "/tenants" });
      } catch {}

      try {
        const paymentsRoutes = (
          await import("../src/modules/payments/routes.js")
        ).default;
        await v1.register(paymentsRoutes, { prefix: "/payments" });
      } catch {}

      try {
        const uploadRoutes = (await import("../src/modules/upload/routes.js"))
          .default;
        await v1.register(uploadRoutes, { prefix: "/upload" });
      } catch {}

      try {
        const meRoutes = (await import("../src/modules/me/routes.js")).default;
        await v1.register(meRoutes, { prefix: "/me" });
      } catch {}

      try {
        const seedRoutes = (await import("../src/modules/seed/routes.js"))
          .default;
        await v1.register(seedRoutes, { prefix: "/seed" });
      } catch {}
    },
    { prefix: "/v1" }
  );

  await app.ready();
  return app;
}
