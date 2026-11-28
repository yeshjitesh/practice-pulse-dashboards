import { describe, expect, it } from "vitest";
import { createHmac } from "node:crypto";
import { nextStatus, normalizeSubject, parseAddress, parseIdList, scheduleProblem, snoozeProblem, textToHtml } from "./mail-utils";
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

describe("send later and snooze", () => {
  const now = new Date("2026-11-28T12:00:00Z");
  it("allows sending later between one minute and 30 days ahead", () => {
    expect(scheduleProblem(new Date("2026-11-28T12:05:00Z"), now)).toBeNull();
    expect(scheduleProblem(new Date("2026-12-27T12:00:00Z"), now)).toBeNull();
    expect(scheduleProblem(new Date("2026-11-28T12:00:30Z"), now)).not.toBeNull();
    expect(scheduleProblem(new Date("2026-12-29T12:00:00Z"), now)).not.toBeNull();
  });
  it("only snoozes into the future", () => {
    expect(snoozeProblem(new Date("2026-11-29T08:00:00Z"), now)).toBeNull();
    expect(snoozeProblem(new Date("2026-11-28T11:00:00Z"), now)).not.toBeNull();
  });
  it("a scheduled email becomes sent when Resend sends it", () => {
    expect(nextStatus("scheduled", "email.sent")).toBe("sent");
  });
  it("signature text is escaped, never treated as HTML", () => {
    expect(textToHtml("Yesh\n<b>PracticeMD</b>")).toBe("Yesh<br>&lt;b&gt;PracticeMD&lt;/b&gt;");
  });
});
