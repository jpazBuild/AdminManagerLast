"use client";

import React, { useEffect, useRef, useState } from "react";
import TextInputWithClearButton from "@/app/components/InputClear";
import MoreMenu from "../../components/MoreMenu";
import { EnvRow } from "../types/types";
import { PlusIcon, Trash2Icon } from "lucide-react";
import { FaXmark } from "react-icons/fa6";

interface EnvironmentDetailsProps {
    environment: {
        id: string;
        name: string;
        description?: string;
        env?: Record<string, any>;
        values?: Array<{ key: string; value: any; enabled: boolean }>;
    } | null;

    rows: EnvRow[];
    allEnabled: boolean;

    toggleAll: () => void;
    updateRow: (id: string, patch: Partial<EnvRow>) => void;
    toggleRowEnabled: (id: string) => void;
    addRow: () => void;
    removeRow: (id: string) => void;

    isDirty: boolean;
    onSave: (opts?: { nameOverride?: string }) => void | Promise<void>; // <-- acepta override
    saving: boolean;
    confirmReset: () => void;

    onDelete: () => void;
}

const EnvironmentDetails: React.FC<EnvironmentDetailsProps> = ({
    environment,
    rows,
    allEnabled,
    toggleAll,
    updateRow,
    toggleRowEnabled,
    addRow,
    removeRow,
    isDirty,
    onSave,
    saving,
    confirmReset,
    onDelete,
}) => {

    const [isEditingName, setIsEditingName] = useState(false);
    const [nameDraft, setNameDraft] = useState(environment?.name ?? "");
    const nameInputRef = useRef<HTMLInputElement | null>(null);

    useEffect(() => {
        setNameDraft(environment?.name ?? "");
    }, [environment?.name]);

   
    const commitName = async () => {
        setIsEditingName(false);
    };

    useEffect(() => {
        if (isEditingName && nameInputRef.current) {
            nameInputRef.current.focus();
            nameInputRef.current.select();
        }
    }, [isEditingName]);


    const originalName = (environment?.name ?? "").trim();
    const draftName = (nameDraft ?? "").trim();
    const isNameDirty = draftName !== originalName;
    const nameHasWhitespace = /\s/.test(draftName);
    const nameTooLong = draftName.length > 50;
    const hasEnvBasics = Boolean(environment?.id);
    const baseValid = hasEnvBasics && draftName.length > 0 && !nameHasWhitespace && !nameTooLong;
    const canSave = (isDirty || isNameDirty) && !saving && baseValid;

    const onSaveAll = async () => {
        if (!canSave) return;
        await onSave(isNameDirty ? { nameOverride: draftName } : undefined);
    };

    return (
        <div className="flex flex-col h-full w-3/4 overflow-hidden justify-center">
            <div className="px-6 pt-6 pb-3 flex items-center justify-between">
                <div className="flex flex-col h-full">
                    {isEditingName ? (
                        <TextInputWithClearButton
                            id="env-name-input"
                            label=""
                            type="text"
                            value={nameDraft}
                            placeholder="Environment name"
                            onChangeHandler={(e) => setNameDraft(e.target.value)}
                            onBlur={commitName}
                            onKeyDown={(e) => {
                                if (e.key === "Enter") commitName();
                                if (e.key === "Escape") { setNameDraft(environment?.name ?? ""); setIsEditingName(false); }
                            }}
                            isSearch={false}
                            className="text-xl font-bold text-primary/85"
                        />
                    ) : (
                        <h2
                            className="text-2xl font-bold text-primary/85"
                            onDoubleClick={() => { if (environment) setIsEditingName(true); }}
                            title="Double-click to edit"
                        >
                            {isNameDirty ? draftName : (environment?.name ?? "Environment")}
                        </h2>
                    )}

                    <p className="text-sm text-gray-500">Edit variables and values</p>
                </div>

                <div className="flex items-center gap-4">
                    {isDirty && (
                        <button
                            onClick={confirmReset}
                            className="text-sm text-primary hover:underline"
                        >
                            Reset changes
                        </button>
                    )}
                    <button
                        onClick={onSaveAll}
                        disabled={!canSave}
                        className={`px-5 py-2 rounded-lg text-white transition ${!canSave ? "bg-primary/30 cursor-not-allowed" : "bg-primary hover:bg-primary/90"
                            }`}
                    >
                        {saving ? "Saving..." : "Save"}
                    </button>

                    <MoreMenu disabled={saving} onDelete={onDelete} />
                </div>
            </div>

            <div className="flex flex-col w-full h-full overflow-y-auto px-6">
                <div className="grid grid-cols-[28px_1fr_1fr_40px] gap-3 py-2 text-xs text-gray-500">
                    <div className="flex items-center">
                        <input
                            type="checkbox"
                            aria-label="Toggle all"
                            checked={allEnabled}
                            onChange={toggleAll}
                            className="h-4 w-4 accent-primary"
                        />
                    </div>
                    <div className="uppercase tracking-wider">Variable</div>
                    <div className="uppercase tracking-wider">Value</div>
                    <div />
                </div>

                <div className="h-full flex flex-col gap-2 overflow-y-auto overflow-x-hidden">
                    {rows.length > 0 ? (
                        rows.map((r) => (
                            <div
                                key={r.id}
                                className="grid grid-cols-[28px_1fr_1fr_40px] gap-2 items-center rounded-lg hover:bg-primary/5"
                            >
                                <div className="flex items-center">
                                    <input
                                        type="checkbox"
                                        className="h-4 w-4 accent-primary"
                                        checked={r.enabled}
                                        onChange={() => toggleRowEnabled(r.id)}
                                    />
                                </div>

                                <TextInputWithClearButton
                                    id={`env-key-${r.id}`}
                                    label=""
                                    value={r.key}
                                    placeholder="KEY"
                                    onChangeHandler={(e) => updateRow(r.id, { key: e.target.value })}
                                    isSearch={false}
                                />

                                <TextInputWithClearButton
                                    id={`env-value-${r.id}`}
                                    label=""
                                    value={r.value}
                                    placeholder="VALUE"
                                    onChangeHandler={(e) => updateRow(r.id, { value: e.target.value })}
                                />

                                <button
                                    className="p-2 rounded text-primary/60 hover:bg-gray-100"
                                    aria-label="Remove row"
                                    title="Remove"
                                    onClick={() => removeRow(r.id)}
                                >
                                    <Trash2Icon className="w-4 h-4"/>
                                </button>
                            </div>
                        ))
                    ) : (
                        <div className="px-3 py-8 text-center text-sm text-gray-500">
                            No variables match your search.
                        </div>
                    )}

                    <div className="mt-2 flex justify-between items-center">
                        <button
                            className="px-3 py-2 rounded-lg border text-sm hover:bg-gray-50 flex gap-1 items-center"
                            onClick={addRow}
                        >
                            <PlusIcon className="w-4 h-4"/> Add variable
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default EnvironmentDetails;
