import { Link } from "@tanstack/react-router";
import { ArrowRight, FileSpreadsheet, ChartNoAxesCombined, ShieldCheck, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Eyebrow } from "@/components/site/shared";
import reportDrawing from "@/assets/report-import-drawing.jpg";

const steps = [
  { Icon: FileSpreadsheet, title: "Run your routine search", text: "Start with the reports you already use. Export a CSV from EMIS Web, SystmOne or your own spreadsheet.", tint: "bg-sage text-sage-foreground" },
  { Icon: Upload, title: "Bring your report", text: "We agree the right file format and a secure import process for your private dashboard. You choose what to provide.", tint: "bg-peach text-peach-foreground" },
  { Icon: ChartNoAxesCombined, title: "See the bigger picture", text: "Turn the agreed reports into clear views of appointments, targets and staffing, ready for your next practice meeting.", tint: "bg-sky text-sky-foreground" },
];

export function ImportSteps() {
  return <section className="border-b border-border bg-background">
    <div className="mx-auto max-w-7xl px-6 py-16 lg:px-10 md:py-20 2xl:max-w-[90rem]">
      <div className="grid items-center gap-10 md:grid-cols-2">
        <div data-reveal className="reveal">
          <Eyebrow>Your reports. A clearer view.</Eyebrow>
          <h2 className="font-display text-3xl text-primary md:text-4xl">From spreadsheet headaches<br className="hidden md:block" /> to a calmer practice meeting.</h2>
          <p className="mt-4 text-lg text-muted-foreground">No live NHS connection. No new clinical-system plugin. Just the reports your practice chooses to provide, shaped into a dashboard that makes sense to your team.</p>
          <Button asChild variant="link" className="mt-5 h-auto whitespace-normal p-0 text-base"><Link to="/contact">Let’s talk about your reports <ArrowRight /></Link></Button>
        </div>
        <img src={reportDrawing} alt="Hand-drawn practice manager with a cup of tea, turning a spreadsheet report into clear laptop charts" width={1536} height={1024} loading="lazy" className="w-full rounded-lg" />
      </div>
      <ol className="mt-10 grid gap-8 md:grid-cols-3">
        {steps.map(({ Icon, title, text, tint }, i) => <li key={title} data-reveal className="reveal border-t border-border pt-6">
          <div className="flex items-center gap-3"><span className={`inline-flex h-10 w-10 items-center justify-center rounded-full ${tint}`}><Icon className="h-5 w-5" /></span><span className="font-mono text-xs text-muted-foreground">0{i + 1}</span></div>
          <h3 className="mt-4 text-xl font-semibold text-primary">{title}</h3><p className="mt-2 text-muted-foreground">{text}</p>
        </li>)}
      </ol>
      <div className="mt-10 flex items-start gap-3 border-t border-border pt-5"><ShieldCheck className="mt-1 h-5 w-5 shrink-0 text-primary" /><p className="text-sm text-muted-foreground"><strong className="text-primary">Your practice stays in control.</strong> No clinical-system plugins or live NHS Spine connection. File compatibility, permissions and information-governance requirements are agreed before any real data is shared. Please don’t send patient information through this website.</p></div>
    </div>
  </section>;
}