
"use client";

import { URL_API_ALB } from "@/config";
import { checkConnection } from "@/utils/DBBUtils";
import axios from "axios";
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

  useEffect(() => {
    const controller = new AbortController();

    (async () => {
      try {

        await checkConnection()
        const response = await axios.get(`${URL_API_ALB}getPostmanElements`, {
          signal: controller.signal as any,
        });
        setElements(response.data);
      } catch (error: any) {
        if (axios.isCancel(error)) return;
        toast.error("Failed to fetch Postman elements");
        console.error("Error fetching Postman elements", error);
      }
    })();

    return () => controller.abort();
  }, []);

  return { elements };
};
