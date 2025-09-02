"use client";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { Disclosure, DisclosureButton, DisclosurePanel } from "@headlessui/react";
import { URL_API_ALB } from "@/config";
import { DashboardHeader } from "../Layouts/main";
import { ChevronDownIcon, ChevronUpIcon, FilterIcon, Loader, RefreshCwIcon, SearchIcon, XIcon, CalendarIcon, DownloadIcon } from "lucide-react";
import { toast } from "sonner";
import CopyToClipboard from "../components/CopyToClipboard";
import StepCard from "../components/StepCard";
import { ImageModalWithZoom } from "../components/Report";
import { StepData } from "@/types/types";
import { SearchField } from "../components/SearchField";
import TextInputWithClearButton from "../components/InputClear";
import { useTestLocationInformation } from "../hooks/useTestLocationInformation";
import { buildStandaloneHtml } from "@/utils/buildHtmlreport";

type ReportEvent = {
  data: StepData;
  indexStep: number;
  action: string;
  description: string;
  status: string;
  screenshot?: string;
  metadata?: { isHeadless?: boolean };
  isConditional?: boolean;
  time?: string;
  url?: string;
  typeAssert?: string;
  valueToAssert?: string;
  selectorString?: string;
  error?: string;
};

type ReportHeader = {
  id: string;
  name: string;
  description?: string;
  createdAt?: number;
  createdBy?: string;
  updatedAt?: number;
  route?: string;
  groupName?: string;
  moduleName?: string;
  subModuleName?: string;
  tagNames?: string[];
  createdByName?: string;
  updatedByName?: string;
  contextGeneral?: any;
  stepsIds?: string[];
  tagIds?: string[];
};

type ReportManifest = {
  urlReport: string;
  key: string;
  type: string;
  id: string;
  timestamp: string;
  status: "passed" | "failed";
  reportName: string;
  header: ReportHeader[];
};

type ReportIndexApiResponse = Record<string, ReportManifest[]>;

type ReportItem = {
  testCaseId: string;
  urlReport: string;
  status: "passed" | "failed";
  timestamp: string;
  header?: ReportHeader;
};

type ReportFile = {
  events: ReportEvent[];
  type: string;
  id: string;
  timestamp: string;
  status: "passed" | "failed" | string;
  reportName: string;
};

type ReportsByUrl = Record<string, ReportFile>;

type FilterParams = {
  type: string;
  includeHeader: boolean;
  groupId?: string;
  moduleId?: string;
  subModuleId?: string;
  tagIds?: string[];
  tagNames?: string[];
  id?: string;
  name?: string;
  prefix?: string;
  date?: string;
  dateFilter?: "before" | "after" | "between" | "exact";
  date2?: string;
  reportStatus?: "passed" | "failed" | "all";
  reportCustomName?: string;
};

const ensureIsoZ = (s?: string) => {
  if (!s) return s as any;
  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(s)) return s;

  const [date, timeRaw = "00:00"] = s.split("T");
  const timeParts = timeRaw.split(":");
  const hh = (timeParts[0] || "00").padStart(2, "0");
  const mm = (timeParts[1] || "00").padStart(2, "0");
  const ss = (timeParts[2] || "00").padStart(2, "0");
  return `${date}T${hh}:${mm}:${ss}.000Z`;
};

const STATUS_OPTIONS = [
  { label: "All Status", value: "all" },
  { label: "Passed", value: "passed" },
  { label: "Failed", value: "failed" }
];

const DATE_FILTER_OPTIONS = [
  { label: "Before", value: "before" },
  { label: "After", value: "after" },
  { label: "Between", value: "between" },
  { label: "Exact Date", value: "exact" }
];

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
      } catch {
      }
    })
  );
}

