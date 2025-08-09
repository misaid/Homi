// src/modules/seed/routes.ts
import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { supa } from "../../core/supabase.js";
import { createUnit } from "../units/repo.js";
import { createTenant } from "../tenants/repo.js";

function formatDateYYYYMMDD(d: Date) {
  const year = d.getUTCFullYear();
  const month = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function firstDayOfNextMonth(from = new Date()) {
  const d = new Date(Date.UTC(from.getUTCFullYear(), from.getUTCMonth(), 1));
  d.setUTCMonth(d.getUTCMonth() + 1);
  return d;
}

function addMonths(date: Date, months: number) {
  const d = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1));
  d.setUTCMonth(d.getUTCMonth() + months);
  return d;
}

export default async function routes(app: FastifyInstance) {
  // Only register when seeding is enabled
  if (!app.config.ENABLE_SEED) return;

  const BodySchema = z
    .object({ org_name: z.string().trim().min(1).optional() })
    .default({});

  app.post("/", async (req, reply) => {
    const body = BodySchema.parse((req.body as unknown) ?? {});
    const orgName = body.org_name ?? "Demo Org";

    // 1) Find or create organization by name
    let orgId: string | null = null;
    const { data: foundOrgs, error: findOrgErr } = await supa
      .from("orgs")
      .select("id")
      .eq("name", orgName)
      .limit(1);
    if (findOrgErr) {
      return reply.code(400).send({ error: findOrgErr.message });
    }
    if (Array.isArray(foundOrgs) && foundOrgs.length > 0) {
      orgId = foundOrgs[0]?.id as string;
    }

    let orgsCreated = 0;
    if (!orgId) {
      const { data: createdOrg, error: createOrgErr } = await supa
        .from("orgs")
        .insert({ name: orgName })
        .select()
        .single();
      if (createOrgErr || !createdOrg) {
        const msg = createOrgErr?.message || "Failed to create organization";
        return reply.code(400).send({ error: msg });
      }
      orgId = (createdOrg as { id: string }).id;
      orgsCreated = 1;
    }

    // 2) Seed 2 units
    let unit1Id: string;
    let unit2Id: string;
    try {
      const unit1 = await createUnit(orgId, {
        name: "Unit A",
        address: "123 Main St",
        monthly_rent: 1200,
      });
      const unit2 = await createUnit(orgId, {
        name: "Unit B",
        address: "456 Oak Ave",
        monthly_rent: 1500,
      });
      unit1Id = (unit1 as any).id as string;
      unit2Id = (unit2 as any).id as string;
    } catch (err) {
      const message = (err as Error).message || "Failed to create units";
      return reply.code(400).send({ error: message });
    }

    // 3) Seed 2 tenants, one per unit
    let tenant1Id: string;
    let tenant2Id: string;
    try {
      const tenant1 = await createTenant(orgId, {
        full_name: "Alice Johnson",
        email: "alice@example.com",
        lease_start: formatDateYYYYMMDD(new Date()),
        unit_id: unit1Id,
      });
      const tenant2 = await createTenant(orgId, {
        full_name: "Bob Smith",
        email: "bob@example.com",
        lease_start: formatDateYYYYMMDD(new Date()),
        unit_id: unit2Id,
      });
      tenant1Id = (tenant1 as any).id as string;
      tenant2Id = (tenant2 as any).id as string;
    } catch (err) {
      const message = (err as Error).message || "Failed to create tenants";
      return reply.code(400).send({ error: message });
    }

    // 4) Create payments for next 2 months for each tenant
    try {
      const next1 = firstDayOfNextMonth();
      const next2 = addMonths(next1, 1);
      const due1 = formatDateYYYYMMDD(next1);
      const due2 = formatDateYYYYMMDD(next2);

      // Fetch unit rents for amounts
      const { data: units, error: unitsErr } = await supa
        .from("units")
        .select("id, monthly_rent")
        .in("id", [unit1Id, unit2Id]);
      if (unitsErr) throw new Error(unitsErr.message);
      const rents: Record<string, number> = {};
      for (const u of units || []) {
        rents[(u as any).id as string] = Number((u as any).monthly_rent);
      }

      const rows = [
        {
          org_id: orgId,
          tenant_id: tenant1Id,
          due_date: due1,
          amount: rents[unit1Id] ?? 0,
        },
        {
          org_id: orgId,
          tenant_id: tenant1Id,
          due_date: due2,
          amount: rents[unit1Id] ?? 0,
        },
        {
          org_id: orgId,
          tenant_id: tenant2Id,
          due_date: due1,
          amount: rents[unit2Id] ?? 0,
        },
        {
          org_id: orgId,
          tenant_id: tenant2Id,
          due_date: due2,
          amount: rents[unit2Id] ?? 0,
        },
      ];
      const { error: payErr } = await supa.from("payments").insert(rows);
      if (payErr) throw new Error(payErr.message);
    } catch (err) {
      const message = (err as Error).message || "Failed to create payments";
      return reply.code(400).send({ error: message });
    }

    return reply.send({ orgs: orgsCreated, units: 2, tenants: 2, payments: 4 });
  });
}
