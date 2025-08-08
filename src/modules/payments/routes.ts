// fastify routes for this module
import { FastifyInstance } from "fastify";
import { authGuard } from "../../core/auth";

export default async function routes(app: FastifyInstance) {
  app.addHook("preHandler", authGuard);

  app.get("/", async (req, reply) => {
    // example placeholder route
    return { ok: true };
  });
}
