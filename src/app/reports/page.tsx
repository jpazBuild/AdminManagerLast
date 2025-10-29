"use client";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { Disclosure, DisclosureButton, DisclosurePanel } from "@headlessui/react";
import { URL_API_ALB } from "@/config";
import { DashboardHeader } from "../Layouts/main";
import {
  ChevronDownIcon,
  ChevronUpIcon,
  FilterIcon,
  Loader,
  RefreshCwIcon,
  SearchIcon,
  XIcon,
  CalendarIcon,
  DownloadIcon,
} from "lucide-react";
import { toast } from "sonner";
import CopyToClipboard from "../components/CopyToClipboard";
import StepCard from "../components/StepCard";
import { ImageModalWithZoom } from "../components/Report";
import { StepData } from "@/types/types";
import { SearchField } from "../components/SearchField";
import TextInputWithClearButton from "../components/InputClear";
import { useTestLocationInformation } from "../hooks/useTestLocationInformation";
import { buildStandaloneHtml } from "@/utils/buildHtmlreport";
import axios from "axios";
import PaginationResults from "../dashboard/components/PaginationResults";
import { usePagination } from "../hooks/usePagination";
import NoData from "../components/NoData";

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
  { label: "Failed", value: "failed" },
];

const DATE_FILTER_OPTIONS = [
  { label: "Before", value: "before" },
  { label: "After", value: "after" },
  { label: "Between", value: "between" },
  { label: "Exact Date", value: "exact" },
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
      } catch { }
    })
  );
}

