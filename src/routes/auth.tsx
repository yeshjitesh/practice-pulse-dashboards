import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { useServerFn } from "@tanstack/react-start";
import { unlockAdmin } from "@/lib/admin.functions";
import { Logo } from "@/components/brand/Logo";
import { Button } from "@/components/ui/button";
import { LockKeyhole } from "lucide-react";

export const Route = createFileRoute("/auth")({
  staticData: { sitemap: false },
  head: () => ({ meta: [
    { title: "Admin access — PracticeMD" },
    { name: "description", content: "Private access to the PracticeMD administration area." },
    { property: "og:title", content: "Admin access — PracticeMD" },
    { property: "og:description", content: "Private PracticeMD administration access." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary" },
    { name: "robots", content: "noindex" },
  ] }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const unlock = useServerFn(unlockAdmin);
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);
  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const code = String(new FormData(e.currentTarget).get("code") ?? "");
    setMsg(""); setBusy(true);
    try {
      const result = await unlock({ data: { code } });
      if (result.ok) await navigate({ to: "/admin", replace: true });
      else setMsg("Incorrect access code.");
    } catch { setMsg("Couldn't unlock the admin area. Please try again."); }
    finally { setBusy(false); }
  }
  return (
    <main className="flex min-h-screen items-center justify-center bg-secondary px-4">
      <div className="w-full max-w-md rounded-lg border border-border bg-card p-8">
        <Link to="/"><Logo /></Link>
        <LockKeyhole className="mt-8 size-6 text-primary" />
        <h1 className="mt-3 font-display text-3xl text-primary">Admin access</h1>
        <form onSubmit={submit} className="mt-6 space-y-4">
          <label htmlFor="access-code" className="block text-sm font-medium">Access code</label>
          <input id="access-code" name="code" type="password" required maxLength={256} autoComplete="current-password" className="w-full rounded-lg border border-input bg-background px-4 py-3 outline-none focus:border-accent focus:ring-2 focus:ring-ring/30" />
          {msg && <p role="alert" className="text-sm text-destructive">{msg}</p>}
          <Button type="submit" variant="brand" disabled={busy} className="h-12 w-full">{busy ? "Please wait…" : "Unlock admin"}</Button>
        </form>
        <Button asChild variant="link" className="mt-4 px-0"><Link to="/">Back to PracticeMD</Link></Button>
      </div>
    </main>
  );
}
