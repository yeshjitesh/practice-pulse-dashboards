import { createHash, timingSafeEqual } from "node:crypto";
import { useSession, setResponseHeader } from "@tanstack/react-start/server";
import { redirect } from "@tanstack/react-router";

export function passwordMatches(input: string, expected: string) {
  return timingSafeEqual(createHash("sha256").update(input).digest(), createHash("sha256").update(expected).digest());
}

export async function adminSession() {
  const password = process.env["SESSION_SECRET"];
  if (!password) throw new Error("Admin access is not configured.");
  setResponseHeader("Cache-Control", "no-store");
  return useSession<{ unlocked?: boolean }>({
    password, name: "pmd-admin", maxAge: 60 * 60 * 8,
    cookie: { httpOnly: true, secure: true, sameSite: "strict", path: "/" },
  });
}

export async function requireAdminGate() {
  const session = await adminSession();
  if (!session.data.unlocked) throw redirect({ to: "/auth" });
}