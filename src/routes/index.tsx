import { createFileRoute, Link } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { useEffect, useState, type FormEvent } from "react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { Logo } from "@/components/brand/Logo";
import { getPublicContent } from "@/lib/content.functions";
import teamPhoto from "@/assets/practice-team.jpg";

const contentQuery = queryOptions({ queryKey: ["public-content"], queryFn: () => getPublicContent() });

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "PracticeMD — Practice management dashboards built for your practice" },
      { name: "description", content: "PracticeMD builds bespoke practice management dashboards tailored to how your GP practice actually works." },
      { property: "og:title", content: "PracticeMD — Bespoke practice dashboards" },
      { property: "og:description", content: "Custom practice management dashboards, built around your practice's needs." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  loader: ({ context }) => context.queryClient.ensureQueryData(contentQuery),
  component: Index,
});

const schema = z.object({
  name: z.string().trim().min(1, "Please enter your name").max(100),
  email: z.string().trim().email("Please enter a valid email").max(255),
  practice: z.string().trim().max(150).optional(),
  message: z.string().trim().min(1, "Please tell us a little about your needs").max(2000),
});

const benefits = [
  { t: "Built around you", d: "We start with how your practice runs — appointments, staff, finances — and design the dashboard to fit.", c: "bg-sage text-sage-foreground" },
  { t: "Everything in one view", d: "Bring together the numbers you check every day so decisions take minutes, not hours.", c: "bg-peach text-peach-foreground" },
  { t: "Grows with you", d: "Add new reports and tools as your practice changes. No rigid off‑the‑shelf limits.", c: "bg-sky text-sky-foreground" },
];

const steps = [
  { n: "01", t: "Talk to us", d: "Tell us how your practice works and which numbers matter most." },
  { n: "02", t: "We design it", d: "We sketch your dashboard and refine it with your team until it feels right." },
  { n: "03", t: "Go live", d: "Your dashboard goes live, and we keep improving it as your needs change." },
];

const useCases = [
  { t: "Appointments & demand", d: "See booked, available and missed appointments side by side." },
  { t: "Staffing & rotas", d: "Spot gaps in cover before they become problems." },
  { t: "Finance & targets", d: "Track income, claims and QOF-style targets in one place." },
  { t: "Patient experience", d: "Follow feedback and waiting times at a glance." },
];

