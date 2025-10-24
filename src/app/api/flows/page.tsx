"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { DashboardHeader } from "@/app/Layouts/main";
import CollectionsAside from "../collections/components/SideCollections";
import { useFetchElementsPostman } from "../collections/hooks/useFetchElementsPostman";
import { useFetchCollection } from "../collections/hooks/useFetchCollection";
import { httpMethodsStyle } from "../utils/colorMethods";
import CollectionTree from "../collections/components/CollectionTree";
import Image from "next/image";
import Flows from "../../../assets/iconsSides/flows.svg";
import CollectionMain from "../collections/components/CollectionMain";
import { Hash, RefreshCcw } from "lucide-react";
import axios from "axios";
import { URL_API_ALB } from "@/config";
import { toast } from "sonner";
import { useFlowRunner } from "./hooks/useFlowRunner";
import { FaXmark } from "react-icons/fa6";
import { Detail, ExecPiece, FlowNode, ModalTab, Stage } from "@/types/types";
import FlowCanvas from "./components/FlowCanvas";
import RequestDetails from "./components/RequestDetails";
import ModalBackCanvas from "./components/ModalBackCanvas";
import ModalRenderChips from "./components/ModalRenderChips";
import ListFlows from "./components/ListFlows";
import EnvEditor from "./components/EnvEditor";
import SelectInFlows from "./components/SelectInFlows";

const CUSTOM_ENV_ID = "__custom__";

type IterationRow = {
    iterationCount: number;
    id: string;
    createdBy: string;
    iterationData: Record<string, any>;
    order: number;
    apisScriptsName: string;
};

function formatIterationDataAll(
    rows: IterationRow[]
): { iterationData: Record<string, Record<string, any>> } {
    const sorted = [...rows].sort((a, b) => a.order - b.order);

    const out: Record<string, Record<string, any>> = {};
    for (const r of sorted) {
        out[`iteration${r.order}`] = r.iterationData ?? {};
    }

    return { iterationData: out };
}


