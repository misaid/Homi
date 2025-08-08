// src/modules/tenants/service.ts
import type { CreateTenantInput, UpdateTenantInput } from "./schemas.js";
import {
  createTenant,
  deleteTenant,
  getTenant,
  listTenants,
  unitBelongsToOrg,
  updateTenant,
  type Tenant,
} from "./repo.js";

export async function list(
  orgId: string,
  page: number,
  limit: number,
  q?: string
) {
  return listTenants(orgId, page, limit, q);
}

export async function get(orgId: string, id: string) {
  return getTenant(orgId, id);
}

export async function create(orgId: string, payload: CreateTenantInput) {
  if (payload.unit_id) {
    const ok = await unitBelongsToOrg(orgId, payload.unit_id);
    if (!ok) throw new Error("unit does not belong to organization");
  }
  const values: Partial<Tenant> = { full_name: payload.full_name };
  if (Object.prototype.hasOwnProperty.call(payload, "phone")) {
    values.phone = payload.phone ?? null;
  }
  if (Object.prototype.hasOwnProperty.call(payload, "email")) {
    values.email = payload.email ?? null;
  }
  if (Object.prototype.hasOwnProperty.call(payload, "lease_start")) {
    values.lease_start = payload.lease_start
      ? payload.lease_start.toISOString()
      : null;
  }
  if (Object.prototype.hasOwnProperty.call(payload, "lease_end")) {
    values.lease_end = payload.lease_end
      ? payload.lease_end.toISOString()
      : null;
  }
  if (Object.prototype.hasOwnProperty.call(payload, "unit_id")) {
    values.unit_id = payload.unit_id ?? null;
  }
  const created = await createTenant(orgId, values);
  return created as Tenant;
}

export async function update(
  orgId: string,
  id: string,
  payload: UpdateTenantInput
) {
  if (payload.unit_id) {
    const ok = await unitBelongsToOrg(orgId, payload.unit_id);
    if (!ok) throw new Error("unit does not belong to organization");
  }
  const values: Partial<Tenant> = {};
  if (
    Object.prototype.hasOwnProperty.call(payload, "full_name") &&
    payload.full_name !== undefined
  ) {
    values.full_name = payload.full_name;
  }
  if (Object.prototype.hasOwnProperty.call(payload, "phone")) {
    values.phone = payload.phone ?? null;
  }
  if (Object.prototype.hasOwnProperty.call(payload, "email")) {
    values.email = payload.email ?? null;
  }
  if (Object.prototype.hasOwnProperty.call(payload, "lease_start")) {
    values.lease_start = payload.lease_start
      ? payload.lease_start.toISOString()
      : null;
  }
  if (Object.prototype.hasOwnProperty.call(payload, "lease_end")) {
    values.lease_end = payload.lease_end
      ? payload.lease_end.toISOString()
      : null;
  }
  if (Object.prototype.hasOwnProperty.call(payload, "unit_id")) {
    values.unit_id = payload.unit_id ?? null;
  }
  const updated = await updateTenant(orgId, id, values);
  return updated as Tenant;
}

export async function remove(orgId: string, id: string) {
  await deleteTenant(orgId, id);
}
