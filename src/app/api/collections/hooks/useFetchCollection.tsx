"use client";

import { useRef, useState } from "react";
import axios from "axios";
import { URL_API_ALB } from "@/config";
import { toast } from "sonner";
import { checkConnection } from "@/utils/DBBUtils";

type GetParams = { teamId: number; collectionUid: string };

export const useFetchCollection = () => {
  const [cache, setCache] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState<Record<string, boolean>>({});
  const inflight = useRef<Record<string, Promise<any>>>({});
  const [error, setError] = useState<string | null>(null);
  const getCollection = async ({ teamId, collectionUid }: GetParams) => {
    if (!collectionUid) return null;

    if (cache[collectionUid]) return cache[collectionUid];

    if (await inflight.current[collectionUid]) return inflight.current[collectionUid];

    setLoading((p) => ({ ...p, [collectionUid]: true }));

    try {
      await checkConnection()
      const res = await axios.post(`${URL_API_ALB}getPostmanCollection`,
        { teamId, collectionUid },
      );
      const data = res.data;
      setCache((prev) => ({ ...prev, [collectionUid]: data }));
      return data;
    } catch (error) {
      toast.error("Failed to fetch collection");
      setError("Failed to fetch collection");
      throw error;
    } finally {
      setLoading((p) => ({ ...p, [collectionUid]: false }));
      delete inflight.current[collectionUid];
    }
  };

  return { getCollection, cache, loading, error };
};
