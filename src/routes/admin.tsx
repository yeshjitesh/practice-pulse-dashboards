import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import { useServerFn } from "@tanstack/react-start";
import { getAdminData, changeAdminData, lockAdmin } from "@/lib/admin.functions";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/brand/Logo";

export const Route = createFileRoute("/admin")({
  staticData: { sitemap: false },
  loader: () => getAdminData(),
  head: () => ({
    meta: [
      { title: "Admin — PracticeMD" },
      { name: "description", content: "Manage messages and page content." },
      { property: "og:title", content: "Admin — PracticeMD" },
      { property: "og:description", content: "PracticeMD admin area." },
      { name: "robots", content: "noindex" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Admin,
});

type Tab = "messages" | "chats" | "testimonials" | "faqs";

function Admin() {
  const qc = useQueryClient();
  const navigate = useNavigate();
  const lock = useServerFn(lockAdmin);
  const [tab, setTab] = useState<Tab>("messages");
  async function signOut() {
    await lock();
    await qc.cancelQueries();
    qc.clear();
    await navigate({ to: "/auth", replace: true });
  }

  return (
    <div className="min-h-screen bg-secondary">
      <header className="border-b border-border bg-card">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <Link to="/"><Logo iconOnlyOnMobile /></Link>
          <div className="flex items-center gap-4 text-sm">
            <Button variant="ghost" onClick={signOut} className="rounded-full border border-input px-4 py-2 hover:bg-secondary">Sign out</Button>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-6 py-10">
            <h1 className="font-display text-2xl text-primary">No admin access</h1>
            <p className="mt-2 text-muted-foreground">This account isn't an admin of this site.</p>
          </div>
        ) : (
          <>
            <h1 className="font-display text-4xl text-primary">Admin</h1>
            <div className="mt-6 flex flex-wrap gap-2">
              {(["messages", "chats", "testimonials", "faqs"] as Tab[]).map((t) => (
                <Button variant="ghost" key={t} onClick={() => setTab(t)} className={`rounded-full px-4 py-2 text-sm font-medium capitalize transition-colors ${tab === t ? "bg-primary text-primary-foreground" : "bg-card text-foreground hover:bg-background"}`}>
                  {t === "faqs" ? "FAQs" : t}
                </Button>
              ))}
            </div>
            <div className="mt-6">
              {tab === "messages" && <Messages />}
              {tab === "chats" && <Chats />}
              {tab === "testimonials" && <Testimonials />}
              {tab === "faqs" && <Faqs />}
            </div>
      </main>
    </div>
  );
}

const card = "rounded-xl border border-border bg-card p-5";
const field = "w-full rounded-lg border border-input bg-background px-3 py-2 outline-none focus:border-accent";
const small = "rounded-full px-3 py-1 text-xs font-medium";

function Messages() {
  const qc = useQueryClient();
  const change = useServerFn(changeAdminData);
  const q = useQuery({
    queryKey: ["admin-messages"],
    queryFn: async () => (await getAdminData()).messages,
  });
  const refresh = () => qc.invalidateQueries({ queryKey: ["admin-messages"] });
  async function setStatus(id: string, status: string) {
    try { await change({ data: { table: "contact_submissions", action: "save", id, row: { status: status as "new" | "replied" | "closed" } } }); refresh(); }
    catch { toast.error("Couldn't update"); }
  }
  async function remove(id: string) {
    if (!confirm("Delete this message?")) return;
    try { await change({ data: { table: "contact_submissions", action: "delete", id } }); toast.success("Deleted"); refresh(); }
    catch { toast.error("Couldn't delete"); }
  }
  if (q.isLoading) return <p className="text-muted-foreground">Loading…</p>;
  if (!q.data?.length) return <p className="text-muted-foreground">No messages yet.</p>;
  return (
    <div className="space-y-3">
      {q.data.map((m) => (
        <div key={m.id} className={card}>
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <p className="font-semibold text-primary">{m.name} {m.practice && <span className="font-normal text-muted-foreground">· {m.practice}</span>}</p>
              <a href={`mailto:${m.email}`} className="text-sm text-accent hover:underline">{m.email}</a>
            </div>
            <span className="text-xs text-muted-foreground">{new Date(m.created_at).toLocaleString("en-GB")}</span>
          </div>
          <dl className="mt-3 grid gap-x-6 gap-y-1 text-sm sm:grid-cols-2">
            {([
              ["Phone", m.phone], ["Role", m.job_role], ["Organisation", m.organisation_type],
              ["List size", m.list_size], ["Clinical system", m.clinical_system], ["Timeline", m.timeline],
              ["Prefers", m.contact_preference], ["Heard via", m.heard_about],
              ["Interested in", m.interests?.join(", ")],
            ] as const).filter(([, v]) => v).map(([k, v]) => (
              <div key={k}><dt className="inline text-muted-foreground">{k}: </dt><dd className="inline text-foreground">{v}</dd></div>
            ))}
          </dl>
          <p className="mt-3 whitespace-pre-wrap text-foreground">{m.message}</p>
          <div className="mt-4 flex flex-wrap gap-2">
            {["new", "replied", "closed"].map((s) => (
              <Button variant="ghost" key={s} onClick={() => setStatus(m.id, s)} className={`${small} capitalize ${m.status === s ? "bg-accent text-accent-foreground" : "bg-secondary text-secondary-foreground"}`}>{s}</Button>
            ))}
            <a href={`mailto:${m.email}?subject=Re: your PracticeMD enquiry`} className={`${small} bg-primary text-primary-foreground`}>Reply by email</a>
            <Button variant="ghost" onClick={() => remove(m.id)} className={`${small} text-destructive hover:bg-secondary`}>Delete</Button>
          </div>
        </div>
      ))}
    </div>
  );
}

function Testimonials() {
  const qc = useQueryClient();
  const [editing, setEditing] = useState<string | null>(null);
  const change = useServerFn(changeAdminData);
  const q = useQuery({ queryKey: ["admin-testimonials"], queryFn: async () => (await getAdminData()).testimonials });
  const refresh = () => { qc.invalidateQueries({ queryKey: ["admin-testimonials"] }); setEditing(null); };
  async function save(e: FormEvent<HTMLFormElement>, id?: string) {
    e.preventDefault();
    const f = Object.fromEntries(new FormData(e.currentTarget)) as Record<string, string>;
    const row = { quote: f["quote"] ?? "", author: f["author"] ?? "", role: f["role"] ?? "", sort_order: Number(f["sort_order"] ?? 0) };
    if (!row.quote.trim() || !row.author.trim()) return toast.error("Quote and name are required");
    const formElement = e.currentTarget;
    try {
      await change({ data: { table: "testimonials", action: "save", id, row } });
      toast.success("Saved"); if (!id) formElement.reset(); refresh();
    } catch { toast.error("Couldn't save"); }
  }
  async function remove(id: string) {
    if (!confirm("Delete this testimonial?")) return;
    try { await change({ data: { table: "testimonials", action: "delete", id } }); refresh(); }
    catch { toast.error("Couldn't delete"); }
  }
  const form = (t?: { id: string; quote: string; author: string; role: string; sort_order: number }) => (
    <form onSubmit={(e) => save(e, t?.id)} className="space-y-2">
      <textarea name="quote" defaultValue={t?.quote} rows={3} placeholder="Quote" className={field} />
      <div className="grid gap-2 sm:grid-cols-[1fr_1fr_6rem]">
        <input name="author" defaultValue={t?.author} placeholder="Name" className={field} />
        <input name="role" defaultValue={t?.role} placeholder="Role / practice" className={field} />
        <input name="sort_order" type="number" defaultValue={t?.sort_order ?? 0} className={field} aria-label="Order" />
      </div>
      <div className="flex gap-2">
        <Button variant="ghost" className={`${small} bg-primary text-primary-foreground`}>{t ? "Save" : "Add testimonial"}</Button>
        {t && <Button variant="ghost" type="button" onClick={() => setEditing(null)} className={`${small} bg-secondary`}>Cancel</Button>}
      </div>
    </form>
  );
  return (
    <div className="space-y-3">
      <div className={card}>{form()}</div>
      {q.data?.map((t) => (
        <div key={t.id} className={card}>
          {editing === t.id ? form(t) : (
            <>
              <p className="text-foreground">"{t.quote}"</p>
              <p className="mt-2 text-sm text-muted-foreground">{t.author}{t.role && ` · ${t.role}`}</p>
              <div className="mt-3 flex gap-2">
                <Button variant="ghost" onClick={() => setEditing(t.id)} className={`${small} bg-secondary`}>Edit</Button>
                <Button variant="ghost" onClick={() => remove(t.id)} className={`${small} text-destructive`}>Delete</Button>
              </div>
            </>
          )}
        </div>
      ))}
    </div>
  );
}

function Faqs() {
  const qc = useQueryClient();
  const [editing, setEditing] = useState<string | null>(null);
  const change = useServerFn(changeAdminData);
  const q = useQuery({ queryKey: ["admin-faqs"], queryFn: async () => (await getAdminData()).faqs });
  const refresh = () => { qc.invalidateQueries({ queryKey: ["admin-faqs"] }); setEditing(null); };
  async function save(e: FormEvent<HTMLFormElement>, id?: string) {
    e.preventDefault();
    const f = Object.fromEntries(new FormData(e.currentTarget)) as Record<string, string>;
    const row = { question: f["question"] ?? "", answer: f["answer"] ?? "", sort_order: Number(f["sort_order"] ?? 0) };
    if (!row.question.trim() || !row.answer.trim()) return toast.error("Question and answer are required");
    const formElement = e.currentTarget;
    try {
      await change({ data: { table: "faqs", action: "save", id, row } });
      toast.success("Saved"); if (!id) formElement.reset(); refresh();
    } catch { toast.error("Couldn't save"); }
  }
  async function remove(id: string) {
    if (!confirm("Delete this question?")) return;
    try { await change({ data: { table: "faqs", action: "delete", id } }); refresh(); }
    catch { toast.error("Couldn't delete"); }
  }
  const form = (x?: { id: string; question: string; answer: string; sort_order: number }) => (
    <form onSubmit={(e) => save(e, x?.id)} className="space-y-2">
      <div className="grid gap-2 sm:grid-cols-[1fr_6rem]">
        <input name="question" defaultValue={x?.question} placeholder="Question" className={field} />
        <input name="sort_order" type="number" defaultValue={x?.sort_order ?? 0} className={field} aria-label="Order" />
      </div>
      <textarea name="answer" defaultValue={x?.answer} rows={3} placeholder="Answer" className={field} />
      <div className="flex gap-2">
        <Button variant="ghost" className={`${small} bg-primary text-primary-foreground`}>{x ? "Save" : "Add question"}</Button>
        {x && <Button variant="ghost" type="button" onClick={() => setEditing(null)} className={`${small} bg-secondary`}>Cancel</Button>}
      </div>
    </form>
  );
  return (
    <div className="space-y-3">
      <div className={card}>{form()}</div>
      {q.data?.map((x) => (
        <div key={x.id} className={card}>
          {editing === x.id ? form(x) : (
            <>
              <p className="font-semibold text-primary">{x.question}</p>
              <p className="mt-1 text-muted-foreground">{x.answer}</p>
              <div className="mt-3 flex gap-2">
                <Button variant="ghost" onClick={() => setEditing(x.id)} className={`${small} bg-secondary`}>Edit</Button>
                <Button variant="ghost" onClick={() => remove(x.id)} className={`${small} text-destructive`}>Delete</Button>
              </div>
            </>
          )}
        </div>
      ))}
    </div>
  );
}

function Chats() {
  const qc = useQueryClient();
  const [openId, setOpenId] = useState<string | null>(null);
  const change = useServerFn(changeAdminData);
  const q = useQuery({
    queryKey: ["admin-chats"],
    queryFn: async () => (await getAdminData()).chats,
  });
  const msgs = q.data?.find((chat) => chat.id === openId)?.chat_messages ?? [];
  async function remove(id: string) {
    if (!confirm("Delete this conversation?")) return;
    try {
      await change({ data: { table: "chat_conversations", action: "delete", id } });
      toast.success("Deleted"); if (openId === id) setOpenId(null);
      qc.invalidateQueries({ queryKey: ["admin-chats"] });
    } catch { toast.error("Couldn't delete"); }
  }
  if (q.isLoading) return <p className="text-muted-foreground">Loading…</p>;
  if (!q.data?.length) return <div className={card}><p className="text-muted-foreground">No chatbot conversations yet.</p></div>;
  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">Live-agent requests from the chat also appear in Messages.</p>
      {q.data.map((c) => (
        <div key={c.id} className={card}>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="text-sm">
              <span className="font-medium">{new Date(c.updated_at).toLocaleString("en-GB")}</span>
              <span className="ml-2 text-muted-foreground">{c.chat_messages.length} messages</span>
              {c.live_agent_requested && <span className={`${small} ml-2 bg-accent text-accent-foreground`}>Wants contact</span>}
            </div>
            <div className="flex gap-2">
              <Button variant="ghost" onClick={() => setOpenId(openId === c.id ? null : c.id)} className={`${small} border border-input`}>{openId === c.id ? "Hide" : "View"}</Button>
              <Button variant="ghost" onClick={() => remove(c.id)} className={`${small} border border-input text-destructive`}>Delete</Button>
            </div>
          </div>
          {openId === c.id && (
            <div className="mt-4 space-y-2 border-t border-border pt-4 text-sm">
              {[...msgs].sort((a, b) => a.created_at.localeCompare(b.created_at)).map((m) => (
                <p key={m.id} className="whitespace-pre-wrap"><span className={`font-medium ${m.role === "user" ? "text-primary" : "text-muted-foreground"}`}>{m.role === "user" ? "Visitor" : "NEXA"}:</span> {m.content}</p>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
