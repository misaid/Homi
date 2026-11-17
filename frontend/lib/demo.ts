// Demo mode: renders the whole app with seeded, in-memory data. No backend or
// Clerk session is needed. Enable with EXPO_PUBLIC_DEMO=1 (used for screenshots).
import { Asset } from "expo-asset";
import type { Issue, Notification, Payment, Tenant, Unit } from "./types";

export const DEMO = process.env.EXPO_PUBLIC_DEMO === "1";

const img = (m: any): string => {
  if (typeof m === "string") return m;
  if (m && typeof m === "object" && typeof m.uri === "string") return m.uri;
  try {
    return Asset.fromModule(m).uri;
  } catch {
    return "";
  }
};
const photos = () => [
  img(require("@/assets/demo/u1.jpg")),
  img(require("@/assets/demo/u2.jpg")),
  img(require("@/assets/demo/u3.jpg")),
  img(require("@/assets/demo/u4.jpg")),
  img(require("@/assets/demo/u5.jpg")),
  img(require("@/assets/demo/u6.jpg")),
];

const ORG = "org_demo";
const d = (s: string) => new Date(s).toISOString();

type Seed = {
  units: Unit[];
  tenants: Tenant[];
  payments: Payment[];
  issues: Issue[];
  notifications: Notification[];
};
let seed: Seed | null = null;

function build(): Seed {
  const p = photos();
  const unitRows: [string, string, number, number, number, string][] = [
    ["Maple Cottage", "214 Maple Street, Portland, OR", 2450, 3, 2, "Detached, fenced yard"],
    ["Harbor View 4B", "88 Harbor Way, Portland, OR", 1980, 2, 1, "Top floor, river view"],
    ["Cedar House", "37 Cedar Lane, Beaverton, OR", 2780, 4, 2.5, "Garage and workshop"],
    ["Brickworks 2A", "510 Pearl Avenue, Portland, OR", 2150, 2, 2, "Renovated kitchen"],
    ["Lakeside Bungalow", "9 Willow Court, Lake Oswego, OR", 3200, 3, 2, "Lake access"],
    ["Orchard Flats 1C", "62 Orchard Road, Hillsboro, OR", 1650, 1, 1, "Ground floor, pet friendly"],
  ];
  const units: Unit[] = unitRows.map(([name, address, rent, beds, baths, notes], i) => ({
    id: `unit_${i + 1}`,
    name,
    address,
    monthly_rent: rent,
    beds,
    baths,
    notes,
    image_url: p[i],
    display_url: p[i],
    cover_image_uri: p[i],
    photos: [p[i]],
    org_id: ORG,
    created_at: d("2025-03-01"),
    occupants_count: i === 2 ? 2 : 1,
  }));

  const tRows: [string, string, string, string, string, number][] = [
    ["Priya Raman", "priya.raman@example.com", "(503) 555-0142", "2025-02-01", "2027-01-31", 1],
    ["Daniel Okafor", "d.okafor@example.com", "(503) 555-0178", "2025-06-01", "2027-05-31", 2],
    ["Hannah Lindqvist", "hannah.l@example.com", "(971) 555-0116", "2025-09-01", "2027-08-31", 3],
    ["Marcus Bell", "marcus.bell@example.com", "(503) 555-0193", "2026-01-15", "2027-01-14", 3],
    ["Sofia Alvarez", "sofia.alvarez@example.com", "(971) 555-0127", "2025-08-01", "2027-07-31", 4],
    ["Ethan Park", "ethan.park@example.com", "(503) 555-0165", "2025-11-01", "2026-12-31", 5],
    ["Grace Whitfield", "grace.w@example.com", "(971) 555-0159", "2026-04-01", "2027-03-31", 6],
  ];
  const tenants: Tenant[] = tRows.map(([full_name, email, phone, ls, le, u], i) => ({
    id: `tenant_${i + 1}`,
    full_name,
    email,
    phone,
    lease_start: ls,
    lease_end: le,
    unit_id: `unit_${u}`,
    org_id: ORG,
    created_at: d(ls),
  }));

  const payments: Payment[] = [];
  const months = ["2026-11-01", "2026-12-01", "2027-01-01", "2027-02-01"];
  let n = 0;
  tenants.forEach((t, ti) => {
    const unit = units.find((u) => u.id === t.unit_id)!;
    const share = t.id === "tenant_3" ? unit.monthly_rent * 0.55 : t.id === "tenant_4" ? unit.monthly_rent * 0.45 : unit.monthly_rent;
    months.forEach((m, mi) => {
      // A few tenants have already paid this month, so Home's rent meter and
      // the Rent list both have something to show.
      const paid = mi === 0 && (ti === 0 || ti === 2 || ti === 5);
      payments.push({
        id: `pay_${++n}`,
        tenant_id: t.id,
        due_date: m,
        amount: Math.round(share),
        status: paid ? "paid" : "due",
        paid_at: paid ? d("2026-11-02") : null,
        tenant: { id: t.id, full_name: t.full_name },
      });
    });
  });

  const now = Date.now();
  const ago = (days: number) => new Date(now - days * 86400000).toISOString();
  const issueRows: [string, string, Issue["severity"], Issue["status"], number, number | null, number][] = [
    ["Heating not working", "Radiator in the living room stays cold.", "high", "open", 2, 2, 1],
    ["Kitchen faucet dripping", "Slow drip under the sink, getting worse.", "medium", "in_progress", 3, 3, 4],
    ["Water stain on bedroom ceiling", "Possible roof leak after last week's rain.", "high", "open", 1, 1, 2],
    ["Replace smoke detector batteries", "Annual check due.", "low", "resolved", 4, 5, 12],
    ["Front door lock sticking", "Key sometimes needs two attempts.", "medium", "in_progress", 5, 6, 6],
    ["Garage door remote", "Remote works intermittently.", "low", "open", 3, 4, 3],
    ["Dishwasher not draining", "Standing water after cycles.", "medium", "closed", 4, 5, 18],
    ["Hallway light flickering", "Fixture replaced by electrician.", "low", "closed", 6, 7, 25],
  ];
  const issues: Issue[] = issueRows.map(([title, description, severity, status, unit, ten, age], i) => ({
    id: `issue_${i + 1}`,
    title,
    description,
    severity,
    status,
    unit_id: `unit_${unit}`,
    tenant_id: ten ? `tenant_${ten}` : null,
    unit: { id: `unit_${unit}`, name: units[unit - 1].name },
    tenant: ten ? { id: `tenant_${ten}`, full_name: tenants[ten - 1].full_name } : null,
    created_at: ago(age),
    updated_at: ago(Math.max(0, age - 1)),
  }));

  const notifications: Notification[] = [
    { id: "n1", title: "Rent due soon", body: "3 payments are due this week.", kind: "rent", created_at: ago(0) },
    { id: "n2", title: "New issue reported", body: "Heating not working at Harbor View 4B.", kind: "issue", created_at: ago(1) },
    { id: "n3", title: "Lease ending", body: "Ethan Park's lease ends in 45 days.", kind: "lease", read_at: ago(0.5), created_at: ago(2) },
  ];
  return { units, tenants, payments, issues, notifications };
}

