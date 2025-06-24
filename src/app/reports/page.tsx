"use client";
import React, { useEffect, useState } from "react";
import { Dialog, Disclosure } from "@headlessui/react";
import { URL_API_ALB } from "@/config";
import { DashboardHeader } from "../Layouts/main";
import { ChevronUpIcon } from "lucide-react";
import { TimestampTabs } from "../components/TimestampTabs";
import { toast } from "sonner";
import CopyToClipboard from "../components/CopyToClipboard";
import { SummaryDonutChart } from "../components/SummaryDonutChart";
import { useRef } from "react";

type Event = {
  indexStep: number;
  action: string;
  description: string;
  status: string;
  screenshot: string;
  metadata?: {
    isHeadless?: boolean;
  };
  isConditional?: boolean;
  time: string;
};

type ReportItem = {
  testCaseId: string;
  urlReport: string;
};

type Reports = {
  testCaseId: string;
  reports: Event[];
};


const Reports = () => {
  const [darkMode, setDarkMode] = useState(false);
  const [reportItems, setReportItems] = useState<ReportItem[]>([]);
  const [reportSummaries, setReportSummaries] = useState<{ [id: string]: any }>({});
  const [allReports, setAllReports] = useState<{ [id: string]: Event[] }>({});
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  const REPORTS_PER_PAGE = 10;
  const totalPages = Math.max(1, Math.ceil(reportItems.length / REPORTS_PER_PAGE));
  const currentItems = reportItems.slice((currentPage - 1) * REPORTS_PER_PAGE, currentPage * REPORTS_PER_PAGE);


  const loadedReportsRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    const fetchReportList = async () => {
      try {
        const url = `${String(URL_API_ALB)}/getReports`;
        const res = await fetch(url);
        const data: ReportItem[] = await res.json();
        setReportItems(data);
      } catch (err) {
        console.error(err);
        setError("Failed to load report list.");
      } finally {
        setLoading(false);
      }
    };
    fetchReportList();
  }, []);

  useEffect(() => {
    const fetchReportsForPage = async () => {
      setLoading(true);

      const summaries: typeof reportSummaries = {};
      const reportsToAdd: { [id: string]: Event[] } = {};

      for (const { testCaseId, urlReport } of currentItems) {
        if (loadedReportsRef.current.has(testCaseId)) {
          if (!reportSummaries[testCaseId]) {
            const existingEvents = allReports[testCaseId] || [];
            const totalCompleted = existingEvents.filter(e => e?.status === "completed").length;
            const totalFailed = existingEvents.filter(e => e?.status === "failed").length;
            summaries[testCaseId] = {
              totalCompleted,
              totalFailed,
              totalReports: existingEvents.length,
            };
          }
          continue;
        }

        try {
          const res = await fetch(urlReport);
          if (!res.ok) throw new Error(`Error ${res.status}`);
          const json = await res.json();
          const events: Event[] = json?.reports || [];

          const latestSteps = events.map((r: any) => r?.events?.at(-1));

          const totalCompleted = latestSteps.filter((s) => s?.status === "completed").length;
          const totalFailed = latestSteps.filter((s) => s?.status === "failed").length;


          summaries[testCaseId] = {
            totalCompleted,
            totalFailed,
            totalReports: events.length,
          };

          reportsToAdd[testCaseId] = events;
          loadedReportsRef.current.add(testCaseId);
        } catch (err) {
          console.error(`Error loading report for ${testCaseId}:`, err);
          summaries[testCaseId] = { totalCompleted: 0, totalFailed: 0, totalReports: 0 };
          reportsToAdd[testCaseId] = [];
          loadedReportsRef.current.add(testCaseId);
        }
      }

      if (Object.keys(summaries).length > 0) {
        setReportSummaries(prev => ({ ...prev, ...summaries }));
      }

      if (Object.keys(reportsToAdd).length > 0) {
        setAllReports(prev => ({ ...prev, ...reportsToAdd }));
      }

      setLoading(false);
    };

    if (currentItems.length > 0) {
      fetchReportsForPage();
    }
  }, [currentItems]);

  return (
    <DashboardHeader onToggleDarkMode={setDarkMode}>
      <div className="p-6 max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-6 text-primary/80">Historic Reports</h1>

        {loading && (
          <div className="flex flex-col gap-4">
            {[...Array(3)].map((_, i) => (
              <div
                key={i}
                className="flex items-center gap-4 rounded-lg border border-primary/10 shadow-sm p-4 bg-white animate-pulse"
              >
                <div className="flex-1">
                  <div className="h-6 bg-primary/10 rounded w-2/3 mb-2"></div>
                  <div className="h-4 bg-primary/10 rounded w-1/2"></div>
                </div>
                <div className="w-7 h-7 rounded-full border-4 border-primary/10 border-t-primary/40 animate-spin"></div>
              </div>
            ))}
          </div>
        )}

        {error && (
          <div className="p-4 mb-4 bg-red-50 border border-red-200 text-red-700 rounded-md">
            Error: {error}
          </div>
        )}
        {currentItems?.map(({ testCaseId }) => {
          const reports = allReports[testCaseId] || [];
          const summary = reportSummaries[testCaseId];

          return (
            <Disclosure key={testCaseId}>
              {({ open }) => (
                <div className="border border-primary/30 rounded-md shadow-sm">
                  <Disclosure.Button className="flex w-full justify-between items-center px-4 py-3 font-medium bg-primary/5">
                    <div className="flex flex-col items-start gap-1">
                      <div className="flex gap-2 items-center border-2 p-0.5 rounded-md border-dotted border-primary/20">
                        <span className="text-xs font-mono tracking-wide text-muted-foreground">
                          Id: {testCaseId}
                        </span>
                        <CopyToClipboard text={testCaseId} />
                      </div>
                    </div>

                    {summary && (
                      <div className="ml-auto mr-3">
                        <SummaryDonutChart
                          completed={summary?.totalCompleted}
                          failed={summary?.totalFailed}
                          total={summary?.totalReports}
                        />
                      </div>
                    )}

                    <ChevronUpIcon
                      className={`h-5 w-5 transition-transform duration-300 text-primary ${open ? "rotate-180" : ""}`}
                    />
                  </Disclosure.Button>

                  <Disclosure.Panel className="px-4 py-2 bg-white">
                    <TimestampTabs reports={reports} />
                  </Disclosure.Panel>
                </div>
              )}
            </Disclosure>
          );
        })}


        {totalPages > 1 && (
          <div className="flex justify-center items-center gap-4 mt-6">
            <button
              onClick={() => setCurrentPage(p => Math.max(p - 1, 1))}
              disabled={currentPage === 1}
              className="px-4 py-2 bg-primary/20 text-primary rounded hover:bg-primary/30 disabled:opacity-50"
            >
              Previous
            </button>
            <span className="text-sm text-primary/80">
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="px-4 py-2 bg-primary/20 text-primary rounded hover:bg-primary/30 disabled:opacity-50"
            >
              Next
            </button>
          </div>
        )}
      </div>
    </DashboardHeader>
  );
};

export default Reports;