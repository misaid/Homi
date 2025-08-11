export type Unit = {
  id: string;
  name: string;
  address: string;
  monthly_rent: number;
  notes?: string | null;
  cover_image_uri?: string | null;
  org_id?: string;
  created_at?: string;
  // New optional fields returned by API
  beds?: number | null;
  baths?: number | null;
  photos?: string[];
  occupants_count?: number;
};

export type Tenant = {
  id: string;
  full_name: string;
  phone?: string | null;
  email?: string | null;
  lease_start?: string | null;
  lease_end?: string | null;
  unit_id?: string | null;
  org_id?: string;
  created_at?: string;
};

export type Payment = {
  id: string;
  tenant_id: string;
  due_date: string;
  amount: number;
  status: "due" | "paid";
  paid_at?: string | null;
  method?: string | null;
  note?: string | null;
  tenant?: { id: string; full_name: string } | null;
};

export type Paginated<T> = {
  items: T[];
  page: number;
  limit: number;
  total: number;
  hasMore: boolean;
};

export type TenantsQuery = {
  q?: string;
  sort?: "name" | "lease_start" | "lease_end" | "created_at";
  order?: "asc" | "desc";
  page?: number;
  limit?: number;
};

export type RentSummaryItem = {
  month: string;
  paid_amount: number | string;
  due_amount: number | string;
  collection_rate: number;
};

export type Issue = {
  id: string;
  title: string;
  description?: string;
  severity: "low" | "medium" | "high" | "critical";
  status: "open" | "in_progress" | "resolved" | "closed";
  unit_id?: string | null;
  tenant_id?: string | null;
  unit?: { id: string; name: string } | null;
  tenant?: { id: string; full_name: string } | null;
  created_at: string;
  updated_at: string;
};

export type IssuesQuery = {
  severity?: Issue["severity"];
  status?: Issue["status"];
  sort?: "created_at" | "severity" | "status" | "title";
  order?: "asc" | "desc";
  page?: number;
  limit?: number;
};
