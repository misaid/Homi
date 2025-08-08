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

describe("/v1/payments listing", () => {
  it("lists payments for the authenticated org with filters and pagination", async () => {
    setTableData("payments", [
      {
        id: "p1",
        org_id: "org1",
        tenant_id: "t1",
        due_date: "2025-01-01",
        amount: 100,
        status: "due",
        method: "cash",
      },
      {
        id: "p2",
        org_id: "org1",
        tenant_id: "t2",
        due_date: "2025-02-01",
        amount: 200,
        status: "due",
        method: "cash",
      },
      {
        id: "p3",
        org_id: "org2",
        tenant_id: "t3",
        due_date: "2025-01-01",
        amount: 300,
        status: "paid",
        method: "cash",
      },
    ]);
    const app = await makeTestApp();
    const res = await request(app.server)
      .get("/v1/payments?status=due&page=1&limit=1")
      .set(makeAuthHeader("valid-org1"));
    expect(res.status).toBe(200);
    expect(res.body.items).toHaveLength(1);
    expect(res.body.total).toBe(2);
    expect(res.body.hasMore).toBe(true);
  });

  it("400 when missing org in auth", async () => {
    const app = await makeTestApp();
    const res = await request(app.server)
      .get("/v1/payments")
      .set(makeAuthHeader("valid-no-org"));
    expect(res.status).toBe(400);
  });

  it("500 when DB error occurs", async () => {
    setSelectError("payments", "db exploded");
    const app = await makeTestApp();
    const res = await request(app.server)
      .get("/v1/payments")
      .set(makeAuthHeader("valid-org1"));
    expect(res.status).toBeGreaterThanOrEqual(500);
  });
});
