import "server-only";
import { getEnv } from "../env";

export interface EmailMessage { to: string; subject: string; html: string; text: string; idempotencyKey: string }
export interface EmailProvider { send(m: EmailMessage): Promise<{ id: string }> }

/** Resend over its REST API (no SDK, so another provider can be swapped in by implementing EmailProvider). */
class ResendProvider implements EmailProvider {
  async send(m: EmailMessage) {
    const env = getEnv();
    if (!env.RESEND_API_KEY) {
      if (env.NODE_ENV === "production") throw new Error("RESEND_API_KEY missing");
      console.log(`[email:dev] to=${m.to} subject=${m.subject}\n${m.text}`);
      return { id: "dev-console" };
    }
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${env.RESEND_API_KEY}`, "Content-Type": "application/json", "Idempotency-Key": m.idempotencyKey },
      body: JSON.stringify({ from: env.EMAIL_FROM, to: [m.to], subject: m.subject, html: m.html, text: m.text }),
      signal: AbortSignal.timeout(15_000),
    });
    if (!res.ok) throw new Error(`Email provider responded ${res.status}`); // body deliberately not stored
    return { id: ((await res.json()) as { id: string }).id };
  }
}
export const emailProvider: EmailProvider = new ResendProvider();
