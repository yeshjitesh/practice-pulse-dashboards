import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { ArrowRight, CalendarDays, ChartNoAxesCombined, Users, Check, SlidersHorizontal, Sprout, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { contentQuery } from "@/lib/content-query";
import { Eyebrow, SiteShell } from "@/components/site/shared";
import { ImportSteps } from "@/components/site/ImportSteps";
import { withImportFaqs } from "@/lib/import-faqs";
import { DemoPreview } from "@/components/site/DemoPreview";
import { HowSection, FaqSection, ContactSection } from "@/components/site/sections";
import homeDrawing from "@/assets/practice-home-drawing.jpg";
import benefitsDrawing from "@/assets/benefits-drawing.jpg";

export const Route = createFileRoute("/")({
  staticData: { sitemap: true },
  head: () => {
    return {
    meta: [
      { title: "PracticeMD — Practice management dashboards built for your practice" },
      { name: "description", content: "Turn practice-supplied CSV reports and spreadsheets into bespoke GP practice dashboards. No live NHS connection. Explore sample demos and talk to PracticeMD." },
      { name: "robots", content: "index, follow, max-image-preview:large" },
      { property: "og:title", content: "PracticeMD — Bespoke practice dashboards" },
      { property: "og:description", content: "Clear GP practice dashboards built around your imported reports, not live NHS connections." },
      { property: "og:type", content: "website" },
      { property: "og:locale", content: "en_GB" },
      { property: "og:url", content: "https://practicemd.uk/" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "PracticeMD — Bespoke practice dashboards" },
      { name: "twitter:description", content: "Clear GP practice dashboards built around your imported reports, not live NHS connections." },
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
  { icon: SlidersHorizontal, title: "Fits the way you work", description: "Start with your priorities, not a fixed template. Your dashboard is shaped around your team.", tint: "bg-sage text-sage-foreground" },
  { icon: ChartNoAxesCombined, title: "Your numbers, together", description: "See the information you need in one place, instead of switching between spreadsheets.", tint: "bg-peach text-peach-foreground" },
  { icon: Sprout, title: "Room to grow", description: "Add reports and tools as your practice changes, with ongoing support along the way.", tint: "bg-sky text-sky-foreground" },
];
const priorities = [
  { icon: CalendarDays, title: "Appointments & access", description: "Understand demand, capacity and missed appointments.", examples: "Appointments · Tasks · Patient experience", tint: "bg-sage text-sage-foreground" },
  { icon: ShieldCheck, title: "Targets & readiness", description: "Keep reviews, evidence and important deadlines in sight.", examples: "QOF · CQC · Enhanced Services", tint: "bg-peach text-peach-foreground" },
  { icon: Users, title: "People & practice income", description: "See staffing cover, costs and income more clearly.", examples: "Rotas · Finance · Training & HR", tint: "bg-sky text-sky-foreground" },
];

function Index() {
  const { data } = useSuspenseQuery(contentQuery);
  return (
    <SiteShell>
      <section className="relative isolate overflow-hidden border-b border-border">
        <img src={homeDrawing} alt="A practice manager and GP reviewing a dashboard together" width={1920} height={1024} fetchPriority="high" className="absolute inset-0 -z-10 hidden h-full w-full object-cover object-right md:block" />
        <div className="relative mx-auto max-w-7xl px-6 pb-10 pt-10 lg:px-10 md:py-16 2xl:max-w-[90rem]">
          <div className="max-w-xl animate-fade-up md:max-w-[48%]">
            <Eyebrow>Made for UK primary care</Eyebrow>
            <h1 className="font-display text-4xl leading-tight text-primary md:text-5xl lg:text-6xl">PracticeMD<span className="mt-3 block text-3xl leading-tight md:text-4xl lg:text-5xl">Your reports.<br /><em>A clearer</em> picture.</span></h1>
            <p className="mt-5 max-w-lg text-lg text-foreground">Your practice reports, turned into clear dashboards. No live NHS connection — built around the files you choose to provide.</p>
            <p className="mt-3 hidden max-w-lg text-muted-foreground sm:block">Less time wrestling spreadsheets before partner meetings. More time understanding appointments, staffing, targets and income.</p>
            <div className="mt-7 grid gap-3 sm:flex sm:flex-wrap">
              <Button asChild variant="brand" className="h-12 px-6"><Link to="/contact">Let’s talk about your practice <ArrowRight /></Link></Button>
              <Button asChild variant="pill" className="h-12 px-6"><Link to="/demos">Explore the demos</Link></Button>
            </div>
            <p className="mt-4 flex items-center gap-2 text-sm text-muted-foreground"><Check className="h-4 w-4 shrink-0 text-primary" />No obligation. Start with a conversation.</p>
          </div>
        </div>
      </section>

      <section className="border-b border-border bg-blush">
        <div className="mx-auto grid max-w-7xl grid-cols-2 gap-4 px-6 py-5 text-sm text-primary lg:px-10 md:grid-cols-4 2xl:max-w-[90rem]">
          {["UK primary care", "Your reports, your choice", "No live NHS connection", "Support from real people"].map((text) => <p key={text} className="flex items-center gap-2"><Check className="h-4 w-4 shrink-0" />{text}</p>)}
        </div>
      </section>

      <ImportSteps />
      <DemoPreview />

      <section className="border-y border-border bg-secondary">
        <div className="mx-auto max-w-7xl px-6 py-16 lg:px-10 md:py-20 2xl:max-w-[90rem]">
          <div data-reveal className="reveal max-w-2xl"><Eyebrow>Start with what matters</Eyebrow>
            <h2 className="font-display text-3xl text-primary md:text-4xl">What would you like a clearer view of?</h2>
            <p className="mt-4 text-lg text-muted-foreground">Choose a starting point. We can bring together the reports your practice needs.</p>
          </div>
          <div className="mt-8 grid gap-5 md:grid-cols-3">
            {priorities.map(({ icon: Icon, title, description, examples, tint }) => <article key={title} data-reveal className="reveal rounded-xl border border-border bg-card p-6 md:p-7">
              <span className={`inline-flex h-11 w-11 items-center justify-center rounded-full ${tint}`}><Icon className="h-5 w-5" /></span>
              <h3 className="mt-5 text-xl font-semibold text-primary">{title}</h3>
              <p className="mt-3 text-muted-foreground">{description}</p>
              <p className="mt-5 border-t border-border pt-4 text-sm text-primary">{examples}</p>
            </article>)}
          </div>
          <Button asChild variant="link" className="mt-6 h-auto whitespace-normal p-0 text-base"><Link to="/features">See all dashboard types <ArrowRight /></Link></Button>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-16 lg:px-10 md:py-20 2xl:max-w-[90rem]">
        <div className="grid items-center gap-8 md:grid-cols-[1fr_0.7fr]">
          <div data-reveal className="reveal max-w-2xl"><Eyebrow>Why PracticeMD</Eyebrow>
            <h2 className="font-display text-3xl text-primary md:text-4xl">Less time searching.<br />More clarity for your team.</h2>
            <p className="mt-4 text-lg text-muted-foreground">For practice managers, GP partners, clinical leads and PCN teams. Every practice is different — your dashboard should be too.</p>
          </div>
          <img src={benefitsDrawing} alt="Hand-drawn practice manager beside a laptop with a simple dashboard" width={1024} height={768} loading="lazy" className="w-full max-w-md justify-self-center rounded-xl" />
        </div>
        <div className="mt-8 grid gap-7 md:grid-cols-3">
          {benefits.map(({ icon: Icon, title, description, tint }) => <article key={title} data-reveal className="reveal border-t border-border pt-6">
            <span className={`inline-flex h-10 w-10 items-center justify-center rounded-full ${tint}`}><Icon className="h-5 w-5" /></span>
            <h3 className="mt-4 text-xl font-semibold text-primary">{title}</h3>
            <p className="mt-2 text-muted-foreground">{description}</p>
          </article>)}
        </div>
      </section>
      <HowSection />
      <FaqSection faqs={withImportFaqs(data.faqs)} />
      <ContactSection />
    </SiteShell>
  );
}
