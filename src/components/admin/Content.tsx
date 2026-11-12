import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import { Eye, EyeOff, Pencil, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { card, field, formatDate, label, SectionHeader, useAdminChange, useAdminData } from "./shared";

type Faq = { id: string; question: string; answer: string; sort_order: number };
type Testimonial = { id: string; quote: string; author: string; role: string; sort_order: number };

function RowActions({ onEdit, onDelete }: { onEdit: () => void; onDelete: () => void }) {
  return (
    <div className="mt-3 flex flex-wrap gap-2">
      <Button variant="pill" size="sm" onClick={onEdit}><Pencil /> Edit</Button>
      <Button variant="pill" size="sm" onClick={onDelete} className="text-destructive"><Trash2 /> Delete</Button>
    </div>
  );
}

export function Faqs() {
  const { data } = useAdminData();
  const change = useAdminChange();
  const [editing, setEditing] = useState<string | "new" | null>(null);
  async function save(e: FormEvent<HTMLFormElement>, id?: string) {
    e.preventDefault();
    const f = Object.fromEntries(new FormData(e.currentTarget)) as Record<string, string>;
    const row = { question: f["question"] ?? "", answer: f["answer"] ?? "", sort_order: Number(f["sort_order"] || 0) };
    if (!row.question.trim() || !row.answer.trim()) { toast.error("Question and answer are required"); return; }
    try { await change({ table: "faqs", action: "save", id, row }); toast.success(id ? "Question updated" : "Question added"); setEditing(null); }
    catch { toast.error("Couldn't save"); }
  }
  async function remove(x: Faq) {
    if (!confirm(`Delete “${x.question}”?`)) return;
    try { await change({ table: "faqs", action: "delete", id: x.id }); toast.success("Question deleted"); }
    catch { toast.error("Couldn't delete"); }
  }
  const nextOrder = Math.max(0, ...(data?.faqs ?? []).map((x) => x.sort_order)) + 1;
  const form = (x?: Faq) => (
    <form onSubmit={(e) => save(e, x?.id)} className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_6rem]">
        <div className="min-w-0"><label className={label}>Question</label><input name="question" required maxLength={500} defaultValue={x?.question} className={field} /></div>
        <div><label className={label}>Order</label><input name="sort_order" type="number" defaultValue={x?.sort_order ?? nextOrder} className={field} /></div>
      </div>
      <div><label className={label}>Answer</label><textarea name="answer" required rows={4} defaultValue={x?.answer} className={field} /></div>
      <div className="flex flex-wrap gap-2">
        <Button type="submit" variant="brand" size="sm">{x ? "Save changes" : "Add question"}</Button>
        <Button type="button" variant="pill" size="sm" onClick={() => setEditing(null)}>Cancel</Button>
      </div>
    </form>
  );
  return (
    <section>
      <SectionHeader title="FAQs" description="Shown on the homepage and the FAQ page, in order.">
        <Button variant="brand" onClick={() => setEditing("new")}><Plus /> Add question</Button>
      </SectionHeader>
      <div className="space-y-2">
        {editing === "new" && <div className={`${card} border-accent`}>{form()}</div>}
        {data?.faqs.map((x) => (
          <div key={x.id} className={card}>
            {editing === x.id ? form(x) : (
              <>
                <div className="flex min-w-0 gap-3">
                  <span className="mt-0.5 shrink-0 font-mono text-xs text-muted-foreground">#{x.sort_order}</span>
                  <div className="min-w-0">
                    <p className="font-semibold text-primary">{x.question}</p>
                    <p className="mt-1 line-clamp-3 text-sm text-muted-foreground">{x.answer}</p>
                  </div>
                </div>
                <RowActions onEdit={() => setEditing(x.id)} onDelete={() => remove(x)} />
              </>
            )}
          </div>
        ))}
        {!data?.faqs.length && editing !== "new" && <div className={`${card} text-sm text-muted-foreground`}>No questions yet.</div>}
      </div>
    </section>
  );
}

