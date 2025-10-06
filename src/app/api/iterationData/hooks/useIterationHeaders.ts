import { useCallback, useEffect, useMemo, useState } from "react";
import axios from "axios";
import { URL_API_ALB } from "@/config";

export type IterationHeader = { id: string; name: string; description?: string };

export function useIterationHeaders() {
  const [headers, setHeaders] = useState<IterationHeader[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");

  const refetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await axios.post<IterationHeader[]>(
        `${URL_API_ALB}getIterationDataHeaders`,
        {}
      );
      setHeaders(data || []);
    } catch (e) {
      console.error(e);
      setError("No se pudo cargar la lista de iteration data.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refetch();
  }, [refetch]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return headers;
    return headers.filter((h) =>
      [(h.name || ""), (h.id || ""), (h.description || "")]
        .join(" ")
        .toLowerCase()
        .includes(q)
    );
  }, [headers, query]);

  return { headers: filtered, raw: headers, loading, error, query, setQuery, refetch };
}
