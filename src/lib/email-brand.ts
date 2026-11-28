/** Branded PracticeMD email layout, signature, starter templates and enquiry emails. Pure string building, no I/O. */
import logo from "@/assets/email/practicemd-email-logo@2x.png.asset.json";
import { escapeHtml } from "./mail-utils";

export const SITE_URL = "https://practicemd.uk";
export const LOGO_URL = `${SITE_URL}${logo.url}`;
export const LINKEDIN_URL = "https://www.linkedin.com/company/rotacare-uk/";
export const REPLY_PROMISE = "within 1 working day";
const C = { forest: "#0B5D4E", teal: "#14B8A6", mint: "#E6F5F1", text: "#283338", line: "#cae1e2", muted: "#5b6b70" };
const FONT = "Arial, Helvetica, sans-serif";

export type SignatureFields = { name?: string; role?: string; phone?: string; bookingUrl?: string };

const safeUrl = (u: string | undefined) => (u && /^https:\/\/[^\s"'<>]+$/i.test(u.trim()) ? u.trim() : "");

/** Branded signature card built only from escaped fields. Empty when no name is set. */
export function signatureHtml(s: SignatureFields | null | undefined) {
  if (!s?.name?.trim()) return "";
  const e = (v?: string) => escapeHtml((v ?? "").trim());
  const booking = safeUrl(s.bookingUrl);
  return `<table role="presentation" cellpadding="0" cellspacing="0" style="margin-top:8px;border-left:3px solid ${C.teal};font-family:${FONT}">`
    + `<tr><td style="padding:4px 0 4px 12px;font-size:14px;line-height:20px;color:${C.text}">`
    + `<strong style="color:${C.forest}">${e(s.name)}</strong>${s.role?.trim() ? `<br>${e(s.role)}` : ""}<br>PracticeMD · Practice Management Dashboards`
    + `${s.phone?.trim() ? `<br>${e(s.phone)}` : ""}`
    + `<br><a href="${SITE_URL}" style="color:${C.forest}">practicemd.uk</a> · <a href="${LINKEDIN_URL}" style="color:${C.forest}">LinkedIn</a>`
    + `${booking ? `<br><a href="${escapeHtml(booking)}" style="color:${C.teal};font-weight:bold">Book a 15-minute call</a>` : ""}`
    + `</td></tr></table>`;
}

/** Wrap message HTML in the PracticeMD layout (600px card, logo header, footer). Inline styles only. */
export function brandEmail(bodyHtml: string, preheader = "") {
  return `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="light only"><meta name="supported-color-schemes" content="light"><title>PracticeMD</title></head>`
    + `<body style="margin:0;padding:0;background:#ffffff">`
    + (preheader ? `<div style="display:none;max-height:0;overflow:hidden;opacity:0">${escapeHtml(preheader)}</div>` : "")
    + `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#ffffff"><tr><td align="center" style="padding:24px 12px">`
    + `<table role="presentation" width="600" cellpadding="0" cellspacing="0" style="width:100%;max-width:600px;border:1px solid ${C.line};border-radius:12px;overflow:hidden;background:#ffffff">`
    + `<tr><td style="height:6px;background:${C.forest};font-size:0;line-height:0">&nbsp;</td></tr>`
    + `<tr><td style="padding:22px 28px 16px;border-bottom:2px solid ${C.teal}"><a href="${SITE_URL}"><img src="${LOGO_URL}" width="200" height="44" alt="PracticeMD" style="display:block;border:0;width:200px;height:auto"></a></td></tr>`
    + `<tr><td style="padding:24px 28px;font-family:${FONT};font-size:15px;line-height:24px;color:${C.text}">${bodyHtml}</td></tr>`
    + `<tr><td style="padding:18px 28px;background:${C.mint};font-family:${FONT};font-size:12px;line-height:18px;color:${C.muted}">`
    + `<strong style="color:${C.forest}">PracticeMD</strong> · Practice Management Dashboards for UK primary care<br>`
    + `<a href="${SITE_URL}" style="color:${C.forest}">practicemd.uk</a> · <a href="${LINKEDIN_URL}" style="color:${C.forest}">LinkedIn</a><br>`
    + `This is a business email from PracticeMD. Please don't send patient-identifiable information by email.</td></tr>`
    + `</table></td></tr></table></body></html>`;
}

/** True when the HTML is already a full branded email (avoid wrapping twice). */
export const isBranded = (html: string) => html.includes(LOGO_URL);

const button = (href: string, label: string) =>
  `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:18px 0"><tr><td style="background:${C.forest};border-radius:999px"><a href="${href}" style="display:inline-block;padding:12px 22px;font-family:${FONT};font-size:14px;font-weight:bold;color:#ffffff;text-decoration:none">${label}</a></td></tr></table>`;

export type EnquiryForEmail = {
  name: string; email: string; practice?: string | null; message: string;
  interests?: string[] | null; contact_preference?: string | null; timeline?: string | null;
};

export function firstName(name: string) {
  return (name.trim().split(/\s+/)[0] ?? "").slice(0, 50) || "there";
}

/** Confirmation sent to someone after they contact PracticeMD (form or chat). */
export function enquiryConfirmation(e: EnquiryForEmail) {
  const rows: [string, string][] = [["Practice", e.practice ?? ""], ["Interested in", (e.interests ?? []).join(", ")], ["Preferred contact", e.contact_preference ?? ""], ["Timeline", e.timeline ?? ""]];
  const filled = rows.filter(([, v]) => v.trim());
  const message = e.message.trim().slice(0, 600);
  const summary = `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:16px 0;background:${C.mint};border-radius:10px"><tr><td style="padding:14px 16px;font-family:${FONT};font-size:14px;line-height:21px;color:${C.text}">`
    + filled.map(([k, v]) => `<strong style="color:${C.forest}">${k}:</strong> ${escapeHtml(v)}<br>`).join("")
    + `<strong style="color:${C.forest}">Your message:</strong><br>${escapeHtml(message).replace(/\n/g, "<br>")}</td></tr></table>`;
  const hi = escapeHtml(firstName(e.name));
  const html = brandEmail(
    `<h1 style="margin:0 0 12px;font-size:22px;line-height:30px;color:${C.forest};font-family:Georgia,serif;font-weight:normal">Thanks, ${hi} — we've got your message</h1>`
    + `<p style="margin:0 0 12px">Thank you for getting in touch with PracticeMD. Here's a copy of what you sent us:</p>${summary}`
    + `<p style="margin:0 0 8px"><strong style="color:${C.forest}">What happens next</strong></p>`
    + `<p style="margin:0 0 12px">A member of the team will reply ${REPLY_PROMISE}. If it helps, we can start with a relaxed 15-minute call to look at which reports take up most of your time.</p>`
    + `<p style="margin:0 0 12px">PracticeMD works from reports your practice already exports — there's no live connection to your clinical system.</p>`
    + button(`${SITE_URL}/demos`, "Explore the demo dashboards")
    + `<p style="margin:0">Simply reply to this email if you'd like to add anything.</p><p style="margin:16px 0 0">Best wishes,<br><strong style="color:${C.forest}">The PracticeMD team</strong></p>`,
    "Thanks for contacting PracticeMD — here's what happens next.",
  );
  const text = [`Thanks, ${firstName(e.name)} — we've got your message`, "", "Thank you for getting in touch with PracticeMD. Here's a copy of what you sent us:", "",
    ...filled.map(([k, v]) => `${k}: ${v}`), `Your message: ${message}`, "",
    `What happens next: a member of the team will reply ${REPLY_PROMISE}. We can start with a relaxed 15-minute call.`,
    "PracticeMD works from reports your practice already exports — there's no live connection to your clinical system.", "",
    `Explore the demo dashboards: ${SITE_URL}/demos`, "", "Best wishes,", "The PracticeMD team", "practicemd.uk"].join("\n");
  return { subject: "Thanks for contacting PracticeMD", html, text };
}

/** Starter reply templates (body only; the layout and signature are added when sending). */
export const STARTER_TEMPLATES: { name: string; html: string }[] = [
  { name: "Thanks for your enquiry", html: "<p>Hi [name],</p><p>Thank you for getting in touch with PracticeMD. I've read your message and I'd be glad to help.</p><p>Would a quick 15-minute call this week suit you? Let me know a couple of times that work and I'll send an invite.</p>" },
  { name: "Booking your introductory call", html: "<p>Hi [name],</p><p>Thanks for agreeing to a quick call. I've pencilled in [day and time] — I'll send a calendar invite shortly.</p><p>If you can, have one routine report in mind that takes up a lot of time. Please don't send any patient-identifiable data beforehand.</p>" },
  { name: "Sharing the demo dashboards", html: `<p>Hi [name],</p><p>As promised, here are our interactive demo dashboards. They use made-up sample data, so feel free to click around:</p><p><a href="${SITE_URL}/demos">${SITE_URL}/demos</a></p><p>Let me know which ones feel closest to what your practice needs.</p>` },
  { name: "Follow-up after a call", html: "<p>Hi [name],</p><p>Thank you for your time today — it was great to hear how your team works.</p><p>As discussed, the next step is [next step]. I'll be in touch by [date], but do reply if anything comes up in the meantime.</p>" },
  { name: "Checking in after no reply", html: "<p>Hi [name],</p><p>I just wanted to check in on my last email in case it got buried. No pressure at all — if now isn't the right time, just let me know and I'll leave it with you.</p>" },
];
