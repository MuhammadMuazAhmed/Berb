import { ZodError } from "zod";

export class AppError extends Error {
  constructor(public status: number, message: string, public code = "error", public details?: unknown) { super(message); }
}
export const badRequest = (m: string, d?: unknown) => new AppError(400, m, "bad_request", d);
export const unauthorized = (m = "Authentication required") => new AppError(401, m, "unauthenticated");
export const forbidden = (m = "Not allowed") => new AppError(403, m, "forbidden");
export const notFound = (m = "Not found") => new AppError(404, m, "not_found");
export const conflict = (m: string, d?: unknown) => new AppError(409, m, "conflict", d);
export const unprocessable = (m: string, d?: unknown) => new AppError(422, m, "unprocessable", d);
export const tooMany = (m = "Too many requests") => new AppError(429, m, "rate_limited");

/** Error body convention: { message, code, errors?: { field: string[] }, details? } */
export function toResponseBody(e: unknown): { status: number; body: Record<string, unknown> } {
  if (e instanceof ZodError) {
    const errors: Record<string, string[]> = {};
    for (const i of e.issues) (errors[i.path.join(".") || "_"] ??= []).push(i.message);
    return { status: 400, body: { message: "Validation failed", code: "validation_error", errors } };
  }
  if (e instanceof AppError) return { status: e.status, body: { message: e.message, code: e.code, ...(e.details ? { details: e.details } : {}) } };
  console.error("[unhandled]", e instanceof Error ? e.message : "unknown", e instanceof Error ? e.stack : "");
  return { status: 500, body: { message: "Unexpected server error", code: "internal_error" } };
}
