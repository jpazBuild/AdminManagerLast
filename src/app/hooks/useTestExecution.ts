import { useEffect, useState, useCallback } from "react";
import { URL_API_RUNNER } from "../../config";
import { logger } from "../../utils/logger";

export const useTestExecution = () => {
    const [reports, setReports] = useState<any[]>([]);
    const [loading, setLoading] = useState<Record<string, boolean>>({});
    const [stopped, setStopped] = useState<Record<string, boolean>>({});
    const [error, setError] = useState<string | null>(null);
    const [progress, setProgress] = useState<{ testCaseId: string; percent: number }[]>([]);
    const [idReports, setIdReports] = useState<string[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedImage, setSelectedImage] = useState("");
    const [expandedStep, setExpandedStep] = useState<number | null>(null);

    const [socketMap, setSocketMap] = useState<Record<string, WebSocket>>({});
    const [connectionMap, setConnectionMap] = useState<Record<string, string>>({});
    const [stepsCountMap, setStepsCountMap] = useState<Record<string, number>>({});
    const [completedStepsMap, setCompletedStepsMap] = useState<Record<string, number>>({});
    const [activeTests, setActiveTests] = useState(0);
    const [pendingTests, setPendingTests] = useState<any[]>([]);
    const [maxBrowsers, setMaxBrowsers] = useState(1);
    const [isHeadless, setIsHeadless] = useState(true);
    const [testData, setTestData] = useState<any>({});

    const updateProgress = useCallback((testId: string, completedSteps: number) => {
        setStepsCountMap(prevSteps => {
            const total = prevSteps[testId];
            if (!total || total === 0) return prevSteps;
            const clamped = Math.min(completedSteps, total);
            const percent = Math.round((clamped / total) * 100);
            setProgress(prev => {
                const updated = prev.filter(p => p.testCaseId !== testId);
                return [...updated, { testCaseId: testId, percent }];
            });
            return prevSteps;
        });
    }, []);

    useEffect(() => {
        const slotsAvailable = maxBrowsers - activeTests;
        if (pendingTests.length > 0 && slotsAvailable > 0) {
            const testsToRun = pendingTests.slice(0, slotsAvailable);
            testsToRun.forEach(testCase => {
                const testId = String(testCase.testCaseId);
                if (!URL_API_RUNNER) {
                    logger("❌ URL_API_RUNNER is undefined. Cannot create WebSocket.");
                    setError("WebSocket URL is not configured.");
                    return;
                }
                const socket = new WebSocket(URL_API_RUNNER);

                setSocketMap(prev => ({ ...prev, [testId]: socket }));
                
                setActiveTests(prev => prev + 1);
                setIdReports(prev => [...prev, testId]);
                const totalSteps = testCase.stepsData.length + 2;
                setStepsCountMap(prev => ({ ...prev, [testId]: totalSteps }));

                socket.onopen = () => {
                    const payload = {
                        action: "executeTest",
                        testCaseId: testId,
                        isHeadless,
                        testCaseName: testCase.testCaseName,
                        totalSteps,
                        testData: testData.data[testId],
                        dataScenario: {
                            contextGeneral: {
                                ...testCase.contextGeneral,
                                data: {
                                    ...testCase.contextGeneral.data,
                                    url: testData.data[testId].urlSite,
                                },
                            },
                            jsonSteps: testCase.stepsData,
                        },
                    };
                    socket.send(JSON.stringify(payload));
                    setPendingTests(prev => prev.filter(t => t.testCaseId !== testCase.testCaseId));
                };

                socket.onmessage = (event) => {
                    try {
                        const message = JSON.parse(event.data);
                        const { type, payload, response, routeKey, connectionId, testCaseId } = message;
                        const id = String(testCaseId);
                    
                        if (stopped[id]) return;
                        if (connectionId) setConnectionMap(prev => ({ ...prev, [id]: connectionId }));

                        if (type === "stepUpdate") {
                            const { data, completedSteps } = payload;                            
                            setCompletedStepsMap(prev => ({ ...prev, [id]: completedSteps }));
                            updateProgress(id, completedSteps);
                            setReports(prev => {
                                const idx = prev.findIndex(r => r.testCaseId === id);
                                const newEntry = { testCaseId: id, connectionId, data,socket };
                                const updated = [...prev];
                                if (idx >= 0) updated[idx] = newEntry;
                                else updated.push(newEntry);
                                return updated;
                            });
                        }

                        if (["testComplete", "testError", "testStopped"].includes(type)) {
                            const msg = payload.message;
                            const finalStatus = type === "testComplete" ? "completed" : type === "testError" ? "failed" : "stopped";
                            const completed = completedStepsMap[id] || 0;
                            
                            updateProgress(id, completed);
                            setLoading(prev => ({ ...prev, [id]: false }));
                            setReports(prev => {
                                const idx = prev.findIndex(r => r.testCaseId === id);
                                const report = prev[idx];
                                const newEntry = {
                                    ...report,
                                    data: [...(report?.data || []), { finalStatus, message: msg }],
                                };
                                const updated = [...prev];
                                if (idx >= 0) updated[idx] = newEntry;
                                else updated.push(newEntry);
                                return updated;
                            });
                            setActiveTests(prev => prev - 1);
                        }

                        if (response && routeKey === "executeTest") {
                            const stepData = response;
                            setReports(prev => {
                                const idx = prev.findIndex(r => r.testCaseId === id);
                                const existingData = idx >= 0 ? prev[idx].data || [] : [];
                                const existingStepIndex = existingData.findIndex((d: any) => d.indexStep === stepData.indexStep);
                                const updatedSteps = [...existingData];
                                if (existingStepIndex >= 0) updatedSteps[existingStepIndex] = stepData;
                                else updatedSteps.push(stepData);
                                updateProgress(id, updatedSteps.length);
                                const updatedReport = { testCaseId: id, connectionId, data: updatedSteps,socket };
                                const updated = [...prev];
                                if (idx >= 0) updated[idx] = updatedReport;
                                else updated.push(updatedReport);
                                return updated;
                            });
                        }
                    } catch (err) {
                        logger("❌ Error procesando mensaje:", event.data);
                    }
                };
            });
        }
    }, [pendingTests, activeTests, maxBrowsers, isHeadless, testData, stopped, completedStepsMap, updateProgress, socketMap]);

    const executeTests = async (selectedCases: any[], testDataInput: any, max: number, headless: boolean) => {
        const initialLoading: Record<string, boolean> = {};
        const initialStopped: Record<string, boolean> = {};
        selectedCases.forEach(tc => {
            const testId = String(tc.testCaseId);
            initialLoading[testId] = true;
            initialStopped[testId] = false;
        });
        setLoading(initialLoading);
        setStopped(initialStopped);
        setError(null);
        setReports([]);
        setIdReports([]);
        setProgress([]);
        setConnectionMap({});
        setPendingTests([...selectedCases]);
        setActiveTests(0);
        setMaxBrowsers(max);
        setIsHeadless(headless);
        setTestData(testDataInput);
        setSocketMap({});
    };

    const stopTest = (testCaseId: string,connectionId:string,socket:any) => {
        const testId = String(testCaseId);        
        if (!socket || socket.readyState !== WebSocket.OPEN) return;
        
        if (!connectionId) return;
        const payload = {
            action: "stopTest",
            testCaseId: testId,
            lambdaID: connectionId,
        };
        socket.send(JSON.stringify(payload));        
        socket.close();

        setStopped(prev => ({ ...prev, [testId]: true }));
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
        stopTest,
        stopped
    };
};