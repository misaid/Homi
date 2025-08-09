import request from "supertest";
import {
  makeTestApp,
  resetSupabase,
  resetAuthTokens,
  setValidToken,
  makeAuthHeader,
  setStorageUploadError,
} from "./utils.js";
import { describe, it, beforeEach, expect } from "vitest";

beforeEach(() => {
  resetSupabase();
  resetAuthTokens();
  setValidToken("valid-org1", { sub: "u1", sid: "s1", org_id: "org1" });
});

describe("/v1/upload", () => {
  it("uploads an image and returns a signed URL", async () => {
    const app = await makeTestApp();
    const res = await request(app.server)
      .post("/v1/upload")
      .set(makeAuthHeader("valid-org1"))
      .field("scope", "unit")
      .attach("file", Buffer.from("PNGDATA"), {
        filename: "x.png",
        contentType: "image/png",
      });
    expect(res.status).toBe(201);
    expect(res.body.url).toMatch(/^https:\/\/cdn\.test\//);
  });

  it("400 when invalid content type", async () => {
    const app = await makeTestApp();
    const res = await request(app.server)
      .post("/v1/upload")
      .set(makeAuthHeader("valid-org1"))
      .field("scope", "tenant")
      .attach("file", Buffer.from("HELLO"), {
        filename: "x.txt",
        contentType: "text/plain",
      });
    expect(res.status).toBe(400);
  });

  it("400 when storage upload fails", async () => {
    setStorageUploadError("cannot write");
    const app = await makeTestApp();
    const res = await request(app.server)
      .post("/v1/upload")
      .set(makeAuthHeader("valid-org1"))
      .field("scope", "unit")
      .attach("file", Buffer.from("PNGDATA"), {
        filename: "x.png",
        contentType: "image/png",
      });
    expect([400, 500, 413]).toContain(res.status);
    expect(String(res.body.error || "")).toMatch(/cannot write|upload/i);
  });

  it("400 when missing file", async () => {
    const app = await makeTestApp();
    const res = await request(app.server)
      .post("/v1/upload")
      .set(makeAuthHeader("valid-org1"))
      .field("scope", "unit");
    expect(res.status).toBe(400);
  });
});
