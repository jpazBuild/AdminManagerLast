    // const runTestCase = useCallback((testCase: any) => {
    //     console.log("🔍 Ejecutando test:", testCase);

    //     const testId = String(testCase.id);

    //     if (invalidTests[testId]) return;
    //     if (!URL_API_RUNNER) {
    //         logger("❌ URL_API_RUNNER is undefined. Cannot create WebSocket.");
    //         setError("WebSocket URL is not configured.");
    //         return;
    //     }
    //     console.log("🔗 Conectando al WebSocket:", URL_API_RUNNER);

    //     const socket = new WebSocket(URL_API_RUNNER);
    //     const totalSteps = testCase?.stepsData?.length + 2;

    //     console.log("📊 Total steps for test:", totalSteps);

    //     setActiveTests(prev => prev + 1);
    //     setIdReports(prev => [...prev, testId]);
    //     setStepsCountMap(prev => ({ ...prev, [testId]: totalSteps }));

    //     socket.onopen = () => {
    //         const rawData = testData.data?.[testId];
    //         // if (!rawData) {
    //         //     if (!invalidTests[testId]) {
    //         //         logger(`❌ No test data found for testCaseId ${testId}`);
    //         //         toast.error(`Missing test data for test ${testId}`);
    //         //         setInvalidTests(prev => ({ ...prev, [testId]: true }));
    //         //         setError(`Missing test data for test ${testId}`);
    //         //     }
    //         //     socket.close();
    //         //     setActiveTests(prev => prev - 1);
    //         //     return;
    //         // }

    //         const sanitizedTestData = sanitizeTestData(rawData);
    //         const sanitizedSteps = sanitizeSteps(testCase.stepsData || []);
    //         const getValidUrlSite = (data: Record<string, any>): string | null => {
    //             for (const [key, value] of Object.entries(data)) {
    //                 if (
    //                     key?.startsWith("urlSite") &&
    //                     typeof value === "string" &&
    //                     /^https?:\/\//.test(value)
    //                 ) {
    //                     return value;
    //                 }
    //             }
    //             return null;
    //         };

    //         const resolvedUrl = getValidUrlSite(sanitizedTestData);

    //          const payload = {
    //             action: "executeTest",
    //             testCaseId: testId,
    //             isHeadless,
    //             testCaseName: testCase.testCaseName,
    //             totalSteps,
    //             testData: sanitizedTestData,
    //             dataScenario: {
    //                 contextGeneral: {
    //                     ...testCase.contextGeneral,
    //                     data: {
    //                         ...testCase.contextGeneral.data,
    //                         url: resolvedUrl,
    //                     },
    //                 },
    //                 jsonSteps: sanitizedSteps,
    //             },
    //         };


    //         console.log("📤 Enviando payload al WebSocket:", payload);
    //         if (!resolvedUrl) {
    //             if (!invalidTests[testId]) {
    //                 logger(`❌ Missing or invalid URL in test data for testCaseId ${testId}`);
    //                 toast.error(`Missing or invalid URL in test data for test ${testId}`);
    //                 setInvalidTests(prev => ({ ...prev, [testId]: true }));
    //                 setError(`Invalid URL in test ${testId}`);
    //             }
    //             socket.close();
    //             setActiveTests(prev => prev - 1);
    //             return;
    //         }




    //         const payloadStr = JSON.stringify(payload);
    //         if (payloadStr.length > 1000000) {
    //             logger("🚫 Payload demasiado grande, cancelando envío:", payloadStr.length);
    //             setError(`Payload too large for test ${testId}, skipping.`);
    //             setActiveTests(prev => prev - 1);
    //             socket.close();
    //             return;
    //         }

    //         socket.send(payloadStr);
    //     };

    //     socket.onmessage = (event) => {
    //         try {
    //             const message = JSON.parse(event.data);
    //             console.log("📬 Mensaje recibido:", message);

    //             const { response, routeKey, connectionId, testCaseId } = message;
    //             const id = String(testCaseId);
    //             if (stopped[id]) return;
    //             if (connectionId) {
    //                 setConnectionMap(prev => ({ ...prev, [id]: connectionId }));
    //             }

    //             if (response?.indexStep !== undefined) {
    //                 const stepData = response;
    //                 setReports(prev => {
    //                     const idx = prev.findIndex(r => r.testCaseId === id);
    //                     const existingData = idx >= 0 ? prev[idx].data || [] : [];
    //                     const existingStepIndex = existingData.findIndex((d: any) => d.indexStep === stepData.indexStep);
    //                     const updatedSteps = [...existingData];
    //                     if (existingStepIndex >= 0) updatedSteps[existingStepIndex] = stepData;
    //                     else updatedSteps.push(stepData);
    //                     updateProgress(id, updatedSteps.length);
    //                     const updatedReport = { testCaseId: id, connectionId, data: updatedSteps, socket };
    //                     const updated = [...prev];
    //                     if (idx >= 0) updated[idx] = updatedReport;
    //                     else updated.push(updatedReport);
    //                     return updated;
    //                 });
    //             }

    //             if (
    //                 routeKey === "executeTest" &&
    //                 response?.action &&
    //                 (response.action === "Test execution completed" || response.action === "Test execution failed")
    //             ) {
    //                 const finalStatus = response.action === "Test execution completed" ? "completed" : "failed";
    //                 const msg = response?.description || "Test finalizado.";
    //                 const completed = completedStepsMap[id] || 0;

    //                 updateProgress(id, completed);
    //                 setLoading(prev => ({ ...prev, [id]: false }));
    //                 setReports(prev => {
    //                     const idx = prev.findIndex(r => r.testCaseId === id);
    //                     const report = prev[idx];
    //                     const updated = [...prev];
    //                     const newEntry = {
    //                         ...report,
    //                         data: [...(report?.data || []), { finalStatus, message: msg }],
    //                     };
    //                     if (idx >= 0) updated[idx] = newEntry;
    //                     else updated.push(newEntry);
    //                     return updated;
    //                 });

    //                 socket.close();
    //                 setActiveTests(prev => prev - 1);
    //             }
    //         } catch (err) {
    //             logger("❌ Error procesando mensaje:", event.data);
    //         }
    //     };
    // }, [isHeadless, testData, stopped, updateProgress]);




