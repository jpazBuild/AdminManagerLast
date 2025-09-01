import { ReportFile } from "@/types/types";
import { toast } from "sonner";

export const fetchReportByUrl = async (url: string): Promise<ReportFile | null> => {
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error(`Error ${res.status}`);
      const json = await res.json();
      const file: ReportFile = {
        events: Array.isArray(json?.events) ? json.events : [],
        type: json?.type ?? "",
        id: json?.id ?? "",
        timestamp: json?.timestamp ?? "",
        status: json?.status ?? "unknown",
        reportName: json?.reportName ?? ""
      };
      return file;
    } catch (err) {
      console.error(`Error loading report from ${url}:`, err);
      toast.error(`Failed to load report from ${url}`);
      return null;
    }
  };