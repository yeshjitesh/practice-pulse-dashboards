import { useEffect, useRef, useState } from "react";
import { ImageOff } from "lucide-react";

/** Shows an email's HTML cleaned and isolated in a sandboxed frame; remote images stay blocked until allowed. */
export function EmailFrame({ html, text }: { html: string | null; text: string | null }) {
  const [srcDoc, setSrcDoc] = useState<string | null>(null);
  const [hasRemote, setHasRemote] = useState(false);
  const [showImages, setShowImages] = useState(false);
  const [height, setHeight] = useState(120);
  const ref = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    if (!html) return;
    let cancelled = false;
    void import("dompurify").then(({ default: DOMPurify }) => {
      if (cancelled) return;
      DOMPurify.removeAllHooks();
      DOMPurify.addHook("afterSanitizeAttributes", (node) => {
        if (node.tagName === "A") { node.setAttribute("target", "_blank"); node.setAttribute("rel", "noopener noreferrer"); }
      });
      const clean = DOMPurify.sanitize(html, { FORBID_TAGS: ["form", "input", "button", "textarea", "select", "iframe", "object", "embed"], FORBID_ATTR: ["srcset"] });
      setHasRemote(/(src\s*=\s*["']?\s*https?:|url\(\s*["']?\s*https?:)/i.test(clean));
      const img = showImages ? "data: cid: https: http:" : "data: cid:";
      const csp = `default-src 'none'; style-src 'unsafe-inline'; img-src ${img}; font-src ${showImages ? "https: data:" : "data:"};`;
      setSrcDoc(`<!doctype html><html><head><meta charset="utf-8"><meta http-equiv="Content-Security-Policy" content="${csp}"><base target="_blank"><style>body{margin:0;font-family:Arial,Helvetica,sans-serif;font-size:14px;line-height:1.5;color:#283338;word-wrap:break-word}img{max-width:100%;height:auto}blockquote{margin:0 0 0 .8ex;border-left:2px solid #cae1e2;padding-left:1ex;color:#5b6b70}</style></head><body>${clean}</body></html>`);
    });
    return () => { cancelled = true; };
  }, [html, showImages]);

  function resize() {
    const doc = ref.current?.contentDocument;
    if (doc?.body) setHeight(Math.min(Math.max(doc.body.scrollHeight + 16, 40), 6000));
  }

  if (!html) return <pre className="whitespace-pre-wrap break-words font-sans text-sm leading-relaxed text-foreground">{text || "(no message)"}</pre>;
  return (
    <div>
      {hasRemote && !showImages && (
        <div className="mb-2 flex flex-wrap items-center gap-2 rounded-lg bg-secondary px-3 py-2 text-xs text-muted-foreground">
          <ImageOff className="size-3.5 shrink-0" /> Images from the web are hidden to protect your privacy.
          <button type="button" className="font-medium text-primary underline-offset-2 hover:underline" onClick={() => setShowImages(true)}>Show images</button>
        </div>
      )}
      {srcDoc && (
        <iframe ref={ref} title="Email content" srcDoc={srcDoc} onLoad={resize} style={{ height }}
          sandbox="allow-popups allow-popups-to-escape-sandbox allow-same-origin" className="w-full border-0 bg-white" />
      )}
    </div>
  );
}
