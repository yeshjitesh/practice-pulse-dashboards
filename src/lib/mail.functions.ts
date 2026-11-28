import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { MAX_ATTACHMENT_BYTES, MAX_RECIPIENTS, MAX_TOTAL_ATTACHMENT_BYTES, isEmail, normalizeSubject, scheduleProblem, snoozeProblem } from "./mail-utils";


const SYSTEM_VIEWS = ["inbox", "starred", "snoozed", "followup", "scheduled", "sent", "drafts", "archive", "spam", "bin", "folder"] as const;
export type MailView = (typeof SYSTEM_VIEWS)[number];

const listSchema = z.object({
  view: z.enum(SYSTEM_VIEWS),
  folderId: z.string().uuid().optional(),
  q: z.string().max(200).optional(),
  unread: z.boolean().optional(),
  starred: z.boolean().optional(),
  attachments: z.boolean().optional(),
});

export const getMailbox = createServerFn({ method: "POST" })
  .inputValidator((d: z.input<typeof listSchema>) => listSchema.parse(d))
  .handler(async ({ data }) => {
    const m = await import("./mail.server");
    await m.requireAdmin();
    const sb = await m.db();
    await m.purgeOldBin(sb);
    await m.wakeSnoozed(sb);
    const now = new Date().toISOString();
    let query = sb.from("mail_threads").select("*").order("last_message_at", { ascending: false }).limit(100);
    const q = (data.q ?? "").replace(/[%_,()*\\"']/g, " ").trim();
    // Like Gmail, a search outside Spam and Bin looks through every other folder.
    const globalSearch = !!q && data.view !== "bin" && data.view !== "spam";
    if (globalSearch) query = query.not("folder", "in", "(bin,spam)");
    else switch (data.view) {
      case "inbox": query = query.eq("folder", "inbox"); break;
      case "starred": query = query.eq("starred", true).neq("folder", "bin"); break;
      case "snoozed": query = query.eq("folder", "snoozed").order("snoozed_until", { ascending: true }); break;
      case "scheduled": {
        const { data: rows } = await sb.from("mail_messages").select("thread_id").eq("status", "scheduled").limit(300);
        query = query.in("id", [...new Set((rows ?? []).map((r) => r.thread_id))]); break;
      }
      case "followup": query = query.lte("follow_up_at", now).not("folder", "in", "(bin,spam)"); break;
      case "sent": query = query.eq("has_sent", true).not("folder", "in", "(bin,spam)"); break;
      case "drafts": query = query.eq("has_draft", true).neq("folder", "bin"); break;
      case "archive": query = query.eq("folder", "archive"); break;
      case "spam": query = query.eq("folder", "spam"); break;
      case "bin": query = query.eq("folder", "bin"); break;
      case "folder": query = query.eq("folder", "custom").eq("custom_folder_id", data.folderId ?? "00000000-0000-0000-0000-000000000000"); break;
    }
    if (data.unread) query = query.eq("unread", true);
    if (data.starred) query = query.eq("starred", true);
    if (data.attachments) query = query.eq("has_attachments", true);
    if (q) {
      const like = `%${q}%`;
      const [byMsg, byThread] = await Promise.all([
        sb.from("mail_messages").select("thread_id").or(`subject.ilike.${like},from_address.ilike.${like},from_name.ilike.${like},text_body.ilike.${like}`).limit(300),
        sb.from("mail_threads").select("id").or(`subject.ilike.${like},participants.ilike.${like},snippet.ilike.${like}`).limit(300),
      ]);
      const ids = [...new Set([...(byMsg.data ?? []).map((r) => r.thread_id), ...(byThread.data ?? []).map((r) => r.id)])];
      if (!ids.length) return { threads: [], counts: await counts(sb, now), folders: await folders(sb) };
      query = query.in("id", ids);
    }
    const { data: threads, error } = await query;
    if (error) throw new Error("Couldn't load your mail.");
    return { threads: threads ?? [], counts: await counts(sb, now), folders: await folders(sb) };
  });

type Sb = Awaited<ReturnType<typeof import("./mail.server").db>>;
async function counts(sb: Sb, now: string) {
  const head = { count: "exact" as const, head: true };
  const [inbox, drafts, followup, spam, custom, scheduled] = await Promise.all([
    sb.from("mail_threads").select("id", head).eq("folder", "inbox").eq("unread", true),
    sb.from("mail_threads").select("id", head).eq("has_draft", true).neq("folder", "bin"),
    sb.from("mail_threads").select("id", head).lte("follow_up_at", now).not("folder", "in", "(bin,spam)"),
    sb.from("mail_threads").select("id", head).eq("folder", "spam").eq("unread", true),
    sb.from("mail_threads").select("custom_folder_id").eq("folder", "custom").eq("unread", true).limit(1000),
    sb.from("mail_messages").select("id", head).eq("status", "scheduled"),
  ]);
  const byFolder: Record<string, number> = {};
  for (const r of custom.data ?? []) if (r.custom_folder_id) byFolder[r.custom_folder_id] = (byFolder[r.custom_folder_id] ?? 0) + 1;
  return { inbox: inbox.count ?? 0, drafts: drafts.count ?? 0, followup: followup.count ?? 0, spam: spam.count ?? 0, scheduled: scheduled.count ?? 0, byFolder };
}
async function folders(sb: Sb) {
  const { data } = await sb.from("mail_folders").select("id, name").order("name");
  return data ?? [];
}

export const getMailSetup = createServerFn({ method: "GET" }).handler(async () => {
  const m = await import("./mail.server");
    await m.requireAdmin();
  const sb = await m.db();
  const { data } = await sb.from("mail_settings").select("webhook_id, webhook_secret, signature_html").eq("id", 1).maybeSingle();
  return { fromAddress: m.MAIL_FROM_ADDRESS, fromName: m.MAIL_FROM_NAME, receiving: !!(data?.webhook_id && data.webhook_secret), signatureHtml: data?.signature_html ?? "" };
});

/** Register the Resend webhook for incoming mail + tracking and switch on open/click tracking. */
export const connectMailReceiving = createServerFn({ method: "POST" }).handler(async () => {
  const m = await import("./mail.server");
    await m.requireAdmin();
  const sb = await m.db();
  try {
    const existing = await m.resend<{ data: { id: string; endpoint: string }[] }>("/webhooks");
    for (const w of existing.data ?? []) if (w.endpoint === m.WEBHOOK_URL) await m.resend(`/webhooks/${w.id}`, { method: "DELETE" });
    const created = await m.resend<{ id: string; signing_secret: string }>("/webhooks", { method: "POST", body: { endpoint: m.WEBHOOK_URL, events: m.WEBHOOK_EVENTS } });
    await sb.from("mail_settings").upsert({ id: 1, webhook_id: created.id, webhook_secret: created.signing_secret, updated_at: new Date().toISOString() });
    const domains = await m.resend<{ data: { id: string; name: string }[] }>("/domains");
    const domain = (domains.data ?? []).find((d) => d.name === m.MAIL_DOMAIN);
    if (domain) await m.resend(`/domains/${domain.id}`, { method: "PATCH", body: { open_tracking: true, click_tracking: true } });
    return { ok: true as const };
  } catch (error) {
    const status = error instanceof m.ResendError ? error.status : 0;
    return { ok: false as const, error: `Resend refused the request${status ? ` (${status})` : ""}. Check the Resend connection has full access.` };
  }
});

export const getMailThread = createServerFn({ method: "POST" })
  .inputValidator((d: { id: string }) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data }) => {
    const m = await import("./mail.server");
    await m.requireAdmin();
    const sb = await m.db();
    const { data: thread } = await sb.from("mail_threads").select("*").eq("id", data.id).maybeSingle();
    if (!thread) return null;
    const { data: messages } = await sb.from("mail_messages")
      .select("*, mail_attachments(id, filename, content_type, size), mail_events(id, type, detail, occurred_at)")
      .eq("thread_id", data.id).order("sent_at", { ascending: true });
    if (thread.unread) await sb.from("mail_threads").update({ unread: false }).eq("id", data.id);
    const people = thread.participants.split(",").map((p) => p.trim().toLowerCase()).filter(Boolean);
    const { data: enquiries } = await sb.from("contact_submissions").select("id, name, email, practice, status, created_at").order("created_at", { ascending: false }).limit(500);
    const all = enquiries ?? [];
    const enquiry = thread.enquiry_id ? all.find((e) => e.id === thread.enquiry_id) ?? null : null;
    const suggestions = all.filter((e) => people.includes(e.email.trim().toLowerCase()) && e.id !== thread.enquiry_id).slice(0, 5);
    return { thread: { ...thread, unread: false }, messages: messages ?? [], enquiry, suggestions };
  });

