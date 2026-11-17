import { Link } from "@tanstack/react-router";
import { useState } from "react";
import { SampleImport } from "@/components/site/SampleImport";
import type { Demo } from "@/lib/demo-data";
import { demos } from "@/lib/demo-data";
import { Eyebrow } from "@/components/site/shared";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

const featured = ["appointments", "qof", "finance", "cqc"];

export function DemoPreview() {
  const list = demos.filter((d) => featured.includes(d.id));
  const [id, setId] = useState("appointments");
  const [imported, setImported] = useState<Demo | null>(null);
  const d = imported?.id === id ? imported : list.find((x) => x.id === id) ?? list[0];
  if (!d) return null;
  const max = Math.max(...d.bars.map(([, v]) => v));
  return (
    <section id="demo-preview" className="mx-auto max-w-7xl 2xl:max-w-[90rem] px-6 lg:px-10 py-16 md:py-24">
      <div className="grid items-center gap-12 lg:grid-cols-[0.8fr_1.2fr]">
        <div data-reveal className="reveal">
          <Eyebrow dot="bg-rose">Try a demo</Eyebrow>
          <h2 className="font-display text-4xl text-primary md:text-5xl">See it before you commit</h2>
          <p className="mt-4 text-lg text-muted-foreground">A clearer view of your appointments, targets and income. Start with a sample, then imagine it shaped around your practice.</p>
          <div role="group" aria-label="Featured demos" className="mt-8 grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
            {list.map((x) => (
              <Button key={x.id} variant={x.id === id ? "brand" : "pill"} aria-pressed={x.id === id} aria-controls="featured-dashboard" onClick={() => { if (x.id === id) return; setId(x.id); setImported(null); window.__lovableEvents?.track?.("project.demo_opened", { demo: x.id, location: "home" }); }} className="h-auto min-h-11 whitespace-normal px-4 py-2 text-sm">
                {({ appointments: "Appointments", qof: "QOF", finance: "Finance", cqc: "CQC" } as Record<string, string>)[x.id] ?? x.name}
              </Button>
            ))}
          </div>
          <div className="mt-8 grid gap-3 sm:flex sm:flex-wrap">
            <Button asChild variant="navy" className="h-12 px-6"><Link to="/demos">Explore all 15 demos <ArrowRight /></Link></Button>
          </div>
          <p className="mt-4 text-sm text-muted-foreground">Illustrative figures only — no real patient data.</p>
        </div>
        <div data-reveal id="featured-dashboard" role="region" aria-label="Featured dashboard" aria-live="polite" className="reveal min-w-0 rounded-xl border border-border bg-card p-5 md:p-7">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 className="font-display text-2xl text-primary">{d.name}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{d.intro}</p>
            </div>
            <span className="shrink-0 rounded-full bg-background px-3 py-1 font-mono text-[0.65rem] uppercase tracking-[0.06em] text-muted-foreground">Sample</span>
          </div>
          <SampleImport onImported={(sample) => { setId(sample.id); setImported(sample); }} />
          <div className="mt-5 grid grid-cols-2 gap-3">
            {d.kpis.map(([l, v, s, c]) => (
              <div key={l} className={`rounded-xl p-4 ${c}`}>
                <p className="font-mono text-[0.65rem] uppercase text-muted-foreground">{l}</p>
                <p className="mt-1 font-display text-2xl text-primary">{v}</p>
                <p className="mt-0.5 text-xs text-foreground/80">{s}</p>
              </div>
            ))}
          </div>
          <div className="mt-5 rounded-xl bg-background p-4">
            <p className="text-sm font-semibold text-primary">{d.chartTitle}</p>
            <div className="mt-3 flex h-32 items-end gap-3">
              {d.bars.map(([l, v]) => (
                <div key={l} className="flex h-full flex-1 flex-col items-center justify-end gap-1">
                  <div className="w-full rounded-t-md bg-accent/80 transition-all duration-500" style={{ height: `${(v / max) * 85}%` }} />
                  <span className="text-xs text-muted-foreground">{l}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export function CtaBand() {
  return (
    <section className="bg-navy text-navy-foreground">
      <div className="mx-auto flex max-w-7xl 2xl:max-w-[90rem] flex-col items-start gap-6 px-6 lg:px-10 py-16 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="font-display text-3xl md:text-4xl">Not sure where to start? Let's talk.</h2>
          <p className="mt-2 max-w-xl opacity-85">Tell us what takes up your time. We’ll talk through where a dashboard could help — no obligation.</p>
        </div>
        <Button asChild variant="pill" className="h-12 w-full shrink-0 px-8 md:w-auto"><Link to="/contact">Talk about your practice <ArrowRight /></Link></Button>
      </div>
    </section>
  );
}
