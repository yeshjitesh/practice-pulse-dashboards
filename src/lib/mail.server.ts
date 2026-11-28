import { makeSnippet, normalizeSubject, nextStatus, parseAddress, parseIdList, BIN_RETENTION_DAYS } from "./mail-utils";

export const MAIL_FROM_ADDRESS = "hello@practicemd.uk";
export const MAIL_FROM_NAME = "PracticeMD";
export const MAIL_DOMAIN = "practicemd.uk";
export const WEBHOOK_URL = "https://practicemd.uk/api/public/resend-webhook";
export const WEBHOOK_EVENTS = [
  "email.received", "email.sent", "email.delivered", "email.delivery_delayed", "email.opened",
  "email.clicked", "email.bounced", "email.complained", "email.failed",
];

const GATEWAY_URL = "https://connector-gateway.lovable.dev/resend";

export async function requireAdmin() {
  const { requireAdminGate } = await import("./admin-gate.server");
  await requireAdminGate();
}

export async function db() {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  return supabaseAdmin;
}

/** Call Resend through the connector gateway. Throws with the provider's status and body on failure. */
export async function resend<T = unknown>(path: string, init: { method?: string; body?: unknown; idempotencyKey?: string } = {}): Promise<T> {
  const lovableKey = process.env["LOVABLE_API_KEY"];
  const resendKey = process.env["RESEND_API_KEY"];
  if (!lovableKey || !resendKey) throw new Error("Email sending is not configured.");
  const response = await fetch(`${GATEWAY_URL}${path}`, {
    method: init.method ?? "GET",
    headers: {
      Authorization: `Bearer ${lovableKey}`,
      "X-Connection-Api-Key": resendKey,
      ...(init.body !== undefined ? { "Content-Type": "application/json" } : {}),
      ...(init.idempotencyKey ? { "Idempotency-Key": init.idempotencyKey } : {}),
    },
    ...(init.body !== undefined ? { body: JSON.stringify(init.body) } : {}),
  });
  if (!response.ok) {
    const text = await response.text();
    console.error(`Resend request failed [${response.status}] ${path}: ${text}`);
    throw new ResendError(response.status, text);
  }
  if (response.status === 204) return {} as T;
  return (await response.json()) as T;
}

export class ResendError extends Error {
  constructor(public status: number, public body: string) {
    super(`Resend request failed [${status}]`);
  }
}

type Sb = Awaited<ReturnType<typeof db>>;

function header(headers: unknown, name: string): string | null {
  if (!headers || typeof headers !== "object") return null;
  if (Array.isArray(headers)) {
    const found = headers.find((h) => typeof h === "object" && h && String((h as { name?: string }).name).toLowerCase() === name);
    return found ? String((found as { value?: string }).value ?? "") : null;
  }
  for (const [k, v] of Object.entries(headers as Record<string, unknown>)) if (k.toLowerCase() === name) return v == null ? null : String(v);
  return null;
}

const toList = (v: unknown): string[] => (Array.isArray(v) ? v.map(String) : typeof v === "string" && v ? [v] : []);

/** Recalculate a thread's summary fields from its messages. */
export async function refreshThread(sb: Sb, threadId: string) {
  const { data: messages } = await sb.from("mail_messages")
    .select("id, direction, status, from_address, to_addresses, cc_addresses, text_body, html, subject, sent_at, mail_attachments(id)")
    .eq("thread_id", threadId).order("sent_at", { ascending: true });
  const list = messages ?? [];
  // Scheduled emails don't count as sent until Resend sends them.
  const real = list.filter((m) => m.status !== "draft" && m.status !== "scheduled");
  const last = real[real.length - 1] ?? list[list.length - 1];
  const people = new Set<string>();
  for (const m of list) {
    for (const a of [m.from_address, ...m.to_addresses, ...m.cc_addresses]) if (a && a !== MAIL_FROM_ADDRESS) people.add(a);
  }
  await sb.from("mail_threads").update({
    has_sent: real.some((m) => m.direction === "out"),
    has_draft: list.some((m) => m.status === "draft"),
    message_count: list.filter((m) => m.status !== "draft").length,
    has_attachments: real.some((m) => (m.mail_attachments ?? []).length > 0),
    participants: [...people].join(", ").slice(0, 1000),
    ...(last ? { snippet: makeSnippet(last.text_body, last.html), last_message_at: last.sent_at } : {}),
  }).eq("id", threadId);
}

/** Find the thread an email belongs to: by Message-ID chain, else same subject with the same person in the last 30 days. */
export async function findThreadId(sb: Sb, ids: string[], subject: string, counterpart: string) {
  if (ids.length) {
    const { data } = await sb.from("mail_messages").select("thread_id").in("message_id_header", ids).limit(1);
    if (data?.[0]) return data[0].thread_id;
  }
  const norm = normalizeSubject(subject);
  if (!norm || !counterpart) return null;
  const since = new Date(Date.now() - 30 * 86400_000).toISOString();
  const { data } = await sb.from("mail_threads").select("id").eq("normalized_subject", norm)
    .ilike("participants", `%${counterpart.replace(/[%_,]/g, "")}%`).gte("last_message_at", since)
    .order("last_message_at", { ascending: false }).limit(1);
  return data?.[0]?.id ?? null;
}

