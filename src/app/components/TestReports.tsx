import { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "../../components/ui/card";
import { Badge } from "../../components/ui/badge";
import { Progress } from "../../components/ui/progress";
import { FaChevronDown, FaChevronUp } from "react-icons/fa";
import { ExecutionSummary } from "./ExecutionSummary";
import ReportUI from "./Report";
import { Clock, DownloadIcon } from "lucide-react";
import { formatExecutionTime } from "@/lib/formatExecutionTime";
import { handleDownloadHTMLReport } from "../hooks/HTMLReport";
import { handleDownloadPDFReport } from "../../lib/PDFReport";

const TestReports = ({ reports, idReports, progress, selectedCases, selectedTest, testData }: any) => {
    console.log("🚀 ~ TestReports ~ selectedCases:", selectedCases)
    console.log("🚀 ~ TestReports ~ selectedTest:", selectedTest)
    const [expandedReports, setExpandedReports] = useState<Record<string, boolean>>({});
    const statusMap: Record<string, "completed" | "failed" | "pending"> = {};

    const toggleReport = (reportId: string) => {
        setExpandedReports(prev => ({
            ...prev,
            [reportId]: !prev[reportId],
        }));
    };

    interface StepEvent {
        indexStep: number;
        status?: string;
        finalStatus?: string;
        [key: string]: any;
    }

    const steps: { indexStep: number; ev: StepEvent; reportId: string }[] = [];

    reports.forEach((report: any) => {
        report.data.forEach((ev: StepEvent) => {
            steps.push({ indexStep: ev.indexStep, ev, reportId: report.id });
        });
    });

    const selectedSet = new Set(selectedCases);

    selectedCases.forEach((caseId: string) => {
        statusMap[caseId] = "pending";
    });

    reports.forEach((report: any) => {
        const testCaseId = report.id;
        const stepsOfReport = steps.filter(step => step.reportId === report.id);
        const lastStep = stepsOfReport.at(-1);

        if (progress[report.id] === 100 && lastStep && selectedSet.has(testCaseId)) {
            const final = (lastStep.ev.status || lastStep.ev.finalStatus);
            const status = final === "failed" ? "failed" : "completed";
            statusMap[testCaseId] = status;
        }
    });


    const values = Object.values(statusMap);
    const totalSuccess = values.filter(status => status === "completed").length;
    const totalFailed = values.filter(status => status === "failed").length;
    const totalPendingTests = values.filter(status => status === "pending").length;
    const totalTests = values.length;
    const successRate = totalTests > 0 ? (totalSuccess / totalTests) * 100 : 0;

    const totalExecutionTime = reports.reduce((acc: number, report: any) => {
        const closingStep = report?.data.find((step: any) => step.action === "Closing browser");
        const time = closingStep?.executionTime ? Number(closingStep.executionTime) : 0;
        return acc + time;
    }, 0);

    return (
        <div className="space-y-6 mt-6">
            {totalTests > 0 && (
                <ExecutionSummary
                    totalSuccess={totalSuccess}
                    totalFailed={totalFailed}
                    totalPending={totalPendingTests}
                    successRate={successRate}
                />

            )}
            {totalExecutionTime > 0 && (
                <div className="flex w-full justify-between gap-2">
                    <div className="flex text-center text-sm text-primary/60 mt-2">
                        <Clock className="w-4 h-4 mr-1" /> <span className="font-semibold tracking-wide">Total execution time:</span>{" "}
                        {formatExecutionTime(totalExecutionTime)}
                    </div>
                    {totalPendingTests === 0 && (
                        <div className="text-right flex gap-2">
                            <button
                                onClick={() => handleDownloadHTMLReport(totalSuccess, totalFailed, totalTests, totalExecutionTime, reports, testData)}
                                className="flex items-center gap-2 text-xs border-primary/60 border-2 text-primary/60 font-semibold px-4 py-2 rounded hover:shadow-md"
                            >
                                <DownloadIcon size={16} /> HTML Report
                            </button>
                            <button
                                onClick={() => handleDownloadPDFReport(totalSuccess, totalFailed, totalTests, totalExecutionTime, reports, testData)}
                                className="flex items-center gap-2 text-xs border-primary/60 border-2 text-primary/60 font-semibold px-2 rounded hover:shadow-md"
                            >
                                <DownloadIcon size={16} /> PDF Report
                            </button>
                        </div>
                    )}
                </div>

            )}

            <div className="space-y-4">
                {selectedTest.map((test: any) => {
                    const report = reports.find((r: any) => r.id === test.testCaseId); // Encuentra el reporte correspondiente
                    const reportId = report?.id || test.testCaseId;
                    const isExpanded = expandedReports[reportId] ?? false;
                    const progressValue = report ? progress[reportId] || 0 : 0;
                    const stepsOfReport = report ? steps.filter((s) => s.reportId === reportId) : [];
                    const finalStatus = stepsOfReport.at(-1)?.ev?.finalStatus || "in_progress";
                    const isFailed = finalStatus === "failed";
                    const isCompleted = progressValue === 100;
                    const dataSteps = test.stepsData;
                    console.log("🚀 ~ {selectedTest.map ~ dataSteps:", dataSteps)
                    const closeBrowser = report?.data.find((step: any) => step.action === "Closing browser");

                    return (
                        <div key={test.testCaseId} id={test.testCaseId} className="space-y-2">
                            <Card
                                className={`relative cursor-pointer transition-shadow hover:shadow-lg border-2 border-l-4 
                                    ${isFailed
                                        ? "border-red-500"
                                        : progressValue === 0
                                            ? "border-primary"
                                            : progressValue < 100
                                                ? "border-yellow-500"
                                                : "border-green-500"
                                    }`}
                                onClick={() => toggleReport(reportId)}
                            >
                                <span className="bg-primary rounded-br-lg rounded-tl-lg text-white absolute top-0 left-0 p-1 text-[12px]">
                                    {test.testCaseId}
                                </span>

                                {closeBrowser && (
                                    <div className="absolute top-2 right-2 flex items-center gap-1 rounded-md shadow-sm ">
                                        <Clock className="w-4 h-4 mr-1" />
                                        <span className="text-xs font-medium">
                                            {formatExecutionTime(Number(closeBrowser.executionTime))}
                                        </span>
                                    </div>
                                )}
                                <CardHeader className="relative flex flex-col items-center gap-2 justify-between p-4 mt-4">
                                    <div className="flex justify-between w-full">
                                        <CardTitle className="text-base font-semibold tracking-wider">
                                            {test.testCaseName || report?.testCaseName || "Unnamed Test"}
                                        </CardTitle>

                                        <div className="flex items-center gap-2">
                                            <Badge className="text-white" variant={isCompleted ? "default" : "default"}>
                                                {progressValue}%
                                            </Badge>
                                            {(isExpanded) ? <FaChevronUp /> : <FaChevronDown />}
                                        </div>
                                    </div>

                                    {isExpanded && report && (
                                        <ProgressBar progressValue={progressValue} finalStatus={finalStatus} />
                                    )}
                                </CardHeader>

                                {!isExpanded && report && (
                                    <CardContent className="p-4 pt-0">
                                        <ProgressBar progressValue={progressValue} finalStatus={finalStatus} />
                                    </CardContent>
                                )}
                            </Card>

                            {isExpanded && dataSteps && (
                                <div className="p-2">
                                    <ReportUI
                                        data={test}
                                        report={report}
                                        dataStepsTotal={dataSteps}
                                        className="rounded-lg border p-4 bg-muted/50"
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


const ProgressBar = ({ progressValue, finalStatus }: { progressValue: number; finalStatus: string }) => {
    const isCompleted = progressValue === 100;
    return (
        <div className="flex w-full items-center gap-4">
            <Progress value={progressValue} className="h-2 flex-1" />
            <span className="text-sm text-muted-foreground">
                {isCompleted ? (finalStatus === "failed" ? "Failed" : "Completed") : "In progress"}
            </span>
        </div>
    );
};

export default TestReports;