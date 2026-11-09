import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";

const KEY = "pmd-cookie-consent";
type Consent = { necessary: true; analytics: boolean; date: string };

export function getConsent(): Consent | null {
  try { return JSON.parse(localStorage.getItem(KEY) || "null"); } catch { return null; }
}

export function openCookieSettings() { window.dispatchEvent(new Event("pmd-cookie-settings")); }

export function CookieBanner() {
  const [open, setOpen] = useState(false);
  const [manage, setManage] = useState(false);
  const [analytics, setAnalytics] = useState(true);

  useEffect(() => {
    const c = getConsent();
    if (!c) { const t = setTimeout(() => setOpen(true), 800); return () => clearTimeout(t); }
    setAnalytics(c.analytics);
    const show = () => { setManage(true); setOpen(true); };
    window.addEventListener("pmd-cookie-settings", show);
    return () => window.removeEventListener("pmd-cookie-settings", show);
  }, [open]);

  const save = (a: boolean) => {
    localStorage.setItem(KEY, JSON.stringify({ necessary: true, analytics: a, date: new Date().toISOString() }));
    setOpen(false); setManage(false);
  };

  if (!open) return null;
  return (
    <div role="dialog" aria-modal="false" aria-labelledby="cookie-title"
      className="fixed inset-x-3 bottom-3 z-50 mx-auto max-w-xl animate-fade-up rounded-xl border border-border bg-card p-5 text-foreground sm:left-6 sm:right-auto sm:bottom-6">
      <p className="inline-flex items-center gap-2 font-mono text-[0.75rem] font-semibold uppercase tracking-[0.06em] text-primary">
        <span className="h-1.5 w-1.5 rounded-full bg-accent" /> Cookies
      </p>
      <h2 id="cookie-title" className="mt-2 font-display text-2xl text-primary">Your privacy, your choice</h2>
      <p className="mt-2 text-sm text-muted-foreground">
        We use essential storage to keep the site working. With your permission we'd also count anonymous visits to see which demos help most — never names or messages. <Link to="/cookies" className="text-primary underline underline-offset-2">Cookie Policy</Link>
      </p>
      {manage && (
        <div className="mt-4 space-y-3 rounded-lg border border-border bg-background p-4 text-sm">
          <label className="flex items-start justify-between gap-4">
            <span><span className="font-semibold text-primary">Strictly necessary</span><br /><span className="text-muted-foreground">Security and admin sign-in. Always on.</span></span>
            <input type="checkbox" checked disabled className="mt-1 h-4 w-4 accent-primary" />
          </label>
          <label className="flex items-start justify-between gap-4">
            <span><span className="font-semibold text-primary">Anonymous analytics</span><br /><span className="text-muted-foreground">Which pages and demos are used.</span></span>
            <input type="checkbox" checked={analytics} onChange={(e) => setAnalytics(e.target.checked)} className="mt-1 h-4 w-4 accent-primary" />
          </label>
        </div>
      )}
      <div className="mt-4 grid gap-2 sm:flex sm:flex-wrap">
        <button onClick={() => save(true)} className="rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90">Accept all</button>
        <button onClick={() => save(false)} className="rounded-full border border-input bg-background px-5 py-2.5 text-sm font-medium text-primary hover:bg-secondary">Reject non-essential</button>
        {manage
          ? <button onClick={() => save(analytics)} className="rounded-full px-4 py-2.5 text-sm font-medium text-primary underline underline-offset-2">Save choices</button>
          : <button onClick={() => setManage(true)} className="rounded-full px-4 py-2.5 text-sm font-medium text-primary underline underline-offset-2">Manage</button>}
      </div>
    </div>
  );
}
