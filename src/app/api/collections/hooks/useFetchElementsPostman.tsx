"use client";

import { URL_API_ALB } from "@/config";
import { checkConnection } from "@/utils/DBBUtils";
import axios, { AxiosError } from "axios";
import { useEffect, useState } from "react";
import { toast } from "sonner";

type TeamsShape = {
  teams: Array<{
    name: string;
    teamId: number;
    workspaces: Array<any>;
  }>;
};

export const useFetchElementsPostman = () => {
  const [elements, setElements] = useState<TeamsShape | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const controller = new AbortController();
    let unmounted = false;

    const sleep = (ms: number, signal: AbortSignal) =>
      new Promise<void>((resolve, reject) => {
        const id = setTimeout(resolve, ms);
        const onAbort = () => {
          clearTimeout(id);
          reject(new DOMException("Aborted", "AbortError"));
        };
        signal.addEventListener("abort", onAbort, { once: true });
      });

    (async () => {
      const maxRetries = 7;
      const baseDelayMs = 500;
      let attempt = 0;

      try {
        await checkConnection();

        while (true) {
          try {
            const response = await axios.get(`${URL_API_ALB}getPostmanElements`, {
              signal: controller.signal as any,
            });
            if (response.status !== 200) {
              throw new Error(`Unexpected response status: ${response.status}`);
            }
            if (!unmounted) {
              setElements(response.data);
              setLoading(false);
            }
            return;
          } catch (err) {
            const axErr = err as AxiosError;
            if (axios.isCancel(axErr) || controller.signal.aborted) return;

            const status = axErr.response?.status;
            if (status === 500 && attempt < maxRetries) {
              attempt += 1;
              let delayMs = baseDelayMs * Math.pow(2, attempt - 1);
              const retryAfter = axErr.response?.headers?.["retry-after"];
              if (retryAfter) {
                const asNum = Number(retryAfter);
                if (!Number.isNaN(asNum) && asNum > 0) {
                  delayMs = Math.max(delayMs, asNum * 1000);
                }
              }
              try {
                await sleep(delayMs, controller.signal);
                continue;
              } catch {
                return;
              }
            }
            throw axErr;
          }
        }
      } catch (error) {
        if (axios.isCancel(error)) return;
        if (!unmounted) {
          setLoading(false);
          toast.error("Failed to fetch Postman elements");
        }
      }
    })();

    return () => {
      unmounted = true;
      controller.abort();
    };
  }, []);

  return { elements, loading };
};
