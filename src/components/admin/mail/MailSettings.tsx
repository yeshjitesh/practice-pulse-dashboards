import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getEmailPreviews } from "@/lib/mail.functions";
import { Plus, Trash2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { htmlToText, textToHtml } from "@/lib/mail-utils";
import { useMailSettingsActions, useMailTemplates } from "./api";

const field = "w-full min-w-0 rounded-lg border border-input bg-background px-3 py-2 text-sm outline-hidden focus:border-accent";

/** Signature and reply templates, edited as plain text. */
type Sig = { name?: string; role?: string; phone?: string; bookingUrl?: string };
export function MailSettings({ open, onOpenChange, signature: saved }: { open: boolean; onOpenChange: (o: boolean) => void; signature: Sig }) {
  const templates = useMailTemplates();
  const act = useMailSettingsActions();
  const [signature, setSignature] = useState({ name: "", role: "", phone: "", bookingUrl: "" });
  const fetchPreviews = useServerFn(getEmailPreviews);
  const previews = useQuery({ queryKey: ["mail-previews"], queryFn: () => fetchPreviews(), enabled: open });
  const [savingSig, setSavingSig] = useState(false);
  const [editing, setEditing] = useState<{ id?: string; name: string; body: string } | null>(null);
  const [savingTpl, setSavingTpl] = useState(false);

  useEffect(() => {
    if (open) { setSignature({ name: saved.name ?? "", role: saved.role ?? "", phone: saved.phone ?? "", bookingUrl: saved.bookingUrl ?? "" }); setEditing(null); }
  }, [open, saved]);

  async function saveSignature() {
    setSavingSig(true);
    if (signature.bookingUrl && !/^https:\/\//i.test(signature.bookingUrl)) { toast.error("The booking link must start with https://"); setSavingSig(false); return; }
    try { await act.saveSignature(signature); await previews.refetch(); toast.success("Signature saved"); }
    catch { toast.error("Couldn't save the signature."); }
    finally { setSavingSig(false); }
  }

  async function saveTemplate() {
    if (!editing) return;
    if (!editing.name.trim()) { toast.error("Give the template a name."); return; }
    setSavingTpl(true);
    try {
      await act.saveTemplate({ ...(editing.id ? { id: editing.id } : {}), name: editing.name.trim().slice(0, 80), html: textToHtml(editing.body) });
      toast.success("Template saved"); setEditing(null);
    } catch { toast.error("Couldn't save the template."); }
    finally { setSavingTpl(false); }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] w-[calc(100%-2rem)] max-w-xl overflow-y-auto rounded-xl bg-card">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl text-primary">Mail settings</DialogTitle>
          <DialogDescription>Your signature is added to new emails and replies. Templates can be dropped into any email.</DialogDescription>
        </DialogHeader>

        <section className="space-y-2">
          <h3 className="text-sm font-semibold">Signature</h3>
          <div className="grid gap-2 sm:grid-cols-2">
            {([["name", "Your name", 80, "Yesh Jitesh"], ["role", "Role", 80, "Founder"], ["phone", "Phone", 30, ""], ["bookingUrl", "Booking link", 300, "https://…"]] as const).map(([k, l, max, ph]) => (
              <label key={k} className="text-xs text-muted-foreground">{l}
                <input aria-label={l} value={signature[k]} maxLength={max} placeholder={ph} onChange={(e) => setSignature({ ...signature, [k]: e.target.value })} className={`${field} mt-1`} />
              </label>
            ))}
          </div>
          <p className="text-xs text-muted-foreground">Shown as a branded card under your emails. Leave the name empty for no signature.</p>
          <div className="flex justify-end">
            <Button size="sm" onClick={saveSignature} disabled={savingSig}>{savingSig && <Loader2 className="animate-spin" />} Save signature</Button>
          </div>
        </section>

        <section className="space-y-2 border-t border-border pt-4">
          <div className="flex items-center justify-between gap-2">
            <h3 className="text-sm font-semibold">Reply templates</h3>
            {!editing && <Button size="sm" variant="outline" onClick={() => setEditing({ name: "", body: "" })}><Plus /> New template</Button>}
          </div>
          {editing && (
            <div className="space-y-2 rounded-lg border border-border bg-background/60 p-3">
              <input aria-label="Template name" placeholder="e.g. Thanks for your enquiry" maxLength={80} value={editing.name}
                onChange={(e) => setEditing({ ...editing, name: e.target.value })} className={field} />
              <textarea aria-label="Template text" rows={6} maxLength={20000} value={editing.body}
                onChange={(e) => setEditing({ ...editing, body: e.target.value })} className={field} />
              <div className="flex justify-end gap-2">
                <Button size="sm" variant="ghost" onClick={() => setEditing(null)}>Cancel</Button>
                <Button size="sm" onClick={saveTemplate} disabled={savingTpl}>{savingTpl && <Loader2 className="animate-spin" />} Save template</Button>
              </div>
            </div>
          )}
          {templates.data?.length === 0 && !editing && <p className="text-sm text-muted-foreground">No templates yet. You can also save one from any email you're writing.</p>}
          <ul className="space-y-1.5">
            {(templates.data ?? []).map((t) => (
              <li key={t.id} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2 rounded-lg border border-border px-3 py-2">
                <button type="button" className="min-w-0 text-left" onClick={() => setEditing({ id: t.id, name: t.name, body: htmlToText(t.html) })}>
                  <span className="block truncate text-sm font-medium">{t.name}</span>
                  <span className="block truncate text-xs text-muted-foreground">{htmlToText(t.html).slice(0, 120)}</span>
                </button>
                <button type="button" aria-label={`Delete ${t.name}`} className="rounded p-1.5 text-muted-foreground hover:text-destructive"
                  onClick={async () => { if (!window.confirm(`Delete the template "${t.name}"?`)) return; await act.removeTemplate(t.id); toast.success("Template deleted"); }}>
                  <Trash2 className="size-4" />
                </button>
              </li>
            ))}
          </ul>
        </section>

        <section className="space-y-3 border-t border-border pt-4">
          <h3 className="text-sm font-semibold">Email previews</h3>
          <p className="text-xs text-muted-foreground">Every email you send is wrapped in this layout. The logo appears once the site is published.</p>
          {(previews.data ?? []).map((p) => (
            <figure key={p.name} className="space-y-1">
              <figcaption className="text-xs font-medium">{p.name}</figcaption>
              <iframe title={p.name} srcDoc={p.html} sandbox="" className="h-[28rem] w-full rounded-lg border border-border bg-white" />
            </figure>
          ))}
        </section>
      </DialogContent>
    </Dialog>
  );
}
