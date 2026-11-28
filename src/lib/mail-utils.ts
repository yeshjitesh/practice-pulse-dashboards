/** Client-safe and server-safe mail helpers (no I/O). */

export const MAX_ATTACHMENT_BYTES = 10 * 1024 * 1024;
export const MAX_TOTAL_ATTACHMENT_BYTES = 20 * 1024 * 1024;
export const MAX_RECIPIENTS = 20;
export const BIN_RETENTION_DAYS = 30;

const PREFIX = /^\s*(re|fw|fwd|aw|sv)\s*(\[\d+\])?\s*:\s*/i;

/** Subject without Re:/Fwd: prefixes, lower-cased, for thread matching. */
export function normalizeSubject(subject: string) {
  let s = subject.trim();
  while (PREFIX.test(s)) s = s.replace(PREFIX, "").trim();
  return s.toLowerCase();
}

export function replySubject(subject: string) {
  return /^\s*re\s*:/i.test(subject) ? subject : `Re: ${subject}`;
}

export function forwardSubject(subject: string) {
  return /^\s*(fw|fwd)\s*:/i.test(subject) ? subject : `Fwd: ${subject}`;
}

/** "Jane Doe <jane@x.com>" -> { name, address } */
export function parseAddress(raw: string): { name: string; address: string } {
  const m = raw.match(/^\s*"?([^"<]*?)"?\s*<([^>]+)>\s*$/);
  if (m) return { name: (m[1] ?? "").trim(), address: (m[2] ?? "").trim().toLowerCase() };
  return { name: "", address: raw.trim().toLowerCase() };
}

/** Extract <id@host> tokens from Message-ID / In-Reply-To / References headers. */
export function parseIdList(value: string | null | undefined): string[] {
  if (!value) return [];
  return value.match(/<[^<>\s]+>/g) ?? [];
}

const EMAIL_RE = /^[^\s@<>,;]+@[^\s@<>,;]+\.[^\s@<>,;]+$/;
export function isEmail(value: string) {
  return value.length <= 254 && EMAIL_RE.test(value);
}

/** Split a user-typed recipient field into addresses. */
export function splitRecipients(value: string): string[] {
  return value.split(/[,;\s]+/).map((v) => parseAddress(v).address).filter(Boolean);
}

export function htmlToText(html: string) {
  return html
    .replace(/<(br|\/p|\/div|\/li|\/h\d)[^>]*>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&#39;/g, "'")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export function makeSnippet(text: string | null | undefined, html?: string | null) {
  const base = text?.trim() ? text : html ? htmlToText(html) : "";
  return base.replace(/\s+/g, " ").trim().slice(0, 160);
}

export function escapeHtml(s: string) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}

const RANK: Record<string, number> = { draft: 0, sending: 1, sent: 2, delivered: 3, opened: 4, clicked: 5 };
/** Status after a delivery event: progress only moves forward; bounce/complaint/failure always win. */
export function nextStatus(current: string, eventType: string): string {
  const map: Record<string, string> = {
    "email.sent": "sent", "email.delivered": "delivered", "email.opened": "opened", "email.clicked": "clicked",
    "email.bounced": "bounced", "email.complained": "complained", "email.failed": "failed", "email.delivery_delayed": current,
  };
  const target = map[eventType];
  if (!target) return current;
  if (target === "bounced" || target === "complained" || target === "failed") return target;
  if (current === "bounced" || current === "complained" || current === "failed") return current;
  return (RANK[target] ?? 0) > (RANK[current] ?? 0) ? target : current;
}

