import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { SiteShell, pageHead, breadcrumb, Eyebrow, btn } from "@/components/site/shared";

export const Route = createFileRoute("/demos")({
  staticData: { sitemap: true },
  head: () => ({
    ...pageHead("/demos", "Demo dashboards — Appointments, QOF, workforce & finance | PracticeMD", "Try sample GP practice dashboards: appointments and access, QOF and targets, workforce and rotas, and finance and income. Example data only."),
    scripts: [breadcrumb("/demos", "Demo dashboards")],
  }),
  component: DemosPage,
});

type Kpi = [string, string, string, string];
type Demo = { id: string; name: string; intro: string; kpis: Kpi[]; chartTitle: string; bars: [string, number][]; listTitle: string; list: [string, number, string][] };

const demos: Demo[] = [
  {
    id: "appointments", name: "Appointments & access", intro: "See demand, capacity and missed appointments for the week at a glance.",
    kpis: [["Appointments", "1,284", "+4% vs last week", "bg-sage"], ["DNA rate", "3.1%", "Down from 3.8%", "bg-peach"], ["Same-day", "41%", "Of all bookings", "bg-sky"], ["Wait (routine)", "6.2 days", "Target 7 days", "bg-secondary"]],
    chartTitle: "Appointments by day", bars: [["Mon", 312], ["Tue", 268], ["Wed", 244], ["Thu", 251], ["Fri", 209]],
    listTitle: "By appointment type", list: [["GP face to face", 46, "bg-primary"], ["GP telephone", 28, "bg-accent"], ["Nurse / HCA", 18, "bg-navy"], ["ARRS clinicians", 8, "bg-rose"]],
  },
  {
    id: "qof", name: "QOF & targets", intro: "Track points achieved and where patients still need reviews before year end.",
    kpis: [["QOF points", "512 / 635", "81% achieved", "bg-sage"], ["Est. value", "£118k", "Of £146k possible", "bg-peach"], ["Reviews due", "347", "Next 8 weeks", "bg-sky"], ["Exceptions", "4.6%", "Within normal range", "bg-secondary"]],
    chartTitle: "Achievement by month (%)", bars: [["Apr", 18], ["Jun", 34], ["Aug", 49], ["Oct", 66], ["Nov", 81]],
    listTitle: "Indicator groups", list: [["Diabetes", 74, "bg-primary"], ["Hypertension", 88, "bg-accent"], ["Asthma / COPD", 69, "bg-navy"], ["Mental health", 62, "bg-rose"]],
  },
  {
    id: "workforce", name: "Workforce & rotas", intro: "Know who's in, where the gaps are, and how leave affects next week.",
    kpis: [["Sessions covered", "96%", "2 gaps this week", "bg-sage"], ["Staff on leave", "5", "Of 38 staff", "bg-peach"], ["Locum sessions", "7", "£3.4k this week", "bg-sky"], ["Training due", "9", "Mandatory modules", "bg-secondary"]],
    chartTitle: "Clinical sessions per day", bars: [["Mon", 22], ["Tue", 20], ["Wed", 18], ["Thu", 21], ["Fri", 17]],
    listTitle: "Cover by team", list: [["GPs", 94, "bg-primary"], ["Nurses", 100, "bg-accent"], ["Reception", 92, "bg-navy"], ["Admin", 98, "bg-rose"]],
  },
  {
    id: "finance", name: "Finance & income", intro: "Follow income streams, spending and cash against budget each month.",
    kpis: [["Income (YTD)", "£842k", "+6% vs last year", "bg-sage"], ["Staff costs", "64%", "Of income", "bg-peach"], ["Enhanced services", "£71k", "Claimed YTD", "bg-sky"], ["Unclaimed", "£4.2k", "To review", "bg-secondary"]],
    chartTitle: "Monthly income (£k)", bars: [["Jul", 118], ["Aug", 112], ["Sep", 121], ["Oct", 126], ["Nov", 131]],
    listTitle: "Income sources", list: [["Global sum", 58, "bg-primary"], ["QOF", 14, "bg-accent"], ["Enhanced services", 12, "bg-navy"], ["Other", 16, "bg-rose"]],
  },
];

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
        <p className="mt-4 max-w-2xl text-lg text-muted-foreground">Four interactive example dashboards using made-up data. Switch the time period, tap bars and rows to explore. Yours is built around your own practice and numbers.</p>

        <div role="tablist" aria-label="Demo dashboards" className="mt-10 grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
          {demos.map((x) => (
            <button key={x.id} role="tab" aria-selected={x.id === active} onClick={() => pick(x.id)}
              className={`rounded-full px-4 py-2.5 text-sm font-medium transition-colors ${x.id === active ? "bg-primary text-primary-foreground" : "border border-input bg-card text-foreground hover:bg-secondary"}`}>
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
