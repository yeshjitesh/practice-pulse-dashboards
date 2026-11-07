import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { contentQuery } from "@/lib/content-query";
import { btn, btnNavy, Eyebrow, SiteShell } from "@/components/site/shared";
import { DemoPreview, CtaBand } from "@/components/site/DemoPreview";
import { FeaturesSection, HowSection, FaqSection, ContactSection } from "@/components/site/sections";
import teamDrawing from "@/assets/practice-team-drawing.jpg";
import benefitsDrawing from "@/assets/benefits-drawing.jpg";



export const Route = createFileRoute("/")({
  staticData: { sitemap: true },
  head: () => {
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
        ]),
      },
    ],
  };
  },
  loader: ({ context }) => context.queryClient.ensureQueryData(contentQuery),
  component: Index,
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
  { t: "Practice Managers", d: "One place for targets, staffing, income and compliance, instead of a dozen spreadsheets." },
  { t: "GP Partners", d: "A clear view of practice performance and finances to guide decisions." },
  { t: "PCNs & Federations", d: "Compare practices, track IIF and ARRS staff across the network." },
  { t: "Clinical & admin leads", d: "Recalls, tasks and workloads at a glance, so nothing slips." },
];
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
  const { data } = useSuspenseQuery(contentQuery);
  return (
    <SiteShell>
      {/* Hero */}
      <section className="relative">
                <div className="relative mx-auto grid max-w-7xl 2xl:max-w-[90rem] items-center gap-14 px-6 lg:px-10 pb-20 pt-16 md:grid-cols-[1.1fr_1fr] md:pt-24">
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
              <Link to="/contact" className={`${btn} px-8 py-4`}>Book a free chat</Link>
              <Link to="/demos" className={`${btnNavy} px-8 py-4`}>Try a demo dashboard</Link>
            </div>
            <p className="mt-5 text-sm text-muted-foreground">Free, no-obligation · We reply within one working day</p>
          </div>
          <div className="animate-fade-up [animation-delay:150ms]"><DashboardMock /></div>
        </div>
      </section>

      {/* Trust strip */}
      <section className="border-y border-input bg-blush">
        <div className="mx-auto grid max-w-7xl 2xl:max-w-[90rem] grid-cols-2 gap-x-4 gap-y-3 px-6 lg:px-10 py-6 text-center font-mono text-xs uppercase tracking-[0.06em] text-foreground sm:flex sm:flex-wrap sm:items-center sm:justify-center sm:text-sm">
          {[["UK", "primary care"], ["15+", "dashboard types"], ["Your", "workflow"], ["Ongoing", "support"]].map(([b, t], i) => (
            <span key={t} className="inline-flex items-center justify-center">
              {i > 0 && <span className="mx-6 hidden h-4 w-px bg-rose sm:inline-block" aria-hidden />}
              <span className="font-semibold text-primary">{b}</span>&nbsp;{t}
            </span>
          ))}
        </div>
      </section>

      {/* Benefits */}
      <section className="mx-auto max-w-7xl 2xl:max-w-[90rem] px-6 lg:px-10 py-24">
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
        <div className="mx-auto grid max-w-7xl 2xl:max-w-[90rem] items-center gap-12 px-6 lg:px-10 py-24 md:grid-cols-2">
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
      <DemoPreview />
      <FeaturesSection />
      <HowSection />
      <CtaBand />
      <FaqSection faqs={data.faqs} />
      <ContactSection />
    </SiteShell>
  );
}
