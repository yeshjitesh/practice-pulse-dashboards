import { useEffect, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useQueryClient } from "@tanstack/react-query";
import { Bold, Italic, Underline, List, ListOrdered, Link2, Paperclip, X, Minus, Maximize2, Trash2, Send, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { saveMailDraft, discardMailDraft, sendMail } from "@/lib/mail.functions";
import { MAX_ATTACHMENT_BYTES, isEmail, splitRecipients } from "@/lib/mail-utils";
import { formatBytes } from "./api";

export type ComposeInit = {
  key: number;
  title: string;
  threadId?: string;
  draftId?: string;
  to: string; cc: string; bcc: string;
  subject: string;
  html: string;
};

type FileItem = { id: string; file: File };

export function Composer({ init, fromAddress, onClose, onSent }: { init: ComposeInit; fromAddress: string; onClose: () => void; onSent: (threadId: string) => void }) {
  const qc = useQueryClient();
  const save = useServerFn(saveMailDraft);
  const discard = useServerFn(discardMailDraft);
  const send = useServerFn(sendMail);
  const [to, setTo] = useState(init.to);
  const [cc, setCc] = useState(init.cc);
  const [bcc, setBcc] = useState(init.bcc);
  const [showCc, setShowCc] = useState(!!(init.cc || init.bcc));
  const [subject, setSubject] = useState(init.subject);
  const [files, setFiles] = useState<FileItem[]>([]);
  const [followUp, setFollowUp] = useState("");
  const [minimised, setMinimised] = useState(false);
  const [sending, setSending] = useState(false);
  const [saveState, setSaveState] = useState<"" | "saving" | "saved">(init.draftId ? "saved" : "");
  const editor = useRef<HTMLDivElement>(null);
  const draftId = useRef(init.draftId);
  const threadId = useRef(init.threadId);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const saving = useRef<Promise<unknown> | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editor.current) editor.current.innerHTML = init.html;
    // Only seed once per compose session.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [init.key]);

  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);

  function fields() {
    const clean = (v: string) => splitRecipients(v).filter(isEmail);
    return { to: clean(to), cc: clean(cc), bcc: clean(bcc), subject, html: editor.current?.innerHTML ?? "" };
  }

  function scheduleSave() {
    setSaveState("");
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => { void saveNow(); }, 1500);
  }

  async function saveNow() {
    timer.current = null;
    const f = fields();
    if (!f.to.length && !f.subject && !(editor.current?.textContent ?? "").trim()) return;
    setSaveState("saving");
    const p = save({ data: { ...f, ...(draftId.current ? { draftId: draftId.current } : {}), ...(threadId.current ? { threadId: threadId.current } : {}) } })
      .then((r) => { draftId.current = r.draftId; threadId.current = r.threadId; setSaveState("saved"); void qc.invalidateQueries({ queryKey: ["mail"] }); })
      .catch(() => setSaveState(""));
    saving.current = p;
    await p;
  }

  const firstRun = useRef(true);
  useEffect(() => {
    if (firstRun.current) { firstRun.current = false; return; }
    scheduleSave();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [to, cc, bcc, subject]);

  function addFiles(list: FileList | null) {
    if (!list) return;
    const next: FileItem[] = [];
    for (const file of Array.from(list)) {
      if (file.size > MAX_ATTACHMENT_BYTES) { toast.error(`${file.name} is larger than 10 MB.`); continue; }
      next.push({ id: `${file.name}-${file.size}-${Math.random()}`, file });
    }
    setFiles((prev) => [...prev, ...next].slice(0, 10));
  }

  async function onSend() {
    const f = fields();
    const bad = [...splitRecipients(to), ...splitRecipients(cc), ...splitRecipients(bcc)].filter((a) => !isEmail(a));
    if (bad.length) { toast.error(`Check these addresses: ${bad.join(", ")}`); return; }
    if (!f.to.length) { toast.error("Add at least one recipient."); return; }
    if (timer.current) { clearTimeout(timer.current); timer.current = null; }
    setSending(true);
    try {
      if (saving.current) await saving.current;
      const attachments = await Promise.all(files.map(async ({ file }) => ({ filename: file.name, contentType: file.type || "application/octet-stream", base64: await toBase64(file) })));
      const result = await send({ data: {
        ...f, attachments,
        ...(draftId.current ? { draftId: draftId.current } : {}),
        ...(threadId.current ? { threadId: threadId.current } : {}),
        ...(followUp ? { followUpDays: Number(followUp) } : {}),
      } });
      if (!result.ok) { toast.error(result.error); return; }
      toast.success("Email sent");
      await qc.invalidateQueries({ queryKey: ["mail"] });
      onSent(result.threadId);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Couldn't send this email.");
    } finally {
      setSending(false);
    }
  }

  async function onDiscard() {
    if (timer.current) { clearTimeout(timer.current); timer.current = null; }
    if (saving.current) await saving.current;
    if (draftId.current) { await discard({ data: { draftId: draftId.current } }); await qc.invalidateQueries({ queryKey: ["mail"] }); }
    onClose();
  }

  function exec(cmd: string, value?: string) {
    editor.current?.focus();
    document.execCommand(cmd, false, value);
    scheduleSave();
  }

  const input = "w-full min-w-0 bg-transparent py-2 text-sm outline-hidden placeholder:text-muted-foreground";
  return (
    <div role="dialog" aria-label={init.title}
      className={`fixed z-50 flex flex-col overflow-hidden border border-border bg-card shadow-2xl inset-0 sm:inset-auto sm:bottom-0 sm:right-6 sm:w-[36rem] sm:rounded-t-xl ${minimised ? "sm:h-auto" : "sm:h-[min(42rem,calc(100vh-5rem))]"}`}>
      <div className="flex items-center gap-2 bg-primary px-4 py-2.5 text-primary-foreground">
        <span className="min-w-0 flex-1 truncate text-sm font-medium">{init.title}</span>
        <span className="text-xs opacity-80" aria-live="polite">{saveState === "saving" ? "Saving…" : saveState === "saved" ? "Draft saved" : ""}</span>
        <button type="button" className="hidden rounded p-1 hover:bg-primary-foreground/15 sm:block" onClick={() => setMinimised((v) => !v)} aria-label={minimised ? "Expand" : "Minimise"}>
          {minimised ? <Maximize2 className="size-4" /> : <Minus className="size-4" />}
        </button>
        <button type="button" className="rounded p-1 hover:bg-primary-foreground/15" onClick={() => { if (timer.current) void saveNow(); onClose(); }} aria-label="Close and keep draft"><X className="size-4" /></button>
      </div>
      {!minimised && (
        <>
          <div className="border-b border-border px-4 text-sm">
            <div className="flex items-center gap-2 border-b border-border/60 py-0.5 text-muted-foreground">From <span className="text-foreground">{fromAddress}</span></div>
            <label className="flex items-center gap-2 border-b border-border/60">
              <span className="w-8 shrink-0 text-muted-foreground">To</span>
              <input className={input} value={to} onChange={(e) => setTo(e.target.value)} placeholder="name@practice.nhs.uk" aria-label="To" autoFocus={!init.to} />
              {!showCc && <button type="button" className="shrink-0 text-xs text-muted-foreground hover:text-foreground" onClick={() => setShowCc(true)}>Cc Bcc</button>}
            </label>
            {showCc && (
              <>
                <label className="flex items-center gap-2 border-b border-border/60"><span className="w-8 shrink-0 text-muted-foreground">Cc</span><input className={input} value={cc} onChange={(e) => setCc(e.target.value)} aria-label="Cc" /></label>
                <label className="flex items-center gap-2 border-b border-border/60"><span className="w-8 shrink-0 text-muted-foreground">Bcc</span><input className={input} value={bcc} onChange={(e) => setBcc(e.target.value)} aria-label="Bcc" /></label>
              </>
            )}
            <input className={input} value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Subject" aria-label="Subject" />
          </div>
          <div className="flex flex-wrap items-center gap-0.5 border-b border-border px-2 py-1">
            {([["bold", Bold, "Bold"], ["italic", Italic, "Italic"], ["underline", Underline, "Underline"], ["insertUnorderedList", List, "Bulleted list"], ["insertOrderedList", ListOrdered, "Numbered list"]] as const).map(([cmd, Icon, name]) => (
              <button key={cmd} type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => exec(cmd)} aria-label={name} className="rounded p-1.5 text-muted-foreground hover:bg-secondary hover:text-foreground"><Icon className="size-4" /></button>
            ))}
            <button type="button" onMouseDown={(e) => e.preventDefault()} aria-label="Insert link" className="rounded p-1.5 text-muted-foreground hover:bg-secondary hover:text-foreground"
              onClick={() => { const url = window.prompt("Link address (https://…)"); if (url && /^(https?:|mailto:)/i.test(url)) exec("createLink", url); }}><Link2 className="size-4" /></button>
          </div>
          <div ref={editor} contentEditable suppressContentEditableWarning role="textbox" aria-multiline="true" aria-label="Message body"
            onInput={scheduleSave}
            onPaste={(e) => { e.preventDefault(); document.execCommand("insertText", false, e.clipboardData.getData("text/plain")); }}
            className="min-h-40 flex-1 overflow-y-auto px-4 py-3 text-sm leading-relaxed outline-hidden [&_blockquote]:ml-1 [&_blockquote]:border-l-2 [&_blockquote]:border-border [&_blockquote]:pl-3 [&_blockquote]:text-muted-foreground [&_ol]:list-decimal [&_ol]:pl-6 [&_ul]:list-disc [&_ul]:pl-6 [&_a]:text-accent [&_a]:underline" />
          {files.length > 0 && (
            <ul className="flex flex-wrap gap-2 border-t border-border px-4 py-2">
              {files.map(({ id, file }) => (
                <li key={id} className="flex max-w-full items-center gap-1.5 rounded-full bg-secondary px-3 py-1 text-xs">
                  <Paperclip className="size-3 shrink-0" /><span className="truncate">{file.name}</span><span className="shrink-0 text-muted-foreground">{formatBytes(file.size)}</span>
                  <button type="button" aria-label={`Remove ${file.name}`} onClick={() => setFiles((p) => p.filter((f) => f.id !== id))}><X className="size-3" /></button>
                </li>
              ))}
            </ul>
          )}
          <div className="flex flex-wrap items-center gap-2 border-t border-border px-4 py-3">
            <Button onClick={onSend} disabled={sending} className="rounded-full">{sending ? <Loader2 className="animate-spin" /> : <Send />} Send</Button>
            <input ref={fileInput} type="file" multiple className="sr-only" onChange={(e) => { addFiles(e.target.files); e.target.value = ""; }} aria-label="Attach files" />
            <button type="button" onClick={() => fileInput.current?.click()} className="rounded-full p-2 text-muted-foreground hover:bg-secondary hover:text-foreground" aria-label="Attach files"><Paperclip className="size-4" /></button>
            <select value={followUp} onChange={(e) => setFollowUp(e.target.value)} aria-label="Follow-up reminder"
              className="min-w-0 rounded-full border border-input bg-background px-3 py-1.5 text-xs">
              <option value="">No follow-up</option>
              {[1, 2, 3, 5, 7, 14].map((d) => <option key={d} value={d}>Remind me if no reply in {d} day{d > 1 ? "s" : ""}</option>)}
            </select>
            <button type="button" onClick={onDiscard} className="ml-auto rounded-full p-2 text-muted-foreground hover:bg-secondary hover:text-destructive" aria-label="Discard draft"><Trash2 className="size-4" /></button>
          </div>
        </>
      )}
    </div>
  );
}

function toBase64(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result).split(",")[1] ?? "");
    reader.onerror = () => reject(new Error(`Couldn't read ${file.name}.`));
    reader.readAsDataURL(file);
  });
}
