/**
 * Central API client for the BERB backend.
 * Base URL is set via VITE_API_BASE_URL in .env / .env.local.
 * No secrets are ever exposed — the env var is public by design.
 */

const BASE = (
  (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? ""
).replace(/\/+$/, "");

// ─── Response shapes ────────────────────────────────────────────────────────

export interface ApiService {
  id: string;
  name: string;
  slug: string;
  category: string;
  description: string;
}

export interface ServiceRequestPayload {
  customerName: string;
  email: string;
  phone?: string;
  service: string;
  urgency?: "emergency" | "urgent" | "standard";
  address: string | { line1: string; city?: string; postalCode?: string; country?: string };
  preferredDate?: string; // ISO date-time string, optional
  jobDescription: string;
  requestType?: "service_request" | "quote_request";
  source?: "service_page" | "offer_form";
  website?: string;
}

export interface ServiceRequestResponse {
  id: string;
  reference: string;
  status: string;
}

// ─── Helpers ────────────────────────────────────────────────────────────────

async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const normalizedPath = `/${path.replace(/^\/+/, "")}`;
  const url = BASE ? `${BASE}${normalizedPath}` : normalizedPath;

  const res = await fetch(url, {
    headers: { "Content-Type": "application/json" },
    ...init,
  });
  if (!res.ok) {
    let message = `API error ${res.status}`;
    try {
      const body = await res.json();
      if (body?.message) message = body.message;
    } catch {
      // ignore parse errors
    }
    throw new Error(message);
  }
  return res.json() as Promise<T>;
}

// ─── Public API ─────────────────────────────────────────────────────────────

/**
 * Load available services from the backend.
 * Returns an empty array on network failure so the static fallback can be used.
 */
export async function fetchServices(): Promise<ApiService[]> {
  return apiFetch<ApiService[]>("/api/v1/services");
}

/**
 * Submit a service request.
 * Throws on validation / server error so the caller can surface it.
 */
export async function submitServiceRequest(
  payload: ServiceRequestPayload,
): Promise<ServiceRequestResponse> {
  return apiFetch<ServiceRequestResponse>("/api/v1/service-requests", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}
