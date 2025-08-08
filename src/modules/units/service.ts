import {
  createUnit as repoCreateUnit,
  deleteUnit as repoDeleteUnit,
  getUnitById as repoGetUnitById,
  listUnits as repoListUnits,
  updateUnit as repoUpdateUnit,
} from "./repo.js";
import {
  CreateUnit,
  ListQuery,
  UpdateUnit,
  type CreateUnitInput,
  type ListQueryInput,
  type UpdateUnitInput,
} from "./schemas.js";

export async function listUnitsService(orgId: string, query: unknown) {
  const parsed = ListQuery.parse(query) as ListQueryInput;
  const { items, total } = await repoListUnits(
    orgId,
    parsed.page,
    parsed.limit,
    parsed.q
  );
  const hasMore = parsed.page * parsed.limit < total;
  return { items, page: parsed.page, limit: parsed.limit, total, hasMore };
}

export async function getUnitService(orgId: string, id: string) {
  const unit = await repoGetUnitById(orgId, id);
  return unit;
}

export async function createUnitService(orgId: string, body: unknown) {
  const input = CreateUnit.parse(body) as CreateUnitInput;
  const created = await repoCreateUnit(orgId, input);
  return created;
}

export async function updateUnitService(
  orgId: string,
  id: string,
  body: unknown
) {
  const input = UpdateUnit.parse(body) as UpdateUnitInput;
  const updated = await repoUpdateUnit(orgId, id, input);
  return updated;
}

export async function deleteUnitService(orgId: string, id: string) {
  await repoDeleteUnit(orgId, id);
}
