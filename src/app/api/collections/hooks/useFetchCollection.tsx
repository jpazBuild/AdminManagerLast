"use client";

import { useRef, useState } from "react";
import axios, { AxiosError } from "axios";
import { URL_API_ALB } from "@/config";
import { toast } from "sonner";
import { checkConnection } from "@/utils/DBBUtils";

type GetParams = { teamId: number; collectionUid: string };

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

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

    const promise = (async () => {
      try {
        await checkConnection();

        const maxRetries = 3;
        let attempt = 0;
        let lastErr: unknown;

        while (attempt < maxRetries) {
          try {
            const res = await axios.post(
              `${URL_API_ALB}getPostmanCollection`,
              { teamId, collectionUid }
            );
            const data = res.data;
            setCache((prev) => ({ ...prev, [collectionUid]: data }));
            return data;
          } catch (err) {
            lastErr = err;
            const axErr = err as AxiosError<any>;
            const status = axErr.response?.status;
            const message =
              (axErr.response?.data?.message as string | undefined) ??
              (axErr.response?.data?.error as string | undefined) ??
              (axErr.message ?? "");

            const shouldRetry =
              status === 500 && typeof message === "string" && message.includes("429");

            attempt += 1;

            if (!shouldRetry || attempt >= maxRetries) {
              throw err;
            }

            await sleep(300 * attempt);
          }
        }

        throw lastErr ?? new Error("Unknown error");
      } catch (err) {
        toast.error("Failed to fetch collection");
        setError("Failed to fetch collection");
        throw err;
      } finally {
        setLoading((p) => ({ ...p, [collectionUid]: false }));
        delete inflight.current[collectionUid];
      }
    })();

    inflight.current[collectionUid] = promise;
    return promise;
  };

  return { getCollection, cache, loading, error };
};
