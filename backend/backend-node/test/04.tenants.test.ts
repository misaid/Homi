import request from "supertest";
import {
  makeTestApp,
  resetSupabase,
  resetAuthTokens,
  setValidToken,
  makeAuthHeader,
  setTableData,
  setSelectError,
} from "./utils.js";
import { describe, it, beforeEach, expect } from "vitest";

beforeEach(() => {
  resetSupabase();
  resetAuthTokens();
  setValidToken("valid-org1", { sub: "u1", sid: "s1", org_id: "org1" });
  setValidToken("valid-no-org", { sub: "u2", sid: "s2", org_id: null });
});

describe("/v1/tenants listing", () => {
  it("lists tenants for the authenticated org", async () => {
    const now = new Date().toISOString();
    setTableData("tenants", [
      {
        id: "t1",
        org_id: "org1",
        full_name: "Alice",
        email: "a@x",
        created_at: now,
      },
      {
        id: "t2",
        org_id: "org1",
        full_name: "Bob",
        email: "b@x",
        created_at: now,
      },
      {
        id: "t3",
        org_id: "org2",
        full_name: "Zed",
        email: "z@x",
        created_at: now,
      },
    ]);
    const app = await makeTestApp();
    const res = await request(app.server)
      .get("/v1/tenants?page=1&limit=10")
      .set(makeAuthHeader("valid-org1"));
    expect(res.status).toBe(200);
    expect(res.body.items).toHaveLength(2);
    expect(res.body.total).toBe(2);
  });

  it("supports 'q' search across full_name/phone/email", async () => {
    setTableData("tenants", [
      {
        id: "t1",
        org_id: "org1",
        full_name: "Alice",
        email: "alice@example.com",
      },
      { id: "t2", org_id: "org1", full_name: "Bob", phone: "+123" },
    ]);
    const app = await makeTestApp();
    const res = await request(app.server)
      .get("/v1/tenants?q=alice")
      .set(makeAuthHeader("valid-org1"));
    expect(res.status).toBe(200);
    expect(res.body.items.map((t: any) => t.id)).toEqual(["t1"]);
  });

  it("400 when missing org in auth", async () => {
    const app = await makeTestApp();
    const res = await request(app.server)
      .get("/v1/tenants")
      .set(makeAuthHeader("valid-no-org"));
    expect(res.status).toBe(400);
  });

  it("500 when DB error occurs", async () => {
    setSelectError("tenants", "db broke");
    const app = await makeTestApp();
    const res = await request(app.server)
      .get("/v1/tenants")
      .set(makeAuthHeader("valid-org1"));
    expect(res.status).toBeGreaterThanOrEqual(500);
  });
});
