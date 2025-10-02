"use client";

import TextInputWithClearButton from "@/app/components/InputClear";
import { DashboardHeader } from "@/app/Layouts/main";
import { URL_API_ALB } from "@/config";
import axios from "axios";
import { CircleAlert, Settings, X } from "lucide-react";
import React, { useEffect, useMemo, useRef, useState } from "react";

type EnvRow = {
    id: string;
    key: string;
    value: string;
    enabled: boolean;
    _orig: { key: string; value: string; enabled: boolean; type?: string };
    _type?: string;
};

const METADATA_KEYS = new Set([
    "name",
    "_postman_exported_using",
    "_postman_exported_at",
    "id",
    "_postman_variable_scope",
    "values",
]);

const normalizeToRows = (
    selectedEnvironment: any
): { rows: EnvRow[]; source: "values" | "env" } => {
    const root = selectedEnvironment ?? {};
    const env = root?.env && typeof root.env === "object" ? root.env : null;

    if (Array.isArray(root?.values)) {
        const rows: EnvRow[] = root.values
            .filter((it: any) => it && typeof it.key === "string" && it.key.length)
            .map((it: any, idx: number) => ({
                id: String(it.key ?? idx),
                key: String(it.key ?? ""),
                value:
                    typeof it.value === "object"
                        ? JSON.stringify(it.value)
                        : String(it.value ?? ""),
                enabled: Boolean(it.enabled ?? true),
                _type: it.type ?? "default",
                _orig: {
                    key: String(it.key ?? ""),
                    value:
                        typeof it.value === "object"
                            ? JSON.stringify(it.value)
                            : String(it.value ?? ""),
                    enabled: Boolean(it.enabled ?? true),
                    type: it.type ?? "default",
                },
            }));
        return { rows, source: "values" };
    }

    if (env && Array.isArray(env.values)) {
        const rows: EnvRow[] = env.values
            .filter((it: any) => it && typeof it.key === "string" && it.key.length)
            .map((it: any, idx: number) => ({
                id: String(it.key ?? idx),
                key: String(it.key ?? ""),
                value:
                    typeof it.value === "object"
                        ? JSON.stringify(it.value)
                        : String(it.value ?? ""),
                enabled: Boolean(it.enabled ?? true),
                _type: it.type ?? "default",
                _orig: {
                    key: String(it.key ?? ""),
                    value:
                        typeof it.value === "object"
                            ? JSON.stringify(it.value)
                            : String(it.value ?? ""),
                    enabled: Boolean(it.enabled ?? true),
                    type: it.type ?? "default",
                },
            }));
        return { rows, source: "values" };
    }

    if (env) {
        const rows: EnvRow[] = Object.entries(env)
            .filter(([k]) => !METADATA_KEYS.has(String(k)))
            .map(([k, v]) => ({
                id: String(k),
                key: String(k),
                value: typeof v === "object" ? JSON.stringify(v) : String(v ?? ""),
                enabled: true,
                _orig: {
                    key: String(k),
                    value: typeof v === "object" ? JSON.stringify(v) : String(v ?? ""),
                    enabled: true,
                },
            }));
        return { rows, source: "env" };
    }

    if (root && typeof root === "object") {
        const rows: EnvRow[] = Object.entries(root)
            .filter(([k]) => !METADATA_KEYS.has(String(k)))
            .map(([k, v]) => ({
                id: String(k),
                key: String(k),
                value: typeof v === "object" ? JSON.stringify(v) : String(v ?? ""),
                enabled: true,
                _orig: {
                    key: String(k),
                    value: typeof v === "object" ? JSON.stringify(v) : String(v ?? ""),
                    enabled: true,
                },
            }));
        return { rows, source: "env" };
    }

    return { rows: [], source: "env" };
};

const coerce = (s: string) => {
    if (typeof s !== "string") return s as any;
    try { return JSON.parse(s); } catch { return s; }
};

