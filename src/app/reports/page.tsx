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

  useEffect(() => {
    const fetchReports = async () => {
      try {
        const url = `${String(URL_API_ALB)}dev/getReports`;
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

            const latestSteps = reports?.map((r: any) => r?.events?.at(-1));
            const totalCompleted = latestSteps?.filter((s) => s?.status === "completed").length;
            const totalFailed = latestSteps?.filter((s) => s?.status === "failed").length;

            summaries[testCaseId] = {
              totalCompleted,
              totalFailed,
              totalReports: reports?.length,
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
          <div className="flex items-center gap-3 p-4 mb-4 bg-red-50 border border-red-200 text-red-700 rounded-md">
            <svg
              className="w-6 h-6 shrink-0 text-red-500"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.054 0 1.64-1.14 1.077-2.045L13.077 4.954c-.527-.899-1.827-.899-2.354 0L4.005 16.955C3.442 17.86 4.028 19 5.082 19z"
              />
            </svg>
            <span className="text-sm font-medium">{error}</span>
          </div>
        )}

        {!loading && !error && allReports.length === 0 && (
          <div className="flex items-center gap-3 p-4 mb-4 bg-gray-50 border border-gray-200 text-gray-700 rounded-md">
            <svg
              className="w-6 h-6 shrink-0 text-gray-400"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9 17v-2a4 4 0 00-4-4H5a2 2 0 00-2 2v6h16v-2a4 4 0 00-4-4h-1a4 4 0 00-4 4zM9 7h.01M15 7h.01M12 11h.01"
              />
            </svg>
            <span className="text-sm font-medium">No reports found.</span>
          </div>
        )}


        <div className="space-y-4">
          {allReports.map((reportGroup) => {
            const summary = reportSummaries[reportGroup?.testCaseId];

            return (
              <Disclosure key={reportGroup?.testCaseId}>
                {({ open }) => (
                  <div className="border border-primary/30 rounded-md shadow-sm">
                    <Disclosure.Button className="flex w-full justify-between items-center px-4 py-3 font-medium bg-primary/5 rounded-t-md cursor-pointer">
                      <div className="flex flex-col items-start gap-1">
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

                      <ChevronUpIcon
                        className={`h-5 w-5 transition-transform duration-300 text-primary ${open ? "rotate-180" : ""}`}
                      />
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
      </div>
    </DashboardHeader>
  );
};

export default Reports;



{/* <div className="space-y-4">
          {allReports.map((reportGroup) => (
            <Disclosure key={reportGroup.testCaseId}>
              {({ open }) => (
                <div className="border border-primary/30 rounded-md shadow-sm">
                  <Disclosure.Button className="flex w-full justify-between items-center px-4 py-3 font-medium bg-primary/5 rounded-t-md cursor-pointer">
                    <div className="flex gap-2 items-center border-2 p-0.5 rounded-md border-dotted border-primary/20">
                      <span className="text-xs font-mono tracking-wide text-muted-foreground">
                        Id: {reportGroup.testCaseId}
                      </span>
                      {reportGroup.testCaseId ? (<CopyToClipboard text={reportGroup.testCaseId ?? ''} />) : (toast.error("No ID found"))}
                    </div>

                    <ChevronUpIcon
                      className={`h-5 w-5 transition-transform duration-300 ${open ? "rotate-180" : ""
                        }`}
                    />
                  </Disclosure.Button>
                  <Disclosure.Panel className="px-4 py-2 bg-white">
                    <TimestampTabs
                      reports={reportGroup.reports}
                      onStatusComputed={(summary) => {
                        setReportSummaries((prev) => ({
                          ...prev,
                          [reportGroup.testCaseId]: summary,
                        }));
                      }}
                    />
                  </Disclosure.Panel>
                </div>
              )}
            </Disclosure>
          ))}
        </div> */}