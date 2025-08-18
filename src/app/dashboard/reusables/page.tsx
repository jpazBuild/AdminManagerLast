"use client";
import { useEffect, useState } from "react";
import { DashboardHeader } from "../../Layouts/main";
import axios from "axios";
import { URL_API_ALB } from "@/config";
import { toast } from "sonner";
import { Loader, ChevronDown, ChevronRight, Edit } from "lucide-react";
import { checkConnection } from "@/utils/DBBUtils";
import InteractionItem from "@/app/components/Interaction";
import { Button } from "@/components/ui/button";
import TextInputWithClearButton from "@/app/components/InputClear";
import { SearchCombobox } from "@/app/components/SearchCombobox";
import StepActions from "@/app/components/StepActions";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

type ReusableHeader = {
    id: string;
    name: string;
    tagNames?: string[];
    createdAt?: string;
    createdBy?: string;
    description?: string;
    tagIds?: string[];
    images?: string[];
    temp?: boolean;
    deleteS3Images?: boolean;
    updatedBy?: string;
    updatedAt?: string;
    stepsData?: any[];
    indexStep?: number;
};

type ReusableDetail = {
    id?: string;
    name?: string;
    description?: string;
    tagIds?: string[];
    tagNames?: string[];
    stepsData?: any[];
    images?: string[];
    deleteS3Images?: boolean;
    temp?: boolean;
    updatedBy?: string;
};

