// src/core/supabase.ts
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// Validate required env here to fail fast
const {
  SUPABASE_URL,
  SUPABASE_SERVICE_ROLE_KEY,
  SUPABASE_STORAGE_BUCKET_UNITS,
  SUPABASE_STORAGE_BUCKET_TENANTS,
} = process.env;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
}

// Single Supabase client for the server
export const supa: SupabaseClient = createClient(
  SUPABASE_URL,
  SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: { persistSession: false },
  }
);

// Buckets from env for convenience
export const buckets = {
  units: SUPABASE_STORAGE_BUCKET_UNITS || "unit-media",
  tenants: SUPABASE_STORAGE_BUCKET_TENANTS || "tenant-media",
};

// Range helper for pagination
export function pageRange(page: number, limit: number) {
  const p = Math.max(1, page || 1);
  const l = Math.min(Math.max(1, limit || 20), 100);
  const from = (p - 1) * l;
  const to = from + l - 1;
  return { from, to, page: p, limit: l };
}

// Simple org scoped select with count
export async function selectOrg<T = unknown>(
  table: string,
  orgId: string,
  from: number,
  to: number
) {
  const q = supa
    .from(table)
    .select("*", { count: "exact" })
    .eq("org_id", orgId)
    .range(from, to);
  const { data, error, count } = await q;
  if (error) throw new Error(error.message);
  return { items: data as T[], total: count ?? 0 };
}

// Insert or update with org guard check
export async function insertWithOrg<T = unknown>(
  table: string,
  orgId: string,
  values: Record<string, unknown>
) {
  const payload = { ...values, org_id: orgId };
  const { data, error } = await supa
    .from(table)
    .insert(payload)
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data as T;
}

export async function updateWithOrg<T = unknown>(
  table: string,
  orgId: string,
  id: string,
  values: Record<string, unknown>
) {
  const { data, error } = await supa
    .from(table)
    .update(values)
    .eq("id", id)
    .eq("org_id", orgId)
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data as T;
}

export async function deleteWithOrg(table: string, orgId: string, id: string) {
  const { error } = await supa
    .from(table)
    .delete()
    .eq("id", id)
    .eq("org_id", orgId);
  if (error) throw new Error(error.message);
}

// Storage helpers
export async function uploadToBucket(
  bucket: string,
  path: string,
  file: ArrayBuffer | Uint8Array | Buffer,
  contentType = "application/octet-stream"
) {
  const { error } = await supa.storage.from(bucket).upload(path, file, {
    contentType,
    upsert: true,
  });
  if (error) throw new Error(error.message);
  return { bucket, path };
}

export async function getSignedUrl(
  bucket: string,
  path: string,
  expiresIn = 3600
) {
  const { data, error } = await supa.storage
    .from(bucket)
    .createSignedUrl(path, expiresIn);
  if (error) throw new Error(error.message);
  return data.signedUrl;
}

// Return a public URL for an object in a public bucket
export function getPublicUrl(bucket: string, path: string) {
  const { data } = supa.storage.from(bucket).getPublicUrl(path);
  return data.publicUrl;
}
