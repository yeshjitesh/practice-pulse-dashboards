import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { useServerFn } from "@tanstack/react-start";
import { unlockAdmin, verifyAdminOtp } from "@/lib/admin.functions";
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
  const verify = useServerFn(verifyAdminOtp);
  const [step, setStep] = useState<"code" | "otp">("code");
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);
  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const code = String(new FormData(e.currentTarget).get("code") ?? "");
    setMsg(""); setBusy(true);
    try {
      if (step === "code") {
        const result = await unlock({ data: { code } });
        if (result.ok) { setStep("otp"); }
        else setMsg("Incorrect access code.");
      } else {
        if (!/^\d{6}$/.test(code.trim())) { setMsg("Enter the 6-digit code."); return; }
        const result = await verify({ data: { code: code.trim() } });
        if (result.ok) await navigate({ to: "/admin", replace: true });
        else if (result.reason === "wrong") setMsg("That code isn't right. Please try again.");
        else { setStep("code"); setMsg(result.reason === "locked" ? "Too many tries. Please start again." : "That code has expired. Please start again."); }
      }
    } catch { setMsg(step === "code" ? "Couldn't send the sign-in code. Please try again." : "Couldn't check the code. Please try again."); }
    finally { setBusy(false); }
  }
  return (
    <main className="flex min-h-screen items-center justify-center bg-secondary px-4">
      <div className="w-full max-w-md rounded-lg border border-border bg-card p-8">
        <Link to="/"><Logo /></Link>
        <LockKeyhole className="mt-8 size-6 text-primary" />
        <h1 className="mt-3 font-display text-3xl text-primary">Admin access</h1>
        <form key={step} onSubmit={submit} className="mt-6 space-y-4">
          {step === "code" ? (<>
            <label htmlFor="access-code" className="block text-sm font-medium">Access code</label>
            <input id="access-code" name="code" type="password" required maxLength={256} autoComplete="current-password" className="w-full rounded-lg border border-input bg-background px-4 py-3 outline-none focus:border-accent focus:ring-2 focus:ring-ring/30" />
          </>) : (<>
            <p className="text-sm text-muted-foreground">We've emailed a 6-digit code to the admin inbox. It expires in 10 minutes.</p>
            <label htmlFor="otp-code" className="block text-sm font-medium">Email code</label>
            <input id="otp-code" name="code" type="text" inputMode="numeric" pattern="[0-9]{6}" required maxLength={6} autoComplete="one-time-code" autoFocus className="w-full rounded-lg border border-input bg-background px-4 py-3 text-center text-2xl tracking-[0.4em] outline-none focus:border-accent focus:ring-2 focus:ring-ring/30" />
          </>)}
          {msg && <p role="alert" className="text-sm text-destructive">{msg}</p>}
          <Button type="submit" variant="brand" disabled={busy} className="h-12 w-full">{busy ? "Please wait…" : step === "code" ? "Continue" : "Verify and sign in"}</Button>
          {step === "otp" && <Button type="button" variant="link" className="px-0" onClick={() => { setStep("code"); setMsg(""); }}>Start again / resend code</Button>}
        </form>
        <Button asChild variant="link" className="mt-4 px-0"><Link to="/">Back to PracticeMD</Link></Button>
      </div>
    </main>
  );
}