const Reusables = () => {
    const [isDarkMode, setIsDarkMode] = useState<boolean>(false);

    const [isLoadingReusables, setIsLoadingReusables] = useState<boolean>(false);
    const [reusables, setReusables] = useState<ReusableHeader[]>([]);
    const [deleteOpen, setDeleteOpen] = useState(false);
    const [reusableToDelete, setReusableToDelete] = useState<ReusableHeader | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const [expanded, setExpanded] = useState<Record<string, boolean>>({});
    const [details, setDetails] = useState<Record<string, ReusableDetail | undefined>>({});
    const [loadingById, setLoadingById] = useState<Record<string, boolean>>({});
    const [errorById, setErrorById] = useState<Record<string, string | undefined>>({});
    const [tags, setTags] = useState<any[]>([]);
    const [selectedTag, setSelectedTag] = useState<string>("");
    const [isLoadingTags, setIsLoadingTags] = useState<boolean>(false);
    const [isLoadingSave, setIsLoadingSave] = useState<boolean>(false);
    const [editingById, setEditingById] = useState<Record<string, boolean>>({});
    const [formById, setFormById] = useState<Record<string, {
        name: string;
        description: string;
        tagNamesCSV: string;
        tagIdsCSV: string;
        deleteS3Images: boolean;
        temp: boolean;
        updatedBy: string;
        selectedTagId?: string;
        selectedTagName?: string;
    }>>({});

    useEffect(() => {
        const fetchInitialData = async () => {
            try {
                setIsLoadingReusables(true);
                await checkConnection();
                const reusableRes = await axios.post(`${URL_API_ALB}getReusableStepsHeaders`, {});
                if (reusableRes.data?.error) throw new Error(reusableRes.data.error);
                const data = Array.isArray(reusableRes.data) ? reusableRes.data : [];
                setReusables(data);
            } catch (error: any) {
                console.error("Error fetching initial data:", error);
                toast.error(error?.message ?? "Error fetching reusables");
                setReusables([]);
            } finally {
                setIsLoadingReusables(false);
            }
        };

        fetchInitialData();
    }, []);

    useEffect(() => {
        const fetchInitialData = async () => {
            try {
                setIsLoadingTags(true);
                await checkConnection()
                const tagsRes = await axios.post(`${URL_API_ALB}tags`, {});

                if (tagsRes.data.error) throw new Error(tagsRes.data.error);

                setTags(Array.isArray(tagsRes.data) ? tagsRes.data : []);

            } catch (error) {
                console.error("Error fetching initial data:", error);
                toast.error(error instanceof Error ? error.message : "Error fetching tags");

                setTags([]);
                setSelectedTag("");

            } finally {
                setIsLoadingTags(false);
            }
        };

        fetchInitialData();
    }, []);

    const setEditDefaults = (r: ReusableHeader, d?: ReusableDetail) => {
        const current: ReusableDetail = d ?? details[r.id] ?? {};
        const firstTagName = (current.tagNames ?? r.tagNames ?? [])[0] ?? "";
        const firstTagId = (current.tagIds ?? [])[0] ?? "";

        setFormById(prev => ({
            ...prev,
            [r.id]: {
                name: (current.name ?? r.name ?? ""),
                description: (current.description ?? ""),
                tagNamesCSV: (current.tagNames ?? r.tagNames ?? []).join(", "),
                tagIdsCSV: (current.tagIds ?? []).join(", "),
                deleteS3Images: Boolean(current.deleteS3Images ?? false),
                temp: Boolean(current.temp ?? false),
                updatedBy: current.updatedBy ?? r.createdBy ?? "user",
                selectedTagId: firstTagId,
                selectedTagName: firstTagName,
            }
        }));
    };

    const toggleOpen = async (r: ReusableHeader) => {
        const next = !expanded[r.id];
        setExpanded(prev => ({ ...prev, [r.id]: next }));

        if (next && !details[r.id] && !loadingById[r.id]) {
            try {
                setLoadingById(prev => ({ ...prev, [r.id]: true }));
                setErrorById(prev => ({ ...prev, [r.id]: undefined }));

                const payload = {
                    id: r.id,
                    getIndexOnly: false,
                    includeStepsData: true,
                    includeImages: true,
                };

                const res = await axios.post(`${URL_API_ALB}reusableSteps`, payload);
                if (res.data?.error) throw new Error(res.data.error);

                const server = res.data ?? {};
                const detail: ReusableDetail = {
                    id: r.id,
                    name: server.name ?? r.name,
                    description: server.description ?? "",
                    tagNames: server.tagNames ?? r.tagNames ?? [],
                    tagIds: server.tagIds ?? [],
                    stepsData: server.stepsData ?? [],
                    images: server.images ?? server.Images ?? [],
                    deleteS3Images: Boolean(server.deleteS3Images ?? false),
                    temp: Boolean(server.temp ?? false),
                    updatedBy: server.updatedBy ?? r.createdBy ?? "user",
                };

                setDetails(prev => ({ ...prev, [r.id]: detail }));
                setEditDefaults(r, detail);
            } catch (e: any) {
                const msg = e?.message ?? "Error loading reusable detail";
                setErrorById(prev => ({ ...prev, [r.id]: msg }));
                toast.error(msg);
            } finally {
                setLoadingById(prev => ({ ...prev, [r.id]: false }));
            }
        }
    };

    const handleDarkModeChange = (isDark: boolean) => setIsDarkMode(isDark);
    const reindexSteps = (arr: any[]) => arr.map((s: any, i: number) => ({ ...s, indexStep: i + 1 }));

    const updateDetailSteps = (
        reusableId: string,
        updater: (curr: any[]) => any[]
    ) => {
        setDetails(prev => {
            const d = prev[reusableId];
            if (!d) return prev;
            const curr = Array.isArray(d.stepsData) ? d.stepsData : [];
            const next = updater(curr);
            return { ...prev, [reusableId]: { ...d, stepsData: next } };
        });
    };

    const startEdit = (r: ReusableHeader) => {
        setEditingById(prev => ({ ...prev, [r.id]: true }));
        setEditDefaults(r, details[r.id]);
    };

    const cancelEdit = (r: ReusableHeader) => {
        setEditingById(prev => ({ ...prev, [r.id]: false }));
        setEditDefaults(r, details[r.id]);
    };

    const saveReusable = async (r: ReusableHeader) => {
        const d = details[r.id];
        const f = formById[r.id];
        if (!d || !f) return;

        const tagIds = f.selectedTagId ? [f.selectedTagId] : (d.tagIds ?? []);
        const tagNames = f.selectedTagName ? [f.selectedTagName] : (d.tagNames ?? []);

        const payload = {
            id: r.id,
            name: f.name?.trim() || d.name || r.name,
            description: f.description ?? "",
            tagIds,
            tagNames,
            stepsData: Array.isArray(d.stepsData) ? d.stepsData : [],
            updatedBy: f.updatedBy || "user",
            deleteS3Images: Boolean(f.deleteS3Images),
            temp: Boolean(f.temp),
        };

        try {
            setIsLoadingSave(true);
            await checkConnection();
            const res = await axios.patch(`${URL_API_ALB}reusableSteps`, payload);
            if (res.status !== 200 || res.data?.error) {
                throw new Error(res.data?.error || "Update failed");
            }

            const returned = res.data ?? {};
            setDetails(prev => ({
                ...prev,
                [r.id]: {
                    ...d,
                    name: returned.name ?? payload.name,
                    description: returned.description ?? payload.description,
                    tagIds: Array.isArray(returned.tagIds) ? returned.tagIds : payload.tagIds,
                    tagNames: Array.isArray(returned.tagNames) ? returned.tagNames : payload.tagNames,
                    stepsData: Array.isArray(returned.stepsData) ? returned.stepsData : payload.stepsData,
                    deleteS3Images: typeof returned.deleteS3Images === "boolean" ? returned.deleteS3Images : payload.deleteS3Images,
                    temp: typeof returned.temp === "boolean" ? returned.temp : payload.temp,
                    updatedBy: returned.updatedBy ?? payload.updatedBy,
                }
            }));

            setReusables(prev => prev.map(h =>
                h.id === r.id
                    ? { ...h, name: payload.name, tagNames: payload.tagNames }
                    : h
            ));

            setEditingById(prev => ({ ...prev, [r.id]: false }));
            toast.success(`Reusable "${payload.name}" updated successfully`);
        } catch (e: any) {
            toast.error(e?.message ?? "Failed to update reusable");
        } finally {
            setIsLoadingSave(false);
        }
    };

    const makeStepSetters = (reusableId: string) => {
        const setResponseTest = (updater: any) => {
            setDetails(prev => {
                const d = prev[reusableId];
                if (!d) return prev;
                const prevObj = { stepsData: d.stepsData ?? [] };
                const nextObj = typeof updater === "function" ? updater(prevObj) : updater;
                const nextSteps = Array.isArray(nextObj?.stepsData) ? nextObj.stepsData : d.stepsData ?? [];
                return { ...prev, [reusableId]: { ...d, stepsData: reindexSteps(nextSteps) } };
            });
        };

        const setTestCasesData = (updater: any) => {
            setDetails(prev => {
                const d = prev[reusableId];
                if (!d) return prev;
                const arr = [{ testCaseId: reusableId, stepsData: d.stepsData ?? [] }];
                const nextArr = typeof updater === "function" ? updater(arr) : updater;
                const found = Array.isArray(nextArr) ? nextArr.find((tc) => tc.testCaseId === reusableId) : undefined;
                const nextSteps = Array.isArray(found?.stepsData) ? found.stepsData : d.stepsData ?? [];
                return { ...prev, [reusableId]: { ...d, stepsData: reindexSteps(nextSteps) } };
            });
        };

        return { setResponseTest, setTestCasesData };
    };

    const confirmDeleteReusable = async () => {
        if (!reusableToDelete) return;
        try {
            setIsDeleting(true);
            await checkConnection();
            const res = await axios.delete(`${URL_API_ALB}reusableSteps`, {
                data: { id: reusableToDelete.id }, // axios DELETE con body
            });
            if (res.status !== 200 || res.data?.error) {
                throw new Error(res.data?.error || "Delete failed");
            }

            // Actualiza estado local
            setReusables(prev => prev.filter(r => r.id !== reusableToDelete.id));
            setDetails(prev => {
                const copy = { ...prev };
                delete copy[reusableToDelete.id];
                return copy;
            });
            setExpanded(prev => {
                const copy = { ...prev };
                delete copy[reusableToDelete.id];
                return copy;
            });

            toast.success(`Reusable "${reusableToDelete.name}" deleted successfully`);
            setDeleteOpen(false);
            setReusableToDelete(null);
        } catch (e: any) {
            toast.error(e?.message ?? "Failed to delete reusable");
        } finally {
            setIsDeleting(false);
        }
    };
    return (
        <DashboardHeader onDarkModeChange={handleDarkModeChange}>
            <div className={`p-4 flex justify-center items-center w-full flex-col gap-4 ${isDarkMode ? "bg-gray-900 text-white" : "bg-white text-primary"} transition-colors duration-300`}>
                <div className="w-full max-w-5xl flex flex-col gap-4 mb-4 mt-2">
                    <h2 className="font-medium tracking-wide text-center text-[20px]">Find Reusables</h2>

                    {isLoadingReusables ? (
                        <div className="flex flex-col items-center justify-center text-center text-primary/70 py-10">
                            <Loader className="animate-spin h-8 w-8 mb-4" />
                            <h3 className="text-lg font-medium">Loading reusables...</h3>
                        </div>
                    ) : reusables.length === 0 ? (
                        <div className="text-center text-sm opacity-70 py-10">No reusables found.</div>
                    ) : (
                        <div className="space-y-3">
                            {reusables.map((reusable) => {
                                const isOpen = !!expanded[reusable.id];
                                const isLoading = !!loadingById[reusable.id];
                                const error = errorById[reusable.id];
                                const detail = details[reusable.id];
                                const isEditing = !!editingById[reusable.id];
                                const form = formById[reusable.id];
                                console.log("reusable detail:", detail?.tagNames);

                                const { setResponseTest, setTestCasesData } = makeStepSetters(reusable.id);

                                return (
                                    <div
                                        key={reusable.id}
                                        className={`border rounded-md w-full transition-colors ${isDarkMode ? "border-white/15 bg-white/5" : "border-primary/20 bg-white"} `}
                                    >
                                        <button
                                            onClick={() => toggleOpen(reusable)}
                                            className="w-full p-4 flex items-center justify-between hover:bg-primary/5 text-left"
                                        >
                                            <div className="flex items-center gap-3">
                                                {isOpen ? <ChevronDown className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}
                                                <div>
                                                    <h3 className="text-primary/90 text-base font-medium">{detail?.name ?? reusable.name}</h3>
                                                    <div className="flex flex-wrap gap-2 mt-1">
                                                        {(detail?.tagNames ?? reusable.tagNames ?? []).map((tag, idx) => (
                                                            <span key={idx} className="bg-primary/10 text-primary/80 text-[11px] font-medium px-2 py-0.5 rounded-full">
                                                                {tag}
                                                            </span>
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex flex-col items-end gap-1">
                                                {reusable.createdBy && (
                                                    <span className="text-xs opacity-80 rounded-md px-2 py-1 shadow-sm bg-primary/5">
                                                        {reusable.createdBy}
                                                    </span>
                                                )}
                                                {reusable.createdAt && (
                                                    <span className="text-xs opacity-70">
                                                        {new Date(reusable.createdAt).toLocaleString()}
                                                    </span>
                                                )}
                                            </div>
                                        </button>

                                        {isOpen && (
                                            <div className="px-4 pb-4 bg-primary/5 pt-2">
                                                {isLoading ? (
                                                    <div className="flex items-center gap-2 text-sm opacity-80 py-3">
                                                        <Loader className="animate-spin h-4 w-4" /> Loading details…
                                                    </div>
                                                ) : error ? (
                                                    <div className="text-sm text-red-600 py-3">Error: {error}</div>
                                                ) : detail ? (
                                                    <div className="space-y-4">
                                                        <div className="flex flex-wrap gap-2">

                                                            {!isEditing ? (
                                                                <>
                                                                    <Button size="sm" variant="outline" onClick={() => startEdit(reusable)}>
                                                                        <Edit /> Edit
                                                                    </Button>
                                                                    <Button
                                                                        size="sm"
                                                                        variant="destructive"
                                                                        onClick={() => {
                                                                            setReusableToDelete(reusable);
                                                                            setDeleteOpen(true);
                                                                        }}
                                                                        className="text-white bg-red-600 hover:bg-red-700 disabled:bg-red-500 disabled:cursor-not-allowed"
                                                                    >
                                                                        Delete
                                                                    </Button>
                                                                </>
                                                            ) : (

                                                                <>
                                                                    {!isEditing ? (
                                                                        <Button size="sm" variant="outline" onClick={() => startEdit(reusable)}>
                                                                            <Edit /> Edit
                                                                        </Button>
                                                                    ) : (
                                                                        <>
                                                                            <button className="border border-primary/40 p-1 text-xs rounded-md"
                                                                                disabled={isLoadingSave}
                                                                                onClick={() => cancelEdit(reusable)}>
                                                                                Cancel
                                                                            </button>

                                                                            <Button
                                                                                size="sm"
                                                                                onClick={() => saveReusable(reusable)}
                                                                                className="text-white"
                                                                                disabled={isLoadingSave}
                                                                            >
                                                                                {isLoadingSave ? (
                                                                                    <div className="flex items-center gap-2">
                                                                                        <Loader className="animate-spin h-4 w-4" /> Saving…
                                                                                    </div>
                                                                                ) : (
                                                                                    "Save"
                                                                                )}
                                                                            </Button>
                                                                        </>
                                                                    )}
                                                                </>

                                                            )}

                                                        </div>

                                                        {isEditing && form && (
                                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 border rounded-md p-3">
                                                                <div className="grid gap-1">
                                                                    <TextInputWithClearButton
                                                                        id={`name-${reusable.id}`}
                                                                        label="Reusable Step Name"
                                                                        value={form.name}
                                                                        onChangeHandler={e => setFormById(p => ({ ...p, [reusable.id]: { ...p[reusable.id], name: e.target.value } }))}
                                                                        placeholder="Reusable Step Name"
                                                                        className="border rounded px-2 py-1"
                                                                        isDarkMode={isDarkMode}
                                                                    />
                                                                </div>
                                                                <div className="grid gap-1">
                                                                    <TextInputWithClearButton
                                                                        id={`createdBy-${reusable.id}`}
                                                                        label="Created By"
                                                                        value={form.updatedBy}
                                                                        onChangeHandler={e => setFormById(p => ({ ...p, [reusable.id]: { ...p[reusable.id], updatedBy: e.target.value } }))}
                                                                        placeholder="Updated By"
                                                                        className="border rounded px-2 py-1"
                                                                        isDarkMode={isDarkMode}
                                                                    />
                                                                </div>
                                                                <div className="grid gap-1 md:col-span-2">

                                                                    <TextInputWithClearButton
                                                                        id={`description-${reusable.id}`}
                                                                        label="Description"
                                                                        value={form.description}
                                                                        onChangeHandler={e => setFormById(p => ({ ...p, [reusable.id]: { ...p[reusable.id], description: e.target.value } }))}
                                                                        placeholder="Description (optional)"
                                                                        className="border rounded px-2 py-1"
                                                                        isDarkMode={isDarkMode}
                                                                    />
                                                                </div>


                                                                <div className="grid gap-1 md:col-span-2">
                                                                    <label className="text-sm font-medium">Tags</label>
                                                                    <SearchCombobox
                                                                        textOptionSelect="Tag"
                                                                        textSearch="tag..."
                                                                        options={tags.map((tag: any) => ({
                                                                            label: tag.name,
                                                                            value: tag.id,
                                                                        }))}
                                                                        value={
                                                                            form.selectedTagId
                                                                            ?? (detail.tagIds?.[0] ?? "")
                                                                        }
                                                                        onChange={(value, option) => {
                                                                            setFormById(p => ({
                                                                                ...p,
                                                                                [reusable.id]: {
                                                                                    ...p[reusable.id],
                                                                                    selectedTagId: value || undefined,
                                                                                    selectedTagName: option?.label || undefined,
                                                                                    tagIdsCSV: value || "",
                                                                                    tagNamesCSV: option?.label || "",
                                                                                }
                                                                            }));
                                                                            setDetails(prev => ({
                                                                                ...prev,
                                                                                [reusable.id]: {
                                                                                    ...(prev[reusable.id] ?? {}),
                                                                                    tagIds: value ? [value] : [],
                                                                                    tagNames: option?.label ? [option.label] : [],
                                                                                }
                                                                            }));
                                                                        }}
                                                                        disabled={isLoadingTags}
                                                                    />
                                                                </div>
                                                            </div>
                                                        )}

                                                        <div >
                                                            <h4 className="text-md text-primary/70 font-semibold mb-1">Steps</h4>
                                                            {isEditing && (
                                                                <StepActions
                                                                    index={-1}
                                                                    steps={detail.stepsData || []}
                                                                    test={{ testCaseId: reusable.id }}
                                                                    setTestCasesData={setTestCasesData}
                                                                    setResponseTest={setResponseTest}
                                                                    showReusable={false}
                                                                />
                                                            )}

                                                            {Array.isArray(detail.stepsData) && detail.stepsData.length > 0 ? (
                                                                <div className="flex flex-col gap-3 overflow-y-auto max-h-[440px]">
                                                                    {detail.stepsData.map((step, idx) => (
                                                                        <div key={`${reusable.id}-step-${idx}`} className="border rounded p-2">
                                                                            <InteractionItem
                                                                                data={{ id: `${reusable.id}-step-${idx}`, ...step }}
                                                                                index={idx}
                                                                                isDarkMode={isDarkMode}
                                                                                test={{ testCaseId: reusable.id }}
                                                                                onDelete={(indexToDelete: number) => {
                                                                                    updateDetailSteps(reusable.id, (curr) =>
                                                                                        reindexSteps(curr.filter((_: any, i: number) => i !== indexToDelete))
                                                                                    );
                                                                                }}
                                                                                onUpdate={(indexToUpdate: number, updatedStep: any) => {
                                                                                    updateDetailSteps(reusable.id, (curr) => {
                                                                                        const next = [...curr];
                                                                                        next[indexToUpdate] = { ...next[indexToUpdate], ...updatedStep };
                                                                                        return reindexSteps(next);
                                                                                    });
                                                                                }}
                                                                                showDelete={isEditing}
                                                                            />
                                                                            {isEditing && (
                                                                                <StepActions
                                                                                    index={idx}
                                                                                    steps={detail.stepsData || []}
                                                                                    test={{ testCaseId: reusable.id }}
                                                                                    setTestCasesData={setTestCasesData}
                                                                                    setResponseTest={setResponseTest}
                                                                                    showReusable={false}
                                                                                />
                                                                            )}

                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            ) : (
                                                                <div className="text-sm opacity-70">No steps.</div>
                                                            )}
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <div className="text-sm opacity-70 py-3">No details.</div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>

            <Dialog open={deleteOpen} onOpenChange={(open) => {
                if (!open && !isDeleting) {
                    setDeleteOpen(false);
                    setReusableToDelete(null);
                } else {
                    setDeleteOpen(open);
                }
            }}>
                <DialogContent className="max-w-md text-primary">
                    <DialogHeader>
                        <DialogTitle>Delete reusable</DialogTitle>
                        <DialogDescription>
                            {reusableToDelete
                                ? <>You’re about to delete <span className="font-semibold">{reusableToDelete.name}</span>. This action cannot be undone.</>
                                : "This action cannot be undone."}
                        </DialogDescription>
                    </DialogHeader>

                    <DialogFooter className="flex gap-2">
                        <Button
                            variant="outline"
                            disabled={isDeleting}
                            onClick={() => {
                                if (isDeleting) return;
                                setDeleteOpen(false);
                                setReusableToDelete(null);
                            }}
                        >
                            Cancel
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={confirmDeleteReusable}
                            disabled={isDeleting}
                            className="text-white bg-red-600 hover:bg-red-700 disabled:bg-red-500 disabled:cursor-not-allowed"
                        >
                            {isDeleting ? (
                                <span className="inline-flex items-center gap-2">
                                    <Loader className="h-4 w-4 animate-spin" />
                                    Deleting…
                                </span>
                            ) : (
                                "Delete"
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

        </DashboardHeader>
    );
};

export default Reusables;
