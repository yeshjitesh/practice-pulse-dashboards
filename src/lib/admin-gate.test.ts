import { describe, expect, it } from "vitest";
import { passwordMatches } from "./admin-gate.server";

describe("admin access code", () => {
  it("only accepts the exact configured code", () => {
    expect(passwordMatches("example-code", "example-code")).toBe(true);
    expect(passwordMatches("wrong", "example-code")).toBe(false);
    expect(passwordMatches("example-code ", "example-code")).toBe(false);
    expect(passwordMatches("", "example-code")).toBe(false);
  });
});
import { checkOtp, hashOtp, OTP_MAX_ATTEMPTS } from "./admin-gate.server";
describe("admin email code", () => {
  const s = "secret"; const now = 1000;
  const pending = { otpHash: hashOtp("123456", s), otpExpires: now + 600000, otpAttempts: 0 };
  it("accepts the right code within 10 minutes", () => expect(checkOtp(pending, "123456", s, now)).toBe("ok"));
  it("rejects a wrong code", () => expect(checkOtp(pending, "654321", s, now)).toBe("wrong"));
  it("rejects an expired code", () => expect(checkOtp(pending, "123456", s, now + 600001)).toBe("expired"));
  it("locks after too many attempts", () => expect(checkOtp({ ...pending, otpAttempts: OTP_MAX_ATTEMPTS }, "123456", s, now)).toBe("locked"));
  it("needs a code to have been sent", () => expect(checkOtp({}, "123456", s, now)).toBe("none"));
});
