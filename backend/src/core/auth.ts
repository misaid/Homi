// src/core/auth.ts
import { verifyToken } from "@clerk/clerk-sdk-node";
import type { FastifyReply, FastifyRequest } from "fastify";

export type AuthContext = {
  userId: string;
  sessionId?: string | null;
  orgId?: string | null;
  claims: Record<string, unknown>;
};

declare module "fastify" {
  interface FastifyRequest {
    auth?: AuthContext;
  }
}

function extractBearerToken(req: FastifyRequest): string | null {
  const authHeader =
    req.headers["authorization"] ||
    req.headers["Authorization" as keyof typeof req.headers];
  if (typeof authHeader === "string" && authHeader.startsWith("Bearer ")) {
    return authHeader.slice("Bearer ".length).trim();
  }
  // Fallbacks if a custom header is used from React Native clients
  const alt = req.headers["x-clerk-auth"] || req.headers["clerk-auth"];
  if (typeof alt === "string") return alt.trim();
  return null;
}

export async function authGuard(req: FastifyRequest, reply: FastifyReply) {
  // Only protect /v1 routes; allow public endpoints like /healthz
  if (!req.url.startsWith("/v1")) return;

  const token = extractBearerToken(req);
  if (!token) {
    return reply.code(401).send({ error: "Missing bearer token" });
  }

  try {
    const secretKey = process.env.CLERK_SECRET_KEY;
    const issuer =
      process.env.CLERK_ISSUER ||
      process.env.CLERK_JWT_ISSUER ||
      process.env.CLERK_ISSUER_URL;
    if (!secretKey) {
      req.log.error("CLERK_SECRET_KEY is not set");
      return reply.code(500).send({ error: "Server misconfiguration" });
    }
    if (!issuer) {
      req.log.error("CLERK_ISSUER is not set");
      return reply.code(500).send({ error: "Server misconfiguration" });
    }
    const authorizedParties = process.env.CLERK_AUTHORIZED_PARTIES
      ? process.env.CLERK_AUTHORIZED_PARTIES.split(",")
          .map((s) => s.trim())
          .filter(Boolean)
      : undefined;

    const payload = await verifyToken(
      token,
      authorizedParties
        ? { secretKey, issuer, authorizedParties }
        : { secretKey, issuer }
    );

    // Common Clerk claims
    const userId = (payload as any).sub as string | undefined;
    const sessionId = (payload as any).sid as string | undefined;
    const orgId = ((payload as any).org_id || (payload as any).orgId) as
      | string
      | undefined;

    if (!userId) {
      return reply.code(401).send({ error: "Invalid token: missing subject" });
    }

    req.auth = {
      userId,
      sessionId: sessionId ?? null,
      orgId: orgId ?? null,
      claims: payload as unknown as Record<string, unknown>,
    };
  } catch (err) {
    req.log.warn({ err }, "Token verification failed");
    return reply.code(401).send({ error: "Unauthorized" });
  }
}

export function requireOrg(req: FastifyRequest, reply: FastifyReply) {
  if (!req.auth?.orgId) {
    return reply.code(400).send({ error: "Organization context required" });
  }
}

export function getAuth(req: FastifyRequest): AuthContext | undefined {
  return req.auth;
}
