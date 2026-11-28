import { createHash, randomInt, timingSafeEqual } from "node:crypto";
import { useSession, setResponseHeader } from "@tanstack/react-start/server";
import { redirect } from "@tanstack/react-router";

export const ADMIN_OTP_EMAIL = "jiteshyesh@gmail.com";
export const OTP_TTL_MS = 10 * 60 * 1000;
export const OTP_MAX_ATTEMPTS = 5;

type GateData = { unlocked?: boolean; otpHash?: string | undefined; otpExpires?: number | undefined; otpAttempts?: number | undefined };

export function passwordMatches(input: string, expected: string) {
  return timingSafeEqual(createHash("sha256").update(input).digest(), createHash("sha256").update(expected).digest());
}

export function hashOtp(code: string, secret: string) {
  return createHash("sha256").update(`${secret}:${code}`).digest("hex");
}

export function newOtp() {
  return String(randomInt(0, 1_000_000)).padStart(6, "0");
}

/** Pure check of a submitted code against the pending challenge. */
export function checkOtp(data: GateData, code: string, secret: string, now: number): "ok" | "wrong" | "expired" | "locked" | "none" {
  if (!data.otpHash || !data.otpExpires) return "none";
  if (now > data.otpExpires) return "expired";
  if ((data.otpAttempts ?? 0) >= OTP_MAX_ATTEMPTS) return "locked";
  return passwordMatches(hashOtp(code, secret), data.otpHash) ? "ok" : "wrong";
}

export async function adminSession() {
  const password = process.env["SESSION_SECRET"];
  if (!password) throw new Error("Admin access is not configured.");
  setResponseHeader("Cache-Control", "no-store");
  return useSession<GateData>({
    password, name: "pmd-admin", maxAge: 60 * 60 * 8,
    cookie: { httpOnly: true, secure: true, sameSite: "strict", path: "/" },
  });
}

export async function requireAdminGate() {
  const session = await adminSession();
  if (!session.data.unlocked) throw redirect({ to: "/auth" });
}
