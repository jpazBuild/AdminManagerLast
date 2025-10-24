"use client";

import Image from "next/image";
import TextInputWithClearButton from "@/app/components/InputClear";
import { SearchField } from "@/app/components/SearchField";
import { DashboardHeader } from "@/app/Layouts/main";
import { ChevronRight, ChevronDown, Folder, Trash2Icon, Code2Icon, FileJson, PlusIcon } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import colletEmptyState from "../../../assets/apisImages/select-collection.svg"
import TooltipLocation from "@/app/components/ToolTip";
import { httpMethodsStyle } from "../utils/colorMethods";
import { useFetchElementsPostman } from "./hooks/useFetchElementsPostman";
import { useFetchCollection } from "./hooks/useFetchCollection";
import SyntaxHighlighter from 'react-syntax-highlighter';
import { TbBrandGraphql, TbCodeVariablePlus, TbJson } from "react-icons/tb";
import { RiErrorWarningLine } from "react-icons/ri";
import { stackoverflowLight, tomorrow, vs } from "react-syntax-highlighter/dist/esm/styles/hljs";
import { VscJson } from "react-icons/vsc";
import ButtonTab from "@/app/components/ButtonTab";
import { useFlowRunner } from "../flows/hooks/useFlowRunner";
import { toast } from "sonner";



type Detail = {
    key: string;
    uid: string;
    name: string;
    teamId: number | string;
    data: any;
};

const parseMaybeJson = (val: unknown) => {
    if (val == null) return null;
    if (typeof val === "object") return val as any;
    if (typeof val !== "string") return val;

    try {
        const once = JSON.parse(val);
        if (typeof once === "string") {
            try {
                return JSON.parse(once);
            } catch {
                return once;
            }
        }
        return once;
    } catch {
        return val;
    }
}

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

const isPlainObj = (v: any) => v && typeof v === "object" && !Array.isArray(v);
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
    keys.reduce((acc, k) => (obj && k in obj ? ((acc as any)[k] = obj[k], acc) : acc), {} as any);

const computePiecesFromMessages = (msgs: any[]) => {
    const sorted = msgs.slice().sort((a, b) => a.ts - b.ts);
    const byName: Record<string, ExecPiece> = {};

    const ensure = (name?: string | null): ExecPiece | null => {
        if (!name) return null;
        if (!byName[name]) byName[name] = { name };
        return byName[name];
    };

    for (const m of sorted) {
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

                const nextReq = {
                    success: typeof resp.success === "boolean" ? resp.success : e.request?.success ?? undefined,
                    status:
                        typeof resp.status === "number"
                            ? resp.status
                            : typeof e.request?.status === "number"
                                ? e.request?.status
                                : null,
                    detail: deepMerge(e.request?.detail ?? {}, pick(resp, ["request", "response", "env"])),
                };
                e.request = nextReq;
            }

            if (rName && rType === "script" && resp.listen === "test") {
                const e = ensure(rName);
                if (!e) continue;

                const nextTest = {
                    success: typeof resp.success === "boolean" ? resp.success : e.test?.success ?? undefined,
                    detail: deepMerge(e.test?.detail ?? {}, resp),
                };
                e.test = nextTest;
            }
        }
    }

    const pieces = Object.values(byName);
    const totalSteps = pieces.reduce((acc, p) => acc + (p.request ? 1 : 0) + (p.test ? 1 : 0), 0) || 0;
    const doneSteps = pieces.reduce(
        (acc, p) =>
            acc +
            (typeof p.request?.success === "boolean" ? 1 : 0) +
            (typeof p.test?.success === "boolean" ? 1 : 0),
        0
    );
    const progressPct = totalSteps ? Math.round((doneSteps / totalSteps) * 100) : 0;

    return { pieces, progressPct, sorted };
};

