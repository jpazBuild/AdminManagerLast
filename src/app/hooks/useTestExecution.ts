import { useState, useCallback, useRef, useEffect } from "react";
import { URL_API_ALB, URL_API_RUNNER } from "../../config";
import { logger } from "../../utils/logger";
import axios from "axios";
import { toast } from "sonner";

const sanitizeTestData = (data: any) => {
    const copy = { ...(data || {}) };
    delete (copy as any).screenshot;
    delete (copy as any).htmlContent;
    delete (copy as any).domSnapshot;
    delete (copy as any).logs;
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
    const testDataRef = useRef<any>({});

    useEffect(() => {
        testDataRef.current = testData;
    }, [testData]);

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
                id: testId,
                flatReusableSteps: true,
                includeStepsData: true,
                includeImages: false,
            });
            return response.data;
        } catch (err) {
            console.error("Error fetching test:", err);
            toast.error("Error fetching test data");
            return null;
        }
    };

    const handleTestCompletion = useCallback(
        (testId: string) => {
            console.log(`🏁 Test ${testId} completado`);

            activeTestsRef.current = Math.max(0, activeTestsRef.current - 1);
            runningTestsRef.current.delete(testId);

            setActiveTests(activeTestsRef.current);

            console.log(
                `📊 Slots después de completion: activos=${activeTestsRef.current}/${maxBrowsersRef.current}`
            );

            processQueue();
        },
        []
    );

    const runTestCase = useCallback(
        async (testCase: any) => {
            const testId = String(testCase?.id);

            if (invalidTests[testId] || runningTestsRef.current.has(testId)) {
                console.log(`⏭️ Test ${testId} ya está corriendo o es inválido`);
                return;
            }

            if (!URL_API_RUNNER) {
                logger("❌ URL_API_RUNNER is undefined. Cannot create WebSocket.");
                setError("WebSocket URL is not configured.");
                return;
            }

            console.log(
                `🚀 Iniciando test ${testId}. Slots: ${activeTestsRef.current + 1}/${maxBrowsersRef.current}`
            );

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

            setStepsCountMap(prev => ({ ...prev, [testId]: test?.[0]?.stepsData?.length || 0 }));

            const rawData = testDataRef.current?.[testId] ?? {};
            const hasRaw = rawData && Object.keys(rawData).length > 0;
            console.log(`[${testId}] rawData listo?`, hasRaw, hasRaw ? Object.keys(rawData) : "(vacío)");

            const sanitizedTestData = sanitizeTestData(rawData);

            const payload = {
                action: "executeTest",
                testCaseId: testId,
                isHeadless,
                testCaseName: testCase?.testCaseName || testCase?.name,
                testData: sanitizedTestData,
                temp: false,
            };

            const payloadStr = JSON.stringify(payload);
            if (payloadStr.length > 1_000_000) {
                logger(`🚫 Payload demasiado grande para test ${testId}, cancelando:`, payloadStr.length);
                setError(`Payload too large for test ${testId}, skipping.`);
                handleTestCompletion(testId);
                return;
            }

            const socket = new WebSocket(URL_API_RUNNER);

            socket.onopen = () => {
                console.log(`[${testId}] enviando payload`, { size: payloadStr.length });
                socket.send(payloadStr);
            };

            socket.onerror = error => {
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

            socket.onmessage = event => {
                try {
                    const message = JSON.parse(event.data);
                    console.log(`📥 Mensaje recibido para test ${testId}:`, message);

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
                            const report = idx >= 0 ? prev[idx] : undefined;
                            const updated = [...prev];
                            const newEntry = {
                                ...(report || { testCaseId: id, connectionId, data: [], socket }),
                                data: [...((report?.data as any[]) || []), { finalStatus, message: msg }],
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
        },
        [isHeadless, stopped, updateProgress, stepsCountMap, invalidTests, handleTestCompletion]
    );

    const runTestCaseRef = useRef(runTestCase);
    useEffect(() => {
        runTestCaseRef.current = runTestCase;
    }, [runTestCase]);

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
            runTestCaseRef.current(testCase);
        });

        processingQueueRef.current = false;
    }, []);

    useEffect(() => {
        if (Object.keys(testData).length > 0 && pendingTestsRef.current.length > 0) {
            console.log("🚀 Iniciando procesamiento de la cola (trigger por testData)");
            processQueue();
        }
    }, [testData, processQueue]);

    const executeTests = async (
        selectedCases: any[],
        testDataInput: any,
        max: number,
        headless: boolean
    ) => {
        console.log(`🔍 Iniciando ejecución de ${selectedCases.length} tests con máximo ${max} navegadores`);
        const initialLoading: Record<string, boolean> = {};
        const initialStopped: Record<string, boolean> = {};

        const normalizedData = Object.fromEntries(
            Object.entries(testDataInput || {}).map(([k, v]) => [String(k), v])
        );

        selectedCases.forEach(tc => {
            const testId = String(tc?.id);
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
        setIsHeadless(headless);

        setTestData(normalizedData);
        testDataRef.current = normalizedData;

        activeTestsRef.current = 0;
        runningTestsRef.current = new Set();
        maxBrowsersRef.current = max;
        pendingTestsRef.current = [...selectedCases];
        processingQueueRef.current = false;

        setActiveTests(0);

        console.log(
            `📋 ${selectedCases.length} tests añadidos a la cola con límite de ${max} navegadores`
        );

    };

    const stopTest = (
        testCaseId: string,
        connectionId: string,
        socket: WebSocket | undefined
    ) => {
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
        maxBrowsers: maxBrowsersRef.current,
    };
};