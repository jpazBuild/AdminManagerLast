import { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "../../components/ui/card";
import { Badge } from "../../components/ui/badge";
import { Progress } from "../../components/ui/progress";
import { FaChevronDown, FaChevronUp, FaClock } from "react-icons/fa";
import { ExecutionSummary } from "./ExecutionSummary";
import ReportUI from "./Report";
import { Clock } from "lucide-react";

const TestReports = ({ reports, idReports, progress, selectedCases }: any) => {
    const [expandedReports, setExpandedReports] = useState<Record<string, boolean>>({});

    const toggleReport = (reportId: string) => {
        setExpandedReports(prev => ({
            ...prev,
            [reportId]: !prev[reportId],
        }));
    };

    const reportSummary = reports.reduce((acc: Record<number, { success: number; failed: number }>, report: any) => {
        report.data.forEach((item: any) => {
            const indexStep = item.indexStep;
            if (!acc[indexStep]) {
                acc[indexStep] = { success: 0, failed: 0 };
            }

            if (item.status === "completed" || item.finalStatus === "sucess") {
                acc[indexStep].success += 1;
            } else if (item.status === "failed" || item.finalStatus === "failed") {
                acc[indexStep].failed += 1;
            }
        });
        return acc;
    }, {});

    let steps: any[] = [];

    reports[0]?.data.map((ev: any) => {
        const existingIndex = steps.findIndex(step => step.indexStep === ev.indexStep);

        if (!ev.finalStatus) {
            if (existingIndex !== -1) {
                steps[existingIndex] = { indexStep: ev.indexStep, ev };
            } else {
                steps.push({ indexStep: ev.indexStep, ev });
            }
        }
        return ev
    })

    const formatExecutionTime = (ms: number) => {
        const minutes = Math.floor(ms / 60000);
        const seconds = ((ms % 60000) / 1000).toFixed(0);
        return minutes > 0
            ? `${minutes} min ${seconds} sec`
            : `${seconds} sec`;
    };

    const totalSuccess = steps.filter(step => step.status === "completed").length;
    const totalFailed = steps.filter(step => step.status === "failed").length;


    const totalTests = steps.length;
    const successRate = totalTests > 0 ? (totalSuccess / totalTests) * 100 : 0;

    return (
        <div className="space-y-6 mt-6">
            {totalTests > 0 && (
                <ExecutionSummary totalSuccess={totalSuccess} totalFailed={totalFailed} successRate={successRate} />
            )}

            <div className="space-y-4">
                {reports.map((report: any, index: number) => {
                    const reportId = idReports[index];
                    const isExpanded = expandedReports[reportId] ?? false;
                    const progressValue = progress[reportId] || 0;
                    const finalStatus = report.data.length > 0 ? report.data[report.data.length - 1].finalStatus : "in_progress";
                    const isFailed = finalStatus === "failed";
                    const isCompleted = progressValue === 100;

                    const closeBroser = report?.data.find((step: any) => step.action === 'Closing browser')

                    return (
                        <div key={reportId} className="space-y-2">
                            <Card
                                className={`relative cursor-pointer transition-shadow hover:shadow-lg border-2 border-l-4 ${isFailed ? "border-red-500" : "border-green-500"
                                    }`}
                                onClick={() => toggleReport(reportId)}
                            >
                                {closeBroser && (
                                    <div className="absolute top-2 right-2 flex items-center gap-1 rounded-md shadow-sm ">
                                        <Clock className="w-4 h-4 mr-1" />
                                        <span className="text-xs font-medium">
                                          {formatExecutionTime(Number(closeBroser.executionTime))}
                                        </span>
                                    </div>
                                )}
                                <CardHeader className="flex flex-col items-center gap-2 justify-between p-4 mt-4">
                                    <div className="flex justify-between w-full">
                                        <CardTitle className="text-base font-semibold tracking-wider">
                                            {report.testCaseName}
                                        </CardTitle>

                                        <div className="flex items-center gap-2">
                                            <Badge variant={isCompleted ? "secondary" : "default"}>{progressValue}%</Badge>
                                            {isExpanded ? <FaChevronUp /> : <FaChevronDown />}
                                        </div>
                                    </div>

                                    {isExpanded && (
                                        <ProgressBar progressValue={progressValue} finalStatus={finalStatus} />
                                    )}
                                </CardHeader>

                                {!isExpanded && (
                                    <CardContent className="p-4 pt-0">
                                        <ProgressBar progressValue={progressValue} finalStatus={finalStatus} />
                                    </CardContent>
                                )}
                            </Card>

                            {isExpanded && (
                                <div className="p-2">
                                    <ReportUI report={report} className="rounded-lg border p-4 bg-muted/50" />
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
