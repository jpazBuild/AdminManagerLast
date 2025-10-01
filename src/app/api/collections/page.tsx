"use client";

import Image from "next/image";
import TextInputWithClearButton from "@/app/components/InputClear";
import { SearchField } from "@/app/components/SearchField";
import { DashboardHeader } from "@/app/Layouts/main";
import { ChevronRight, ChevronDown, Folder, Trash2Icon, FolderIcon, Play } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import colletEmptyState from "../../../assets/apisImages/select-collection.svg"
import TooltipLocation from "@/app/components/ToolTip";
import JSONEditor from "../components/JsonEditor";
import { httpMethodsStyle } from "../utils/colorMethods";
import { useFetchElementsPostman } from "./hooks/useFetchElementsPostman";
import { useFetchCollection } from "./hooks/useFetchCollection";
import SyntaxHighlighter from "react-syntax-highlighter";
import { oneLight } from "react-syntax-highlighter/dist/esm/styles/prism";
import { tomorrow } from "react-syntax-highlighter/dist/esm/styles/hljs";
import { TbBrandGraphql, TbCodeVariablePlus } from "react-icons/tb";

const listCollections = [
    { name: "Interface Mocks 1", team: "Team A", origin: "Postman" },
    { name: "Interface Mocks 2", team: "Team B", origin: "BD" },
    { name: "Collection 3", team: "Team C", origin: "Postman" },
    { name: "Collection 4", team: "Team A", origin: "BD" },
    { name: "Collection 5", team: "Team B", origin: "Postman" },
];

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
    if (typeof val !== "string") return null;

    try {
        const once = JSON.parse(val);
        if (typeof once === "string") {
            try { return JSON.parse(once); } catch { return once; }
        }
        return once;
    } catch {
        try {
            const normalized = val
                .replace(/(['"])?([a-zA-Z0-9_]+)\1\s*:/g, '"$2":')
                .replace(/'/g, '"');
            return JSON.parse(normalized);
        } catch {
            return null;
        }
    }
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
    const [dataDetailCollection, setDataDetailCollection] = useState<any[]>([]);
    const [openFolder, setOpenFolder] = useState<Record<string, boolean>>({});
    const [activeTab, setActiveTab] = useState<"request" | "header">("request");
    const [activeTabRequest, setActiveTabRequest] = useState<"graphql" | "variables">("graphql");
    const { getCollection, cache: collectionsCache, loading: loadingCollection } =
        useFetchCollection();


    const teams = [{ name: "Team A" }, { name: "Team B" }, { name: "Team C" }];
    const typeOrigin = [{ name: "Postman" }, { name: "BD" }];
    const [dataDetailCollections, setDataDetailCollections] = useState<
        Array<{ key: string; uid: string; name: string; teamId: string | number; data: any }>
    >([]);

    const selectRequest = (collectionName: string, methodName: string, node: any) => {
        console.log("selectRequest", { collectionName, methodName, node });
        setSelectedRequest({
            collection: collectionName,
            method: methodName,
            response: null,
            node
        });

        const defaultUrl = `http://localhost:3000/api/${collectionName.toLowerCase().replace(/\s+/g, "-")}`;
        setRequestUrl(defaultUrl);

        setRequestHeaders([{ key: "", value: "" }]);

        setIsOpen(false);
    };

    const runRequest = async (collectionName: string, methodName: string) => {
        try {
            setIsRequestRunning(true);

            const mockResponse = {
                status: 200,
                timestamp: new Date().toISOString(),
                data: {
                    message: `${methodName} executed for ${collectionName}`,
                    requestUrl,
                    headers: requestHeaders.filter(h => h.key || h.value),
                    payload: { id: 123, name: "Mock item" },
                },
            };

            setSelectedRequest({
                collection: collectionName,
                method: methodName,
                response: mockResponse,
                node: selectedRequest?.node || null,
            });

            setIsOpen(true);
        } catch (err) {
            console.error(err);
        } finally {
            setIsRequestRunning(false);
        }
    };


    const filteredCollections = listCollections.filter((col) => {
        const matchName = selectedCollection ? col.name.toLowerCase().includes(selectedCollection.toLowerCase()) : true;
        const matchTeam = selectedTeam ? col.team === selectedTeam : true;
        const matchOrigin = selectedTypeOrigin ? col.origin === selectedTypeOrigin : true;
        return matchName && matchTeam && matchOrigin;
    });


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

                console.log("Fetched collection:", result);
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

    return (
        <DashboardHeader pageType="api" callback={(mobileSidebarOpen) => {
            setMobileSidebarOpen(mobileSidebarOpen);
        }}>
            <div className="flex gap-2 w-full h-full overflow-hidden">
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
                                            value: String(ws.id ?? ws.uid ?? ws.workspaceId), // usa id/uid real
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

                    <div className="flex-1 p-4 overflow-y-auto">
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

                                                    {isLoading && (
                                                        <span className="ml-2 text-xs text-primary/70 animate-pulse">
                                                            loading...
                                                        </span>
                                                    )}
                                                </div>

                                                {isOpen && (
                                                    <div className="ml-6 mt-2 text-sm text-gray-600">
                                                        {dataDetailByUid?.[String(collection.uid)]
                                                            ? renderCollectionTree(
                                                                dataDetailByUid[String(collection.uid)],
                                                                String(collection.uid),
                                                                String(collection.name)
                                                            )
                                                            : <p className="text-gray-500">Loading…</p>}
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                            </>
                        )}
                    </div>
                </div>

                <div className="flex h-full w-full flex-col gap-4 overflow-hidden flex-wrap-col">
                    <div className="flex w-full h-full border border-primary/20 rounded-md bg-white shadow-sm justify-center max-h-2/3">
                        {selectedRequest ? (
                            <div className="flex justify-center self-center place-content-center w-full p-6 overflow-y-auto">
                                <div className="w-2/3 py-2">
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

                                    <div className="flex justify-center gap-2 mb-6 text-primary/85">
                                        <button onClick={() => setActiveTab("request")} className={`px-4 py-2 rounded-md bg-gray-100 hover:bg-gray-200 ${activeTab === "request" ? "font-semibold bg-gray-200" : ""}`}>
                                            Request
                                        </button>
                                        <button onClick={() => setActiveTab("header")} className={`px-4 py-2 rounded-md bg-gray-100 hover:bg-gray-200 ${activeTab === "header" ? "font-semibold bg-gray-200" : ""}`}>
                                            Header
                                        </button>
                                    </div>
                                    {activeTab === "request" && (
                                        <div>
                                            <TextInputWithClearButton
                                                id="request-url"
                                                type="text"
                                                inputMode="text"
                                                value={selectedRequest?.node?.request?.url?.raw ?? requestUrl}
                                                onChangeHandler={(e) => setRequestUrl(e.target.value)}
                                                placeholder="Enter request URL"
                                                label="Enter request URL"
                                            />
                                            {selectedRequest?.node?.request?.body?.mode === "graphql" && (
                                                <div className="flex items-center gap-2 mt-4">
                                                    <div onClick={() => setActiveTabRequest("graphql")} className="flex gap-2 bg-gray-200 px-3 py-2 text-[14px] rounded-3xl"><TbBrandGraphql className="text-primary/85 w-5 h-5" /> Query/Mutation</div>
                                                    <div onClick={() => setActiveTabRequest("variables")} className="flex gap-2 bg-gray-200 px-3 py-2 text-[14px] rounded-3xl"><TbCodeVariablePlus className="text-primary/85 w-5 h-5" /> Variables</div>
                                                </div>
                                            )}

                                            {
                                                activeTabRequest === "graphql" && (
                                                    <>
                                                        {["POST", "PUT", "PATCH"].includes((selectedRequest?.node?.request?.method ?? "GET").toUpperCase()) && (

                                                            <div className="max-h-[400px] overflow-y-auto">
                                                                <SyntaxHighlighter
                                                                    language={selectedRequest?.node?.request?.body?.mode === "graphql" ? "graphql" : "json"}
                                                                    style={oneLight}
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

                                            {
                                                activeTabRequest === "variables" && (
                                                    <div className="max-h-[400px] overflow-y-auto">
                                                        <SyntaxHighlighter
                                                            language="json"
                                                            style={oneLight}
                                                            customStyle={{ borderRadius: "0.5rem", padding: "1rem", fontSize: "0.875rem", backgroundColor: "#F3F6F9", marginTop: "1rem" }}
                                                        >
                                                            {
                                                                variablesParsed != null
                                                                    ? JSON.stringify(variablesParsed, null, 2)
                                                                    : (typeof variablesRaw === "string" ? variablesRaw : "{}")
                                                            }
                                                        </SyntaxHighlighter>
                                                    </div>
                                                )
                                            }

                                        </div>




                                    )}

                                    {activeTab === "header" && (
                                        <div className="mt-4 w-full">
                                            <h2 className="text-sm text-slate-600 mb-2">Headers</h2>
                                            <div className="flex flex-col gap-2 w-full">
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
                                                className="text-blue-600 text-sm mt-2"
                                            >
                                                + Add header
                                            </button>
                                        </div>
                                    )}


                                    <div className="pt-4">
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

                    <div className="flex border h-full border-primary/20 rounded-md bg-white shadow-sm flex-col overflow-hidden">
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
                            <div className="flex-1 p-4 overflow-y-auto text-sm bg-slate-50">
                                {selectedRequest?.response ? (
                                    <JSONEditor selectedRequest={selectedRequest} />
                                ) : (
                                    <div className="w-full h-full flex flex-col items-center justify-center text-slate-400">
                                        <span className="text-4xl mb-2">&lt;/&gt;</span>
                                        <p>API response are shown here</p>
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