const CollectionsPage = () => {
    const [selectedCollection, setSelectedCollection] = useState<string | null>(null);
    const [selectedTeam, setSelectedTeam] = useState<string | null>(null);
    const [selectedTypeOrigin, setSelectedTypeOrigin] = useState<string | null>(null);
    const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
    const [openCollection, setOpenCollection] = useState<Record<string, boolean>>({});
    const [openCoreApi, setOpenCoreApi] = useState<Record<string, boolean>>({});
    const [isOpen, setIsOpen] = useState(false);
    const [selectedRequest, setSelectedRequest] = useState<null | {
        collection: string;
        method: string;
        response: any;
        node: any;
    }>(null);

    const [requestUrl, setRequestUrl] = useState<string>("");
    const [requestHeaders, setRequestHeaders] = useState<Array<{ key: string; value: string }>>([{ key: "", value: "" }]);
    const [isRequestRunning, setIsRequestRunning] = useState<boolean>(false);
    const [collectionQuery, setCollectionQuery] = useState<string>("");
    const [selectedWorkspaceId, setSelectedWorkspaceId] = useState<string | null>(null);
    const [selectedCollectionUid, setSelectedCollectionUid] = useState<string | null>(null);
    const [loadingByCollection, setLoadingByCollection] = useState<Record<string, boolean>>({});
    const { elements: elementsPostman } = useFetchElementsPostman();
    const [openFolder, setOpenFolder] = useState<Record<string, boolean>>({});
    const [activeTab, setActiveTab] = useState<"request" | "header" | "test">("request");
    const [activeTabRequest, setActiveTabRequest] = useState<"graphql" | "variables" | "headers" | "body">("headers");
    const { getCollection, cache: collectionsCache, loading: loadingCollection, error: collectionError } =
        useFetchCollection();
    const [resTab, setResTab] = useState<"request" | "response">("response");

    const [singleFlowId, setSingleFlowId] = useState<string | null>(null);
    const { runSingleFlowWithPayload, messagesResult, anyRunning } = useFlowRunner();
    const [variablesCode, setVariablesCode] = useState<string>("{}");
    const [variablesErr, setVariablesErr] = useState<string | null>(null);
    const [chipModal, setChipModal] = useState<{
        open: boolean;
        apiName: string | null;
        stage: Stage;
        tab: ModalTab;
    }>({ open: false, apiName: null, stage: "request", tab: "metadata" });
    const teams = [{ name: "Team A" }, { name: "Team B" }, { name: "Team C" }];
    const typeOrigin = [{ name: "Postman" }, { name: "BD" }];
    const [dataDetailCollections, setDataDetailCollections] = useState<
        Array<{ key: string; uid: string; name: string; teamId: string | number; data: any }>
    >([]);


    const selectRequest = (collectionName: string, methodName: string, node: any) => {
        setSelectedRequest({
            collection: collectionName,
            method: methodName,
            response: null,
            node
        });

        const initialUrl = node?.request?.url?.raw || "";
        setRequestUrl(initialUrl);

        const rawVars = node?.request?.body?.graphql?.variables;
        try {
            const parsed = rawVars == null
                ? {}
                : (typeof rawVars === "string" ? JSON.parse(rawVars) : rawVars);
            setVariablesCode(JSON.stringify(parsed, null, 2));
        } catch {
            setVariablesCode(typeof rawVars === "string" ? rawVars : "{}");
        }
        setVariablesErr(null);

        setRequestHeaders([{ key: "", value: "" }]);

        setIsOpen(false);
    };



    const teamId = selectedTeam ? Number(selectedTeam) : 0;
    const collectionUid = selectedCollection ?? "";

    useEffect(() => {
        if (selectedTypeOrigin === "BD") {
            setSelectedTeam(null);
        }
    }, [selectedTypeOrigin]);


    const currentWs = elementsPostman?.teams?.[0].teamId

    useEffect(() => {
        if (selectedTypeOrigin !== "Postman") return;
        if (!selectedWorkspaceId || !selectedCollectionUid) return;

        (async () => {
            try {
                const teamIdForApi: string | number = /^\d+$/.test(String(selectedWorkspaceId))
                    ? Number(selectedWorkspaceId)
                    : String(selectedWorkspaceId);

                const result = await getCollection({
                    teamId: teamIdForApi as any,
                    collectionUid: String(selectedCollectionUid),
                });
            } catch (err) {
                console.error("getCollection error:", err);
            }
        })();
    }, [selectedTypeOrigin]);

    const resolvedTeamIdForApi = useMemo(() => {
        if (!elementsPostman?.teams?.length) return undefined;

        const teamWithWS = elementsPostman.teams.find((team: any) =>
            team?.workspaces?.some(
                (ws: any) => String(ws.id ?? ws.uid ?? ws.workspaceId) === String(selectedWorkspaceId)
            )
        );

        return teamWithWS?.teamId ?? elementsPostman.teams[0].teamId;
    }, [elementsPostman, selectedWorkspaceId]);

    const handleOpenCollection = async (collection: any) => {
        const name = String(collection?.name ?? "");
        const uid = String(collection?.uid ?? collection?.id ?? collection?.collectionUid ?? "");

        const willOpen = !openCollection[name];
        setOpenCollection(prev => ({ ...prev, [name]: willOpen }));

        if (!willOpen) return;
        if (selectedTypeOrigin !== "Postman") {
            console.log("[handleOpenCollection] abort: not Postman");
            return;
        }
        if (!uid) {
            console.log("[handleOpenCollection] abort: no uid");
            return;
        }
        if (!resolvedTeamIdForApi) {
            console.log("[handleOpenCollection] abort: no resolvedTeamIdForApi");
            return;
        }
        if (loadingByCollection[name]) {
            console.log("[handleOpenCollection] skip: already loading", name);
            return;
        }

        const cacheKeyWithTeam = `${resolvedTeamIdForApi}:${uid}`;
        const cacheKeyUidOnly = uid;

        const cached =
            collectionsCache?.[cacheKeyWithTeam] ??
            collectionsCache?.[cacheKeyUidOnly];

        const pushToStack = (data: any) => {
            setDataDetailCollections(prev => {
                const exists = prev.some(
                    x => x.key === cacheKeyWithTeam || x.key === cacheKeyUidOnly || x.uid === uid
                );
                if (exists) return prev;
                return [{ key: cacheKeyWithTeam, uid, name, teamId: resolvedTeamIdForApi, data }, ...prev];
            });
        };

        try {
            if (cached) {
                console.log("[handleOpenCollection] using cache:", cached);
                pushToStack(cached);
                return;
            }

            console.log("[handleOpenCollection] fetching:", {
                teamId: resolvedTeamIdForApi,
                collectionUid: uid
            });

            setLoadingByCollection(prev => ({ ...prev, [name]: true }));

            const resp = await getCollection({
                teamId: resolvedTeamIdForApi as any,
                collectionUid: uid
            });

            const data = resp?.data ?? resp;
            console.log("[handleOpenCollection] fetched OK");
            pushToStack(data);
        } catch (err) {
            console.error("[handleOpenCollection] getCollection error:", err);
        } finally {
            setLoadingByCollection(prev => ({ ...prev, [name]: false }));
        }
    };
    console.log("dataDetailCollections:", dataDetailCollections);

    const dataDetailByUid = useMemo<Record<string, Detail>>(
        () =>
            Object.fromEntries(
                dataDetailCollections.map((dc) => [dc.uid, dc])
            ),
        [dataDetailCollections]
    );

    const folderKey = (colUid: string, path: string[]) =>
        `${colUid}:${path.join("/")}`;

    const toggleFolderOpen = (key: string) =>
        setOpenFolder((prev) => ({ ...prev, [key]: !prev[key] }));

    const renderNode = (
        node: any,
        colUid: string,
        colName: string,
        path: string[] = []
    ): React.ReactNode => {
        if (!node) return null;

        const isFolder = Array.isArray(node.item) && !node.request;
        const displayName = node.name ?? node.request?.url?.raw ?? "Untitled";

        if (isFolder) {
            const key = folderKey(colUid, [...path, displayName]);
            const isOpen = !!openFolder[key];

            return (
                <li key={key} className="select-none">
                    <div
                        className="flex items-center gap-2 cursor-pointer text-primary/80"
                        onClick={() => toggleFolderOpen(key)}
                    >
                        {isOpen ? (
                            <ChevronDown className="w-4 h-4 text-primary" />
                        ) : (
                            <ChevronRight className="w-4 h-4 text-primary" />
                        )}
                        <Folder className="w-4 h-4 text-primary" />
                        <span className="font-medium">{displayName}</span>
                    </div>

                    {isOpen && (
                        <ul className="ml-5 mt-1 space-y-1">
                            {node.item.map((child: any, idx: number) =>
                                renderNode(child, colUid, colName, [...path, displayName, String(idx)])
                            )}
                        </ul>
                    )}
                </li>
            );
        }

        const method = String(node?.request?.method ?? "GET").toUpperCase();
        const reqKey = `${colUid}:${[...path, displayName].join("/")}`;


        return (
            <div key={reqKey} className="flex items-center gap-2">
                <span
                    className={`text-[10px] px-2 py-0.5 rounded ${httpMethodsStyle(method)}`}
                    title={method}
                >
                    {method}
                </span>

                <button
                    type="button"
                    className="text-left truncate text-primary/85 font-medium"
                    onClick={() => selectRequest(colName, displayName, node)}
                    title={displayName}
                >
                    {displayName}
                </button>
            </div>
        );
    };

    const renderCollectionTree = (colDetail: any, colUid: string, colName: string) => {
        const items = colDetail?.data?.item ?? [];
        if (!Array.isArray(items) || items.length === 0) {
            return <p className="text-gray-500">No folders or requests</p>;
        }
        return (
            <ul className="space-y-1">
                {items.map((node: any, idx: number) =>
                    renderNode(node, colUid, colName, [String(idx)])
                )}
            </ul>
        );
    };

    const variablesRaw = selectedRequest?.node?.request?.body?.graphql?.variables;
    const variablesParsed = useMemo(() => parseMaybeJson(variablesRaw), [variablesRaw]);

    console.log(" selectedRequest:", selectedRequest, { variablesRaw, variablesParsed });
    console.log({ requestHeaders });


    const memoHeaders = useMemo(
        () =>
            selectedRequest?.node?.request?.header?.map((h: any) => ({
                key: String(h?.key ?? ""),
                value: String(h?.value ?? ""),
            })) ?? [{ key: "", value: "" }],
        [selectedRequest]
    );

    useEffect(() => {
        setRequestHeaders(prev => {
            const sameLen = prev.length === memoHeaders.length;
            const sameAll = sameLen && prev.every((p, i) =>
                p.key === memoHeaders[i].key && p.value === memoHeaders[i].value
            );
            return sameAll ? prev : memoHeaders;
        });
    }, [memoHeaders]);




    const rawValue = selectedRequest?.response?.data ?? selectedRequest?.response ?? selectedRequest ?? {};
    const parsed = useMemo(() => parseMaybeJson(rawValue), [rawValue]);

    const code = useMemo(() => {
        try {
            return typeof parsed === "string" ? parsed : JSON.stringify(parsed ?? {}, null, 2);
        } catch {
            return "{}";
        }
    }, [parsed]);


    const buildSinglePayload = () => {
        if (!selectedRequest?.node) return null;

        const rn = selectedRequest.node ?? {};
        const request = rn?.request ?? {};

        const cleanedHeadersList = (requestHeaders || [])
            .filter(h => h.key || h.value)
            .map(h => ({ key: h.key, value: h.value }));

        const headersObj = cleanedHeadersList.reduce(
            (acc, h) => (h.key ? { ...acc, [h.key]: h.value } : acc),
            {} as Record<string, string>
        );

        let vars: any = {};
        try {
            vars = variablesCode?.trim() ? JSON.parse(variablesCode) : {};
        } catch (e) {
            toast.error("Variables JSON inválido");
            return null;
        }

        const variablesAsString =
            variablesCode?.trim() ? variablesCode : JSON.stringify(vars);

        const methodUpper = String(request.method || "GET").toUpperCase();
        const method = methodUpper.toLowerCase();
        const url = requestUrl || request?.url?.raw || "";
        if (!url) {
            toast.error("URL requerida");
            return null;
        }

        const bodyMode = request?.body?.mode;
        let data: any = undefined;

        if (["post", "put", "patch"].includes(method)) {
            if (bodyMode === "graphql") {
                const query = request?.body?.graphql?.query ?? "";
                data = { query, variables: variablesAsString };
                if (!headersObj["Content-Type"]) headersObj["Content-Type"] = "application/json";
            } else if (bodyMode === "raw") {
                const raw = request?.body?.raw ?? "";
                data = typeof raw === "string" ? raw : JSON.stringify(raw);
                if (!headersObj["Content-Type"]) headersObj["Content-Type"] = "application/json";
            }
        }

        const mergedHeadersArray =
            Object.keys(headersObj).length
                ? Object.entries(headersObj).map(([key, value]) => ({ key, value }))
                : (request.header ?? []);

        const apiItem = {
            ...rn,
            name: rn?.name ?? selectedRequest?.method ?? "Request",
            request: {
                ...request,
                method: methodUpper,
                header: mergedHeadersArray,
                url: { ...(request.url ?? {}), raw: url },
                ...(data !== undefined
                    ? (bodyMode === "graphql"
                        ? { body: { mode: "graphql", graphql: { query: request?.body?.graphql?.query ?? "", variables: variablesAsString } } }
                        : { body: { mode: "raw", raw: data } })
                    : {}),
            },
        };

        const flowId = `single-flow-${Date.now()}`;

        const payload = {
            action: "runApis",
            key: `single/run_${Date.now()}.json`,
            apis: [apiItem],
            env: { variables: vars },
        };

        return { flowId, payload };
    };

    const runRequest = async (collectionName: string, methodName: string) => {
        const built = buildSinglePayload();
        if (!built) {
            toast.error("No request selected");
            return;
        }

        const { flowId, payload } = built;

        setIsOpen(true);

        setSingleFlowId(flowId);

        runSingleFlowWithPayload(flowId, payload);
    };

    const normalizeSinglePack = (pack: any) => {
        if (Array.isArray(pack) && pack.length && pack[0]?.name) {
            return { pieces: pack as ExecPiece[], sorted: [] as any[], progressPct: calcProgressFromPieces(pack as ExecPiece[]) };
        }

        if (pack?.pieces && Array.isArray(pack.pieces)) {
            return { pieces: pack.pieces as ExecPiece[], sorted: Array.isArray(pack.sorted) ? pack.sorted : [], progressPct: calcProgressFromPieces(pack.pieces as ExecPiece[]) };
        }

        if (Array.isArray(pack?.messages)) {
            const { pieces, progressPct, sorted } = computePiecesFromMessages(pack.messages);
            return { pieces, progressPct, sorted };
        }

        return { pieces: [] as ExecPiece[], progressPct: 0, sorted: [] as any[] };
    };

    const calcProgressFromPieces = (list: ExecPiece[]) => {
        const totalSteps = list.reduce((acc, p) => acc + (p.request ? 1 : 0) + (p.test ? 1 : 0), 0) || 0;
        const doneSteps = list.reduce(
            (acc, p) =>
                acc + (typeof p.request?.success === "boolean" ? 1 : 0) + (typeof p.test?.success === "boolean" ? 1 : 0),
            0
        );
        return totalSteps ? Math.round((doneSteps / totalSteps) * 100) : 0;
    };

    const { pieces: singlePieces, progressPct: singlePct, sorted: singleMsgs } = useMemo(() => {
        if (!singleFlowId) return { pieces: [] as ExecPiece[], progressPct: 0, sorted: [] as any[] };
        const pack = messagesResult?.[singleFlowId];

        return normalizeSinglePack(pack);
    }, [singleFlowId, messagesResult]);



    useEffect(() => {
        if (variablesParsed != null) {
            try {
                setVariablesCode(
                    typeof variablesParsed === "string"
                        ? variablesParsed
                        : JSON.stringify(variablesParsed, null, 2)
                );
            } catch {
                setVariablesCode(typeof variablesRaw === "string" ? variablesRaw : "{}");
            }
        } else {
            setVariablesCode(typeof variablesRaw === "string" ? variablesRaw : "{}");
        }
        setVariablesErr(null);
    }, [selectedRequest?.node, variablesRaw, variablesParsed]);


    console.log("singlePieces for render:", singlePieces);



    return (
        <DashboardHeader pageType="api" callback={(mobileSidebarOpen) => {
            setMobileSidebarOpen(mobileSidebarOpen);
        }}>
            <div className="flex gap-2 w-full h-full">
                <div className="w-72 border-r border-primary/10 bg-white flex-shrink-0 flex flex-col overflow-hidden">
                    <div className="flex-shrink-0 p-4 space-y-4 bg-white border-b border-primary/10">
                        <SearchField
                            label="From"
                            value={selectedTypeOrigin ?? ""}
                            onChange={setSelectedTypeOrigin}
                            placeholder="Search collections"
                            options={typeOrigin.map((t) => ({ label: t.name, value: t.name }))}
                        />

                        <TooltipLocation
                            text="Teams only can be selected from 'Postman'"
                            position="right"
                            active={selectedTypeOrigin === "BD"}
                        >
                            <div className={selectedTypeOrigin === "BD" ? "bg-gray-100 text-gray-400" : ""}>
                                <SearchField
                                    label="Team"
                                    value={selectedWorkspaceId ?? ""}
                                    onChange={setSelectedWorkspaceId}
                                    placeholder="Search Team"
                                    options={
                                        (elementsPostman?.teams?.[0]?.workspaces ?? []).map((ws: any) => ({
                                            label: ws.name,
                                            value: String(ws.id ?? ws.uid ?? ws.workspaceId),
                                        }))
                                    }
                                    disabled={selectedTypeOrigin === "BD"}
                                    className={selectedTypeOrigin === "BD" ? "cursor-not-allowed" : ""}
                                />
                            </div>
                        </TooltipLocation>


                        <TextInputWithClearButton
                            id="collection-name"
                            label="Search Collections"
                            placeholder="Enter collection name"
                            value={collectionQuery}
                            onChangeHandler={(e) => setCollectionQuery(e.target.value)}
                            isSearch={true}
                        />
                    </div>

                    <div className="flex flex-col p-4 overflow-y-auto">
                        {elementsPostman?.teams[0]?.workspaces?.find((t: any) => t.id === selectedWorkspaceId)?.collections?.length && (
                            <>
                                {elementsPostman?.teams[0]?.workspaces
                                    ?.find((t: any) => t.id === selectedWorkspaceId)
                                    ?.collections
                                    ?.filter((c: any) =>
                                        collectionQuery ? c.name?.toLowerCase().includes(collectionQuery.toLowerCase()) : true
                                    )
                                    ?.map((collection: any, idx: number) => {
                                        const isOpen = !!openCollection[collection.name];
                                        const isLoading = !!loadingByCollection[collection.name];
                                        return (
                                            <div key={idx} className="mb-2">
                                                <div
                                                    className="flex items-center gap-2 text-primary/80 cursor-pointer select-none"
                                                    onClick={() => handleOpenCollection(collection)}
                                                >
                                                    {isOpen
                                                        ? <ChevronDown className="w-4 h-4 text-primary" />
                                                        : <ChevronRight className="w-4 h-4 text-primary" />
                                                    }
                                                    <p className="text-sm">{collection.name}</p>
                                                </div>

                                                {isOpen && (
                                                    <div className="ml-6 mt-2 text-sm text-gray-600">
                                                        {!collectionError && dataDetailByUid?.[String(collection.uid)] && (
                                                            renderCollectionTree(
                                                                dataDetailByUid[String(collection.uid)],
                                                                String(collection.uid),
                                                                String(collection.name)
                                                            )
                                                        )}

                                                        {isLoading && (
                                                            <div className="flex items-center gap-2 text-primary/70">
                                                                <div className="h-4 w-1/2 animate-pulse rounded bg-gray-200"></div>
                                                            </div>
                                                        )}

                                                        {!isLoading && collectionError && (
                                                            <div className="bg-red-200 text-primary/90 p-2 rounded font-normal items-center flex gap-2">
                                                                <RiErrorWarningLine className="w-4 h-4" />
                                                                {String(collectionError)}
                                                            </div>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                            </>
                        )}
                    </div>
                </div>

                <div className="flex h-full w-full flex-col gap-4 overflow-hidden">
                    <div className="flex w-full h-full border border-primary/20 rounded-md bg-white shadow-sm justify-center overflow-y-auto">
                        {selectedRequest ? (
                            <div className="flex justify-center self-center h-full w-full p-2 overflow-y-auto">
                                <div className="w-2/3 py-2 h-full">
                                    <div className="flex flex-col gap-2 mb-4">
                                        <div className="flex items-center text-lg font-semibold text-primary/80">
                                            {selectedRequest?.node?.name}
                                            <span
                                                className={`ml-2 text-xs px-2 py-1 rounded ${httpMethodsStyle(selectedRequest?.node?.request?.method)}`}
                                            >
                                                {selectedRequest?.node?.request?.method ?? "GET"}
                                            </span>
                                        </div>
                                        <p className="text-gray-500">Set the information for this collection below</p>
                                    </div>

                                    <div className="flex justify-center gap-2 mb-4 text-primary/85">
                                        <ButtonTab
                                            label="Request"
                                            value="request"
                                            isActive={activeTab === "request"}
                                            onClick={() => setActiveTab("request")}
                                        />
                                        <ButtonTab
                                            label="Test"
                                            value="test"
                                            isActive={activeTab === "test"}
                                            onClick={() => setActiveTab("test")}
                                        />

                                    </div>
                                    {activeTab === "request" && (
                                        <div>
                                            <TextInputWithClearButton
                                                id="request-url"
                                                type="text"
                                                inputMode="text"
                                                value={requestUrl}
                                                onChangeHandler={(e) => setRequestUrl(e.target.value)}
                                                placeholder="Enter request URL"
                                                label="Enter request URL"
                                            />
                                            {selectedRequest?.node?.request?.body?.mode === "graphql" && (
                                                <div className="flex items-center gap-2 mt-4">
                                                    <ButtonTab
                                                        label="Headers"
                                                        value="headers"
                                                        isActive={activeTabRequest === "headers"}
                                                        onClick={() => setActiveTabRequest("headers")}
                                                        Icon={<TbBrandGraphql className="text-primary/85 w-5 h-5" />}
                                                        className="text-[14px]"
                                                    />
                                                    <ButtonTab
                                                        label="Query/Mutation"
                                                        value="graphql"
                                                        isActive={activeTabRequest === "graphql"}
                                                        onClick={() => setActiveTabRequest("graphql")}
                                                        Icon={<TbBrandGraphql className="text-primary/85 w-5 h-5" />}
                                                        className="text-[14px]"
                                                    />
                                                    <ButtonTab
                                                        label="Variables"
                                                        value="variables"
                                                        isActive={activeTabRequest === "variables"}
                                                        onClick={() => setActiveTabRequest("variables")}
                                                        Icon={<TbCodeVariablePlus className="text-primary/85 w-5 h-5" />}
                                                        className="text-[14px]"
                                                    />
                                                </div>
                                            )}

                                            {selectedRequest?.node?.request?.body?.mode === "raw" && (
                                                <div className="flex items-center gap-2 mt-4">
                                                    <ButtonTab
                                                        label="Headers"
                                                        value="headers"
                                                        isActive={activeTabRequest === "headers"}
                                                        onClick={() => setActiveTabRequest("headers")}
                                                    />
                                                    <ButtonTab
                                                        label="Body"
                                                        value="body"
                                                        isActive={activeTabRequest === "body"}
                                                        onClick={() => setActiveTabRequest("body")}
                                                        Icon={<VscJson className="text-primary/85 w-5 h-5" />}
                                                    />
                                                </div>
                                            )}
                                            {activeTabRequest === "body" && (
                                                <div className="max-h-[400px] overflow-y-auto">
                                                    <SyntaxHighlighter
                                                        language="json"
                                                        style={vs}
                                                        customStyle={{ borderRadius: "0.5rem", padding: "1rem", fontSize: "0.875rem", backgroundColor: "#F3F6F9", marginTop: "1rem" }}
                                                    >
                                                        {selectedRequest?.node?.request?.body?.raw ?? "// Request body"}
                                                    </SyntaxHighlighter>
                                                </div>
                                            )}
                                            {
                                                activeTabRequest === "graphql" && (
                                                    <>
                                                        {["POST", "PUT", "PATCH"].includes((selectedRequest?.node?.request?.method ?? "GET").toUpperCase()) && (

                                                            <div className="max-h-[400px] overflow-y-auto">
                                                                <SyntaxHighlighter
                                                                    language={selectedRequest?.node?.request?.body?.mode === "graphql" ? "graphql" : "json"}
                                                                    style={selectedRequest?.node?.request?.body?.mode === "graphql" ? tomorrow : stackoverflowLight}
                                                                    customStyle={{ borderRadius: "0.5rem", padding: "1rem", fontSize: "0.875rem", backgroundColor: "#F3F6F9", marginTop: "1rem" }}
                                                                >
                                                                    {selectedRequest?.node?.request?.body?.mode === "graphql"
                                                                        ? selectedRequest?.node?.request?.body?.graphql.query ?? "// Request body"
                                                                        : JSON.stringify(selectedRequest?.node?.request?.body?.raw, null, 2) ?? "// Request body"}
                                                                </SyntaxHighlighter>
                                                            </div>

                                                        )}
                                                    </>
                                                )
                                            }

                                            {activeTabRequest === "variables" && (
                                                <div className="space-y-2">
                                                    <div className="flex items-center justify-between">
                                                        <h2 className="text-sm text-slate-600">Variables (JSON)</h2>
                                                        <div className="flex items-center gap-2">
                                                            <button
                                                                type="button"
                                                                className="px-2 py-1 text-xs rounded border bg-white hover:bg-slate-50"
                                                                onClick={() => {
                                                                    try {
                                                                        const pretty = JSON.stringify(JSON.parse(variablesCode || "{}"), null, 2);
                                                                        setVariablesCode(pretty);
                                                                        setVariablesErr(null);
                                                                    } catch (e: any) {
                                                                        setVariablesErr(e?.message || "Invalid JSON");
                                                                    }
                                                                }}
                                                            >
                                                                Prettify
                                                            </button>
                                                            <button
                                                                type="button"
                                                                className="px-2 py-1 text-xs rounded border bg-white hover:bg-slate-50"
                                                                onClick={() => {
                                                                    setVariablesCode("{}");
                                                                    setVariablesErr(null);
                                                                }}
                                                            >
                                                                Reset
                                                            </button>
                                                        </div>
                                                    </div>

                                                    <div className="max-h-[400px] overflow-y-auto">
                                                        <textarea
                                                            value={variablesCode}
                                                            onChange={(e) => {
                                                                setVariablesCode(e.target.value);
                                                                if (variablesErr) setVariablesErr(null);
                                                            }}
                                                            onKeyDown={(e) => {
                                                                if (e.key === "Tab") {
                                                                    e.preventDefault();
                                                                    const el = e.currentTarget;
                                                                    const start = el.selectionStart ?? 0;
                                                                    const end = el.selectionEnd ?? 0;
                                                                    const before = variablesCode.slice(0, start);
                                                                    const after = variablesCode.slice(end);
                                                                    const next = `${before}  ${after}`;
                                                                    setVariablesCode(next);
                                                                    queueMicrotask(() => {
                                                                        el.selectionStart = el.selectionEnd = start + 2;
                                                                    });
                                                                }
                                                            }}
                                                            spellCheck={false}
                                                            className="w-full font-mono text-[13px] leading-5 rounded-md border border-slate-200 bg-[#F3F6F9] p-3 outline-none focus:ring-2 focus:ring-primary/30"
                                                            rows={14}
                                                            placeholder='{"foo":"bar"}'
                                                        />
                                                    </div>

                                                    {variablesErr && (
                                                        <div className="text-xs text-red-600">JSON error: {variablesErr}</div>
                                                    )}
                                                </div>
                                            )}
                                            {activeTabRequest === "headers" && (
                                                <div className="mt-4 w-full">
                                                    <h2 className="text-sm text-slate-600 mb-2">Headers</h2>
                                                    <div className="flex flex-col gap-2 w-full h-full">
                                                        {requestHeaders.map((h, i) => (
                                                            <div key={i} className="flex gap-2 w-full items-center">
                                                                <div className="flex w-full">
                                                                    <TextInputWithClearButton
                                                                        id={`header-key-${i}`}
                                                                        type="text"
                                                                        inputMode="text"
                                                                        value={h.key}
                                                                        onChangeHandler={(e) => {
                                                                            const arr = [...requestHeaders];
                                                                            arr[i].key = e.target.value;
                                                                            setRequestHeaders(arr);
                                                                        }}
                                                                        placeholder="Enter key"
                                                                        label="Key"
                                                                    />
                                                                </div>
                                                                <div className="flex w-full">
                                                                    <TextInputWithClearButton
                                                                        id={`header-value-${i}`}
                                                                        type="text"
                                                                        inputMode="text"
                                                                        value={h.value}
                                                                        onChangeHandler={(e) => {
                                                                            const arr = [...requestHeaders];
                                                                            arr[i].value = e.target.value;
                                                                            setRequestHeaders(arr);
                                                                        }}
                                                                        placeholder="Enter value"
                                                                        label="Value"
                                                                    />
                                                                </div>
                                                                <button
                                                                    onClick={() => {
                                                                        const arr = requestHeaders.filter((_, idx) => idx !== i);
                                                                        setRequestHeaders(arr.length ? arr : [{ key: "", value: "" }]);
                                                                    }}
                                                                    className="w-10 p-2 rounded-md hover:bg-gray-100"
                                                                >
                                                                    <Trash2Icon className="w-5 h-5 text-primary/60 hover:text-red-700" />
                                                                </button>
                                                            </div>
                                                        ))}
                                                    </div>
                                                    <button
                                                        onClick={() => setRequestHeaders([...requestHeaders, { key: "", value: "" }])}
                                                        className="text-blue-600 text-sm flex items-center gap-1 hover:underline"
                                                    >
                                                        <PlusIcon className="w-4 h-4" /> Add header
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {activeTab === "test" && (
                                        <div>
                                            <h2 className="text-sm text-slate-600 mb-2">Test Script</h2>
                                            <div className="max-h-[400px] overflow-y-auto">
                                                <SyntaxHighlighter
                                                    language="javascript"
                                                    style={vs}
                                                    customStyle={{ borderRadius: "0.5rem", padding: "1rem", fontSize: "0.875rem", backgroundColor: "#F3F6F9", marginTop: "1rem" }}
                                                >
                                                    {selectedRequest?.node?.event?.find((e: any) => e.listen === "test")?.script?.exec?.join("\n") ?? "// Test script"}
                                                </SyntaxHighlighter>
                                            </div>
                                        </div>
                                    )}

                                    <div className="flex mt-6 pb-4">
                                        <button
                                            onClick={() => runRequest(selectedRequest.collection, selectedRequest.method)}
                                            disabled={isRequestRunning}
                                            className="bg-primary/90 text-white px-6 py-2 rounded-md hover:opacity-95 disabled:opacity-50"
                                        >
                                            {isRequestRunning ? "Running..." : "Run"}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="flex w-full flex-col items-center justify-center text-center text-slate-500">
                                <Image
                                    src={colletEmptyState}
                                    alt="Select a collection"
                                    className="h-20 w-auto rounded-md p-2"
                                />
                                <div>
                                    <p className="font-medium text-lg">Select a collection</p>
                                    <p className="text-sm text-slate-400">Run a collection to see the API response</p>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className={`flex border border-primary/20 rounded-md bg-white shadow-sm flex-col ${isOpen ? "h-full" : ""}`}>
                        <button
                            onClick={() => setIsOpen(!isOpen)}
                            className="flex-shrink-0 w-full flex items-center justify-between px-4 py-3 text-sm font-medium text-slate-800 hover:bg-slate-50 border-b border-primary/10"
                        >
                            <span>Response · JSON</span>
                            <ChevronDown
                                className={`h-4 w-4 transition-transform ${isOpen ? "rotate-180" : ""}`}
                            />
                        </button>


                        {isOpen && (
                            <div className="w-full h-full flex p-4 overflow-y-auto text-sm bg-slate-50">
                                {singleFlowId ? (
                                    singlePieces.length ? (
                                        <div className="w-full">
                                            <div className="mb-3 flex items-center gap-2">


                                                <div className="ml-auto text-xs">
                                                    {(() => {
                                                        const req = (singlePieces as any)[0]?.request;
                                                        const label =
                                                            req?.success === true
                                                                ? "Success"
                                                                : req?.success === false
                                                                    ? "Failed"
                                                                    : "Pending";
                                                        const cls =
                                                            req?.success === true
                                                                ? "border-emerald-600 text-emerald-700"
                                                                : req?.success === false
                                                                    ? "border-red-600 text-red-600"
                                                                    : "border-slate-300 text-slate-600";
                                                        return (
                                                            <span className={`px-3 py-1 rounded-full border bg-white ${cls}`}>
                                                                {label}{typeof req?.status === "number" ? ` · ${req.status}` : ""}
                                                            </span>
                                                        );
                                                    })()}
                                                </div>
                                            </div>

                                            <div className="max-h-[60vh] overflow-auto rounded-md">
                                                <SyntaxHighlighter
                                                    language="json"
                                                    style={stackoverflowLight}
                                                    showLineNumbers
                                                    wrapLongLines
                                                    customStyle={{
                                                        margin: 0,
                                                        padding: "12px 16px",
                                                        borderRadius: "0.375rem",
                                                        background: "#ffffff",
                                                        fontSize: "0.9rem",
                                                        width: "100%",
                                                    }}
                                                    lineNumberStyle={{
                                                        minWidth: "2ch",
                                                        paddingRight: "12px",
                                                        color: "#9AA0A6",
                                                        userSelect: "none",
                                                    }}
                                                >
                                                    {(() => {
                                                        const first = (singlePieces as any)[0] || {};
                                                        const reqDetail = first?.request?.detail || {};
                                                        const testDetail = first?.test?.detail || {};

                                                        const requestPayload =
                                                            reqDetail?.request ??
                                                            testDetail?.request ??
                                                            reqDetail ??
                                                            {};

                                                        const responsePayload =
                                                            reqDetail?.response ??
                                                            testDetail?.response ??
                                                            (testDetail?.error ? { error: testDetail.error } : {});

                                                        const payload = resTab === "request" ? requestPayload : responsePayload;
                                                        return JSON.stringify(payload, null, 2);
                                                    })()}
                                                </SyntaxHighlighter>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-slate-400 text-sm">
                                            {anyRunning ? "Running..." : "No response yet. Run the flow to see results."}
                                        </div>
                                    )
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-slate-400 text-sm">
                                        No response yet. Run the flow to see results.
                                    </div>
                                )}
                            </div>
                        )}

                    </div>
                </div>
            </div>

        </DashboardHeader>
    );
};

export default CollectionsPage;