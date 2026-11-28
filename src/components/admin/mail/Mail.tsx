import { useEffect, useMemo, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useQueryClient } from "@tanstack/react-query";
import {
  Inbox, Star, Send, FileText, Archive, ShieldAlert, Trash2, Folder, FolderPlus, Clock, Search, Paperclip, PenSquare, ArrowLeft,
  MailOpen, Mail as MailIcon, RotateCcw, MoreVertical, FolderInput, Reply, ReplyAll, Forward, RefreshCw, Loader2, Plug, X, Pencil, Bell, BellOff, ChevronDown,
  AlarmClock, CalendarClock, Settings, Link2, Unlink,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { connectMailReceiving, getMailAttachmentUrl } from "@/lib/mail.functions";
import { escapeHtml, forwardSubject, replySubject, snoozeProblem } from "@/lib/mail-utils";
import {
  useMailbox, useThread, useMailSetup, useMailActions, useMailSettingsActions, timeLabel, whenLabel, formatBytes,
  type MailView, type MailThread, type MailMessage, type ThreadDetail,
} from "./api";
import { TimeMenu } from "./TimeMenu";
import { MailSettings } from "./MailSettings";
import { Composer, type ComposeInit } from "./Composer";
import { EmailFrame } from "./EmailFrame";

const SYSTEM: { view: MailView; label: string; icon: typeof Inbox; drop?: string }[] = [
  { view: "inbox", label: "Inbox", icon: Inbox, drop: "inbox" },
  { view: "starred", label: "Starred", icon: Star },
  { view: "snoozed", label: "Snoozed", icon: AlarmClock },
  { view: "followup", label: "Follow-up", icon: Clock },
  { view: "scheduled", label: "Scheduled", icon: CalendarClock },
  { view: "sent", label: "Sent", icon: Send },
  { view: "drafts", label: "Drafts", icon: FileText },
  { view: "archive", label: "Archive", icon: Archive, drop: "archive" },
  { view: "spam", label: "Spam", icon: ShieldAlert, drop: "spam" },
  { view: "bin", label: "Bin", icon: Trash2, drop: "bin" },
];

const STATUS_STYLE: Record<string, string> = {
  sent: "bg-secondary text-foreground", delivered: "bg-sky text-foreground", opened: "bg-sage text-foreground", clicked: "bg-sage text-foreground",
  bounced: "bg-destructive/15 text-destructive", complained: "bg-destructive/15 text-destructive", failed: "bg-destructive/15 text-destructive", draft: "bg-peach text-foreground", scheduled: "bg-peach text-foreground",
};
const STATUS_LABEL: Record<string, string> = { sent: "Sent", delivered: "Delivered", opened: "Opened", clicked: "Clicked", bounced: "Bounced", complained: "Spam complaint", failed: "Failed", draft: "Draft", scheduled: "Scheduled" };

const DRAG_TYPE = "application/x-practicemd-threads";

/** Something another Admin section asked Mail to do, e.g. "email this enquiry". */
export type MailIntent =
  | { kind: "compose"; to: string; subject: string; enquiryId: string }
  | { kind: "open"; threadId: string };

export function Mail({ intent, onIntentDone, onOpenEnquiry }: { intent?: MailIntent | null; onIntentDone?: () => void; onOpenEnquiry?: (id: string) => void } = {}) {
  const [view, setView] = useState<MailView>("inbox");
  const [folderId, setFolderId] = useState<string | undefined>();
  const [searchInput, setSearchInput] = useState("");
  const [q, setQ] = useState("");
  const [filters, setFilters] = useState({ unread: false, starred: false, attachments: false });
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [openId, setOpenId] = useState<string | null>(null);
  const [cursor, setCursor] = useState(0);
  const [compose, setCompose] = useState<ComposeInit | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);
  const composeKey = useRef(1);
  const qc = useQueryClient();

  useEffect(() => { const t = setTimeout(() => setQ(searchInput.trim()), 300); return () => clearTimeout(t); }, [searchInput]);

  const params = { view, ...(folderId ? { folderId } : {}), ...(q ? { q } : {}), ...(filters.unread ? { unread: true } : {}), ...(filters.starred ? { starred: true } : {}), ...(filters.attachments ? { attachments: true } : {}) };
  const box = useMailbox(params);
  const setup = useMailSetup();
  const thread = useThread(openId);
  const actions = useMailActions();
  const threads = box.data?.threads ?? [];
  const folders = box.data?.folders ?? [];
  const counts = box.data?.counts;
  const fromAddress = setup.data?.fromAddress ?? "hello@practicemd.uk";
  const signature = setup.data?.signatureHtml ? `<p><br></p><p>--</p>${setup.data.signatureHtml}` : "";

  function newMessage(extra: { to?: string; subject?: string; enquiryId?: string } = {}) {
    openCompose({ title: "New message", to: extra.to ?? "", cc: "", bcc: "", subject: extra.subject ?? "", html: `<p><br></p>${signature}`, ...(extra.enquiryId ? { enquiryId: extra.enquiryId } : {}) });
  }

  // Requests from other Admin sections (e.g. "Email" on an enquiry), handled once settings have loaded.
  useEffect(() => {
    if (!intent || setup.isLoading) return;
    if (intent.kind === "compose") newMessage({ to: intent.to, subject: intent.subject, enquiryId: intent.enquiryId });
    else { go("inbox"); setOpenId(intent.threadId); }
    onIntentDone?.();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [intent, setup.isLoading]);

  function go(next: MailView, id?: string) {
    setView(next); setFolderId(id); setSelected(new Set()); setOpenId(null); setCursor(0);
  }

  function openCompose(partial: Omit<ComposeInit, "key">) {
    setCompose({ ...partial, key: composeKey.current++ });
  }

  async function run(action: Parameters<typeof actions.update>[0]["action"], ids: string[], extra: { folderId?: string; days?: number; until?: string } = {}, message?: string) {
    if (!ids.length) return;
    if (["archive", "spam", "bin", "move", "restore", "inbox", "snooze", "unsnooze"].includes(action)) {
      // Close the conversation straight away so a later click isn't undone when the save finishes.
      setSelected(new Set());
      setOpenId((cur) => (cur && ids.includes(cur) ? null : cur));
    }
    try {
      await actions.update({ ids, action, ...extra });
      if (message) toast.success(message);
    } catch { toast.error("Couldn't update those conversations."); }
  }

  async function deleteForever(ids: string[]) {
    if (!ids.length || !window.confirm(`Delete ${ids.length === 1 ? "this conversation" : `${ids.length} conversations`} forever? This can't be undone.`)) return;
    setSelected(new Set());
    setOpenId((cur) => (cur && ids.includes(cur) ? null : cur));
    await actions.remove({ ids });
    toast.success("Deleted forever");
  }

  async function emptyBin() {
    if (!window.confirm("Delete everything in the Bin forever? This can't be undone.")) return;
    const r = await actions.remove({ emptyBin: true });
    toast.success(`Emptied the Bin (${r.deleted})`);
    setOpenId(null);
  }

  function startReply(detail: ThreadDetail, mode: "reply" | "all" | "forward", message?: MailMessage) {
    const real = detail.messages.filter((m) => m.status !== "draft");
    const target = message ?? real[real.length - 1];
    if (!target) return;
    const quoted = escapeHtml(target.text_body ?? "").replace(/\n/g, "<br>");
    const who = target.from_name ? `${escapeHtml(target.from_name)} &lt;${escapeHtml(target.from_address)}&gt;` : escapeHtml(target.from_address);
    const when = new Date(target.sent_at).toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" });
    if (mode === "forward") {
      openCompose({
        title: "Forward", to: "", cc: "", bcc: "", subject: forwardSubject(detail.thread.subject),
        html: `<p><br></p>${signature}<p>---------- Forwarded message ---------<br>From: ${who}<br>Date: ${when}<br>Subject: ${escapeHtml(target.subject)}<br>To: ${escapeHtml(target.to_addresses.join(", "))}</p><blockquote>${quoted}</blockquote>`,
      });
      return;
    }
    const inbound = target.direction === "in";
    const primary = inbound ? [target.from_address] : target.to_addresses;
    const others = mode === "all" ? [...target.to_addresses, ...target.cc_addresses].filter((a) => a !== fromAddress && !primary.includes(a)) : [];
    openCompose({
      title: mode === "all" ? "Reply all" : "Reply", threadId: detail.thread.id,
      to: primary.join(", "), cc: [...new Set(others)].join(", "), bcc: "", subject: replySubject(detail.thread.subject),
      html: `<p><br></p>${signature}<p><br></p><p>On ${when}, ${who} wrote:</p><blockquote>${quoted}</blockquote>`,
    });
  }

  function openDraft(m: MailMessage, threadId: string) {
    openCompose({
      title: "Draft", threadId, draftId: m.id, to: m.to_addresses.join(", "), cc: m.cc_addresses.join(", "), bcc: m.bcc_addresses.join(", "),
      subject: m.subject, html: m.html ?? "",
    });
  }

  function openThread(t: MailThread) {
    setOpenId(t.id);
    // Always show the latest state (folder, read flags, new replies) when a conversation is opened.
    void qc.invalidateQueries({ queryKey: ["mail", "thread", t.id] });
  }

  // Open the composer automatically for a new draft once its thread loads.
  useEffect(() => {
    const d = thread.data;
    if (!d || d.thread.id !== openId || d.thread.message_count > 0) return;
    const draft = d.messages.find((m) => m.status === "draft");
    if (draft && !compose) { openDraft(draft, d.thread.id); setOpenId(null); }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [thread.data, openId]);

  // Keyboard shortcuts.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const el = e.target as HTMLElement | null;
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (el && (el.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(el.tagName))) {
        if (e.key === "Escape") el.blur();
        return;
      }
      if (compose && e.key !== "Escape") return;
      const current = threads[cursor];
      switch (e.key) {
        case "c": e.preventDefault(); newMessage(); break;
        case "/": e.preventDefault(); searchRef.current?.focus(); break;
        case "j": setCursor((i) => Math.min(i + 1, Math.max(threads.length - 1, 0))); if (openId) { const n = threads[Math.min(cursor + 1, threads.length - 1)]; if (n) setOpenId(n.id); } break;
        case "k": setCursor((i) => Math.max(i - 1, 0)); if (openId) { const n = threads[Math.max(cursor - 1, 0)]; if (n) setOpenId(n.id); } break;
        case "Enter": case "o": if (current) setOpenId(current.id); break;
        case "Escape": if (openId) setOpenId(null); break;
        case "r": if (thread.data && openId) { e.preventDefault(); startReply(thread.data, "reply"); } break;
        case "a": if (thread.data && openId) { e.preventDefault(); startReply(thread.data, "all"); } break;
        case "f": if (thread.data && openId) { e.preventDefault(); startReply(thread.data, "forward"); } break;
        case "e": { const ids = targetIds(); if (ids.length) void run("archive", ids, {}, "Archived"); break; }
        case "#": { const ids = targetIds(); if (ids.length) void run("bin", ids, {}, "Moved to Bin"); break; }
        case "s": if (current) void run(current.starred ? "unstar" : "star", [current.id]); break;
      }
    }
    function targetIds() {
      if (selected.size) return [...selected];
      if (openId) return [openId];
      const c = threads[cursor];
      return c ? [c.id] : [];
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  const allSelected = threads.length > 0 && threads.every((t) => selected.has(t.id));
  const sel = [...selected];
  const inBin = view === "bin";
  const title = view === "folder" ? (folders.find((f) => f.id === folderId)?.name ?? "Folder") : (SYSTEM.find((s) => s.view === view)?.label ?? "Mail");

  function onDrop(e: React.DragEvent, target: { folder?: string; folderId?: string }) {
    e.preventDefault();
    const raw = e.dataTransfer.getData(DRAG_TYPE);
    if (!raw) return;
    const ids = JSON.parse(raw) as string[];
    if (target.folderId) void run("move", ids, { folderId: target.folderId }, "Moved");
    else if (target.folder === "bin") void run("bin", ids, {}, "Moved to Bin");
    else if (target.folder === "archive") void run("archive", ids, {}, "Archived");
    else if (target.folder === "spam") void run("spam", ids, {}, "Marked as spam");
    else if (target.folder === "inbox") void run("inbox", ids, {}, "Moved to Inbox");
  }

  return (
    <section aria-label="Mail" className="flex flex-col">
      <SetupBanner receiving={setup.data?.receiving} loading={setup.isLoading} />
      <div className="grid min-h-[36rem] grid-cols-1 overflow-hidden rounded-xl border border-border bg-card md:h-[calc(100dvh-11rem)] xl:grid-cols-[13rem_22rem_minmax(0,1fr)] md:grid-cols-[19rem_minmax(0,1fr)]">
        {/* Folder sidebar (xl) */}
        <aside className="hidden flex-col gap-1 overflow-y-auto border-r border-border p-3 xl:flex">
          <Button className="mb-2 justify-start rounded-2xl" onClick={() => newMessage()}><PenSquare /> Compose</Button>
          <nav aria-label="Mail folders" className="space-y-0.5">
            {SYSTEM.map((s) => (
              <FolderButton key={s.view} icon={s.icon} label={s.label} active={view === s.view} count={countFor(s.view, counts)}
                onClick={() => go(s.view)} {...(s.drop ? { onDrop: (e: React.DragEvent) => onDrop(e, { folder: s.drop ?? "" }) } : {})} />
            ))}
          </nav>
          <FolderSection folders={folders} activeId={view === "folder" ? folderId : undefined} unread={counts?.byFolder ?? {}}
            onOpen={(id) => go("folder", id)} onDrop={(e, id) => onDrop(e, { folderId: id })}
            onCreate={async (name) => { await actions.folder({ action: "create", name }); toast.success("Folder created"); }}
            onRename={async (id, name) => { await actions.folder({ action: "rename", id, name }); }}
            onDelete={async (id) => { if (!window.confirm("Delete this folder? Its conversations move back to the Inbox.")) return; await actions.folder({ action: "delete", id }); if (folderId === id) go("inbox"); }} />
        </aside>

        {/* Thread list */}
        <div className={`flex min-h-0 min-w-0 flex-col border-border md:border-r ${openId ? "hidden md:flex" : "flex"}`}>
          {/* Folder chips below xl */}
          <div className="flex gap-1 overflow-x-auto border-b border-border px-2 py-2 xl:hidden">
            {SYSTEM.map((s) => (
              <button key={s.view} type="button" onClick={() => go(s.view)}
                className={`flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium ${view === s.view ? "bg-primary text-primary-foreground" : "bg-secondary text-foreground"}`}>
                <s.icon className="size-3.5" />{s.label}{countFor(s.view, counts) ? <span className="opacity-80">{countFor(s.view, counts)}</span> : null}
              </button>
            ))}
            {folders.map((f) => (
              <button key={f.id} type="button" onClick={() => go("folder", f.id)}
                className={`flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium ${view === "folder" && folderId === f.id ? "bg-primary text-primary-foreground" : "bg-secondary text-foreground"}`}>
                <Folder className="size-3.5" />{f.name}
              </button>
            ))}
            <button type="button" className="flex shrink-0 items-center gap-1 rounded-full border border-dashed border-border px-3 py-1 text-xs"
              onClick={async () => { const name = window.prompt("New folder name")?.trim(); if (name) { await actions.folder({ action: "create", name: name.slice(0, 60) }); toast.success("Folder created"); } }}>
              <FolderPlus className="size-3.5" /> New folder
            </button>
          </div>
          <div className="space-y-2 border-b border-border p-3">
            <label className="flex items-center gap-2 rounded-full bg-secondary px-3 py-2">
              <Search className="size-4 shrink-0 text-muted-foreground" />
              <input ref={searchRef} value={searchInput} onChange={(e) => setSearchInput(e.target.value)} placeholder="Search mail" aria-label="Search mail"
                className="w-full min-w-0 bg-transparent text-sm outline-hidden placeholder:text-muted-foreground" />
              {searchInput && <button type="button" aria-label="Clear search" onClick={() => setSearchInput("")}><X className="size-4 text-muted-foreground" /></button>}
            </label>
            <div className="flex flex-wrap items-center gap-1.5">
              {(["unread", "starred", "attachments"] as const).map((k) => (
                <button key={k} type="button" aria-pressed={filters[k]} onClick={() => setFilters((f) => ({ ...f, [k]: !f[k] }))}
                  className={`rounded-full border px-2.5 py-0.5 text-xs capitalize ${filters[k] ? "border-primary bg-primary text-primary-foreground" : "border-border text-muted-foreground hover:text-foreground"}`}>
                  {k === "attachments" ? "Has attachment" : k}
                </button>
              ))}
            </div>
          </div>
          <div className="flex min-h-11 items-center gap-1 border-b border-border px-3 py-1.5">
            <input type="checkbox" aria-label="Select all" className="size-4 accent-primary" checked={allSelected}
              onChange={() => setSelected(allSelected ? new Set() : new Set(threads.map((t) => t.id)))} />
            {sel.length > 0 ? (
              <div className="flex min-w-0 flex-1 items-center gap-0.5">
                <span className="mx-1 shrink-0 text-xs text-muted-foreground">{sel.length}</span>
                {inBin ? (
                  <>
                    <IconAction label="Restore" icon={RotateCcw} onClick={() => run("restore", sel, {}, "Restored")} />
                    <IconAction label="Delete forever" icon={Trash2} onClick={() => deleteForever(sel)} />
                  </>
                ) : (
                  <>
                    <IconAction label="Archive" icon={Archive} onClick={() => run("archive", sel, {}, "Archived")} />
                    <IconAction label="Move to Bin" icon={Trash2} onClick={() => run("bin", sel, {}, "Moved to Bin")} />
                    <IconAction label="Mark as read" icon={MailOpen} onClick={() => run("read", sel)} />
                    <IconAction label="Mark as unread" icon={MailIcon} onClick={() => run("unread", sel)} />
                    <IconAction label="Star" icon={Star} onClick={() => run("star", sel)} />
                  </>
                )}
                <MoveMenu folders={folders} onMove={(target) => moveTo(target, sel)} />
              </div>
            ) : (
              <div className="flex min-w-0 flex-1 items-center justify-between gap-2">
                <span className="truncate pl-1 text-sm font-medium">{title}</span>
                <div className="flex shrink-0 items-center gap-0.5">
                  {inBin && threads.length > 0 && <Button size="sm" variant="ghost" onClick={emptyBin}>Empty Bin</Button>}
                  <IconAction label="Refresh" icon={box.isFetching ? Loader2 : RefreshCw} spin={box.isFetching} onClick={() => actions.refresh()} />
                  <IconAction label="Mail settings" icon={Settings} onClick={() => setSettingsOpen(true)} />
                </div>
              </div>
            )}
          </div>
          {inBin && <p className="border-b border-border bg-secondary/50 px-3 py-1.5 text-xs text-muted-foreground">Conversations in the Bin for more than 30 days are deleted automatically.</p>}
          {view === "snoozed" && <p className="border-b border-border bg-secondary/50 px-3 py-1.5 text-xs text-muted-foreground">Snoozed conversations come back as unread at the time you chose, or sooner if someone replies.</p>}
          {view === "scheduled" && <p className="border-b border-border bg-secondary/50 px-3 py-1.5 text-xs text-muted-foreground">Emails waiting to go out. Open one to cancel it and edit it as a draft.</p>}
          {view === "followup" && <p className="border-b border-border bg-secondary/50 px-3 py-1.5 text-xs text-muted-foreground">Sent emails that haven't had a reply by their reminder date.</p>}
          <ul className="min-h-0 flex-1 overflow-y-auto" aria-label="Conversations">
            {box.isLoading && <li className="p-6 text-center text-sm text-muted-foreground">Loading…</li>}
            {box.isError && <li className="p-6 text-center text-sm text-destructive">Couldn't load your mail.</li>}
            {!box.isLoading && threads.length === 0 && <li className="p-10 text-center text-sm text-muted-foreground">{q ? "No conversations match your search." : `Nothing in ${title}.`}</li>}
            {threads.map((t, i) => (
              <ThreadRow key={t.id} thread={t} active={openId === t.id} focused={cursor === i} checked={selected.has(t.id)} view={view}
                onToggle={() => setSelected((s) => { const n = new Set(s); if (n.has(t.id)) n.delete(t.id); else n.add(t.id); return n; })}
                onStar={() => run(t.starred ? "unstar" : "star", [t.id])}
                onOpen={() => { setCursor(i); openThread(t); }}
                dragIds={selected.has(t.id) ? sel : [t.id]} />
            ))}
          </ul>
        </div>

        {/* Reader */}
        <div className={`min-h-0 min-w-0 flex-col ${openId ? "flex" : "hidden md:flex"}`}>
          {!openId && (
            <div className="flex flex-1 flex-col items-center justify-center gap-2 p-10 text-center text-muted-foreground">
              <MailIcon className="size-10 opacity-40" />
              <p className="text-sm">Select a conversation to read it.</p>
              <p className="hidden text-xs md:block">Shortcuts: c compose · r reply · e archive · # bin · j/k next/previous · / search</p>
            </div>
          )}
          {openId && thread.isLoading && <div className="p-10 text-center text-sm text-muted-foreground">Loading…</div>}
          {openId && thread.data === null && <div className="p-10 text-center text-sm text-muted-foreground">This conversation no longer exists.</div>}
          {openId && thread.data && (
            <Reader detail={thread.data} folders={folders} fromAddress={fromAddress}
              onBack={() => setOpenId(null)}
              onAction={(action, extra, msg) => run(action, [thread.data!.thread.id], extra, msg)}
              onMove={(target) => moveTo(target, [thread.data!.thread.id])}
              onDeleteForever={() => deleteForever([thread.data!.thread.id])}
              onReply={(mode, m) => startReply(thread.data!, mode, m)}
              {...(onOpenEnquiry ? { onOpenEnquiry } : {})}
              onOpenDraft={(m) => openDraft(m, thread.data!.thread.id)} />
          )}
        </div>
      </div>

      <button type="button" onClick={() => newMessage()}
        className="fixed bottom-5 right-5 z-40 flex items-center gap-2 rounded-2xl bg-primary px-5 py-3.5 text-sm font-medium text-primary-foreground shadow-lg xl:hidden">
        <PenSquare className="size-4" /> Compose
      </button>

      <MailSettings open={settingsOpen} onOpenChange={setSettingsOpen} signature={setup.data?.signature ?? {}} />

      {compose && (
        <Composer key={compose.key} init={compose} fromAddress={fromAddress} onClose={() => setCompose(null)}
          onSent={(id) => { setCompose(null); if (openId !== id && view !== "sent") return; setOpenId(id); }} />
      )}
    </section>
  );

  function moveTo(target: string, ids: string[]) {
    if (target === "inbox") void run("inbox", ids, {}, "Moved to Inbox");
    else if (target === "archive") void run("archive", ids, {}, "Archived");
    else if (target === "spam") void run("spam", ids, {}, "Marked as spam");
    else void run("move", ids, { folderId: target }, "Moved");
  }
}

function countFor(view: MailView, counts?: { inbox: number; drafts: number; followup: number; spam: number; scheduled: number }) {
  if (!counts) return 0;
  if (view === "scheduled") return counts.scheduled;
  if (view === "inbox") return counts.inbox;
  if (view === "drafts") return counts.drafts;
  if (view === "followup") return counts.followup;
  if (view === "spam") return counts.spam;
  return 0;
}

function SetupBanner({ receiving, loading }: { receiving?: boolean | undefined; loading: boolean }) {
  const qc = useQueryClient();
  const connect = useServerFn(connectMailReceiving);
  const [busy, setBusy] = useState(false);
  if (loading || receiving) return null;
  return (
    <div className="mb-3 flex flex-col gap-3 rounded-xl border border-border bg-peach/60 p-4 sm:flex-row sm:items-center">
      <Plug className="size-5 shrink-0 text-primary" />
      <p className="min-w-0 flex-1 text-sm">Turn on incoming mail and delivery tracking. Emails sent to your address will appear here once the site is published.</p>
      <Button size="sm" disabled={busy} onClick={async () => {
        setBusy(true);
        try {
          const r = await connect();
          if (r.ok) { toast.success("Incoming mail and tracking are on"); await qc.invalidateQueries({ queryKey: ["mail-setup"] }); }
          else toast.error(r.error);
        } finally { setBusy(false); }
      }}>{busy ? <Loader2 className="animate-spin" /> : null} Turn on incoming mail</Button>
    </div>
  );
}

function FolderButton({ icon: Icon, label, active, count, onClick, onDrop }: { icon: typeof Inbox; label: string; active: boolean; count?: number; onClick: () => void; onDrop?: (e: React.DragEvent) => void }) {
  const [over, setOver] = useState(false);
  return (
    <button type="button" onClick={onClick} aria-current={active ? "page" : undefined}
      onDragOver={onDrop ? (e) => { e.preventDefault(); setOver(true); } : undefined}
      onDragLeave={() => setOver(false)}
      onDrop={onDrop ? (e) => { setOver(false); onDrop(e); } : undefined}
      className={`flex w-full items-center gap-3 rounded-r-full px-3 py-1.5 text-sm transition-colors ${active ? "bg-secondary font-semibold text-primary" : "text-foreground hover:bg-secondary/60"} ${over ? "ring-2 ring-accent" : ""}`}>
      <Icon className="size-4 shrink-0" />
      <span className="min-w-0 flex-1 truncate text-left">{label}</span>
      {!!count && <span className="shrink-0 text-xs font-semibold">{count}</span>}
    </button>
  );
}

function FolderSection({ folders, activeId, unread, onOpen, onDrop, onCreate, onRename, onDelete }: {
  folders: { id: string; name: string }[]; activeId?: string | undefined; unread: Record<string, number>;
  onOpen: (id: string) => void; onDrop: (e: React.DragEvent, id: string) => void;
  onCreate: (name: string) => Promise<void>; onRename: (id: string, name: string) => Promise<void>; onDelete: (id: string) => Promise<void>;
}) {
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState("");
  return (
    <div className="mt-4">
      <div className="flex items-center justify-between px-3 pb-1">
        <span className="font-mono text-[11px] uppercase tracking-[0.06em] text-muted-foreground">Folders</span>
        <button type="button" aria-label="New folder" onClick={() => setAdding(true)} className="rounded p-1 text-muted-foreground hover:bg-secondary hover:text-foreground"><FolderPlus className="size-4" /></button>
      </div>
      {adding && (
        <form className="px-2 pb-1" onSubmit={async (e) => { e.preventDefault(); const n = name.trim(); if (!n) return; await onCreate(n.slice(0, 60)); setName(""); setAdding(false); }}>
          <input autoFocus value={name} onChange={(e) => setName(e.target.value)} onBlur={() => { if (!name.trim()) setAdding(false); }} placeholder="Folder name" aria-label="Folder name" maxLength={60}
            className="w-full rounded-md border border-input bg-background px-2 py-1 text-sm outline-hidden focus:border-accent" />
        </form>
      )}
      {folders.map((f) => (
        <div key={f.id} className="group flex items-center">
          <div className="min-w-0 flex-1">
            <FolderButton icon={Folder} label={f.name} active={activeId === f.id} count={unread[f.id] ?? 0} onClick={() => onOpen(f.id)} onDrop={(e) => onDrop(e, f.id)} />
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger aria-label={`${f.name} options`} className="shrink-0 rounded p-1 text-muted-foreground hover:bg-secondary"><MoreVertical className="size-3.5" /></DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onSelect={() => { const n = window.prompt("Rename folder", f.name)?.trim(); if (n) void onRename(f.id, n.slice(0, 60)); }}><Pencil /> Rename</DropdownMenuItem>
              <DropdownMenuItem onSelect={() => void onDelete(f.id)} className="text-destructive"><Trash2 /> Delete folder</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      ))}
      {folders.length === 0 && !adding && <p className="px-3 text-xs text-muted-foreground">Drag conversations onto a folder to file them.</p>}
    </div>
  );
}

function IconAction({ label, icon: Icon, onClick, spin }: { label: string; icon: typeof Inbox; onClick: () => void; spin?: boolean }) {
  return (
    <button type="button" title={label} aria-label={label} onClick={onClick} className="shrink-0 rounded-full p-2 text-muted-foreground hover:bg-secondary hover:text-foreground">
      <Icon className={`size-4 ${spin ? "animate-spin" : ""}`} />
    </button>
  );
}

function MoveMenu({ folders, onMove, label = "Move to" }: { folders: { id: string; name: string }[]; onMove: (target: string) => void; label?: string }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger title={label} aria-label={label} className="shrink-0 rounded-full p-2 text-muted-foreground hover:bg-secondary hover:text-foreground"><FolderInput className="size-4" /></DropdownMenuTrigger>
      <DropdownMenuContent align="start">
        <DropdownMenuLabel>Move to</DropdownMenuLabel>
        <DropdownMenuItem onSelect={() => onMove("inbox")}><Inbox /> Inbox</DropdownMenuItem>
        <DropdownMenuItem onSelect={() => onMove("archive")}><Archive /> Archive</DropdownMenuItem>
        <DropdownMenuItem onSelect={() => onMove("spam")}><ShieldAlert /> Spam</DropdownMenuItem>
        {folders.length > 0 && <DropdownMenuSeparator />}
        {folders.map((f) => <DropdownMenuItem key={f.id} onSelect={() => onMove(f.id)}><Folder /> {f.name}</DropdownMenuItem>)}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function ThreadRow({ thread: t, active, focused, checked, view, onToggle, onStar, onOpen, dragIds }: {
  thread: MailThread; active: boolean; focused: boolean; checked: boolean; view: MailView;
  onToggle: () => void; onStar: () => void; onOpen: () => void; dragIds: string[];
}) {
  const who = view === "sent" || view === "drafts" ? `To: ${t.participants || "(no recipients)"}` : t.participants || "(unknown sender)";
  const due = t.follow_up_at && new Date(t.follow_up_at) <= new Date();
  return (
    <li draggable onDragStart={(e) => { e.dataTransfer.setData(DRAG_TYPE, JSON.stringify(dragIds)); e.dataTransfer.effectAllowed = "move"; }}
      className={`grid cursor-pointer grid-cols-[auto_auto_minmax(0,1fr)] items-start gap-2 border-b border-border/70 px-3 py-2.5 text-sm transition-colors ${active ? "bg-secondary" : checked ? "bg-mint/50" : t.unread ? "bg-card" : "bg-background/40"} ${focused ? "shadow-[inset_3px_0_0_var(--color-accent)]" : ""} hover:bg-secondary/70`}
      onClick={onOpen}>
      <input type="checkbox" className="mt-1 size-4 accent-primary" aria-label={`Select ${t.subject}`} checked={checked} onClick={(e) => e.stopPropagation()} onChange={onToggle} />
      <button type="button" aria-label={t.starred ? "Unstar" : "Star"} aria-pressed={t.starred} onClick={(e) => { e.stopPropagation(); onStar(); }} className="mt-0.5">
        <Star className={`size-4 ${t.starred ? "fill-amber-400 text-amber-500" : "text-muted-foreground"}`} />
      </button>
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <span className={`min-w-0 flex-1 truncate ${t.unread ? "font-semibold text-foreground" : "text-foreground/80"}`}>{who}</span>
          {t.message_count > 1 && <span className="shrink-0 text-xs text-muted-foreground">{t.message_count}</span>}
          {t.has_attachments && <Paperclip className="size-3.5 shrink-0 text-muted-foreground" aria-label="Has attachment" />}
          {view === "snoozed" && t.snoozed_until
            ? <span className="shrink-0 text-xs text-accent">Until {timeLabel(t.snoozed_until)}</span>
            : <span className={`shrink-0 text-xs ${t.unread ? "font-semibold text-foreground" : "text-muted-foreground"}`}>{timeLabel(t.last_message_at)}</span>}
        </div>
        <p className={`truncate ${t.unread ? "font-semibold" : ""}`}>
          {t.has_draft && <span className="mr-1 text-destructive">Draft</span>}
          {due && <span className="mr-1 text-accent">Follow up</span>}
          {t.subject || "(no subject)"}
        </p>
        <p className="truncate text-xs text-muted-foreground">{t.snippet}</p>
      </div>
    </li>
  );
}

function Reader({ detail, folders, fromAddress, onBack, onAction, onMove, onDeleteForever, onReply, onOpenDraft, onOpenEnquiry }: {
  detail: ThreadDetail; folders: { id: string; name: string }[]; fromAddress: string;
  onBack: () => void;
  onAction: (action: "unread" | "star" | "unstar" | "archive" | "spam" | "bin" | "restore" | "inbox" | "followup" | "clear_followup" | "snooze" | "unsnooze", extra?: { days?: number; until?: string }, msg?: string) => void;
  onOpenEnquiry?: (id: string) => void;
  onMove: (target: string) => void; onDeleteForever: () => void;
  onReply: (mode: "reply" | "all" | "forward", m?: MailMessage) => void; onOpenDraft: (m: MailMessage) => void;
}) {
  const { thread: t, messages, enquiry, suggestions } = detail;
  const settings = useMailSettingsActions();
  const real = messages.filter((m) => m.status !== "draft");
  const drafts = messages.filter((m) => m.status === "draft");
  const [expanded, setExpanded] = useState<Set<string>>(() => new Set(real.slice(-1).map((m) => m.id)));
  useEffect(() => { setExpanded(new Set(real.slice(-1).map((m) => m.id))); // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [t.id]);
  const inBin = t.folder === "bin";
  const followDue = t.follow_up_at ? new Date(t.follow_up_at) : null;
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex min-h-11 items-center gap-0.5 border-b border-border px-2 py-1.5">
        <IconAction label="Back to list" icon={ArrowLeft} onClick={onBack} />
        {inBin ? (
          <>
            <IconAction label="Restore" icon={RotateCcw} onClick={() => onAction("restore", {}, "Restored")} />
            <IconAction label="Delete forever" icon={Trash2} onClick={onDeleteForever} />
          </>
        ) : (
          <>
            {t.folder === "archive" || t.folder === "spam" ? <IconAction label="Move to Inbox" icon={Inbox} onClick={() => onAction("inbox", {}, "Moved to Inbox")} />
              : <IconAction label="Archive" icon={Archive} onClick={() => onAction("archive", {}, "Archived")} />}
            <IconAction label="Report spam" icon={ShieldAlert} onClick={() => onAction("spam", {}, "Marked as spam")} />
            <IconAction label="Move to Bin" icon={Trash2} onClick={() => onAction("bin", {}, "Moved to Bin")} />
          </>
        )}
        <IconAction label="Mark as unread" icon={MailIcon} onClick={() => { onAction("unread"); onBack(); }} />
        <MoveMenu folders={folders} onMove={onMove} />
        {t.folder === "snoozed"
          ? <IconAction label="Unsnooze" icon={AlarmClock} onClick={() => onAction("unsnooze", {}, "Unsnoozed")} />
          : !inBin && t.folder !== "spam" && (
            <TimeMenu label="Snooze" heading="Snooze until…" confirmLabel="Snooze" validate={(d) => snoozeProblem(d)}
              onPick={(d) => onAction("snooze", { until: d.toISOString() }, `Snoozed until ${whenLabel(d)}`)}
              triggerClassName="shrink-0 rounded-full p-2 text-muted-foreground hover:bg-secondary hover:text-foreground">
              <AlarmClock className="size-4" />
            </TimeMenu>
          )}
        <DropdownMenu>
          <DropdownMenuTrigger title="Follow-up reminder" aria-label="Follow-up reminder" className="shrink-0 rounded-full p-2 text-muted-foreground hover:bg-secondary hover:text-foreground"><Bell className="size-4" /></DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            <DropdownMenuLabel>Remind me if no reply in…</DropdownMenuLabel>
            {[1, 2, 3, 5, 7, 14].map((d) => <DropdownMenuItem key={d} onSelect={() => onAction("followup", { days: d }, `Reminder set for ${d} day${d > 1 ? "s" : ""}`)}>{d} day{d > 1 ? "s" : ""}</DropdownMenuItem>)}
            {followDue && <><DropdownMenuSeparator /><DropdownMenuItem onSelect={() => onAction("clear_followup", {}, "Reminder removed")}><BellOff /> Remove reminder</DropdownMenuItem></>}
          </DropdownMenuContent>
        </DropdownMenu>
        <span className="flex-1" />
        <IconAction label={t.starred ? "Unstar" : "Star"} icon={Star} onClick={() => onAction(t.starred ? "unstar" : "star")} />
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4 sm:px-6">
        <h2 className="font-display text-xl text-primary sm:text-2xl">{t.subject || "(no subject)"}</h2>
        <div className="mt-1 flex flex-wrap gap-2 text-xs text-muted-foreground">
          <span className="rounded-full bg-secondary px-2 py-0.5 capitalize">{t.folder === "custom" ? (folders.find((f) => f.id === t.custom_folder_id)?.name ?? "Folder") : t.folder}</span>
          {followDue && <span className="rounded-full bg-mint px-2 py-0.5 text-foreground">Follow up {followDue <= new Date() ? "due now" : `on ${followDue.toLocaleDateString("en-GB", { day: "numeric", month: "short" })}`}</span>}
          {t.folder === "snoozed" && t.snoozed_until && <span className="rounded-full bg-peach px-2 py-0.5 text-foreground">Snoozed until {whenLabel(new Date(t.snoozed_until))}</span>}
        </div>
        {enquiry ? (
          <div className="mt-3 grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2 rounded-lg border border-border bg-mint/40 px-3 py-2 text-sm">
            <span className="min-w-0 truncate"><span className="text-muted-foreground">Enquiry: </span><span className="font-medium">{enquiry.name}</span>
              {enquiry.practice ? <span className="text-muted-foreground"> · {enquiry.practice}</span> : null} <span className="ml-1 rounded-full bg-card px-2 py-0.5 text-xs capitalize">{enquiry.status}</span></span>
            <span className="flex shrink-0 items-center gap-1">
              {onOpenEnquiry && <Button size="sm" variant="ghost" onClick={() => onOpenEnquiry(enquiry.id)}>View enquiry</Button>}
              <IconAction label="Unlink enquiry" icon={Unlink} onClick={async () => { await settings.link(t.id, null); toast.success("Enquiry unlinked"); }} />
            </span>
          </div>
        ) : suggestions.length > 0 && (
          <div className="mt-3 flex flex-wrap items-center gap-2 text-sm">
            <span className="text-muted-foreground">Matching enquiry:</span>
            {suggestions.map((e) => (
              <Button key={e.id} size="sm" variant="outline" className="rounded-full" onClick={async () => { await settings.link(t.id, e.id); toast.success("Linked to the enquiry"); }}>
                <Link2 /> Link {e.name} · {new Date(e.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
              </Button>
            ))}
          </div>
        )}
        <div className="mt-4 space-y-3">
          {real.map((m) => (
            <MessageCard key={m.id} m={m} fromAddress={fromAddress} open={expanded.has(m.id)}
              onToggle={() => setExpanded((s) => { const n = new Set(s); if (n.has(m.id)) n.delete(m.id); else n.add(m.id); return n; })}
              onReply={(mode) => onReply(mode, m)} />
          ))}
          {drafts.map((m) => (
            <div key={m.id} className="flex flex-wrap items-center gap-3 rounded-xl border border-dashed border-border p-3 text-sm">
              <span className="rounded-full bg-peach px-2 py-0.5 text-xs">Draft</span>
              <span className="min-w-0 flex-1 truncate text-muted-foreground">{m.text_body || "(empty)"}</span>
              <Button size="sm" variant="outline" onClick={() => onOpenDraft(m)}>Continue editing</Button>
            </div>
          ))}
        </div>
        {real.length > 0 && (
          <div className="mt-5 flex flex-wrap gap-2">
            <Button variant="outline" className="rounded-full" onClick={() => onReply("reply")}><Reply /> Reply</Button>
            <Button variant="outline" className="rounded-full" onClick={() => onReply("all")}><ReplyAll /> Reply all</Button>
            <Button variant="outline" className="rounded-full" onClick={() => onReply("forward")}><Forward /> Forward</Button>
          </div>
        )}
      </div>
    </div>
  );
}

function MessageCard({ m, fromAddress, open, onToggle, onReply }: { m: MailMessage; fromAddress: string; open: boolean; onToggle: () => void; onReply: (mode: "reply" | "all" | "forward") => void }) {
  const getUrl = useServerFn(getMailAttachmentUrl);
  const [showTimeline, setShowTimeline] = useState(false);
  const out = m.direction === "out";
  const name = out ? "You" : m.from_name || m.from_address;
  const events = [...(m.mail_events ?? [])].sort((a, b) => a.occurred_at.localeCompare(b.occurred_at));
  const initials = (out ? "PM" : (m.from_name || m.from_address).slice(0, 2)).toUpperCase();
  return (
    <article className="rounded-xl border border-border bg-background/60">
      <button type="button" onClick={onToggle} className="grid w-full grid-cols-[auto_minmax(0,1fr)_auto] items-start gap-3 px-4 py-3 text-left">
        <span className={`flex size-9 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${out ? "bg-primary text-primary-foreground" : "bg-mint text-primary"}`}>{initials}</span>
        <span className="min-w-0">
          <span className="flex flex-wrap items-center gap-x-2">
            <span className="truncate font-semibold">{name}</span>
            {!out && m.from_name && <span className="truncate text-xs text-muted-foreground">&lt;{m.from_address}&gt;</span>}
          </span>
          <span className="block truncate text-xs text-muted-foreground">
            {open ? `to ${m.to_addresses.join(", ") || fromAddress}${m.cc_addresses.length ? `, cc ${m.cc_addresses.join(", ")}` : ""}${out && m.bcc_addresses.length ? `, bcc ${m.bcc_addresses.join(", ")}` : ""}` : (m.text_body ?? "").slice(0, 140)}
          </span>
        </span>
        <span className="flex shrink-0 flex-col items-end gap-1">
          <span className="text-xs text-muted-foreground">{timeLabel(m.sent_at)}</span>
          {out && <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${STATUS_STYLE[m.status] ?? "bg-secondary"}`}>{STATUS_LABEL[m.status] ?? m.status}</span>}
          {m.status === "scheduled" && m.scheduled_at && <span className="text-[11px] text-muted-foreground">{whenLabel(new Date(m.scheduled_at))}</span>}
        </span>
      </button>
      {open && (
        <div className="border-t border-border/60 px-4 py-4">
          {m.status === "scheduled" && <ScheduledNotice m={m} />}
          <EmailFrame html={m.html} text={m.text_body} />
          {(m.mail_attachments ?? []).length > 0 && (
            <ul className="mt-4 flex flex-wrap gap-2">
              {m.mail_attachments.map((a) => (
                <li key={a.id}>
                  <button type="button" className="flex max-w-64 items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 text-xs hover:border-accent"
                    onClick={async () => { const r = await getUrl({ data: { id: a.id } }); if (r.url) window.open(r.url, "_blank", "noopener"); else toast.error("This attachment isn't available."); }}>
                    <Paperclip className="size-3.5 shrink-0" /><span className="truncate">{a.filename}</span><span className="shrink-0 text-muted-foreground">{formatBytes(a.size)}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
          {out && events.length > 0 && (
            <div className="mt-4">
              <button type="button" className="flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground" onClick={() => setShowTimeline((v) => !v)} aria-expanded={showTimeline}>
                Delivery timeline <ChevronDown className={`size-3.5 transition-transform ${showTimeline ? "rotate-180" : ""}`} />
              </button>
              {showTimeline && (
                <ol className="mt-2 space-y-1.5 border-l border-border pl-4">
                  {events.map((e) => (
                    <li key={e.id} className="text-xs">
                      <span className="font-medium capitalize">{STATUS_LABEL[e.type] ?? e.type.replace("_", " ")}</span>
                      <span className="text-muted-foreground"> · {new Date(e.occurred_at).toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" })}</span>
                      {e.detail && <span className="block truncate text-muted-foreground">{e.detail}</span>}
                    </li>
                  ))}
                </ol>
              )}
            </div>
          )}
          <div className="mt-4 flex gap-1">
            <IconAction label="Reply" icon={Reply} onClick={() => onReply("reply")} />
            <IconAction label="Reply all" icon={ReplyAll} onClick={() => onReply("all")} />
            <IconAction label="Forward" icon={Forward} onClick={() => onReply("forward")} />
          </div>
        </div>
      )}
    </article>
  );
}

function ScheduledNotice({ m }: { m: MailMessage }) {
  const settings = useMailSettingsActions();
  const [busy, setBusy] = useState(false);
  return (
    <div className="mb-3 flex flex-col gap-2 rounded-lg bg-peach/60 px-3 py-2 text-sm sm:flex-row sm:items-center">
      <CalendarClock className="size-4 shrink-0 text-primary" />
      <span className="min-w-0 flex-1">Scheduled to send {m.scheduled_at ? whenLabel(new Date(m.scheduled_at)) : "later"}.</span>
      <Button size="sm" variant="outline" disabled={busy} onClick={async () => {
        setBusy(true);
        try {
          const r = await settings.cancelScheduled(m.id);
          if (!r.ok) toast.error(r.error);
          else toast.success(r.hadAttachments ? "Send cancelled — it's a draft again. Re-attach any files before sending." : "Send cancelled — it's a draft again.");
        } finally { setBusy(false); }
      }}>{busy && <Loader2 className="animate-spin" />} Cancel send</Button>
    </div>
  );
}
