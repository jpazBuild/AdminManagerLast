"use client";

import React from "react";
import { ChevronRight, ChevronDown } from "lucide-react";
import { RiErrorWarningLine } from "react-icons/ri";
import TextInputWithClearButton from "@/app/components/InputClear";
import { SearchField } from "@/app/components/SearchField";
import TooltipLocation from "@/app/components/ToolTip";

type ElementsPostman = {
    teams?: Array<{
        workspaces?: Array<{
            id?: string | number;
            uid?: string | number;
            workspaceId?: string | number;
            name: string;
            collections?: Array<any>;
        }>;
    }>;
};

interface CollectionsAsideProps {
    selectedTypeOrigin: string | null;
    onChangeTypeOrigin: (val: string) => void;

    selectedWorkspaceId: string | null;
    onChangeWorkspaceId: (val: string) => void;

    collectionQuery: string;
    onChangeCollectionQuery: (val: string) => void;

    elementsPostman?: any;

    typeOriginOptions: Array<{ name: string }>;

    openCollection: Record<string, boolean>;
    loadingByCollection: Record<string, boolean>;

    onOpenCollection: (collection: any) => void;

    collectionError?: unknown;

    dataDetailByUid: Record<string, any>;

    renderCollectionTree: (colDetail: any, colUid: string, colName: string) => React.ReactNode;
    loadingElements: boolean;
    darkMode?: boolean;
}

const CollectionsAside: React.FC<CollectionsAsideProps> = ({
    selectedTypeOrigin,
    onChangeTypeOrigin,
    selectedWorkspaceId,
    onChangeWorkspaceId,
    collectionQuery,
    onChangeCollectionQuery,
    elementsPostman,
    typeOriginOptions,
    openCollection,
    loadingByCollection,
    onOpenCollection,
    collectionError,
    dataDetailByUid,
    renderCollectionTree,
    loadingElements,
    darkMode
}) => {
    const selectedWS = elementsPostman?.teams?.[0]?.workspaces?.find(
        (t: any) => String(t.id ?? t.uid ?? t.workspaceId) === String(selectedWorkspaceId)
    );

    const collections = selectedWS?.collections ?? [];

    console.log("darkMode in CollectionsAside:", darkMode);
    
    return (
        <div className="flex gap-2 w-full h-full">
            <div
                className={`w-72 flex-shrink-0 flex flex-col overflow-hidden border-r ${darkMode ? "border-gray-700 bg-gray-900" : "border-primary/10 bg-white"
                    }`}
            >
                <div
                    className={`flex-shrink-0 p-4 space-y-4 border-b ${darkMode ? "bg-gray-900 border-gray-700" : "bg-white border-primary/10"
                        }`}
                >
                    <SearchField
                        label="From"
                        value={selectedTypeOrigin ?? ""}
                        onChange={onChangeTypeOrigin}
                        placeholder="Search collections"
                        options={typeOriginOptions.map((t) => ({ label: t.name, value: t.name }))}
                        darkMode={darkMode as any}
                    />

                    <TooltipLocation
                        text="Teams only can be selected from 'Postman'"
                        position="right"
                        active={selectedTypeOrigin === "BD"}
                    >
                        <div className={selectedTypeOrigin === "BD" ? (darkMode ? "bg-gray-800 text-gray-500" : "bg-gray-100 text-gray-400") : ""}>
                            {loadingElements && (
                                <div className={`animate-pulse h-8 w-full rounded-md mb-2 ${darkMode ? "bg-gray-800" : "bg-gray-200"}`} />
                            )}
                            {!loadingElements && (
                                <SearchField
                                    label="Team"
                                    value={selectedWorkspaceId ?? ""}
                                    onChange={onChangeWorkspaceId}
                                    placeholder="Search Team"
                                    options={(elementsPostman?.teams?.[0]?.workspaces ?? []).map((ws: any) => ({
                                        label: ws.name,
                                        value: String(ws.id ?? ws.uid ?? ws.workspaceId),
                                    }))}
                                    disabled={selectedTypeOrigin === "BD"}
                                    className={selectedTypeOrigin === "BD" ? "cursor-not-allowed" : ""}
                                    darkMode={darkMode as any}
                                />
                            )}
                        </div>
                    </TooltipLocation>

                    <TextInputWithClearButton
                        id="collection-name"
                        label="Search Collections"
                        placeholder="Enter collection name"
                        value={collectionQuery}
                        onChangeHandler={(e) => onChangeCollectionQuery(e.target.value)}
                        isSearch={true}
                        isDarkMode={darkMode as any}
                    />
                </div>

                <div className={`flex flex-col p-4 overflow-y-auto ${darkMode ? "text-white/80" : "text-primary/80"}`}>
                    {collections?.length ? (
                        <>
                            {collections
                                .filter((c: any) =>
                                    collectionQuery ? c.name?.toLowerCase().includes(collectionQuery.toLowerCase()) : true
                                )
                                .map((collection: any, idx: number) => {
                                    const isOpen = !!openCollection[collection.name];
                                    const isLoading = !!loadingByCollection[collection.name];
                                    const uid = String(collection.uid);

                                    return (
                                        <div key={`${uid}-${idx}`} className="mb-2">
                                            <div
                                                className={`flex items-center gap-2 cursor-pointer select-none ${darkMode ? "text-white/80" : "text-primary/80"
                                                    }`}
                                                onClick={() => onOpenCollection(collection)}
                                            >
                                                {isOpen ? (
                                                    <ChevronDown className={`w-4 h-4 ${darkMode ? "text-white/80" : "text-primary"}`} />
                                                ) : (
                                                    <ChevronRight className={`w-4 h-4 ${darkMode ? "text-white/80" : "text-primary"}`} />
                                                )}
                                                <p className={`text-sm ${darkMode ? "text-white/80" : ""}`}>{collection.name}</p>
                                            </div>

                                            {isOpen && (
                                                <div className={`ml-6 mt-2 text-sm ${darkMode ? "text-gray-300" : "text-gray-600"}`}>
                                                    {!collectionError && dataDetailByUid?.[uid] && renderCollectionTree(dataDetailByUid[uid], uid, String(collection.name))}

                                                    {isLoading && (
                                                        <div className={`flex items-center gap-2 ${darkMode ? "text-white/70" : "text-primary/70"}`}>
                                                            <div className={`h-4 w-1/2 animate-pulse rounded ${darkMode ? "bg-gray-800" : "bg-gray-200"}`} />
                                                        </div>
                                                    )}

                                                    {!isLoading && collectionError && (
                                                        <div
                                                            className={`p-2 rounded font-normal items-center flex gap-2 ${darkMode ? "bg-red-900/40 text-red-200" : "bg-red-200 text-primary/90"
                                                                }`}
                                                        >
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
                    ) : null}
                </div>
            </div>
        </div>
    );

};

export default CollectionsAside;