function preprocessStepCardHtml(html: string): string {
  const parser = new DOMParser();
  const doc = parser.parseFromString(`<div>${html}</div>`, "text/html");
  const stepCards = doc.querySelectorAll('[class*="border-2"], [class*="border-green"], [class*="border-red"]');
  stepCards.forEach((card) => {
    card.classList.add("step-card");
    if (card.classList.toString().includes("border-green-500")) card.classList.add("completed");
    else if (card.classList.toString().includes("border-red-500")) card.classList.add("failed");
    const stepBadge = card.querySelector('[class*="absolute"][class*="bg-primary"]');
    if (stepBadge) stepBadge.classList.add("step-number-badge");
    const timeElement = card.querySelector('[class*="absolute"][class*="top-2"][class*="right-2"]:not([class*="bg-primary"])');
    if (timeElement) timeElement.classList.add("step-time");
    const mainContent = card.querySelector('p[class*="text-md"][class*="mt-6"]');
    if (mainContent) mainContent.classList.add("step-description");
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
    dateFilter: "between",
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
    getSelectedSubmoduleId,
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

        const res = await axios.post(url, cleanFilters);
        let data: ReportIndexApiResponse;

        if (res?.data?.responseSignedUrl) {
          const urlDataReports = String(res.data.responseSignedUrl);

          const responseReports = await fetch(urlDataReports, { method: "GET" });
          if (!responseReports.ok) {
            throw new Error(`Falló la descarga desde S3: ${responseReports.status} ${responseReports.statusText}`);
          }

          const ct = responseReports.headers.get("content-type") || "";
          const jsonData = ct.includes("application/json")
            ? await responseReports.json()
            : JSON.parse((await responseReports.text()) || "null");

          data = (jsonData ?? {}) as ReportIndexApiResponse;
        } else {
          data = (res?.data ?? {}) as ReportIndexApiResponse;
        }

        const flat: ReportItem[] = Object.entries(data || {}).flatMap(([testCaseId, manifests]) =>
          (manifests || []).map((m: any) => {
            const headerVal = Array.isArray(m?.header) ? m.header[0] : m?.header;
            return {
              testCaseId,
              urlReport: m?.urlReport,
              status: m?.status,
              timestamp: m?.timestamp,
              header: headerVal,
            } as ReportItem;
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
        reportName: json?.reportName ?? "",
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
      const hostEl = containerRefs.current[urlReport];
      if (!hostEl) {
        toast.error("Nothing to export for this report");
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
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">`,
        header,
      });
      const niceName = `${(reportName || "report")
        .replace(/\s+/g, "-")}-${new Date().toISOString().slice(0, 19).replace(/[:T]/g, "-")}`;
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

  const { page, setPage, pageSize, setPageSize, totalItems, items: paginatedSelectedTests } =
    usePagination(reportItems, 10);

  const pageBg = darkMode ? "bg-gray-900 text-gray-100" : "";
  const titleCls = darkMode ? "text-gray-100" : "text-primary/80";
  const cardBase = "rounded-lg shadow-sm border transition-colors";
  const card = darkMode ? `${cardBase} bg-gray-900 border-gray-700` : `${cardBase} bg-white border-gray-200`;
  const cardHeader = darkMode ? "px-6 py-4 border-b border-gray-700" : "px-6 py-4 border-b border-gray-200";
  const toggleFiltersBtn =
    "flex items-center gap-2 cursor-pointer font-medium transition " +
    (darkMode ? "text-gray-200 hover:text-white" : "text-gray-700 hover:text-gray-900");
  // const subtleText = darkMode ? "text-gray-400" : "text-gray-500";
  const disclosureHeader = darkMode ? "bg-gray-800" : "bg-primary/5";
  const disclosureBorderPassed = darkMode ? "border-l-4 border-green-500" : "border-l-4 border-green-500";
  const disclosureBorderFailed = darkMode ? "border-l-4 border-red-500" : "border-l-4 border-red-500";
  const skeletonCard =
    "flex items-center gap-4 rounded-lg p-4 animate-pulse " +
    (darkMode ? "border border-gray-700 bg-gray-900" : "border border-primary/10 bg-white");
  const pillPrimary = darkMode ? "bg-primary/80 text-white" : "bg-primary/70 text-white";
  const pillSecondary = darkMode ? "bg-primary/60 text-white" : "bg-primary/50 text-white";
  const pillTertiary = darkMode ? "bg-primary/20 text-primary" : "bg-primary/20 text-primary";
  // const inputDateCls =
  //   "px-3 py-2 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 w-full border " +
  //   (darkMode ? "bg-gray-900 text-gray-100 border-gray-700 placeholder-gray-500" : "border-gray-300");
  const btnPrimary =
    "cursor-pointer flex items-center gap-2 px-4 py-2 rounded-md disabled:opacity-50 disabled:cursor-not-allowed" +
    (darkMode ? "bg-primary-blue/90 text-white hover:bg-primary-blue/95" : "bg-primary/90 text-white hover:bg-primary/80");
  const btnSecondary =
    "flex items-center gap-2 px-4 py-2 rounded-md border " +
    (darkMode ? "border-gray-600 text-gray-200 hover:bg-gray-800" : "border-gray-300 text-gray-700 hover:bg-gray-50");
  const downloadBtn =
    "mb-4 flex items-center gap-2 text-xs font-semibold px-3 py-1 rounded border-2 " +
    (darkMode
      ? "text-white/70 border-primary/40 hover:border-primary/60 bg-gray-800"
      : "text-primary/60 border-primary/60 hover:shadow-md");

  const subtleText = darkMode ? "text-gray-300" : "text-gray-600";
  const inputDateCls = `
  w-full px-3 py-2 rounded-md border transition
  focus:outline-none focus:ring-2
  ${darkMode
      ? "bg-gray-800 border-gray-700 text-gray-100 placeholder-gray-400 focus:ring-primary/50 focus:border-primary/60"
      : "bg-white border-gray-300 text-gray-800 placeholder-gray-400 focus:ring-primary/60 focus:border-primary/70"}
`.trim();
  return (
    <DashboardHeader onDarkModeChange={setDarkMode}>
      <div className={`p-6 w-full lg:w-2/3 mx-auto ${pageBg}`}>
        <h1 className={`text-3xl font-bold mb-6 text-center ${titleCls}`}>Historic Reports</h1>

        <div className={card}>
          <div className={cardHeader}>
            <button onClick={() => setShowFilters(!showFilters)} className={toggleFiltersBtn}>
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
                  isDarkMode={darkMode}
                />

                <SearchField
                  label="Status"
                  value={filters.reportStatus ?? "all"}
                  onChange={(val: string) => handleFilterChange("reportStatus", val)}
                  placeholder="Status"
                  className="w-full"
                  options={STATUS_OPTIONS}
                  darkMode={darkMode}
                />
              </div>

              <SearchField
                label="Search Test by tags"
                value={selectedTag}
                onChange={setSelectedTag}
                placeholder="Search by tags..."
                className="w-full"
                options={tags?.map((tag: any) => ({ label: String(tag?.name), value: String(tag?.name) }))}
                darkMode={darkMode}
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
                darkMode={darkMode}
              />

              <SearchField
                label="Search Test by modules"
                value={selectedModule}
                onChange={setSelectedModule}
                placeholder="Search by modules..."
                className="w-full"
                disabled={!selectedGroup || modules.length === 0 || isLoadingModules || errorModules}
                options={modules?.map((module: any) => ({ label: String(module?.name), value: String(module?.name) }))}
                darkMode={darkMode}
              />

              {isLoadingSubmodules ? (
                <div className="flex items-center gap-2">
                  <Loader className="h-5 w-5 text-primary/80 animate-spin" />
                  <span className={subtleText}>Loading submodules...</span>
                </div>
              ) : (
                <SearchField
                  label="Search Test by submodules"
                  value={selectedSubmodule}
                  onChange={setSelectedSubmodule}
                  placeholder="Search by submodules..."
                  className="w-full"
                  disabled={!selectedModule || submodules.length === 0 || isLoadingSubmodules}
                  options={submodules?.map((sub: any) => ({ label: String(sub?.name), value: String(sub?.name) }))}
                  darkMode={darkMode}
                />
              )}

              {/* <div className="space-y-4">
                <div>
                  <label className={`block text-sm font-medium mb-2 ${darkMode ? "text-gray-300" : "text-gray-700"}`}>
                    <CalendarIcon className="inline h-4 w-4 mr-1" />
                    Date Filter
                  </label>

                  <SearchField
                    label="Date Filter"
                    value={filters.dateFilter ?? "between"}
                    onChange={(val: string) => handleFilterChange("dateFilter", val)}
                    options={DATE_FILTER_OPTIONS}
                    darkMode={darkMode}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-md">
                  <div>
                    <label className={`block text-sm mb-1 ${subtleText}`}>
                      {filters.dateFilter === "exact" ? "Date" : "From Date"}
                    </label>
                    <input
                      type="datetime-local"
                      className={inputDateCls}
                      value={filters.date || ""}
                      onChange={(e) => handleFilterChange("date", e.target.value)}

                    />
                  </div>

                  {filters.dateFilter === "between" && (
                    <div>
                      <label className={`block text-sm mb-1 ${subtleText}`}>To Date</label>
                      <input
                        type="datetime-local"
                        className={inputDateCls}
                        value={filters.date2 || ""}
                        onChange={(e) => handleFilterChange("date2", e.target.value)}
                      />
                    </div>
                  )}
                </div>
              </div> */}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-md">
                <div>
                  <label className={`block text-sm mb-1 ${subtleText}`}>
                    {filters.dateFilter === "exact" ? "Date" : "From Date"}
                  </label>
                  <input
                    type="datetime-local"
                    className={inputDateCls + (darkMode ? " dm" : "")}
                    value={filters.date || ""}
                    onChange={(e) => handleFilterChange("date", e.target.value)}
                  />
                </div>

                {filters.dateFilter === "between" && (
                  <div>
                    <label className={`block text-sm mb-1 ${subtleText}`}>To Date</label>
                    <input
                      type="datetime-local"
                      className={inputDateCls + (darkMode ? " dm" : "")}
                      value={filters.date2 || ""}
                      onChange={(e) => handleFilterChange("date2", e.target.value)}
                    />
                  </div>
                )}
              </div>

              <style jsx global>{`
                input.dm[type="datetime-local"]::-webkit-calendar-picker-indicator {
                  filter: invert(1) opacity(0.8);
                }
              `}</style>

              <div className={`flex gap-3 pt-4 ${darkMode ? "border-t border-gray-700" : "border-t border-gray-200"}`}>
                <button onClick={applyFilters} className={`${darkMode ? "bg-primary-blue/90 hover:bg-primary-blue/95 text-white" : "bg-primary/90 hover:bg-primary/80 text-white"} flex gap-1 items-center font-semibold rounded-md px-4 py-1.5 disabled::cursor-not-allowed disabled:opacity-50`}>
                  {loading ? <RefreshCwIcon className="h-4 w-4 animate-spin" /> : <SearchIcon className="h-4 w-4" />}
                  {loading ? "Applying..." : "Apply Filters"}
                </button>

                <button onClick={resetFilters} className={btnSecondary}>
                  <XIcon className="h-4 w-4" />
                  Reset
                </button>
              </div>
            </div>
          )}
        </div>

        {error && !loading && (
          <div className={`text-sm mb-4 ${darkMode ? "text-rose-400" : "text-red-600"}`}>{error}</div>
        )}

        {reportItems.length === 0 && !loading && !error && (
          <NoData text="No reports found with the current filters." darkMode={darkMode} />
        )}

        {reportItems.length > 0 && !loading && !error && (
          <div className={`text-sm mb-4 ${subtleText}`}>
            {reportItems.length} report{reportItems.length > 1 ? "s" : ""} found.
          </div>
        )}
        {paginatedSelectedTests.length > 0 && !loading && (
          <PaginationResults
            totalItems={totalItems}
            pageSize={pageSize}
            setPageSize={setPageSize}
            page={page}
            setPage={setPage}
            darkMode={darkMode}
          />

        )}

        {loading && (
          <div className="flex flex-col w-full gap-2 mt-10">
            <div className={`w-full h-20 rounded-md ${darkMode ? "bg-gray-800" : "bg-gray-200"} animate-pulse`}></div>
            <div className={`w-full h-20 rounded-md ${darkMode ? "bg-gray-800" : "bg-gray-200"} animate-pulse`}></div>
            <div className={`w-full h-20 rounded-md ${darkMode ? "bg-gray-800" : "bg-gray-200"} animate-pulse`}></div>

          </div>
        )}

        {!loading && paginatedSelectedTests.map(({ testCaseId, header, urlReport, status, timestamp }) => {
          const file = allReports[urlReport];
          return (
            <Disclosure key={urlReport}>
              {({ open }) => (
                <div className={`${status === "passed" ? disclosureBorderPassed : disclosureBorderFailed} ${card} mb-4`}>
                  <DisclosureButton
                    onClick={() => handleOpenReport(urlReport)}
                    className={`flex w-full justify-between items-center px-4 py-3 font-medium ${disclosureHeader}`}
                  >
                    <div className="w-full flex justify-between items-center gap-4">
                      <div className="flex flex-col items-start gap-1">
                        <div
                          className={`flex gap-2 items-center p-0.5 rounded-md border-dotted ${darkMode ? "border-gray-600" : "border-primary/20"
                            } border-2`}
                        >
                          <span className={`text-xs font-mono tracking-wide ${subtleText}`}>
                            Id: {testCaseId}
                          </span>
                          <CopyToClipboard text={testCaseId} isDarkMode={darkMode} />
                        </div>

                        {header && (
                          <span className={`text-sm ${darkMode ? "text-gray-300" : "text-gray-600"}`}>
                            {header.name}
                          </span>
                        )}

                        <div className="flex flex-wrap gap-2">
                          {header?.groupName && (
                            <span className={`text-xs p-1 rounded-md ${pillPrimary}`}>{header.groupName}</span>
                          )}
                          {header?.moduleName && (
                            <span className={`text-xs p-1 rounded-md ${pillSecondary}`}>{header.moduleName}</span>
                          )}
                          {header?.subModuleName && (
                            <span className={`text-xs p-1 rounded-md ${pillTertiary}`}>{header.subModuleName}</span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className={`text-xs ${subtleText}`}>{new Date(timestamp).toLocaleString()}</div>
                        <ChevronUpIcon
                          className={`h-5 w-5 transition-transform duration-300 ${darkMode ? "text-white/90":"text-primary"} ${open ? "rotate-180" : ""}`}
                        />
                      </div>
                    </div>
                  </DisclosureButton>

                  <DisclosurePanel className="px-4 py-3">
                    {!file ? (
                      <div className="w-full flex flex-col gap-4">
                        {[...Array(3)].map((_, i) => (
                          <div key={i} className={skeletonCard}>
                            <div className="flex-1">
                              <div className={`h-6 rounded w-2/3 mb-2 ${darkMode ? "bg-gray-700" : "bg-primary/10"}`}></div>
                              <div className={`h-4 rounded w-1/2 ${darkMode ? "bg-gray-700" : "bg-primary/10"}`}></div>
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
                              className={downloadBtn}
                            >
                              <DownloadIcon size={16} /> HTML Report (Rendered)
                            </button>
                          </div>
                        )}

                        <div
                          ref={(el) => {
                            containerRefs.current[urlReport] = el;
                          }}
                          className={`flex flex-col gap-2 max-h-[680px] overflow-y-auto ${darkMode ? "scrollbar-thumb-gray-700" : ""}`}
                        >
                          {file.events.map((ev, idx) => {
                            const step = { ...ev, time: ev.time !== undefined ? Number(ev.time) : undefined };
                            return (
                              <StepCard
                                key={ev.indexStep}
                                step={step}
                                stepData={ev?.data}
                                index={idx + 1}
                                handleImageClick={handleImageClick}
                                darkMode={darkMode}
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

        {isModalOpen && (
          <ImageModalWithZoom isOpen={isModalOpen} imageUrl={selectedImage} onClose={handleCloseModal} />
        )}
      </div>
    </DashboardHeader>
  );
};

export default Reports;