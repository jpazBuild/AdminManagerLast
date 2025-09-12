import { useMemo, useRef, useState } from "react";
import { Card, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { FaChevronDown, FaChevronUp } from "react-icons/fa";
import ReportUI from "./Report";
import { useTestExecution } from "../hooks/useTestExecution";
import { StopCircle, Download as DownloadIcon, Play } from "lucide-react";
import { handleDownloadHTMLReport, handleDownloadHTMLReportSingle } from "../hooks/HTMLReport";
import { handleDownloadPDFReport } from "@/lib/PDFReport";
import { ExecutionSummary } from "./ExecutionSummary";
import { downloadRenderedHtml, downloadRenderedPdf } from "./ReportsHistoricTestCaseList";
import { flushSync } from "react-dom";

const TestReports = ({ reports, setLoading, progress, selectedTest, testData, stopped, setStopped, onPlayTest,loading }: any) => {
    const [expandedReports, setExpandedReports] = useState<Record<string, boolean>>({});
    const { stopTest } = useTestExecution();
    const stepMap: Record<string, { connectionId: string; steps: Record<number, any> }> = {};
    const containerRefs = useRef<Record<string, HTMLDivElement | null>>({});


    reports.forEach((report: any) => {
        const testCaseId = report.testCaseId || report.id;
        const data = Array.isArray(report.data) ? report.data : [];
        const connectionId = report.connectionId ?? "";


        if (!stepMap[testCaseId]) {
            stepMap[testCaseId] = {
                connectionId,
                steps: {},
            };
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

    steps.sort((a, b) => {
        if (a.reportId === b.reportId) return a.indexStep - b.indexStep;
        return a.reportId.localeCompare(b.reportId);
    });

    const toggleReport = (reportId: string) => {
        setExpandedReports((prev) => ({
            ...prev,
            [reportId]: !prev[reportId],
        }));
    };

    const {
        totalSuccess,
        totalFailed,
        totalPending,
        totalTests,
        successRate,
        totalExecutionTime,
    } = useMemo(() => {
        let success = 0,
            failed = 0,
            pending = 0,
            time = 0;

        selectedTest.forEach((test: any) => {
            const reportId = test.id || test.testCaseId;
            const testSteps = steps.filter((s) => s.reportId === reportId);
            const latestStep = testSteps.at(-1);
            const status = latestStep?.ev?.status || latestStep?.ev?.finalStatus || "processing";

            if (stopped[reportId]) {
                return;
            }

            if (latestStep?.ev.action === "Test execution completed" && status === "completed")
                success++;
            else if (latestStep?.ev.action === "Test execution failed" && status === "failed")
                failed++;
            else pending++;

            time = latestStep?.ev?.time || 0;
        });

        const total = selectedTest.length;

        return {
            totalSuccess: success,
            totalFailed: failed,
            totalPending: pending,
            totalTests: total,
            successRate: total === 0 ? 0 : Math.round((success / total) * 100),
            totalExecutionTime: time,
        };
    }, [selectedTest, steps, stopped]);


    const formatExecutionTime = (ms: number) => {
        const totalSec = Math.floor(ms / 1000);
        const minutes = Math.floor(totalSec / 60);
        const seconds = totalSec % 60;
        return `${minutes}m ${seconds}s`;
    };

    const handleStopTest = (reportId: string, connectionId: string, socket: any) => {
        stopTest(reportId, connectionId, socket);
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

    async function ensureContainer(reportId: string, expandOnlyIfNeeded = true) {
        const wasExpanded = !!expandedReports[reportId];

        if (!containerRefs.current[reportId]) {
            flushSync(() => {
                setExpandedReports(prev => ({ ...prev, [reportId]: true }));
            });

            await new Promise(resolve => requestAnimationFrame(() => resolve(null)));
        }

        return { wasExpanded };
    }

    console.log("steps report again", steps);
    const handleStopAllTests = () => {
        const newStopped: Record<string, boolean> = { ...stopped };
        const newLoading: Record<string, boolean> = {};

        selectedTest.forEach((test: any) => {
            const reportId = test.id || test.testCaseId;
            const connectionId = stepMap[reportId]?.connectionId;
            const reportSocket = reports.find((p: any) => (p.testCaseId || p.id) === reportId)?.socket;

            if (!stopped[reportId]) {
                try {
                    stopTest(reportId, connectionId, reportSocket);
                    console.log(`Stop enviado para ${reportId}`);
                } catch (err) {
                    console.error(`Error deteniendo ${reportId}`, err);
                }
                newStopped[reportId] = true;
            }

            newLoading[reportId] = false;
        });

        setStopped(newStopped);
        setLoading((prev: any) => ({ ...prev, ...newLoading }));
    };

    return (
        <div className="space-y-6 mt-6">
            {totalTests > 0 && (
                <div className="space-y-2">
                    <ExecutionSummary
                        totalSuccess={totalSuccess}
                        totalFailed={totalFailed}
                        totalPending={totalPending}
                        successRate={successRate}
                    />
                    <div className="flex place-self-end justify-between items-center px-2">
                        {totalPending > 1 && (
                            <button
                                onClick={handleStopAllTests}
                                className="flex cursor-pointer items-center gap-2 text-xs border-red-500 border-2 text-red-500 font-semibold px-4 py-2 rounded hover:bg-red-50 hover:shadow-md"
                                title="Stop All Running Tests"
                            >
                                <StopCircle className="w-4 h-4" /> Stop All
                            </button>
                        )}
                        {totalPending === 0 && (
                            <div className="flex gap-2 self-end pt-2">
                                <button
                                    onClick={() => handleDownloadHTMLReport(totalSuccess, totalFailed, totalTests, totalExecutionTime, reports, testData, selectedTest)}
                                    className="flex cursor-pointer items-center gap-2 text-xs border-primary/60 border-2 text-primary/60 font-semibold px-4 py-2 rounded hover:shadow-md"
                                >
                                    <DownloadIcon size={16} /> HTML Report
                                </button>
                                <button
                                    onClick={() => handleDownloadPDFReport(totalTests, totalSuccess, totalFailed, totalExecutionTime, reports, testData, selectedTest)}
                                    className="flex cursor-pointer items-center gap-2 text-xs border-primary/60 border-2 text-primary/60 font-semibold px-2 rounded hover:shadow-md"
                                >
                                    <DownloadIcon size={16} /> PDF Report
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}

            <div className="">
                {selectedTest.map((test: any) => {
                    const reportId = test?.id || test.testCaseId;
                    const progressValue = progress.find((p: any) => p.testCaseId === reportId)?.percent || 0;
                    const isExpanded = expandedReports[reportId] ?? false;
                    const testSteps = steps.filter((s) => s?.reportId === reportId);

                    const latestStep = testSteps.at(-1);
                    const finalStatus = latestStep?.ev?.status || latestStep?.ev?.finalStatus || "processing";
                    const isFailed = finalStatus === "failed";
                    const dataSteps = test?.stepsData || test?.stepsIds;
                    const connectionId = stepMap[reportId]?.connectionId;

                    return (
                        <div key={reportId} id={reportId} className="p-1 flex flex-col gap-2">
                            <div className="flex justify-between items-center">
                              

                                <div className="flex gap-2 items-center">
                                     {(progressValue === 0 || progressValue === 100 || !!stopped[reportId]) && (
                                    <button
                                        disabled={!!loading[reportId]}
                                        onClick={(e) => { e.stopPropagation(); onPlayTest?.(test); }}
                                        className={`flex items-center gap-1 rounded-md bg-primary/80 text-white px-3 py-2 cursor-pointer ${loading[reportId] ? "opacity-50 cursor-not-allowed" : ""}`}
                                    >
                                       <Play className="w-4 h-4"/> Play
                                    </button>
                                )}
                                {progressValue < 100 && progressValue > 0 && !stopped[reportId] && (
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleStopTest(reportId, connectionId, reports.find((p: any) => (p.testCaseId || p.id) === reportId)?.socket);
                                            setLoading((prev: any) => ({ ...prev, [reportId]: false }));
                                        }}
                                        className="self-end flex items-center shadow-lg rounded-lg cursor-pointer border gap-2 px-3 py-2 hover:text-red-600 text-red-500 bg-white hover:bg-red-50 transition-all duration-200"
                                        title="Stop Test"
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
                                                const header = {
                                                    name: test?.name || test?.testCaseName || reportId,
                                                    createdBy: test?.createdBy || test?.testerName,
                                                };

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
                                                const header = {
                                                    name: test?.name || test?.testCaseName || reportId,
                                                    createdBy: test?.createdBy || test?.testerName,
                                                };

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
                                className={`relative cursor-pointer shadow-lg transition-all duration-300 hover:shadow-xl border-3 border-l-4 rounded-xl overflow-hidden  ${isFailed
                                    ? " border-red-500 "
                                    : stopped[reportId]
                                        ? " border-gray-400 "
                                        : progressValue === 0
                                            ? " border-blue-500 "
                                            : progressValue < 100
                                                ? " border-yellow-500 "
                                                : " border-green-500 "
                                    }`}
                                onClick={() => toggleReport(reportId)}
                            >

                                <div className="relative h-28 p-2">
                                    <div className="absolute top-0 left-3">
                                        <span className="bg-gradient-to-r from-primary/90 to-primary/80 text-white px-3 py-1 rounded-full text-xs font-semibold shadow-md">
                                            {reportId}
                                        </span>
                                    </div>

                                    <div className="flex flex-col justify-between h-full pt-8">
                                        <div className="flex justify-between items-start">
                                            <CardTitle className="text-lg font-bold text-gray-800 truncate pr-4 leading-tight">
                                                {test.name || test.testCaseName || "Unnamed Test"}
                                            </CardTitle>
                                            <div className="flex items-center gap-3 flex-shrink-0">
                                                <Badge
                                                    className={`text-white font-bold px-3 py-1 ${isFailed
                                                        ? "bg-red-500"
                                                        : stopped[reportId]
                                                            ? "bg-gray-500"
                                                            : progressValue === 0
                                                                ? "bg-blue-500"
                                                                : progressValue < 100
                                                                    ? "bg-yellow-500"
                                                                    : "bg-green-500"
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
                                            <ProgressBar
                                                stopped={!!stopped[reportId]}
                                                progressValue={progressValue}
                                                finalStatus={finalStatus}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </Card>

                            {isExpanded && dataSteps && (
                                <div className="p-1 max-h-[60vh] overflow-y-auto"
                                    ref={(el) => { containerRefs.current[reportId] = el; }}
                                >
                                    <ReportUI
                                        testcaseId={reportId}
                                        data={test}
                                        report={stepMap[reportId]?.steps}
                                        dataStepsTotal={dataSteps}
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

    const animatedText = isCompleted
        ? finalStatus === "failed"
            ? "Failed"
            : "Completed"
        : stopped
            ? `Stopped`
            : `In progress`;

    return (
        <div className="flex w-full items-center gap-4 mb-4 pb-4">
            <Progress value={progressValue} className="h-2 flex-1" />
            <span
                className={`text-sm text-muted-foreground ${isCompleted ? "" : "relative inline-block animate-[slidepulse_1.5s_linear_infinite]"
                    }`}
            >
                {animatedText}
            </span>
        </div>
    );
};

export default TestReports;
