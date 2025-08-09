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

describe("/v1/units listing", () => {
  it("lists units for the authenticated org with pagination", async () => {
    const now = new Date().toISOString();
    setTableData("units", [
      {
        id: "a1",
        org_id: "org1",
        name: "Alpha",
        address: "X",
        monthly_rent: 100,
        created_at: now,
      },
      {
        id: "a2",
        org_id: "org1",
        name: "Beta",
        address: "Y",
        monthly_rent: 200,
        created_at: now,
      },
      {
        id: "b1",
        org_id: "org2",
        name: "Zeta",
        address: "Z",
        monthly_rent: 300,
        created_at: now,
      },
    ]);
    const app = await makeTestApp();

    const res1 = await request(app.server)
      .get("/v1/units?page=1&limit=1")
      .set(makeAuthHeader("valid-org1"));
    expect(res1.status).toBe(200);
    expect(res1.body.items).toHaveLength(1);
    expect(res1.body.total).toBe(2);
    expect(res1.body.hasMore).toBe(true);

    const res2 = await request(app.server)
      .get("/v1/units?page=2&limit=1")
      .set(makeAuthHeader("valid-org1"));
    expect(res2.status).toBe(200);
    expect(res2.body.items[0].id).toBe("a2");

    const resSearch = await request(app.server)
      .get("/v1/units?q=Al")
      .set(makeAuthHeader("valid-org1"));
    expect(resSearch.status).toBe(200);
    expect(resSearch.body.items.map((i: any) => i.id)).toEqual(["a1"]);
  });

  it("400 when missing org in auth", async () => {
    const app = await makeTestApp();
    const res = await request(app.server)
      .get("/v1/units")
      .set(makeAuthHeader("valid-no-org"));
    expect(res.status).toBe(400);
  });

  it("400 when DB error occurs", async () => {
    setSelectError("units", "boom");
    const app = await makeTestApp();
    const res = await request(app.server)
      .get("/v1/units")
      .set(makeAuthHeader("valid-org1"));
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/boom/i);
  });
});
