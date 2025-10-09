"use client";
import { useEffect, useState } from "react";
import axios from "axios";
import { URL_API_ALB } from "@/config";
import { IterationHeader } from "../types";

const apiUrl = (p: string) => new URL(p, URL_API_ALB).toString();

function extractArray<T>(payload: any): T[] {
  if (!payload) return [];
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload.data)) return payload.data;
  for (const k of ["headers", "items", "result", "results", "list", "rows"]) {
    if (Array.isArray(payload[k])) return payload[k];
  }
  for (const v of Object.values(payload)) {
    if (Array.isArray(v) && v.some((x) => x && typeof x === "object" && ("id" in x || "name" in x))) {
      return v as T[];
    }
  }
  return [];
}

export function useIterationList() {
  const [iterations, setIterations] = useState<IterationHeader[]>([]);
  const [loadingList, setLoadingList] = useState(false);
  const [listError, setListError] = useState<string | null>(null);
  const [query, setQuery] = useState("");

  const refresh = async () => {
    setLoadingList(true);
    setListError(null);
    const ENDPOINT = apiUrl("getIterationDataHeaders");
    try {
      const res = await axios.post(ENDPOINT, {}, { timeout: 20000, withCredentials: true });
      setIterations(extractArray<IterationHeader>(res.data));
    } catch {
      try {
        const res2 = await axios.get(ENDPOINT, { timeout: 20000, withCredentials: true });
        setIterations(extractArray<IterationHeader>(res2.data));
      } catch (e: any) {
        setIterations([]);
        setListError(e?.message || "Failed to load iterations.");
      }
    } finally {
      setLoadingList(false);
    }
  };

  useEffect(() => { refresh(); }, []);

  return {
    iterations,
    loadingList,
    listError,
    query,
    setQuery,
    refresh,
    setIterations, // lo expongo para duplicar/eliminar localmente
  };
}