const bulkSchema = z.object({
  ids: z.array(z.string().uuid()).min(1).max(200),
  action: z.enum(["read", "unread", "star", "unstar", "archive", "inbox", "spam", "bin", "restore", "move", "followup", "clear_followup", "snooze", "unsnooze"]),
  folderId: z.string().uuid().optional(),
  until: z.string().datetime({ offset: true }).optional(),
  days: z.number().int().min(1).max(60).optional(),
});

export const updateMailThreads = createServerFn({ method: "POST" })
  .inputValidator((d: z.input<typeof bulkSchema>) => bulkSchema.parse(d))
  .handler(async ({ data }) => {
    const m = await import("./mail.server");
    await m.requireAdmin();
    const sb = await m.db();
    const t = sb.from("mail_threads");
    const { ids } = data;
    let error;
    switch (data.action) {
      case "read": ({ error } = await t.update({ unread: false }).in("id", ids)); break;
      case "unread": ({ error } = await t.update({ unread: true }).in("id", ids)); break;
      case "star": ({ error } = await t.update({ starred: true }).in("id", ids)); break;
      case "unstar": ({ error } = await t.update({ starred: false }).in("id", ids)); break;
      case "archive": ({ error } = await t.update({ folder: "archive", custom_folder_id: null, snoozed_until: null }).in("id", ids)); break;
      case "inbox": ({ error } = await t.update({ folder: "inbox", custom_folder_id: null, binned_at: null, snoozed_until: null }).in("id", ids)); break;
      case "spam": ({ error } = await t.update({ folder: "spam", custom_folder_id: null, snoozed_until: null }).in("id", ids)); break;
      case "move": {
        if (!data.folderId) throw new Error("Choose a folder.");
        ({ error } = await t.update({ folder: "custom", custom_folder_id: data.folderId, binned_at: null, snoozed_until: null }).in("id", ids)); break;
      }
      case "followup": {
        const at = new Date(Date.now() + (data.days ?? 3) * 86400_000).toISOString();
        ({ error } = await t.update({ follow_up_at: at }).in("id", ids)); break;
      }
      case "clear_followup": ({ error } = await t.update({ follow_up_at: null }).in("id", ids)); break;
      case "snooze": {
        const until = new Date(data.until ?? "");
        const problem = snoozeProblem(until);
        if (problem) throw new Error(problem);
        const { data: rows } = await sb.from("mail_threads").select("id, folder").in("id", ids).not("folder", "in", "(bin,spam)");
        for (const r of rows ?? []) {
          const res = await sb.from("mail_threads").update({
            folder: "snoozed", ...(r.folder === "snoozed" ? {} : { previous_folder: r.folder }), snoozed_until: until.toISOString(), unread: false,
          }).eq("id", r.id);
          if (res.error) error = res.error;
        }
        break;
      }
      case "unsnooze": {
        const { data: rows } = await sb.from("mail_threads").select("id, previous_folder, custom_folder_id").in("id", ids).eq("folder", "snoozed");
        for (const r of rows ?? []) {
          let folder = r.previous_folder && r.previous_folder !== "snoozed" ? r.previous_folder : "inbox";
          if (folder === "custom" && !r.custom_folder_id) folder = "inbox";
          const res = await sb.from("mail_threads").update({ folder, previous_folder: null, snoozed_until: null }).eq("id", r.id);
          if (res.error) error = res.error;
        }
        break;
      }
      case "bin": {
        const { data: rows } = await sb.from("mail_threads").select("id, folder").in("id", ids).neq("folder", "bin");
        for (const r of rows ?? []) {
          const res = await sb.from("mail_threads").update({ folder: "bin", previous_folder: r.folder, binned_at: new Date().toISOString() }).eq("id", r.id);
          if (res.error) error = res.error;
        }
        break;
      }
      case "restore": {
        const { data: rows } = await sb.from("mail_threads").select("id, previous_folder, custom_folder_id, has_sent, message_count").in("id", ids);
        for (const r of rows ?? []) {
          let folder = r.previous_folder ?? "inbox";
          if (folder === "custom" && !r.custom_folder_id) folder = "inbox";
          const res = await sb.from("mail_threads").update({ folder, binned_at: null, previous_folder: null }).eq("id", r.id);
          if (res.error) error = res.error;
        }
        break;
      }
    }
    if (error) throw new Error("Couldn't update those conversations.");
    return { ok: true };
  });

