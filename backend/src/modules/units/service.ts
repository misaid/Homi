import { z } from "zod";
import {
  CreateUnit,
  ListQuery,
  type CreateUnitInput,
  type ListQueryInput,
  type UpdateUnitInput,
  UpdateUnit,
} from "./schemas.js";
import {
  createUnit as repoCreate,
  deleteUnit as repoDelete,
  getUnitById as repoGetById,
  listUnits as repoList,
  updateUnit as repoUpdate,
} from "./repo.js";

export async function list(orgId: string, query: unknown) {
  const parsed = ListQuery.parse(query);
  return repoList(orgId, parsed);
}

export async function get(orgId: string, id: string) {
  if (!z.string().uuid().safeParse(id).success) {
    throw new Error("Invalid id");
  }
  return repoGetById(orgId, id);
}

export async function create(orgId: string, body: unknown) {
  const parsed: CreateUnitInput = CreateUnit.parse(body);
  return repoCreate(orgId, parsed);
}

export async function update(orgId: string, id: string, body: unknown) {
  if (!z.string().uuid().safeParse(id).success) {
    throw new Error("Invalid id");
  }
  const parsed: UpdateUnitInput = UpdateUnit.parse(body);
  // Normalize empty strings to null where fields are nullable
  const payload: Record<string, unknown> = { ...parsed };
  if (Object.prototype.hasOwnProperty.call(parsed, "notes")) {
    const v = (parsed as any).notes;
    payload.notes = v === "" ? null : v;
  }
  if (Object.prototype.hasOwnProperty.call(parsed, "cover_image_uri")) {
    const v = (parsed as any).cover_image_uri;
    payload.cover_image_uri = v === "" ? null : v;
  }
  return repoUpdate(orgId, id, payload);
}

export async function remove(orgId: string, id: string) {
  if (!z.string().uuid().safeParse(id).success) {
    throw new Error("Invalid id");
  }
  await repoDelete(orgId, id);
}
