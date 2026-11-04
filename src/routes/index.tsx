import { createFileRoute } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { useEffect, useState, type FormEvent } from "react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { Logo } from "@/components/brand/Logo";
import { getPublicContent } from "@/lib/content.functions";
import teamDrawing from "@/assets/practice-team-drawing.jpg";
import contactDrawing from "@/assets/contact-drawing.jpg";
import benefitsDrawing from "@/assets/benefits-drawing.jpg";
import stepChat from "@/assets/step-chat-drawing.jpg";
import stepBuild from "@/assets/step-build-drawing.jpg";
import stepGrow from "@/assets/step-grow-drawing.jpg";
import faqDrawing from "@/assets/faq-drawing.jpg";

const stepDrawings = [
  { src: stepChat, alt: "Drawing of a practice manager and a GP talking over a notebook" },
  { src: stepBuild, alt: "Drawing of a designer sketching dashboard charts in a browser window" },
  { src: stepGrow, alt: "Drawing of a clinician watering a plant growing from a rising bar chart" },
];

const contentQuery = queryOptions({ queryKey: ["public-content"], queryFn: () => getPublicContent() });

export const Route = createFileRoute("/")({
  staticData: { sitemap: true },
  head: ({ loaderData }) => {
    const faqs = ((loaderData as unknown as { faqs?: { question: string; answer: string }[] } | undefined)?.faqs) ?? [];
    return {
    meta: [
      { title: "PracticeMD — Practice management dashboards built for your practice" },
      { name: "description", content: "PracticeMD builds bespoke practice management dashboards tailored to how your GP practice actually works." },
      { name: "robots", content: "index, follow, max-image-preview:large" },
      { property: "og:title", content: "PracticeMD — Bespoke practice dashboards" },
      { property: "og:description", content: "Custom practice management dashboards, built around your practice's needs." },
      { property: "og:type", content: "website" },
      { property: "og:locale", content: "en_GB" },
      { property: "og:url", content: "https://practicemd.uk/" },
      { property: "og:image", content: "https://practicemd.uk/og-image.jpg" },
      { property: "og:image:width", content: "1200" },
      { property: "og:image:height", content: "630" },
      { property: "og:image:alt", content: "PracticeMD — custom practice management dashboards for UK GP practices" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "PracticeMD — Bespoke practice dashboards" },
      { name: "twitter:description", content: "Custom practice management dashboards, built around your practice's needs." },
      { name: "twitter:image", content: "https://practicemd.uk/og-image.jpg" },
      { name: "twitter:image:alt", content: "PracticeMD — custom practice management dashboards for UK GP practices" },
    ],
    links: [{ rel: "canonical", href: "https://practicemd.uk/" }],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify([
          {
            "@context": "https://schema.org",
            "@type": "ProfessionalService",
            name: "PracticeMD",
            url: "https://practicemd.uk/",
            logo: "https://practicemd.uk/icon-512.png",
            image: "https://practicemd.uk/og-image.jpg",
            description: "Custom practice management dashboards tailored to the way each GP practice works.",
            areaServed: { "@type": "Country", name: "United Kingdom" },
          },
          { "@context": "https://schema.org", "@type": "WebSite", name: "PracticeMD", url: "https://practicemd.uk/", inLanguage: "en-GB" },
          ...(faqs.length
            ? [{
                "@context": "https://schema.org",
                "@type": "FAQPage",
                mainEntity: faqs.map((f) => ({ "@type": "Question", name: f.question, acceptedAnswer: { "@type": "Answer", text: f.answer } })),
              }]
            : []),
        ]),
      },
    ],
  };
  },
  loader: ({ context }) => context.queryClient.ensureQueryData(contentQuery),
  component: Index,
});