type ReceivedEmail = {
  id?: string; from?: string; to?: unknown; cc?: unknown; bcc?: unknown; subject?: string; html?: string | null; text?: string | null;
  headers?: unknown; message_id?: string; created_at?: string;
  attachments?: { id?: string; filename?: string; content_type?: string; size?: number }[];
};

/** Store an inbound email. Safe to call twice for the same email. */
export async function ingestInbound(emailId: string, eventData: ReceivedEmail) {
  const sb = await db();
  const { data: existing } = await sb.from("mail_messages").select("id").eq("provider_id", emailId).maybeSingle();
  if (existing) return;
  let email: ReceivedEmail = eventData;
  try {
    email = { ...eventData, ...(await resend<ReceivedEmail>(`/emails/receiving/${encodeURIComponent(emailId)}`)) };
  } catch (error) {
    console.error("Couldn't fetch the full received email; storing webhook details only", error);
  }
  const from = parseAddress(email.from ?? "");
  const subject = (email.subject ?? "").slice(0, 998);
  const messageId = email.message_id ?? header(email.headers, "message-id");
  const inReplyTo = header(email.headers, "in-reply-to");
  const references = header(email.headers, "references");
  const chain = [...parseIdList(references), ...parseIdList(inReplyTo)];

  let threadId = await findThreadId(sb, chain, subject, from.address);
  if (!threadId) {
    const { data, error } = await sb.from("mail_threads").insert({ subject: subject || "(no subject)", normalized_subject: normalizeSubject(subject), folder: "inbox" }).select("id").single();
    if (error || !data) throw new Error("Couldn't create the conversation.");
    threadId = data.id;
  }
  const { data: message, error } = await sb.from("mail_messages").insert({
    thread_id: threadId, direction: "in", status: "received", provider_id: emailId,
    message_id_header: messageId ? (parseIdList(messageId)[0] ?? messageId) : null,
    in_reply_to: inReplyTo, references_header: references,
    from_address: from.address, from_name: from.name.slice(0, 200),
    to_addresses: toList(email.to).map((a) => parseAddress(a).address).slice(0, 100),
    cc_addresses: toList(email.cc).map((a) => parseAddress(a).address).slice(0, 100),
    subject, html: email.html ?? null, text_body: email.text ?? null,
    sent_at: email.created_at ? new Date(email.created_at).toISOString() : new Date().toISOString(),
  }).select("id").single();
  if (error?.code === "23505") return; // a concurrent delivery stored it first
  if (error || !message) throw new Error("Couldn't store the email.");

  const attachments = (email.attachments ?? []).slice(0, 50);
  if (attachments.length) {
    await sb.from("mail_attachments").insert(attachments.map((a) => ({
      message_id: message.id, filename: (a.filename ?? "attachment").slice(0, 255),
      content_type: a.content_type ?? "application/octet-stream", size: a.size ?? 0, provider_attachment_id: a.id ?? null,
    })));
  }
  const { data: thread } = await sb.from("mail_threads").select("folder").eq("id", threadId).single();
  const folder = thread?.folder;
  await sb.from("mail_threads").update({
    unread: true, follow_up_at: null,
    ...(folder === "sent" || folder === "drafts" || folder === "archive" || folder === "bin" || folder === "snoozed"
      ? { folder: "inbox", binned_at: null, snoozed_until: null, previous_folder: null } : {}),
  }).eq("id", threadId);
  await autoLinkEnquiry(sb, threadId, [from.address]);
  await refreshThread(sb, threadId);
}

/** Record a delivery event for a sent email. Duplicate deliveries are ignored. */
export async function recordDeliveryEvent(eventId: string, type: string, emailId: string, occurredAt: string | undefined, detail: string | null) {
  const sb = await db();
  const { data: message } = await sb.from("mail_messages").select("id, status, thread_id").eq("provider_id", emailId).maybeSingle();
  if (!message) return;
  const { error } = await sb.from("mail_events").insert({
    message_id: message.id, provider_event_id: eventId, type: type.replace("email.", ""),
    detail: detail?.slice(0, 500) ?? null, occurred_at: occurredAt ? new Date(occurredAt).toISOString() : new Date().toISOString(),
  });
  if (error?.code === "23505") return;
  const status = nextStatus(message.status, type);
  if (status === message.status) return;
  const wasScheduled = message.status === "scheduled";
  await sb.from("mail_messages").update({ status, ...(wasScheduled ? { sent_at: occurredAt ? new Date(occurredAt).toISOString() : new Date().toISOString() } : {}) }).eq("id", message.id);
  if (wasScheduled) {
    await refreshThread(sb, message.thread_id);
    const { data: t } = await sb.from("mail_threads").select("enquiry_id").eq("id", message.thread_id).single();
    if (t?.enquiry_id) await sb.from("contact_submissions").update({ status: "replied" }).eq("id", t.enquiry_id).eq("status", "new");
  }
}

