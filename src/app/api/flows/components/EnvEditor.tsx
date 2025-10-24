"use client";

import React, { useEffect, useMemo, useState } from "react";
import TextInputWithClearButton from "@/app/components/InputClear";
import { ArrowLeft, PlusIcon, Trash2Icon } from "lucide-react";

export type KV = { id: string; enabled: boolean; key: string; value: string };

type Props = {
    initialName?: string;
    initialEnv?: Record<string, string>;
    onCancel: () => void;
    onSave: (payload: { name: string; env: Record<string, string>; updatedBy: string }) => Promise<void> | void;
    saving?: boolean;
    environmentInfo?: any;
    onChangeDraft?: (payload: { name: string; env: Record<string, string> }) => void;
};

const newId = () => `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

const EnvEditor: React.FC<Props> = ({ initialEnv, initialName, onCancel, onSave, saving, environmentInfo, onChangeDraft }) => {
    const [name, setName] = useState(initialName || "");
    const [rows, setRows] = useState<KV[]>([]);


    useEffect(() => {
        const base = initialEnv
            ? Object.entries(initialEnv).map(([k, v]) => ({
                id: newId(),
                enabled: true,
                key: k,
                value: String(v ?? ""),
            }))
            : [{ id: newId(), enabled: true, key: "Default", value: "Default" }];
        setRows(base);
    }, [initialEnv]);

    const addRow = () => setRows((p) => [...p, { id: newId(), enabled: true, key: "", value: "" }]);

    const updateRow = (id: string, patch: Partial<KV>) => setRows((p) => p.map((r) => (r.id === id ? { ...r, ...patch } : r)));

    const removeRow = (id: string) => setRows((p) => p.filter((r) => r.id !== id));

    const payload = useMemo(() => {
        const out: Record<string, string> = {};
        rows.forEach((r) => {
            const k = (r.key || "").trim();
            if (!r.enabled || !k) return;
            out[k] = r.value ?? "";
        });
        return {
            name: name.trim() || "Custom environment",
            env: out,
            updatedBy: environmentInfo?.createdByName || "Unknown",
        };
    }, [rows, name, environmentInfo?.createdByName]);

    useEffect(() => {
        onChangeDraft?.({ name: payload.name, env: payload.env });
    }, [payload.name, payload.env, onChangeDraft]);


    return (
        <div className="flex w-full h-full relative justify-center">
            <button className="absolute top-6 left-6" title="Back">
                <ArrowLeft className="w-6 h-6 text-primary/80 hover:underline" onClick={onCancel} />
            </button>
            <div className="flex flex-col h-full w-2/3">
                <div className="px-6 pt-6 pb-2">
                    <div className="flex items-start justify-between">
                        <div>
                            <h1 className="text-[28px] font-semibold leading-tight text-primary/90">{name.trim() || "Custom environment"}</h1>
                            <p className="text-primary/50">{name.trim() !== "Custom environment" ? "Edit variables and values" : "Use it as a temporal environment"}</p>
                        </div>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => onSave(payload)}
                                className="inline-flex items-center gap-2 bg-primary-blue hover:bg-primary-blue/90 text-white px-6 h-11 rounded-full font-semibold shadow disabled:opacity-60"
                                disabled={!!saving}
                            >
                                {saving ? "Saving..." : "Save"}
                            </button>
                        </div>
                    </div>
                </div>

                <div className="px-6 space-y-4">
                    <div className="max-w-md">
                        <TextInputWithClearButton
                            id="env-name"
                            label="Name"
                            isSearch={false}
                            value={name}
                            placeholder="Custom environment"
                            onChangeHandler={(e) => setName(e.target.value)}
                        />
                    </div>

                    <div className="rounded-2xl border border-[#E1E8F0] bg-white p-4">
                        <div className="grid grid-cols-[1fr_1fr_auto] gap-2 mb-2 px-1 items-end">
                            <label className="text-xs font-medium text-gray-500">Variable</label>
                            <label className="text-xs font-medium text-gray-500">Value</label>
                            <span className="text-xs text-transparent">.</span>
                        </div>

                        <div className="flex flex-col gap-2">
                            {rows.map((r) => (
                                <div key={r.id} className="grid grid-cols-[1fr_1fr_auto] gap-2 items-start">
                                    <TextInputWithClearButton
                                        id={`k-${r.id}`}
                                        label=""
                                        isSearch={false}
                                        value={r.key}
                                        placeholder=""
                                        onChangeHandler={(e) => updateRow(r.id, { key: e.target.value })}
                                    />
                                    <TextInputWithClearButton
                                        id={`v-${r.id}`}
                                        label=""
                                        isSearch={false}
                                        value={r.value}
                                        placeholder=""
                                        onChangeHandler={(e) => updateRow(r.id, { value: e.target.value })}
                                    />
                                    <button className="px-2 py-2 self-center" onClick={() => removeRow(r.id)} title="Delete row">
                                        <Trash2Icon className="w-5 h-5 text-primary/80" />
                                    </button>
                                </div>
                            ))}
                        </div>

                        <div className="mt-3">
                            <button
                                onClick={addRow}
                                className="inline-flex items-center gap-2 rounded-full border border-[#E1E8F0] px-4 py-2 text-[#0A2342] hover:bg-[#F5F8FB]"
                            >
                                <PlusIcon className="w-5 h-5" /> Add row
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default EnvEditor;
