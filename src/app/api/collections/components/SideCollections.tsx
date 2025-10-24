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
    loadingElements
}) => {
    const selectedWS = elementsPostman?.teams?.[0]?.workspaces?.find(
        (t: any) => String(t.id ?? t.uid ?? t.workspaceId) === String(selectedWorkspaceId)
    );

    const collections = selectedWS?.collections ?? [];
    
    return (
        <div className="flex gap-2 w-full h-full">
            <div className="w-72 border-r border-primary/10 bg-white flex-shrink-0 flex flex-col overflow-hidden">
                <div className="flex-shrink-0 p-4 space-y-4 bg-white border-b border-primary/10">
                    <SearchField
                        label="From"
                        value={selectedTypeOrigin ?? ""}
                        onChange={onChangeTypeOrigin}
                        placeholder="Search collections"
                        options={typeOriginOptions.map((t) => ({ label: t.name, value: t.name }))}
                    />

                    <TooltipLocation
                        text="Teams only can be selected from 'Postman'"
                        position="right"
                        active={selectedTypeOrigin === "BD"}
                    >
                        <div className={selectedTypeOrigin === "BD" ? "bg-gray-100 text-gray-400" : ""}>
                            {loadingElements && (
                                <div className="animate-pulse h-8 w-full bg-gray-200 rounded-md mb-2"></div>
                            )}
                            {!loadingElements && (<SearchField
                                label="Team"
                                value={selectedWorkspaceId ?? ""}
                                onChange={onChangeWorkspaceId}
                                placeholder="Search Team"
                                options={
                                    (elementsPostman?.teams?.[0]?.workspaces ?? []).map((ws: any) => ({
                                        label: ws.name,
                                        value: String(ws.id ?? ws.uid ?? ws.workspaceId),
                                    }))
                                }
                                disabled={selectedTypeOrigin === "BD"}
                                className={selectedTypeOrigin === "BD" ? "cursor-not-allowed" : ""}
                            />)}
                        </div>
                    </TooltipLocation>

                    <TextInputWithClearButton
                        id="collection-name"
                        label="Search Collections"
                        placeholder="Enter collection name"
                        value={collectionQuery}
                        onChangeHandler={(e) => onChangeCollectionQuery(e.target.value)}
                        isSearch={true}
                    />
                </div>

                <div className="flex flex-col p-4 overflow-y-auto">
                    {collections?.length ? (
                        <>
                            {collections
                                .filter((c: any) =>
                                    collectionQuery
                                        ? c.name?.toLowerCase().includes(collectionQuery.toLowerCase())
                                        : true
                                )
                                .map((collection: any, idx: number) => {
                                    const isOpen = !!openCollection[collection.name];
                                    const isLoading = !!loadingByCollection[collection.name];
                                    const uid = String(collection.uid);

                                    return (
                                        <div key={`${uid}-${idx}`} className="mb-2">
                                            <div
                                                className="flex items-center gap-2 text-primary/80 cursor-pointer select-none"
                                                onClick={() => onOpenCollection(collection)}
                                            >
                                                {isOpen ? (
                                                    <ChevronDown className="w-4 h-4 text-primary" />
                                                ) : (
                                                    <ChevronRight className="w-4 h-4 text-primary" />
                                                )}
                                                <p className="text-sm">{collection.name}</p>
                                            </div>

                                            {isOpen && (
                                                <div className="ml-6 mt-2 text-sm text-gray-600">
                                                    {!collectionError && dataDetailByUid?.[uid] && (
                                                        renderCollectionTree(
                                                            dataDetailByUid[uid],
                                                            uid,
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
                    ) : null}
                </div>
            </div>
        </div>
    );
};

export default CollectionsAside;