const sevRank = { low: 0, medium: 1, high: 2, critical: 3 } as const;
const statusRank = { open: 0, in_progress: 1, resolved: 2, closed: 3 } as const;

function page<T>(all: T[], q: URLSearchParams) {
  const p = Number(q.get("page") || 1);
  const limit = Number(q.get("limit") || 20);
  const items = all.slice((p - 1) * limit, p * limit);
  return { items, page: p, limit, total: all.length, hasMore: p * limit < all.length };
}

export async function demoRequest(path: string, init: RequestInit = {}): Promise<any> {
  seed ??= build();
  const s = seed;
  const method = (init.method || "GET").toUpperCase();
  const [pathname, qs = ""] = path.split("?");
  const q = new URLSearchParams(qs);
  const seg = pathname.replace(/^\/+/, "").split("/"); // api v1 <res> [id] [action]
  const [, , res, id, action] = seg;
  await new Promise((r) => setTimeout(r, 40));

  if (res === "me") return { userId: "user_demo", orgId: ORG };

  if (method !== "GET") {
    if (res === "payments" && action === "pay") {
      s.payments = s.payments.map((x) => (x.id === id ? { ...x, status: "paid" as const, paid_at: new Date().toISOString() } : x));
    }
    if (res === "issues" && id) {
      const body = init.body ? JSON.parse(String(init.body)) : {};
      s.issues = s.issues.map((x) => (x.id === id ? { ...x, ...body } : x));
    }
    if (res === "notifications") s.notifications = s.notifications.map((x) => ({ ...x, read_at: x.read_at ?? new Date().toISOString() }));
    return {};
  }

  switch (res) {
    case "units": {
      if (id) return s.units.find((u) => u.id === id);
      const term = (q.get("q") || "").toLowerCase();
      return page(s.units.filter((u) => !term || `${u.name} ${u.address}`.toLowerCase().includes(term)), q);
    }
    case "tenants": {
      if (id) return s.tenants.find((t) => t.id === id);
      const term = (q.get("q") || "").toLowerCase();
      const sort = (q.get("sort") || "name") as "name" | "lease_start" | "lease_end" | "created_at";
      const dir = q.get("order") === "desc" ? -1 : 1;
      const key = (t: Tenant) => (sort === "name" ? t.full_name : sort === "lease_start" ? t.lease_start : sort === "lease_end" ? t.lease_end : t.created_at) ?? "";
      const all = s.tenants
        .filter((t) => !term || t.full_name.toLowerCase().includes(term))
        .filter((t) => !q.get("unit_id") || t.unit_id === q.get("unit_id"))
        .sort((a, b) => key(a).localeCompare(key(b)) * dir);
      return page(all, q);
    }
    case "payments": {
      const from = q.get("from");
      const to = q.get("to");
      let all = s.payments.filter(
        (p) =>
          (!q.get("status") || p.status === q.get("status")) &&
          (!q.get("tenant_id") || p.tenant_id === q.get("tenant_id")) &&
          (!from || p.due_date >= from) &&
          (!to || p.due_date <= to)
      );
      all = all.sort((a, b) => a.due_date.localeCompare(b.due_date));
      return { items: all, page: 1, limit: all.length, total: all.length, hasMore: false };
    }
    case "issues": {
      let all = s.issues.filter((i) => (!q.get("severity") || i.severity === q.get("severity")) && (!q.get("status") || i.status === q.get("status")));
      const sort = q.get("sort") || "created_at";
      const dir = q.get("order") === "asc" ? 1 : -1;
      all = all.sort((a, b) => {
        if (sort === "severity") return (sevRank[a.severity] - sevRank[b.severity]) * dir;
        if (sort === "status") return (statusRank[a.status] - statusRank[b.status]) * dir;
        if (sort === "title") return a.title.localeCompare(b.title) * dir;
        return a.created_at.localeCompare(b.created_at) * dir;
      });
      return page(all, q);
    }
    case "notifications": {
      const only = q.get("only_unread") === "true";
      const all = s.notifications.filter((n) => !only || !n.read_at);
      return { ...page(all, q), total: all.length };
    }
    default:
      return {};
  }
}
