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