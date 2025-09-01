import React, { useEffect, useMemo, useState, useCallback, useRef } from "react";
import { URL_API_ALB } from "@/config";
import { toast } from "sonner";
import { fetchReportByUrl } from "@/utils/fetchReportByUrl";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import StepCard from "../components/StepCard";
import { ImageModalWithZoom } from "../components/Report"; // mismo import que usas en Reports
import { ExecutionSummary } from "./ExecutionSummary";

interface Props {
  visible: boolean;
  test: { testCaseId: string; [key: string]: any };
  viewMode: string;
}

type ReportItem = {
  testCaseId: string;
  urlReport: string;
  status: string;
  timestamp: string | number;
  header?: any;
};

type ReportFile = {
  events?: any[];
  type?: string;
  id?: string;
  timestamp?: string;
  status?: string;
  reportName?: string;
};

const ReportTestCaseList: React.FC<Props> = ({ test, visible, viewMode }) => {
  const testCaseId = useMemo(() => test?.testCaseId, [test?.testCaseId]);

  const [isLoadingList, setIsLoadingList] = useState(false);
  const [errorList, setErrorList] = useState<string | null>(null);
  const [items, setItems] = useState<ReportItem[]>([]);

  const [reportsByUrl, setReportsByUrl] = useState<Record<string, ReportFile>>({});
  const loadingByUrlRef = useRef<Record<string, boolean>>({});
  const loadedUrlsRef = useRef<Set<string>>(new Set());

  const [activeUrl, setActiveUrl] = useState<string | null>(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string>("");

  const handleImageClick = useCallback((image: string) => {
    setSelectedImage(image);
    setIsModalOpen(true);
  }, []);
  const handleCloseModal = useCallback(() => {
    setIsModalOpen(false);
    setSelectedImage("");
  }, []);

  const fetchReportList = useCallback(async () => {
    if (!testCaseId) return;
    setIsLoadingList(true);
    setErrorList(null);
    try {
      const url = `${String(URL_API_ALB)}getReports`;
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "tests-reports",
          id: testCaseId,
        }),
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const data = await res.json();

      const flat: ReportItem[] = Object.entries<any>(data).flatMap(([tcId, manifests]) => {
        if (Array.isArray(manifests)) {
          return manifests.map((m) => {
            const headerVal = Array.isArray(m.header) ? m.header[0] : m.header;
            return {
              testCaseId: tcId,
              urlReport: m.urlReport,
              status: m.status,
              timestamp: m.timestamp,
              header: headerVal,
            };
          });
        }
        return [];
      });

      flat.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      setItems(flat);
      if (flat.length > 0) setActiveUrl(flat[0].urlReport);
    } catch (err: any) {
      console.error(err);
      setErrorList("Failed to load reports.");
      toast.error("Failed to load reports.");
    } finally {
      setIsLoadingList(false);
    }
  }, [testCaseId]);

  useEffect(() => {
    if (!visible || viewMode !== "Historic reports") return;
    fetchReportList();
  }, [visible, viewMode, fetchReportList]);

  const handleOpenReport = useCallback(
    async (urlReport: string) => {
      if (!urlReport) return;
      if (loadedUrlsRef.current.has(urlReport)) return;
      if (loadingByUrlRef.current[urlReport]) return;

      try {
        loadingByUrlRef.current[urlReport] = true;
        const file = await fetchReportByUrl(urlReport);
        if (!file) {
          toast.error("Don't found report file");
          return;
        }

        setReportsByUrl((prev) => ({ ...prev, [urlReport]: file as ReportFile }));
        loadedUrlsRef.current.add(urlReport);
      } catch (e) {
        console.error(e);
        toast.error("Error loading report");
      } finally {
        loadingByUrlRef.current[urlReport] = false;
      }
    },
    []
  );

  useEffect(() => {
    if (!activeUrl) return;
    if (!loadedUrlsRef.current.has(activeUrl)) {
      handleOpenReport(activeUrl);
    }
  }, [activeUrl, handleOpenReport]);

  if (!visible || viewMode !== "Historic reports") return null;

  if (isLoadingList) {
    return (
      <div className="p-6 flex flex-col justify-center items-center gap-3">
        <svg className="animate-spin h-6 w-6 text-primary" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
        </svg>
        <span className="text-sm text-primary/80 font-medium">Loading reports…</span>
      </div>
    );
  }

  if (errorList) {
    return <div className="p-4 text-red-600 text-sm">{errorList}</div>;
  }

  if (items.length === 0) {
    return <div className="p-4 text-sm text-muted-foreground">No historic reports.</div>;
  }

  return (
    <>
      <div className="w-full flex flex-col max-h-[680px] overflow-y-auto gap-2">

        <div className="px-4 pt-4">
            <ExecutionSummary
            totalSuccess={items.filter((it) => it.status === "passed").length}
            totalFailed={items.filter((it) => it.status === "failed").length}
            totalPending={items.filter((it) => it.status === "pending").length}
        />
        </div>


        <Tabs value={activeUrl ?? undefined} onValueChange={setActiveUrl}>
          <TabsList className="w-full flex flex-wrap gap-2 pb-1 mb-16 px-4 py-3">
            {items.map((it) => {
              const label = `${new Date(it.timestamp).toLocaleString()}`;
              return (
               <div className="flex flex-col gap-2 justify-center items-center">
                 <TabsTrigger key={it.urlReport} value={it.urlReport} className={`whitespace-nowrap px-4 py-3 bg-white shadow-md
                border-b-4 data-[state=active]:bg-primary/90 data-[state=active]:text-white max-w-md
                `}>
                  {label}

                </TabsTrigger>
                <span className={`text-center h-1 w-10 rounded-full ${it.status === "passed" ? "bg-green-500": "bg-red-500"}`}></span>    

               </div>
              );
            })}
          </TabsList>
          {items.map((it) => {
            const isLoadingThis =
              !!loadingByUrlRef.current[it.urlReport] && !reportsByUrl[it.urlReport];
            const file = reportsByUrl[it.urlReport];

            return (
              <TabsContent key={it.urlReport} value={it.urlReport} className="mt-10">

                {!file && !isLoadingThis && (
                  <button
                    className="px-3 py-2 rounded-md text-white bg-primary/90 hover:bg-primary"
                    onClick={() => handleOpenReport(it.urlReport)}
                  >
                    Open report
                  </button>
                )}

                {isLoadingThis && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <svg className="animate-spin h-4 w-4 text-primary" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                    </svg>
                    Loading…
                  </div>
                )}

                {file?.events && Array.isArray(file.events) && file.events.length > 0 && (
                  <div className="flex flex-col gap-4">
                    {file.events.map((ev: any, idx: number) => {
                      const step = {
                        ...ev,
                        time: ev.time !== undefined ? Number(ev.time) : undefined,
                      };
                      return (
                        <StepCard
                          key={ev.indexStep ?? idx}
                          step={step}
                          stepData={ev?.data}
                          index={idx + 1}
                          handleImageClick={handleImageClick}
                        />
                      );
                    })}
                  </div>
                )}

                {file && (!file.events || file.events.length === 0) && (
                  <div className="rounded-md border p-3 bg-muted/30 text-sm text-muted-foreground">
                    No events in this report.
                  </div>
                )}
              </TabsContent>
            );
          })}
        </Tabs>
      </div>

      {isModalOpen && (
        <ImageModalWithZoom isOpen={isModalOpen} imageUrl={selectedImage} onClose={handleCloseModal} />
      )}
    </>
  );
};

export default ReportTestCaseList;