function useReveal() {
  useEffect(() => {
    const els = document.querySelectorAll<HTMLElement>("[data-reveal]");
    const io = new IntersectionObserver(
      (entries) => entries.forEach((e) => e.isIntersecting && (e.target.classList.add("is-visible"), io.unobserve(e.target))),
      { threshold: 0.15 },
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);
}

const btn = "inline-flex items-center justify-center rounded-full bg-primary font-medium text-primary-foreground shadow-[var(--shadow-soft)] transition-all hover:-translate-y-0.5 hover:bg-accent";
const btnGhost = "inline-flex items-center justify-center rounded-full border border-input bg-card font-medium text-primary transition-colors hover:bg-secondary";

function DashboardMock() {
  const bars = [40, 65, 52, 80, 70, 92, 60];
  return (
    <div className="animate-float rounded-2xl border border-border bg-card p-5 shadow-[var(--shadow-lift)]" aria-hidden>
      <div className="flex items-center justify-between">
        <span className="font-display text-lg text-primary">This week</span>
        <span className="rounded-full bg-sage px-3 py-1 text-xs font-medium text-sage-foreground">On track</span>
      </div>
      <div className="mt-4 grid grid-cols-3 gap-3">
        {[["Appointments", "1,284", "bg-secondary"], ["DNA rate", "3.1%", "bg-peach"], ["Staff cover", "96%", "bg-sky"]].map(([l, v, c]) => (
          <div key={l} className={`rounded-xl p-3 ${c}`}>
            <p className="text-[0.65rem] uppercase tracking-wider text-muted-foreground">{l}</p>
            <p className="mt-1 font-display text-xl text-primary">{v}</p>
          </div>
        ))}
      </div>
      <div className="mt-5 flex h-32 items-end gap-2">
        {bars.map((h, i) => (
          <div key={i} className="flex-1 rounded-t-md bg-accent/80 animate-grow" style={{ height: `${h}%`, animationDelay: `${i * 80}ms` }} />
        ))}
      </div>
      <div className="mt-2 flex justify-between text-[0.65rem] text-muted-foreground">
        {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => <span key={d}>{d}</span>)}
      </div>
    </div>
  );
}

function Index() {
  useReveal();
  const { data } = useSuspenseQuery(contentQuery);
  const [status, setStatus] = useState<"idle" | "sending" | "done">("idle");
  const [error, setError] = useState("");
  const [open, setOpen] = useState<string | null>(null);

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

  const input = "w-full rounded-lg border border-input bg-background px-4 py-3 text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-accent focus:ring-2 focus:ring-ring/30";

  return (
    <div className="min-h-screen overflow-x-hidden bg-background text-foreground">
      <header className="sticky top-0 z-20 border-b border-border bg-background/85 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <a href="/" aria-label="PracticeMD home"><Logo subtitle iconOnlyOnMobile /></a>
          <nav className="flex items-center gap-6 text-sm">
            <a href="#how" className="hidden text-muted-foreground transition-colors hover:text-primary md:inline">How it works</a>
            <a href="#faq" className="hidden text-muted-foreground transition-colors hover:text-primary md:inline">FAQ</a>
            <a href="#contact" className={`${btn} px-5 py-2`}>Get in touch</a>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section className="relative">
        <div className="pointer-events-none absolute -right-40 -top-20 h-[32rem] w-[32rem] rounded-full bg-secondary blur-3xl" />
        <div className="relative mx-auto grid max-w-6xl items-center gap-14 px-6 pb-20 pt-16 md:grid-cols-[1.1fr_1fr] md:pt-24">
          <div className="animate-fade-up">
            <p className="mb-6 inline-flex items-center gap-2 rounded-full bg-secondary px-4 py-1.5 text-xs font-medium uppercase tracking-[0.2em] text-primary">
              <span className="h-2 w-2 rounded-full bg-accent" /> For GP practices
            </p>
            <h1 className="font-display text-5xl leading-[1.05] text-primary md:text-6xl lg:text-7xl">
              A dashboard shaped by <em className="text-accent">your</em> practice.
            </h1>
            <p className="mt-6 max-w-xl text-lg text-muted-foreground">
              PracticeMD designs and builds custom practice management dashboards — tailored to the way your team works and the numbers you care about.
            </p>
            <div className="mt-10 flex flex-wrap gap-3">
              <a href="#contact" className={`${btn} px-8 py-4`}>Tell us what you need</a>
              <a href="#how" className={`${btnGhost} px-8 py-4`}>See how it works</a>
            </div>
          </div>
          <div className="animate-fade-up [animation-delay:150ms]"><DashboardMock /></div>
        </div>
      </section>

      {/* Trust strip */}
      <section className="border-y border-border bg-card">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-center gap-x-10 gap-y-3 px-6 py-6 text-sm text-muted-foreground">
          {["Designed for UK primary care", "Built to your workflow", "Secure by design", "Ongoing support"].map((t) => (
            <span key={t} className="inline-flex items-center gap-2"><span className="h-1.5 w-1.5 rounded-full bg-accent" />{t}</span>
          ))}
        </div>
      </section>

      {/* Benefits */}
      <section className="mx-auto max-w-6xl px-6 py-24">
        <div data-reveal className="reveal max-w-2xl">
          <h2 className="font-display text-4xl text-primary md:text-5xl">Less time searching. More time for patients.</h2>
          <p className="mt-4 text-lg text-muted-foreground">Every practice is different, so your dashboard should be too.</p>
        </div>
        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {benefits.map((f, i) => (
            <div key={f.t} data-reveal className="reveal rounded-2xl border border-border bg-card p-8 shadow-[var(--shadow-soft)] transition-transform hover:-translate-y-1" style={{ transitionDelay: `${i * 100}ms` }}>
              <span className={`inline-flex h-12 w-12 items-center justify-center rounded-full font-display text-2xl ${f.c}`}>0{i + 1}</span>
              <h3 className="mt-5 text-xl font-semibold text-primary">{f.t}</h3>
              <p className="mt-2 text-muted-foreground">{f.d}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Photo + use cases */}
      <section className="bg-secondary">
        <div className="mx-auto grid max-w-6xl items-center gap-12 px-6 py-24 md:grid-cols-2">
          <img data-reveal src={teamPhoto} alt="Practice manager reviewing a dashboard at a GP surgery reception" width={1280} height={960} loading="lazy" className="reveal aspect-[4/3] w-full rounded-2xl object-cover shadow-[var(--shadow-lift)]" />
          <div data-reveal className="reveal">
            <h2 className="font-display text-4xl text-primary md:text-5xl">What your dashboard can show</h2>
            <ul className="mt-8 space-y-5">
              {useCases.map((u) => (
                <li key={u.t} className="flex gap-4">
                  <span className="mt-1.5 h-3 w-3 shrink-0 rounded-full bg-accent" />
                  <div>
                    <p className="font-semibold text-primary">{u.t}</p>
                    <p className="text-muted-foreground">{u.d}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="mx-auto max-w-6xl scroll-mt-24 px-6 py-24">
        <h2 data-reveal className="reveal font-display text-4xl text-primary md:text-5xl">How it works</h2>
        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {steps.map((s, i) => (
            <div key={s.n} data-reveal className="reveal relative rounded-2xl border border-border bg-card p-8" style={{ transitionDelay: `${i * 100}ms` }}>
              <span className="font-display text-5xl text-accent/40">{s.n}</span>
              <h3 className="mt-3 text-xl font-semibold text-primary">{s.t}</h3>
              <p className="mt-2 text-muted-foreground">{s.d}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Testimonials */}
      {data.testimonials.length > 0 && (
        <section className="bg-primary text-primary-foreground">
          <div className="mx-auto max-w-6xl px-6 py-24">
            <h2 data-reveal className="reveal font-display text-4xl md:text-5xl">What practices say</h2>
            <div className="mt-12 grid gap-6 md:grid-cols-3">
              {data.testimonials.map((t) => (
                <figure key={t.id} data-reveal className="reveal rounded-2xl bg-primary-foreground/10 p-8">
                  <blockquote className="text-lg leading-relaxed">"{t.quote}"</blockquote>
                  <figcaption className="mt-6 text-sm text-primary-foreground/80">
                    <span className="font-semibold text-primary-foreground">{t.author}</span>{t.role && ` · ${t.role}`}
                  </figcaption>
                </figure>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* FAQ */}
      {data.faqs.length > 0 && (
        <section id="faq" className="mx-auto max-w-3xl scroll-mt-24 px-6 py-24">
          <h2 data-reveal className="reveal text-center font-display text-4xl text-primary md:text-5xl">Questions, answered</h2>
          <div className="mt-10 divide-y divide-border rounded-2xl border border-border bg-card">
            {data.faqs.map((f) => (
              <div key={f.id}>
                <button onClick={() => setOpen(open === f.id ? null : f.id)} className="flex w-full items-center justify-between gap-4 px-6 py-5 text-left font-semibold text-primary" aria-expanded={open === f.id}>
                  {f.question}
                  <span className={`text-2xl text-accent transition-transform ${open === f.id ? "rotate-45" : ""}`}>+</span>
                </button>
                <div className={`grid transition-all duration-300 ${open === f.id ? "grid-rows-[1fr] pb-5" : "grid-rows-[0fr]"}`}>
                  <p className="overflow-hidden px-6 text-muted-foreground">{f.answer}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Contact */}
      <section id="contact" className="scroll-mt-20 bg-secondary">
        <div className="mx-auto grid max-w-6xl gap-12 px-6 py-24 md:grid-cols-2">
          <div data-reveal className="reveal">
            <h2 className="font-display text-4xl text-primary md:text-5xl">Let's talk about your practice</h2>
            <p className="mt-4 text-lg text-muted-foreground">Share a few details and we'll get back to you to discuss what your dashboard could look like.</p>
          </div>
          {status === "done" ? (
            <div className="rounded-2xl border border-border bg-card p-8 animate-fade-up">
              <h3 className="text-xl font-semibold text-primary">Thank you!</h3>
              <p className="mt-2 text-muted-foreground">Your message has been received. We'll be in touch soon.</p>
            </div>
          ) : (
            <form onSubmit={onSubmit} className="space-y-4 rounded-2xl border border-border bg-card p-6 shadow-[var(--shadow-soft)] md:p-8">
              <input name="name" placeholder="Your name" maxLength={100} className={input} />
              <input name="email" type="email" placeholder="Email address" maxLength={255} className={input} />
              <input name="practice" placeholder="Practice name (optional)" maxLength={150} className={input} />
              <textarea name="message" rows={5} placeholder="What would you like your dashboard to do?" maxLength={2000} className={input} />
              {error && <p className="text-sm text-destructive">{error}</p>}
              <button disabled={status === "sending"} className={`${btn} w-full px-8 py-4 disabled:opacity-60`}>
                {status === "sending" ? "Sending…" : "Send message"}
              </button>
            </form>
          )}
        </div>
      </section>

      <footer className="bg-primary py-10 text-primary-foreground">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-6 sm:flex-row">
          <Logo variant="white" />
          <div className="flex items-center gap-6 text-sm text-primary-foreground/80">
            <span>© {new Date().getFullYear()} PracticeMD · practicemd.uk</span>
            <Link to="/auth" className="hover:text-primary-foreground">Admin</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
