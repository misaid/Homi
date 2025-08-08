// supabase repo for this module
import { supa } from "../../core/supabase";

export type OrgScoped = { orgId: string };

export function withOrg<T extends object>(row: T, orgId: string) {
  return { ...row, org_id: orgId } as T & { org_id: string };
}

// Add module specific repo functions here, for example:
// export async function list(orgId: string) {
//   const { data, error } = await supa.from("<table>").select("*").eq("org_id", orgId);
//   if (error) throw error;
//   return data;
// }
