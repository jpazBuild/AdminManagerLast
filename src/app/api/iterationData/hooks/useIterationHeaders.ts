import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { URL_API_ALB } from "@/config";

export type IterationHeader = {
  id: string;
  name: string;
  description?: string;
  tagNames?: string[];
  tagIds?: string[];
  createdAt?: number;
  createdBy?: string;
  createdByName?: string;
  type?: string;
  route?: string;
};

export function useIterationHeaders() {
  const [raw, setRaw] = useState<IterationHeader[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");

  const HEADERS_ENDPOINT = new URL("getIterationDataHeaders", URL_API_ALB).toString();

  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      setError(null);
      console.log("[headers] POST", HEADERS_ENDPOINT);
      try {
        const { data } = await axios.post<IterationHeader[]>(
          HEADERS_ENDPOINT,
          {},
          { timeout: 20000 }
        );
        if (!mounted) return;
        console.log("[headers] OK (count):", Array.isArray(data) ? data.length : 0);
        setRaw(Array.isArray(data) ? data : []);
      } catch (e: any) {
        if (!mounted) return;
        console.error("[headers] ERR:", {
          message: e?.message,
          status: e?.response?.status,
          data: e?.response?.data,
        });
        setError(e?.message || "Failed to load iteration headers.");
        setRaw([]);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [HEADERS_ENDPOINT]);

  const headers = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return raw;
    return raw.filter((h) =>
      [
        h.name ?? "",
        h.id ?? "",
        h.description ?? "",
        ...(h.tagNames ?? []),
        ...(h.tagIds ?? []),
        h.createdByName ?? "",
        h.createdBy ?? "",
      ]
        .join(" ")
        .toLowerCase()
        .includes(q)
    );
  }, [raw, query]);

  return { headers, raw, loading, error, query, setQuery };
}
