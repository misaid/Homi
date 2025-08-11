export const qk = {
  units: (page: number = 1, limit: number = 20, q?: string) =>
    ["units", { page, limit, q: q ?? "" }] as const,
  unit: (id: string) => ["unit", id] as const,
  unitsAll: ["units", "all"] as const,
  tenants: (page: number = 1, limit: number = 20) =>
    ["tenants", { page, limit }] as const,
  tenant: (id: string) => ["tenant", id] as const,
  tenantsForUnit: (unitId?: string | null) =>
    ["tenants", "forUnit", unitId ?? "any"] as const,
  payments: (q: Record<string, unknown>) => ["payments", q] as const,
  tenantsList: (q: import("./types").TenantsQuery) => ["tenants", q] as const,
  rentSummary: (from?: string, to?: string) =>
    ["metrics", "rent_summary", { from, to }] as const,
  issues: (q: import("./types").IssuesQuery) => ["issues", q] as const,
};
