import { ArrowRight, Inbox, MessageCircle, HelpCircle, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { enquiryStats } from "@/lib/admin-insights";
import { card, formatDate, StatusBadge, useAdminData } from "./shared";

export type AdminTab = "overview" | "mail" | "enquiries" | "chats" | "faqs" | "testimonials";

export function Overview({ go }: { go: (tab: AdminTab) => void }) {
  const { data } = useAdminData();
  const stats = enquiryStats(data?.messages ?? []);
  const wantsContact = (data?.chats ?? []).filter((c) => c.live_agent_requested).length;
  const tiles = [
    { label: "New enquiries", value: stats.new, hint: "Waiting for a reply", icon: Inbox, tone: "bg-peach", tab: "enquiries" as const },
    { label: "Last 7 days", value: stats.lastWeek, hint: `${stats.total} enquiries in total`, icon: Clock, tone: "bg-sky", tab: "enquiries" as const },
    { label: "Chats wanting contact", value: wantsContact, hint: `${data?.chats.length ?? 0} ${data?.chats.length === 1 ? "conversation" : "conversations"}`, icon: MessageCircle, tone: "bg-sage", tab: "chats" as const },
    { label: "FAQs live", value: data?.faqs.length ?? 0, hint: "On the FAQ page", icon: HelpCircle, tone: "bg-blush", tab: "faqs" as const },
  ];
  const latest = (data?.messages ?? []).slice(0, 5);
  return (
    <section className="space-y-6">
      <div>
        <h2 className="font-display text-2xl text-primary sm:text-3xl">Good to see you</h2>
        <p className="mt-1 text-sm text-muted-foreground">{stats.new ? `You have ${stats.new} new ${stats.new === 1 ? "enquiry" : "enquiries"} to reply to.` : "You're all caught up on enquiries."}</p>
      </div>
      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        {tiles.map((t) => (
          <button key={t.label} type="button" onClick={() => go(t.tab)} className={`${t.tone} min-w-0 rounded-xl border border-border p-4 text-left transition-transform hover:-translate-y-0.5`}>
            <t.icon className="size-5 text-primary" />
            <p className="mt-3 font-display text-3xl text-primary">{t.value}</p>
            <p className="mt-1 text-sm font-medium">{t.label}</p>
            <p className="truncate text-xs text-muted-foreground">{t.hint}</p>
          </button>
        ))}
      </div>
      <div className={card}>
        <div className="mb-3 flex items-center justify-between gap-3">
          <h3 className="font-semibold text-primary">Latest enquiries</h3>
          <Button variant="link" className="h-auto px-0" onClick={() => go("enquiries")}>View all <ArrowRight /></Button>
        </div>
        {!latest.length ? <p className="text-sm text-muted-foreground">No enquiries yet.</p> : (
          <ul className="divide-y divide-border">
            {latest.map((m) => (
              <li key={m.id} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 py-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{m.name}{m.practice && <span className="font-normal text-muted-foreground"> · {m.practice}</span>}</p>
                  <p className="truncate text-xs text-muted-foreground">{formatDate(m.created_at)}</p>
                </div>
                <StatusBadge status={m.status} />
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