export const deleteMailThreads = createServerFn({ method: "POST" })
  .inputValidator((d: { ids?: string[]; emptyBin?: boolean }) => z.object({ ids: z.array(z.string().uuid()).max(200).optional(), emptyBin: z.boolean().optional() }).parse(d))
  .handler(async ({ data }) => {
    const m = await import("./mail.server");
    await m.requireAdmin();
    const sb = await m.db();
    let ids = data.ids ?? [];
    if (data.emptyBin) {
      const { data: rows } = await sb.from("mail_threads").select("id").eq("folder", "bin").limit(1000);
      ids = (rows ?? []).map((r) => r.id);
    }
    if (!ids.length) return { ok: true, deleted: 0 };
    await m.removeThreadFiles(sb, ids);
    const { error } = await sb.from("mail_threads").delete().in("id", ids);
    if (error) throw new Error("Couldn't delete those conversations.");
    return { ok: true, deleted: ids.length };
  });

const folderSchema = z.object({ action: z.enum(["create", "rename", "delete"]), id: z.string().uuid().optional(), name: z.string().trim().min(1).max(60).optional() });
export const changeMailFolder = createServerFn({ method: "POST" })
  .inputValidator((d: z.input<typeof folderSchema>) => folderSchema.parse(d))
  .handler(async ({ data }) => {
    const m = await import("./mail.server");
    await m.requireAdmin();
    const sb = await m.db();
    if (data.action === "create") {
      if (!data.name) throw new Error("Enter a folder name.");
      const { data: row, error } = await sb.from("mail_folders").insert({ name: data.name }).select("id").single();
      if (error || !row) throw new Error("Couldn't create the folder.");
      return { id: row.id };
    }
    if (!data.id) throw new Error("Choose a folder.");
    if (data.action === "rename") {
      if (!data.name) throw new Error("Enter a folder name.");
      const { error } = await sb.from("mail_folders").update({ name: data.name }).eq("id", data.id);
      if (error) throw new Error("Couldn't rename the folder.");
      return { id: data.id };
    }
    await sb.from("mail_threads").update({ folder: "inbox", custom_folder_id: null }).eq("folder", "custom").eq("custom_folder_id", data.id);
    const { error } = await sb.from("mail_folders").delete().eq("id", data.id);
    if (error) throw new Error("Couldn't delete the folder.");
    return { id: data.id };
  });

