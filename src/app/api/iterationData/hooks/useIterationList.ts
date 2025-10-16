"use client";

import { useEffect, useState } from "react";
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

function extractArray<T = any>(payload: any): T[] {
  if (!payload) return [];
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
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

  const ENDPOINT = new URL("getIterationDataHeaders", URL_API_ALB).toString();

  const refresh = async () => {
    setLoadingList(true);
    setListError(null);
    try {
      try {
        const { data } = await axios.post(ENDPOINT, {}, { withCredentials: true });
        setIterations(extractArray<IterationHeader>(data));
      } catch {
        const { data } = await axios.get(ENDPOINT, { withCredentials: true });
        setIterations(extractArray<IterationHeader>(data));
      }
    } catch (e: any) {
      setIterations([]);
      setListError(e?.message || "Failed to load iterations.");
    } finally {
      setLoadingList(false);
    }
  };

  useEffect(() => {
    refresh();
  }, []);

  return {
    iterations,
    loadingList,
    listError,
    query,
    setQuery,
    refresh,
  };
}
