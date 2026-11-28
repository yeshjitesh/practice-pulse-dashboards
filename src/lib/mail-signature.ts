import { createHmac, timingSafeEqual } from "node:crypto";

/** Verify a Svix-signed (Resend) webhook over the raw body. */
export function verifySvixSignature(opts: {
  id: string | null; timestamp: string | null; signature: string | null; body: string; secret: string; nowSeconds: number; toleranceSeconds?: number;
}) {
  const { id, timestamp, signature, body, secret, nowSeconds } = opts;
  if (!id || !timestamp || !signature || !secret) return false;
  const ts = Number(timestamp);
  if (!Number.isFinite(ts) || Math.abs(nowSeconds - ts) > (opts.toleranceSeconds ?? 300)) return false;
  const key = Buffer.from(secret.startsWith("whsec_") ? secret.slice(6) : secret, "base64");
  const expected = createHmac("sha256", key).update(`${id}.${timestamp}.${body}`).digest();
  return signature.split(" ").some((part) => {
    const [version, sig] = part.split(",");
    if (version !== "v1" || !sig) return false;
    const given = Buffer.from(sig, "base64");
    return given.length === expected.length && timingSafeEqual(given, expected);
  });
}
