import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";

const eventSchema = z.object({
  type: z.string().max(100),
  created_at: z.string().max(100).optional(),
  data: z.object({ email_id: z.string().min(1).max(200) }).passthrough(),
});

export const Route = createFileRoute("/api/public/resend-webhook")({
  staticData: { sitemap: false },
  server: {
    handlers: {
      POST: async ({ request }) => {
        const body = await request.text();
        if (body.length > 1_000_000) return new Response("Too large", { status: 413 });
        const { db, ingestInbound, recordDeliveryEvent } = await import("@/lib/mail.server");
        const { verifySvixSignature } = await import("@/lib/mail-signature");
        const sb = await db();
        const { data: settings } = await sb.from("mail_settings").select("webhook_secret").eq("id", 1).maybeSingle();
        const secret = settings?.webhook_secret;
        if (!secret) return new Response("Not configured", { status: 503 });
        const eventId = request.headers.get("svix-id");
        const valid = verifySvixSignature({
          id: eventId, timestamp: request.headers.get("svix-timestamp"), signature: request.headers.get("svix-signature"),
          body, secret, nowSeconds: Math.floor(Date.now() / 1000),
        });
        if (!valid || !eventId) return new Response("Invalid signature", { status: 401 });

        let parsed;
        try { parsed = eventSchema.safeParse(JSON.parse(body)); } catch { return new Response("Bad request", { status: 400 }); }
        if (!parsed.success) return new Response("ok"); // signed but not an email event we handle
        const event = parsed.data;
        try {
          if (event.type === "email.received") {
            await ingestInbound(event.data.email_id, event.data as Parameters<typeof ingestInbound>[1]);
          } else if (event.type.startsWith("email.")) {
            const d = event.data as Record<string, unknown>;
            const bounce = d["bounce"] as { message?: string } | undefined;
            const click = d["click"] as { link?: string } | undefined;
            await recordDeliveryEvent(eventId, event.type, event.data.email_id, event.created_at, bounce?.message ?? click?.link ?? null);
          }
        } catch (error) {
          console.error("Resend webhook processing failed", error);
          return new Response("Retry later", { status: 500 });
        }
        return new Response("ok");
      },
    },
  },
});