const buildSavePayload = (
    original: any,
    rows: Array<{ key: string; value: string; enabled: boolean; _type?: string; _orig?: any }>,
    sourceType: "values" | "env"
) => {
    const clone = JSON.parse(JSON.stringify(original));

    if (sourceType === "values") {
        const valuesPayload = rows.map(r => ({
            key: r.key,
            value: coerce(r.value),
            enabled: r.enabled,
            type: r._type ?? r._orig?.type ?? "default",
        }));

        if (Array.isArray(clone?.values)) {
            clone.values = valuesPayload;
        } else if (clone?.env && Array.isArray(clone.env.values)) {
            clone.env = { ...clone.env, values: valuesPayload };
        } else {
            clone.values = valuesPayload;
            if (clone?.env?.values) delete clone.env.values;
        }
        return clone;
    }

    const envObj: Record<string, any> = {};
    rows.forEach(r => { envObj[r.key] = coerce(r.value); });

    if (clone?.env && typeof clone.env === "object") {
        const { values: _, ...rest } = clone.env;
        clone.env = { ...rest, ...envObj };
    } else {
        clone.env = envObj;
    }
    return clone;
}

const renameKey = <T extends object>(
    obj: T,
    from: string,
    to: string,
    valueIfMissing?: any
) => {
    const o = obj as Record<string, any>;
    if (from in o) {
        o[to] = o[from];
        delete o[from];
    } else if (!(to in o) && valueIfMissing !== undefined) {
        o[to] = valueIfMissing;
    }
}