const FlowsPage: React.FC = () => {
    const [selectedTypeOrigin, setSelectedTypeOrigin] = useState<string | null>(null);
    const [selectedWorkspaceId, setSelectedWorkspaceId] = useState<string | null>(null);
    const [collectionQuery, setCollectionQuery] = useState<string>("");
    const [openCollection, setOpenCollection] = useState<Record<string, boolean>>({});
    const [loadingByCollection, setLoadingByCollection] = useState<Record<string, boolean>>({});
    const { elements: elementsPostman,loading:loadingElements } = useFetchElementsPostman();
    const { getCollection, cache: collectionsCache, error: collectionError } = useFetchCollection();
    const typeOrigin = useMemo(() => [{ name: "Postman" }, { name: "BD" }], []);
    const [dataDetailCollections, setDataDetailCollections] = useState<Detail[]>([]);
    const dataDetailByUid = useMemo<Record<string, Detail>>(
        () => Object.fromEntries(dataDetailCollections.map((dc) => [dc.uid, dc])),
        [dataDetailCollections]
    );

    const [selectedEnvironment, setSelectedEnvironment] = useState<any>(null);
    const [customEnv, setCustomEnv] = useState<{ name: string; env: Record<string, string> } | null>(null);

    const [flow, setFlow] = useState<FlowNode[]>([]);
    const [activeNodeId, setActiveNodeId] = useState<string | null>(null);
    const view: "canvas" | "details" = activeNodeId ? "details" : "canvas";
    const [environments, setEnvironments] = useState<any[]>([]);
    const [flows, setFlows] = useState<any>([]);
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [createNewFlowOpen, setCreateNewFlowOpen] = useState<boolean>(false);
    const [loadingFlows, setLoadingFlows] = useState<boolean | null>(null);
    const [rows, setRows] = useState<any[]>([]);
    const [modalSureBackListFlows, setModalSureBackListFlows] = useState<boolean>(false);
    const [expandedFlows, setExpandedFlows] = useState<Record<string, boolean>>({});
    const [chipModal, setChipModal] = useState<{ open: boolean; flowId: string | null; apiName: string | null; stage: Stage; tab: ModalTab; }>({ open: false, flowId: null, apiName: null, stage: "request", tab: "metadata" });
    const [errorFlows, setErrorFlows] = useState<boolean>(false);
    const [selectedIterationData, setSelectedIterationData] = useState<any>(null);
    const [modalCreateFlowOpen, setModalCreateFlowOpen] = useState<boolean>(false);
    const [selectCountsInFlows, setSelectCountsInFlows] = useState<any>(null);
    const [envEditorState, setEnvEditorState] = useState<{
        open: boolean;
        editingId: string | null;
        initialName?: string;
        initialEnv?: Record<string, string>;
    }>({ open: false, editingId: null });
    const [savingEnv, setSavingEnv] = useState(false);
    const activeNode = activeNodeId ? flow.find((n) => n.id === activeNodeId) ?? null : null;

    const openChipModal = (flowId: string, apiName: string, stage: Stage) => setChipModal({ open: true, flowId, apiName, stage, tab: "metadata" });
    const closeChipModal = () => setChipModal(prev => ({ ...prev, open: false }));

    const { runFlows, anyRunning, messagesResult, runSingleFlowWithPayload } = useFlowRunner();

    const fetchEnvironments = async () => {
        const response = await axios.post(`${URL_API_ALB}envs`, {});
        setEnvironments(response.data);
    };

    const fetchFlows = async () => {
        try {
            setLoadingFlows(true);
            const response = await axios.post(`${URL_API_ALB}getApisScriptsHeaders`, {});
            setFlows(response.data);
            setErrorFlows(false);
        } catch {
            toast.error("Error in get flows");
            setErrorFlows(true);
        } finally {
            setLoadingFlows(false);
        }
    };

    const fetchIterationData = async () => {
        try {
            const response = await axios.post(`${URL_API_ALB}getIterationDataHeaders`, {});
            setRows(response.data);
        } catch {
            toast.error("Error fetching iterations data");
            setRows([]);
        }
    };

    useEffect(() => { fetchIterationData(); }, []);
    useEffect(() => { fetchFlows(); }, []);
    useEffect(() => { fetchEnvironments(); }, []);
    useEffect(() => { if (selectedTypeOrigin === "BD") setSelectedWorkspaceId(null); }, [selectedTypeOrigin]);

    const resolvedTeamIdForApi = useMemo(() => {
        const teams = elementsPostman?.teams ?? [];
        if (!teams.length) return undefined;
        const teamWithWS = teams.find((team: any) => team?.workspaces?.some((ws: any) => String(ws.id ?? ws.uid ?? ws.workspaceId) === String(selectedWorkspaceId)));
        return teamWithWS?.teamId ?? teams[0].teamId;
    }, [elementsPostman, selectedWorkspaceId]);

    const handleOpenCollection = async (collection: any) => {
        const name = String(collection?.name ?? "");
        const uid = String(collection?.uid ?? collection?.id ?? collection?.collectionUid ?? "");
        const willOpen = !openCollection[name];
        setOpenCollection((prev) => ({ ...prev, [name]: willOpen }));
        if (!willOpen) return;
        if (selectedTypeOrigin !== "Postman") return;
        if (!uid) return;
        if (!resolvedTeamIdForApi) return;
        if (loadingByCollection[name]) return;

        const cacheKeyWithTeam = `${resolvedTeamIdForApi}:${uid}`;
        const cacheKeyUidOnly = uid;
        const cached = collectionsCache?.[cacheKeyWithTeam] ?? collectionsCache?.[cacheKeyUidOnly];

        const pushToStack = (data: any) => {
            setDataDetailCollections((prev) => {
                const exists = prev.some((x) => x.key === cacheKeyWithTeam || x.key === cacheKeyUidOnly || x.uid === uid);
                if (exists) return prev;
                return [{ key: cacheKeyWithTeam, uid, name, teamId: resolvedTeamIdForApi!, data }, ...prev];
            });
        };

        try {
            if (cached) { pushToStack(cached); return; }
            setLoadingByCollection((prev) => ({ ...prev, [name]: true }));
            const resp = await getCollection({ teamId: resolvedTeamIdForApi as any, collectionUid: uid });
            const data = resp?.data ?? resp;
            pushToStack(data);
        } catch { } finally { setLoadingByCollection((prev) => ({ ...prev, [name]: false })); }
    };

    const renderCollectionTree = useCallback(
        (colDetail: any, colUid: string, colName: string) => (
            <CollectionTree
                colDetail={colDetail}
                colUid={colUid}
                colName={colName}
                httpMethodsStyle={httpMethodsStyle}
                onSelectRequest={({ colName, method, displayName, node }) => {
                    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
                    const defaultUrl = node?.request?.url?.raw ?? `http://localhost:3000/api/${colName.toLowerCase().replace(/\s+/g, "-")}`;
                    setFlow((prev) => [...prev, { id, name: displayName, method, url: defaultUrl, rawNode: node }]);
                }}
            />
        ),
        []
    );

    const openNode = (id: string) => setActiveNodeId(id);
    const backToCanvas = () => setActiveNodeId(null);
    const updateNode = (id: string, patch: Partial<FlowNode>) => setFlow((prev) => prev.map((n) => (n.id === id ? { ...n, ...patch } : n)));
    const removeNode = (id: string) => { setFlow((prev) => prev.filter((n) => n.id !== id)); if (activeNodeId === id) setActiveNodeId(null); };

    const dataEnvironment = useMemo(() => {
        if (selectedEnvironment === CUSTOM_ENV_ID) return customEnv?.env ?? null;
        return environments.find((env) => env.id === selectedEnvironment)?.env ?? null;
    }, [environments, selectedEnvironment, customEnv]);

    const environmentInfo = useMemo(() => environments.find((e) => e.name === envEditorState.initialName) ?? null, [environments, envEditorState.initialName]);

    const dataIterionData = useMemo(() => {
        if (!selectedIterationData) return null;
        const row = rows.find((r) => r.id === selectedIterationData);
        return row ?? null;
    }, [rows, selectedIterationData]);

    const buildPayloadFromCanvas = async () => {
        const envForRunner = dataEnvironment || {};
        const apis = flow.map((n) => {
            const rn = n.rawNode ?? {};
            const request = rn?.request ?? {};
            return {
                ...rn,
                name: n.name ?? rn.name,
                request: {
                    ...request,
                    method: (n.method || request.method || "GET").toUpperCase(),
                    url: { ...(request.url ?? {}), raw: n.url ?? request.url?.raw ?? "" },
                },
            };
        });

        const iterationData: any = await (async () => {
            if (!selectedIterationData) return null;
            try {
                const { data } = await axios.post(`${URL_API_ALB}iterationData`, { id: selectedIterationData });
                const rows = data?.iterationData ?? [];
                return formatIterationDataAll(rows);
            } catch {
                toast.error("No se pudo obtener el Iteration Data");
                return null;
            }
        })();

        const flowId = "flow-execution";
        const payload = {
            action: "runApis" as const, apis,
            env: envForRunner,
            iterationData: iterationData?.iterationData
        };
        if (iterationData === null) delete payload.iterationData;
        return { flowId, payload };
    };

    const sendFlow = async () => {
        try {
            if (!flow.length) { toast.error("Add at least one API to the flow"); return; }
            const result = await buildPayloadFromCanvas();
            if (!result) { toast.error("Error building payload from canvas"); return; }
            const { flowId, payload } = result;
            setSelectedIds((prev) => new Set([...Array.from(prev), flowId]));
            await runSingleFlowWithPayload(flowId, payload);
        } catch {
            toast.error("Error running flow");
        }
    };

    const [query, setQuery] = useState<string>("");
    const onOpen = (flowId: string) => { };
    const onRowMenu = (flowId: string, anchor: HTMLElement) => { };
    const closeRowMenu = () => { };

    const filteredFlows = useMemo(() => {
        const q = query.trim().toLowerCase();
        if (!q) return flows;
        return flows.filter((f: any) => f.name.toLowerCase().includes(q));
    }, [flows, query]);

    const onToggleSelect = (flowId: string, checked: boolean) => {
        setSelectedIds(prev => {
            const next = new Set(prev);
            if (checked) next.add(flowId); else next.delete(flowId);
            return next;
        });
    };

    const allVisibleSelected = filteredFlows.length > 0 && filteredFlows.every((f: any) => selectedIds.has(f.id));
    const onToggleSelectAllVisible = (checked: boolean) => {
        setSelectedIds(prev => {
            const next = new Set(prev);
            if (checked) filteredFlows.forEach((f: any) => next.add(f.id)); else filteredFlows.forEach((f: any) => next.delete(f.id));
            return next;
        });
    };

    const executedByFlow = useMemo<Record<string, ExecPiece[]>>(() => {
        const out: Record<string, ExecPiece[]> = {};
        for (const flowId of Array.from(selectedIds)) {
            const msgs = (messagesResult[flowId]?.messages ?? []).slice().sort((a, b) => a.ts - b.ts);
            const byName: Record<string, ExecPiece> = {};
            const ensure = (name?: string | null): ExecPiece | null => { if (!name) return null; if (!byName[name]) byName[name] = { name }; return byName[name]; };
            for (const m of msgs) {
                const resp = m?.payload?.response;
                const item = m?.payload?.item;
                if (typeof item === "string") {
                    let match = item.match(/^(?:Running request|Request completed):\s*(.+)$/i);
                    if (match?.[1]) { const e = ensure(match[1].trim()); if (e && /^Running request:/i.test(item)) e.request = e.request ?? { success: undefined, status: null, detail: {} }; }
                    match = item.match(/^(?:Running test script|Test script completed):\s*(.+)$/i);
                    if (match?.[1]) { const e = ensure(match[1].trim()); if (e && /^Running test script:/i.test(item)) e.test = e.test ?? { success: undefined, detail: {} }; }
                }
                if (resp && (resp.name || resp.type)) {
                    const rName: string | null = resp.name ?? null;
                    const rType: string | null = resp.type ?? null;
                    if (rName && rType === "request") {
                        const e = ensure(rName); if (!e) continue;
                        const prevReq = e.request ?? { success: undefined, status: null, detail: {} };
                        e.request = { success: typeof resp.success === "boolean" ? resp.success : prevReq.success, status: typeof resp.status === "number" ? resp.status : prevReq.status, detail: { ...(prevReq.detail ?? {}), request: resp.request, response: resp.response, env: resp.env } };
                    }
                    if (rName && rType === "script" && resp.listen === "test") {
                        const e = ensure(rName); if (!e) continue;
                        const prevTest = e.test ?? { success: undefined, detail: {} };
                        e.test = { success: typeof resp.success === "boolean" ? resp.success : prevTest.success, detail: { ...(prevTest.detail ?? {}), ...resp } };
                    }
                }
            }
            out[flowId] = Object.values(byName);
        }
        return out;
    }, [selectedIds, messagesResult]);

    const toggleFlowExpanded = (id: string) => setExpandedFlows(prev => ({ ...prev, [id]: !(prev[id] ?? true) }));

    const flowStatuses = useMemo(() => {
        const statuses: Record<string, "success" | "failed" | "pending"> = {};
        for (const flowId of Array.from(selectedIds)) {
            const fr = messagesResult?.[flowId];
            if (fr?.status === "error") { statuses[flowId] = "failed"; continue; }
            if (fr?.status === "running") { statuses[flowId] = "pending"; }
            const pieces = executedByFlow[flowId] ?? [];
            if (!pieces.length) { statuses[flowId] = statuses[flowId] ?? "pending"; continue; }
            const hasFail = pieces.some(p => p.request?.success === false || p.test?.success === false);
            const allOk = pieces.length > 0 && pieces.every(p => (p.request ? p.request.success === true : true) && (p.test ? p.test.success === true : true));
            statuses[flowId] = hasFail ? "failed" : allOk ? "success" : "pending";
        }
        return statuses;
    }, [selectedIds, executedByFlow, messagesResult]);

    const { totalSuccess, totalFailed, totalPending, successRate } = useMemo(() => {
        let s = 0, f = 0, p = 0;
        for (const id of Object.keys(flowStatuses)) {
            const st = flowStatuses[id];
            if (st === "success") s++; else if (st === "failed") f++; else p++;
        }
        const total = s + f + p;
        const rate = total ? Math.round((s / total) * 100) : 0;
        return { totalSuccess: s, totalFailed: f, totalPending: p, successRate: rate };
    }, [flowStatuses]);

    const backToListFlows = () => { if (flow.length > 0) setModalSureBackListFlows(true); if (flow.length === 0) setCreateNewFlowOpen(false); };

    const buildSingleFlowOrderedResult = useCallback(() => {
        const fr = messagesResult?.["flow-execution"];
        if (!fr) return null;
        const orderedMsgs = (fr.messages ?? []).slice().sort((a, b) => a.ts - b.ts);
        return { ["flow-execution"]: { status: fr.status, messages: orderedMsgs } };
    }, [messagesResult]);

    const singleFlowResponseJson = useMemo(() => {
        const packed = buildSingleFlowOrderedResult();
        return packed ? JSON.stringify(packed, null, 4) : undefined;
    }, [buildSingleFlowOrderedResult]);

    const openCreateCustomEnv = () => {
        if (!customEnv) setCustomEnv({ name: "Custom environment", env: { Default: "Default" } });
        setSelectedEnvironment(CUSTOM_ENV_ID);
        setEnvEditorState({
            open: true,
            editingId: null,
            initialEnv: customEnv?.env ?? { Default: "Default" },
            initialName: customEnv?.name ?? "Custom environment",
        });
    };

    const openEditEnv = (envId: string) => {
        if (envId === CUSTOM_ENV_ID) {
            setEnvEditorState({
                open: true,
                editingId: null,
                initialEnv: customEnv?.env ?? { Default: "Default" },
                initialName: customEnv?.name ?? "Custom environment",
            });
            setSelectedEnvironment(CUSTOM_ENV_ID);
            return;
        }
        const env = environments.find((e) => e.id === envId);
        if (!env) return;
        setEnvEditorState({
            open: true,
            editingId: env.id,
            initialEnv: env.env ?? {},
            initialName: env.name ?? "",
        });
    };

    const closeEnvEditor = () => setEnvEditorState({ open: false, editingId: null });

    const saveEnv = async (payload: { name: string; env: Record<string, string>; updatedBy: string }) => {
        try {
            setSavingEnv(true);
            if (!envEditorState.editingId) {
                setCustomEnv({ name: payload.name || "Custom environment", env: payload.env || {} });
                setSelectedEnvironment(CUSTOM_ENV_ID);
                closeEnvEditor();
                return;
            }
            await axios.patch(`${URL_API_ALB}envs`, {
                id: envEditorState.editingId,
                name: payload.name,
                env: payload.env,
                updatedBy: payload.updatedBy,
            });
            await fetchEnvironments();
            closeEnvEditor();
        } catch {
            toast.error("Error saving environment");
        } finally {
            setSavingEnv(false);
        }
    };

    const handleEditEnv = (envId: string) => {
        if (envId === CUSTOM_ENV_ID) {
            setEnvEditorState({
                open: true,
                editingId: null,
                initialEnv: customEnv?.env ?? { Default: "Default" },
                initialName: customEnv?.name ?? "Custom environment",
            });
            setSelectedEnvironment(CUSTOM_ENV_ID);
            return;
        }
        const env = environments.find((e) => e.id === envId);
        if (!env) return;
        setEnvEditorState({
            open: true,
            editingId: env.id,
            initialEnv: env.env ?? {},
            initialName: env.name ?? "",
        });
    };

    const countOptions = useMemo(() => Array.from({ length: 100 }, (_, i) => ({ id: i + 1, name: String(i + 1) })), []);

    return (
        <DashboardHeader pageType="api" hiddenSide={modalCreateFlowOpen || chipModal.open || modalSureBackListFlows}>
            {loadingFlows != null && loadingFlows && !errorFlows && (
                <div className="flex w-full items-center justify-center p-4 flex-col gap-2">
                    <div className="animate-pulse flex flex-col gap-4 w-full lg:w-2/3">
                        <div className="flex items-center gap-2">
                            <div className="h-12 bg-gray-300 rounded-md w-full"></div>
                            <div className="h-12 bg-gray-300 rounded-2xl w-32"></div>
                        </div>
                        <div className="flex gap-2">
                            <div className="h-6 bg-gray-300 rounded w-6 mb-2"></div>
                            <div className="h-6 bg-gray-300 rounded w-32 mb-2"></div>
                        </div>
                        <div className="space-y-2">{[...Array(5)].map((_, i) => (<div key={i} className="h-32 bg-gray-300 rounded"></div>))}</div>
                    </div>
                </div>
            )}

            {loadingFlows != null && !loadingFlows && createNewFlowOpen && !errorFlows && (
                <div className="flex gap-2 w-full h-full text-primary">
                    <div className="flex flex-col">
                        <CollectionsAside
                            selectedTypeOrigin={selectedTypeOrigin}
                            onChangeTypeOrigin={setSelectedTypeOrigin}
                            selectedWorkspaceId={selectedWorkspaceId}
                            onChangeWorkspaceId={setSelectedWorkspaceId}
                            collectionQuery={collectionQuery}
                            onChangeCollectionQuery={setCollectionQuery}
                            elementsPostman={elementsPostman}
                            typeOriginOptions={typeOrigin}
                            openCollection={openCollection}
                            loadingByCollection={loadingByCollection}
                            onOpenCollection={handleOpenCollection}
                            collectionError={collectionError}
                            dataDetailByUid={dataDetailByUid}
                            renderCollectionTree={renderCollectionTree}
                            loadingElements={loadingElements}
                        />
                    </div>

                    <CollectionMain response={singleFlowResponseJson} envEditorOpen={envEditorState.open}>
                        <>
                            {view === "canvas" && !envEditorState.open && (
                                <div className="flex w-full p-4 relative">
                                    {flow.length === 0 ? (
                                        <div className="flex w-full h-full items-center justify-center p-4 flex-col gap-2">
                                            <Image alt="Flows Icon" src={Flows} width={80} height={80} className="text-[#3956E8]" />
                                            <p className="text-[24px] font-semibold tracking-wider text-primary/85">Select an API to start</p>
                                            <p className="text-[14px] text-gray-500">Visualize your API flow here</p>
                                        </div>
                                    ) : (
                                        <div className="w-full flex flex-col gap-2">
                                            <div className="flex gap-4 mb-4 items-center">
                                                <SelectInFlows
                                                    options={[
                                                        ...environments,
                                                        ...(customEnv ? [{ id: CUSTOM_ENV_ID, name: customEnv.name || "Custom environment" }] : []),
                                                    ]}
                                                    onChange={(val) => {
                                                        if (val === CUSTOM_ENV_ID && !customEnv) {
                                                            setCustomEnv({ name: "Custom environment", env: { Default: "Default" } });
                                                        }
                                                        setSelectedEnvironment(val);
                                                    }}
                                                    onEdit={openEditEnv}
                                                    onCreateCustom={openCreateCustomEnv}
                                                    label="Environment"
                                                    widthClass="w-60"
                                                    isCustomFlow={true}
                                                    value={selectedEnvironment}
                                                />
                                                <SelectInFlows
                                                    options={rows}
                                                    onChange={setSelectedIterationData}
                                                    label="Iteration Data"
                                                    widthClass="w-64"
                                                    labelDefault="Select iteration data"
                                                    isCustomFlow={false}
                                                    value={selectedIterationData}
                                                    textOptions="Select an iteration data"
                                                    Icon={<RefreshCcw className="w-5 h-5 text-primary" />}
                                                />
                                                <SelectInFlows
                                                    options={countOptions}
                                                    value={selectCountsInFlows ?? null}
                                                    onChange={(v) => setSelectCountsInFlows(v ? Number(v) : null)}
                                                    labelDefault="Iteration count"
                                                    textOptions="Select number of counts in flows"
                                                    widthClass="w-52"
                                                    Icon={<Hash className="w-5 h-5 text-primary" />}
                                                    isIterationCount
                                                    minCount={0}
                                                    maxCount={100}
                                                />
                                            </div>

                                            <FlowCanvas
                                                flow={flow}
                                                onOpenNode={(id) => setActiveNodeId(id)}
                                                onChangeUrl={(id, url) => updateNode(id, { url })}
                                                onRemoveNode={removeNode}
                                                onSendFlow={sendFlow}
                                                openModalCreate={modalCreateFlowOpen}
                                                setModalCreate={setModalCreateFlowOpen}
                                                onCloseModalCreate={() => setModalCreateFlowOpen(false)}
                                                environment={dataEnvironment || null}
                                                refetchFlows={fetchFlows}
                                                setCreateNewFlowOpen={setCreateNewFlowOpen}
                                                iterationData={dataIterionData}
                                            />
                                        </div>
                                    )}
                                    <button className="absolute top-4 right-4 rounded p-1.5 focus:outline-none" onClick={backToListFlows}>
                                        <FaXmark className="w-5 h-5 text-primary/40" />
                                    </button>
                                </div>
                            )}

                            {view === "canvas" && envEditorState.open && (
                                <EnvEditor
                                    initialName={envEditorState.initialName}
                                    initialEnv={envEditorState.initialEnv}
                                    onCancel={closeEnvEditor}
                                    onSave={saveEnv}
                                    saving={savingEnv}
                                    environmentInfo={null}
                                    onChangeDraft={
                                        envEditorState.editingId === null
                                            ? (draft) => {
                                                setCustomEnv({ name: draft.name || "Custom environment", env: draft.env || {} });
                                                setSelectedEnvironment(CUSTOM_ENV_ID);
                                            }
                                            : undefined
                                    }
                                />
                            )}
                            {view === "details" && activeNode && (
                                <div className="flex-1 p-4">
                                    <RequestDetails
                                        node={activeNode}
                                        onBack={backToCanvas}
                                        onUpdateNode={(patch) => updateNode(activeNode.id, patch)}
                                    />
                                </div>
                            )}
                        </>
                    </CollectionMain>
                </div>
            )}

            {loadingFlows != null && !loadingFlows && !createNewFlowOpen && !errorFlows && flows.length === 0 && (
                <div className="flex w-full h-full items-center justify-center p-4 flex-col gap-2">
                    <Image alt="Flows Icon" src={Flows} width={80} height={80} className="text-[#3956E8]" />
                    <p className="text-[24px] font-semibold tracking-wider text-primary/85">Flows</p>
                    <p className="text-[14px] text-gray-500">Get results from custom API flows</p>
                    <button onClick={() => setCreateNewFlowOpen(true)} className="bg-primary-blue font-bold text-[20px] py-3 px-10 rounded-2xl text-white">Create Flow</button>
                </div>
            )}

            {loadingFlows != null && !loadingFlows && !createNewFlowOpen && !errorFlows && flows.length > 0 && (
                <ListFlows
                    flows={flows}
                    onCreate={() => setCreateNewFlowOpen(true)}
                    selectedIds={selectedIds}
                    onToggleSelect={onToggleSelect}
                    onToggleSelectAllVisible={onToggleSelectAllVisible}
                    allVisibleSelected={allVisibleSelected}
                    query={query}
                    setQuery={setQuery}
                    filteredFlows={filteredFlows}
                    onOpen={onOpen}
                    closeRowMenu={closeRowMenu}
                    anyRunning={anyRunning}
                    runFlows={runFlows}
                    executedByFlow={executedByFlow}
                    totalSuccess={totalSuccess}
                    totalFailed={totalFailed}
                    totalPending={totalPending}
                    successRate={successRate}
                    expandedFlows={expandedFlows}
                    openChipModal={openChipModal}
                    toggleFlowExpanded={toggleFlowExpanded}
                    messagesResult={messagesResult}
                    refreshFlows={fetchFlows}
                />
            )}

            {loadingFlows != null && errorFlows && !loadingFlows && (
                <div className="flex w-full h-full items-center justify-center p-4 flex-col gap-2">
                    <p className="text-[20px] font-semibold tracking-wider text-primary/85">Error loading flows</p>
                    <p className="text-[14px] text-gray-500">There was an error while fetching the flows. Please try again later.</p>
                    <button onClick={() => fetchFlows()} className="bg-primary-blue/90 px-5 py-3 text-white font-semibold rounded-2xl">Try Reload</button>
                </div>
            )}

            <ModalRenderChips chipModal={chipModal} getApiPiece={(flowId, apiName) => (executedByFlow[flowId] ?? []).find(p => p.name === apiName)} stateLabel={(v?: boolean) => (v === true ? "Success" : v === false ? "Failed" : "Pending")} setChipModal={setChipModal} closeChipModal={closeChipModal} />

            {modalSureBackListFlows && (
                <ModalBackCanvas modalSureBackListFlows={modalSureBackListFlows} setModalSureBackListFlows={setModalSureBackListFlows} setCreateNewFlowOpen={setCreateNewFlowOpen} />
            )}
        </DashboardHeader>
    );
};

export default FlowsPage;
