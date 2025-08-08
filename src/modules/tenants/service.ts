// Tenants service layer
// Validate inputs, enforce business rules, call repo functions
import {
  assertUnitBelongsToOrg,
  createTenant as repoCreateTenant,
  deleteTenant as repoDeleteTenant,
  getTenant as repoGetTenant,
  listTenants as repoListTenants,
  updateTenant as repoUpdateTenant,
} from "./repo";
import {
  CreateTenant,
  ListQuery,
  UpdateTenant,
  type CreateTenantInput,
  type UpdateTenantInput,
} from "./schemas";

export async function list(orgId: string, query: unknown) {
  const parsed = ListQuery.parse(query);
  return repoListTenants(orgId, parsed);
}

export async function get(orgId: string, id: string) {
  return repoGetTenant(orgId, id);
}

export async function create(orgId: string, body: unknown) {
  const values: CreateTenantInput = CreateTenant.parse(body);
  if (values.unit_id) {
    await assertUnitBelongsToOrg(orgId, values.unit_id);
  }
  const created = await repoCreateTenant(
    orgId,
    values as unknown as Record<string, unknown>
  );
  return created;
}

export async function update(orgId: string, id: string, body: unknown) {
  const values: UpdateTenantInput = UpdateTenant.parse(body);
  if (Object.prototype.hasOwnProperty.call(values, "unit_id")) {
    // unit_id may be null to clear; validate only when it is a non-null string
    const unitId = values.unit_id;
    if (typeof unitId === "string") {
      await assertUnitBelongsToOrg(orgId, unitId);
    }
  }
  const updated = await repoUpdateTenant(
    orgId,
    id,
    values as unknown as Record<string, unknown>
  );
  return updated;
}

export async function remove(orgId: string, id: string) {
  await repoDeleteTenant(orgId, id);
  return { ok: true } as const;
}
