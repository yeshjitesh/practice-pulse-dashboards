import nexaIcon from "@/assets/nexa-icon.png";
import { useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import { useServerFn } from "@tanstack/react-start";
import { X, Send, UserRound } from "lucide-react";
import { getChatHistory, sendChatMessage } from "@/lib/chat.functions";

type Msg = { role: "user" | "assistant"; content: string };
const KEY = "pmd-chat-token";
const GREETING: Msg = { role: "assistant", content: "Hi, I'm **NEXA** from PracticeMD 👋 Ask me anything about practice dashboards — or say *\"talk to a person\"* and I'll get the team to contact you." };

function getToken() {
  let t = localStorage.getItem(KEY);
  if (!t) { t = crypto.randomUUID(); localStorage.setItem(KEY, t); }
  return t;
}

export function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const history = useServerFn(getChatHistory);
  const send = useServerFn(sendChatMessage);
  const endRef = useRef<HTMLDivElement>(null);
  const taRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (!open || loaded) return;
    history({ data: { token: getToken() } })
      .then((r) => setMsgs(r.messages)).catch(() => {}).finally(() => setLoaded(true));
  }, [open, loaded, history]);
  useEffect(() => { endRef.current?.scrollIntoView({ block: "end" }); }, [msgs, busy, open]);
  useEffect(() => { if (open && !busy) taRef.current?.focus(); }, [open, busy]);

  async function submit(text: string) {
    const t = text.trim();
    if (!t || busy) return;
    setInput("");
    setMsgs((m) => [...m, { role: "user", content: t }]);
    setBusy(true);
    window.__lovableEvents?.track?.("project.chat_message_sent", {});
    try {
      const r = await send({ data: { token: getToken(), message: t } });
      setMsgs((m) => [...m, { role: "assistant", content: r.reply }]);
    } catch {
      setMsgs((m) => [...m, { role: "assistant", content: "Sorry, something went wrong. Please try again or use the contact page." }]);
    } finally { setBusy(false); }
  }

  const shown = [GREETING, ...msgs];
  return (
    <>
      {!open && (
        <button onClick={() => setOpen(true)} aria-label="Chat with PracticeMD"
          className="fixed bottom-5 right-5 z-40 flex items-center gap-2 rounded-full bg-primary px-5 py-3 text-sm font-medium text-primary-foreground shadow-lg hover:bg-primary/90">
          <img src={nexaIcon} alt="" width={28} height={28} className="h-7 w-7 rounded-full bg-background" /> Chat with us now
        </button>
      )}
      {open && (
        <div role="dialog" aria-label="PracticeMD chat"
          className="fixed inset-x-3 bottom-3 top-20 z-40 flex flex-col overflow-hidden rounded-2xl border border-border bg-background shadow-2xl sm:inset-auto sm:bottom-5 sm:right-5 sm:h-[600px] sm:w-[400px]">
          <div className="flex items-center justify-between bg-primary px-4 py-3 text-primary-foreground">
            <div className="flex items-center gap-3">
              <img src={nexaIcon} alt="NEXA" width={36} height={36} className="h-9 w-9 rounded-full bg-background p-0.5" />
              <div><p className="font-display text-lg leading-none">NEXA</p><p className="text-xs opacity-80">PracticeMD assistant · usually replies instantly</p></div>
            </div>
            <button onClick={() => setOpen(false)} aria-label="Close chat" className="rounded-full p-1 hover:bg-primary-foreground/10"><X className="h-5 w-5" /></button>
          </div>
          <div className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
            {shown.map((m, i) => m.role === "user" ? (
              <div key={i} className="ml-auto max-w-[85%] rounded-2xl rounded-br-sm bg-primary px-4 py-2 text-sm text-primary-foreground whitespace-pre-wrap">{m.content}</div>
            ) : (
              <div key={i} className="prose prose-sm max-w-[92%] text-sm text-foreground [&_a]:text-primary [&_p]:my-1 [&_ul]:my-1"><ReactMarkdown>{m.content}</ReactMarkdown></div>
            ))}
            {busy && <div className="flex gap-1 py-2" aria-label="NEXA is typing">{[0,1,2].map((d) => <span key={d} className="h-2 w-2 animate-bounce rounded-full bg-accent" style={{ animationDelay: `${d * 150}ms` }} />)}</div>}
            {msgs.length === 0 && !busy && (
              <div className="flex flex-wrap gap-2 pt-1">
                {["What dashboards can you build?", "How does it work?", "Book a free chat"].map((s) => (
                  <button key={s} onClick={() => submit(s)} className="rounded-full border border-border bg-secondary px-3 py-1.5 text-xs hover:border-accent">{s}</button>
                ))}
              </div>
            )}
            <div ref={endRef} />
          </div>
          <form onSubmit={(e) => { e.preventDefault(); submit(input); }} className="border-t border-border p-3">
            <div className="flex items-end gap-2 rounded-xl border border-input bg-card px-3 py-2">
              <textarea ref={taRef} value={input} onChange={(e) => setInput(e.target.value)} rows={1} maxLength={2000}
                onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); submit(input); } }}
                placeholder="Type your question…" aria-label="Your message"
                className="max-h-32 flex-1 resize-none bg-transparent text-base outline-none sm:text-sm" />
              <button type="submit" disabled={busy || !input.trim()} aria-label="Send"
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground disabled:opacity-40"><Send className="h-4 w-4" /></button>
            </div>
            <button type="button" onClick={() => submit("I'd like to talk to a person please.")}
              className="mt-2 flex items-center gap-1 text-xs text-muted-foreground hover:text-primary"><UserRound className="h-3 w-3" /> Talk to a real person</button>
            <p className="mt-1 text-[11px] text-muted-foreground">Please don't share patient information. Chats are saved so we can follow up.</p>
          </form>
        </div>
      )}
    </>
  );
}
