import { useState, type FormEvent } from "react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Eyebrow } from "@/components/site/shared";
import contactDrawing from "@/assets/contact-drawing.jpg";
import stepChat from "@/assets/step-chat-drawing.jpg";
import stepBuild from "@/assets/step-build-drawing.jpg";
import stepGrow from "@/assets/step-grow-drawing.jpg";
import faqDrawing from "@/assets/faq-drawing.jpg";
import featuresDrawing from "@/assets/features-drawing.jpg";

const stepDrawings = [
  { src: stepChat, alt: "Drawing of a practice manager and a GP talking over a notebook" },
  { src: stepBuild, alt: "Drawing of a designer sketching dashboard charts in a browser window" },
  { src: stepGrow, alt: "Drawing of a clinician watering a plant growing from a rising bar chart" },
];

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
  { n: "01", t: "Tell us about your reports", d: "Which spreadsheet takes the most time? Start with a conversation about your team and the questions you need answered — no patient records needed." },
  { n: "02", t: "Make a plan together", d: "We review the report format, sketch your dashboard and agree a secure way to import the right data. Your team shapes it with us." },
  { n: "03", t: "Bring your numbers to life", d: "Your practice provides the agreed reports. We help you use your dashboard and plan how to refresh it, with support as your needs change." },
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


type H = "h1" | "h2";

export function FeaturesSection({ as: Tag = "h2" }: { as?: H }) {
  return (
      <section id="features" className="scroll-mt-24">
        <div className="mx-auto max-w-7xl 2xl:max-w-[90rem] px-6 lg:px-10 py-24">
          <div className="grid items-center gap-10 md:grid-cols-[minmax(0,1fr)_minmax(0,0.8fr)]">
            <div>
          <div data-reveal className="reveal"><Eyebrow>Features</Eyebrow></div>
          <Tag data-reveal className="reveal font-display text-4xl text-primary md:text-5xl">Everything a UK practice runs on</Tag>
          <p data-reveal className="reveal mt-4 max-w-2xl text-lg text-muted-foreground">
            A starting point, not a one-size-fits-all package. Choose the numbers that matter to your team; we build around the reports and files you provide, without connecting to live NHS systems.
          </p>
            </div>
            <img data-reveal src={featuresDrawing} alt="Drawing of a laptop on a GP practice desk surrounded by dashboard cards: charts, a calendar, a staff rota and finances" width={1024} height={768} loading="lazy" className="reveal w-full rounded-xl border border-border" />
          </div>
          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
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
  );
}

export function HowSection({ as: Tag = "h2" }: { as?: H }) {
  return (
      <section id="how" className="scroll-mt-24 bg-blush">
        <div className="mx-auto max-w-7xl 2xl:max-w-[90rem] px-6 lg:px-10 py-24">
        <div data-reveal className="reveal"><Eyebrow dot="bg-rose">The process</Eyebrow></div>
        <Tag data-reveal className="reveal font-display text-4xl text-primary md:text-5xl">From your reports to a clearer view</Tag>
        <p className="mt-4 max-w-2xl text-lg text-muted-foreground">A friendly conversation, a plan that fits, and support along the way. No live clinical-system connection required.</p>
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
  );
}

export type Faq = { id: string; question: string; answer: string };
export function FaqSection({ faqs, as: Tag = "h2" }: { faqs: Faq[]; as?: H }) {
  const [open, setOpen] = useState<string | null>(null);
  if (!faqs.length) return null;
  return (
        <section id="faq" className="mx-auto max-w-3xl scroll-mt-24 px-6 py-24">
          <img data-reveal src={faqDrawing} alt="Drawing of a nurse and a GP thinking, surrounded by question-mark speech bubbles" width={1280} height={640} loading="lazy" className="reveal mx-auto mb-10 w-full max-w-xl rounded-xl" />
          <div data-reveal className="reveal text-center"><Eyebrow>FAQ</Eyebrow></div>
          <Tag data-reveal className="reveal text-center font-display text-4xl text-primary md:text-5xl">Questions, answered</Tag>
          <div className="mt-10 divide-y divide-border rounded-xl border border-border bg-card">
            {faqs.map((f) => (
              <div key={f.id}>
                <Button variant="ghost" onClick={() => setOpen(open === f.id ? null : f.id)} className="flex h-auto w-full items-center justify-between gap-4 whitespace-normal rounded-none px-6 py-5 text-left font-semibold text-primary hover:bg-secondary" aria-expanded={open === f.id}>
                  {f.question}
                  <span className={`text-2xl text-accent transition-transform ${open === f.id ? "rotate-45" : ""}`}>+</span>
                </Button>
                <div className={`grid transition-all duration-300 ${open === f.id ? "grid-rows-[1fr] pb-5" : "grid-rows-[0fr]"}`}>
                  <p className="overflow-hidden px-6 text-muted-foreground">{f.answer}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
  );
}

export function ContactSection({ as: Tag = "h2" }: { as?: H }) {
  const [status, setStatus] = useState<"idle" | "sending" | "done">("idle");
  const [error, setError] = useState("");

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
    if (!parsed.success) {
      window.__lovableEvents?.track?.("project.contact_form_submitted", { result: "invalid" });
      return setError(parsed.error.issues[0]?.message ?? "Please check the form");
    }
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
      window.__lovableEvents?.track?.("project.contact_form_submitted", { result: "error" });
      setStatus("idle");
      return setError("Something went wrong. Please try again.");
    }
    window.__lovableEvents?.track?.("project.contact_form_submitted", { result: "success" });
    form.reset();
    setStatus("done");
  }

  const input = "w-full rounded-lg border border-input bg-background px-4 py-3 text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-accent focus:ring-2 focus:ring-ring/30";

  return (
      <section id="contact" className="scroll-mt-20 bg-secondary">
        <div className="mx-auto grid max-w-7xl 2xl:max-w-[90rem] gap-12 px-6 lg:px-10 py-24 md:grid-cols-2">
          <div data-reveal className="reveal">
            <Eyebrow>Contact</Eyebrow>
            <Tag className="font-display text-4xl text-primary md:text-5xl">Let’s look at your reports together</Tag>
            <p className="mt-4 text-lg text-muted-foreground">Tell us which routine search gives you the biggest headache. We can start with a low-pressure 15-minute chat about how a visual dashboard could help.</p>
            <p className="mt-4 text-sm text-muted-foreground">Just your name, email and a little about your needs are required. Everything else is optional. Please don’t include patient information or attach clinical reports.</p>
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
                  <label className={`${lbl} sm:col-span-2`}>Tell us about your needs *<textarea name="message" rows={5} placeholder="Which report takes up your time? What would you like to see more clearly?" maxLength={2000} className={input} /></label>
                </div>
              </fieldset>
              {error && <p className="text-sm text-destructive">{error}</p>}
              <Button variant="brand" type="submit" disabled={status === "sending"} className="h-12 w-full px-8">
                {status === "sending" ? "Sending…" : "Let’s start a conversation"}
              </Button>
            </form>
          )}
        </div>
      </section>
  );
}
