import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteShell, pageHead, breadcrumb, Eyebrow } from "@/components/site/shared";
import { Button } from "@/components/ui/button";
import teamDrawing from "@/assets/practice-team-drawing.jpg";

export const Route = createFileRoute("/about")({
  staticData: { sitemap: true },
  head: () => ({
    ...pageHead("/about", "About PracticeMD — Bespoke dashboards for UK primary care", "PracticeMD builds bespoke dashboards around the reports UK GP practices, PCNs and federations already run. No live system connection, no plugins."),
    scripts: [breadcrumb("/about", "About")],
  }),
  component: AboutPage,
});

const values = [
  { title: "Built around you", text: "Every dashboard starts with your own reports and priorities, not a fixed template.", tint: "bg-sage" },
  { title: "You stay in control", text: "No live connection to your clinical system and no plugins. You choose which reports to share, and data protection is agreed before any real data is used.", tint: "bg-sky" },
  { title: "Real people, ongoing support", text: "We stay with you after launch and change your dashboard as your practice's needs change.", tint: "bg-peach" },
];

function AboutPage() {
  return (
    <SiteShell>
      <section className="mx-auto grid max-w-7xl 2xl:max-w-[90rem] items-center gap-10 px-6 py-16 lg:px-10 md:grid-cols-2 md:py-24">
        <div className="min-w-0">
          <Eyebrow>About PracticeMD</Eyebrow>
          <h1 className="font-serif text-4xl leading-tight text-primary md:text-5xl">Your reports. A clearer picture.</h1>
          <p className="mt-6 text-lg text-muted-foreground">Practice managers and GP partners spend too many evenings wrestling spreadsheets before partner meetings. PracticeMD exists to give that time back.</p>
          <p className="mt-4 text-muted-foreground">We build bespoke dashboards for UK GP practices, PCNs and federations, based on the reports you already run, such as exports from EMIS Web or SystmOne. You get a calm, visual view of appointments, targets, staffing and income, without months of IT set-up.</p>
        </div>
        <img src={teamDrawing} alt="Hand-drawn illustration of a practice team reviewing a dashboard together" className="w-full rounded-2xl" loading="eager" width={1536} height={1024} />
      </section>

      <section className="bg-secondary py-16">
        <div className="mx-auto max-w-7xl 2xl:max-w-[90rem] px-6 lg:px-10">
          <Eyebrow dot="bg-rose">What we believe</Eyebrow>
          <h2 className="font-serif text-3xl text-primary md:text-4xl">How we work with practices</h2>
          <div className="mt-8 grid gap-6 md:grid-cols-3">
            {values.map((v) => (
              <div key={v.title} className={`rounded-2xl p-6 ${v.tint}`}>
                <h3 className="font-serif text-xl text-primary">{v.title}</h3>
                <p className="mt-3 text-foreground/80">{v.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-3xl px-6 py-16 text-center lg:px-10">
        <Eyebrow dot="bg-navy">Our story</Eyebrow>
        <h2 className="font-serif text-3xl text-primary md:text-4xl">From RotaCare UK to PracticeMD</h2>
        <p className="mt-6 text-muted-foreground">PracticeMD was formerly known as RotaCare UK. We've grown from rotas into dashboards that cover the whole practice, from appointments and QOF to finance and CQC readiness.</p>
        <p className="mt-4 font-medium text-primary">Founded by Yesh Jitesh</p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Button asChild variant="brand"><Link to="/contact">Let's talk about your practice</Link></Button>
          <Button asChild variant="pill"><Link to="/demos">Explore the demos</Link></Button>
        </div>
      </section>
    </SiteShell>
  );
}
