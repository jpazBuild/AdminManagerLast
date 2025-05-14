import { URL_API_RUNNER } from "../../config";
import { useState } from "react";

export const useTestExecution = () => {
    const [reports, setReports] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [progress, setProgress] = useState<Record<string, number>>({});
    const [idReports, setIdReports] = useState<string[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedImage, setSelectedImage] = useState("");
    const [expandedStep, setExpandedStep] = useState<number | null>(null);

    const executeTests = async (selectedCases: any[], testData: any, maxBrowsers: number, isHeadless: boolean) => {
        setLoading(true);
        setError(null);
        setReports([]);
        setIdReports([]);

        let activeTests = 0;
        const pendingTests = [...selectedCases];

        const runNextTest = async () => {
            if (pendingTests.length === 0) return;
            if (activeTests >= maxBrowsers) return;            
            const testCase = pendingTests.shift();
            const testId = await testCase?.testCaseId;
            setIdReports(prev => [...prev, testId]);
            activeTests++;

            try {
                testCase.contextGeneral.data.url = await testData.data[testCase.testCaseId].urlSite;             
                const response = await fetch(`${URL_API_RUNNER}/executeTest`, {
                    method: "POST",
                    headers: {
                        'Content-Type': 'application/json',
                      },
                      body: JSON.stringify({
                        isHeadless: isHeadless,
                        testData: testData?.data[testCase.testCaseId],
                        dataScenario: {
                            contextGeneral: testCase.contextGeneral,
                            jsonSteps: testCase.stepsData,
                        },
                    }),
                });
                const reader = response.body?.getReader();
                const decoder = new TextDecoder();
                let buffer = "";
                const stepCount = testCase.stepsData.length + 2;
                let completedSteps = 0;
                const testResults: { finalStatus?: string }[] = [];

                const steps: { indexStep: number; jsonData: any }[] = []
                while (reader) {
                    const { done, value } = await reader.read();
                    if (done) break;

                    buffer += decoder.decode(value, { stream: true });
                    const events = buffer.split("\n\n");
                    buffer = events.pop() || "";


                    events.map(ev => {
                        const jsonData = JSON.parse(ev.slice(6));
                        const existingIndex = steps.findIndex(step => step.indexStep === jsonData.indexStep);

                        if (existingIndex !== -1) {
                            // Si el indexStep ya existe, actualizamos su valor
                            steps[existingIndex] = { indexStep: jsonData.indexStep, jsonData };
                        } else {
                            // Si no existe, lo agregamos a la lista
                            steps.push({ indexStep: jsonData.indexStep, jsonData });
                        }
                        return jsonData
                    })
                    for (const event of events) {
                        if (event.startsWith("data: ")) {
                            const jsonData = JSON.parse(event.slice(6));
                            testResults.push(jsonData);
                            if (jsonData.status?.toLowerCase() === "completed") {
                                completedSteps++;
                            }
                            const newProgress = Math.round((completedSteps / stepCount) * 100);
                            setProgress(prev => ({
                                ...prev,
                                [testId]: newProgress,
                            }));
                            setReports(prev => {
                                const reportIndex = prev.findIndex(r => r.id === testId);
                                if (reportIndex > -1) {
                                    const updatedReports = [...prev];
                                    updatedReports[reportIndex] = { id: testId, testCaseName: testCase.testCaseName, data: testResults };
                                    return updatedReports;
                                } else {
                                    return [...prev, { id: testId, testCaseName: testCase.testCaseName, data: testResults }];
                                }
                            });
                        }
                    }
                }

                let finalStatus;
                steps.map((step) => {
                    if (step.jsonData.status === "completed") {
                        testResults.push({ finalStatus: "success" })
                        finalStatus = "success"
                    } else if (step.jsonData.status === "failed") {
                        testResults.push({ finalStatus: "failed" })
                        finalStatus = "failed"
                    }
                })

                if (finalStatus === "failed") {
                    setProgress(prev => ({
                        ...prev,
                        [testId]: 100,
                    }));
                }

                if (finalStatus === "success") {
                    setProgress(prev => ({
                        ...prev,
                        [testId]: 100,
                    }));
                }
                setReports(prev => {
                    const reportIndex = prev.findIndex(r => r.id === testId);
                    if (reportIndex > -1) {
                        const updatedReports = [...prev];
                        updatedReports[reportIndex] = { id: testId, testCaseName: testCase.testCaseName, data: testResults };
                        return updatedReports;
                    }
                    return [...prev, { id: testId, data: testResults }];
                });

            } catch (error: any) {
                setError(`Error ejecutando prueba: ${error.message}`);
                setProgress(prev => ({
                    ...prev,
                    [testId]: 100,
                }));
            }

            activeTests--;

            if (pendingTests.length > 0) {
                await runNextTest();
            }
        };

        await Promise.all(
            new Array(Math.min(maxBrowsers, pendingTests.length)).fill(null).map(runNextTest)
        );
        setLoading(false);
    };

    return {
        reports,
        loading,
        error,
        progress,
        idReports,
        isModalOpen,
        selectedImage,
        expandedStep,
        executeTests,
    };
};