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

const RANK: Record<string, number> = { draft: 0, scheduled: 1, sending: 1, sent: 2, delivered: 3, opened: 4, clicked: 5 };
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


export const MAX_SCHEDULE_DAYS = 30;
export const MAX_SNOOZE_DAYS = 365;

/** Why a "send later" time can't be used, or null when it's fine: at least a minute ahead, at most 30 days (Resend's limit). */
export function scheduleProblem(at: Date, now: Date = new Date()): string | null {
  const ms = at.getTime() - now.getTime();
  if (Number.isNaN(ms)) return "Choose a valid date and time.";
  if (ms < 60_000) return "Choose a time at least a minute from now.";
  if (ms > MAX_SCHEDULE_DAYS * 86400_000) return `Emails can be scheduled up to ${MAX_SCHEDULE_DAYS} days ahead.`;
  return null;
}

/** Why a snooze time can't be used, or null when it's fine. */
export function snoozeProblem(until: Date, now: Date = new Date()): string | null {
  const ms = until.getTime() - now.getTime();
  if (Number.isNaN(ms)) return "Choose a valid date and time.";
  if (ms < 60_000) return "Choose a time in the future.";
  if (ms > MAX_SNOOZE_DAYS * 86400_000) return "Snooze for at most a year.";
  return null;
}

/** Quick picks used by Snooze and Schedule send, in the viewer's local time. */
export function quickTimes(now: Date = new Date()) {
  const at = (days: number, hour: number) => { const d = new Date(now); d.setDate(d.getDate() + days); d.setHours(hour, 0, 0, 0); return d; };
  const laterToday = new Date(now.getTime() + 3 * 3600_000);
  laterToday.setMinutes(0, 0, 0);
  const daysToMonday = ((8 - now.getDay()) % 7) || 7;
  const list = [
    { label: "Later today", at: laterToday },
    { label: "Tomorrow morning", at: at(1, 8) },
    { label: "Tomorrow afternoon", at: at(1, 13) },
    { label: "Next Monday morning", at: at(daysToMonday, 8) },
  ];
  return list.filter((o) => o.label !== "Later today" || o.at.getDate() === now.getDate());
}

/** Plain text (signature or template typed in Settings) to safe email HTML. */
export function textToHtml(text: string) {
  return escapeHtml(text.trim()).replace(/\r?\n/g, "<br>");
}
