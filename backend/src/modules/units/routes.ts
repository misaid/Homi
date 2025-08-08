// src/modules/units/routes.ts
import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { supa } from "../../core/supabase.js"; // NodeNext: .js extension
import type { AuthContext } from "../../core/auth.js"; // types only, also .js

const ListQuery = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
});

export default async function routes(app: FastifyInstance) {
  app.get("/", async (req, reply) => {
    // req.auth is added by authGuard; type comes from the augmentation in auth.ts
    const orgId = (req.auth as AuthContext | undefined)?.orgId;
    if (!orgId) return reply.code(400).send({ error: "missing org" });

    const { page, limit } = ListQuery.parse(req.query);
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    const { data, error, count } = await supa
      .from("units")
      .select("*", { count: "exact" })
      .eq("org_id", orgId)
      .range(from, to);

    if (error) return reply.code(500).send({ error: error.message });

    return {
      items: data ?? [],
      page,
      limit,
      total: count ?? 0,
      hasMore: (count ?? 0) > to + 1,
    };
  });
}