const recipients = z.array(z.string().trim().toLowerCase().refine(isEmail, "Enter valid email addresses.")).max(MAX_RECIPIENTS);
const draftSchema = z.object({
  draftId: z.string().uuid().optional(),
  threadId: z.string().uuid().optional(),
  to: recipients, cc: recipients, bcc: recipients,
  subject: z.string().max(998),
  html: z.string().max(500_000),
});

export const saveMailDraft = createServerFn({ method: "POST" })
  .inputValidator((d: z.input<typeof draftSchema>) => draftSchema.parse(d))
  .handler(async ({ data }) => {
    const m = await import("./mail.server");
    await m.requireAdmin();
    const sb = await m.db();
    const { htmlToText } = await import("./mail-utils");
    let threadId = data.threadId;
    if (!threadId && data.draftId) {
      const { data: d } = await sb.from("mail_messages").select("thread_id").eq("id", data.draftId).eq("status", "draft").maybeSingle();
      threadId = d?.thread_id;
    }
    if (!threadId) {
      const { data: t, error } = await sb.from("mail_threads").insert({ subject: data.subject || "(no subject)", normalized_subject: normalizeSubject(data.subject), folder: "drafts" }).select("id").single();
      if (error || !t) throw new Error("Couldn't save the draft.");
      threadId = t.id;
    }
    const row = {
      thread_id: threadId, direction: "out", status: "draft", from_address: m.MAIL_FROM_ADDRESS, from_name: m.MAIL_FROM_NAME,
      to_addresses: data.to, cc_addresses: data.cc, bcc_addresses: data.bcc, subject: data.subject, html: data.html,
      text_body: htmlToText(data.html), sent_at: new Date().toISOString(),
    };
    let draftId = data.draftId;
    if (draftId) {
      const { error } = await sb.from("mail_messages").update(row).eq("id", draftId).eq("status", "draft");
      if (error) throw new Error("Couldn't save the draft.");
    } else {
      const { data: d, error } = await sb.from("mail_messages").insert(row).select("id").single();
      if (error || !d) throw new Error("Couldn't save the draft.");
      draftId = d.id;
    }
    const { data: thread } = await sb.from("mail_threads").select("folder").eq("id", threadId).single();
    if (thread?.folder === "drafts") await sb.from("mail_threads").update({ subject: data.subject || "(no subject)", normalized_subject: normalizeSubject(data.subject) }).eq("id", threadId);
    await m.refreshThread(sb, threadId);
    return { draftId, threadId };
  });

