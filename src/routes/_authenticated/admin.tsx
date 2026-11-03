import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Logo } from "@/components/brand/Logo";

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({
    meta: [
      { title: "Admin — PracticeMD" },
      { name: "description", content: "Manage messages and page content." },
      { property: "og:title", content: "Admin — PracticeMD" },
      { property: "og:description", content: "PracticeMD admin area." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: Admin,
});

type Tab = "messages" | "testimonials" | "faqs";

function Admin() {
  const { user } = Route.useRouteContext();
  const qc = useQueryClient();
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>("messages");
  const role = useQuery({
    queryKey: ["is-admin", user.id],
    queryFn: async () => (await supabase.rpc("has_role", { _user_id: user.id, _role: "admin" })).data === true,
  });

  async function signOut() {
    await qc.cancelQueries();
    qc.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  return (
    <div className="min-h-screen bg-secondary">
      <header className="border-b border-border bg-card">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <Link to="/"><Logo iconOnlyOnMobile /></Link>
          <div className="flex items-center gap-4 text-sm">
            <span className="hidden text-muted-foreground sm:inline">{user.email}</span>
            <button onClick={signOut} className="rounded-full border border-input px-4 py-2 hover:bg-secondary">Sign out</button>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-6 py-10">
        {role.isLoading ? (
          <p className="text-muted-foreground">Loading…</p>
        ) : !role.data ? (
          <div className="rounded-xl border border-border bg-card p-8">
            <h1 className="font-display text-2xl text-primary">No admin access</h1>
            <p className="mt-2 text-muted-foreground">This account isn't an admin of this site.</p>
          </div>
        ) : (
          <>
            <h1 className="font-display text-4xl text-primary">Admin</h1>
            <div className="mt-6 flex gap-2">
              {(["messages", "testimonials", "faqs"] as Tab[]).map((t) => (
                <button key={t} onClick={() => setTab(t)} className={`rounded-full px-4 py-2 text-sm font-medium capitalize transition-colors ${tab === t ? "bg-primary text-primary-foreground" : "bg-card text-foreground hover:bg-background"}`}>
                  {t === "faqs" ? "FAQs" : t}
                </button>
              ))}
            </div>
            <div className="mt-6">
              {tab === "messages" && <Messages />}
              {tab === "testimonials" && <Testimonials />}
              {tab === "faqs" && <Faqs />}
            </div>
          </>
        )}
      </main>
    </div>
  );
}

const card = "rounded-xl border border-border bg-card p-5";
const field = "w-full rounded-lg border border-input bg-background px-3 py-2 outline-none focus:border-accent";
const small = "rounded-full px-3 py-1 text-xs font-medium";

function Messages() {
  const qc = useQueryClient();
  const q = useQuery({
    queryKey: ["admin-messages"],
    queryFn: async () => (await supabase.from("contact_submissions").select("*").order("created_at", { ascending: false })).data ?? [],
  });
  const refresh = () => qc.invalidateQueries({ queryKey: ["admin-messages"] });
  async function setStatus(id: string, status: string) {
    const { error } = await supabase.from("contact_submissions").update({ status }).eq("id", id);
    if (error) toast.error("Couldn't update"); else refresh();
  }
  async function remove(id: string) {
    if (!confirm("Delete this message?")) return;
    const { error } = await supabase.from("contact_submissions").delete().eq("id", id);
    if (error) toast.error("Couldn't delete"); else { toast.success("Deleted"); refresh(); }
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
          <p className="mt-3 whitespace-pre-wrap text-foreground">{m.message}</p>
          <div className="mt-4 flex flex-wrap gap-2">
            {["new", "replied", "closed"].map((s) => (
              <button key={s} onClick={() => setStatus(m.id, s)} className={`${small} capitalize ${m.status === s ? "bg-accent text-accent-foreground" : "bg-secondary text-secondary-foreground"}`}>{s}</button>
            ))}
            <a href={`mailto:${m.email}?subject=Re: your PracticeMD enquiry`} className={`${small} bg-primary text-primary-foreground`}>Reply by email</a>
            <button onClick={() => remove(m.id)} className={`${small} text-destructive hover:bg-secondary`}>Delete</button>
          </div>
        </div>
      ))}
    </div>
  );
}

