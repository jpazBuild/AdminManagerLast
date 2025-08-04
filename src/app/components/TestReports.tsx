import { useEffect, useMemo, useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { FaChevronDown, FaChevronUp } from "react-icons/fa";
import ReportUI from "./Report";
import { useTestExecution } from "../hooks/useTestExecution";
import { StopCircle, Download as DownloadIcon } from "lucide-react";
import { handleDownloadHTMLReport } from "../hooks/HTMLReport";
import { handleDownloadPDFReport } from "@/lib/PDFReport";
import { ExecutionSummary } from "./ExecutionSummary";

const TestReports = ({ reports, setLoading, progress, selectedTest, testData, stopped, setStopped }: any) => {
    const [expandedReports, setExpandedReports] = useState<Record<string, boolean>>({});
    const { stopTest } = useTestExecution();

    const stepMap: Record<string, { connectionId: string; steps: Record<number, any> }> = {};


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

        data.forEach((step:any) => {
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
    } = useMemo<{
        totalSuccess: number;
        totalFailed: number;
        totalPending: number;
        totalTests: number;
        successRate: number;
        totalExecutionTime: number;
    }>(() => {
        let success = 0, failed = 0, pending = 0, time = 0;

        selectedTest.forEach((test: any) => {
            const reportId = test.id || test.testCaseId;
            const testSteps = steps.filter(s => s.reportId === reportId);
            const latestStep = testSteps.at(-1);
            const status = latestStep?.ev?.status || latestStep?.ev?.finalStatus || "processing";

            if (latestStep?.ev.action === "Test execution completed" && status === "completed") success++;
            else if (latestStep?.ev.action === "Test execution failed" && status === "failed") failed++;
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
    }, [selectedTest, steps]);

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

    console.log("steps report again", steps);

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
                    console.log("test st6eps", steps);
                    

                    const reportId = test.id || test.testCaseId;
                    const progressValue = progress.find((p: any) => p.testCaseId === reportId)?.percent || 0;
                    const isExpanded = expandedReports[reportId] ?? false;
                    const testSteps = steps.filter((s) => s?.reportId === reportId);
                    console.log("testSteps", testSteps);
                    
                    const latestStep = testSteps.at(-1);
                    const finalStatus = latestStep?.ev?.status || latestStep?.ev?.finalStatus || "processing";
                    const isFailed = finalStatus === "failed";
                    const dataSteps = test?.stepsData;
                    const connectionId = stepMap[reportId]?.connectionId;
                    console.log(" stopped[reportId] ", stopped[reportId], " reportId ", reportId, " connectionId ", connectionId, " test ", test);

                    console.log("stepMap[reportId] ",stepMap[reportId]);
                    
                    return (
                        <div key={reportId} id={reportId} className="p-1 flex flex-col gap-2">
                            {progressValue < 100 && !stopped[reportId] && (
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
                                <div className="p-1 max-h-[60vh] overflow-y-auto">
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