export const discardMailDraft = createServerFn({ method: "POST" })
  .inputValidator((d: { draftId: string }) => z.object({ draftId: z.string().uuid() }).parse(d))
  .handler(async ({ data }) => {
    const m = await import("./mail.server");
    await m.requireAdmin();
    const sb = await m.db();
    const { data: d } = await sb.from("mail_messages").select("thread_id").eq("id", data.draftId).eq("status", "draft").maybeSingle();
    if (!d) return { ok: true };
    await sb.from("mail_messages").delete().eq("id", data.draftId);
    const { count } = await sb.from("mail_messages").select("id", { count: "exact", head: true }).eq("thread_id", d.thread_id);
    if (!count) await sb.from("mail_threads").delete().eq("id", d.thread_id);
    else await m.refreshThread(sb, d.thread_id);
    return { ok: true };
  });

const sendSchema = draftSchema.extend({
  attachments: z.array(z.object({
    filename: z.string().trim().min(1).max(255),
    contentType: z.string().max(200),
    base64: z.string().max(Math.ceil((MAX_ATTACHMENT_BYTES * 4) / 3) + 8),
  })).max(10),
  followUpDays: z.number().int().min(1).max(60).optional(),
  scheduledAt: z.string().datetime({ offset: true }).optional(),
  enquiryId: z.string().uuid().optional(),
}).refine((d) => !d.scheduledAt || !scheduleProblem(new Date(d.scheduledAt)), { message: "Choose a send time between one minute and 30 days from now." })
  .refine((d) => d.to.length > 0, { message: "Add at least one recipient." })
  .refine((d) => d.to.length + d.cc.length + d.bcc.length <= MAX_RECIPIENTS, { message: `Send to at most ${MAX_RECIPIENTS} people at once.` });

