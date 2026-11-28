import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

export const unlockAdmin = createServerFn({ method: "POST" })
  .inputValidator((input: { code: string }) => z.object({ code: z.string().min(1).max(256) }).parse(input))
  .handler(async ({ data }) => {
    const g = await import("./admin-gate.server");
    const expected = process.env["SITE_PASSWORD"];
    const secret = process.env["SESSION_SECRET"];
    if (!expected || !secret) throw new Error("Admin access is not configured.");
    const session = await g.adminSession();
    if (!g.passwordMatches(data.code, expected)) return { ok: false as const };
    const otp = g.newOtp();
    await session.update({ unlocked: false, otpHash: g.hashOtp(otp, secret), otpExpires: Date.now() + g.OTP_TTL_MS, otpAttempts: 0 });
    const { resend, MAIL_FROM_ADDRESS, MAIL_FROM_NAME } = await import("./mail.server");
    const { brandEmail } = await import("./email-brand");
    try {
      await resend("/emails", { method: "POST", body: {
        from: `${MAIL_FROM_NAME} <${MAIL_FROM_ADDRESS}>`, to: [g.ADMIN_OTP_EMAIL],
        subject: `Your PracticeMD admin code: ${otp}`,
        html: brandEmail(`<p style="font-family:Arial,sans-serif;font-size:16px;color:#283338">Your admin sign-in code is:</p><p style="font-family:Arial,sans-serif;font-size:32px;letter-spacing:8px;font-weight:bold;color:#0B5D4E">${otp}</p><p style="font-family:Arial,sans-serif;font-size:14px;color:#283338">It expires in 10 minutes. If you didn't try to sign in, someone has your access code — change it.</p>`, "Your admin sign-in code"),
        text: `Your PracticeMD admin code is ${otp}. It expires in 10 minutes.`,
      } });
    } catch (e) {
      console.error("Admin OTP email failed", e);
      await session.clear();
      throw new Error("Couldn't send the sign-in code.");
    }
    return { ok: true as const, otpSent: true };
  });

export const verifyAdminOtp = createServerFn({ method: "POST" })
  .inputValidator((input: { code: string }) => z.object({ code: z.string().trim().regex(/^\d{6}$/) }).parse(input))
  .handler(async ({ data }) => {
    const g = await import("./admin-gate.server");
    const secret = process.env["SESSION_SECRET"];
    if (!secret) throw new Error("Admin access is not configured.");
    const session = await g.adminSession();
    const result = g.checkOtp(session.data, data.code, secret, Date.now());
    if (result === "ok") { await session.update({ unlocked: true, otpHash: undefined, otpExpires: undefined, otpAttempts: undefined }); return { ok: true as const }; }
    if (result === "wrong") await session.update({ otpAttempts: (session.data.otpAttempts ?? 0) + 1 });
    else await session.clear();
    return { ok: false as const, reason: result };
  });

export const lockAdmin = createServerFn({ method: "POST" }).handler(async () => {
  const { adminSession } = await import("./admin-gate.server");
  await (await adminSession()).clear();
  return { ok: true };
});

export const getAdminData = createServerFn({ method: "GET" }).handler(async () => {
  const { requireAdminGate } = await import("./admin-gate.server");
  await requireAdminGate();
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const [messages, chats, testimonials, faqs] = await Promise.all([
    supabaseAdmin.from("contact_submissions").select("*").order("created_at", { ascending: false }),
    supabaseAdmin.from("chat_conversations").select("id, live_agent_requested, created_at, updated_at, chat_messages(id, role, content, created_at)").order("updated_at", { ascending: false }),
    supabaseAdmin.from("testimonials").select("*").order("sort_order"),
    supabaseAdmin.from("faqs").select("*").order("sort_order"),
  ]);
  if ([messages, chats, testimonials, faqs].some((result) => result.error)) throw new Error("Couldn't load admin content.");
  return { messages: messages.data ?? [], chats: chats.data ?? [], testimonials: testimonials.data ?? [], faqs: faqs.data ?? [] };
});

const optionalText = z.string().trim().max(200).nullable().optional().transform((v) => (v ? v : null));
const enquiryRow = z.object({
  name: z.string().trim().min(1).max(200),
  email: z.string().trim().email().max(255),
  message: z.string().trim().min(1).max(5000),
  status: z.enum(["new", "replied", "closed"]),
  practice: optionalText, phone: optionalText, job_role: optionalText, organisation_type: optionalText,
  list_size: optionalText, clinical_system: optionalText, timeline: optionalText,
  contact_preference: optionalText, heard_about: optionalText,
});

const mutationSchema = z.union([
  z.object({ table: z.literal("contact_submissions"), action: z.literal("status"), id: z.string().uuid(), status: z.enum(["new", "replied", "closed"]) }),
  z.object({ table: z.literal("contact_submissions"), action: z.literal("save"), id: z.string().uuid().optional(), row: enquiryRow }),
  z.object({ table: z.literal("contact_submissions"), action: z.literal("delete"), id: z.string().uuid() }),
  z.object({ table: z.literal("chat_conversations"), id: z.string().uuid(), action: z.literal("delete") }),
  z.object({ table: z.literal("faqs"), id: z.string().uuid().optional(), action: z.enum(["save", "delete"]), row: z.object({ question: z.string().trim().min(1).max(500), answer: z.string().trim().min(1).max(10000), sort_order: z.number().int() }).optional() }),
  z.object({ table: z.literal("testimonials"), id: z.string().uuid().optional(), action: z.enum(["save", "delete"]), row: z.object({ quote: z.string().trim().min(1).max(10000), author: z.string().trim().min(1).max(200), role: z.string().max(200), sort_order: z.number().int() }).optional() }),
]);

export const changeAdminData = createServerFn({ method: "POST" })
  .inputValidator((input: z.input<typeof mutationSchema>) => mutationSchema.parse(input))
  .handler(async ({ data }) => {
    const { requireAdminGate } = await import("./admin-gate.server");
    await requireAdminGate();
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    if (data.action === "delete") {
      if (!data.id) throw new Error("Select an item to delete.");
      const { error } = await supabaseAdmin.from(data.table).delete().eq("id", data.id);
      if (error) throw new Error("Couldn't delete this item.");
      return { ok: true };
    }
    let result;
    if (data.table === "contact_submissions") {
      if (data.action === "status") result = await supabaseAdmin.from(data.table).update({ status: data.status }).eq("id", data.id);
      else if (data.id) result = await supabaseAdmin.from(data.table).update(data.row).eq("id", data.id);
      else result = await supabaseAdmin.from(data.table).insert({ ...data.row, heard_about: data.row.heard_about ?? "Added by admin" });
    } else if (data.table === "faqs") {
      if (!data.row) throw new Error("Enter the required fields.");
      result = data.id ? await supabaseAdmin.from(data.table).update(data.row).eq("id", data.id) : await supabaseAdmin.from(data.table).insert(data.row);
    } else if (data.table === "testimonials") {
      if (!data.row) throw new Error("Enter the required fields.");
      result = data.id ? await supabaseAdmin.from(data.table).update(data.row).eq("id", data.id) : await supabaseAdmin.from(data.table).insert(data.row);
    }
    if (!result || result.error) throw new Error("Couldn't save this item.");
    return { ok: true };
  });
