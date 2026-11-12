import { useMemo, useState, type FormEvent } from "react";
import { toast } from "sonner";
import { Download, Mail, Pencil, Plus, Search, Trash2, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ENQUIRY_STATUSES, enquiriesToCsv, filterEnquiries, type EnquiryStatus } from "@/lib/admin-insights";
import { card, field, formatDate, label, SectionHeader, StatusBadge, useAdminChange, useAdminData, type Enquiry } from "./shared";

const DETAIL_FIELDS = [
  ["Phone", "phone"], ["Role", "job_role"], ["Organisation", "organisation_type"], ["List size", "list_size"],
  ["Clinical system", "clinical_system"], ["Timeline", "timeline"], ["Prefers", "contact_preference"], ["Heard via", "heard_about"],
] as const;

export function Enquiries() {
  const { data } = useAdminData();
  const change = useAdminChange();
  const [status, setStatus] = useState<EnquiryStatus | "all">("all");
  const [search, setSearch] = useState("");
  const [openId, setOpenId] = useState<string | null>(null);
  const [editing, setEditing] = useState<Enquiry | "new" | null>(null);
  const all = data?.messages ?? [];
  const list = useMemo(() => filterEnquiries(all, status, search), [all, status, search]);

  async function updateStatus(id: string, next: EnquiryStatus) {
    try { await change({ table: "contact_submissions", action: "status", id, status: next }); toast.success(`Marked as ${next}`); }
    catch { toast.error("Couldn't update the status"); }
  }
  async function remove(e: Enquiry) {
    if (!confirm(`Delete the enquiry from ${e.name}? This can't be undone.`)) return;
    try { await change({ table: "contact_submissions", action: "delete", id: e.id }); toast.success("Enquiry deleted"); }
    catch { toast.error("Couldn't delete"); }
  }
  function exportCsv() {
    const blob = new Blob([enquiriesToCsv(list)], { type: "text/csv;charset=utf-8" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `practicemd-enquiries-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
  }

  return (
    <section>
      <SectionHeader title="Contact enquiries" description="Everything sent through the contact form and the chat's “talk to a person” requests.">
        <Button variant="pill" onClick={exportCsv} disabled={!list.length}><Download /> Export</Button>
        <Button variant="brand" onClick={() => setEditing("new")}><Plus /> Add enquiry</Button>
      </SectionHeader>

      <div className="mb-4 grid gap-2 sm:grid-cols-[minmax(0,1fr)_auto]">
        <label className="relative block min-w-0">
          <span className="sr-only">Search enquiries</span>
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search name, email, practice or message" className={`${field} pl-9`} />
        </label>
        <div className="flex gap-1 overflow-x-auto rounded-full border border-border bg-card p-1" role="group" aria-label="Filter by status">
          {(["all", ...ENQUIRY_STATUSES] as const).map((s) => {
            const count = s === "all" ? all.length : all.filter((e) => e.status === s).length;
            return (
              <button key={s} type="button" aria-pressed={status === s} onClick={() => setStatus(s)}
                className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-medium capitalize transition-colors ${status === s ? "bg-primary text-primary-foreground" : "text-foreground hover:bg-secondary"}`}>
                {s} <span className="opacity-70">{count}</span>
              </button>
            );
          })}
        </div>
      </div>

      {!list.length ? (
        <div className={`${card} text-center text-sm text-muted-foreground`}>{all.length ? "No enquiries match this filter." : "No enquiries yet. New contact form messages will appear here."}</div>
      ) : (
        <ul className="space-y-2">
          {list.map((e) => {
            const open = openId === e.id;
            return (
              <li key={e.id} className={`${card} p-0 sm:p-0`}>
                <button type="button" onClick={() => setOpenId(open ? null : e.id)} aria-expanded={open}
                  className="grid w-full grid-cols-[minmax(0,1fr)_auto] items-center gap-3 p-4 text-left sm:p-5">
                  <span className="min-w-0">
                    <span className="flex min-w-0 items-center gap-2">
                      <span className="truncate font-semibold text-primary">{e.name}</span>
                      <StatusBadge status={e.status} />
                    </span>
                    <span className="mt-0.5 block truncate text-sm text-muted-foreground">{[e.practice, e.email].filter(Boolean).join(" · ")}</span>
                    {!open && <span className="mt-1 line-clamp-1 block text-sm text-foreground">{e.message}</span>}
                  </span>
                  <span className="flex shrink-0 items-center gap-2 text-xs text-muted-foreground">
                    <span className="hidden sm:inline">{formatDate(e.created_at)}</span>
                    <ChevronDown className={`size-4 transition-transform ${open ? "rotate-180" : ""}`} />
                  </span>
                </button>
                {open && (
                  <div className="border-t border-border px-4 pb-4 pt-4 sm:px-5 sm:pb-5">
                    <p className="text-xs text-muted-foreground sm:hidden">{formatDate(e.created_at)}</p>
                    <dl className="mt-1 grid gap-x-6 gap-y-1 text-sm sm:grid-cols-2">
                      {DETAIL_FIELDS.filter(([, k]) => e[k]).map(([labelText, k]) => (
                        <div key={k} className="min-w-0 break-words"><dt className="inline text-muted-foreground">{labelText}: </dt><dd className="inline">{e[k]}</dd></div>
                      ))}
                      {e.interests?.length ? <div className="min-w-0 break-words sm:col-span-2"><dt className="inline text-muted-foreground">Interested in: </dt><dd className="inline">{e.interests.join(", ")}</dd></div> : null}
                    </dl>
                    <p className="mt-3 whitespace-pre-wrap break-words rounded-lg bg-background p-3 text-sm">{e.message}</p>
                    <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
                      <label className="flex items-center gap-2 text-sm">
                        <span className="text-muted-foreground">Status</span>
                        <select value={e.status} onChange={(ev) => updateStatus(e.id, ev.target.value as EnquiryStatus)} className={`${field} w-auto capitalize`}>
                          {ENQUIRY_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                        </select>
                      </label>
                      <div className="flex flex-wrap gap-2 sm:ml-auto">
                        <Button asChild variant="brand" size="sm"><a href={`mailto:${e.email}?subject=Re: your PracticeMD enquiry`}><Mail /> Reply</a></Button>
                        <Button variant="pill" size="sm" onClick={() => setEditing(e)}><Pencil /> Edit</Button>
                        <Button variant="pill" size="sm" onClick={() => remove(e)} className="text-destructive"><Trash2 /> Delete</Button>
                      </div>
                    </div>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}

      <EnquiryDialog value={editing} onClose={() => setEditing(null)} />
    </section>
  );
}

function EnquiryDialog({ value, onClose }: { value: Enquiry | "new" | null; onClose: () => void }) {
  const change = useAdminChange();
  const [busy, setBusy] = useState(false);
  const e = value && value !== "new" ? value : null;
  async function submit(ev: FormEvent<HTMLFormElement>) {
    ev.preventDefault();
    const f = Object.fromEntries(new FormData(ev.currentTarget)) as Record<string, string>;
    const row = {
      name: f["name"] ?? "", email: f["email"] ?? "", message: f["message"] ?? "", status: (f["status"] ?? "new") as EnquiryStatus,
      practice: f["practice"], phone: f["phone"], job_role: f["job_role"], organisation_type: f["organisation_type"],
      list_size: e?.list_size ?? null, clinical_system: f["clinical_system"], timeline: e?.timeline ?? null,
      contact_preference: e?.contact_preference ?? null, heard_about: e?.heard_about ?? null,
    };
    if (!row.name.trim() || !row.email.trim() || !row.message.trim()) { toast.error("Name, email and message are required"); return; }
    setBusy(true);
    try { await change({ table: "contact_submissions", action: "save", id: e?.id, row }); toast.success(e ? "Enquiry updated" : "Enquiry added"); onClose(); }
    catch { toast.error("Couldn't save — check the email address"); }
    finally { setBusy(false); }
  }
  const text = (name: keyof Enquiry, labelText: string, props: React.InputHTMLAttributes<HTMLInputElement> = {}) => (
    <div className="min-w-0"><label className={label} htmlFor={`enq-${name}`}>{labelText}</label>
      <input id={`enq-${name}`} name={name} defaultValue={(e?.[name] as string | null) ?? ""} className={field} maxLength={200} {...props} /></div>
  );
  return (
    <Dialog open={value !== null} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[90vh] w-[calc(100%-2rem)] max-w-xl overflow-y-auto rounded-xl">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl text-primary">{e ? "Edit enquiry" : "Add an enquiry"}</DialogTitle>
          <DialogDescription>{e ? "Correct details or update the status." : "Log an enquiry you received by phone or email."}</DialogDescription>
        </DialogHeader>
        <form key={e?.id ?? "new"} onSubmit={submit} className="space-y-3">
          <div className="grid gap-3 sm:grid-cols-2">
            {text("name", "Name *", { required: true })}
            {text("email", "Email *", { required: true, type: "email", maxLength: 255 })}
            {text("practice", "Practice")}
            {text("phone", "Phone", { type: "tel" })}
            {text("job_role", "Role")}
            {text("organisation_type", "Organisation type")}
            {text("clinical_system", "Clinical system")}
            <div><label className={label} htmlFor="enq-status">Status</label>
              <select id="enq-status" name="status" defaultValue={e?.status ?? "new"} className={`${field} capitalize`}>
                {ENQUIRY_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select></div>
          </div>
          <div><label className={label} htmlFor="enq-message">Message *</label>
            <textarea id="enq-message" name="message" required rows={4} maxLength={5000} defaultValue={e?.message ?? ""} className={field} /></div>
          <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end">
            <Button type="button" variant="pill" onClick={onClose}>Cancel</Button>
            <Button type="submit" variant="brand" disabled={busy}>{busy ? "Saving…" : e ? "Save changes" : "Add enquiry"}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