export const sendMail = createServerFn({ method: "POST" })
  .inputValidator((d: z.input<typeof sendSchema>) => sendSchema.parse(d))
  .handler(async ({ data }) => {
    const m = await import("./mail.server");
    await m.requireAdmin();
    const sb = await m.db();
    const { htmlToText } = await import("./mail-utils");
    const files = data.attachments.map((a) => ({ ...a, bytes: Buffer.from(a.base64, "base64") }));
    if (files.some((f) => f.bytes.length > MAX_ATTACHMENT_BYTES)) throw new Error("Each attachment must be 10 MB or smaller.");
    if (files.reduce((n, f) => n + f.bytes.length, 0) > MAX_TOTAL_ATTACHMENT_BYTES) throw new Error("Attachments must total 20 MB or less.");

    let threadId = data.threadId;
    if (!threadId && data.draftId) {
      const { data: d } = await sb.from("mail_messages").select("thread_id").eq("id", data.draftId).maybeSingle();
      threadId = d?.thread_id;
    }
    const headers: Record<string, string> = {};
    if (threadId) {
      const { data: prev } = await sb.from("mail_messages").select("message_id_header, references_header")
        .eq("thread_id", threadId).neq("status", "draft").not("message_id_header", "is", null)
        .order("sent_at", { ascending: false }).limit(1);
      const last = prev?.[0];
      if (last?.message_id_header) {
        headers["In-Reply-To"] = last.message_id_header;
        headers["References"] = [last.references_header, last.message_id_header].filter(Boolean).join(" ").slice(-1900);
      }
    }
    const messageId = `<${crypto.randomUUID()}@${m.MAIL_DOMAIN}>`;
    headers["Message-ID"] = messageId;
    const text = htmlToText(data.html);
    let sent: { id: string };
    try {
      sent = await m.resend<{ id: string }>("/emails", {
        method: "POST",
        body: {
          from: `${m.MAIL_FROM_NAME} <${m.MAIL_FROM_ADDRESS}>`, to: data.to,
          ...(data.cc.length ? { cc: data.cc } : {}), ...(data.bcc.length ? { bcc: data.bcc } : {}),
          reply_to: m.MAIL_FROM_ADDRESS, subject: data.subject || "(no subject)", html: data.html, text, headers,
          ...(data.scheduledAt ? { scheduled_at: new Date(data.scheduledAt).toISOString() } : {}),
          ...(files.length ? { attachments: files.map((f) => ({ filename: f.filename, content: f.base64 })) } : {}),
        },
      });
    } catch (error) {
      const detail = error instanceof m.ResendError ? safeDetail(error.body) : "";
      return { ok: false as const, error: `Resend couldn't send this email${detail ? `: ${detail}` : "."}` };
    }

    if (!threadId) {
      const { data: t, error } = await sb.from("mail_threads").insert({ subject: data.subject || "(no subject)", normalized_subject: normalizeSubject(data.subject), folder: "sent" }).select("id").single();
      if (error || !t) throw new Error("The email was sent, but couldn't be saved.");
      threadId = t.id;
    }
    const row = {
      thread_id: threadId, direction: "out", status: data.scheduledAt ? "scheduled" : "sent", provider_id: sent.id, message_id_header: messageId,
      scheduled_at: data.scheduledAt ? new Date(data.scheduledAt).toISOString() : null,
      in_reply_to: headers["In-Reply-To"] ?? null, references_header: headers["References"] ?? null,
      from_address: m.MAIL_FROM_ADDRESS, from_name: m.MAIL_FROM_NAME, to_addresses: data.to, cc_addresses: data.cc, bcc_addresses: data.bcc,
      subject: data.subject || "(no subject)", html: data.html, text_body: text,
      sent_at: data.scheduledAt ? new Date(data.scheduledAt).toISOString() : new Date().toISOString(),
    };
    const { data: msg, error } = data.draftId
      ? await sb.from("mail_messages").update(row).eq("id", data.draftId).select("id").single()
      : await sb.from("mail_messages").insert(row).select("id").single();
    if (error || !msg) throw new Error("The email was sent, but couldn't be saved.");
    await sb.from("mail_events").insert({ message_id: msg.id, type: data.scheduledAt ? "scheduled" : "sent", provider_event_id: null });
    for (const f of files) {
      const path = `${threadId}/${msg.id}/${crypto.randomUUID()}-${f.filename.replace(/[^\w.\-]+/g, "_")}`;
      const up = await sb.storage.from("mail-attachments").upload(path, f.bytes, { contentType: f.contentType || "application/octet-stream" });
      await sb.from("mail_attachments").insert({ message_id: msg.id, filename: f.filename, content_type: f.contentType || "application/octet-stream", size: f.bytes.length, storage_path: up.error ? null : path });
    }
    const { data: thread } = await sb.from("mail_threads").select("folder").eq("id", threadId).single();
    await sb.from("mail_threads").update({
      ...(thread?.folder === "drafts" ? { folder: "sent" } : {}),
      follow_up_at: data.followUpDays ? new Date((data.scheduledAt ? new Date(data.scheduledAt).getTime() : Date.now()) + data.followUpDays * 86400_000).toISOString() : null,
      ...(data.enquiryId ? { enquiry_id: data.enquiryId } : {}),
    }).eq("id", threadId);
    if (!data.enquiryId) await m.autoLinkEnquiry(sb, threadId, [...data.to, ...data.cc]);
    // Answering a new enquiry by email marks it as replied.
    const { data: linked } = await sb.from("mail_threads").select("enquiry_id").eq("id", threadId).single();
    if (linked?.enquiry_id && !data.scheduledAt) await sb.from("contact_submissions").update({ status: "replied" }).eq("id", linked.enquiry_id).eq("status", "new");
    await m.refreshThread(sb, threadId);
    return { ok: true as const, threadId, scheduled: !!data.scheduledAt };
  });