const roles = ["Practice Manager", "GP Partner", "Salaried GP", "Operations / Business Manager", "Nurse / Clinical Lead", "PCN Manager / Clinical Director", "Admin / Reception Lead", "Other"];
const orgTypes = ["Single GP practice", "Multi-site practice", "Primary Care Network (PCN)", "GP Federation", "ICB / Commissioner", "Other"];
const listSizes = ["Under 5,000", "5,000 – 10,000", "10,000 – 20,000", "20,000 – 50,000", "Over 50,000"];
const systems = ["EMIS Web", "SystmOne (TPP)", "Vision", "Other / not sure"];
const interestOptions = ["QOF", "Enhanced Services", "CQC readiness", "Rotas & staffing", "Tasks & workflow", "Appointments & access", "Long-term conditions", "Screening & immunisations", "Prescribing", "Finance", "Patient experience", "Training & HR", "PCN / IIF", "Population health", "Safety & governance"];
const timelines = ["As soon as possible", "Within 1–3 months", "Within 3–6 months", "Just exploring"];
const contactPrefs = ["Email", "Phone call", "Video call"];
const heardOptions = ["Search engine", "Recommendation", "LinkedIn / social media", "Event or conference", "Other"];

const optText = (max: number) => z.string().trim().max(max).optional();
const schema = z.object({
  name: z.string().trim().min(1, "Please enter your name").max(100),
  email: z.string().trim().email("Please enter a valid email").max(255),
  phone: z.string().trim().max(30).regex(/^[0-9+()\s-]*$/, "Please enter a valid phone number").optional(),
  practice: optText(150),
  job_role: optText(80),
  organisation_type: optText(80),
  list_size: optText(40),
  clinical_system: optText(80),
  interests: z.array(z.string().max(60)).max(30),
  timeline: optText(80),
  contact_preference: optText(40),
  heard_about: optText(120),
  message: z.string().trim().min(1, "Please tell us a little about your needs").max(2000),
});

const lbl = "block space-y-1.5 text-sm font-medium text-foreground";
const legend = "font-display text-xl text-primary";
const selectCls = "mt-1.5 w-full rounded-lg border border-input bg-background px-4 py-3 text-foreground outline-none transition-colors focus:border-accent focus:ring-2 focus:ring-ring/30";
function Select({ name, options }: { name: string; options: string[] }) {
  return (
    <select name={name} defaultValue="" className={selectCls}>
      <option value="">Select…</option>
      {options.map((o) => <option key={o} value={o}>{o}</option>)}
    </select>
  );
}

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
  { t: "Practice Managers", d: "One place for targets, staffing, income and compliance, instead of a dozen spreadsheets." },
  { t: "GP Partners", d: "A clear view of practice performance and finances to guide decisions." },
  { t: "PCNs & Federations", d: "Compare practices, track IIF and ARRS staff across the network." },
  { t: "Clinical & admin leads", d: "Recalls, tasks and workloads at a glance, so nothing slips." },
];

const tints = ["bg-sage text-sage-foreground", "bg-peach text-peach-foreground", "bg-sky text-sky-foreground", "bg-card text-blush-foreground"];
const cardFills = ["bg-secondary", "bg-blush", "bg-card"];

