import React, { useEffect, useMemo, useState, useCallback, useRef } from "react";
import { URL_API_ALB } from "@/config";
import { toast } from "sonner";
import { fetchReportByUrl } from "@/utils/fetchReportByUrl";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import StepCard from "../../components/StepCard";
import { ImageModalWithZoom } from "../../components/Report";
import { ExecutionSummary } from "../../components/ExecutionSummary";
import { DownloadIcon } from "lucide-react";
import { buildStandaloneHtml } from "@/utils/buildHtmlreport";

interface Props {
  visible: boolean;
  test: { testCaseId: string;[key: string]: any };
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

export async function downloadRenderedHtml(
  urlKey: string,
  file: ReportFile | undefined,
  containerRefs: React.MutableRefObject<Record<string, HTMLDivElement | null>>
  , header?: any
) {
  const hostEl = await containerRefs.current[urlKey];
  if (!hostEl) {
    toast.error("Nothing to export for this tab");
    return;
  }

  const clone = hostEl.cloneNode(true) as HTMLElement;

  await inlineImages(clone).catch(() => { });

  const preprocessedHtml = preprocessStepCardHtml(clone.outerHTML);

  const html = buildStandaloneHtml({
    file,
    bodyInnerHtml: preprocessedHtml,
    extraHeadHtml: `
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
<style>
body { 
  font-family: Inter, ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif; 
}
</style>
    `, header
  });

  const niceName = `${(file?.reportName ?? "report").replace(/\s+/g, "-")
    }-${new Date().toISOString().slice(0, 19).replace(/[:T]/g, "-")}`;

  downloadStringAsHtml(html, `${niceName}.html`);
  toast.success("HTML downloaded");
}


export async function downloadRenderedPdf(
  urlKey: string,
  file: ReportFile | undefined,
  containerRefs: React.MutableRefObject<Record<string, HTMLDivElement | null>>,
  header?: any
) {
  const hostEl = containerRefs.current[urlKey];
  if (!hostEl) {
    toast.error("Nothing to export for this tab");
    return;
  }

  const clone = hostEl.cloneNode(true) as HTMLElement;
  await inlineImages(clone).catch(() => { });

  const preprocessedHtml = preprocessStepCardHtml(clone.outerHTML);

  const html = buildStandaloneHtml({
    file,
    bodyInnerHtml: preprocessedHtml,
    extraHeadHtml: `
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
<style> body { font-family: Inter, ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif; } </style>
    `,
    header
  });

  const blob = new Blob([html], { type: "text/html" });
  const url = URL.createObjectURL(blob);

  const iframe = document.createElement("iframe");
  iframe.style.position = "fixed";
  iframe.style.right = "0"; iframe.style.bottom = "0";
  iframe.style.width = "0"; iframe.style.height = "0";
  iframe.style.border = "0";
  iframe.src = url;

  const cleanup = () => {
    setTimeout(() => {
      try { document.body.removeChild(iframe); } catch { }
      URL.revokeObjectURL(url);
    }, 1000);
  };

  iframe.onload = async () => {
    try {
      const doc = iframe.contentDocument!;
      const win = iframe.contentWindow!;

      const niceName = `report-${file?.id || urlKey}.pdf`;
      doc.title = niceName;

      if ((doc as any).fonts?.ready) {
        try { await (doc as any).fonts.ready; } catch { }
      }

      const imgs = Array.from(doc.images || []);
      await Promise.all(
        imgs.map(img =>
          img.complete
            ? Promise.resolve()
            : new Promise(res => {
              img.onload = img.onerror = () => res(null);
            })
        )
      );

      await new Promise(r => setTimeout(r, 50));

      win.focus();
      win.print();
      toast.success(`Opening print dialog… choose “Save as PDF” (suggested: ${niceName}).`);
    } catch (e) {
      console.error("Failed to print:", e);
      toast.error("Could not open print dialog");
    } finally {
      cleanup();
    }
  };


  document.body.appendChild(iframe);
}


function downloadStringAsHtml(html: string, filename: string) {
  const blob = new Blob([html], { type: "text/html" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename.endsWith(".html") ? filename : `${filename}.html`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

async function inlineImages(root: HTMLElement) {
  const imgs = Array.from(root.querySelectorAll("img"));
  await Promise.all(
    imgs.map(async (img) => {
      const src = img.getAttribute("src");
      if (!src || src.startsWith("data:")) return;
      try {
        const resp = await fetch(src);
        const blob = await resp.blob();
        const reader = new FileReader();
        const dataUrl: string = await new Promise((resolve, reject) => {
          reader.onloadend = () => resolve(String(reader.result));
          reader.onerror = reject;
          reader.readAsDataURL(blob);
        });
        img.setAttribute("src", dataUrl);
      } catch (error) {
        console.error("Failed to inline image:", error);
      }
    })
  );
}

const preprocessStepCardHtml = (html: string): string => {
  const parser = new DOMParser();
  const doc = parser.parseFromString(`<div>${html}</div>`, 'text/html');

  const stepCards = doc.querySelectorAll('[class*="border-2"], [class*="border-green"], [class*="border-red"]');

  stepCards.forEach((card) => {
    card.classList.add('step-card');

    if (card.classList.toString().includes('border-green-500')) {
      card.classList.add('completed');
    } else if (card.classList.toString().includes('border-red-500')) {
      card.classList.add('failed');
    }

    const stepBadge = card.querySelector('[class*="absolute"][class*="bg-primary"]');
    if (stepBadge) {
      stepBadge.classList.add('step-number-badge');
    }

    const timeElement = card.querySelector('[class*="absolute"][class*="top-2"][class*="right-2"]:not([class*="bg-primary"])');
    if (timeElement) {
      timeElement.classList.add('step-time');
    }

    const mainContent = card.querySelector('p[class*="text-md"][class*="mt-6"]');
    if (mainContent) {
      mainContent.classList.add('step-description');
    }
  });

  return doc.body.innerHTML;
}

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

  const containerRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const [isLoadingIndividualReport, setIsLoadingIndividualReport] = useState(false);
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
            } as ReportItem;
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
        setIsLoadingIndividualReport(true);
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
        setIsLoadingIndividualReport(false);
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

        <Tabs key={"Tabs list test"} value={activeUrl ?? undefined} onValueChange={setActiveUrl}>
          <TabsList className="w-full flex flex-wrap gap-2 pb-1 mb-16 px-4 py-3">
            {items.map((it) => {
              const label = `${new Date(it.timestamp).toLocaleString()}`;
              return (
                <div key={it.urlReport} className="flex flex-col gap-2 justify-center items-center">
                  <TabsTrigger
                    key={it.urlReport}
                    value={it.urlReport}
                    className={`whitespace-nowrap px-4 py-3 bg-white shadow-md border-b-4 data-[state=active]:bg-primary/90 data-[state=active]:text-white max-w-md`}
                  >
                    {label}
                  </TabsTrigger>
                  <span className={`text-center h-1 w-10 rounded-full ${it.status === "passed" ? "bg-green-500" : "bg-red-500"}`}></span>
                </div>
              );
            })}
          </TabsList>

          {items?.map((it) => {
            const file = reportsByUrl[it?.urlReport];

            return (
              <TabsContent key={it?.urlReport} value={it?.urlReport} className="mt-10">
                {file?.events && file?.events?.length > 0 && (
                  <div className="flex justify-end px-4">
                    <button
                      onClick={() => downloadRenderedHtml(it.urlReport, file, containerRefs)}
                      className="mb-4 flex cursor-pointer items-center gap-2 text-xs border-primary/60 border-2 text-primary/60 font-semibold px-3 py-1 rounded hover:shadow-md"
                    >
                      <DownloadIcon size={16} /> HTML Report (Rendered)
                    </button>
                  </div>
                )}

                <div
                  ref={(el) => {
                    containerRefs.current[it.urlReport] = el;
                  }}
                >
                  {isLoadingIndividualReport && (
                    <div className="p-6 flex flex-col justify-center items-center gap-3">
                      <div className="h-10 w-full animate-pulse rounded-md bg-primary/10"></div>
                      <div className="h-12 w-full animate-pulse rounded-md bg-primary/10"></div>
                      <div className="h-16 w-full animate-pulse rounded-md bg-primary/10"></div>
                    </div>
                  )}
                  {file?.events && Array.isArray(file?.events) && file?.events?.length > 0 && (
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

                  {file && (!file?.events || file?.events?.length === 0) && (
                    <div className="rounded-md border p-3 bg-muted/30 text-sm text-muted-foreground">No events in this report.</div>
                  )}
                </div>
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