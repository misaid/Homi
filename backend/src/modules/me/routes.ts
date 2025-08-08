// src/modules/me/routes.ts
import type { FastifyInstance } from "fastify";

export default async function routes(app: FastifyInstance) {
  app.get("/", async (req, reply) => {
    const auth = req.auth;
    if (!auth) return reply.code(401).send({ error: "Unauthorized" });

    const { userId, orgId, claims } = auth;
    const email =
      typeof (claims as any)?.email === "string"
        ? (claims as any).email
        : undefined;

    const body: { userId: string; orgId: string | null; email?: string } = {
      userId,
      orgId: orgId ?? null,
    };
    if (email) body.email = email;

    return body;
  });
}
