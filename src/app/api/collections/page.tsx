// src/app/api/collections/page.tsx
"use client";

import Image from "next/image";
import TextInputWithClearButton from "@/app/components/InputClear";
import { SearchField } from "@/app/components/SearchField";
import { DashboardHeader } from "@/app/Layouts/main";
import { ChevronRight, ChevronDown, Folder } from "lucide-react";
import { useState } from "react";
import colletEmptyState from "../../../assets/apisImages/select-collection.svg"

const httpMethods = [
    { name: "GET", color: "bg-green-100 text-green-700", text: "CoreAPI" },
    { name: "POST", color: "bg-yellow-100 text-yellow-700", text: "CoreAPI" },
    { name: "PUT", color: "bg-blue-100 text-blue-700", text: "CoreAPI" },
    { name: "PATCH", color: "bg-purple-100 text-purple-700", text: "CoreAPI" },
    { name: "DEL", color: "bg-red-100 text-red-700", text: "CoreAPI" },
    { name: "OPTIONS", color: "bg-pink-100 text-pink-700", text: "CoreAPI" },
];

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

            // setea selectedRequest con la respuesta (manteniendo collection+method)
            setSelectedRequest({
                collection: collectionName,
                method: methodName,
                response: mockResponse,
            });

            // abrir panel Response JSON
            setIsOpen(true);
        } catch (err) {
            console.error(err);
        } finally {
            setIsRequestRunning(false);
        }
    };


    // Filtrado simple (puedes mejorar)
    const filteredCollections = listCollections.filter((col) => {
        const matchName = selectedCollection ? col.name.toLowerCase().includes(selectedCollection.toLowerCase()) : true;
        const matchTeam = selectedTeam ? col.team === selectedTeam : true;
        const matchOrigin = selectedTypeOrigin ? col.origin === selectedTypeOrigin : true;
        return matchName && matchTeam && matchOrigin;
    });


    return (
        <DashboardHeader pageType="api">

            <div className="flex w-full h-full min-h-screen">
                <div className="w-72 border-r border-primary/10 p-4 flex flex-col gap-4 bg-white h-full min-h-screen">
                    <SearchField
                        label="From"
                        value={selectedTypeOrigin ?? ""}
                        onChange={setSelectedTypeOrigin}
                        placeholder="Search collections"
                        options={typeOrigin.map((t) => ({ label: t.name, value: t.name }))}
                    />
                    <SearchField
                        label="Team"
                        value={selectedTeam ?? ""}
                        onChange={setSelectedTeam}
                        placeholder="Search Team"
                        options={teams.map((t) => ({ label: t.name, value: t.name }))}
                    />
                    <TextInputWithClearButton
                        id="collection-name"
                        label="Search Collections"
                        placeholder="Enter collection name"
                        value={selectedCollection ?? ""}
                        onChangeHandler={(e) => setSelectedCollection(e.target.value)}
                        isSearch={true}
                    />

                    <div className="overflow-y-auto mt-2">
                        {filteredCollections.map((collection, idx) => (
                            <div key={idx} className="mb-2">
                                {/* Collection (no carpeta) */}
                                <div
                                    className="flex items-center gap-2 text-primary/80 cursor-pointer select-none"
                                    onClick={() => toggleCollection(collection.name)}
                                >
                                    {openCollection[collection.name] ? (
                                        <ChevronDown className="w-4 h-4 text-primary" />
                                    ) : (
                                        <ChevronRight className="w-4 h-4 text-primary" />
                                    )}
                                    <p className="text-sm">{collection.name}</p>
                                </div>

                                {/* Subcarpeta CoreAPI */}
                                {openCollection[collection.name] && (
                                    <div className="ml-5 mt-1">
                                        <div
                                            className="flex items-center gap-2 text-primary/80 cursor-pointer"
                                            onClick={() => toggleCoreApi(collection.name)}
                                        >
                                            {openCoreApi[collection.name] ? (
                                                <ChevronDown className="w-4 h-4 text-primary" />
                                            ) : (
                                                <ChevronRight className="w-4 h-4 text-primary" />
                                            )}
                                            <Folder className="w-4 h-4 text-primary" />
                                            <p className="text-sm">CoreAPI</p>
                                        </div>

                                        {/* Métodos dentro de CoreAPI */}
                                        {openCoreApi[collection.name] && (
                                            <div className="ml-6 mt-2 flex flex-col gap-2">
                                                {httpMethods.map((method, i) => (
                                                    <div
                                                        key={i}
                                                        // onClick={() => runRequest(collection.name, method.name)}
                                                        // onClick={() => selectRequest(collection.name, method.name)}

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
                        ))}
                    </div>
                </div>

                <div className="relative flex  w-full p-8 flex-col gap-4 min-h-screen">

                    <div className="flex border border-primary/20 rounded-md bg-white shadow-sm items-center justify-center h-full overflow-hidden">
                        {selectedRequest ? (
                            // FORMULARIO EDITABLE PARA LA REQUEST SELECCIONADA
                            <div className="w-full p-6 overflow-auto">
                                <div className="max-w-3xl mx-auto space-y-6">
                                    <div className="flex items-center justify-between">
                                        <h2 className="text-lg font-semibold">
                                            {selectedRequest.collection} <span className="ml-2 text-xs px-2 py-1 rounded bg-slate-100">{selectedRequest.method}</span>
                                        </h2>
                                        <div className="text-sm text-slate-500">Set the information for this request</div>
                                    </div>

                                    {/* URL */}
                                    <div>
                                        <label className="block text-sm text-slate-600 mb-1">Enter request URL</label>
                                        <input
                                            type="text"
                                            value={requestUrl}
                                            onChange={(e) => setRequestUrl(e.target.value)}
                                            className="w-full border rounded-lg px-3 py-2 bg-slate-50 text-sm"
                                        />
                                    </div>

                                    {/* Headers */}
                                    <div>
                                        <label className="block text-sm text-slate-600 mb-2">Headers</label>
                                        <div className="space-y-2">
                                            {requestHeaders.map((h, i) => (
                                                <div key={i} className="flex gap-2">
                                                    <input
                                                        value={h.key}
                                                        onChange={(e) => {
                                                            const arr = [...requestHeaders];
                                                            arr[i].key = e.target.value;
                                                            setRequestHeaders(arr);
                                                        }}
                                                        placeholder="Enter key"
                                                        className="flex-1 border rounded px-2 py-1 bg-white text-sm"
                                                    />
                                                    <input
                                                        value={h.value}
                                                        onChange={(e) => {
                                                            const arr = [...requestHeaders];
                                                            arr[i].value = e.target.value;
                                                            setRequestHeaders(arr);
                                                        }}
                                                        placeholder="Enter value"
                                                        className="flex-1 border rounded px-2 py-1 bg-white text-sm"
                                                    />
                                                    <button
                                                        onClick={() => {
                                                            const arr = requestHeaders.filter((_, idx) => idx !== i);
                                                            setRequestHeaders(arr.length ? arr : [{ key: "", value: "" }]);
                                                        }}
                                                        className="px-2"
                                                    >
                                                        🗑
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

                                    {/* Run button */}
                                    <div className="pt-4">
                                        <button
                                            onClick={() => runRequest(selectedRequest.collection, selectedRequest.method)}
                                            disabled={isRequestRunning}
                                            className="bg-blue-600 text-white px-6 py-2 rounded-md hover:opacity-95 disabled:opacity-50"
                                        >
                                            {isRequestRunning ? "Running..." : "Run"}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            // PLACEHOLDER original (imagen)
                            <div className="flex flex-col items-center justify-center text-center text-slate-500">
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


                    <div className="border border-primary/20 rounded-md bg-white shadow-sm flex flex-col h-full">
                        <button
                            onClick={() => setIsOpen(!isOpen)}
                            className="w-full flex items-center justify-between px-4 py-2 text-sm font-medium text-slate-800 hover:bg-slate-50"
                        >
                            <span>Response · JSON</span>
                            <ChevronDown
                                className={`h-4 w-4 transition-transform ${isOpen ? "rotate-180" : ""}`}
                            />
                        </button>

                        {isOpen && (
                            <div className="flex p-4 overflow-auto text-slate-500 text-sm max-h-[400px] w-full h-full">
                                {selectedRequest ? (
                                    <pre className="whitespace-pre-wrap break-words text-xs">
                                        {JSON.stringify(selectedRequest.response, null, 2)}
                                    </pre>
                                ) : (
                                    <div className="w-full h-full self-center flex flex-col items-center justify-center py-8 my-auto">
                                        <span className="text-4xl">&lt;/&gt;</span>
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
