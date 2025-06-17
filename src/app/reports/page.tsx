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
  const [allReports, setAllReports] = useState<Reports[]>([]);
  const [reportSummaries, setReportSummaries] = useState<{
    [testCaseId: string]: { totalCompleted: number; totalFailed: number; totalReports: number };
  }>({});
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [darkMode, setDarkMode] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  const REPORTS_PER_PAGE = 10;
  const totalPages = Math.ceil(allReports.length / REPORTS_PER_PAGE);
  const paginatedReports = allReports.slice((currentPage - 1) * REPORTS_PER_PAGE, currentPage * REPORTS_PER_PAGE);

  useEffect(() => {
    const fetchReports = async () => {
      try {
        const url = `${String(URL_API_ALB)}/getReports`;
        const response = await fetch(url, {
          method: "GET",
          headers: { "Content-Type": "application/json" },
        });

        const data: ReportItem[] = await response.json();

        const summaries: { [key: string]: { totalCompleted: number; totalFailed: number; totalReports: number } } = {};
        const reportsWithData: Reports[] = [];

        for (const { testCaseId, urlReport } of data) {
          try {
            const res = await fetch(urlReport);
            if (!res.ok) throw new Error(`Error ${res.status}`);
            const json = await res.json();

            const reports: Event[] = json?.reports || [];
            const latestSteps = reports.map((r: any) => r?.events?.at(-1));
            const totalCompleted = latestSteps.filter((s) => s?.status === "completed").length;
            const totalFailed = latestSteps.filter((s) => s?.status === "failed").length;

            summaries[testCaseId] = {
              totalCompleted,
              totalFailed,
              totalReports: reports.length,
            };

            reportsWithData.push({ testCaseId, reports });
          } catch (err) {
            console.error(`Error loading report for ${testCaseId}:`, err);
            summaries[testCaseId] = { totalCompleted: 0, totalFailed: 0, totalReports: 0 };
            reportsWithData.push({ testCaseId, reports: [] });
          }
        }

        setAllReports(reportsWithData);
        setReportSummaries(summaries);
      } catch (err) {
        console.error(err);
        setError("Error to obtain reports.");
      } finally {
        setLoading(false);
      }
    };

    fetchReports();
  }, []);

  return (
    <DashboardHeader onToggleDarkMode={setDarkMode}>
      <div className="p-6 max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-6 text-primary/80">Historic Reports</h1>

        {loading && (
          <div className="flex flex-col gap-4">{/* ...loading skeletons */}</div>
        )}

        {error && (
          <div className="...text-red-700">Error: {error}</div>
        )}

        {!loading && !error && allReports.length === 0 && (
          <div className="...text-gray-700">No reports found.</div>
        )}

        <div className="space-y-4">
          {paginatedReports.map((reportGroup) => {
            const summary = reportSummaries[reportGroup?.testCaseId];
            return (
              <Disclosure key={reportGroup?.testCaseId}>
                {({ open }) => (
                  <div className="border border-primary/30 rounded-md shadow-sm">
                    <Disclosure.Button className="flex w-full items-center p-2">
                      <div className="flex items-start gap-1">
                        <div className="flex gap-2 items-center border-2 p-0.5 rounded-md border-dotted border-primary/20">
                          <span className="text-xs font-mono tracking-wide text-muted-foreground">
                            Id: {reportGroup?.testCaseId}
                          </span>
                          <CopyToClipboard text={reportGroup?.testCaseId ?? ""} />
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
                      <ChevronUpIcon className={`h-5 w-5 transition-transform duration-300 text-primary ${open ? "rotate-180" : ""}`} />
                    </Disclosure.Button>

                    <Disclosure.Panel className="px-4 py-2 bg-white">
                      <TimestampTabs reports={reportGroup.reports} />
                    </Disclosure.Panel>
                  </div>
                )}
              </Disclosure>
            );
          })}
        </div>

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