import { describe, expect, it } from "vitest";
import { assuranceLevels, decideGate, tokenAal } from "./gate";

const base = { userId: "u1", staffRole: "super_admin", currentLevel: "aal1", nextLevel: "aal1" };

describe("decideGate", () => {
  it("signed out without a user", () => {
    expect(decideGate({ ...base, userId: null }).status).toBe("signed_out");
  });
  it("ok for staff without a factor", () => {
    expect(decideGate(base)).toEqual({ status: "ok", id: "u1", role: "super_admin" });
  });
  it("mfa_required when a verified factor exists but session is aal1", () => {
    expect(decideGate({ ...base, nextLevel: "aal2" }).status).toBe("mfa_required");
  });
  it("mfa_required takes priority over non-staff", () => {
    expect(decideGate({ ...base, staffRole: null, nextLevel: "aal2" }).status).toBe("mfa_required");
  });
  it("ok at aal2", () => {
    expect(decideGate({ ...base, currentLevel: "aal2", nextLevel: "aal2" }).status).toBe("ok");
  });
  it("not_staff for null / invalid role or failed lookup", () => {
    expect(decideGate({ ...base, staffRole: null }).status).toBe("not_staff");
    expect(decideGate({ ...base, staffRole: "nope" }).status).toBe("not_staff");
    expect(decideGate({ ...base, lookupFailed: true }).status).toBe("not_staff");
  });
  it("pre-migration lets an authenticated user through as super_admin", () => {
    expect(decideGate({ ...base, preMigration: true, staffRole: undefined })).toEqual({
      status: "ok",
      id: "u1",
      role: "super_admin",
    });
  });
});

const jwt = (payload: object) => `h.${Buffer.from(JSON.stringify(payload)).toString("base64url")}.sig`;

describe("assuranceLevels", () => {
  it("reads aal from the token and demands aal2 once a factor is verified", () => {
    expect(tokenAal(jwt({ aal: "aal1" }))).toBe("aal1");
    expect(tokenAal("garbage")).toBeNull();
    expect(assuranceLevels([{ status: "verified" }], jwt({ aal: "aal1" }))).toEqual({ currentLevel: "aal1", nextLevel: "aal2" });
    expect(assuranceLevels([{ status: "verified" }], jwt({ aal: "aal2" }))).toEqual({ currentLevel: "aal2", nextLevel: "aal2" });
  });

  it("ignores unverified factors", () => {
    expect(assuranceLevels([{ status: "unverified" }], jwt({ aal: "aal1" }))).toEqual({ currentLevel: "aal1", nextLevel: "aal1" });
    expect(assuranceLevels(undefined, jwt({ aal: "aal1" })).nextLevel).toBe("aal1");
  });
});

describe("decideGate — temporary password", () => {
  it("sends staff with a temporary password to the password change, after the MFA step", () => {
    expect(decideGate({ ...base, mustChangePassword: true }).status).toBe("password_change");
    expect(decideGate({ ...base, mustChangePassword: true, nextLevel: "aal2" }).status).toBe("mfa_required");
    expect(decideGate({ ...base, staffRole: null, mustChangePassword: true }).status).toBe("not_staff");
  });
});