function safeDetail(body: string) {
  try {
    const parsed = JSON.parse(body) as { message?: string };
    return (parsed.message ?? "").slice(0, 200);
  } catch {
    return "";
  }
}

export const getMailAttachmentUrl = createServerFn({ method: "POST" })
  .inputValidator((d: { id: string }) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data }) => {
    const m = await import("./mail.server");
    await m.requireAdmin();
    const sb = await m.db();
    const { data: att } = await sb.from("mail_attachments").select("storage_path, provider_attachment_id, mail_messages(provider_id)").eq("id", data.id).maybeSingle();
    if (!att) return { url: null };
    if (att.storage_path) {
      const { data: signed } = await sb.storage.from("mail-attachments").createSignedUrl(att.storage_path, 300);
      return { url: signed?.signedUrl ?? null };
    }
    const emailId = att.mail_messages?.provider_id;
    if (!emailId || !att.provider_attachment_id) return { url: null };
    try {
      const res = await m.resend<{ download_url?: string }>(`/emails/receiving/${encodeURIComponent(emailId)}/attachments/${encodeURIComponent(att.provider_attachment_id)}`);
      return { url: res.download_url ?? null };
    } catch {
      return { url: null };
    }
  });

/** Cancel a scheduled email; it becomes a draft again so it can be edited or sent now. */
export const cancelScheduledMail = createServerFn({ method: "POST" })
  .inputValidator((d: { messageId: string }) => z.object({ messageId: z.string().uuid() }).parse(d))
  .handler(async ({ data }) => {
    const m = await import("./mail.server");
    await m.requireAdmin();
    const sb = await m.db();
    const { data: msg } = await sb.from("mail_messages").select("id, thread_id, provider_id, status").eq("id", data.messageId).maybeSingle();
    if (!msg || msg.status !== "scheduled" || !msg.provider_id) return { ok: false as const, error: "This email is no longer scheduled." };
    try {
      await m.resend(`/emails/${encodeURIComponent(msg.provider_id)}/cancel`, { method: "POST" });
    } catch (error) {
      const detail = error instanceof m.ResendError ? safeDetail(error.body) : "";
      return { ok: false as const, error: `Resend couldn't cancel it${detail ? `: ${detail}` : " — it may already have been sent."}` };
    }
    const { data: files } = await sb.from("mail_attachments").select("id, storage_path").eq("message_id", msg.id);
    const paths = (files ?? []).map((f) => f.storage_path).filter((p): p is string => !!p);
    if (paths.length) await sb.storage.from("mail-attachments").remove(paths);
    if (files?.length) await sb.from("mail_attachments").delete().eq("message_id", msg.id);
    await sb.from("mail_events").delete().eq("message_id", msg.id);
    await sb.from("mail_messages").update({ status: "draft", provider_id: null, scheduled_at: null, message_id_header: null, sent_at: new Date().toISOString() }).eq("id", msg.id);
    await m.refreshThread(sb, msg.thread_id);
    return { ok: true as const, hadAttachments: !!files?.length };
  });

