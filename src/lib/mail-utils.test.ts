import { describe, expect, it } from "vitest";
import { createHmac } from "node:crypto";
import { nextStatus, normalizeSubject, parseAddress, parseIdList } from "./mail-utils";
import { verifySvixSignature } from "./mail-signature";

describe("thread matching", () => {
  it("ignores Re:/Fwd: prefixes when grouping by subject", () => {
    expect(normalizeSubject("RE: Fwd: re: Dashboard demo")).toBe("dashboard demo");
  });
  it("reads Message-ID tokens from References", () => {
    expect(parseIdList("<a@x.com> <b@y.com>")).toEqual(["<a@x.com>", "<b@y.com>"]);
  });
  it("splits a display name from the address", () => {
    expect(parseAddress('"Jane Doe" <Jane@Example.com>')).toEqual({ name: "Jane Doe", address: "jane@example.com" });
  });
});

describe("delivery tracking", () => {
  it("never moves a status backwards", () => {
    expect(nextStatus("opened", "email.delivered")).toBe("opened");
    expect(nextStatus("sent", "email.clicked")).toBe("clicked");
  });
  it("bounce and spam complaint always win", () => {
    expect(nextStatus("clicked", "email.bounced")).toBe("bounced");
    expect(nextStatus("bounced", "email.opened")).toBe("bounced");
  });
});

describe("webhook signature", () => {
  const secret = "whsec_" + Buffer.from("test-secret-key").toString("base64");
  const body = '{"type":"email.received"}';
  const sign = (id: string, ts: string) =>
    "v1," + createHmac("sha256", Buffer.from("test-secret-key")).update(`${id}.${ts}.${body}`).digest("base64");
  it("accepts a correctly signed, fresh request", () => {
    expect(verifySvixSignature({ id: "msg_1", timestamp: "1000", signature: sign("msg_1", "1000"), body, secret, nowSeconds: 1010 })).toBe(true);
  });
  it("rejects a tampered body, a stale timestamp and a missing signature", () => {
    expect(verifySvixSignature({ id: "msg_1", timestamp: "1000", signature: sign("msg_1", "1000"), body: body + " ", secret, nowSeconds: 1010 })).toBe(false);
    expect(verifySvixSignature({ id: "msg_1", timestamp: "1000", signature: sign("msg_1", "1000"), body, secret, nowSeconds: 5000 })).toBe(false);
    expect(verifySvixSignature({ id: "msg_1", timestamp: "1000", signature: null, body, secret, nowSeconds: 1010 })).toBe(false);
  });
});
