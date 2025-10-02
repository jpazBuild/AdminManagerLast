"use client";

import { useRef, useState } from "react";
import axios from "axios";
import { URL_API_ALB } from "@/config";
import { toast } from "sonner";

type GetParams = { teamId: number; collectionUid: string };

export const useFetchCollection = () => {
  const [cache, setCache] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState<Record<string, boolean>>({});
  const inflight = useRef<Record<string, Promise<any>>>({});

  const getCollection = async ({ teamId, collectionUid }: GetParams) => {
    if (!collectionUid) return null;

    if (cache[collectionUid]) return cache[collectionUid];

    if (await inflight.current[collectionUid]) return inflight.current[collectionUid];

    setLoading((p) => ({ ...p, [collectionUid]: true }));

    const p = axios
      .get(`${URL_API_ALB}getPostmanCollection`, {
        params: { teamId, collectionUid },
      })
      .then((res) => {
        const data = res.data;
        setCache((prev) => ({ ...prev, [collectionUid]: data }));
        return data;
      })
      .catch((err) => {
        toast.error("Failed to fetch collection");
        throw err;
      })
      .finally(() => {
        setLoading((p) => ({ ...p, [collectionUid]: false }));
        delete inflight.current[collectionUid];
      });

    inflight.current[collectionUid] = p;
    return p;
  };

  return { getCollection, cache, loading };
};
