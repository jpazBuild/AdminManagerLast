"use client";
import { useEffect, useMemo, useState } from "react";
import { DashboardHeader } from "../../Layouts/main";
import axios from "axios";
import { URL_API_ALB } from "@/config";
import { toast } from "sonner";
import { Loader, ChevronDown, ChevronRight, Edit, Plus } from "lucide-react";
import { checkConnection } from "@/utils/DBBUtils";
import InteractionItem from "@/app/components/Interaction";
import { Button } from "@/components/ui/button";
import TextInputWithClearButton from "@/app/components/InputClear";
import StepActions from "@/app/components/StepActions";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from "@/components/ui/dialog";
import { SearchField } from "@/app/components/SearchField";
import ModalCustom from "@/app/components/ModalCustom";
import { RiInformation2Line } from "react-icons/ri";
import PaginationResults from "../components/PaginationResults";
import { usePagination } from "@/app/hooks/usePagination";

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
    const tagOptions = useMemo(
        () => [{ label: "All", value: "" }, ...tags.map((t: any) => ({ label: t.name, value: t.id }))],
        [tags]
    );
    const [allReusables, setAllReusables] = useState<any[]>([]);
    const [searchQuery, setSearchQuery] = useState("");
    const selectedTagName = useMemo(
        () => tags.find((t: any) => t.id === selectedTag)?.name ?? "",
        [selectedTag, tags]
    );

    const filteredReusables = useMemo(() => {
        if (!selectedTag) return reusables;
        return reusables.filter((r) => {
            const byId = Array.isArray(r.tagIds) && r.tagIds.includes(selectedTag);
            const byName = Array.isArray(r.tagNames) && r.tagNames.includes(selectedTagName);
            return byId || byName;
        });
    }, [reusables, selectedTag, selectedTagName]);

    const [createOpen, setCreateOpen] = useState(false);
    const [isCreating, setIsCreating] = useState(false);
    const [createForm, setCreateForm] = useState<{
        name: string;
        description: string;
        selectedTagId?: string;
        selectedTagName?: string;
        createdBy: string;
        temp: boolean;
        stepsData: any[];
    }>({
        name: "",
        description: "",
        selectedTagId: undefined,
        selectedTagName: undefined,
        createdBy: "jpaz",
        temp: false,
        stepsData: [],
    });

    const fetchReusables = async (tagId?: string) => {
        try {
            setIsLoadingReusables(true);
            await checkConnection();
            const body = tagId ? { tagIds: [tagId] } : {};
            const reusableRes = await axios.post(`${URL_API_ALB}getReusableStepsHeaders`, body);
            if (reusableRes.data?.error) throw new Error(reusableRes.data.error);
            const data = Array.isArray(reusableRes.data) ? reusableRes.data : [];
            setReusables(data);
            setAllReusables(data);
            const v = searchQuery.trim().toLowerCase();
            setReusables(
                v ? data.filter(r => (r.name ?? "").toLowerCase().includes(v)) : data
            );
        } catch (error: any) {
            console.error("Error fetching reusables:", error);
            toast.error(error?.message ?? "Error fetching reusables");
            setReusables([]);
        } finally {
            setIsLoadingReusables(false);
        }
    };

    const applyNameFilter = (val: string) => {
        const v = (val || "").trim().toLowerCase();
        setSearchQuery(val);
        if (!v) {
            setReusables(allReusables);
            return;
        }
        setReusables(
            allReusables.filter(r => (r.name ?? "").toLowerCase().includes(v))
        );
    }

    useEffect(() => { fetchReusables(); }, []);

    useEffect(() => {
        const fetchInitialData = async () => {
            try {
                setIsLoadingTags(true);
                await checkConnection();
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
                data: { id: reusableToDelete.id },
            });
            if (res.status !== 200 || res.data?.error) {
                throw new Error(res.data?.error || "Delete failed");
            }

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
            fetchReusables(selectedTag || undefined);

        } catch (e: any) {
            toast.error(e?.message ?? "Failed to delete reusable");
        } finally {
            setIsDeleting(false);
        }
    };

    const makeCreateStepSetters = () => {
        const setResponseTest = (updater: any) => {
            setCreateForm(prev => {
                const prevObj = { stepsData: prev.stepsData ?? [] };
                const nextObj = typeof updater === "function" ? updater(prevObj) : updater;
                const nextSteps = Array.isArray(nextObj?.stepsData) ? nextObj.stepsData : prev.stepsData ?? [];
                return { ...prev, stepsData: reindexSteps(nextSteps) };
            });
        };

        const setTestCasesData = (updater: any) => {
            setCreateForm(prev => {
                const arr = [{ testCaseId: "create", stepsData: prev.stepsData ?? [] }];
                const nextArr = typeof updater === "function" ? updater(arr) : updater;
                const found = Array.isArray(nextArr) ? nextArr.find((tc) => tc.testCaseId === "create") : undefined;
                const nextSteps = Array.isArray(found?.stepsData) ? found.stepsData : prev.stepsData ?? [];
                return { ...prev, stepsData: reindexSteps(nextSteps) };
            });
        };

        return { setResponseTest, setTestCasesData };
    };

    const resetCreateForm = () => {
        setCreateForm({
            name: "",
            description: "",
            selectedTagId: undefined,
            selectedTagName: undefined,
            createdBy: "jpaz",
            temp: false,
            stepsData: [],
        });
    };

    const submitCreate = async () => {
        if (!createForm.name?.trim()) {
            toast.error("Name is required");
            return;
        }
        if (!createForm.selectedTagName) {
            toast.error("Select a tag");
            return;
        }

        const payload = {
            tagNames: createForm.selectedTagName ? [createForm.selectedTagName] : [],
            name: createForm.name.trim(),
            description: createForm.description ?? "",
            stepsData: Array.isArray(createForm.stepsData) ? createForm.stepsData : [],
            createdBy: createForm.createdBy || "jpaz",
            temp: Boolean(createForm.temp),
        };

        try {
            setIsCreating(true);
            await checkConnection();
            const res = await axios.put(`${URL_API_ALB}reusableSteps`, payload);
            if (res.status !== 200 || res.data?.error) {
                throw new Error(res.data?.error || "Create failed");
            }

            const returned = res.data ?? {};
            const newItem: ReusableHeader = {
                id: returned.id || crypto.randomUUID(),
                name: returned.name ?? payload.name,
                tagNames: Array.isArray(returned.tagNames) ? returned.tagNames : payload.tagNames,
                createdAt: returned.createdAt ?? new Date().toISOString(),
                createdBy: returned.createdBy ?? payload.createdBy,
                description: returned.description ?? payload.description,
                stepsData: returned.stepsData ?? payload.stepsData,
            };

            setReusables(prev => [newItem, ...prev]);
            toast.success(`Reusable "${payload.name}" created successfully`);
            setCreateOpen(false);
            resetCreateForm();
            fetchReusables(selectedTag || undefined);
        } catch (e: any) {
            toast.error(e?.message ?? "Failed to create reusable");
        } finally {
            setIsCreating(false);
        }
    };

    const {
        page, setPage,
        pageSize, setPageSize,
        totalItems,
        items: paginatedSelectedTests,
    } = usePagination(filteredReusables, 10);


    return (
        <DashboardHeader hiddenSide={deleteOpen} onDarkModeChange={handleDarkModeChange}>
            <div className={`p-4 flex justify-center items-center w-full flex-col gap-4 ${isDarkMode ? "bg-gray-900 text-white" : "bg-white text-primary"} transition-colors duration-300`}>
                <div className="w-full max-w-5xl flex flex-col gap-4 mb-4 mt-2">

                    <div className="flex items-center justify-between">
                        <h2 className="font-medium tracking-wide text-[20px]">Reusables</h2>

                        <div className="flex items-center gap-2">
                            <div className="w-56 flex items-center">

                                <SearchField
                                    options={tagOptions}
                                    value={selectedTag}
                                    onChange={(value) => {
                                        const v = value || "";
                                        setSelectedTag(v);
                                        fetchReusables(v || undefined);
                                    }}
                                    placeholder="Filter by tag..."
                                    disabled={isLoadingTags}
                                    darkMode={isDarkMode}
                                />
                            </div>

                            <button
                                className={`flex items-center px-3 py-1.5 rounded-md text-sm font-medium ${isDarkMode ? "bg-primary-blue/80 text-white hover:bg-primary-blue/90" : "bg-primary/80 text-white hover:bg-primary/90"} `}
                                onClick={() => {
                                    resetCreateForm();
                                    setCreateOpen(true);
                                }}
                            >
                                <Plus className="h-4 w-4 mr-1" /> Create reusable
                            </button>
                        </div>
                    </div>
                    {isLoadingReusables ? (
                        <div className="flex flex-col gap-2 items-center justify-center text-center py-10">
                            <div className={`w-full h-20 rounded-md ${isDarkMode ? "bg-gray-800" : "bg-gray-200"}`}></div>
                            <div className={`w-full h-20 rounded-md ${isDarkMode ? "bg-gray-800" : "bg-gray-200"}`}></div>
                            <div className={`w-full h-20 rounded-md ${isDarkMode ? "bg-gray-800" : "bg-gray-200"}`}></div>

                        </div>
                    ) : paginatedSelectedTests.length === 0 ? (
                        <div className="text-center text-sm opacity-70 py-10">No reusables found.</div>
                    ) : (
                        <div className="space-y-3 min-h-screen">

                            <div className="mb-4">
                                <TextInputWithClearButton
                                    id="filter-name"
                                    label="Filter by name"
                                    value={searchQuery}
                                    onChangeHandler={(e) => applyNameFilter(e.target.value)}
                                    placeholder="Type to filter by name..."
                                    isDarkMode={isDarkMode}

                                />
                            </div>
                            <p className="text-xs opacity-70">
                                Showing {paginatedSelectedTests.length} of {allReusables.length}
                            </p>

                            <PaginationResults
                                totalItems={totalItems}
                                pageSize={pageSize}
                                setPageSize={setPageSize}
                                page={page}
                                setPage={setPage}
                                darkMode={isDarkMode}
                            />
                            {paginatedSelectedTests.map((reusable) => {
                                const isOpen = !!expanded[reusable.id];
                                const isLoading = !!loadingById[reusable.id];
                                const error = errorById[reusable.id];
                                const detail = details[reusable.id];
                                const isEditing = !!editingById[reusable.id];
                                const form = formById[reusable.id];

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
                                                    <h3 className={`${isDarkMode ? "text-white/90 text-base font-medium":"text-primary/90 text-base font-medium"}`}>{detail?.name ?? reusable.name}</h3>
                                                    <div className="flex flex-wrap gap-2 mt-1">
                                                        {(detail?.tagNames ?? reusable.tagNames ?? []).map((tag, idx) => (
                                                            <span key={idx} className={`${isDarkMode ? "bg-gray-700 text-white" : "bg-primary/80 text-white"} text-xs px-2 py-1 rounded-md`}>
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
                                                    <div className="flex flex-col items-center gap-2 text-sm opacity-80 py-3">
                                                        <div className={`w-full h-20 rounded-md ${isDarkMode ? "bg-gray-800" : "bg-gray-200"}`}></div>
                                                    </div>
                                                ) : error ? (
                                                    <div className="text-sm text-red-600 py-3">Error: {error}</div>
                                                ) : detail ? (
                                                    <div className="space-y-4">
                                                        <div className="flex flex-wrap gap-2">
                                                            {!isEditing ? (
                                                                <>
                                                                    <Button size="sm"

                                                                        className={`${isDarkMode ? "bg-primary-blue/80 text-white hover:bg-primary-blue/90" : "bg-primary/80 text-white hover:bg-primary/90"} `}
                                                                        variant="destructive" onClick={() => startEdit(reusable)}>
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
                                                                    <button
                                                                        className={`${isDarkMode ? "bg-gray-700 text-white hover:bg-gray-600" : "bg-gray-200 text-primary hover:bg-gray-300"}  px-3 py-1.5 rounded-md text-sm font-medium`}
                                                                        disabled={isLoadingSave}
                                                                        onClick={() => cancelEdit(reusable)}
                                                                    >
                                                                        Cancel
                                                                    </button>

                                                                    <Button
                                                                        size="sm"
                                                                        onClick={() => saveReusable(reusable)}
                                                                        className={`${isDarkMode ? "bg-primary-blue/80 text-white hover:bg-primary-blue/90" : "bg-primary/80 text-white hover:bg-primary/90"} `}
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
                                                        </div>

                                                        {isEditing && form && (
                                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 rounded-md p-3">
                                                                <div className="grid gap-1">
                                                                    <TextInputWithClearButton
                                                                        id={`name-${reusable.id}`}
                                                                        label="Reusable Step Name"
                                                                        value={form.name}
                                                                        onChangeHandler={e => setFormById(p => ({ ...p, [reusable.id]: { ...p[reusable.id], name: e.target.value } }))}
                                                                        placeholder="Reusable Step Name"

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
                                                                        isDarkMode={isDarkMode}
                                                                    />
                                                                </div>

                                                                <div className="grid gap-1 md:col-span-2">
                                                                    <label className="text-sm font-medium">Tags</label>
                                                                    <SearchField
                                                                        options={tagOptions}
                                                                        value={form.selectedTagId || ""}
                                                                        onChange={(value) => {
                                                                            const option = tagOptions.find(opt => opt.value === value);
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
                                                                            setSelectedTag(value || "");
                                                                        }}
                                                                        disabled={isLoadingTags}
                                                                        darkMode={isDarkMode}
                                                                    />
                                                                </div>
                                                            </div>
                                                        )}

                                                        <div>
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


            <ModalCustom
                open={deleteOpen}

                onClose={() => {
                    if (!isDeleting) {
                        setDeleteOpen(false);
                        setReusableToDelete(null);
                    }
                }}

            >
                <div className="w-full flex flex-col gap-4 p-4">
                    <RiInformation2Line className="h-8 w-8 text-red-600 mx-auto" />
                    <p className="text-center font-semibold text-xl">Are you sure you want to delete this</p>
                    <div className="flex gap-2 mt-4 text-[16px] text-primary/80">
                        {reusableToDelete
                            ? <>You’re about to delete <span className="font-semibold">{reusableToDelete.name}.</span> This action cannot be undone.</>
                            : "This action cannot be undone."}
                    </div>

                    <div className="flex gap-2 mt-6 w-full">
                        <button
                            onClick={() => {
                                if (isDeleting) return;
                                setDeleteOpen(false);
                                setReusableToDelete(null);
                            }}
                            className="border border-primary/40 p-2 rounded-md w-full"
                        >Cancel</button>
                        <button
                            className="bg-red-600 w-full hover:bg-red-700 disabled:bg-red-500 disabled:cursor-not-allowed text-white px-4 py-2 rounded-md"
                        >{isDeleting ? (
                            <span className=" items-center gap-2">
                                <Loader className="h-4 w-4 animate-spin" />
                                Deleting…
                            </span>
                        ) : (
                            "Delete"
                        )}</button>
                    </div>
                </div>

            </ModalCustom>


            <ModalCustom
                open={createOpen}
                onClose={() => {
                    if (!isCreating) {
                        setCreateOpen(false);
                        resetCreateForm();
                    }
                }}
                width="sm:max-w-3xl"
            >
                <div className="w-full flex flex-col gap-4 p-4">
                    <h2 className="text-xl font-semibold text-primary/90 text-center">Create Reusable</h2>
                    <div className="text-md px-1 text-center text-primary/50">
                        Fill the fields and add steps to create a new reusable.
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div className="grid gap-1">
                            <TextInputWithClearButton
                                id="create-name"
                                label="Name"
                                value={createForm.name}
                                onChangeHandler={(e) => setCreateForm(p => ({ ...p, name: e.target.value }))}
                                placeholder="Reusable name"
                                isDarkMode={isDarkMode}
                            />
                        </div>
                        <div className="grid gap-1">
                            <TextInputWithClearButton
                                id="create-createdBy"
                                label="Created By"
                                value={createForm.createdBy}
                                onChangeHandler={(e) => setCreateForm(p => ({ ...p, createdBy: e.target.value }))}
                                placeholder="Author"
                                isDarkMode={isDarkMode}
                            />
                        </div>
                        <div className="grid gap-1 md:col-span-2">
                            <TextInputWithClearButton
                                id="create-description"
                                label="Description"
                                value={createForm.description}
                                onChangeHandler={(e) => setCreateForm(p => ({ ...p, description: e.target.value }))}
                                placeholder="Description (optional)"
                                isDarkMode={isDarkMode}
                            />
                        </div>

                        <div className="grid gap-1 md:col-span-2">
                            <label className="text-sm font-medium">Tag</label>

                            <SearchField
                                options={tags.map((tag: any) => ({ label: tag.name, value: tag.id }))}
                                value={createForm.selectedTagId || ""}
                                onChange={(value) => {
                                    const option = tags.find((tag: any) => tag.id === value);
                                    setCreateForm(p => ({
                                        ...p,
                                        selectedTagId: value || undefined,
                                        selectedTagName: option?.name || undefined,
                                    }));
                                    setSelectedTag(value || "");
                                }}
                                disabled={isLoadingTags}
                            />
                        </div>
                    </div>

                    <div className="mt-4">
                        <h4 className="text-sm font-semibold text-primary/80 mb-2">Steps</h4>

                        <StepActions
                            index={-1}
                            steps={createForm.stepsData || []}
                            test={{ testCaseId: "create" }}
                            {...makeCreateStepSetters()}
                            showReusable={false}
                        />

                        {Array.isArray(createForm.stepsData) && createForm.stepsData.length > 0 ? (
                            <div className="flex flex-col gap-3 overflow-y-auto max-h-[360px] mt-2">
                                {createForm.stepsData.map((step, idx) => (
                                    <div key={`create-step-${idx}`} className="border rounded p-2">
                                        <InteractionItem
                                            data={{ id: `create-step-${idx}`, ...step }}
                                            index={idx}
                                            isDarkMode={isDarkMode}
                                            test={{ testCaseId: "create" }}
                                            onDelete={(indexToDelete: number) => {
                                                setCreateForm(p => ({
                                                    ...p,
                                                    stepsData: reindexSteps(p.stepsData.filter((_: any, i: number) => i !== indexToDelete))
                                                }));
                                            }}
                                            onUpdate={(indexToUpdate: number, updatedStep: any) => {
                                                setCreateForm(p => {
                                                    const next = [...p.stepsData];
                                                    next[indexToUpdate] = { ...next[indexToUpdate], ...updatedStep };
                                                    return { ...p, stepsData: reindexSteps(next) };
                                                });
                                            }}
                                            showDelete={true}
                                        />
                                        <StepActions
                                            index={idx}
                                            steps={createForm.stepsData || []}
                                            test={{ testCaseId: "create" }}
                                            {...makeCreateStepSetters()}
                                            showReusable={false}
                                        />
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-xs opacity-70 mt-1">No steps.</div>
                        )}
                    </div>

                    <div className="flex gap-2 mt-6 w-full">
                        <button disabled={isCreating}
                            onClick={() => {
                                if (isCreating) return;
                                setCreateOpen(false);
                                resetCreateForm();
                            }}
                            className="w-full border border-primary/60 font-semibold rounded-md px-4 py-2">Cancel</button>
                        <button onClick={submitCreate}
                            disabled={isCreating}
                            className="w-full bg-primary/90 text-white font-semibold rounded-md px-4 py-2">Create</button>
                    </div>
                </div>
            </ModalCustom>
        </DashboardHeader>
    );
};

export default Reusables;