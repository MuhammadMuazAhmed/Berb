import { useEffect, useState } from "react";
import { fetchServices } from "../lib/api";

/**
 * Loads only active service options from the backend. A failed catalog request
 * is surfaced to the customer instead of offering non-bookable fallback data.
 */
export function useServices() {
  const [options, setOptions] = useState<Awaited<ReturnType<typeof fetchServices>>>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError("");
    fetchServices()
      .then((apiServices) => { if (!cancelled) setOptions(apiServices); })
      .catch((reason: unknown) => { if (!cancelled) setError(reason instanceof Error ? reason.message : "We couldn't load the service list."); })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [attempt]);

  return { options, loading, error, retry: () => setAttempt((value) => value + 1) };
}
