import { createHash, randomBytes } from "node:crypto";
import { headers } from "next/headers";

export function sha256(s: string) {
  return createHash("sha256").update(s).digest("hex");
}

export function randomToken(bytes = 32) {
  return randomBytes(bytes).toString("base64url");
}

/** A salted hash of the visitor's IP: enough to rate-limit, without storing the IP itself. */
export async function ipHash() {
  const h = await headers();
  const ip = (h.get("x-forwarded-for") ?? "").split(",")[0].trim() || h.get("x-real-ip") || "unknown";
  return sha256(`${process.env.APP_SECRET ?? "dev"}:${ip}`).slice(0, 32);
}
