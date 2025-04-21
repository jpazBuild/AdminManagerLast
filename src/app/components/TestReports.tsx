import { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "../../components/ui/card";
import { Badge } from "../../components/ui/badge";
import { Progress } from "../../components/ui/progress";
import { FaChevronDown, FaChevronUp } from "react-icons/fa";
import { ExecutionSummary } from "./ExecutionSummary";
import ReportUI from "./Report";
import { Clock } from "lucide-react";

const TestReports = ({ reports, idReports, progress, selectedCases, selectedTest }: any) => {
    const [expandedReports, setExpandedReports] = useState<Record<string, boolean>>({});

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

    // Asociar pasos con reportId para poder filtrarlos correctamente
    const steps: { indexStep: number; ev: StepEvent; reportId: string }[] = [];

    // Construir steps con reportId asociado
    reports.forEach((report: any) => {
        report.data.forEach((ev: StepEvent) => {
            steps.push({ indexStep: ev.indexStep, ev, reportId: report.id });
        });
    });

    const finishtest: string[] = [];

    // Obtener últimos pasos por reporte y decidir estado final
    reports.forEach((report: any) => {
        if (progress[report.id] === 100) {
            const stepsOfReport = steps.filter(step => step.reportId === report.id);
            const lastStep = stepsOfReport.at(-1);

            if (lastStep) {
                const status = (lastStep.ev.status || lastStep.ev.finalStatus) === "failed" ? "failed" : "completed";
                finishtest.push(status);
            }
        }
    });


    const formatExecutionTime = (ms: number) => {
        const minutes = Math.floor(ms / 60000);
        const seconds = ((ms % 60000) / 1000).toFixed(0);
        return minutes > 0
            ? `${minutes} min ${seconds} sec`
            : `${seconds} sec`;
    };

    const totalSuccess = finishtest.filter(status => status === "completed").length;
    const totalFailed = finishtest.filter(status => status === "failed").length;
    const totalTests = totalSuccess + totalFailed;
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
                    const stepsOfReport = steps.filter(s => s.reportId === reportId);
                    const finalStatus = stepsOfReport.at(-1)?.ev?.finalStatus || "in_progress";
                    const isFailed = finalStatus === "failed";
                    const isCompleted = progressValue === 100;

                    const closeBrowser = report?.data.find((step: any) => step.action === 'Closing browser');
                    const selectedtest = selectedTest.find((test:any)=>test.testCaseId === reportId)
                    return (
                        <div key={reportId} className="space-y-2">
                            <Card
                                className={`relative cursor-pointer transition-shadow hover:shadow-lg border-2 border-l-4 
                                    ${isFailed
                                        ? "border-red-500"
                                        : progressValue < 100
                                            ? "border-yellow-500"
                                            : "border-green-500"
                                    }`}
                                onClick={() => toggleReport(reportId)}
                            >
                                <span className="bg-primary rounded-br-lg text-white absolute top-0 left-0 p-1 text-[12px]">{report.id}</span>

                                {closeBrowser && (
                                    <div className="absolute top-2 right-2 flex items-center gap-1 rounded-md shadow-sm ">
                                        <Clock className="w-4 h-4 mr-1" />
                                        <span className="text-xs font-medium">
                                            {formatExecutionTime(Number(closeBrowser.executionTime))}
                                        </span>
                                    </div>
                                )}
                                <CardHeader className="relative flex flex-col items-center gap-2 justify-between p-4 mt-4">
                                    <div className=" flex justify-between w-full">
                                        <CardTitle className="text-base font-semibold tracking-wider">
                                            {report.testCaseName}
                                        </CardTitle>

                                        <div className="flex items-center gap-2 ">
                                            <Badge className="text-white" variant={isCompleted ? "default" : "default"}>{progressValue}%</Badge>
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
                                    <ReportUI data={selectedtest} report={report} className="rounded-lg border p-4 bg-muted/50" />
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