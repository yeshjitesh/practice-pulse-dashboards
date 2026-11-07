import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const SYSTEM = `You are "Pip", the friendly assistant for PracticeMD (practicemd.uk) — a UK business that builds bespoke practice management dashboards for GP practices and PCNs.

What PracticeMD offers:
- Custom dashboards shaped around how each practice works, built from the data they already have (EMIS, SystmOne, Vision, spreadsheets, rotas, finance exports).
- 15 example dashboard types: Appointments & access, QOF tracker, Enhanced Services (ES/LES/DES), CQC readiness, Rotas & staffing, Tasks & workflow, Long-term conditions & recalls, Screening & immunisations, Prescribing & medicines, Practice finance, Patient experience, Training & HR, PCN & IIF overview, Population health, Safety & governance.
- Visitors can try interactive demos at /demos.
- Process: 1) free 20-minute chat about what the practice needs, 2) we build the dashboard, 3) we refine it as the practice grows.
- Built for practice managers, GP partners, PCN managers and admin leads.

How to behave:
- Warm, calm, plain British English. Short answers (2–5 sentences), use bullet points when listing.
- Answer questions, then ask one helpful follow-up question to understand their practice (role, list size, clinical system, biggest headache, timeline).
- Gently guide interested visitors towards booking the free 20-minute chat. Suggest a relevant demo at /demos when useful.
- Never quote prices or timescales — say these depend on the practice and are covered in the free chat.
- Never ask for or accept patient-identifiable information. If someone shares it, ask them not to.
- Don't invent facts, clients or guarantees.

Live agent / contact:
- If the visitor asks for a person, a call, a quote, or wants to book the chat, collect their details in the conversation: name and email (required), plus practice name, phone, preferred contact method and a short note of what they need (optional — ask once, don't insist).
- Once you have at least name and email and they've confirmed, call the request_live_agent tool. Then tell them the team will be in touch, and they can keep chatting meanwhile.`;

const tools = [
  {
    type: "function" as const,
    name: "request_live_agent",
    description: "Save the visitor's details so a PracticeMD team member contacts them.",
    strict: false,
    parameters: {
      type: "object",
      properties: {
        name: { type: "string" },
        email: { type: "string" },
        practice: { type: "string" },
        phone: { type: "string" },
        contact_preference: { type: "string", description: "email, phone or video call" },
        message: { type: "string", description: "Summary of what they need, written from the chat" },
      },
      required: ["name", "email", "message"],
    },
  },
];

const leadSchema = z.object({
  name: z.string().trim().min(1).max(100),
  email: z.string().trim().email().max(255),
  practice: z.string().trim().max(150).optional(),
  phone: z.string().trim().max(40).optional(),
  contact_preference: z.string().trim().max(40).optional(),
  message: z.string().trim().min(1).max(2000),
});

const tokenSchema = z.string().uuid();

async function getConversation(token: string) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data, error } = await supabaseAdmin
    .from("chat_conversations").select("id, live_agent_requested").eq("visitor_token", token).maybeSingle();
  if (error) throw new Error(error.message);
  return { supabaseAdmin, convo: data };
}

export const getChatHistory = createServerFn({ method: "POST" })
  .inputValidator((i: { token: string }) => ({ token: tokenSchema.parse(i.token) }))
  .handler(async ({ data }) => {
    const { supabaseAdmin, convo } = await getConversation(data.token);
    if (!convo) return { messages: [] as { role: "user" | "assistant"; content: string }[] };
    const { data: rows, error } = await supabaseAdmin
      .from("chat_messages").select("role, content").eq("conversation_id", convo.id).order("created_at");
    if (error) throw new Error(error.message);
    return { messages: (rows ?? []) as { role: "user" | "assistant"; content: string }[] };
  });

export const sendChatMessage = createServerFn({ method: "POST" })
  .inputValidator((i: { token: string; message: string }) => ({
    token: tokenSchema.parse(i.token),
    message: z.string().trim().min(1).max(2000).parse(i.message),
  }))
  .handler(async ({ data }) => {
    const { generateResponse, GatewayError } = await import("@lovable.dev/ai-gateway");
    let { supabaseAdmin, convo } = await getConversation(data.token);
    if (!convo) {
      const { data: created, error } = await supabaseAdmin
        .from("chat_conversations").insert({ visitor_token: data.token })
        .select("id, live_agent_requested").single();
      if (error) throw new Error(error.message);
      convo = created;
    }
    const { data: rows, error: hErr } = await supabaseAdmin
      .from("chat_messages").select("role, content").eq("conversation_id", convo.id)
      .order("created_at", { ascending: false }).limit(40);
    if (hErr) throw new Error(hErr.message);
    const { error: uErr } = await supabaseAdmin
      .from("chat_messages").insert({ conversation_id: convo.id, role: "user", content: data.message });
    if (uErr) throw new Error(uErr.message);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const input: any[] = [
      ...(rows ?? []).reverse().map((r) => ({ role: r.role, content: r.content })),
      { role: "user", content: data.message },
    ];
    let reply = "";
    let leadSaved = false;
    try {
      for (let step = 0; step < 3; step++) {
        const res = await generateResponse({
          model: "openai/gpt-6-astra",
          instructions: SYSTEM + (convo.live_agent_requested ? "\n\nNote: this visitor has already requested contact." : ""),
          input,
          tools,
        });
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const output = ((res as any).output ?? []) as any[];
        const calls = output.filter((o) => o.type === "function_call");
        const text = output.filter((o) => o.type === "message")
          .flatMap((m) => m.content ?? []).filter((c: { type: string }) => c.type === "output_text")
          .map((c: { text: string }) => c.text).join("");
        if (!calls.length) { reply = text; break; }
        input.push(...output);
        for (const call of calls) {
          let result: string;
          const parsed = leadSchema.safeParse(JSON.parse(call.arguments || "{}"));
          if (!parsed.success) {
            result = "Invalid details: " + parsed.error.issues.map((i) => i.path.join(".")).join(", ");
          } else {
            const l = parsed.data;
            const { data: sub, error } = await supabaseAdmin.from("contact_submissions").insert({
              name: l.name, email: l.email, practice: l.practice || null, phone: l.phone || null,
              contact_preference: l.contact_preference || null, message: l.message, heard_about: "Chatbot (live agent request)",
            }).select("id").single();
            if (error) result = "Saving failed: " + error.message;
            else {
              await supabaseAdmin.from("chat_conversations")
                .update({ live_agent_requested: true, contact_submission_id: sub.id, updated_at: new Date().toISOString() })
                .eq("id", convo.id);
              leadSaved = true;
              result = "Saved. The team will contact them.";
            }
          }
          input.push({ type: "function_call_output", call_id: call.call_id, output: result });
        }
      }
    } catch (e) {
      console.error("chat error", e);
      const msg = e instanceof GatewayError && e.code === "rate_limited"
        ? "I'm a little busy right now — please try again in a moment."
        : "Sorry, I couldn't answer just now. You can also reach us through the contact page.";
      return { reply: msg, leadSaved, failed: true };
    }
    if (!reply) reply = "Thanks! Is there anything else I can help with?";
    const { error: aErr } = await supabaseAdmin
      .from("chat_messages").insert({ conversation_id: convo.id, role: "assistant", content: reply });
    if (aErr) console.error("save reply failed", aErr);
    await supabaseAdmin.from("chat_conversations").update({ updated_at: new Date().toISOString() }).eq("id", convo.id);
    return { reply, leadSaved, failed: false };
  });
