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
});

describe("/v1/me", () => {
  it("returns userId and orgId from req.auth", async () => {
    setValidToken("valid", {
      sub: "user_42",
      sid: "sess_99",
      org_id: "org_abc",
      email: "test@example.com",
    });
    const app = await makeTestApp();
    const res = await request(app.server)
      .get("/v1/me")
      .set(makeAuthHeader("valid"));
    expect(res.status).toBe(200);
    expect(res.body.userId).toBe("user_42");
    expect(res.body.orgId).toBe("org_abc");
    // sessionId is not currently returned by the implementation.
  });

  it("401 when not authenticated", async () => {
    const app = await makeTestApp();
    const res = await request(app.server).get("/v1/me");
    expect(res.status).toBe(401);
  });
});