function Testimonials() {
  const qc = useQueryClient();
  const [editing, setEditing] = useState<string | null>(null);
  const q = useQuery({ queryKey: ["admin-testimonials"], queryFn: async () => (await supabase.from("testimonials").select("*").order("sort_order")).data ?? [] });
  const refresh = () => { qc.invalidateQueries({ queryKey: ["admin-testimonials"] }); setEditing(null); };
  async function save(e: FormEvent<HTMLFormElement>, id?: string) {
    e.preventDefault();
    const f = Object.fromEntries(new FormData(e.currentTarget)) as Record<string, string>;
    const row = { quote: f["quote"] ?? "", author: f["author"] ?? "", role: f["role"] ?? "", sort_order: Number(f["sort_order"] ?? 0) };
    if (!row.quote.trim() || !row.author.trim()) return toast.error("Quote and name are required");
    const { error } = id ? await supabase.from("testimonials").update(row).eq("id", id) : await supabase.from("testimonials").insert(row);
    if (error) return toast.error("Couldn't save");
    toast.success("Saved"); if (!id) e.currentTarget.reset(); refresh(); return undefined;
  }
  async function remove(id: string) {
    if (!confirm("Delete this testimonial?")) return;
    await supabase.from("testimonials").delete().eq("id", id); refresh();
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
        <button className={`${small} bg-primary text-primary-foreground`}>{t ? "Save" : "Add testimonial"}</button>
        {t && <button type="button" onClick={() => setEditing(null)} className={`${small} bg-secondary`}>Cancel</button>}
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
                <button onClick={() => setEditing(t.id)} className={`${small} bg-secondary`}>Edit</button>
                <button onClick={() => remove(t.id)} className={`${small} text-destructive`}>Delete</button>
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
  const q = useQuery({ queryKey: ["admin-faqs"], queryFn: async () => (await supabase.from("faqs").select("*").order("sort_order")).data ?? [] });
  const refresh = () => { qc.invalidateQueries({ queryKey: ["admin-faqs"] }); setEditing(null); };
  async function save(e: FormEvent<HTMLFormElement>, id?: string) {
    e.preventDefault();
    const f = Object.fromEntries(new FormData(e.currentTarget)) as Record<string, string>;
    const row = { question: f["question"] ?? "", answer: f["answer"] ?? "", sort_order: Number(f["sort_order"] ?? 0) };
    if (!row.question.trim() || !row.answer.trim()) return toast.error("Question and answer are required");
    const { error } = id ? await supabase.from("faqs").update(row).eq("id", id) : await supabase.from("faqs").insert(row);
    if (error) return toast.error("Couldn't save");
    toast.success("Saved"); if (!id) e.currentTarget.reset(); refresh(); return undefined;
  }
  async function remove(id: string) {
    if (!confirm("Delete this question?")) return;
    await supabase.from("faqs").delete().eq("id", id); refresh();
  }
  const form = (x?: { id: string; question: string; answer: string; sort_order: number }) => (
    <form onSubmit={(e) => save(e, x?.id)} className="space-y-2">
      <div className="grid gap-2 sm:grid-cols-[1fr_6rem]">
        <input name="question" defaultValue={x?.question} placeholder="Question" className={field} />
        <input name="sort_order" type="number" defaultValue={x?.sort_order ?? 0} className={field} aria-label="Order" />
      </div>
      <textarea name="answer" defaultValue={x?.answer} rows={3} placeholder="Answer" className={field} />
      <div className="flex gap-2">
        <button className={`${small} bg-primary text-primary-foreground`}>{x ? "Save" : "Add question"}</button>
        {x && <button type="button" onClick={() => setEditing(null)} className={`${small} bg-secondary`}>Cancel</button>}
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
                <button onClick={() => setEditing(x.id)} className={`${small} bg-secondary`}>Edit</button>
                <button onClick={() => remove(x.id)} className={`${small} text-destructive`}>Delete</button>
              </div>
            </>
          )}
        </div>
      ))}
    </div>
  );
}