/** Remove storage files belonging to the given threads. */
export async function removeThreadFiles(sb: Sb, threadIds: string[]) {
  if (!threadIds.length) return;
  const { data } = await sb.from("mail_messages").select("mail_attachments(storage_path)").in("thread_id", threadIds);
  const paths = (data ?? []).flatMap((m) => (m.mail_attachments ?? []).map((a) => a.storage_path)).filter((p): p is string => !!p);
  if (paths.length) await sb.storage.from("mail-attachments").remove(paths);
}

/** Delete conversations that have been in the Bin longer than the retention period. */
export async function purgeOldBin(sb: Sb) {
  const cutoff = new Date(Date.now() - BIN_RETENTION_DAYS * 86400_000).toISOString();
  const { data } = await sb.from("mail_threads").select("id").eq("folder", "bin").lt("binned_at", cutoff).limit(200);
  const ids = (data ?? []).map((t) => t.id);
  if (!ids.length) return;
  await removeThreadFiles(sb, ids);
  await sb.from("mail_threads").delete().in("id", ids);
}

/** Return snoozed conversations whose time has come to where they were, marked unread. */
export async function wakeSnoozed(sb: Sb) {
  const { data } = await sb.from("mail_threads").select("id, previous_folder, custom_folder_id")
    .eq("folder", "snoozed").lte("snoozed_until", new Date().toISOString()).limit(200);
  for (const t of data ?? []) {
    let folder = t.previous_folder && t.previous_folder !== "snoozed" && t.previous_folder !== "bin" ? t.previous_folder : "inbox";
    if (folder === "custom" && !t.custom_folder_id) folder = "inbox";
    await sb.from("mail_threads").update({ folder, previous_folder: null, snoozed_until: null, unread: true }).eq("id", t.id);
  }
}

/** Link a conversation to the latest contact enquiry from one of these addresses, unless it's already linked. */
export async function autoLinkEnquiry(sb: Sb, threadId: string, addresses: string[]) {
  const list = [...new Set(addresses.map((a) => a.trim().toLowerCase()).filter((a) => a && a !== MAIL_FROM_ADDRESS))].slice(0, 20);
  if (!list.length) return;
  const { data: thread } = await sb.from("mail_threads").select("enquiry_id").eq("id", threadId).maybeSingle();
  if (!thread || thread.enquiry_id) return;
  const { data: enquiries } = await sb.from("contact_submissions").select("id, email").order("created_at", { ascending: false }).limit(500);
  const match = (enquiries ?? []).find((e) => list.includes(e.email.trim().toLowerCase()));
  if (match) await sb.from("mail_threads").update({ enquiry_id: match.id }).eq("id", threadId);
}

/** Email a branded confirmation to the person behind an enquiry, once. It lands in Mail (Inbox, unread) linked to the enquiry, so replies thread there. Never throws. */
export async function sendEnquiryConfirmation(enquiryId: string) {
  try {
    const sb = await db();
    const { data: e } = await sb.from("contact_submissions").select("id, name, email, practice, message, interests, contact_preference, timeline").eq("id", enquiryId).maybeSingle();
    if (!e) return;
    const { data: already } = await sb.from("mail_threads").select("id").eq("enquiry_id", enquiryId).eq("has_sent", true).limit(1);
    if (already?.length) return;
    const { enquiryConfirmation } = await import("./email-brand");
    const c = enquiryConfirmation(e);
    const messageId = `<enquiry-${enquiryId}@${MAIL_DOMAIN}>`;
    const sent = await resend<{ id: string }>("/emails", {
      method: "POST", idempotencyKey: `enquiry-confirm-${enquiryId}`,
      body: { from: `${MAIL_FROM_NAME} <${MAIL_FROM_ADDRESS}>`, to: [e.email], reply_to: MAIL_FROM_ADDRESS, subject: c.subject, html: c.html, text: c.text, headers: { "Message-ID": messageId } },
    });
    const { data: dup } = await sb.from("mail_messages").select("id").eq("provider_id", sent.id).maybeSingle();
    if (dup) return;
    const { data: t } = await sb.from("mail_threads").insert({
      subject: c.subject, normalized_subject: normalizeSubject(c.subject), folder: "inbox", unread: true, enquiry_id: enquiryId,
    }).select("id").single();
    if (!t) return;
    const { data: msg } = await sb.from("mail_messages").insert({
      thread_id: t.id, direction: "out", status: "sent", provider_id: sent.id, message_id_header: messageId,
      from_address: MAIL_FROM_ADDRESS, from_name: MAIL_FROM_NAME, to_addresses: [e.email], subject: c.subject, html: c.html, text_body: c.text,
    }).select("id").single();
    if (msg) await sb.from("mail_events").insert({ message_id: msg.id, type: "sent" });
    await refreshThread(sb, t.id);
  } catch (error) {
    console.error("Enquiry confirmation email failed", error);
  }
}
