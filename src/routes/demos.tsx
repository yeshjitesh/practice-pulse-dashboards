import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { demos } from "@/lib/demo-data";
import { SiteShell, pageHead, breadcrumb, Eyebrow, btn } from "@/components/site/shared";

export const Route = createFileRoute("/demos")({
  staticData: { sitemap: true },
  head: () => ({
    ...pageHead("/demos", "15 demo dashboards for GP practices — QOF, access, CQC, finance & more | PracticeMD", "Explore 15 interactive sample dashboards for UK GP practices and PCNs: QOF, Enhanced Services, CQC, rotas, appointments, prescribing, finance, IIF and more. Example data only."),
    scripts: [breadcrumb("/demos", "Demo dashboards")],
  }),
  component: DemosPage,
});

function DemosPage() {
  const [active, setActive] = useState(demos[0]!.id);
  const d = demos.find((x) => x.id === active)!;
  const [period, setPeriod] = useState(0);
  const [bar, setBar] = useState<number | null>(null);
  const [item, setItem] = useState<number | null>(null);
  const vary = (v: number, i: number) => (period === 0 ? v : Math.round(v * (1 + 0.12 * Math.sin(i * 1.7 + period * 2.3))));
  const bars = d.bars.map(([l, v], i) => [l, vary(v, i)] as const);
  const list = d.list.map(([l, v, c], i) => [l, Math.min(100, Math.round(vary(v, i + 3))), c] as const);
  const max = Math.max(...bars.map(([, v]) => v));
  const pick = (id: string) => { setActive(id); setBar(null); setItem(null); };
  return (
    <SiteShell>
      <section className="mx-auto max-w-7xl 2xl:max-w-[90rem] px-6 lg:px-10 py-16 md:py-24">
        <Eyebrow>Demo dashboards</Eyebrow>
        <h1 className="font-display text-4xl text-primary md:text-5xl">See what your dashboard could look like</h1>
        <p className="mt-4 max-w-2xl text-lg text-muted-foreground">Fifteen interactive example dashboards using made-up data. Switch the time period, tap bars and rows to explore. Yours is built around your own practice and numbers.</p>

        <div role="tablist" aria-label="Demo dashboards" className="mt-10 flex flex-wrap gap-2">
          {demos.map((x) => (
            <button key={x.id} role="tab" aria-selected={x.id === active} onClick={() => pick(x.id)}
              className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${x.id === active ? "bg-primary text-primary-foreground" : "border border-input bg-card text-foreground hover:bg-secondary"}`}>
              {x.name}
            </button>
          ))}
        </div>

        <div role="tabpanel" className="mt-6 rounded-xl border border-border bg-card p-5 md:p-8">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="font-display text-2xl text-primary md:text-3xl">{d.name}</h2>
              <p className="mt-1 text-muted-foreground">{d.intro}</p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <div role="group" aria-label="Time period" className="flex rounded-full bg-background p-1">
                {["Current", "Last period", "Same time last year"].map((p, i) => (
                  <button key={p} aria-pressed={period === i} onClick={() => { setPeriod(i); setBar(null); }}
                    className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${period === i ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-primary"}`}>{p}</button>
                ))}
              </div>
              <span className="rounded-full bg-background px-3 py-1 font-mono text-xs uppercase tracking-[0.06em] text-muted-foreground">Example data</span>
            </div>
          </div>
          <div className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
            {d.kpis.map(([l, v, s, c]) => (
              <div key={l} className={`rounded-xl p-4 ${c}`}>
                <p className="font-mono text-[0.65rem] uppercase tracking-[0.04em] text-muted-foreground">{l}</p>
                <p className="mt-1 font-display text-2xl text-primary">{v}</p>
                <p className="mt-1 text-xs text-foreground/80">{s}</p>
              </div>
            ))}
          </div>
          <div className="mt-6 grid gap-6 lg:grid-cols-[1.4fr_1fr]">
            <div className="rounded-xl bg-background p-5">
              <h3 className="font-semibold text-primary">{d.chartTitle}</h3>
              <p className="mt-1 min-h-5 text-sm text-muted-foreground" aria-live="polite">
                {bar === null ? "Tap a bar for details." : `${bars[bar]![0]}: ${bars[bar]![1]} — ${Math.round((bars[bar]![1] / (bars.reduce((a, [, v]) => a + v, 0) / bars.length)) * 100 - 100)}% vs average`}
              </p>
              <div className="mt-5 flex h-48 items-end gap-3">
                {bars.map(([l, v], i) => (
                  <button key={l} onClick={() => setBar(bar === i ? null : i)} aria-pressed={bar === i} aria-label={`${l}: ${v}`}
                    className="group flex h-full flex-1 flex-col items-center justify-end gap-1">
                    <span className={`text-xs ${bar === i ? "font-semibold text-primary" : "text-muted-foreground"}`}>{v}</span>
                    <div className={`w-full rounded-t-md transition-all duration-500 ${bar === null || bar === i ? "bg-accent/80" : "bg-accent/30"} group-hover:bg-accent`} style={{ height: `${(v / max) * 85}%` }} />
                    <span className="text-xs text-muted-foreground">{l}</span>
                  </button>
                ))}
              </div>
            </div>
            <div className="rounded-xl bg-background p-5">
              <h3 className="font-semibold text-primary">{d.listTitle}</h3>
              <ul className="mt-5 space-y-2">
                {list.map(([l, v, c], i) => (
                  <li key={l}>
                    <button onClick={() => setItem(item === i ? null : i)} aria-pressed={item === i}
                      className={`w-full rounded-lg p-2 text-left transition-colors ${item === i ? "bg-secondary" : "hover:bg-secondary/60"} ${item !== null && item !== i ? "opacity-50" : ""}`}>
                      <div className="flex justify-between text-sm"><span>{l}</span><span className="font-medium text-primary">{v}%</span></div>
                      <div className="mt-1.5 h-2 rounded-full bg-secondary"><div className={`h-2 rounded-full transition-all duration-500 ${c}`} style={{ width: `${v}%` }} /></div>
                      {item === i && <p className="mt-2 text-xs text-muted-foreground">In your dashboard, this would open the patients, staff or claims behind the number.</p>}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        <div className="mt-10 flex flex-col items-start gap-4 sm:flex-row sm:items-center">
          <p className="text-lg text-foreground">Want one like this for your practice?</p>
          <Link to="/contact" className={`${btn} px-6 py-3`}>Tell us what you need</Link>
        </div>
      </section>
    </SiteShell>
  );
}
