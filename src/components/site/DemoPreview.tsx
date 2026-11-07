import { Link } from "@tanstack/react-router";
import { useState } from "react";
import { demos } from "@/lib/demo-data";
import { btn, btnNavy, Eyebrow } from "@/components/site/shared";

const featured = ["appointments", "qof", "finance", "cqc"];

export function DemoPreview() {
  const list = demos.filter((d) => featured.includes(d.id));
  const [id, setId] = useState(list[0]!.id);
  const d = list.find((x) => x.id === id)!;
  const max = Math.max(...d.bars.map(([, v]) => v));
  return (
    <section className="mx-auto max-w-7xl 2xl:max-w-[90rem] px-6 lg:px-10 py-24">
      <div className="grid items-center gap-12 lg:grid-cols-[0.8fr_1.2fr]">
        <div data-reveal className="reveal">
          <Eyebrow dot="bg-rose">Try a demo</Eyebrow>
          <h2 className="font-display text-4xl text-primary md:text-5xl">See it before you commit</h2>
          <p className="mt-4 text-lg text-muted-foreground">Have a play with real-looking sample dashboards. Tap the tabs to switch — there are 15 to explore.</p>
          <div role="tablist" aria-label="Featured demos" className="mt-8 flex flex-wrap gap-2">
            {list.map((x) => (
              <button key={x.id} role="tab" aria-selected={x.id === id} onClick={() => setId(x.id)}
                className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${x.id === id ? "bg-primary text-primary-foreground" : "border border-input bg-card text-foreground hover:bg-secondary"}`}>
                {x.name}
              </button>
            ))}
          </div>
          <div className="mt-8 grid gap-3 sm:flex sm:flex-wrap">
            <Link to="/demos" className={`${btnNavy} px-7 py-3.5`}>Explore all 15 demos</Link>
            <Link to="/contact" className={`${btn} px-7 py-3.5`}>Book a free 20-min chat</Link>
          </div>
        </div>
        <div data-reveal role="tabpanel" className="reveal rounded-xl border border-border bg-card p-5 md:p-7">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 className="font-display text-2xl text-primary">{d.name}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{d.intro}</p>
            </div>
            <span className="shrink-0 rounded-full bg-background px-3 py-1 font-mono text-[0.65rem] uppercase tracking-[0.06em] text-muted-foreground">Sample</span>
          </div>
          <div className="mt-5 grid grid-cols-2 gap-3">
            {d.kpis.map(([l, v, s, c]) => (
              <div key={l} className={`rounded-xl p-4 ${c}`}>
                <p className="truncate font-mono text-[0.65rem] uppercase tracking-[0.04em] text-muted-foreground">{l}</p>
                <p className="mt-1 font-display text-2xl text-primary">{v}</p>
                <p className="mt-0.5 truncate text-xs text-foreground/80">{s}</p>
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
          <p className="mt-2 max-w-xl opacity-85">A friendly, no-obligation 20-minute chat. Tell us what takes up your time and we'll sketch how a dashboard could help.</p>
        </div>
        <Link to="/contact" className="inline-flex shrink-0 items-center justify-center rounded-full bg-background px-8 py-4 font-medium text-primary transition-colors hover:bg-secondary">Get in touch — it's free</Link>
      </div>
    </section>
  );
}
