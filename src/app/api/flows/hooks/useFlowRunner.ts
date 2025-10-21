"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import axios from "axios";
import { toast } from "sonner";
import { URL_API_ALB, URL_API_RUNNER } from "@/config";
import { buildExecutedApis } from "../../helpers/buildApisScriptExecution";

type WsMap = Map<string, WebSocket>;

type MsgEntry = {
    ts: number;
    kind: "log" | "progress" | "done" | "error" | "raw";
    payload: any;
};

type RunApisPayload = {
    action: "runApis";
    key: string;
    apis: any[];
    env?: any;
};

export type FlowRunStatus = "idle" | "running" | "done" | "error";
export type FlowResult = { status: FlowRunStatus; messages: MsgEntry[] };

export const useFlowRunner = () => {
    const [messagesResult, setMessagesResult] = useState<Record<string, FlowResult>>({});
    const [runningByFlow, setRunningByFlow] = useState<Record<string, boolean>>({});
    const [error, setError] = useState<string | null>(null);
    const [summariesByFlow, setSummariesByFlow] = useState<Record<string, any>>({});

    const wsRefs = useRef<WsMap>(new Map());

    const appendMessage = useCallback((flowId: string, entry: MsgEntry) => {
        setMessagesResult(prev => {
            const current = prev[flowId] ?? { status: "idle", messages: [] as MsgEntry[] };
            return { ...prev, [flowId]: { ...current, messages: [...current.messages, entry] } };
        });
    }, []);

    const setFlowStatus = useCallback((flowId: string, status: FlowRunStatus) => {
        setMessagesResult(prev => {
            const current = prev[flowId] ?? { status: "idle", messages: [] as MsgEntry[] };
            return { ...prev, [flowId]: { ...current, status } };
        });
    }, []);

    const buildPayloadForFlow = useCallback(async (flowObj: any) => {
        try {
            const { data } = await axios.post(`${URL_API_ALB}apisScripts`, { id: flowObj.id });
            return {
                action: "runApis",
                key: `testFolder/runApis_${flowObj.id}.json`,
                apis: data?.apis,
                env: data?.env,
            };
        } catch (e) {
            console.error("Error building flow payload", e);
            toast.error("Error building payload for flow");
            return null;
        }
    }, []);

    const ensureSocketFor = useCallback((flowId: string, onOpenSend: () => void) => {
        const existing = wsRefs.current.get(flowId);

        if (existing && existing.readyState === WebSocket.OPEN) {
            onOpenSend();
            return;
        }
        if (existing && existing.readyState !== WebSocket.CLOSED) {
            try { existing.close(); } catch { }
        }

        if (!URL_API_RUNNER) {
            setError("WebSocket URL is not configured.");
            toast.error("Runner URL not configured");
            return;
        }

        const ws = new WebSocket(String(URL_API_RUNNER));
        wsRefs.current.set(flowId, ws);

        ws.onopen = () => {
            setRunningByFlow(prev => ({ ...prev, [flowId]: true }));
            setFlowStatus(flowId, "running");
            onOpenSend();
        };

        ws.onmessage = (evt) => {
            try {
                const data = JSON.parse(evt.data);

                // ✅ FIN DE EJECUCIÓN (por flow) CUANDO LLEGA "APIs run completed"
                if (
                    data?.routeKey === "runApis" &&
                    data?.response?.message === "APIs run completed"
                ) {
                    const summary = data?.response?.summary;

                    // guarda el summary si quieres consultarlo luego
                    setSummariesByFlow(prev => ({ ...prev, [flowId]: summary }));

                    // log + marca como done
                    appendMessage(flowId, {
                        ts: Date.now(),
                        kind: "done",
                        payload: { message: "APIs run completed", summary }
                    });
                    setFlowStatus(flowId, "done");
                    setRunningByFlow(prev => ({ ...prev, [flowId]: false }));
                    return; // importante: no sigas procesando este mensaje
                }

                // 🔽 resto de manejo genérico (log/progress/error/raw)
                if (data?.type === "log") {
                    appendMessage(flowId, { ts: Date.now(), kind: "log", payload: data });
                } else if (data?.type === "progress") {
                    appendMessage(flowId, { ts: Date.now(), kind: "progress", payload: data });
                } else if (data?.type === "done" || data?.status === "done") {
                    appendMessage(flowId, { ts: Date.now(), kind: "done", payload: data });
                    setFlowStatus(flowId, "done");
                    setRunningByFlow(prev => ({ ...prev, [flowId]: false }));
                } else if (data?.type === "error" || data?.status === "error") {
                    appendMessage(flowId, { ts: Date.now(), kind: "error", payload: data });
                    setFlowStatus(flowId, "error");
                    setRunningByFlow(prev => ({ ...prev, [flowId]: false }));
                } else {
                    appendMessage(flowId, { ts: Date.now(), kind: "log", payload: data });
                }
            } catch {
                appendMessage(flowId, { ts: Date.now(), kind: "raw", payload: evt.data });
            }
        };


        ws.onerror = (err) => {
            appendMessage(flowId, { ts: Date.now(), kind: "error", payload: { message: "WebSocket error", err } });
            setFlowStatus(flowId, "error");
            setRunningByFlow(prev => ({ ...prev, [flowId]: false }));
        };

        ws.onclose = () => {
            setRunningByFlow(prev => ({ ...prev, [flowId]: false }));
        };
    }, [appendMessage, setFlowStatus]);

    const resetFlows = useCallback((flowIds?: string[]) => {
        if (!flowIds?.length) {
            setMessagesResult({});
            setRunningByFlow({});
            setSummariesByFlow({});
            setError(null);
            return;
        }
        setMessagesResult(prev => {
            const copy = { ...prev };
            for (const id of flowIds) copy[id] = { status: "idle", messages: [] };
            return copy;
        });
        setRunningByFlow(prev => {
            const copy = { ...prev };
            for (const id of flowIds) copy[id] = false;
            return copy;
        });
        setSummariesByFlow(prev => {
            const copy = { ...prev };
            for (const id of flowIds) delete copy[id];
            return copy;
        });
        setError(null);
    }, []);

    const runFlows = useCallback(async (flowIds: string[]) => {
        if (!flowIds?.length) {
            toast.error("Select at least one flow to run");
            return;
        }
        resetFlows(flowIds);
        setMessagesResult(prev => {
            const copy = { ...prev };
            for (const id of flowIds) {
                if (!copy[id]) copy[id] = { status: "idle", messages: [] };
            }
            return copy;
        });

        for (const flowId of flowIds) {
            ensureSocketFor(flowId, async () => {
                try {
                    const ws = wsRefs.current.get(flowId);
                    if (!ws || ws.readyState !== WebSocket.OPEN) {
                        appendMessage(flowId, { ts: Date.now(), kind: "error", payload: { message: "WebSocket not open" } });
                        setFlowStatus(flowId, "error");
                        return;
                    }

                    const { data } = await axios.post(`${URL_API_ALB}apisScripts`, { id: flowId });
                    const payloadObj = {
                        action: "runApis",
                        key: `testFolder/runApis_${flowId}.json`,
                        apis: data?.apis,
                        env: data?.env,
                    };

                    const payloadStr = JSON.stringify(payloadObj);
                    console.log(`[flow:${flowId}] sending payload`, payloadObj);

                    ws.send(payloadStr);

                    appendMessage(flowId, { ts: Date.now(), kind: "log", payload: { message: "Flow started" } });
                    toast.message(`Flow ${flowId} started`);
                } catch (e) {
                    appendMessage(flowId, { ts: Date.now(), kind: "error", payload: { message: "Failed to send payload", e } });
                    setFlowStatus(flowId, "error");
                }
            });
        }
    }, [appendMessage, ensureSocketFor, setFlowStatus]);


    const sendPayload = useCallback(
        async (flowId: string, payload: any, opts?: { reset?: boolean }) => {
            const { reset = true } = opts ?? {};

            if (reset) {
                setMessagesResult(prev => ({ ...prev, [flowId]: { status: "idle", messages: [] } }));
                setRunningByFlow(prev => ({ ...prev, [flowId]: false }));
                setSummariesByFlow(prev => {
                    const copy = { ...prev };
                    delete copy[flowId];
                    return copy;
                });
            }

            ensureSocketFor(flowId, async () => {
                try {
                    const ws = wsRefs.current.get(flowId);
                    if (!ws || ws.readyState !== WebSocket.OPEN) {
                        appendMessage(flowId, {
                            ts: Date.now(),
                            kind: "error",
                            payload: { message: "WebSocket not open" }
                        });
                        setFlowStatus(flowId, "error");
                        return;
                    }

                    const payloadStr = JSON.stringify(payload);
                    console.log(`[flow:${flowId}] sending custom payload`, payload);

                    ws.send(payloadStr);

                    appendMessage(flowId, {
                        ts: Date.now(),
                        kind: "log",
                        payload: { message: "Flow started (custom payload)" }
                    });
                    toast.message(`Flow ${flowId} started`);
                } catch (e) {
                    appendMessage(flowId, {
                        ts: Date.now(),
                        kind: "error",
                        payload: { message: "Failed to send custom payload", e }
                    });
                    setFlowStatus(flowId, "error");
                }
            });
        },
        [appendMessage, ensureSocketFor, setFlowStatus]
    );

    const runSingleFlow = useCallback(async (flowObj: any) => {
        await runFlows([flowObj.id]);
    }, [runFlows]);

    const runSingleFlowWithPayload = useCallback(
        async (flowId: string, payload: any, opts?: { reset?: boolean }) => {
            await sendPayload(flowId, payload, opts);
        },
        [sendPayload]
    );

    const stopFlow = useCallback((flowId: string) => {
        const ws = wsRefs.current.get(flowId);
        if (!ws) return;
        try { ws.close(); } catch { }
        wsRefs.current.delete(flowId);
        setRunningByFlow(prev => ({ ...prev, [flowId]: false }));
        setFlowStatus(flowId, "idle");
        appendMessage(flowId, { ts: Date.now(), kind: "log", payload: { message: "Flow stopped" } });
    }, [appendMessage, setFlowStatus]);

    useEffect(() => {
        return () => {
            for (const ws of wsRefs.current.values()) {
                try { ws.close(); } catch { }
            }
            wsRefs.current.clear();
        };
    }, []);

    const anyRunning = useMemo(() => Object.values(runningByFlow).some(Boolean), [runningByFlow]);

    const getExecutedApis = useCallback((flowId: string) => {
        const msgs = messagesResult?.[flowId]?.messages ?? [];
        return buildExecutedApis(msgs);
    }, [messagesResult]);

    return {
        messagesResult,
        runningByFlow,
        anyRunning,
        error,
        summariesByFlow,
        runFlows,
        runSingleFlow,
        stopFlow,
        getExecutedApis,
        runSingleFlowWithPayload
    };
};
