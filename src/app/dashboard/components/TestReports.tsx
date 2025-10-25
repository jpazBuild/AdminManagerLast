import { useCallback, useEffect, useMemo, useRef, useState, useTransition } from "react";
import { Card, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { FaChevronDown, FaChevronUp } from "react-icons/fa";
import ReportUI from "../../components/Report";
import { useTestExecution } from "../../hooks/useTestExecution";
import { StopCircle, Download as DownloadIcon, Play } from "lucide-react";
import { handleDownloadHTMLReport } from "../../hooks/HTMLReport";
import { ExecutionSummary } from "../../components/ExecutionSummary";
import { downloadRenderedHtml, downloadRenderedPdf } from "./ReportsHistoricTestCaseList";
import { flushSync } from "react-dom";
import CopyToClipboard from "@/app/components/CopyToClipboard";
import PaginationResults from "./PaginationResults";
import { usePagination } from "@/app/hooks/usePagination";
import EmptyStateSelectAnimation from "./EmptyStateSelectAnimation";

type FilterKey = "all" | "success" | "failed" | "pending";

type TestReportsProps = {
  reports: any[];
  setLoading: any;
  progress: any[];
  selectedTest: any;
  testData: Record<string, any>;
  stopped: Record<string, boolean>;
  setStopped: any;
  onPlayTest: (test: any) => void;
  loading: Record<string, boolean>;
  onRunAll?: () => void;
  onRunPending?: (pendingTests: any[]) => void;
  idReports?: string[];
  selectedCases?: any[];
  darkMode?: boolean;
  stopAll?: any;
}

const TestReports = ({ reports, setLoading, progress, selectedTest, testData, stopped, setStopped, onPlayTest, loading, onRunAll, onRunPending, stopAll }: TestReportsProps) => {
  const [expandedReports, setExpandedReports] = useState<Record<string, boolean>>({});
  const [filter, setFilter] = useState<FilterKey>("all");
  const { stopTest } = useTestExecution();
  const stepMap: Record<string, { connectionId: string; steps: Record<number, any> }> = {};
  const containerRefs = useRef<Record<string, HTMLDivElement | null>>({});

  reports.forEach((report: any) => {
    const testCaseId = report.testCaseId || report.id;
    const data = Array.isArray(report.data) ? report.data : [];
    const connectionId = report.connectionId ?? "";

    if (!stepMap[testCaseId]) {
      stepMap[testCaseId] = { connectionId, steps: {} };
    }

    data.forEach((step: any) => {
      const indexStep = step.indexStep ?? step.index ?? null;
      if (typeof indexStep !== "number") return;
      stepMap[testCaseId].steps[indexStep] = step;
    });
  });

  const steps: { indexStep: number; ev: any; reportId: string; connectionId: string }[] = [];
  Object.entries(stepMap).forEach(([testCaseId, { steps: indexedSteps, connectionId }]) => {
    Object.entries(indexedSteps).forEach(([index, step]) => {
      steps.push({
        indexStep: Number(index),
        ev: step,
        reportId: testCaseId,
        connectionId,
      });
    });
  });
  steps.sort((a, b) => (a.reportId === b.reportId ? a.indexStep - b.indexStep : a.reportId.localeCompare(b.reportId)));

  const toggleReport = (reportId: string) => {
    setExpandedReports((prev) => ({ ...prev, [reportId]: !prev[reportId] }));
  };

  const getLatestFor = (id: string) => steps.filter((s) => s.reportId === id).at(-1);
  const getStatusFor = (test: any): "success" | "failed" | "pending" => {
    const id = test.id || test.testCaseId;
    const latest = getLatestFor(id);
    const status = latest?.ev?.status || latest?.ev?.finalStatus || "processing";
    if (stopped[id]) return "pending";
    if (latest?.ev?.action === "Test execution completed" && status === "completed") return "success";
    if (latest?.ev?.action === "Test execution failed" && status === "failed") return "failed";
    return "pending";
  };

  const { successList, failedList, pendingList } = useMemo(() => {
    const succ: any[] = [];
    const fail: any[] = [];
    const pend: any[] = [];
    selectedTest.forEach((t: any) => {
      const st = getStatusFor(t);
      if (st === "success") succ.push(t);
      else if (st === "failed") fail.push(t);
      else pend.push(t);
    });
    return { successList: succ, failedList: fail, pendingList: pend };
  }, [selectedTest, steps, stopped]);

  const filtered = useMemo(() => {
    if (filter === "success") return successList;
    if (filter === "failed") return failedList;
    if (filter === "pending") return pendingList;
    return selectedTest;
  }, [filter, selectedTest, successList, failedList, pendingList]);

  const {
    page, setPage,
    pageSize, setPageSize,
    totalItems,
    items: paginatedSelectedTests,
  } = usePagination(filtered, 10);

  const {
    totalSuccess,
    totalFailed,
    totalPending,
    totalTests,
    successRate,
    totalExecutionTime,
  } = useMemo(() => {
    const total = selectedTest.length;
    const success = successList.length;
    const failed = failedList.length;
    const pending = pendingList.length;
    const time = getLatestFor(selectedTest.at(-1)?.id || selectedTest.at(-1)?.testCaseId)?.ev?.time || 0;

    return {
      totalSuccess: success,
      totalFailed: failed,
      totalPending: pending,
      totalTests: total,
      successRate: total === 0 ? 0 : Math.round((success / total) * 100),
      totalExecutionTime: time,
    };
  }, [selectedTest, successList.length, failedList.length, pendingList.length]);

  const formatExecutionTime = (ms: number) => {
    const totalSec = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSec / 60);
    const seconds = totalSec % 60;
    return `${minutes}m ${seconds}s`;
  };

  const { stopTest: _stopTest } = useTestExecution();
  const handleStopTest = (reportId: string, connectionId: string, socket: any) => {
    _stopTest(reportId, connectionId, socket);
    setStopped((prev: any) => ({ ...prev, [reportId]: true }));
  };

  const buildReportFile = (reportId: string, test: any): any => {
    const stepsObj = stepMap[reportId]?.steps || {};
    const events = Object.keys(stepsObj)
      .map((k) => Number(k))
      .sort((a, b) => a - b)
      .map((idx) => stepsObj[idx]);

    return {
      id: reportId,
      reportName: test?.name || test?.testCaseName || "Test",
      timestamp: new Date().toISOString(),
      status: (events.at(-1)?.status || events.at(-1)?.finalStatus || "processing"),
      events,
    };
  };

  async function ensureContainer(reportId: string) {
    const wasExpanded = !!expandedReports[reportId];
    if (!containerRefs.current[reportId]) {
      flushSync(() => setExpandedReports(prev => ({ ...prev, [reportId]: true })));
      await new Promise(resolve => requestAnimationFrame(() => resolve(null)));
    }
    return { wasExpanded };
  }

  const anyRunning = useMemo(
    () =>
      selectedTest.some((test: any) => {
        const id = test.id || test.testCaseId;
        const pct = progress.find((p: any) => p.testCaseId === id)?.percent ?? 0;
        return pct > 0 && pct < 100 && !stopped[id];
      }),
    [selectedTest, progress, stopped]
  );

  const [isTabTransition, startTabTransition] = useTransition();

  const handleSetFilter = useCallback((k: FilterKey) => {
    startTabTransition(() => setFilter(k));
  }, [setFilter]);

  const TabBtn = ({ k, label, count }: { k: FilterKey; label: string; count: number }) => {
    const active = filter === k;
    return (
      <button
        type="button"
        onClick={() => handleSetFilter(k)}
        role="tab"
        aria-selected={active}
        aria-pressed={active}
        className={`px-3 py-2 text-sm cursor-pointer font-semibold shadow-md rounded-full border transition-colors
        ${active ? "bg-primary/90 text-white border-primary"
            : "bg-white text-primary/60 border-slate-200 hover:bg-slate-50"}`}
      >
        <span className="inline-flex items-center gap-2">
          {label}
          <span className="ml-0.5 text-xs opacity-80">({count})</span>
          {isTabTransition && active && (
            <svg className="animate-spin h-3 w-3 opacity-80" viewBox="0 0 24 24" aria-hidden="true">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" fill="none" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 0 1 8-8v3A5 5 0 0 0 7 12H4z" />
            </svg>
          )}
        </span>
      </button>
    );
  };

  const isRunningTest = (id: string) => {
    const pct = progress.find((p: any) => p.testCaseId === id)?.percent ?? 0;
    return pct > 0 && pct < 100 && !stopped[id];
  };

  return (
    <div className="space-y-6 mt-6 flex flex-col overflow-y-auto w-full">
      {selectedTest.length === 0 && (
       <EmptyStateSelectAnimation />

      )}



      {totalTests > 0 && (
        <div className="space-y-2">
          <ExecutionSummary
            totalSuccess={totalSuccess}
            totalFailed={totalFailed}
            totalPending={totalPending}
            successRate={successRate}
          />

          <div className="flex items-center justify-between gap-2 px-2">
            <div className="flex flex-wrap items-center gap-2">
              <TabBtn k="all" label="All" count={totalTests} />
              <TabBtn k="success" label="Success" count={totalSuccess} />
              <TabBtn k="failed" label="Failed" count={totalFailed} />
              <TabBtn k="pending" label="Pending" count={totalPending} />
            </div>

            <div className="flex items-center gap-2">
              {!anyRunning && (
                <>
                  <button
                    onClick={() => onRunAll?.()}
                    disabled={selectedTest.length === 0 || anyRunning}
                    className="flex cursor-pointer items-center text-[14px] gap-2 border-primary border-2 bg-primary/90 text-white font-semibold px-4 py-2 rounded hover:bg-primary/95 hover:shadow-md"
                    title="Run all selected tests"
                  >
                    <Play className="w-4 h-4" /> Run All
                  </button>

                  <button
                    onClick={async () => {
                      if (pendingList.length === 0) return;
                      if (typeof onRunPending === "function") {
                        onRunPending(pendingList);
                      } else {
                        for (const t of pendingList) await Promise.resolve(onPlayTest?.(t));
                      }
                    }}
                    disabled={pendingList.length === 0}
                    className="flex cursor-pointer items-center text-[14px] gap-2 border-2 text-white bg-primary/80 font-semibold px-4 py-2 rounded hover:bg-emerald-700 hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                    title="Run only pending tests"
                  >
                    <Play className="w-4 h-4" /> Run Pending ({pendingList.length})
                  </button>
                </>
              )}

              {anyRunning && (
                <button
                  onClick={() => {
                    const runningIds = selectedTest
                      .map((t: any) => String(t.id || t.testCaseId))
                      .filter((id: string) => {
                        const pct = (progress.find((p: any) => p.testCaseId === id)?.percent ?? 0);
                        return pct > 0 && pct < 100 && !stopped[id];
                      });

                    const { stopped: stoppedIds } = stopAll(runningIds, { onlyRunning: true });

                  }}
                  className="flex cursor-pointer items-center text-[14px] gap-2 border-red-500 border-2 text-red-500 font-semibold px-4 py-2 rounded hover:bg-red-50 hover:shadow-md"
                  title="Stop All Running Tests"
                >
                  <StopCircle className="w-4 h-4" /> Stop All
                </button>
              )}
            </div>

          </div>
        </div>
      )}

      {totalTests > 0 && paginatedSelectedTests.length > 0 && (
        <PaginationResults
          totalItems={totalItems}
          pageSize={pageSize}
          setPageSize={setPageSize}
          page={page}
          setPage={setPage}
        />
      )}

      <div className="flex flex-col gap-4 min-h-[600px]">
        {selectedTest.length > 0 && paginatedSelectedTests.length === 0 && (
          <div className="flex flex-col items-center justify-center mt-20 gap-4 text-center">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 160 120"
              className="w-40 h-28"
              aria-hidden="true"
            >
              <defs>
                <linearGradient id="grad" x1="0" x2="1" y1="0" y2="1">
                  <stop offset="0%" stopColor="#93C5FD" />
                  <stop offset="100%" stopColor="#60A5FA" />
                </linearGradient>
              </defs>
              <rect x="0" y="0" width="160" height="120" rx="12" fill="#F1F5F9" />
              <rect x="34" y="22" width="70" height="86" rx="8" fill="white" stroke="#CBD5E1" />
              <rect x="44" y="36" width="50" height="6" rx="3" fill="#E5E7EB" />
              <rect x="44" y="50" width="42" height="6" rx="3" fill="#E5E7EB" />
              <rect x="44" y="64" width="48" height="6" rx="3" fill="#E5E7EB" />
              <rect x="44" y="78" width="32" height="6" rx="3" fill="#E5E7EB" />
              <circle cx="106" cy="74" r="18" fill="url(#grad)" opacity="0.25" />
              <circle cx="104" cy="72" r="12" fill="none" stroke="#60A5FA" strokeWidth="3" />
              <line x1="112" y1="80" x2="122" y2="90" stroke="#3B82F6" strokeWidth="4" strokeLinecap="round" />
            </svg>

            <h3 className="text-lg font-semibold text-slate-800">No tests match your filter</h3>
            <p className="text-sm text-slate-500 max-w-md">
              Try adjusting your filter settings to find the tests you're looking for.
            </p>

            <button
              onClick={() => setFilter("all")}
              className="mt-1 rounded-full border bg-primary-blue/90  px-4 py-2 text-sm text-white font-semibold hover:bg-primary-blue/95 shadow-md"
            >
              Reset filter
            </button>
          </div>
        )}


        {paginatedSelectedTests.map((test: any) => {
          const reportId = test?.id || test.testCaseId;
          const progressValue = progress.find((p: any) => p.testCaseId === reportId)?.percent || 0;
          const isExpanded = expandedReports[reportId] ?? false;
          const testSteps = steps.filter((s) => s?.reportId === reportId);
          const latestStep = testSteps.at(-1);
          const finalStatus = latestStep?.ev?.status || latestStep?.ev?.finalStatus || "processing";
          const isFailed = finalStatus === "failed";
          const dataSteps = test?.stepsData || test?.stepsIds;
          const connectionId = stepMap[reportId]?.connectionId;

          const isRunning = progressValue > 0 && progressValue < 100 && !stopped[reportId];
          const showPlay = !isRunning && (progressValue === 0 || progressValue === 100 || !!stopped[reportId]);
          const showStop = isRunning;
          return (
            <div key={reportId} id={reportId} className="p-1 flex flex-col gap-2">
              <div className="flex justify-between items-center">
                <div className="flex gap-2 items-center">
                  {showPlay && (
                    <button
                      onClick={(e) => { e.stopPropagation(); onPlayTest?.(test); }}
                      className="flex items-center gap-1 text-[14px] rounded-md bg-primary/80 text-white px-3 py-2 cursor-pointer"
                      title="Run test"
                    >
                      <Play className="w-4 h-4" /> Run
                    </button>
                  )}

                  {showStop && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        const reportSocket = reports.find((p: any) => (p.testCaseId || p.id) === reportId)?.socket;
                        handleStopTest(reportId, connectionId, reportSocket);
                        setLoading((prev: any) => ({ ...prev, [reportId]: false }));
                      }}
                      className="self-end flex items-center shadow-lg rounded-lg cursor-pointer border gap-2 px-3 py-2 hover:text-red-600 text-red-500 bg-white hover:bg-red-50 transition-all duration-200"
                      title="Stop test"
                    >
                      <StopCircle className="w-5 h-5 animate-pulse" />
                      <span className="text-sm font-medium">Stop</span>
                    </button>
                  )}
                </div>


                {progressValue === 100 && (
                  <div className="flex gap-2 items-center">
                    <button
                      onClick={async () => {
                        const { wasExpanded } = await ensureContainer(reportId);
                        const file = buildReportFile(reportId, test);
                        const header = { name: test?.name || test?.testCaseName || reportId, createdBy: test?.createdBy || test?.testerName };
                        await downloadRenderedHtml(reportId, file, containerRefs, header);
                      }}
                      className="flex cursor-pointer items-center gap-2 text-xs border-primary/60 border-2 text-primary/60 font-semibold px-3 py-1 rounded hover:shadow-md"
                    >
                      <DownloadIcon size={16} /> HTML Report (Test)
                    </button>

                    <button
                      onClick={async () => {
                        const { wasExpanded } = await ensureContainer(reportId);
                        const file = buildReportFile(reportId, test);
                        const header = { name: test?.name || test?.testCaseName || reportId, createdBy: test?.createdBy || test?.testerName };
                        await downloadRenderedPdf(reportId, file, containerRefs, header);
                      }}
                      className="flex cursor-pointer items-center gap-2 text-xs border-primary/60 border-2 text-primary/60 font-semibold px-3 py-1 rounded hover:shadow-md"
                    >
                      <DownloadIcon size={16} /> PDF Report (Test)
                    </button>
                  </div>
                )}
              </div>

              <Card
                className={`relative cursor-pointer shadow-lg transition-all duration-300 hover:shadow-xl border-3 border-l-4 rounded-xl overflow-hidden ${isFailed ? " border-red-500 " : stopped[reportId] ? " border-gray-400 " : progressValue === 0 ? " border-blue-500 " : progressValue < 100 ? " border-yellow-500 " : " border-emerald-500 "
                  }`}
                onClick={() => toggleReport(reportId)}
              >
                <div className="relative h-28 p-2">
                  <div className="absolute top-0 left-3">
                    <span className="bg-linear-to-r flex items-center from-primary/90 to-primary/80 text-white px-3 py-1 rounded-full text-xs font-semibold shadow-md">
                      {reportId} <CopyToClipboard text={reportId} isDarkMode={true} />
                    </span>
                  </div>

                  <div className="flex flex-col justify-between h-full pt-8">
                    <div className="flex justify-between items-start">
                      <CardTitle className="text-lg font-bold text-gray-800 truncate pr-4 leading-tight">
                        {test.name || test.testCaseName || "Unnamed Test"}
                      </CardTitle>
                      <div className="flex items-center gap-3 shrink-0">
                        <Badge
                          className={`text-white font-bold px-3 py-1 ${isFailed ? "bg-red-500" : stopped[reportId] ? "bg-gray-500" : progressValue === 0 ? "bg-blue-500" : progressValue < 100 ? "bg-yellow-500" : "bg-green-500"
                            }`}
                        >
                          {progressValue}%
                        </Badge>
                        <div className="text-gray-400 transition-transform duration-200">
                          {isExpanded ? <FaChevronUp /> : <FaChevronDown />}
                        </div>
                      </div>
                    </div>

                    <div className="mt-3">
                      <ProgressBar stopped={!!stopped[reportId]} progressValue={progressValue} finalStatus={finalStatus} />
                    </div>
                  </div>
                </div>
              </Card>

              {isExpanded && (test?.stepsData || test?.stepsIds) && (
                <div className="p-1 max-h-[60vh] overflow-y-auto" ref={(el) => { containerRefs.current[reportId] = el; }}>
                  <ReportUI
                    testcaseId={reportId}
                    data={test}
                    report={stepMap[reportId]?.steps}
                    dataStepsTotal={test?.stepsData || test?.stepsIds}
                    progressValue={progressValue}
                    stopped={!!stopped[reportId]}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

const ProgressBar = ({ stopped, progressValue, finalStatus }: { stopped: boolean, progressValue: number; finalStatus: string }) => {
  const isCompleted = progressValue === 100;
  const animatedText = isCompleted ? (finalStatus === "failed" ? "Failed" : "Completed") : stopped ? "Stopped" : "In progress";

  return (
    <div className="flex w-full items-center gap-4 mb-4 pb-4">
      <Progress value={progressValue} className="h-2 flex-1" />
      <span className={`text-sm text-muted-foreground ${isCompleted ? "" : "relative inline-block animate-[slidepulse_1.5s_linear_infinite]"}`}>
        {animatedText}
      </span>
    </div>
  );
};

export default TestReports;
