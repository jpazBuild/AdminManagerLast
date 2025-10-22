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
import { Check, ChevronDown, PlusIcon, RefreshCcw } from "lucide-react";
import TextInputWithClearButton from "@/app/components/InputClear";
import axios from "axios";
import { URL_API_ALB } from "@/config";
import { SearchField } from "@/app/components/SearchField";
import { Checkbox } from "@/components/ui/checkbox";
import MoreMenu from "../components/MoreMenu";
import { toast } from "sonner";
import CopyToClipboard from "@/app/components/CopyToClipboard";
import { useFlowRunner } from "./hooks/useFlowRunner";
import { FaXmark } from "react-icons/fa6";
import { ExecutionSummary } from "@/app/components/ExecutionSummary";
import { Detail, ExecPiece, FlowNode, ModalTab, Stage } from "@/types/types";
import FlowCanvas from "./components/FlowCanvas";
import RequestDetails from "./components/RequestDetails";
import ModalBackCanvas from "./components/ModalBackCanvas";
import ModalRenderChips from "./components/ModalRenderChips";
import ListFlows from "./components/ListFlows";


const FlowsPage: React.FC = () => {
    const [selectedTypeOrigin, setSelectedTypeOrigin] = useState<string | null>(null);
    const [selectedWorkspaceId, setSelectedWorkspaceId] = useState<string | null>(null);
    const [collectionQuery, setCollectionQuery] = useState<string>("");

    const [openCollection, setOpenCollection] = useState<Record<string, boolean>>({});
    const [loadingByCollection, setLoadingByCollection] = useState<Record<string, boolean>>({});

    const { elements: elementsPostman } = useFetchElementsPostman();
    const { getCollection, cache: collectionsCache, error: collectionError } = useFetchCollection();

    const typeOrigin = useMemo(() => [{ name: "Postman" }, { name: "BD" }], []);
    const [dataDetailCollections, setDataDetailCollections] = useState<Detail[]>([]);
    const dataDetailByUid = useMemo<Record<string, Detail>>(
        () => Object.fromEntries(dataDetailCollections.map((dc) => [dc.uid, dc])),
        [dataDetailCollections]
    );
    const [selectedEnvironment, setSelectedEnvironment] = useState<any>(null);
    const [flow, setFlow] = useState<FlowNode[]>([]);
    const [activeNodeId, setActiveNodeId] = useState<string | null>(null);
    const view: "canvas" | "details" = activeNodeId ? "details" : "canvas";
    const [environments, setEnvironments] = useState<any[]>([]);
    const [flows, setFlows] = useState<any>([]);
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [createNewFlowOpen, setCreateNewFlowOpen] = useState<boolean>(false);
    const [loadingFlows, setLoadingFlows] = useState<boolean | null>(null)

    const [modalSureBackListFlows, setModalSureBackListFlows] = useState<boolean>(false);
    const [expandedFlows, setExpandedFlows] = useState<Record<string, boolean>>({});
    const [chipModal, setChipModal] = useState<{
        open: boolean;
        flowId: string | null;
        apiName: string | null;
        stage: Stage;
        tab: ModalTab;
    }>({ open: false, flowId: null, apiName: null, stage: "request", tab: "metadata" });

    const [errorFlows, setErrorFlows] = useState<boolean>(false);

    const [modalCreateFlowOpen, setModalCreateFlowOpen] = useState<boolean>(false);
    const openChipModal = (flowId: string, apiName: string, stage: Stage) => {
        setChipModal({ open: true, flowId, apiName, stage, tab: "metadata" });
    };

    const closeChipModal = () => {
        setChipModal(prev => ({ ...prev, open: false }));
    };

    const getApiPiece = (flowId: string, apiName: string): ExecPiece | undefined =>
        (executedByFlow[flowId] ?? []).find(p => p.name === apiName);

    const stateLabel = (v?: boolean) =>
        v === true ? "Success" : v === false ? "Failed" : "Pending";

    const { runFlows, anyRunning, messagesResult, stopFlow, summariesByFlow, getExecutedApis, runSingleFlow, runSingleFlowWithPayload } = useFlowRunner();

    const fetchEnvironments = async () => {
        const response = await axios.post(`${URL_API_ALB}envs`, {});
        setEnvironments(response.data);
    };


    const fetchFlows = async () => {
        try {
            setLoadingFlows(true)
            const response = await axios.post(`${URL_API_ALB}getApisScriptsHeaders`, {});
            setFlows(response.data);
            setErrorFlows(false)
        } catch (e) {
            toast.error("Error in get flows")
            setErrorFlows(true)
        } finally {
            setLoadingFlows(false)
        }

    }

    useEffect(() => {
        fetchFlows();
    }, []);
    useEffect(() => {

        fetchEnvironments();
    }, []);

    useEffect(() => {
        if (selectedTypeOrigin === "BD") setSelectedWorkspaceId(null);
    }, [selectedTypeOrigin]);

    const resolvedTeamIdForApi = useMemo(() => {
        const teams = elementsPostman?.teams ?? [];
        if (!teams.length) return undefined;

        const teamWithWS = teams.find((team: any) =>
            team?.workspaces?.some(
                (ws: any) => String(ws.id ?? ws.uid ?? ws.workspaceId) === String(selectedWorkspaceId)
            )
        );
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
                const exists = prev.some(
                    (x) => x.key === cacheKeyWithTeam || x.key === cacheKeyUidOnly || x.uid === uid
                );
                if (exists) return prev;
                return [{ key: cacheKeyWithTeam, uid, name, teamId: resolvedTeamIdForApi!, data }, ...prev];
            });
        };

        try {
            if (cached) {
                pushToStack(cached);
                return;
            }
            setLoadingByCollection((prev) => ({ ...prev, [name]: true }));

            const resp = await getCollection({ teamId: resolvedTeamIdForApi as any, collectionUid: uid });
            const data = resp?.data ?? resp;
            pushToStack(data);
        } catch (err) {
            console.error("[handleOpenCollection] error:", err);
        } finally {
            setLoadingByCollection((prev) => ({ ...prev, [name]: false }));
        }
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
                    const defaultUrl =
                        node?.request?.url?.raw ??
                        `http://localhost:3000/api/${colName.toLowerCase().replace(/\s+/g, "-")}`;

                    setFlow((prev) => [
                        ...prev,
                        { id, name: displayName, method, url: defaultUrl, rawNode: node },
                    ]);
                }}
            />
        ),
        []
    );

    const openNode = (id: string) => setActiveNodeId(id);
    const backToCanvas = () => setActiveNodeId(null);

    const updateNode = (id: string, patch: Partial<FlowNode>) =>
        setFlow((prev) => prev.map((n) => (n.id === id ? { ...n, ...patch } : n)));

    const removeNode = (id: string) => {
        setFlow((prev) => prev.filter((n) => n.id !== id));
        if (activeNodeId === id) setActiveNodeId(null);
    };

    const buildPayloadFromCanvas = () => {
        const envForRunner = environments.find((e) => e.id === selectedEnvironment)?.env ?? null;

        const apis = flow.map((n) => {
            const rn = n.rawNode ?? {};
            const request = rn?.request ?? {};

            const next: any = {
                ...rn,
                name: n.name ?? rn.name,
                request: {
                    ...request,
                    method: (n.method || request.method || "GET").toUpperCase(),
                    url: {
                        ...(request.url ?? {}),
                        raw: n.url ?? request.url?.raw ?? "",
                    },
                },
            };

            return next;
        });

        const flowId = "flow-execution";
        const payload = {
            action: "runApis",
            key: `testFolder/runApis_custom_${Date.now()}.json`,
            apis,
            env: envForRunner,
        };

        return { flowId, payload };
    };

    const sendFlow = () => {
        if (!flow.length) {
            toast.error("Add at least one API to the flow");
            return;
        }
        if (!selectedEnvironment) {
            toast.error("Select an environment");
            return;
        }

        const { flowId, payload } = buildPayloadFromCanvas();

        setSelectedIds(prev => new Set([...Array.from(prev), flowId]));

        console.log("Sending flow:", flow);
        console.log("Running flow with payload:", payload);

        runSingleFlowWithPayload(flowId, payload);
    };

    const activeNode = activeNodeId ? flow.find((n) => n.id === activeNodeId) ?? null : null;

    const [query, setQuery] = useState<string>("");
    const onCreate = () => {

        setCreateNewFlowOpen(true);
    };

    const [menu, setMenu] = useState<{
        openForId: string | null;
        anchorEl: HTMLElement | null;
    }>({ openForId: null, anchorEl: null });

    const onOpen = (flowId: string) => {
        console.log("Open flow:", flowId);
    };

    const onRowMenu = (flowId: string, anchor: HTMLElement) => {
        setMenu({ openForId: flowId, anchorEl: anchor });
    };

    const closeRowMenu = () => {
        setMenu({ openForId: null, anchorEl: null });
    };


    const filteredFlows = useMemo(() => {
        const q = query.trim().toLowerCase();
        if (!q) return flows;
        return flows.filter(
            (f: any) =>
                f.name.toLowerCase().includes(q));
    }, [flows, query]);

    const onToggleSelect = (flowId: string, checked: boolean) => {
        setSelectedIds(prev => {
            const next = new Set(prev);
            if (checked) next.add(flowId);
            else next.delete(flowId);
            return next;
        });
    };

    const allVisibleSelected =
        filteredFlows.length > 0 && filteredFlows.every((f: any) => selectedIds.has(f.id));

    const onToggleSelectAllVisible = (checked: boolean) => {
        setSelectedIds(prev => {
            const next = new Set(prev);
            if (checked) filteredFlows.forEach((f: any) => next.add(f.id));
            else filteredFlows.forEach((f: any) => next.delete(f.id));
            return next;
        });
    };


    const isPlainObj = (v: any) =>
        v && typeof v === "object" && !Array.isArray(v);

    const deepMerge = (a: any, b: any): any => {
        if (Array.isArray(a) && Array.isArray(b)) return b;
        if (isPlainObj(a) && isPlainObj(b)) {
            const out: any = { ...a };
            for (const k of Object.keys(b)) out[k] = k in a ? deepMerge(a[k], b[k]) : b[k];
            return out;
        }
        return b ?? a;
    };

    const pick = (obj: any, keys: string[]) =>
        keys.reduce((acc, k) => (obj && k in obj ? (acc[k] = obj[k], acc) : acc), {} as any);


    const executedByFlow = useMemo<Record<string, ExecPiece[]>>(() => {
        const out: Record<string, ExecPiece[]> = {};

        const isSkipped = (v: any) => v === "skipped";
        const hasBool = (v: any): v is boolean => typeof v === "boolean";
        const nextSuccess = (incoming: any, prev: any) =>
            (hasBool(incoming) || isSkipped(incoming)) ? incoming : (prev ?? undefined);

        for (const flowId of Array.from(selectedIds)) {
            const msgs = (messagesResult[flowId]?.messages ?? [])
                .slice()
                .sort((a, b) => a.ts - b.ts);

            const byName: Record<string, ExecPiece> = {};

            const ensure = (name?: string | null): ExecPiece | null => {
                if (!name) return null;
                if (!byName[name]) byName[name] = { name };
                return byName[name];
            };

            for (const m of msgs) {
                const resp = m?.payload?.response;
                const item = m?.payload?.item;

                if (typeof item === "string") {
                    let match = item.match(/^(?:Running request|Request completed):\s*(.+)$/i);
                    if (match?.[1]) {
                        const e = ensure(match[1].trim());
                        if (e && /^Running request:/i.test(item)) {
                            e.request = e.request ?? { success: undefined, status: null, detail: {} };
                        }
                    }

                    match = item.match(/^(?:Running test script|Test script completed):\s*(.+)$/i);
                    if (match?.[1]) {
                        const e = ensure(match[1].trim());
                        if (e && /^Running test script:/i.test(item)) {
                            e.test = e.test ?? { success: undefined, detail: {} };
                        }
                    }
                }

                if (resp && (resp.name || resp.type)) {
                    const rName: string | null = resp.name ?? null;
                    const rType: string | null = resp.type ?? null;

                    if (rName && rType === "request") {
                        const e = ensure(rName);
                        if (!e) continue;

                        const prevReq = e.request ?? { success: undefined, status: null, detail: {} };
                        const incomingSuccess = resp.success;
                        const incomingStatus = resp.status;

                        const nextReq = {
                            success: nextSuccess(incomingSuccess, prevReq.success),
                            status: (typeof incomingStatus === "number")
                                ? incomingStatus
                                : (typeof prevReq.status === "number" ? prevReq.status : null),
                            detail: deepMerge(prevReq.detail ?? {}, pick(resp, ["request", "response", "env"])),
                        };

                        e.request = nextReq;
                    }

                    if (rName && rType === "script" && resp.listen === "test") {
                        const e = ensure(rName);
                        if (!e) continue;

                        const prevTest = e.test ?? { success: undefined, detail: {} };
                        const incomingSuccess = resp.success;

                        const nextTest = {
                            success: nextSuccess(incomingSuccess, prevTest.success),
                            detail: deepMerge(prevTest.detail ?? {}, resp),
                        };

                        e.test = nextTest;
                    }
                }
            }

            out[flowId] = Object.values(byName);
        }

        return out;
    }, [selectedIds, messagesResult]);

    const toggleFlowExpanded = (id: string) =>
        setExpandedFlows(prev => ({ ...prev, [id]: !(prev[id] ?? true) }));

    const flowStatuses = useMemo(() => {
        const statuses: Record<string, "success" | "failed" | "pending"> = {};

        for (const flowId of Array.from(selectedIds)) {
            const fr = messagesResult?.[flowId];
            if (fr?.status === "error") { statuses[flowId] = "failed"; continue; }
            if (fr?.status === "running") { statuses[flowId] = "pending"; }

            const pieces = executedByFlow[flowId] ?? [];
            if (!pieces.length) {
                statuses[flowId] = statuses[flowId] ?? "pending";
                continue;
            }

            const hasFail = pieces.some(p => p.request?.success === false || p.test?.success === false);
            const allOk = pieces.length > 0 &&
                pieces.every(p =>
                    (p.request ? p.request.success === true : true) &&
                    (p.test ? p.test.success === true : true)
                );

            statuses[flowId] = hasFail ? "failed" : allOk ? "success" : "pending";
        }
        return statuses;
    }, [selectedIds, executedByFlow, messagesResult]);

    const { totalSuccess, totalFailed, totalPending, successRate } = useMemo(() => {
        let s = 0, f = 0, p = 0;
        for (const id of Object.keys(flowStatuses)) {
            const st = flowStatuses[id];
            if (st === "success") s++;
            else if (st === "failed") f++;
            else p++;
        }
        const total = s + f + p;
        const rate = total ? Math.round((s / total) * 100) : 0;
        return { totalSuccess: s, totalFailed: f, totalPending: p, successRate: rate };
    }, [flowStatuses]);


    const backToListFlows = () => {
        if (flow.length > 0) {
            setModalSureBackListFlows(true);
        }
        if (flow.length === 0) {
            setCreateNewFlowOpen(false);
        }
    }


    const SINGLE_FLOW_ID = "flow-execution";

    const buildSingleFlowOrderedResult = useCallback(() => {
        const fr = messagesResult?.[SINGLE_FLOW_ID];
        if (!fr) return null;

        const orderedMsgs = (fr.messages ?? []).slice().sort((a, b) => a.ts - b.ts);

        return {
            [SINGLE_FLOW_ID]: {
                status: fr.status,
                messages: orderedMsgs,
            },
        };

    }, [messagesResult]);

    const singleFlowResponseJson = useMemo(() => {
        const packed = buildSingleFlowOrderedResult();
        return packed ? JSON.stringify(packed, null, 4) : undefined;
    }, [buildSingleFlowOrderedResult]);

    
    const dataEnvironment = useMemo(() => {
        return environments.find((env) => env.id === selectedEnvironment)?.env ?? null;
    }, [environments, selectedEnvironment]);

    return (
        <DashboardHeader pageType="api">
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
                        <div className="space-y-2">
                            {[...Array(5)].map((_, i) => (
                                <div key={i} className="h-32 bg-gray-300 rounded"></div>
                            ))}
                        </div>
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
                        />
                    </div>
                    <CollectionMain response={singleFlowResponseJson}>
                        <>
                            {view === "canvas" && (
                                <div className="flex w-full p-4 relative">
                                    {flow.length === 0 ? (
                                        <div className="flex w-full h-full items-center justify-center p-4 flex-col gap-2">
                                            <Image alt="Flows Icon" src={Flows} width={80} height={80} className="!text-[#3956E8]" />
                                            <p className="text-[24px] font-semibold tracking-wider text-primary/85">Select an API to start</p>
                                            <p className="text-[14px] text-gray-500">Visualize your API flow here</p>
                                        </div>
                                    ) : (
                                        <div className="w-full flex flex-col gap-2">
                                            <SearchField
                                                label="Environment"
                                                placeholder="Select environment..."
                                                options={environments.map((env) => ({ value: env.id, label: env.name }))}
                                                onChange={setSelectedEnvironment}
                                                value={selectedEnvironment}
                                                widthComponent="w-64"
                                            />
                                            <FlowCanvas
                                                flow={flow}
                                                onOpenNode={openNode}
                                                onChangeUrl={(id, url) => updateNode(id, { url })}
                                                onRemoveNode={removeNode}
                                                onSendFlow={sendFlow}
                                                openModalCreate={modalCreateFlowOpen}
                                                setModalCreate={setModalCreateFlowOpen}
                                                onCloseModalCreate={() => setModalCreateFlowOpen(false)}
                                                environment={dataEnvironment || null}
                                                refetchFlows={fetchFlows}
                                                setCreateNewFlowOpen={setCreateNewFlowOpen}
                                            />
                                        </div>
                                    )}
                                    <button className="absolute top-4 right-4 rounded p-1.5 focus:outline-none" onClick={backToListFlows}>
                                        <FaXmark className="w-5 h-5 text-primary/40" />
                                    </button>
                                </div>
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
                    <Image alt="Flows Icon" src={Flows} width={80} height={80} className="!text-[#3956E8]" />
                    <p className="text-[24px] font-semibold tracking-wider text-primary/85">Flows</p>
                    <p className="text-[14px] text-gray-500">Get results from custom API flows</p>
                    <button onClick={() => setCreateNewFlowOpen(true)} className="bg-primary-blue font-bold text-[20px] py-3 px-10 rounded-2xl text-white">
                        Create Flow
                    </button>
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
            <ModalRenderChips
                chipModal={chipModal}
                getApiPiece={getApiPiece}
                stateLabel={stateLabel}
                setChipModal={setChipModal}
                closeChipModal={closeChipModal}
            />

            {modalSureBackListFlows && (
                <ModalBackCanvas
                    modalSureBackListFlows={modalSureBackListFlows}
                    setModalSureBackListFlows={setModalSureBackListFlows}
                    setCreateNewFlowOpen={setCreateNewFlowOpen}
                />
            )}

        </DashboardHeader>
    );
};

export default FlowsPage;