const EnvironmentsPage = () => {
    const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
    const [selectedEnvironment, setSelectedEnvironment] = useState<any>(null);
    const [environments, setEnvironments] = useState<any[]>([]);
    const [query, setQuery] = useState("");
    const [rows, setRows] = useState<EnvRow[]>([]);
    const [saving, setSaving] = useState(false);
    const [showResetConfirm, setShowResetConfirm] = useState(false);
    const [toastMsg, setToastMsg] = useState<string | null>(null);
    const [toastError, setToastError] = useState<string | null>(null);
    const [sourceType, setSourceType] = useState<"values" | "env">("env");
    const originalRowsRef = useRef<EnvRow[]>([]);
    const fetchEnvironments = async () => {
        const response = await axios.post(`${URL_API_ALB}envs`, {});
        setEnvironments(response.data);
    };

    useEffect(() => {

        fetchEnvironments();
    }, []);

    useEffect(() => {
        const { rows, source } = normalizeToRows(selectedEnvironment);
        setRows(rows);
        setSourceType(source);
        originalRowsRef.current = JSON.parse(JSON.stringify(rows));
    }, [selectedEnvironment]);

    const isDirty = useMemo(() => {
        const a = rows;
        const b = originalRowsRef.current;
        if (a.length !== b.length) return true;
        for (let i = 0; i < a.length; i++) {
            if (
                a[i].key !== b[i].key ||
                a[i].value !== b[i].value ||
                a[i].enabled !== b[i].enabled
            ) {
                return true;
            }
        }
        return false;
    }, [rows]);

    const filtered = useMemo(() => {
        if (!query.trim()) return rows;
        const q = query.toLowerCase();
        return rows.filter(
            r =>
                r.key.toLowerCase().includes(q) ||
                String(r.value).toLowerCase().includes(q)
        );
    }, [rows, query]);

    const updateRow = (id: string, patch: Partial<EnvRow>) =>
        setRows(prev => prev.map(r => (r.id === id ? { ...r, ...patch } : r)));

    const toggleRowEnabled = (id: string) =>
        setRows(prev => prev.map(r => (r.id === id ? { ...r, enabled: !r.enabled } : r)));

    const allEnabled = filtered.length > 0 && filtered.every(r => r.enabled);
    const toggleAll = () =>
        setRows(prev =>
            prev.map(r =>
                filtered.some(f => f.id === r.id) ? { ...r, enabled: !allEnabled } : r
            )
        );

    const onSave = async () => {
        if (!selectedEnvironment) return;
        setSaving(true);
        try {
            if (sourceType === "values") {
                const payload = buildSavePayload(selectedEnvironment, rows, sourceType);
                delete payload.createdAt;
                delete payload.type;
                delete payload.route;
                renameKey(
                    payload,
                    "createdByName",
                    "updatedBy"
                );
                const valuesPayload = rows.map(r => ({
                    key: r.key,
                    value: r.value,
                    enabled: r.enabled,
                    type: r._type ?? r._orig?.type ?? "default",
                }));

                await axios.patch(`${URL_API_ALB}envs`, payload);
                fetchEnvironments();
            } else {
                const envObj: Record<string, string> = {};
                rows.forEach(r => {
                    envObj[r.key] = r.value;
                });

                await axios.patch(`${URL_API_ALB}envs`, {
                    id: selectedEnvironment.id,
                    name: selectedEnvironment?.name,
                    tagNames: selectedEnvironment?.tagNames,
                    description: selectedEnvironment?.description,
                    env: envObj,
                    updatedBy: selectedEnvironment?.createdByName,
                    createdBy: selectedEnvironment?.createdByName,
                    temp: false,
                });
                fetchEnvironments();
            }

            const snapshot: EnvRow[] = JSON.parse(JSON.stringify(rows));
            originalRowsRef.current = snapshot;

            setToastMsg("Changes saved successfully.");
            setTimeout(() => setToastMsg(null), 4000);
        } catch (e) {
            setToastMsg("Error while saving changes.");
            setTimeout(() => setToastMsg(null), 4000);
        } finally {
            setSaving(false);
        }
    };

    const confirmReset = () => setShowResetConfirm(true);
    const doReset = () => {
        const snap = JSON.parse(JSON.stringify(originalRowsRef.current)) as EnvRow[];
        setRows(snap);
        setShowResetConfirm(false);
        setToastMsg("Changes have been reset to the last saved version.");
        setTimeout(() => setToastMsg(null), 4000);
    };

    return (
        <DashboardHeader pageType="api" callback={setMobileSidebarOpen}>
            <div className="flex gap-2 w-full h-full overflow-hidden">
                <div className="w-72 border-r border-primary/10 bg-white flex-shrink-0 flex flex-col overflow-hidden">
                    <div className="flex-shrink-0 p-4 bg-white border-b border-primary/10">
                        <TextInputWithClearButton
                            id="search-environments"
                            label="Search environments"
                            value={query}
                            placeholder="Search environments"
                            isSearch
                            onChangeHandler={(e) => setQuery(e.target.value)}
                        />
                    </div>

                    {environments.length > 0 ? (
                        <div className="flex overflow-y-auto w-full flex-col gap-1 p-2">
                            {environments.map((env) => (
                                <div
                                    key={env.id}
                                    className={`p-3 cursor-pointer rounded-lg hover:bg-primary/5 ${selectedEnvironment?.id === env.id ? "bg-primary/10" : ""
                                        }`}
                                    onClick={() => setSelectedEnvironment(env)}
                                >
                                    <h3 className="font-medium text-primary/80">{env.name}</h3>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="flex-1 flex items-center justify-center p-4">
                            <p className="text-sm text-gray-500">No environments found.</p>
                        </div>
                    )}
                </div>

                <div className="flex h-full w-full flex-col overflow-hidden">
                    {selectedEnvironment ? (
                        <div className="flex flex-col h-full overflow-hidden">
                            <div className="px-6 pt-6 pb-3 flex items-center justify-between">
                                <div>
                                    <h2 className="text-2xl font-bold text-primary/85">
                                        {selectedEnvironment.name}
                                    </h2>
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
                                        onClick={onSave}
                                        disabled={!isDirty || saving}
                                        className={`px-5 py-2 rounded-lg text-white transition ${!isDirty || saving
                                            ? "bg-primary/30 cursor-not-allowed"
                                            : "bg-primary hover:bg-primary/90"
                                            }`}
                                    >
                                        {saving ? "Saving..." : "Save"}
                                    </button>
                                </div>
                            </div>

                            <div className="px-6 pb-2">
                                <TextInputWithClearButton
                                    id="search-variables"
                                    label="Search variables"
                                    value={query}
                                    placeholder="Search variables"
                                    isSearch
                                    onChangeHandler={(e) => setQuery(e.target.value)}
                                />
                            </div>

                            <div className="flex flex-col w-full h-full overflow-y-auto px-6">
                                <div className="grid grid-cols-[28px_1fr_1fr] gap-3 py-2 text-xs text-gray-500">
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
                                </div>

                                <div className="h-full flex flex-col gap-2 overflow-y-auto overflow-x-hidden">
                                    {filtered.map((r) => (
                                        <div
                                            key={r.id}
                                            className="flex gap-1 items-center rounded-lg hover:bg-primary/5"
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
                                                placeholder=""
                                                onChangeHandler={(e) => updateRow(r.id, { key: e.target.value })}
                                                isSearch={false}
                                            />
                                            <TextInputWithClearButton
                                                id={`env-value-${r.id}`}
                                                label=""
                                                value={r.value}
                                                placeholder=""
                                                onChangeHandler={(e) => updateRow(r.id, { value: e.target.value })}
                                            />

                                        </div>
                                    ))}

                                    {filtered.length === 0 && (
                                        <div className="px-3 py-8 text-center text-sm text-gray-500">
                                            No variables match your search.
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="flex w-full h-full items-center justify-center p-4 flex-col gap-2">
                            <Settings className="text-[#3956E8] w-20 h-20" />
                            <p className="text-[24px] font-semibold tracking-wider text-primary/85">
                                Select an environment
                            </p>
                            <p className="text-[14px] text-gray-500">
                                You could see and edit the data
                            </p>
                        </div>
                    )}
                </div>
            </div>

            {showResetConfirm && (
                <div className="fixed inset-0 z-50 flex items-center justify-center">
                    <div className="absolute inset-0 bg-black/30" onClick={() => setShowResetConfirm(false)} />
                    <div className="relative z-10 w-full max-w-md rounded-xl bg-white p-6 shadow-xl flex flex-col">
                        <div className="flex items-center mb-2 w-full">
                            <div className="flex flex-col items-center gap-2 w-full justify-center">
                                <CircleAlert className="w-8 h-8 text-primary/90" />
                                <h3 className="text-base text-center font-semibold text-primary/90">
                                    Are you sure you want to reset the changes?
                                </h3>
                                <p className="text-sm text-gray-500 mb-5">
                                    This will undo all changes up to the last saved version.
                                </p>
                            </div>

                        </div>
                        <button className="absolute top-2 right-2 p-1 rounded hover:bg-gray-100" onClick={() => setShowResetConfirm(false)}>
                            <X className="w-4 h-4 text-gray-500" />
                        </button>

                        <div className="flex items-center w-full gap-2">
                            <button
                                className="w-1/2 px-4 py-2 rounded-lg border text-sm hover:bg-gray-50"
                                onClick={() => setShowResetConfirm(false)}
                            >
                                Cancel
                            </button>
                            <button
                                className="w-1/2 px-4 py-2 rounded-lg bg-primary text-white text-sm hover:bg-primary/90"
                                onClick={doReset}
                            >
                                Reset changes
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {toastMsg && (
                <div className="fixed lg:w-1/2 bottom-4 left-1/2 -translate-x-1/2 z-40">
                    <div className="rounded-lg border border-green-200 bg-green-50 text-green-700 px-4 py-2 shadow flex justify-between items-center">
                        {toastMsg}
                        <button className="ml-2 text-green-500" onClick={() => setToastMsg(null)}>
                            &times;
                        </button>
                    </div>
                </div>
            )}
            {toastError && (
                <div className="fixed lg:w-1/2 bottom-4 left-1/2 -translate-x-1/2 z-40">
                    <div className=" rounded-lg border border-red-200 bg-red-50 text-red-700 px-4 py-2 shadow flex justify-between items-center">
                        {toastError}
                        <button className="ml-2 text-red-500" onClick={() => setToastError(null)}>
                            &times;
                        </button>
                    </div>
                </div>
            )}



        </DashboardHeader>
    );
};

export default EnvironmentsPage;