const features = [
  { tag: "Income", t: "QOF tracker", items: ["Points achieved vs available, by domain and indicator", "Patients still to treat, with recall lists", "Year‑end projection and prevalence trends", "PCAs and exception reporting overview"] },
  { tag: "Income", t: "Enhanced Services (ES / LES / DES)", items: ["Activity vs target for each service", "Claims ready, submitted and paid", "Missed‑claim alerts before deadlines", "Locally commissioned service tracking"] },
  { tag: "Compliance", t: "CQC readiness", items: ["Evidence mapped to the five key questions", "Policy review dates and owners", "Audit, significant event and complaint logs", "Inspection‑ready summary pack"] },
  { tag: "Team", t: "Rotas & staffing", items: ["GP, nurse, HCA and reception cover by session", "Leave, sickness and locum usage", "Gaps flagged weeks ahead", "ARRS roles and hours across the PCN"] },
  { tag: "Team", t: "Tasks & workflow", items: ["Task and document backlogs by person", "Docman and lab results waiting", "Overdue tasks and handovers", "Admin workload balance"] },
  { tag: "Access", t: "Appointments & access", items: ["Capacity vs demand by day and clinician", "DNA rates and wasted minutes", "Same‑day, 2‑week and online consultation volumes", "GPAD data and access targets"] },
  { tag: "Clinical", t: "Long‑term conditions & recalls", items: ["Diabetes, asthma, COPD, hypertension registers", "Annual review and recall status", "Medication reviews due", "Learning disability and SMI health checks"] },
  { tag: "Clinical", t: "Screening & immunisations", items: ["Childhood immunisation uptake", "Flu, COVID and shingles campaigns", "Cervical, bowel and breast screening rates", "Patients to invite this week"] },
  { tag: "Prescribing", t: "Prescribing & medicines", items: ["Spend vs budget and PrescQIPP indicators", "Antibiotic and high‑risk drug monitoring", "Repeat prescription turnaround", "Medicines optimisation savings"] },
  { tag: "Finance", t: "Practice finance", items: ["Global sum, PCN and ES income in one view", "Monthly income vs expenditure", "Staff costs as a share of income", "Cash‑flow forecast"] },
  { tag: "Quality", t: "Patient experience", items: ["Friends & Family Test results", "GP Patient Survey trends", "Complaints and compliments", "Phone wait times and call volumes"] },
  { tag: "Team", t: "Training & HR", items: ["Mandatory training compliance by staff", "DBS, registration and appraisal dates", "Revalidation reminders", "Induction checklists"] },
  { tag: "PCN", t: "PCN & IIF overview", items: ["IIF indicators and earnings", "Practice comparisons across the network", "Shared ARRS staff usage", "Network DES deliverables"] },
  { tag: "Population", t: "Population health", items: ["List size, growth and demographics", "Deprivation and health inequalities", "Frequent attenders and high‑risk patients", "Care home and housebound patients"] },
  { tag: "Safety", t: "Safety & governance", items: ["Significant events and learning actions", "Safeguarding registers and reviews", "Fridge temperature and equipment checks", "Data protection (DSPT) status"] },
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

const btn = "inline-flex items-center justify-center rounded-full bg-primary font-medium text-primary-foreground transition-colors hover:bg-primary/90";
const btnNavy = "inline-flex items-center justify-center rounded-full bg-navy font-medium text-navy-foreground transition-colors hover:bg-navy/90";
const btnGhost = "inline-flex items-center justify-center rounded-full border border-primary bg-transparent font-medium text-primary transition-colors hover:bg-secondary";

function Eyebrow({ children, dot = "bg-accent" }: { children: string; dot?: string }) {
  return (
    <p className="mb-4 inline-flex items-center gap-2 font-mono text-[0.8rem] font-semibold uppercase tracking-[0.06em] text-primary">
      <span className={`h-1.5 w-1.5 rounded-full ${dot}`} /> {children}
    </p>
  );
}

function DashboardMock() {
  const bars = [40, 65, 52, 80, 70, 92, 60];
  return (
    <div className="animate-float rounded-xl border border-border bg-card p-5" aria-hidden>
      <div className="flex items-center justify-between">
        <span className="font-display text-lg text-primary">This week</span>
        <span className="rounded-full bg-sage px-3 py-1 text-xs font-medium text-sage-foreground">On track</span>
      </div>
      <div className="mt-4 grid grid-cols-3 gap-3">
        {[["Appts", "1,284", "bg-secondary"], ["DNA rate", "3.1%", "bg-peach"], ["Cover", "96%", "bg-sky"]].map(([l, v, c]) => (
          <div key={l} className={`rounded-xl p-3 ${c}`}>
            <p className="truncate font-mono text-[0.6rem] uppercase tracking-[0.04em] text-muted-foreground">{l}</p>
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
    const fd = new FormData(form);
    const opt = (k: string) => (raw[k] && raw[k].trim()) || undefined;
    const parsed = schema.safeParse({
      ...raw,
      practice: opt("practice"), phone: opt("phone"), job_role: opt("job_role"),
      organisation_type: opt("organisation_type"), list_size: opt("list_size"),
      clinical_system: opt("clinical_system"), timeline: opt("timeline"),
      contact_preference: opt("contact_preference"), heard_about: opt("heard_about"),
      interests: fd.getAll("interests").map(String),
    });
    if (!parsed.success) return setError(parsed.error.issues[0]?.message ?? "Please check the form");
    setStatus("sending");
    const d = parsed.data;
    const { error } = await supabase.from("contact_submissions").insert({
      name: d.name,
      email: d.email,
      practice: d.practice ?? null,
      message: d.message,
      phone: d.phone ?? null,
      job_role: d.job_role ?? null,
      organisation_type: d.organisation_type ?? null,
      list_size: d.list_size ?? null,
      clinical_system: d.clinical_system ?? null,
      interests: d.interests.length ? d.interests : null,
      timeline: d.timeline ?? null,
      contact_preference: d.contact_preference ?? null,
      heard_about: d.heard_about ?? null,
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
            <a href="#features" className="hidden text-muted-foreground transition-colors hover:text-primary md:inline">Features</a>
            <a href="#how" className="hidden text-muted-foreground transition-colors hover:text-primary md:inline">How it works</a>
            <a href="#faq" className="hidden text-muted-foreground transition-colors hover:text-primary md:inline">FAQ</a>
            <a href="#contact" className={`${btn} px-5 py-2`}>Get in touch</a>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section className="relative">
                <div className="relative mx-auto grid max-w-6xl items-center gap-14 px-6 pb-20 pt-16 md:grid-cols-[1.1fr_1fr] md:pt-24">
          <div className="animate-fade-up">
            <p className="mb-6 inline-flex flex-wrap items-center gap-2 rounded-full border border-input bg-secondary px-4 py-1.5 text-sm text-foreground">
              <span className="text-accent" aria-hidden>✦</span>
              <span className="font-mono text-xs font-semibold uppercase tracking-[0.06em] text-primary">For GP practices</span>
              <span className="hidden text-muted-foreground sm:inline">Built to fit, not off the shelf.</span>
            </p>
            <h1 className="font-display text-5xl leading-[1.05] text-primary md:text-6xl lg:text-7xl">
              A dashboard shaped by <em className="text-accent">your</em> practice.
            </h1>
            <p className="mt-6 max-w-xl text-lg text-muted-foreground">
              PracticeMD designs and builds custom practice management dashboards — tailored to the way your team works and the numbers you care about.
            </p>
            <div className="mt-10 grid gap-3 sm:flex sm:flex-wrap">
              <a href="#contact" className={`${btn} px-8 py-4`}>Tell us what you need</a>
              <a href="#features" className={`${btnNavy} px-8 py-4`}>Explore features</a>
            </div>
          </div>
          <div className="animate-fade-up [animation-delay:150ms]"><DashboardMock /></div>
        </div>
      </section>

      {/* Trust strip */}
      <section className="border-y border-input bg-blush">
        <div className="mx-auto grid max-w-6xl grid-cols-2 gap-x-4 gap-y-3 px-6 py-6 text-center font-mono text-xs uppercase tracking-[0.06em] text-foreground sm:flex sm:flex-wrap sm:items-center sm:justify-center sm:text-sm">
          {[["UK", "primary care"], ["15+", "dashboard types"], ["Your", "workflow"], ["Ongoing", "support"]].map(([b, t], i) => (
            <span key={t} className="inline-flex items-center justify-center">
              {i > 0 && <span className="mx-6 hidden h-4 w-px bg-rose sm:inline-block" aria-hidden />}
              <span className="font-semibold text-primary">{b}</span>&nbsp;{t}
            </span>
          ))}
        </div>
      </section>

      {/* Benefits */}
      <section className="mx-auto max-w-6xl px-6 py-24">
        <div className="grid items-center gap-10 md:grid-cols-[minmax(0,1fr)_minmax(0,0.8fr)]">
          <div data-reveal className="reveal max-w-2xl">
            <Eyebrow>Why PracticeMD</Eyebrow>
            <h2 className="font-display text-4xl text-primary md:text-5xl">Less time searching. More time for patients.</h2>
            <p className="mt-4 text-lg text-muted-foreground">Every practice is different, so your dashboard should be too.</p>
          </div>
          <img data-reveal src={benefitsDrawing} alt="Drawing of a relaxed practice manager with a coffee next to a laptop showing one simple dashboard" width={1024} height={768} loading="lazy" className="reveal w-full rounded-xl border border-border" />
        </div>
        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {benefits.map((f, i) => (
            <div key={f.t} data-reveal className="reveal rounded-xl border border-border bg-card p-8" style={{ transitionDelay: `${i * 100}ms` }}>
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
          <img data-reveal src={teamDrawing} alt="Drawing of a practice manager, GP and nurse looking at a practice dashboard together" width={1280} height={960} loading="lazy" className="reveal aspect-[4/3] w-full rounded-xl border border-border object-cover" />
          <div data-reveal className="reveal">
            <Eyebrow dot="bg-navy">Who it's for</Eyebrow>
            <h2 className="font-display text-4xl text-primary md:text-5xl">Built for the people who run UK primary care</h2>
            <ul className="mt-8 space-y-5">
              {useCases.map((u) => (
                <li key={u.t} className="flex gap-4">
                  <span className="mt-0.5 shrink-0 text-lg font-bold leading-none text-primary" aria-hidden>✓</span>
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

      {/* Features for UK primary care */}
      <section id="features" className="scroll-mt-24">
        <div className="mx-auto max-w-6xl px-6 py-24">
          <div data-reveal className="reveal"><Eyebrow>Features</Eyebrow></div>
          <h2 data-reveal className="reveal font-display text-4xl text-primary md:text-5xl">Everything a UK practice runs on</h2>
          <p data-reveal className="reveal mt-4 max-w-2xl text-lg text-muted-foreground">
            Example dashboards we build for GP surgeries, PCNs and primary care teams. Pick what you need, and we shape it to your practice.
          </p>
          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((f, i) => (
              <article key={f.t} data-reveal className={`reveal rounded-xl border border-border p-7 ${cardFills[i % 3]}`} style={{ transitionDelay: `${(i % 3) * 80}ms` }}>
                <span className={`inline-block rounded-full px-3 py-1 font-mono text-[0.7rem] font-semibold uppercase tracking-[0.06em] ${tints[i % 4]}`}>{f.tag}</span>
                <h3 className="mt-4 text-xl font-semibold text-primary">{f.t}</h3>
                <ul className="mt-4 space-y-2 text-sm text-foreground/80">
                  {f.items.map((it) => (
                    <li key={it} className="flex gap-2">
                      <span className="shrink-0 font-bold text-primary" aria-hidden>✓</span>
                      <span>{it}</span>
                    </li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="scroll-mt-24 bg-blush">
        <div className="mx-auto max-w-6xl px-6 py-24">
        <div data-reveal className="reveal"><Eyebrow dot="bg-rose">The process</Eyebrow></div>
        <h2 data-reveal className="reveal font-display text-4xl text-primary md:text-5xl">How it works</h2>
        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {steps.map((s, i) => (
            <div key={s.n} data-reveal className="reveal relative overflow-hidden rounded-xl border border-border bg-card" style={{ transitionDelay: `${i * 100}ms` }}>
              {stepDrawings[i] && <img src={stepDrawings[i].src} alt={stepDrawings[i].alt} width={1024} height={768} loading="lazy" className="aspect-[4/3] w-full border-b border-border object-cover" />}
              <div className="p-8">
              <span className="font-mono text-sm font-semibold tracking-[0.06em] text-primary">STEP {s.n}</span>
              <h3 className="mt-3 text-xl font-semibold text-primary">{s.t}</h3>
              <p className="mt-2 text-muted-foreground">{s.d}</p>
              </div>
            </div>
          ))}
        </div>
        </div>
      </section>

      {/* FAQ */}
      {data.faqs.length > 0 && (
        <section id="faq" className="mx-auto max-w-3xl scroll-mt-24 px-6 py-24">
          <img data-reveal src={faqDrawing} alt="Drawing of a nurse and a GP thinking, surrounded by question-mark speech bubbles" width={1280} height={640} loading="lazy" className="reveal mx-auto mb-10 w-full max-w-xl rounded-xl" />
          <div data-reveal className="reveal text-center"><Eyebrow>FAQ</Eyebrow></div>
          <h2 data-reveal className="reveal text-center font-display text-4xl text-primary md:text-5xl">Questions, answered</h2>
          <div className="mt-10 divide-y divide-border rounded-xl border border-border bg-card">
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
            <Eyebrow>Contact</Eyebrow>
            <h2 className="font-display text-4xl text-primary md:text-5xl">Let's talk about your practice</h2>
            <p className="mt-4 text-lg text-muted-foreground">Share a few details and we'll get back to you to discuss what your dashboard could look like.</p>
            <img src={contactDrawing} alt="Drawing of a friendly GP receptionist waving next to a calendar and checklist" width={1024} height={1024} loading="lazy" className="mt-10 hidden w-full max-w-sm rounded-xl border border-border md:block" />
          </div>
          {status === "done" ? (
            <div className="rounded-xl border border-border bg-card p-8 animate-fade-up">
              <h3 className="text-xl font-semibold text-primary">Thank you!</h3>
              <p className="mt-2 text-muted-foreground">Your message has been received. We'll be in touch soon.</p>
            </div>
          ) : (
            <form onSubmit={onSubmit} className="space-y-6 rounded-xl border border-border bg-card p-6 md:p-8">
              <fieldset className="space-y-4">
                <legend className={legend}>About you</legend>
                <div className="grid gap-4 sm:grid-cols-2">
                  <label className={lbl}>Full name *<input name="name" autoComplete="name" maxLength={100} className={input} /></label>
                  <label className={lbl}>Email *<input name="email" type="email" autoComplete="email" maxLength={255} className={input} /></label>
                  <label className={lbl}>Phone<input name="phone" type="tel" autoComplete="tel" maxLength={30} className={input} /></label>
                  <label className={lbl}>Your role<Select name="job_role" options={roles} /></label>
                </div>
              </fieldset>
              <fieldset className="space-y-4">
                <legend className={legend}>Your practice</legend>
                <div className="grid gap-4 sm:grid-cols-2">
                  <label className={`${lbl} sm:col-span-2`}>Practice or organisation name<input name="practice" maxLength={150} className={input} /></label>
                  <label className={lbl}>Organisation type<Select name="organisation_type" options={orgTypes} /></label>
                  <label className={lbl}>Patient list size<Select name="list_size" options={listSizes} /></label>
                  <label className={`${lbl} sm:col-span-2`}>Clinical system<Select name="clinical_system" options={systems} /></label>
                </div>
              </fieldset>
              <fieldset>
                <legend className={legend}>What would you like to see?</legend>
                <div className="mt-3 flex flex-wrap gap-2">
                  {interestOptions.map((o) => (
                    <label key={o} className="cursor-pointer">
                      <input type="checkbox" name="interests" value={o} className="peer sr-only" />
                      <span className="inline-block rounded-full border border-input bg-secondary px-3 py-1.5 text-sm text-muted-foreground transition-colors peer-checked:border-primary peer-checked:bg-primary peer-checked:text-primary-foreground peer-focus-visible:ring-2 peer-focus-visible:ring-ring">{o}</span>
                    </label>
                  ))}
                </div>
              </fieldset>
              <fieldset className="space-y-4">
                <legend className={legend}>Next steps</legend>
                <div className="grid gap-4 sm:grid-cols-2">
                  <label className={lbl}>When would you like to start?<Select name="timeline" options={timelines} /></label>
                  <label className={lbl}>Best way to reach you<Select name="contact_preference" options={contactPrefs} /></label>
                  <label className={`${lbl} sm:col-span-2`}>How did you hear about us?<Select name="heard_about" options={heardOptions} /></label>
                  <label className={`${lbl} sm:col-span-2`}>Tell us about your needs *<textarea name="message" rows={5} placeholder="What challenges are you facing, and what would you like your dashboard to do?" maxLength={2000} className={input} /></label>
                </div>
              </fieldset>
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
          </div>
        </div>
      </footer>
    </div>
  );
}
