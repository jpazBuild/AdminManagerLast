"use client";

import React, { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { DashboardHeader } from "@/app/Layouts/main";
import CollectionsAside from "../collections/components/SideCollections";
import { useFetchElementsPostman } from "../collections/hooks/useFetchElementsPostman";
import { useFetchCollection } from "../collections/hooks/useFetchCollection";
import { httpMethodsStyle } from "../utils/colorMethods";
import CollectionTree from "../collections/components/CollectionTree";
import Image from "next/image";
import Flows from "../../../assets/iconsSides/flows.svg";
import CollectionMain from "../collections/components/CollectionMain";
import { ArrowLeft, Check, ChevronDown, PlusIcon, RefreshCcw, Trash2Icon } from "lucide-react";
import TextInputWithClearButton from "@/app/components/InputClear";
import ExpandIcon from "../../../assets/apisImages/ExpandArrow.svg";
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
import SyntaxHighlighter from "react-syntax-highlighter";
import { stackoverflowLight } from "react-syntax-highlighter/dist/esm/styles/hljs";

type Detail = {
    key: string;
    uid: string;
    name: string;
    teamId: number | string;
    data: any;
};

type FlowNode = {
    id: string;
    name: string;
    method: string;
    url: string;
    rawNode: any;
};


const MethodPill: React.FC<{ method: string }> = ({ method }) => (
    <span className={`${httpMethodsStyle(method)} text-[11px] px-2 py-0.5 rounded`}>{method}</span>
);

const FlowCard: React.FC<{
    node: FlowNode;
    onOpen: (id: string) => void;
    onChangeUrl: (id: string, url: string) => void;
    onRemove: (id: string) => void;
}> = ({ node, onOpen, onChangeUrl, onRemove }) => {
    return (
        <div className="rounded-lg border border-primary/20 bg-white shadow-sm px-4 py-3 min-w-[320px]">
            <div className="flex items-center justify-between gap-2 mb-2">
                <div className="flex items-center gap-2">
                    <MethodPill method={node.method} />
                    <p className="font-medium text-primary/85">{node.name}</p>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        title="Open details"
                        onClick={() => onOpen(node.id)}
                        className="hover:opacity-80 text-primary/85"
                    >
                        <Image src={ExpandIcon} alt="Expand" className="w-4 h-4" />
                    </button>
                    <button title="Remove" onClick={() => onRemove(node.id)} className="hover:opacity-80 text-primary/85">
                        <Trash2Icon className="w-5 h-5" />
                    </button>
                </div>
            </div>
            <TextInputWithClearButton
                id={`flow-node-url-${node.id}`}
                value={node.url}
                onChangeHandler={(e) => onChangeUrl(node.id, e.target.value)}
                placeholder="http://localhost:3000/"
            />
        </div>
    );
};

type Connector = { d: string };

const FlowCanvas: React.FC<{
    flow: FlowNode[];
    onOpenNode: (id: string) => void;
    onChangeUrl: (id: string, url: string) => void;
    onRemoveNode: (id: string) => void;
    onSendFlow: () => void;
}> = ({ flow, onOpenNode, onChangeUrl, onRemoveNode, onSendFlow }) => {
    const containerRef = useRef<HTMLDivElement | null>(null);
    const cardRefs = useRef<(HTMLDivElement | null)[]>([]);
    const [connectors, setConnectors] = useState<Connector[]>([]);

    const setCardRef = (idx: number) => (el: HTMLDivElement | null) => {
        cardRefs.current[idx] = el;
    };

    const recalc = () => {
        const root = containerRef.current;
        if (!root) return;

        const rootRect = root.getBoundingClientRect();

        type Measured = {
            idx: number;
            left: number;
            right: number;
            top: number;
            midY: number;
            bottom: number;
        };

        const items: Measured[] = cardRefs.current
            .map((el, idx) => {
                if (!el) return null;
                const r = el.getBoundingClientRect();
                return {
                    idx,
                    left: r.left,
                    right: r.right,
                    top: r.top,
                    bottom: r.bottom,
                    midY: r.top + r.height / 2,
                };
            })
            .filter(Boolean) as Measured[];

        if (items.length < 2) {
            setConnectors([]);
            return;
        }

        items.sort((a, b) => {
            const topDiff = a.top - b.top;
            if (Math.abs(topDiff) > 20) return topDiff;
            return a.left - b.left;
        });

        const paths = [];
        for (let i = 0; i < items.length - 1; i++) {
            const a = items[i];
            const b = items[i + 1];

            const x1 = a.right - rootRect.left;
            const y1 = a.midY - rootRect.top;
            const x2 = b.left - rootRect.left - 8;
            const y2 = b.midY - rootRect.top;

            if (Math.abs(y1 - y2) < 20) {
                const midX = (x1 + x2) / 2;
                paths.push({ d: `M ${x1} ${y1} L ${midX} ${y1} L ${midX} ${y2} L ${x2} ${y2}` });
            } else {
                const midX1 = x1 + 30;
                const midX2 = x2 - 30;
                paths.push({
                    d: `M ${x1} ${y1} L ${midX2} ${y1} L ${midX2} ${y2} L ${x2} ${y2}`
                });
            }
        }

        setConnectors(paths);
    };


    useLayoutEffect(() => {
        recalc();

        const ro = new ResizeObserver(() => recalc());
        const root = containerRef.current;
        if (root) ro.observe(root);
        cardRefs.current.forEach((el) => el && ro.observe(el));

        const onResize = () => recalc();
        window.addEventListener("resize", onResize);

        return () => {
            ro.disconnect();
            window.removeEventListener("resize", onResize);
        };
    }, [flow.length]);

    useEffect(() => {
        const id = requestAnimationFrame(recalc);
        return () => cancelAnimationFrame(id);
    });

    return (
        <div className="w-full flex flex-col gap-4">
            <div
                ref={containerRef}
                className="relative flex items-start gap-6 flex-wrap"
            >
                {/* Tarjetas */}
                {flow.map((n, i) => (
                    <div key={n.id} ref={setCardRef(i)} className="relative z-30">
                        <FlowCard
                            node={n}
                            onOpen={onOpenNode}
                            onChangeUrl={onChangeUrl}
                            onRemove={onRemoveNode}
                        />
                    </div>
                ))}

                <svg
                    className="pointer-events-none absolute inset-0 z-20"
                    width="100%"
                    height="100%"
                >
                    {connectors.map((c, i) => (
                        <path
                            key={`conn-${i}`}
                            d={c.d}
                            fill="none"
                            stroke="rgba(57,86,232,0.45)"
                            strokeWidth={2}
                            strokeLinecap="round"
                        />
                    ))}
                </svg>
            </div>

            <div className="self-end pb-2">
                <button
                    onClick={onSendFlow}
                    className="bg-[#3956E8] text-white px-5 py-2 rounded-md shadow hover:opacity-95"
                >
                    Send flow
                </button>
            </div>
        </div>
    );
};


const TabBtn: React.FC<{ active: boolean; onClick: () => void; children: React.ReactNode }> = ({
    active,
    onClick,
    children,
}) => (
    <button
        onClick={onClick}
        className={`px-3 py-2 text-sm rounded-md ${active ? "bg-primary/10 text-primary/90" : "text-slate-600 hover:bg-slate-100"
            }`}
    >
        {children}
    </button>
);

const CodeBox: React.FC<{ value: string }> = ({ value }) => (
    <textarea
        readOnly
        value={value}
        className="w-full h-64 rounded-md border border-primary/20 bg-slate-50 px-3 py-2 font-mono text-[12px] leading-5"
    />
);

const RequestDetails: React.FC<{
    node: FlowNode;
    onBack: () => void;
    onUpdateNode: (patch: Partial<FlowNode>) => void;
}> = ({ node, onBack, onUpdateNode }) => {
    const [tab, setTab] = useState<"pre" | "request" | "post" | "headers" | "body" | "gqlvars">("body");

    const bodyRaw =
        node.rawNode?.request?.body?.mode === "graphql"
            ? node.rawNode?.request?.body?.graphql?.query ?? "{}"
            : node.rawNode?.request?.body?.raw ?? "{}";

    const gqlVars =
        node.rawNode?.request?.body?.mode === "graphql"
            ? node.rawNode?.request?.body?.graphql?.variables ?? "{}"
            : "{}";

    const headers =
        (node.rawNode?.request?.header ?? [])
            .map((h: any) => `${h?.key ?? ""}: ${h?.value ?? ""}`)
            .join("\n") || "// No headers";

    return (
        <div className="flex-1 flex flex-col gap-4">
            <div className="rounded-lg border border-primary/20 bg-white shadow-sm p-4">
                <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                        <button onClick={onBack} className="text-sm text-primary/80 hover:underline">
                            <ArrowLeft className="w-6 h-6 mr-1" />
                        </button>
                        <span className={`${httpMethodsStyle(node.method)}`}>{node.method}</span>

                        <h2 className="font-semibold text-primary/85">{node.name}</h2>
                    </div>

                </div>
                <TextInputWithClearButton
                    id="request-url"
                    value={node.url}
                    onChangeHandler={(e) => onUpdateNode({ url: e.target.value })}
                    placeholder="Enter request URL"
                />

                <div className="flex items-center gap-2 mt-4">
                    <TabBtn active={tab === "pre"} onClick={() => setTab("pre")}>
                        Pre-request
                    </TabBtn>
                    <TabBtn active={tab === "request"} onClick={() => setTab("request")}>
                        Request
                    </TabBtn>
                    <TabBtn active={tab === "post"} onClick={() => setTab("post")}>
                        Post-response
                    </TabBtn>
                    <TabBtn active={tab === "headers"} onClick={() => setTab("headers")}>
                        Headers
                    </TabBtn>
                    <TabBtn active={tab === "body"} onClick={() => setTab("body")}>
                        Body
                    </TabBtn>
                </div>

                <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-4">
                    {tab === "headers" && (
                        <>
                            <div className="md:col-span-2">
                                <CodeBox value={headers} />
                            </div>
                        </>
                    )}

                    {tab === "body" && (
                        <>
                            <CodeBox value={typeof bodyRaw === "string" ? bodyRaw : JSON.stringify(bodyRaw, null, 2)} />
                            <CodeBox value={typeof gqlVars === "string" ? gqlVars : JSON.stringify(gqlVars, null, 2)} />
                        </>
                    )}

                    {tab === "gqlvars" && (
                        <>
                            <div className="md:col-span-2">
                                <CodeBox value={typeof gqlVars === "string" ? gqlVars : JSON.stringify(gqlVars, null, 2)} />
                            </div>
                        </>
                    )}

                    {tab === "pre" && (
                        <div className="md:col-span-2">
                            <CodeBox value={"// Pre-request script"} />
                        </div>
                    )}

                    {tab === "request" && (
                        <div className="md:col-span-2">
                            <CodeBox value={JSON.stringify(node.rawNode?.request ?? {}, null, 2)} />
                        </div>
                    )}

                    {tab === "post" && (
                        <div className="md:col-span-2">
                            <CodeBox value={"// Post-response script"} />
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

const Modal: React.FC<{
    open: boolean;
    title?: string;
    onClose: () => void;
    children: React.ReactNode;
}> = ({ open, title, onClose, children }) => {
    if (!open) return null;
    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/30">
            <div className="w-full max-w-2xl rounded-2xl bg-white shadow-xl">
                <div className="flex items-center justify-between px-5 py-4 border-b border-primary/20">
                    <div className="text-[15px] font-semibold text-slate-800">{title}</div>
                    <button
                        onClick={onClose}
                        className="rounded p-1.5 hover:bg-slate-100 focus:outline-none"
                        aria-label="Close"
                    >
                        <FaXmark className="w-5 h-5 text-primary/40" />
                    </button>
                </div>
                <div className="p-5">{children}</div>
            </div>
        </div>
    );
};

type Stage = "pre" | "request" | "post";
type ModalTab = "metadata" | "error" | "environment";

type ExecPiece = {
    name: string;
    request?: {
        success?: boolean;
        status?: number | null;
        detail?: any;
    };
    test?: {
        success?: boolean;
        detail?: any;
    };
};

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
    const [loadingFlows, setLoadingFlows] = useState<boolean>(false)

    const [expandedFlows, setExpandedFlows] = useState<Record<string, boolean>>({});
    const [chipModal, setChipModal] = useState<{
        open: boolean;
        flowId: string | null;
        apiName: string | null;
        stage: Stage;
        tab: ModalTab;
    }>({ open: false, flowId: null, apiName: null, stage: "request", tab: "metadata" });

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

    const { runFlows, anyRunning, messagesResult, stopFlow, summariesByFlow, getExecutedApis } = useFlowRunner();

    const fetchEnvironments = async () => {
        const response = await axios.post(`${URL_API_ALB}envs`, {});
        setEnvironments(response.data);
    };


    const fetchFlows = async () => {
        try {
            setLoadingFlows(true)
            const response = await axios.post(`${URL_API_ALB}getApisScriptsHeaders`, {});
            setFlows(response.data);
        } catch (e) {
            toast.error("Error in get flows")
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

    const sendFlow = () => {
        console.log("Sending flow:", flow);
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

        console.log("flows filteredFlows", flows);

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

    console.log("summary by flow", summariesByFlow);
    console.log("messagesResult", messagesResult);


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
                        if (e) {
                            if (/^Running request:/i.test(item)) {
                                e.request = e.request ?? { success: undefined, status: null, detail: {} };
                            }
                        }
                    }

                    match = item.match(/^(?:Running test script|Test script completed):\s*(.+)$/i);
                    if (match?.[1]) {
                        const e = ensure(match[1].trim());
                        if (e) {
                            if (/^Running test script:/i.test(item)) {
                                e.test = e.test ?? { success: undefined, detail: {} };
                            }
                        }
                    }
                }

                if (resp && (resp.name || resp.type)) {
                    const rName: string | null = resp.name ?? null;
                    const rType: string | null = resp.type ?? null;

                    if (rName && rType === "request") {
                        const e = ensure(rName);
                        if (!e) continue;

                        const nextReq = {
                            success: typeof resp.success === "boolean" ? resp.success : e.request?.success ?? undefined,
                            status:
                                typeof resp.status === "number"
                                    ? resp.status
                                    : (typeof e.request?.status === "number" ? e.request?.status : null),
                            detail: deepMerge(e.request?.detail ?? {}, pick(resp, ["request", "response", "env"]))
                        };

                        e.request = nextReq;
                    }

                    if (rName && rType === "script" && resp.listen === "test") {
                        const e = ensure(rName);
                        if (!e) continue;

                        const nextTest = {
                            success: typeof resp.success === "boolean" ? resp.success : e.test?.success ?? undefined,
                            detail: deepMerge(e.test?.detail ?? {}, resp)
                        };

                        e.test = nextTest;
                    }
                }
            }

            out[flowId] = Object.values(byName);
        }

        return out;
    }, [selectedIds, messagesResult]);
    console.log("executedForFlow", executedByFlow);

    const toggleFlowExpanded = (id: string) =>
        setExpandedFlows(prev => ({ ...prev, [id]: !(prev[id] ?? true) }));

    const flowStatuses = useMemo(() => {
        const statuses: Record<string, "success" | "failed" | "pending"> = {};
        for (const flowId of Array.from(selectedIds)) {
            const pieces = executedByFlow[flowId] ?? [];

            if (!pieces.length) {
                statuses[flowId] = "pending";
                continue;
            }

            const hasFail = pieces.some(
                (p) => p.request?.success === false || p.test?.success === false
            );

            const allOk =
                pieces.length > 0 &&
                pieces.every(
                    (p) =>
                        (p.request ? p.request.success === true : true) &&
                        (p.test ? p.test.success === true : true)
                );

            statuses[flowId] = hasFail ? "failed" : allOk ? "success" : "pending";
        }
        return statuses;
    }, [selectedIds, executedByFlow]);

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


    return (
        <DashboardHeader pageType="api">

            {loadingFlows && (
                <div>
                    loading
                </div>
            )}
            {!loadingFlows && createNewFlowOpen && (
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

                    <CollectionMain>
                        <>
                            {view === "canvas" && (
                                <div className="flex w-full p-4">
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
                                                options={environments.map((env) => ({
                                                    value: env.id,
                                                    label: env.name,
                                                }))}
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
                                            />
                                        </div>
                                    )}
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

            {!loadingFlows && !createNewFlowOpen && flows.length === 0 && (
                <div className="flex w-full h-full items-center justify-center p-4 flex-col gap-2">
                    <Image alt="Flows Icon" src={Flows} width={80} height={80} className="!text-[#3956E8]" />
                    <p className="text-[24px] font-semibold tracking-wider text-primary/85">Flows</p>
                    <p className="text-[14px] text-gray-500">Get results from custom API flows</p>
                    <button onClick={() => setCreateNewFlowOpen(true)} className="bg-primary-blue font-bold text-[20px] py-3 px-10 rounded-2xl text-white">
                        Create Flow
                    </button>
                </div>
            )}

            {!loadingFlows && !createNewFlowOpen && flows.length > 0 && (
                <div className="self-center flex w-full lg:w-2/3 flex-col gap-4">

                    <div className="flex w-full items-center justify-between gap-2">
                        <TextInputWithClearButton
                            id="search-flows"
                            value={query}
                            onChangeHandler={(e) => setQuery(e.target.value)}
                            placeholder="Search flows"
                            isSearch={true}
                            label="Search flows"
                            className="w-full"
                        />


                        <button
                            onClick={onCreate}
                            className="w-38 flex gap-2 items-center rounded-full bg-gray-200 text-[14px] py-3 px-4"
                        >
                            <PlusIcon className="w-5 h-5" />
                            <span className="font-medium">New flow</span>
                        </button>
                    </div>

                    <div className="flex items-center gap-2 pl-1">
                        <Checkbox
                            checked={allVisibleSelected}
                            onCheckedChange={(checked) => onToggleSelectAllVisible(checked === true)}
                        />
                        <div className="flex items-center gap-2">
                            <span className="text-slate-600 text-sm">{filteredFlows.length} Results</span>
                        </div>
                    </div>

                    <div className="flex flex-col gap-3">
                        {filteredFlows
                            .filter((f: any) => !query || f.name.toLowerCase().includes(query.toLowerCase()))
                            .map((flow: any) => (
                                <div
                                    key={flow.id}
                                    className="rounded-2xl border border-gray-300 bg-white p-0.5"
                                >
                                    <div className="rounded-2xl bg-white px-5 py-6 border border-slate-100">
                                        <div className="flex items-start justify-between gap-3">
                                            <div className="flex items-center gap-3">

                                                <Checkbox
                                                    checked={selectedIds.has(flow.id)}
                                                    onCheckedChange={(checked) => onToggleSelect(flow.id, checked === true)}
                                                />
                                                <div className="flex flex-col items-center">
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <span className="text-primary/30 text-[14px]">{flow.id}</span>
                                                        <CopyToClipboard text={flow.id} />
                                                    </div>
                                                    <button
                                                        onClick={() => onOpen(flow.id)}
                                                        className="self-start text-[18px] font-semibold text-primary/70"
                                                    >
                                                        {flow.name}
                                                    </button>

                                                </div>
                                            </div>

                                            <MoreMenu
                                                onDelete={() => {
                                                    console.log("Delete flow:", flow.id);
                                                    closeRowMenu();
                                                }}
                                            />
                                        </div>
                                    </div>
                                </div>
                            ))}
                    </div>

                    <button
                        onClick={() => runFlows(Array.from(selectedIds))}
                        disabled={anyRunning || selectedIds.size === 0}
                        className="bg-primary-blue/90 w-32 cursor-pointer text-white rounded-2xl py-3 px-5 mt-4 mb-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {anyRunning ? "Running..." : "Run"}
                    </button>

                    <div className="mt-6 space-y-6 mb-4">
                        {Array.from(selectedIds).length > 0 && (
                            <div className="flex items-center gap-2">
                                <span className="text-lg font-semibold text-primary/80">Flows</span>
                                <span className="text-slate-400 text-sm">({Array.from(selectedIds).length})</span>
                            </div>
                        )}

                        {Array.from(selectedIds).length > 0 && (
                            <div className="mt-4">
                                <ExecutionSummary
                                    totalSuccess={totalSuccess}
                                    totalFailed={totalFailed}
                                    totalPending={totalPending}
                                    successRate={successRate}
                                />
                            </div>
                        )}

                        {Array.from(selectedIds).map((flowId) => {
                            const pieces = executedByFlow[flowId] ?? [];

                            const totalSteps = pieces.reduce((acc, p) => acc + (p.request ? 1 : 0) + (p.test ? 1 : 0), 0) || 0;
                            const doneSteps = pieces.reduce(
                                (acc, p) =>
                                    acc +
                                    (typeof p.request?.success === "boolean" ? 1 : 0) +
                                    (typeof p.test?.success === "boolean" ? 1 : 0),
                                0
                            );
                            const progressPct = totalSteps ? Math.round((doneSteps / totalSteps) * 100) : 0;

                            const hasFail = pieces.some(
                                (p) => p.request?.success === false || p.test?.success === false
                            );
                            const allOk =
                                pieces.length > 0 &&
                                pieces.every(
                                    (p) =>
                                        (p.request ? p.request.success === true : true) &&
                                        (p.test ? p.test.success === true : true)
                                );

                            const flowMeta = flows.find((f: any) => f.id === flowId);
                            const flowName = flowMeta?.name || flowId;
                            const expanded = expandedFlows[flowId] ?? true;


                            return (
                                <div key={flowId} className="space-y-4">
                                    <div
                                        className={`rounded-2xl border-2 px-5 py-4 ${hasFail
                                            ? "border-red-300"
                                            : allOk
                                                ? "border-emerald-700"
                                                : "border-slate-200"
                                            }`}
                                    >
                                        <div className="flex items-start justify-between gap-3">
                                            <div className="min-w-0">
                                                <div className="text-xs text-primary/40">{flowId}</div>
                                                <div className="text-lg font-semibold text-primary/85 truncate">
                                                    {flowName}
                                                </div>
                                            </div>

                                            <div className="flex  items-center gap-3">
                                                <div
                                                    className={`flex h-8 w-8 items-center justify-center rounded-full border ${hasFail
                                                        ? "border-red-300 text-red-500"
                                                        : allOk
                                                            ? "border-emerald-300 text-emerald-700"
                                                            : "border-slate-300 text-slate-400"
                                                        }`}
                                                    title={hasFail ? "Failed" : allOk ? "Success" : "In progress"}
                                                >
                                                    {hasFail ? <FaXmark className="w-55 h-5" /> : allOk ? <Check className="w-5 h-5 " /> : <RefreshCcw className="w-4 h-4" />}

                                                </div>
                                                <button
                                                    onClick={() => toggleFlowExpanded(flowId)}
                                                    className="p-2 rounded-full hover:bg-slate-100 transition"
                                                    aria-expanded={expanded}
                                                    aria-controls={`apis-${flowId}`}
                                                >
                                                    <ChevronDown
                                                        className={`w-5 h-5 text-slate-400 transition-transform ${expanded ? "rotate-0" : "-rotate-90"}`}
                                                    />
                                                </button>
                                            </div>


                                        </div>

                                        <div className="mt-4">
                                            <div className="h-2 rounded-full bg-slate-200 overflow-hidden">
                                                <div
                                                    className={`h-full rounded-full transition-all ${hasFail ? "bg-red-500" : "bg-emerald-700"
                                                        }`}
                                                    style={{ width: `${progressPct}%` }}
                                                />
                                            </div>
                                            <div className="mt-1 text-right text-xs text-slate-500">
                                                {progressPct}%
                                            </div>
                                        </div>
                                    </div>

                                    <div
                                        id={`apis-${flowId}`}
                                        className={`overflow-hidden transition-all duration-300 ${expanded ? "max-h-[2000px] opacity-100" : "max-h-0 opacity-0"}`}
                                    >
                                        {!!pieces.length && (
                                            <div className="space-y-3 pt-2">
                                                <div className="flex items-center justify-between">
                                                    <div className="text-sm text-slate-500">APIs</div>
                                                    <div className="text-xs text-slate-400">
                                                        {Math.round(progressPct)}%
                                                    </div>
                                                </div>

                                                {pieces.map((api) => {
                                                    const msgs = (messagesResult[flowId]?.messages ?? []).filter(
                                                        (m: any) =>
                                                            m?.payload?.response?.name === api.name ||
                                                            (typeof m?.payload?.item === "string" &&
                                                                m.payload.item.includes(api.name))
                                                    );
                                                    const start = msgs[0]?.ts ?? null;
                                                    const end = msgs[msgs.length - 1]?.ts ?? null;
                                                    const durSec =
                                                        start && end ? Math.max(0, (end - start) / 1000) : null;

                                                    const reqState =
                                                        api.request?.success === true
                                                            ? "ok"
                                                            : api.request?.success === false
                                                                ? "fail"
                                                                : "pending";
                                                    const testState =
                                                        api.test?.success === true
                                                            ? "ok"
                                                            : api.test?.success === false
                                                                ? "fail"
                                                                : "pending";

                                                    const chipBase =
                                                        "px-3 py-1 rounded-full text-xs border bg-white";
                                                    const chip = (state: "ok" | "fail" | "pending") =>
                                                        state === "ok"
                                                            ? `${chipBase} border-emerald-300 text-emerald-600`
                                                            : state === "fail"
                                                                ? `${chipBase} border-red-300 text-red-600`
                                                                : `${chipBase} border-slate-300 text-slate-500`;

                                                    return (
                                                        <div
                                                            key={api.name}
                                                            className={`rounded-2xl border px-4 py-3 ${reqState === "fail" || testState === "fail"
                                                                ? "border-red-300"
                                                                : reqState === "ok" && testState === "ok"
                                                                    ? "border-emerald-300"
                                                                    : "border-slate-200"
                                                                }`}
                                                        >
                                                            <div className="flex items-start justify-between gap-4">
                                                                <div className="min-w-0">
                                                                    <div className="text-base font-semibold text-primary/80 truncate">
                                                                        {api.name}
                                                                    </div>

                                                                    <div className="mt-2 flex flex-wrap gap-2">
                                                                        <button
                                                                            type="button"
                                                                            onClick={() => openChipModal(flowId, api.name, "pre")}
                                                                            className={chip("pending")}
                                                                        >
                                                                            Pre-request
                                                                        </button>

                                                                        <button
                                                                            type="button"
                                                                            onClick={() => openChipModal(flowId, api.name, "request")}
                                                                            className={chip(reqState)}
                                                                        >
                                                                            Request
                                                                        </button>

                                                                        <button
                                                                            type="button"
                                                                            onClick={() => openChipModal(flowId, api.name, "post")}
                                                                            className={chip("pending")}
                                                                        >
                                                                            Post-response
                                                                        </button>
                                                                    </div>
                                                                </div>

                                                                <div className="text-xs text-slate-500 whitespace-nowrap">
                                                                    {durSec != null ? `${durSec.toFixed(2)} s` : ""}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        )}
                                    </div>


                                </div>
                            );
                        })}
                    </div>

                </div>
            )}

            <Modal
                open={chipModal.open}
                onClose={closeChipModal}
                title={
                    chipModal.stage === "pre"
                        ? "Pre-request"
                        : chipModal.stage === "post"
                            ? "Post-response"
                            : "Request"
                }
            >
                {(() => {
                    if (!chipModal.flowId || !chipModal.apiName) return null;
                    const piece = getApiPiece(chipModal.flowId, chipModal.apiName);
                    // en "request" tomamos el detalle de request; en "post" el de test; "pre" solo metadatos básicos
                    const req = piece?.request;
                    const test = piece?.test;

                    const detailReq = req?.detail ?? {};
                    const detailTest = test?.detail ?? {};

                    const envObj =
                        chipModal.stage === "request"
                            ? detailReq?.env
                            : chipModal.stage === "post"
                                ? detailTest?.env
                                : undefined;

                    const meta = chipModal.stage === "request"
                        ? {
                            Name: piece?.name ?? "—",
                            Status: typeof req?.status === "number" ? String(req.status) : "—",
                            Type: "request",
                            Success: stateLabel(req?.success),
                        }
                        : chipModal.stage === "post"
                            ? {
                                Name: piece?.name ?? "—",
                                Status: "—",
                                Type: "script(test)",
                                Success: stateLabel(test?.success),
                            }
                            : {
                                Name: piece?.name ?? "—",
                                Status: "—",
                                Type: "pre-request",
                                Success: "Pending/No data",
                            };

                    const TabBtnSmall: React.FC<{ k: ModalTab; label: string }> = ({ k, label }) => (
                        <button
                            onClick={() => setChipModal(prev => ({ ...prev, tab: k }))}
                            className={`px-3 py-2 text-sm border-b-2 ${chipModal.tab === k ? "border-primary-blue text-slate-800" : "border-transparent text-slate-500"
                                }`}
                        >
                            {label}
                        </button>
                    );

                    const J = ({ obj }: { obj: any }) => (

                        <SyntaxHighlighter
                            language="json"
                            style={stackoverflowLight}
                            customStyle={{
                                backgroundColor: "transparent",
                                padding: "0",
                                margin: "0",
                                fontSize: 12,
                                lineHeight: "16px",
                            }}
                        >
                            {JSON.stringify(obj ?? {}, null, 2)}
                        </SyntaxHighlighter>
                    );

                    const errorFromReq = detailReq?.response?.error || detailReq?.error;
                    const errorFromTest = detailTest?.error || detailTest?.__error;

                    const errorData =
                        chipModal.stage === "request" ? errorFromReq : chipModal.stage === "post" ? errorFromTest : null;

                    const metadataBlock = (
                        <div className="space-y-3">
                            {Object.entries(meta).map(([k, v]) => (
                                <div key={k}>
                                    <div className="text-xs text-slate-500">{k}</div>
                                    <div className="mt-1 rounded bg-slate-100 text-[13px] px-3 py-2">{String(v)}</div>
                                </div>
                            ))}
                            {chipModal.stage === "request" && (
                                <>
                                    <div>
                                        <div className="text-xs text-slate-500">Request</div>
                                        <J obj={detailReq?.request} />
                                    </div>
                                    <div>
                                        <div className="text-xs text-slate-500">Response</div>
                                        <J obj={detailReq?.response} />
                                    </div>
                                </>
                            )}
                            {chipModal.stage === "post" && (
                                <>
                                    <div>
                                        <div className="text-xs text-slate-500">Script payload</div>
                                        <J obj={detailTest} />
                                    </div>
                                </>
                            )}
                        </div>
                    );

                    const errorBlock = (
                        <div>
                            {errorData ? <J obj={errorData} /> : <div className="text-sm text-slate-500">No errors</div>}
                        </div>
                    );

                    const environmentBlock = <J obj={envObj} />;

                    return (
                        <div>
                            <div className="flex items-center gap-4 border-b border-primary/20 mb-4">
                                <TabBtnSmall k="metadata" label="Metadata" />
                                <TabBtnSmall k="error" label="Error" />
                                <TabBtnSmall k="environment" label="Environment" />
                            </div>

                            {chipModal.tab === "metadata" && metadataBlock}
                            {chipModal.tab === "error" && errorBlock}
                            {chipModal.tab === "environment" && environmentBlock}
                        </div>
                    );
                })()}
            </Modal>

        </DashboardHeader>
    );
};

export default FlowsPage;