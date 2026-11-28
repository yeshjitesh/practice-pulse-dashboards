import { describe, expect, it } from "vitest";
import { brandEmail, enquiryConfirmation, isBranded, signatureHtml } from "./email-brand";

describe("branded emails", () => {
  it("wraps a message once, with the logo and footer", () => {
    const html = brandEmail("<p>Hello</p>");
    expect(isBranded(html)).toBe(true);
    expect(html).toContain("practicemd.uk");
    expect(isBranded("<p>Hello</p>")).toBe(false);
  });
  it("escapes everything a visitor typed into the confirmation", () => {
    const c = enquiryConfirmation({ name: "<b>Sam</b> Lee", email: "s@x.uk", message: "<script>x</script>" });
    expect(c.html).not.toContain("<script>");
    expect(c.html).toContain("&lt;b&gt;Sam&lt;/b&gt;");
    expect(c.text).toContain("within 1 working day");
  });
  it("signature only links https booking addresses", () => {
    expect(signatureHtml({ name: "Yesh", bookingUrl: "javascript:alert(1)" })).not.toContain("javascript:");
    expect(signatureHtml({ name: "Yesh", bookingUrl: "https://cal.com/yesh" })).toContain("https://cal.com/yesh");
    expect(signatureHtml({ name: "" })).toBe("");
  });
});
