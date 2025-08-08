import request from "supertest";
import {
  makeTestApp,
  resetSupabase,
  resetAuthTokens,
  setValidToken,
  makeAuthHeader,
  setTableData,
  setInsertError,
} from "./utils.js";
import { describe, it, beforeEach, expect } from "vitest";

beforeEach(() => {
  resetSupabase();
  resetAuthTokens();
  setValidToken("valid", { sub: "u1", sid: "s1", org_id: "org1" });
});

describe("/v1/seed", () => {
  it("is not registered when ENABLE_SEED=false", async () => {
    const app = await makeTestApp({ enableSeed: false });
    const res = await request(app.server)
      .post("/v1/seed")
      .set(makeAuthHeader("valid"))
      .send({});
    expect(res.status).toBe(404);
  });

  it("seeds DB when ENABLE_SEED=true", async () => {
    // Start with empty tables
    setTableData("orgs", []);
    setTableData("units", []);
    setTableData("tenants", []);
    setTableData("payments", []);
    const app = await makeTestApp({ enableSeed: true });
    const res = await request(app.server)
      .post("/v1/seed")
      .set(makeAuthHeader("valid"))
      .send({ org_name: "Demo Org" });
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ orgs: 1, units: 2, tenants: 2, payments: 4 });
  });

  it("returns 400 on insertion error", async () => {
    setInsertError("orgs", "cannot insert");
    const app = await makeTestApp({ enableSeed: true });
    const res = await request(app.server)
      .post("/v1/seed")
      .set(makeAuthHeader("valid"))
      .send({ org_name: "Bad Org" });
    expect(res.status).toBe(400);
  });
});
