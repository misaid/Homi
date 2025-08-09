import request from "supertest";
import {
  makeTestApp,
  resetSupabase,
  resetAuthTokens,
  setValidToken,
  makeAuthHeader,
} from "./utils.js";
import { describe, it, beforeEach, expect } from "vitest";

beforeEach(() => {
  resetSupabase();
  resetAuthTokens();
  setValidToken("valid", { sub: "user_1", sid: "sess_1", org_id: "org_1" });
});

describe("health and auth guard", () => {
  it("GET /healthz -> { ok: true }", async () => {
    const app = await makeTestApp();
    const res = await request(app.server).get("/healthz");
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ ok: true });
  });

  it("requires auth for /v1/* (missing token -> 401)", async () => {
    const app = await makeTestApp();
    const res = await request(app.server).get("/v1/units");
    expect(res.status).toBe(401);
  });

  it("invalid token -> 401", async () => {
    const app = await makeTestApp();
    const res = await request(app.server)
      .get("/v1/units")
      .set(makeAuthHeader("invalid"));
    expect(res.status).toBe(401);
  });

  it("valid token works (e.g. /v1/units returns 200 or 400 depending on org)", async () => {
    const app = await makeTestApp();
    const res = await request(app.server)
      .get("/v1/units")
      .set(makeAuthHeader("valid"));
    expect([200, 400]).toContain(res.status);
  });
});
