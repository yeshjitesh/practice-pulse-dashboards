import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { LayoutDashboard, Inbox, MessageCircle, HelpCircle, Quote, LogOut, ExternalLink } from "lucide-react";
import { getAdminData, lockAdmin } from "@/lib/admin.functions";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/brand/Logo";
import { useAdminData } from "@/components/admin/shared";
import { Overview, type AdminTab } from "@/components/admin/Overview";
import { Enquiries } from "@/components/admin/Enquiries";
import { Chats, Faqs, Testimonials } from "@/components/admin/Content";

export const Route = createFileRoute("/admin")({
  staticData: { sitemap: false },
  loader: () => getAdminData(),
  head: () => ({
    meta: [
      { title: "Admin dashboard — PracticeMD" },
      { name: "description", content: "Manage enquiries, chats and page content." },
      { property: "og:title", content: "Admin dashboard — PracticeMD" },
      { property: "og:description", content: "PracticeMD admin area." },
      { name: "robots", content: "noindex" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Admin,
});

function Admin() {
  const initial = Route.useLoaderData();
  const { data } = useAdminData(initial);
  const qc = useQueryClient();
  const navigate = useNavigate();
  const lock = useServerFn(lockAdmin);
  const [tab, setTab] = useState<AdminTab>("overview");
  const newCount = (data?.messages ?? []).filter((m) => m.status === "new").length;
  const contactChats = (data?.chats ?? []).filter((c) => c.live_agent_requested).length;
  const nav: { id: AdminTab; label: string; icon: typeof Inbox; badge?: number }[] = [
    { id: "overview", label: "Overview", icon: LayoutDashboard },
    { id: "enquiries", label: "Enquiries", icon: Inbox, badge: newCount },
    { id: "chats", label: "Chats", icon: MessageCircle, badge: contactChats },
    { id: "faqs", label: "FAQs", icon: HelpCircle },
    { id: "testimonials", label: "Testimonials", icon: Quote },
  ];
  function go(next: AdminTab) { setTab(next); window.scrollTo({ top: 0, behavior: "smooth" }); }
  async function signOut() {
    await lock();
    await qc.cancelQueries();
    qc.clear();
    await navigate({ to: "/auth", replace: true });
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-30 border-b border-border bg-card/95 backdrop-blur">
        <div className="mx-auto grid max-w-7xl grid-cols-[minmax(0,1fr)_auto] items-center gap-3 px-4 py-3 sm:px-6 lg:px-10">
          <div className="flex min-w-0 items-center gap-3">
            <Link to="/" className="shrink-0"><Logo /></Link>
            <span className="truncate rounded-full bg-secondary px-2.5 py-0.5 font-mono text-xs uppercase tracking-[0.06em] text-muted-foreground">Admin</span>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <Button asChild variant="pill" size="sm" className="hidden sm:inline-flex"><Link to="/"><ExternalLink /> View site</Link></Button>
            <Button variant="pill" size="sm" onClick={signOut}><LogOut /> <span className="hidden sm:inline">Sign out</span><span className="sr-only sm:hidden">Sign out</span></Button>
          </div>
        </div>
        <nav aria-label="Admin sections" className="border-t border-border lg:hidden">
          <div className="mx-auto flex max-w-7xl flex-wrap gap-1 px-4 py-2 sm:px-6">
            {nav.map((n) => <NavButton key={n.id} item={n} active={tab === n.id} onClick={() => go(n.id)} compact />)}
          </div>
        </nav>
      </header>
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-6 sm:px-6 sm:py-8 lg:grid-cols-[14rem_minmax(0,1fr)] lg:px-10">
        <aside className="hidden lg:block">
          <nav aria-label="Admin sections" className="sticky top-24 space-y-1">
            {nav.map((n) => <NavButton key={n.id} item={n} active={tab === n.id} onClick={() => go(n.id)} />)}
          </nav>
        </aside>
        <main className="min-w-0">
          {tab === "overview" && <Overview go={go} />}
          {tab === "enquiries" && <Enquiries />}
          {tab === "chats" && <Chats />}
          {tab === "faqs" && <Faqs />}
          {tab === "testimonials" && <Testimonials />}
        </main>
      </div>
    </div>
  );
}

function NavButton({ item, active, onClick, compact }: { item: { label: string; icon: typeof Inbox; badge?: number }; active: boolean; onClick: () => void; compact?: boolean }) {
  const Icon = item.icon;
  return (
    <button type="button" onClick={onClick} aria-current={active ? "page" : undefined}
      className={`flex shrink-0 items-center gap-2 rounded-full text-sm font-medium transition-colors ${compact ? "px-3 py-1.5" : "w-full px-4 py-2.5"} ${active ? "bg-primary text-primary-foreground" : "text-foreground hover:bg-secondary"}`}>
      <Icon className="size-4 shrink-0" />
      <span>{item.label}</span>
      {!!item.badge && <span className={`ml-auto rounded-full px-1.5 text-xs ${active ? "bg-primary-foreground/20" : "bg-peach"}`}>{item.badge}</span>}
    </button>
  );
}
