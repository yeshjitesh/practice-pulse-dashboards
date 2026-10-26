import { createFileRoute } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "PracticeMD — Practice management dashboards built for your practice" },
      { name: "description", content: "PracticeMD builds bespoke practice management dashboards tailored to how your practice actually works." },
      { property: "og:title", content: "PracticeMD — Bespoke practice dashboards" },
      { property: "og:description", content: "Custom practice management dashboards, built around your practice's needs." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

const schema = z.object({
  name: z.string().trim().min(1, "Please enter your name").max(100),
  email: z.string().trim().email("Please enter a valid email").max(255),
  practice: z.string().trim().max(150).optional(),
  message: z.string().trim().min(1, "Please tell us a little about your needs").max(2000),
});

const features = [
  { t: "Built around you", d: "We start with how your practice runs — appointments, staff, finances — and design the dashboard to fit." },
  { t: "Everything in one view", d: "Bring together the numbers you check every day so decisions take minutes, not hours." },
  { t: "Grows with you", d: "Add new reports and tools as your practice changes. No rigid off‑the‑shelf limits." },
];

function Index() {
  const [status, setStatus] = useState<"idle" | "sending" | "done">("idle");
  const [error, setError] = useState("");

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    const form = e.currentTarget;
    const raw = Object.fromEntries(new FormData(form)) as Record<string, string>;
    const parsed = schema.safeParse({ ...raw, practice: raw["practice"] || undefined });
    if (!parsed.success) return setError(parsed.error.issues[0]?.message ?? "Please check the form");
    setStatus("sending");
    const { error } = await supabase.from("contact_submissions").insert({
      name: parsed.data.name,
      email: parsed.data.email,
      practice: parsed.data.practice ?? null,
      message: parsed.data.message,
    });
    if (error) {
      setStatus("idle");
      return setError("Something went wrong. Please try again.");
    }
    form.reset();
    setStatus("done");
  }

  const input = "w-full rounded-md border border-input bg-background px-4 py-3 text-foreground outline-none focus:ring-2 focus:ring-ring";

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
        <span className="font-display text-2xl">Practice<span className="text-primary">MD</span></span>
        <a href="#contact" className="rounded-full bg-primary px-5 py-2 text-sm font-medium text-primary-foreground hover:opacity-90">Get in touch</a>
      </header>

      <section className="mx-auto max-w-6xl px-6 pb-24 pt-16 md:pt-28">
        <p className="mb-6 text-sm uppercase tracking-[0.2em] text-primary">Practice management dashboards</p>
        <h1 className="font-display max-w-4xl text-5xl leading-[1.05] md:text-7xl">
          A dashboard shaped by <em className="text-primary">your</em> practice, not the other way round.
        </h1>
        <p className="mt-8 max-w-2xl text-lg text-muted-foreground">
          PracticeMD designs and builds custom practice management dashboards — tailored to the way your team works and the numbers you care about.
        </p>
        <a href="#contact" className="mt-10 inline-block rounded-full bg-primary px-8 py-4 font-medium text-primary-foreground hover:opacity-90">Tell us what you need</a>
      </section>

      <section className="border-y border-border bg-secondary">
        <div className="mx-auto grid max-w-6xl gap-10 px-6 py-20 md:grid-cols-3">
          {features.map((f, i) => (
            <div key={f.t}>
              <span className="font-display text-4xl text-primary">0{i + 1}</span>
              <h3 className="mt-3 text-xl font-semibold">{f.t}</h3>
              <p className="mt-2 text-muted-foreground">{f.d}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="contact" className="mx-auto grid max-w-6xl gap-12 px-6 py-24 md:grid-cols-2">
        <div>
          <h2 className="font-display text-4xl md:text-5xl">Let's talk about your practice</h2>
          <p className="mt-4 text-muted-foreground">Share a few details and we'll get back to you to discuss what your dashboard could look like.</p>
        </div>
        {status === "done" ? (
          <div className="rounded-lg border border-border bg-card p-8">
            <h3 className="text-xl font-semibold">Thank you!</h3>
            <p className="mt-2 text-muted-foreground">Your message has been received.</p>
          </div>
        ) : (
          <form onSubmit={onSubmit} className="space-y-4">
            <input name="name" placeholder="Your name" maxLength={100} className={input} />
            <input name="email" type="email" placeholder="Email address" maxLength={255} className={input} />
            <input name="practice" placeholder="Practice name (optional)" maxLength={150} className={input} />
            <textarea name="message" rows={5} placeholder="What would you like your dashboard to do?" maxLength={2000} className={input} />
            {error && <p className="text-sm text-destructive">{error}</p>}
            <button disabled={status === "sending"} className="w-full rounded-full bg-primary px-8 py-4 font-medium text-primary-foreground hover:opacity-90 disabled:opacity-60">
              {status === "sending" ? "Sending…" : "Send message"}
            </button>
          </form>
        )}
      </section>

      <footer className="border-t border-border py-8 text-center text-sm text-muted-foreground">
        © {new Date().getFullYear()} PracticeMD · practicemd.uk
      </footer>
    </div>
  );
}