export const saveMailSignature = createServerFn({ method: "POST" })
  .inputValidator((d: { html: string }) => z.object({ html: z.string().max(20_000) }).parse(d))
  .handler(async ({ data }) => {
    const m = await import("./mail.server");
    await m.requireAdmin();
    const sb = await m.db();
    const { error } = await sb.from("mail_settings").upsert({ id: 1, signature_html: data.html || null, updated_at: new Date().toISOString() });
    if (error) throw new Error("Couldn't save the signature.");
    return { ok: true };
  });

export const listMailTemplates = createServerFn({ method: "GET" }).handler(async () => {
  const m = await import("./mail.server");
  await m.requireAdmin();
  const sb = await m.db();
  const { data } = await sb.from("mail_templates").select("id, name, html, updated_at").order("name");
  return data ?? [];
});

const templateSchema = z.object({ id: z.string().uuid().optional(), name: z.string().trim().min(1).max(80), html: z.string().max(100_000) });
export const saveMailTemplate = createServerFn({ method: "POST" })
  .inputValidator((d: z.input<typeof templateSchema>) => templateSchema.parse(d))
  .handler(async ({ data }) => {
    const m = await import("./mail.server");
    await m.requireAdmin();
    const sb = await m.db();
    const row = { name: data.name, html: data.html, updated_at: new Date().toISOString() };
    const { data: saved, error } = data.id
      ? await sb.from("mail_templates").update(row).eq("id", data.id).select("id").single()
      : await sb.from("mail_templates").insert(row).select("id").single();
    if (error || !saved) throw new Error("Couldn't save the template.");
    return { id: saved.id };
  });

export const deleteMailTemplate = createServerFn({ method: "POST" })
  .inputValidator((d: { id: string }) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data }) => {
    const m = await import("./mail.server");
    await m.requireAdmin();
    const sb = await m.db();
    const { error } = await sb.from("mail_templates").delete().eq("id", data.id);
    if (error) throw new Error("Couldn't delete the template.");
    return { ok: true };
  });

export const linkMailEnquiry = createServerFn({ method: "POST" })
  .inputValidator((d: { threadId: string; enquiryId: string | null }) => z.object({ threadId: z.string().uuid(), enquiryId: z.string().uuid().nullable() }).parse(d))
  .handler(async ({ data }) => {
    const m = await import("./mail.server");
    await m.requireAdmin();
    const sb = await m.db();
    const { error } = await sb.from("mail_threads").update({ enquiry_id: data.enquiryId }).eq("id", data.threadId);
    if (error) throw new Error("Couldn't link the enquiry.");
    return { ok: true };
  });

/** Conversations for an enquiry: the ones linked to it, plus any with the same email address. */
export const getEnquiryMail = createServerFn({ method: "POST" })
  .inputValidator((d: { enquiryId: string }) => z.object({ enquiryId: z.string().uuid() }).parse(d))
  .handler(async ({ data }) => {
    const m = await import("./mail.server");
    await m.requireAdmin();
    const sb = await m.db();
    const { data: enquiry } = await sb.from("contact_submissions").select("email").eq("id", data.enquiryId).maybeSingle();
    const cols = "id, subject, snippet, folder, last_message_at, message_count, unread, enquiry_id";
    const { data: linked } = await sb.from("mail_threads").select(cols).eq("enquiry_id", data.enquiryId).neq("folder", "bin").order("last_message_at", { ascending: false }).limit(20);
    const email = (enquiry?.email ?? "").trim().toLowerCase().replace(/[%_,()*\\"']/g, "");
    const { data: byEmail } = email
      ? await sb.from("mail_threads").select(cols).is("enquiry_id", null).ilike("participants", `%${email}%`).neq("folder", "bin").order("last_message_at", { ascending: false }).limit(20)
      : { data: [] };
    return [...(linked ?? []), ...(byEmail ?? [])].slice(0, 20);
  });
