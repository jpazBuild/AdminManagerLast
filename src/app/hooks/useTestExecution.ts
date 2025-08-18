import { useState, useCallback, useRef } from "react";
import { URL_API_ALB, URL_API_RUNNER } from "../../config";
import { logger } from "../../utils/logger";
import axios from "axios";
import { toast } from "sonner";

const sanitizeTestData = (data: any) => {
    const copy = { ...data };
    delete copy.screenshot;
    delete copy.htmlContent;
    delete copy.domSnapshot;
    delete copy.logs;
    return copy;
};

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
    const [isHeadless, setIsHeadless] = useState(true);
    const [testData, setTestData] = useState<any>({});

    const pendingTestsRef = useRef<any[]>([]);
    const maxBrowsersRef = useRef<number>(1);
    const activeTestsRef = useRef<number>(0);
    const runningTestsRef = useRef<Set<string>>(new Set());
    const processingQueueRef = useRef<boolean>(false);

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

    const getTestWithId = async (testId: string) => {
        try {
            const response = await axios.post(`${URL_API_ALB}tests`, {
                "id": testId,
                "flatReusableSteps": true,
                "includeStepsData": true,
                "includeImages": false
            });
            return response.data;
        } catch (err) {
            console.error("Error fetching test:", err);
            toast.error("Error fetching test data");
            return null;
        }
    }

    const processQueue = useCallback(() => {
        if (processingQueueRef.current) {
            console.log("⏸️ Ya se está procesando la cola, saltando...");
            return;
        }

        const activeCount = activeTestsRef.current;
        const maxBrowsers = maxBrowsersRef.current;
        const pendingTests = pendingTestsRef.current;
        const availableSlots = maxBrowsers - activeCount;


        if (pendingTests.length === 0 || availableSlots <= 0) {
            console.log("⭐ No hay tests pendientes o no hay slots disponibles");
            return;
        }

        processingQueueRef.current = true;

        const testsToRun = pendingTests.splice(0, availableSlots);
        console.log(`🚀 Ejecutando ${testsToRun.length} tests, quedan ${pendingTests.length} en cola`);

        testsToRun.forEach((testCase, index) => {
            console.log(`🎯 Iniciando test ${index + 1}/${testsToRun.length}: ${testCase.id}`);
            runTestCase(testCase);
        });

        processingQueueRef.current = false;
    }, []);

    const handleTestCompletion = useCallback((testId: string) => {
        console.log(`🏁 Test ${testId} completado`);
        
        activeTestsRef.current = Math.max(0, activeTestsRef.current - 1);
        runningTestsRef.current.delete(testId);
        
        setActiveTests(activeTestsRef.current);
        
        console.log(`📊 Slots después de completion: activos=${activeTestsRef.current}/${maxBrowsersRef.current}`);
        
        setTimeout(() => processQueue(), 100);
    }, [processQueue]);

    const runTestCase = useCallback(async (testCase: any) => {
        const testId = String(testCase.id);
        
        if (invalidTests[testId] || runningTestsRef.current.has(testId)) {
            console.log(`⏭️ Test ${testId} ya está corriendo o es inválido`);
            return;
        }

        if (!URL_API_RUNNER) {
            logger("❌ URL_API_RUNNER is undefined. Cannot create WebSocket.");
            setError("WebSocket URL is not configured.");
            return;
        }

        console.log(`🚀 Iniciando test ${testId}. Slots: ${activeTestsRef.current + 1}/${maxBrowsersRef.current}`);
        
        activeTestsRef.current += 1;
        runningTestsRef.current.add(testId);
        
        setActiveTests(activeTestsRef.current);
        setIdReports(prev => [...prev, testId]);

        const test = await getTestWithId(testId);
        if (!test) {
            console.error(`❌ No se pudo obtener datos del test ${testId}`);
            handleTestCompletion(testId);
            return;
        }

        setStepsCountMap(prev => ({ ...prev, [testId]: (test[0]?.stepsData?.length || 0) }));

        const socket = new WebSocket(URL_API_RUNNER);

        socket.onopen = () => {            
            const rawData = testData?.data?.[testId] || {};
            
            const sanitizedTestData = sanitizeTestData(rawData);

            const payload = {
                action: "executeTest",
                testCaseId: testId,
                isHeadless,
                testCaseName: testCase?.testCaseName || testCase?.name,
                testData: rawData,
                temp: false
            };            
            console.log(`📤 Enviando payload para test ${testId} ${payload}`);

            const payloadStr = JSON.stringify(payload);
            if (payloadStr.length > 1000000) {
                logger(`🚫 Payload demasiado grande para test ${testId}, cancelando:`, payloadStr.length);
                setError(`Payload too large for test ${testId}, skipping.`);
                handleTestCompletion(testId);
                socket.close();
                return;
            }

            socket.send(payloadStr);
        };

        socket.onerror = (error) => {
            console.error(`❌ Error en WebSocket para test ${testId}:`, error);
            handleTestCompletion(testId);
            setLoading(prev => ({ ...prev, [testId]: false }));
        };

        socket.onclose = () => {
            console.log(`🔌 WebSocket cerrado para test ${testId}`);
            if (runningTestsRef.current.has(testId)) {
                handleTestCompletion(testId);
            }
        };

        socket.onmessage = (event) => {
            try {
                const message = JSON.parse(event.data);
                const { response, routeKey, connectionId, testCaseId } = message;
                const id = String(testCaseId);
                
                if (stopped[id]) {
                    console.log(`⏹️ Test ${id} marcado como detenido`);
                    socket.close();
                    return;
                }

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
                        
                        if (existingStepIndex >= 0) {
                            updatedSteps[existingStepIndex] = stepData;
                        } else {
                            updatedSteps.push(stepData);
                        }
                        
                        updateProgress(id, updatedSteps.length);
                        const updatedReport = { testCaseId: id, connectionId, data: updatedSteps, socket };
                        const updated = [...prev];
                        
                        if (idx >= 0) {
                            updated[idx] = updatedReport;
                        } else {
                            updated.push(updatedReport);
                        }
                        
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

                    console.log(`✅ Test ${id} ${finalStatus}: ${msg}`);

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
                        
                        if (idx >= 0) {
                            updated[idx] = newEntry;
                        } else {
                            updated.push(newEntry);
                        }
                        
                        return updated;
                    });

                    socket.close();
                }
            } catch (err) {
                console.error("❌ Error procesando mensaje:", event.data, err);
            }
        };
    }, [isHeadless, testData, stopped, updateProgress, stepsCountMap, invalidTests, handleTestCompletion]);

    const executeTests = async (selectedCases: any[], testDataInput: any, max: number, headless: boolean) => {
        console.log(`🔍 Iniciando ejecución de ${selectedCases.length} tests con máximo ${max} navegadores`);
        
        const initialLoading: Record<string, boolean> = {};
        const initialStopped: Record<string, boolean> = {};
        
        selectedCases.forEach(tc => {
            const testId = String(tc.id);
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
        setIsHeadless(headless);
        
        activeTestsRef.current = 0;
        runningTestsRef.current = new Set();
        maxBrowsersRef.current = max;
        pendingTestsRef.current = [...selectedCases];
        processingQueueRef.current = false;
        
        setActiveTests(0);
        
        console.log(`📋 ${selectedCases.length} tests añadidos a la cola con límite de ${max} navegadores`);
        
        setTimeout(() => {
            console.log(`🚀 Iniciando procesamiento de la cola`);
            processQueue();
        }, 100);
    };

    const stopTest = (testCaseId: string, connectionId: string, socket: WebSocket | undefined) => {
        const testId = String(testCaseId);
        console.log(`⏹️ Deteniendo test ${testId}`);
        
        setLoading(prev => ({ ...prev, [testId]: false }));
        setStopped(prev => ({ ...prev, [testId]: true }));
        
        if (!socket || socket.readyState !== WebSocket.OPEN) {
            handleTestCompletion(testId);
            return;
        }
        
        if (!connectionId) {
            socket.close();
            return;
        }

        const payload = {
            action: "stopTest",
            testCaseId: testId,
            lambdaID: connectionId,
        };
        
        try {
            socket.send(JSON.stringify(payload));
            socket.close();
        } catch (error) {
            console.error(`❌ Error enviando comando de stop para test ${testId}:`, error);
            socket.close();
        }
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
        setLoading,
        activeTests,
        pendingTests: pendingTestsRef.current.length,
        maxBrowsers: maxBrowsersRef.current
    };
};