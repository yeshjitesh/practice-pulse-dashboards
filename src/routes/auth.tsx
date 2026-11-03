import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { Logo } from "@/components/brand/Logo";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Sign in — PracticeMD" },
      { name: "description", content: "Sign in to manage your PracticeMD site." },
      { property: "og:title", content: "Sign in — PracticeMD" },
      { property: "og:description", content: "Admin sign in for PracticeMD." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"in" | "up">("in");
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: "/admin", replace: true });
    });
    const { data } = supabase.auth.onAuthStateChange((e, s) => {
      if (e === "SIGNED_IN" && s) navigate({ to: "/admin", replace: true });
    });
    return () => data.subscription.unsubscribe();
  }, [navigate]);

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setMsg("");
    setBusy(true);
    const f = new FormData(e.currentTarget);
    const email = String(f.get("email"));
    const password = String(f.get("password"));
    const { error, data } =
      mode === "in"
        ? await supabase.auth.signInWithPassword({ email, password })
        : await supabase.auth.signUp({ email, password, options: { emailRedirectTo: window.location.origin + "/auth" } });
    setBusy(false);
    if (error) return setMsg(error.message);
    if (mode === "up" && !data.session) setMsg("Check your email to confirm your account, then sign in.");
  }

  const input = "w-full rounded-lg border border-input bg-background px-4 py-3 outline-none focus:border-accent focus:ring-2 focus:ring-ring/30";
  return (
    <div className="flex min-h-screen items-center justify-center bg-secondary px-4">
      <div className="w-full max-w-md rounded-2xl border border-border bg-card p-8 shadow-[var(--shadow-soft)]">
        <Link to="/"><Logo /></Link>
        <h1 className="mt-6 font-display text-3xl text-primary">{mode === "in" ? "Welcome back" : "Create admin account"}</h1>
        <button
          onClick={() => lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin + "/auth" })}
          className="mt-6 w-full rounded-full border border-input bg-background py-3 font-medium transition-colors hover:bg-secondary"
        >
          Continue with Google
        </button>
        <div className="my-5 text-center text-xs uppercase tracking-widest text-muted-foreground">or</div>
        <form onSubmit={submit} className="space-y-3">
          <input name="email" type="email" required placeholder="Email" className={input} />
          <input name="password" type="password" required minLength={8} placeholder="Password" className={input} />
          {msg && <p className="text-sm text-muted-foreground">{msg}</p>}
          <button disabled={busy} className="w-full rounded-full bg-primary py-3 font-medium text-primary-foreground transition-colors hover:bg-accent disabled:opacity-60">
            {busy ? "Please wait…" : mode === "in" ? "Sign in" : "Sign up"}
          </button>
        </form>
        <button onClick={() => setMode(mode === "in" ? "up" : "in")} className="mt-4 text-sm text-accent hover:underline">
          {mode === "in" ? "No account yet? Sign up" : "Have an account? Sign in"}
        </button>
      </div>
    </div>
  );
}
