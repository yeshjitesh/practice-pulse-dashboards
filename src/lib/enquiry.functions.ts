import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const opt = (max: number) => z.string().trim().max(max).optional();
// Limits match the database rules for contact enquiries.
const enquirySchema = z.object({
  name: z.string().trim().min(1).max(100),
  email: z.string().trim().email().max(255),
  message: z.string().trim().min(1).max(2000),
  practice: opt(150), phone: opt(30), job_role: opt(200), organisation_type: opt(200), list_size: opt(200),
  clinical_system: opt(200), timeline: opt(200), contact_preference: opt(200), heard_about: opt(200),
  interests: z.array(z.string().trim().max(100)).max(20).optional(),
});

/** Save a contact-form enquiry, then email the person a branded confirmation. The enquiry is saved even if the email fails. */
export const submitEnquiry = createServerFn({ method: "POST" })
  .inputValidator((d: z.input<typeof enquirySchema>) => enquirySchema.parse(d))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const n = (v?: string) => (v ? v : null);
    const { data: row, error } = await supabaseAdmin.from("contact_submissions").insert({
      name: data.name, email: data.email, message: data.message, practice: n(data.practice), phone: n(data.phone),
      job_role: n(data.job_role), organisation_type: n(data.organisation_type), list_size: n(data.list_size),
      clinical_system: n(data.clinical_system), timeline: n(data.timeline), contact_preference: n(data.contact_preference),
      heard_about: n(data.heard_about), interests: data.interests?.length ? data.interests : null,
    }).select("id").single();
    if (error || !row) {
      console.error("Saving enquiry failed", error);
      return { ok: false as const };
    }
    const { sendEnquiryConfirmation } = await import("./mail.server");
    await sendEnquiryConfirmation(row.id);
    return { ok: true as const };
  });
