export const qk = {
  units: (page: number = 1, limit: number = 20) =>
    ["units", { page, limit }] as const,
  unit: (id: string) => ["unit", id] as const,
  tenants: (page: number = 1, limit: number = 20) =>
    ["tenants", { page, limit }] as const,
  tenant: (id: string) => ["tenant", id] as const,
};