export function Testimonials() {
  const { data } = useAdminData();
  const change = useAdminChange();
  const [editing, setEditing] = useState<string | "new" | null>(null);
  async function save(e: FormEvent<HTMLFormElement>, id?: string) {
    e.preventDefault();
    const f = Object.fromEntries(new FormData(e.currentTarget)) as Record<string, string>;
    const row = { quote: f["quote"] ?? "", author: f["author"] ?? "", role: f["role"] ?? "", sort_order: Number(f["sort_order"] || 0) };
    if (!row.quote.trim() || !row.author.trim()) { toast.error("Quote and name are required"); return; }
    try { await change({ table: "testimonials", action: "save", id, row }); toast.success(id ? "Testimonial updated" : "Testimonial added"); setEditing(null); }
    catch { toast.error("Couldn't save"); }
  }
  async function remove(t: Testimonial) {
    if (!confirm(`Delete the testimonial from ${t.author}?`)) return;
    try { await change({ table: "testimonials", action: "delete", id: t.id }); toast.success("Testimonial deleted"); }
    catch { toast.error("Couldn't delete"); }
  }
  const form = (t?: Testimonial) => (
    <form onSubmit={(e) => save(e, t?.id)} className="space-y-3">
      <div><label className={label}>Quote</label><textarea name="quote" required rows={3} defaultValue={t?.quote} className={field} /></div>
      <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_6rem]">
        <div className="min-w-0"><label className={label}>Name</label><input name="author" required defaultValue={t?.author} className={field} /></div>
        <div className="min-w-0"><label className={label}>Role / practice</label><input name="role" defaultValue={t?.role} className={field} /></div>
        <div><label className={label}>Order</label><input name="sort_order" type="number" defaultValue={t?.sort_order ?? 0} className={field} /></div>
      </div>
      <div className="flex flex-wrap gap-2">
        <Button type="submit" variant="brand" size="sm">{t ? "Save changes" : "Add testimonial"}</Button>
        <Button type="button" variant="pill" size="sm" onClick={() => setEditing(null)}>Cancel</Button>
      </div>
    </form>
  );
  return (
    <section>
      <SectionHeader title="Testimonials" description="Saved for when you have real quotes from practices. Not currently shown on the site.">
        <Button variant="brand" onClick={() => setEditing("new")}><Plus /> Add testimonial</Button>
      </SectionHeader>
      <div className="space-y-2">
        {editing === "new" && <div className={`${card} border-accent`}>{form()}</div>}
        {data?.testimonials.map((t) => (
          <div key={t.id} className={card}>
            {editing === t.id ? form(t) : (
              <>
                <p className="break-words">“{t.quote}”</p>
                <p className="mt-2 text-sm text-muted-foreground">{t.author}{t.role && ` · ${t.role}`}</p>
                <RowActions onEdit={() => setEditing(t.id)} onDelete={() => remove(t)} />
              </>
            )}
          </div>
        ))}
        {!data?.testimonials.length && editing !== "new" && <div className={`${card} text-sm text-muted-foreground`}>No testimonials yet.</div>}
      </div>
    </section>
  );
}

export function Chats() {
  const { data } = useAdminData();
  const change = useAdminChange();
  const [openId, setOpenId] = useState<string | null>(null);
  const [onlyContact, setOnlyContact] = useState(false);
  const chats = (data?.chats ?? []).filter((c) => !onlyContact || c.live_agent_requested);
  async function remove(id: string) {
    if (!confirm("Delete this conversation?")) return;
    try { await change({ table: "chat_conversations", action: "delete", id }); toast.success("Conversation deleted"); if (openId === id) setOpenId(null); }
    catch { toast.error("Couldn't delete"); }
  }
  return (
    <section>
      <SectionHeader title="Chat conversations" description="Visitor chats with NEXA. Requests to talk to a person also appear in Enquiries.">
        <Button variant="pill" aria-pressed={onlyContact} onClick={() => setOnlyContact((v) => !v)} className={onlyContact ? "border-primary bg-primary text-primary-foreground hover:bg-primary/90" : ""}>
          Wants contact only
        </Button>
      </SectionHeader>
      {!chats.length ? <div className={`${card} text-sm text-muted-foreground`}>No conversations {onlyContact ? "asking for contact" : "yet"}.</div> : (
        <ul className="space-y-2">
          {chats.map((c) => {
            const open = openId === c.id;
            const first = [...c.chat_messages].sort((a, b) => a.created_at.localeCompare(b.created_at)).find((m) => m.role === "user");
            return (
              <li key={c.id} className={card}>
                <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3">
                  <div className="min-w-0">
                    <p className="flex flex-wrap items-center gap-2 text-sm">
                      <span className="font-medium">{formatDate(c.updated_at)}</span>
                      <span className="text-muted-foreground">{c.chat_messages.length} {c.chat_messages.length === 1 ? "message" : "messages"}</span>
                      {c.live_agent_requested && <span className="rounded-full bg-peach px-2.5 py-0.5 text-xs font-medium">Wants contact</span>}
                    </p>
                    {first && <p className="mt-1 line-clamp-1 text-sm text-muted-foreground">“{first.content}”</p>}
                  </div>
                  <div className="flex shrink-0 gap-1">
                    <Button variant="pill" size="icon" aria-label={open ? "Hide conversation" : "View conversation"} onClick={() => setOpenId(open ? null : c.id)}>{open ? <EyeOff /> : <Eye />}</Button>
                    <Button variant="pill" size="icon" aria-label="Delete conversation" onClick={() => remove(c.id)} className="text-destructive"><Trash2 /></Button>
                  </div>
                </div>
                {open && (
                  <div className="mt-4 space-y-2 border-t border-border pt-4 text-sm">
                    {[...c.chat_messages].sort((a, b) => a.created_at.localeCompare(b.created_at)).map((m) => (
                      <div key={m.id} className={`max-w-[85%] whitespace-pre-wrap break-words rounded-xl px-3 py-2 ${m.role === "user" ? "ml-auto bg-primary text-primary-foreground" : "bg-secondary"}`}>{m.content}</div>
                    ))}
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
