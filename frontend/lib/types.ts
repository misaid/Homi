export type Unit = {
  id: string;
  name: string;
  address: string;
  monthly_rent: number;
  notes?: string | null;
  cover_image_uri?: string | null;
  org_id?: string;
  created_at?: string;
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

export type Paginated<T> = {
  items: T[];
  page: number;
  limit: number;
  total: number;
  hasMore: boolean;
};