import { useEffect, useState, useCallback } from "react";
import { URL_API_RUNNER } from "../../config";
import { logger } from "../../utils/logger";
import { toast } from "sonner";

const sanitizeTestData = (data: any) => {
    const copy = { ...data };
    delete copy.screenshot;
    delete copy.htmlContent;
    delete copy.domSnapshot;
    delete copy.logs;
    return copy;
};

const sanitizeSteps = (steps: any[]) =>
    steps.map(step => {
        const newStep = { ...step };
        delete newStep.screenshot;
        delete newStep.domSnapshot;
        delete newStep.htmlContent;
        delete newStep.logs;
        return newStep;
    });

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
    const [invalidTests, setInvalidTests] = useState<Record<string, boolean>>({});
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


    const runTestCase = useCallback((testCase: any) => {
        console.log("🔍 Ejecutando test:", testCase);

        const testId = String(testCase.id);

        if (invalidTests[testId]) return;
        if (!URL_API_RUNNER) {
            logger("❌ URL_API_RUNNER is undefined. Cannot create WebSocket.");
            setError("WebSocket URL is not configured.");
            return;
        }
        console.log("🔗 Conectando al WebSocket:", URL_API_RUNNER);

        const socket = new WebSocket(URL_API_RUNNER);

        setActiveTests(prev => prev + 1);
        setIdReports(prev => [...prev, testId]);
        setStepsCountMap(prev => ({ ...prev, [testId]: (testCase.stepsData?.length || 0) }));

        socket.onopen = () => {
            const rawData = testData.data?.[testId] || {};
            const sanitizedTestData = sanitizeTestData(rawData);

            const payload = {
                action: "executeTest",
                testCaseId: testId,
                isHeadless,
                testCaseName: testCase.testCaseName,
                testData: sanitizedTestData,
                temp: false
            };

            console.log("📤 Enviando payload simplificado al WebSocket:", payload);

            const payloadStr = JSON.stringify(payload);
            if (payloadStr.length > 1000000) {
                logger("🚫 Payload demasiado grande, cancelando envío:", payloadStr.length);
                setError(`Payload too large for test ${testId}, skipping.`);
                setActiveTests(prev => prev - 1);
                socket.close();
                return;
            }

            socket.send(payloadStr);
        };

        socket.onmessage = (event) => {
            try {
                const message = JSON.parse(event.data);
                console.log("📬 Mensaje recibido:", message);

                const { response, routeKey, connectionId, testCaseId } = message;
                const id = String(testCaseId);
                if (stopped[id]) return;

                if (connectionId) {
                    setConnectionMap(prev => ({ ...prev, [id]: connectionId }));
                }

                if (response?.indexStep !== undefined) {
                    const stepData = response;
                    setReports(prev => {
                        const idx = prev.findIndex(r => r.testCaseId === id);
                        const existingData = idx >= 0 ? prev[idx].data || [] : [];
                        const existingStepIndex = existingData.findIndex((d: any) => d.indexStep === stepData.indexStep);
                        const updatedSteps = [...existingData];
                        if (existingStepIndex >= 0) updatedSteps[existingStepIndex] = stepData;
                        else updatedSteps.push(stepData);
                        updateProgress(id, updatedSteps.length);
                        const updatedReport = { testCaseId: id, connectionId, data: updatedSteps, socket };
                        const updated = [...prev];
                        if (idx >= 0) updated[idx] = updatedReport;
                        else updated.push(updatedReport);
                        return updated;
                    });
                }

                if (
                    routeKey === "executeTest" &&
                    response?.action &&
                    (response.action === "Test execution completed" || response.action === "Test execution failed")
                ) {
                    const finalStatus = response.action === "Test execution completed" ? "completed" : "failed";
                    const msg = response?.description || "Test finalizado.";

                    updateProgress(id, stepsCountMap[id] || 0);
                    setLoading(prev => ({ ...prev, [id]: false }));
                    setReports(prev => {
                        const idx = prev.findIndex(r => r.testCaseId === id);
                        const report = prev[idx];
                        const updated = [...prev];
                        const newEntry = {
                            ...report,
                            data: [...(report?.data || []), { finalStatus, message: msg }],
                        };
                        if (idx >= 0) updated[idx] = newEntry;
                        else updated.push(newEntry);
                        return updated;
                    });

                    socket.close();
                    setActiveTests(prev => prev - 1);
                }
            } catch (err) {
                logger("❌ Error procesando mensaje:", event.data);
            }
        };
    }, [isHeadless, testData, stopped, updateProgress, stepsCountMap]);

    useEffect(() => {
        const availableSlots = maxBrowsers - activeTests;
        if (pendingTests.length > 0 && availableSlots > 0) {
            const nextTests = pendingTests.slice(0, availableSlots);
            nextTests.forEach(runTestCase);
            setPendingTests(prev => prev.slice(nextTests.length));
        }
    }, [activeTests, pendingTests, maxBrowsers, runTestCase]);

    const executeTests = async (selectedCases: any[], testDataInput: any, max: number, headless: boolean) => {
        const initialLoading: Record<string, boolean> = {};
        const initialStopped: Record<string, boolean> = {};
        console.log("🔍 Ejecutando múltiples tests:", selectedCases);
        
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
        setStepsCountMap({});
        setCompletedStepsMap({});
        setTestData(testDataInput);
        setActiveTests(0);
        setMaxBrowsers(max);
        setIsHeadless(headless);
        setPendingTests([...selectedCases]);
    };

    const stopTest = (testCaseId: string, connectionId: string, socket: WebSocket | undefined) => {
        setLoading(prev => ({ ...prev, [testId]: false }));
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
        setLoading(prev => ({ ...prev, [testId]: false }));
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
        stopped,
        setStopped,
        setLoading
    };
};
