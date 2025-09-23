// src/app/api/collections/page.tsx
"use client";

import Image from "next/image";
import TextInputWithClearButton from "@/app/components/InputClear";
import { SearchField } from "@/app/components/SearchField";
import { DashboardHeader } from "@/app/Layouts/main";
import { ChevronRight, ChevronDown, Folder } from "lucide-react";
import { useState } from "react";


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


    // selectedRequest contiene la respuesta que se muestra en el panel derecho
    const [selectedRequest, setSelectedRequest] = useState<null | {
        collection: string;
        method: string;
        response: any;
    }>(null);

    const teams = [{ name: "Team A" }, { name: "Team B" }, { name: "Team C" }];
    const typeOrigin = [{ name: "Postman" }, { name: "BD" }];

    const toggleCollection = (name: string) => {
        setOpenCollection((prev) => ({ ...prev, [name]: !prev[name] }));
    };

    const toggleCoreApi = (collectionName: string) => {
        setOpenCoreApi((prev) => ({ ...prev, [collectionName]: !prev[collectionName] }));
    };

    // Simula ejecutar la request y setea selectedRequest (aquí pones la llamada real si quieres)
    const runRequest = (collectionName: string, methodName: string) => {
        const mockResponse = {
            status: 200,
            timestamp: new Date().toISOString(),
            data: {
                message: `${methodName} executed for ${collectionName}`,
                payload: { id: 123, name: "Mock item" },
            },
        };

        setSelectedRequest({
            collection: collectionName,
            method: methodName,
            response: mockResponse,
        });
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
            <div className="min-h-screen py-2 flex">
                {/* ------------- SIDEBAR (izquierda) ------------- */}
                <div className="min-h-screen w-72 border-r border-primary/10 p-4 flex-shrink-0 top-20 left-0 flex flex-col gap-4 bg-white">
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
                                                        onClick={() => runRequest(collection.name, method.name)}
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


                {/* ------------- MAIN CONTENT (derecha) ------------- */}
                <main className="flex-1 p-8 flex flex-col gap-4 overflow-hidden">
                    {/* Bloque superior: Select a collection (70%) */}
                    <div className="row-span-1 border rounded-md bg-white shadow-sm flex items-center justify-center overflow-hidden">
                        <div className="flex flex-col items-center justify-center text-center text-slate-500 space-y-3">
                            <Image
                                src="/select-collection.svg"
                                alt="Select a collection"
                                width={160}
                                height={160}
                                className="object-contain"
                            />
                            <div>
                                <p className="font-medium text-lg">Select a collection</p>
                                <p className="text-sm text-slate-400">Run a collection to see the API response</p>
                            </div>
                        </div>
                    </div>
                    {/* Bloque inferior: Response JSON (30%) */}
                    <div className="border rounded-md bg-white shadow-sm overflow-hidden">
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
                            <div className="h-64 p-6 overflow-auto text-slate-500 text-sm">
                                <div className="flex flex-col items-center justify-center space-y-2 py-8">
                                    <span className="text-4xl">&lt;/&gt;</span>
                                    <p>API response are shown here</p>
                                </div>
                            </div>
                        )}
                    </div>
                </main>
            </div>
        </DashboardHeader>
    );
};

export default CollectionsPage;
