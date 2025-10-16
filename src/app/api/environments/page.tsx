"use client";

import TextInputWithClearButton from "@/app/components/InputClear";
import { DashboardHeader } from "@/app/Layouts/main";
import { URL_API_ALB } from "@/config";
import axios from "axios";
import { CircleAlert, PlusIcon, Settings, Trash2Icon, X } from "lucide-react";
import React, { useEffect, useMemo, useRef, useState } from "react";
import MoreMenu from "../components/MoreMenu";
import CreateEnvironment from "./components/create";
import { EnvRow } from "./types/types";
import { buildSavePayload, normalizeToRows, renameKey } from "./utils/rowsMethods";
import EnvironmentDetails from "./components/details";
import NoData from "@/app/components/NoData";


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
    const [createView, setCreateView] = useState(false);

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



    const confirmReset = () => setShowResetConfirm(true);
    const doReset = () => {
        const snap = JSON.parse(JSON.stringify(originalRowsRef.current)) as EnvRow[];
        setRows(snap);
        setShowResetConfirm(false);
        setToastMsg("Changes have been reset to the last saved version.");
        setTimeout(() => setToastMsg(null), 4000);
    };

    const deleteEnvironment = async (id: string) => {
        try {
            await axios.delete(`${URL_API_ALB}envs`, { data: { id } });
            setEnvironments(prev => prev.filter(e => e.id !== id));
            if (selectedEnvironment?.id === id) setSelectedEnvironment(null);
            setToastMsg("Environment deleted successfully.");
            setTimeout(() => setToastMsg(null), 4000);
        } catch (e) {
            setToastMsg("Error while deleting environment.");
            setTimeout(() => setToastMsg(null), 4000);
        }
    };

    const makeRowId = () => `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

    const makeEmptyRow = (): EnvRow => ({
        id: makeRowId(),
        key: "",
        value: "",
        enabled: true,
        _orig: { key: "", value: "", enabled: true, type: "default" },
        _type: "default",
    });

    const addRow = () => setRows(prev => [...prev, makeEmptyRow()]);

    const removeRow = (id: string) =>
        setRows(prev => prev.filter(r => r.id !== id));



    // const onSave = async () => {
    //     if (!selectedEnvironment) return;
    //     setSaving(true);
    //     try {
    //         if (sourceType === "values") {
    //             const payload = buildSavePayload(selectedEnvironment, rows, sourceType);
    //             delete payload.createdAt;
    //             delete payload.type;
    //             delete payload.route;
    //             renameKey(
    //                 payload,
    //                 "createdByName",
    //                 "updatedBy"
    //             );
    //             const valuesPayload = rows.map(r => ({
    //                 key: r.key,
    //                 value: r.value,
    //                 enabled: r.enabled,
    //                 type: r._type ?? r._orig?.type ?? "default",
    //             }));

    //             await axios.patch(`${URL_API_ALB}envs`, payload);
    //             fetchEnvironments();
    //         } else {
    //             const envObj: Record<string, string> = {};
    //             rows.forEach(r => {
    //                 envObj[r.key] = r.value;
    //             });

    //             await axios.patch(`${URL_API_ALB}envs`, {
    //                 id: selectedEnvironment.id,
    //                 name: selectedEnvironment?.name,
    //                 tagNames: selectedEnvironment?.tagNames,
    //                 description: selectedEnvironment?.description,
    //                 env: envObj,
    //                 updatedBy: selectedEnvironment?.createdByName,
    //                 createdBy: selectedEnvironment?.createdByName,
    //                 temp: false,
    //             });
    //             fetchEnvironments();
    //         }

    //         const snapshot: EnvRow[] = JSON.parse(JSON.stringify(rows));
    //         originalRowsRef.current = snapshot;

    //         setToastMsg("Changes saved successfully.");
    //         setTimeout(() => setToastMsg(null), 4000);
    //     } catch (e) {
    //         setToastMsg("Error while saving changes.");
    //         setTimeout(() => setToastMsg(null), 4000);
    //     } finally {
    //         setSaving(false);
    //     }
    // };

    const onSave = async (opts?: { nameOverride?: string }) => {
        if (!selectedEnvironment) return;
        setSaving(true);
        const effectiveName = (opts?.nameOverride ?? selectedEnvironment?.name ?? "").trim();

        try {
            if (sourceType === "values") {
                const payload = buildSavePayload(selectedEnvironment, rows, sourceType);
                // Normaliza y aplica overrides
                delete (payload as any).createdAt;
                delete (payload as any).type;
                delete (payload as any).route;
                renameKey(payload, "createdByName", "updatedBy");
                // <-- aplicar el nombre nuevo en el mismo PATCH
                payload.name = effectiveName;

                await axios.patch(`${URL_API_ALB}envs`, payload);
                await fetchEnvironments();
            } else {
                const envObj: Record<string, string> = {};
                rows.forEach(r => { envObj[r.key] = r.value; });

                await axios.patch(`${URL_API_ALB}envs`, {
                    id: selectedEnvironment.id,
                    name: effectiveName, // <-- usar el nombre nuevo
                    tagNames: selectedEnvironment?.tagNames,
                    description: selectedEnvironment?.description,
                    env: envObj,
                    updatedBy: selectedEnvironment?.createdByName,
                    createdBy: selectedEnvironment?.createdByName,
                    temp: false,
                });
                await fetchEnvironments();
            }

            // Snapshot filas OK
            const snapshot: EnvRow[] = JSON.parse(JSON.stringify(rows));
            originalRowsRef.current = snapshot;

            // Refleja el nombre nuevo localmente (evita pantalla vieja)
            if (opts?.nameOverride) {
                setSelectedEnvironment((prev: any) =>
                    prev ? { ...prev, name: effectiveName } : prev
                );
            }

            setToastMsg("Changes saved successfully.");
            setTimeout(() => setToastMsg(null), 4000);
        } catch (e) {
            setToastMsg("Error while saving changes.");
            setTimeout(() => setToastMsg(null), 4000);
        } finally {
            setSaving(false);
        }
    };

    const renameEnvironment = async (newName: string) => {
        if (!selectedEnvironment) return;
        if (!newName.trim()) {
            setToastError("Environment name cannot be empty.");
            setTimeout(() => setToastError(null), 3000);
            return;
        }
        if (newName.trim() === selectedEnvironment.name) {
            // No change in name
            return;
        }
        if (environments.some(env => env.name === newName.trim())) {
            setToastError("An environment with this name already exists.");
            setTimeout(() => setToastError(null), 3000);
            return;
        }
        try {
            await axios.patch(`${URL_API_ALB}envs`, {
                id: selectedEnvironment.id,
                name: newName.trim(),
                updatedBy: selectedEnvironment?.createdByName,
                createdBy: selectedEnvironment?.createdByName,
                tagNames: selectedEnvironment?.tagNames,
                description: selectedEnvironment?.description,
                env: selectedEnvironment?.env,
                temp: false,
            });

            setSelectedEnvironment((prev: any) =>
                prev ? { ...prev, name: newName.trim() } : prev
            );

            fetchEnvironments();

            setToastMsg("Environment name updated.");
            setTimeout(() => setToastMsg(null), 3000);
        } catch (e) {
            setToastError("Error updating environment name.");
            setTimeout(() => setToastError(null), 3000);
        }
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
                    <button className="mr-2 w-1/2 flex gap-2 items-center justify-center self-end px-3 py-2.5 bg-primary rounded-md  text-white font-medium hover:bg-primary/90 transition" onClick={() => {
                        setCreateView(true);
                    }}>
                        <PlusIcon className="w-5 h-5"/> Create
                    </button>
                    {environments.length > 0 ? (
                        <div className="flex overflow-y-auto w-full flex-col gap-1 p-2">
                            {environments.map((env) => (
                                <div
                                    key={env.id}
                                    className={`p-3 cursor-pointer rounded-lg hover:bg-primary/5 ${selectedEnvironment?.id === env.id ? "bg-primary/10" : ""
                                        }`}
                                    onClick={() => {
                                        setSelectedEnvironment(env);
                                        setCreateView(false);
                                    }}
                                >
                                    <h3 className="font-medium text-primary/80">{env.name}</h3>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <NoData text="No environments found." />
                    )}
                </div>

                <div className="flex h-full w-full flex-col overflow-hidden justify-center self-center items-center">
                    {selectedEnvironment && !createView ? (
                        <EnvironmentDetails
                            environment={selectedEnvironment}
                            rows={filtered}
                            allEnabled={allEnabled}
                            toggleAll={toggleAll}
                            updateRow={updateRow}
                            toggleRowEnabled={toggleRowEnabled}
                            addRow={addRow}
                            removeRow={removeRow}
                            isDirty={isDirty}
                            onSave={onSave}
                            saving={saving}
                            confirmReset={confirmReset}
                            onDelete={() => deleteEnvironment(selectedEnvironment.id)}
                        />
                    ) : null}

                    {!selectedEnvironment && !createView && (
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


                    {createView && (

                        <CreateEnvironment
                            setToastError={setToastError}
                            setCreateView={setCreateView}
                            setToastMsg={setToastMsg}
                            setRefetchEnvironments={fetchEnvironments}
                        />
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
