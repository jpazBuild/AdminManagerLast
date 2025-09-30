"use client";

import Image from "next/image";
import TextInputWithClearButton from "@/app/components/InputClear";
import { SearchField } from "@/app/components/SearchField";
import { DashboardHeader } from "@/app/Layouts/main";
import { ChevronRight, ChevronDown, Folder, Trash2Icon } from "lucide-react";
import { useEffect, useState } from "react";
import colletEmptyState from "../../../assets/apisImages/select-collection.svg"
import TooltipLocation from "@/app/components/ToolTip";
import JSONEditor from "../components/JsonEditor";
import { httpMethodsStyle } from "../utils/colorMethods";
import { useFetchElementsPostman } from "./hooks/useFetchElementsPostman";
import { useFetchCollection } from "./hooks/useFetchCollection";

const listCollections = [
    { name: "Interface Mocks 1", team: "Team A", origin: "Postman" },
    { name: "Interface Mocks 2", team: "Team B", origin: "BD" },
    { name: "Collection 3", team: "Team C", origin: "Postman" },
    { name: "Collection 4", team: "Team A", origin: "BD" },
    { name: "Collection 5", team: "Team B", origin: "Postman" },
];

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
    }>(null);

    const [requestUrl, setRequestUrl] = useState<string>("");
    const [requestHeaders, setRequestHeaders] = useState<Array<{ key: string; value: string }>>([{ key: "", value: "" }]);
    const [isRequestRunning, setIsRequestRunning] = useState<boolean>(false);
    const [collectionQuery, setCollectionQuery] = useState<string>("");           // solo para buscar por nombre
    const [selectedWorkspaceId, setSelectedWorkspaceId] = useState<string | null>(null); // ID/UID real del workspace
    const [selectedCollectionUid, setSelectedCollectionUid] = useState<string | null>(null); // UID real de la colección

    const { elements: elementsPostman } = useFetchElementsPostman();
    const { getCollection, cache: collectionsCache, loading: loadingCollection } =
        useFetchCollection();

    const teams = [{ name: "Team A" }, { name: "Team B" }, { name: "Team C" }];
    const typeOrigin = [{ name: "Postman" }, { name: "BD" }];

    const toggleCollection = (name: string) => {
        setOpenCollection((prev) => ({ ...prev, [name]: !prev[name] }));
    };

    const toggleCoreApi = (collectionName: string) => {
        setOpenCoreApi((prev) => ({ ...prev, [collectionName]: !prev[collectionName] }));
    };

    const selectRequest = (collectionName: string, methodName: string) => {

        setSelectedRequest({
            collection: collectionName,
            method: methodName,
            response: null,
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
        const loadCollection = async () => {
            if (selectedTypeOrigin === "Postman") {
                console.log("Loading collection for teamId:", teamId, "collectionUid:", collectionUid);

                const test = await getCollection({ teamId, collectionUid });
                console.log("Fetched collection:", test);
            }

        };
        loadCollection();

    }, [selectedTeam, selectedCollection, selectedTypeOrigin, teamId, collectionUid, getCollection]);

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
                        {selectedTeam &&
                            Array.isArray(elementsPostman?.teams[0]?.workspaces?.find((t: any) => t.name === selectedTeam)?.collections) &&
                            elementsPostman?.teams[0]?.workspaces?.find((t: any) => t.name === selectedTeam)?.collections?.length > 0 && (
                                <>
                                    {/* {elementsPostman?.teams[0]?.workspaces?.find((t: any) => t.name === selectedTeam)?.collections?.map((collection: any, idx: number) => (
                                        <div key={idx} className="mb-2">
                                            <div
                                                className="flex items-center gap-2 text-primary/80 cursor-pointer select-none"
                                                onClick={() => toggleCollection(collection.name)}
                                            >
                                                {openCollection[collection.name]
                                                    ? <ChevronDown className="w-4 h-4 text-primary" />
                                                    : <ChevronRight className="w-4 h-4 text-primary" />
                                                }
                                                <p className="text-sm">{collection.name}</p>
                                            </div>

                                            {openCollection[collection.name] && (
                                                <div className="ml-5 mt-1">
                                                    <div
                                                        className="flex items-center gap-2 text-primary/80 cursor-pointer"
                                                        onClick={() => toggleCoreApi(collection.name)}
                                                    >
                                                        {openCoreApi[collection.name]
                                                            ? <ChevronDown className="w-4 h-4 text-primary" />
                                                            : <ChevronRight className="w-4 h-4 text-primary" />
                                                        }
                                                        <Folder className="w-4 h-4 text-primary" />
                                                        <p className="text-sm">CoreAPI</p>
                                                    </div>

                                                    {openCoreApi[collection.name] && (
                                                        <div className="ml-6 mt-2 flex flex-col gap-2">
                                                            {httpMethods.map((method, i) => (
                                                                <div
                                                                    key={i}
                                                                    onClick={() => { selectRequest(collection.name, method.name); runRequest(collection.name, method.name); }}
                                                                    className="flex items-center gap-3 text-sm cursor-pointer hover:bg-gray-50 p-1 rounded-md"
                                                                >
                                                                    <span className={`px-2 py-0.5 rounded-md font-semibold text-xs ${method.color}`}>
                                                                        {method.name}
                                                                    </span>
                                                                    <span className="text-gray-700">{method.text}</span>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    ))} */}

                                    {/* {selectedWorkspaceId && Array.isArray(currentWs?.collections) && currentWs.collections.length > 0 && (
                                        <>
                                            {currentWs.collections
                                                .filter((c: any) => collectionQuery ? c.name?.toLowerCase().includes(collectionQuery.toLowerCase()) : true)
                                                .map((collection: any, idx: number) => (
                                                    <div key={idx} className="mb-2">
                                                        <div
                                                            className="flex items-center gap-2 text-primary/80 cursor-pointer select-none"
                                                            onClick={() => toggleCollection(collection.name)}
                                                        >
                                                            {openCollection[collection.name]
                                                                ? <ChevronDown className="w-4 h-4 text-primary" />
                                                                : <ChevronRight className="w-4 h-4 text-primary" />
                                                            }
                                                            <p className="text-sm">{collection.name}</p>

                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    setSelectedCollectionUid(String(collection.uid ?? collection.id)); // <- CLAVE
                                                                }}
                                                                className="ml-auto text-xs px-2 py-1 border rounded hover:bg-gray-50"
                                                                title="Select collection"
                                                            >
                                                                Select
                                                            </button>
                                                        </div>

                                                        {openCollection[collection.name] && (
                                                            <div className="ml-5 mt-1">
                                                                <div
                                                                    className="flex items-center gap-2 text-primary/80 cursor-pointer"
                                                                    onClick={() => toggleCoreApi(collection.name)}
                                                                >
                                                                    {openCoreApi[collection.name]
                                                                        ? <ChevronDown className="w-4 h-4 text-primary" />
                                                                        : <ChevronRight className="w-4 h-4 text-primary" />
                                                                    }
                                                                    <Folder className="w-4 h-4 text-primary" />
                                                                    <p className="text-sm">CoreAPI</p>
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                ))}
                                        </>
                                    )} */}
                                </>
                            )}
                    </div>
                </div>

                <div className="flex-1 flex flex-col gap-4 overflow-hidden">
                    <div className="flex-1 flex border border-primary/20 rounded-md bg-white shadow-sm overflow-hidden">
                        {selectedRequest ? (
                            <div className="w-full p-6 overflow-y-auto">
                                <div className="max-w-3xl">
                                    <div className="flex items-center justify-between mb-4">
                                        <h2 className="text-lg font-semibold">
                                            {selectedRequest.collection}
                                            <span
                                                className={`ml-2 text-xs px-2 py-1 rounded ${httpMethodsStyle(selectedRequest.method)}`}
                                            >
                                                {selectedRequest.method}
                                            </span>
                                        </h2>
                                    </div>
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
                                    </div>

                                    <div className="mt-4">
                                        <h2 className="text-sm text-slate-600 mb-2">Headers</h2>
                                        <div className="flex flex-col gap-2">
                                            {requestHeaders.map((h, i) => (
                                                <div key={i} className="flex gap-2 w-full items-start">
                                                    <div className="flex-1">
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
                                                    <div className="flex-1">
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
                                                        className="mt-6 p-2 rounded-md hover:bg-gray-100"
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

                    <div className="flex-1 border border-primary/20 rounded-md bg-white shadow-sm flex flex-col overflow-hidden">
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

{/* {elementsPostman.teams[0].workspaces.filter((t:any) => t.name === selectedTeam)?.collections.map((collection:any, idx:number) => (
                                <div key={idx} className="mb-2">
                                    <div
                                        className="flex items-center gap-2 text-primary/80 cursor-pointer select-none"
                                        onClick={() => toggleCollection(collection.name)}
                                    >
                                        {openCollection[collection.name]
                                            ? <ChevronDown className="w-4 h-4 text-primary" />
                                            : <ChevronRight className="w-4 h-4 text-primary" />
                                        }
                                        <p className="text-sm">{collection.name}</p>
                                    </div>

                                    {openCollection[collection.name] && (
                                        <div className="ml-5 mt-1">
                                            <div
                                                className="flex items-center gap-2 text-primary/80 cursor-pointer"
                                                onClick={() => toggleCoreApi(collection.name)}
                                            >
                                                {openCoreApi[collection.name]
                                                    ? <ChevronDown className="w-4 h-4 text-primary" />
                                                    : <ChevronRight className="w-4 h-4 text-primary" />
                                                }
                                                <Folder className="w-4 h-4 text-primary" />
                                                <p className="text-sm">CoreAPI</p>
                                            </div>

                                            {openCoreApi[collection.name] && (
                                                <div className="ml-6 mt-2 flex flex-col gap-2">
                                                    {httpMethods.map((method, i) => (
                                                        <div
                                                            key={i}
                                                            onClick={() => { selectRequest(collection.name, method.name); runRequest(collection.name, method.name); }}
                                                            className="flex items-center gap-3 text-sm cursor-pointer hover:bg-gray-50 p-1 rounded-md"
                                                        >
                                                            <span className={`px-2 py-0.5 rounded-md font-semibold text-xs ${method.color}`}>
                                                                {method.name}
                                                            </span>
                                                            <span className="text-gray-700">{method.text}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            ))} */}