function preprocessStepCardHtml(html: string): string {
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

    const imageContainer = card.querySelector('[class*="flex"][class*="justify-center"][class*="mt-4"]');
    // if (imageContainer) {
    //   imageContainer.classList.add('step-image-container');

    //   const imageWrapper = imageContainer.querySelector('[class*="relative"][class*="cursor-pointer"]');
    //   if (imageWrapper) {
    //     imageWrapper.classList.add('step-image-wrapper');

    //     const image = imageWrapper.querySelector('img');
    //     if (image) {
    //       image.classList.add('step-image');
    //     }
    //   }
    // }
  });

  return doc.body.innerHTML;
}

const Reports = () => {
  const [darkMode, setDarkMode] = useState(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const [reportItems, setReportItems] = useState<ReportItem[]>([]);
  const [allReports, setAllReports] = useState<ReportsByUrl>({});
  const loadedReportsRef = useRef<Set<string>>(new Set());
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string>("");

  const containerRefs = useRef<Record<string, HTMLDivElement | null>>({});

  const [showFilters, setShowFilters] = useState(true);
  const [filters, setFilters] = useState<FilterParams>({
    type: "tests-reports",
    includeHeader: true,
    reportStatus: "all",
    dateFilter: "between"
  });

  const {
    tags,
    groups,
    modules,
    submodules,
    selectedTag,
    setSelectedTag,
    selectedGroup,
    setSelectedGroup,
    selectedModule,
    setSelectedModule,
    selectedSubmodule,
    setSelectedSubmodule,
    isLoadingTags,
    isLoadingGroups,
    isLoadingModules,
    isLoadingSubmodules,
    errorGroups,
    errorModules,
    getSelectedTagId,
    getSelectedGroupId,
    getSelectedModuleId,
    getSelectedSubmoduleId
  } = useTestLocationInformation();


  const handleFilterChange = (key: keyof FilterParams, value: any) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const activeFiltersCount = Object.entries(filters).filter(([key, value]) => {
    const ignore = key === "type" || key === "includeHeader" || key === "dateFilter";
    const empty =
      value === "" ||
      value === null ||
      value === undefined ||
      value === "all" ||
      (Array.isArray(value) && value.length === 0);
    return !ignore && !empty;
  }).length;

  const fetchReportList = useCallback(
    async (filtersToUse: FilterParams) => {
      setLoading(true);
      setError(null);

      try {
        const url = `${String(URL_API_ALB)}getReports`;

        const locationFilters: Partial<FilterParams> = {};
        const tagId = getSelectedTagId();
        const groupId = getSelectedGroupId();
        const moduleId = getSelectedModuleId();
        const subModuleId = getSelectedSubmoduleId();

        if (tagId) locationFilters.tagIds = [tagId];
        if (groupId) locationFilters.groupId = groupId;
        if (moduleId) locationFilters.moduleId = moduleId;
        if (subModuleId) locationFilters.subModuleId = subModuleId;

        const cleanFilters = Object.entries({ ...filtersToUse, ...locationFilters }).reduce((acc, [k, v]) => {
          if (v !== "" && v !== null && v !== undefined && !(Array.isArray(v) && v.length === 0) && v !== "all") {
            (acc as any)[k] = v;
          }
          return acc;
        }, {} as Partial<FilterParams>);

        cleanFilters.includeHeader = true;

        if (!cleanFilters.date) delete cleanFilters.dateFilter;
        if (cleanFilters.date) cleanFilters.date = ensureIsoZ(cleanFilters.date);
        if (cleanFilters.date2) cleanFilters.date2 = ensureIsoZ(cleanFilters.date2);

        if (cleanFilters.tagIds) {
          cleanFilters.tagIds = cleanFilters.tagIds.map((tag: string) => {
            const tagId = tags.find((t) => t.name === tag)?.id;
            return tagId || tag;
          });
        }

        const res = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(cleanFilters),
        });

        const data: ReportIndexApiResponse = await res.json();

        const flat: ReportItem[] = Object.entries(data).flatMap(([testCaseId, manifests]) =>
          manifests.map((m) => {
            const headerVal = Array.isArray(m.header) ? m.header[0] : m.header;
            return {
              testCaseId,
              urlReport: m.urlReport,
              status: m.status,
              timestamp: m.timestamp,
              header: headerVal,
            };
          })
        );

        flat.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
        setReportItems(flat);
      } catch (err) {
        console.error(err);
        setError("Failed to load reports.");
      } finally {
        setLoading(false);
      }
    },
    [getSelectedTagId, getSelectedGroupId, getSelectedModuleId, getSelectedSubmoduleId, tags]
  );

  const fetchReportByUrl = async (url: string): Promise<ReportFile | null> => {
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

  const handleOpenReport = async (urlReport: string) => {
    if (loadedReportsRef.current.has(urlReport)) return;
    loadedReportsRef.current.add(urlReport);

    const file = await fetchReportByUrl(urlReport);
    if (!file) return;
    setAllReports((prev) => ({ ...prev, [urlReport]: file }));
  };

  const handleImageClick = (image: string) => {
    setSelectedImage(image);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedImage("");
  };

  const downloadRenderedHtml = useCallback(
    async (reportName: string, file: ReportFile, urlReport: string, header?: any) => {
      console.log("header to download", header);

      const hostEl = containerRefs.current[urlReport];
      if (!hostEl) {
        toast.error("Nothing to export for this report");
        return;
      }
      console.log("header to export", header);

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
        `, header
      });

      const niceName = `${(reportName || "report").replace(/\s+/g, "-")}-${new Date().toISOString().slice(0, 19).replace(/[:T]/g, "-")}`;
      downloadStringAsHtml(html, `${niceName}.html`);
      toast.success("HTML report downloaded");
    },
    []
  );

  const applyFilters = async () => {
    setLoading(true);
    setAllReports({});
    loadedReportsRef.current = new Set();

    await fetchReportList(filters);
    setLoading(false);
  };

  const resetFilters = useCallback(() => {
    setFilters({
      type: "tests-reports",
      includeHeader: true,
      reportStatus: "all",
      dateFilter: "between",
    });

    setSelectedTag("");
    setSelectedGroup("");
    setSelectedModule("");
    setSelectedSubmodule("");

    setAllReports({});
    loadedReportsRef.current = new Set();
  }, [setSelectedTag, setSelectedGroup, setSelectedModule, setSelectedSubmodule]);

  return (
    <DashboardHeader onDarkModeChange={setDarkMode}>
      <div className="p-6 w-full lg:w-2/3 mx-auto">
        <h1 className="text-3xl font-bold mb-6 text-primary/80 text-center">Historic Reports</h1>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
          <div className="px-6 py-4 border-b border-gray-200">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2 text-gray-700 hover:text-gray-900 font-medium"
            >
              <FilterIcon className="h-5 w-5" />
              Filters
              {activeFiltersCount > 0 && (
                <span className="bg-primary/90 text-white text-xs px-2 py-1 rounded-full font-semibold">
                  {activeFiltersCount}
                </span>
              )}
              <ChevronDownIcon className={`h-4 w-4 transition-transform ${showFilters ? "rotate-180" : ""}`} />
            </button>
          </div>

          {showFilters && (
            <div className="p-6 space-y-6">
              <div className="flex flex-col gap-4">
                <TextInputWithClearButton
                  id="search-name"
                  label="Search by Name"
                  placeholder="Enter report name..."
                  value={filters.name || ""}
                  onChangeHandler={(e) => handleFilterChange("name", e.target.value)}
                  isSearch={true}
                />

                <SearchField
                  label="Status"
                  value={filters.reportStatus ?? "all"}
                  onChange={(val: string) => handleFilterChange("reportStatus", val)}
                  placeholder="Status"
                  className="w-full"
                  options={STATUS_OPTIONS}
                />
              </div>


              <SearchField
                label="Search Test by tags"
                value={selectedTag}
                onChange={setSelectedTag}
                placeholder="Search by tags..."
                className="w-full"
                options={tags?.map((tag: any) => ({ label: String(tag?.name), value: String(tag?.name) }))}
              />


              <SearchField
                key={`groups-${groups?.length ?? 0}`}
                label="Search Test by groups"
                value={selectedGroup}
                onChange={setSelectedGroup}
                placeholder="Search by groups..."
                className="w-full"
                disabled={isLoadingGroups || errorGroups}
                options={groups?.map((group: any) => ({ label: String(group?.name), value: String(group?.name) }))}
              />

              <SearchField
                label="Search Test by modules"
                value={selectedModule}
                onChange={setSelectedModule}
                placeholder="Search by modules..."
                className="w-full"
                disabled={!selectedGroup || modules.length === 0 || isLoadingModules || errorModules}
                options={modules?.map((module: any) => ({ label: String(module?.name), value: String(module?.name) }))}
              />

              {isLoadingSubmodules ? (
                <div className="flex items-center gap-2">
                  <Loader className="h-5 w-5 text-primary/80 animate-spin" />
                  <span className="text-primary/80">Loading submodules...</span>
                </div>
              ) : (
                <>
                  <SearchField
                    label="Search Test by submodules"
                    value={selectedSubmodule}
                    onChange={setSelectedSubmodule}
                    placeholder="Search by submodules..."
                    className="w-full"
                    disabled={!selectedModule || submodules.length === 0 || isLoadingSubmodules}
                    options={submodules?.map((sub: any) => ({ label: String(sub?.name), value: String(sub?.name) }))}
                  />
                </>
              )}

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <CalendarIcon className="inline h-4 w-4 mr-1" />
                    Date Filter
                  </label>

                  <SearchField
                    label="Date Filter"
                    value={filters.dateFilter ?? "between"}
                    onChange={(val: string) => handleFilterChange("dateFilter", val)}
                    options={DATE_FILTER_OPTIONS}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-md">
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">
                      {filters.dateFilter === "exact" ? "Date" : "From Date"}
                    </label>
                    <input
                      type="datetime-local"
                      className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 w-full"
                      value={filters.date || ""}
                      onChange={(e) => handleFilterChange("date", e.target.value)}
                    />
                  </div>

                  {filters.dateFilter === "between" && (
                    <div>
                      <label className="block text-sm text-gray-600 mb-1">To Date</label>
                      <input
                        type="datetime-local"
                        className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 w-full"
                        value={filters.date2 || ""}
                        onChange={(e) => handleFilterChange("date2", e.target.value)}
                      />
                    </div>
                  )}
                </div>
              </div>

              <div className="flex gap-3 pt-4 border-t border-gray-200">
                <button
                  onClick={applyFilters}
                  className="flex cursor-pointer items-center gap-2 px-4 py-2 bg-primary/90 text-white rounded-md hover:bg-primary/80 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? <RefreshCwIcon className="h-4 w-4 animate-spin" /> : <SearchIcon className="h-4 w-4" />}
                  {loading ? "Applying..." : "Apply Filters"}
                </button>

                <button
                  onClick={resetFilters}
                  className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
                >
                  <XIcon className="h-4 w-4" />
                  Reset
                </button>
              </div>
            </div>
          )}
        </div>

        {error && !loading && <div className="text-sm text-red-600 mb-4">{error}</div>}

        {reportItems.length === 0 && !loading && !error && (
          <div className="text-center text-gray-500">No reports found.</div>
        )}

        {reportItems.length > 0 && !loading && !error && (
          <div className="text-sm text-gray-500 mb-4">
            {reportItems.length} report{reportItems.length > 1 ? "s" : ""} found.
          </div>
        )}

        {reportItems.map(({ testCaseId, header, urlReport, status, timestamp }) => {
          const file = allReports[urlReport];
          console.log("header to show", header);

          return (
            <Disclosure key={urlReport}>
              {({ open }) => (
                <div
                  className={`rounded-md shadow-sm mb-4 ${status === "passed" ? "border-l-4 border-green-500" : "border-l-4 border-red-500"
                    }`}
                >
                  <DisclosureButton
                    onClick={() => handleOpenReport(urlReport)}
                    className="flex w-full justify-between items-center px-4 py-3 font-medium bg-primary/5"
                  >
                    <div className="w-full flex justify-between items-center gap-4">
                      <div className="flex flex-col items-start gap-1">
                        <div className="flex gap-2 items-center border-2 p-0.5 rounded-md border-dotted border-primary/20">
                          <span className="text-xs font-mono tracking-wide text-muted-foreground">Id: {testCaseId}</span>
                          <CopyToClipboard text={testCaseId} isDarkMode={darkMode} />
                        </div>

                        {header && <span className="text-sm text-gray-600">{header.name}</span>}

                        <div className="flex flex-wrap gap-2">
                          {header?.groupName && (
                            <span className="text-xs bg-primary/70 text-white p-1 rounded-md">{header.groupName}</span>
                          )}
                          {header?.moduleName && (
                            <span className="text-xs bg-primary/50 text-white p-1 rounded-md">{header.moduleName}</span>
                          )}
                          {header?.subModuleName && (
                            <span className="text-xs bg-primary/20 text-primary p-1 rounded-md">{header.subModuleName}</span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-3 ">
                        <div className="text-xs text-gray-500">{new Date(timestamp).toLocaleString()}</div>
                        <ChevronUpIcon
                          className={`h-5 w-5 transition-transform duration-300 text-primary ${open ? "rotate-180" : ""
                            }`}
                        />
                      </div>
                    </div>
                  </DisclosureButton>

                  <DisclosurePanel className="px-4 py-3 bg-white">
                    {!file ? (
                      <div className="w-full flex flex-col gap-4">
                        {[...Array(3)].map((_, i) => (
                          <div
                            key={i}
                            className="flex items-center gap-4 rounded-lg border border-primary/10 shadow-sm p-4 bg-white animate-pulse"
                          >
                            <div className="flex-1">
                              <div className="h-6 bg-primary/10 rounded w-2/3 mb-2"></div>
                              <div className="h-4 bg-primary/10 rounded w-1/2"></div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="flex flex-col gap-4">
                        {file?.events && file?.events?.length > 0 && (
                          <div className="flex justify-end px-4">
                            <button
                              onClick={() => downloadRenderedHtml(file.reportName || testCaseId, file, urlReport, header)}
                              className="mb-4 flex cursor-pointer items-center gap-2 text-xs border-primary/60 border-2 text-primary/60 font-semibold px-3 py-1 rounded hover:shadow-md"
                            >
                              <DownloadIcon size={16} /> HTML Report (Rendered)
                            </button>
                          </div>
                        )}

                        <div
                          ref={(el) => {
                            containerRefs.current[urlReport] = el;
                          }}
                          className="flex flex-col gap-2 max-h-[680px] overflow-y-auto"
                        >
                          {file.events.map((ev, idx) => {
                            const step = {
                              ...ev,
                              time: ev.time !== undefined ? Number(ev.time) : undefined
                            };
                            return (
                              <StepCard
                                key={ev.indexStep}
                                step={step}
                                stepData={ev?.data}
                                index={idx + 1}
                                handleImageClick={handleImageClick}
                              />
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </DisclosurePanel>
                </div>
              )}
            </Disclosure>
          );
        })}
      </div>

      {isModalOpen && (
        <ImageModalWithZoom isOpen={isModalOpen} imageUrl={selectedImage} onClose={handleCloseModal} />
      )}
    </DashboardHeader>
  );
};

export default Reports;