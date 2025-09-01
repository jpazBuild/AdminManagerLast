"use client";
import { useEffect, useMemo, useState } from "react";
import TextInputWithClearButton from "@/app/components/InputClear";
import axios from "axios";
import { toast } from "sonner";
import { SearchField } from "@/app/components/SearchField";
import { URL_API_ALB } from "@/config";
import { DashboardHeader } from "../Layouts/main";
import NoData from "../components/NoData";
import { User } from "@/types/types";

type Group = { id: string; name: string; createdByName?: string; createdAt?: number };
type Tag = { id: string; name: string; createdByName?: string; createdAt?: number };
type Module = {
    id: string;
    name: string;
    groupId?: string;
    groupName?: string;
    createdByName?: string;
    createdAt?: number;
};
type Submodule = {
    id: string;
    name: string;
    groupId?: string;
    moduleId?: string;
    moduleName?: string;
    createdByName?: string;
    createdAt?: number;
};

type Tab = "group" | "tag" | "module" | "submodule";

const TabButton = ({
    active,
    onClick,
    children,
}: {
    active: boolean;
    onClick: () => void;
    children: React.ReactNode;
}) => (
    <button
        onClick={onClick}
        className={`px-4 cursor-pointer py-2 rounded-xl transition shadow-sm border text-sm md:text-base ${active
            ? "bg-primary/20 text-primary/90 border-transparent"
            : "bg-white/70 text-primary/80 hover:bg-white border-white/50"
            }`}
    >
        {children}
    </button>
);

const fmtDate = (ts?: number) =>
    ts
        ? new Intl.DateTimeFormat("es-ES", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        }).format(Number(ts))
        : "";

const PAGE_SIZE_OPTIONS = [5, 10, 15, 20];

type Column<T> = {
    key: string;
    header: string;
    className?: string;
    render?: (row: T) => React.ReactNode;
};

type PaginatedTableProps<T> = {
    data: T[];
    columns: Column<T>[];
    page: number;
    setPage: (n: number) => void;
    pageSize: number;
    setPageSize: (n: number) => void;
    loading?: boolean;
    emptyText: string;
    rowKey: (row: T, idx: number) => string | number;
};

function PaginatedTable<T>({
    data,
    columns,
    page,
    setPage,
    pageSize,
    setPageSize,
    loading,
    emptyText,
    rowKey,
}: PaginatedTableProps<T>) {
    const total = data.length;
    const maxPage = Math.max(1, Math.ceil(total / pageSize));
    const safePage = Math.min(page, maxPage);
    const start = (safePage - 1) * pageSize;
    const end = Math.min(start + pageSize, total);
    const slice = data.slice(start, end);

    useEffect(() => {
        if (page > maxPage) setPage(maxPage);
    }, [total, pageSize]);

    return (
        <div className="w-full flex flex-col gap-4">
            <div className="text-sm text-primary/70">
                {loading ? (
                    <span>Loading data...</span>
                ) : total > 0 ? (
                    <span>
                        Show <b>{start + 1}</b>–<b>{end}</b> of <b>{total}</b>
                    </span>
                ) : (
                    "No data available"
                )}
            </div>
            <div className="w-full overflow-hidden rounded-lg border border-primary/20">

                <div className="grid grid-cols-12 bg-primary/10 text-primary/80 text-sm font-medium">
                    {columns.map((c, i) => (
                        <div key={i} className={`px-3 py-2 ${c.className ?? "col-span-3"}`}>
                            {c.header}
                        </div>
                    ))}
                </div>
                {loading ? (
                    <div className="p-4 text-sm">Cargando…</div>
                ) : slice.length > 0 ? (
                    slice.map((row, idx) => (
                        <div
                            key={rowKey(row, idx)}
                            className="grid grid-cols-12 items-center border-t border-primary/10 hover:bg-primary/5"
                        >
                            {columns.map((c, i) => (
                                <div key={i} className={`px-3 py-2 ${c.className ?? "col-span-3"}`}>
                                    {c.render ? (c.render as any)(row) : (row as any)[c.key]}
                                </div>
                            ))}
                        </div>
                    ))
                ) : (
                    <NoData text={emptyText} />
                )}
            </div>

            <div className="w-full flex items-center justify-between mb-2 gap-3">

                <div className="w-full flex items-center gap-2">
                    <div className="w-full"></div>
                    <div className="w-full flex items-center gap-1">
                        <button
                            className="px-2 py-1 rounded border border-primary/20 text-sm hover:bg-primary/10 disabled:opacity-50"
                            onClick={() => setPage(1)}
                            disabled={safePage === 1}
                        >
                            «
                        </button>
                        <button
                            className="px-2 py-1 rounded border border-primary/20 text-sm hover:bg-primary/10 disabled:opacity-50"
                            onClick={() => setPage(Math.max(1, safePage - 1))}
                            disabled={safePage === 1}
                        >
                            Prev
                        </button>
                        <span className="px-2 text-sm text-primary/70">
                            {safePage} / {maxPage}
                        </span>
                        <button
                            className="px-2 py-1 rounded border border-primary/20 text-sm hover:bg-primary/10 disabled:opacity-50"
                            onClick={() => setPage(Math.min(maxPage, safePage + 1))}
                            disabled={safePage === maxPage}
                        >
                            Next
                        </button>
                        <button
                            className="px-2 py-1 rounded border border-primary/20 text-sm hover:bg-primary/10 disabled:opacity-50"
                            onClick={() => setPage(maxPage)}
                            disabled={safePage === maxPage}
                        >
                            »
                        </button>
                    </div>

                    <div className="self-end w-full flex items-center justify-end gap-1">
                        <label className="text-sm text-primary/70">Rows per page</label>
                        <select
                            className="rounded-md border border-primary/20 bg-white px-2 py-1 text-sm"
                            value={pageSize}
                            onChange={(e) => {
                                setPageSize(Number(e.target.value));
                                setPage(1);
                            }}
                        >
                            {PAGE_SIZE_OPTIONS.map((opt) => (
                                <option key={opt} value={opt}>
                                    {opt}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>
        </div>
    );
}

const CreateForm = () => {
    const [activeTab, setActiveTab] = useState<Tab>("tag");

    const [users, setUsers] = useState<User[]>([]);
    const [loadingUsers, setLoadingUsers] = useState(false);

    const [groups, setGroups] = useState<Group[]>([]);
    const [loadingGroups, setLoadingGroups] = useState(false);

    const [tags, setTags] = useState<Tag[]>([]);
    const [loadingTags, setLoadingTags] = useState(false);

    const [modules, setModules] = useState<Module[]>([]);
    const [loadingModules, setLoadingModules] = useState(false);

    const [submodules, setSubmodules] = useState<Submodule[]>([]);
    const [loadingSubmodules, setLoadingSubmodules] = useState(false);

    const [searchGroup, setSearchGroup] = useState("");
    const [searchTag, setSearchTag] = useState("");
    const [searchModule, setSearchModule] = useState("");
    const [searchSubmodule, setSearchSubmodule] = useState("");

    const [groupName, setGroupName] = useState("");
    const [createdByGroup, setCreatedByGroup] = useState("");
    const [creatingGroup, setCreatingGroup] = useState(false);

    const [tagName, setTagName] = useState("");
    const [createdByTag, setCreatedByTag] = useState("");
    const [creatingTag, setCreatingTag] = useState(false);

    const [moduleName, setModuleName] = useState("");
    const [createdByModule, setCreatedByModule] = useState("");
    const [selectedGroupForModule, setSelectedGroupForModule] = useState("");
    const [creatingModule, setCreatingModule] = useState(false);

    const [submoduleName, setSubmoduleName] = useState("");
    const [createdBySubmodule, setCreatedBySubmodule] = useState("");
    const [selectedGroupForSubmodule, setSelectedGroupForSubmodule] = useState("");
    const [parentModule, setParentModule] = useState("");
    const [creatingSubmodule, setCreatingSubmodule] = useState(false);

    const [isEditOpen, setIsEditOpen] = useState(false);
    const [editEntityType, setEditEntityType] = useState<Tab | null>(null);
    const [editEntity, setEditEntity] = useState<any>(null);
    const [editModules, setEditModules] = useState<Module[]>([]);

    const [grpPage, setGrpPage] = useState(1);
    const [grpPageSize, setGrpPageSize] = useState(10);

    const [tagPage, setTagPage] = useState(1);
    const [tagPageSize, setTagPageSize] = useState(10);

    const [modPage, setModPage] = useState(1);
    const [modPageSize, setModPageSize] = useState(10);

    const [subPage, setSubPage] = useState(1);
    const [subPageSize, setSubPageSize] = useState(10);

    const fetchUsers = async () => {
        try {
            setLoadingUsers(true);
            const res = await axios.post(`${URL_API_ALB}users`, {});
            setUsers(Array.isArray(res.data) ? (res.data as User[]) : []);
        } catch (err) {
            console.error("Error fetching users:", err);
            toast.error("Error fetching users");
        } finally {
            setLoadingUsers(false);
        }
    };

    const fetchGroups = async () => {
        try {
            setLoadingGroups(true);
            const response = await axios.post(`${URL_API_ALB}groups`, {});
            setGroups(Array.isArray(response.data) ? (response.data as Group[]) : []);
        } catch (error) {
            console.error("Error fetching groups:", error);
            toast.error("Error fetching groups");
        } finally {
            setLoadingGroups(false);
        }
    };

    const fetchTags = async () => {
        try {
            setLoadingTags(true);
            const response = await axios.post(`${URL_API_ALB}tags`, {});
            setTags(Array.isArray(response.data) ? (response.data as Tag[]) : []);
        } catch (error) {
            console.error("Error fetching tags:", error);
            toast.error("Error fetching tags");
        } finally {
            setLoadingTags(false);
        }
    };

    const fetchModules = async (groupId?: string) => {
        try {
            setLoadingModules(true);
            const payload = groupId ? { groupId } : {};
            const response = await axios.post(`${URL_API_ALB}modules`, payload);
            setModules(Array.isArray(response.data) ? (response.data as Module[]) : []);
        } catch (error) {
            console.error("Error fetching modules:", error);
            toast.error("Error fetching modules");
        } finally {
            setLoadingModules(false);
        }
    };

    const fetchEditModules = async (groupId?: string) => {
        try {
            const payload = groupId ? { groupId } : {};
            const response = await axios.post(`${URL_API_ALB}modules`, payload);
            setEditModules(Array.isArray(response.data) ? (response.data as Module[]) : []);
        } catch (error) {
            console.error("Error fetching edit modules:", error);
            toast.error("Error fetching modules");
        }
    };

    const fetchSubmodules = async () => {
        try {
            setLoadingSubmodules(true);
            const response = await axios.post(`${URL_API_ALB}subModules`, {});
            setSubmodules(Array.isArray(response.data) ? (response.data as Submodule[]) : []);
        } catch (error) {
            console.error("Error fetching submodules:", error);
            toast.error("Error fetching submodules");
        } finally {
            setLoadingSubmodules(false);
        }
    };

    useEffect(() => {
        fetchUsers();
        fetchGroups();
        fetchTags();
        fetchModules();
        fetchSubmodules();
    }, []);

    useEffect(() => {
        if (activeTab === "group") fetchGroups();
        if (activeTab === "tag") fetchTags();
        if (activeTab === "module") {
            fetchGroups();
            fetchModules();
        }
        if (activeTab === "submodule") {
            fetchGroups();
            fetchModules();
            fetchSubmodules();
        }
    }, [activeTab]);

    useEffect(() => {
        if (activeTab === "submodule" && selectedGroupForSubmodule) {
            fetchModules(selectedGroupForSubmodule);
        }
    }, [activeTab, selectedGroupForSubmodule]);

    useEffect(() => {
        if (isEditOpen && editEntityType === "submodule" && editEntity?.groupId) {
            fetchEditModules(editEntity.groupId);
        }
    }, [isEditOpen, editEntityType, editEntity?.groupId]);

    const userOptions = useMemo(
        () => (users || []).map((u) => ({ label: u.name, value: u.id })),
        [users]
    );
    const groupOptions = useMemo(
        () => (groups || []).map((g) => ({ label: g.name, value: g.id })),
        [groups]
    );
    const moduleOptions = useMemo(
        () => (modules || []).map((m) => ({ label: m.name, value: m.id || m.name })),
        [modules]
    );
    const editModuleOptions = useMemo(
        () => (editModules || []).map((m) => ({ label: m.name, value: m.id || m.name })),
        [editModules]
    );

    const filteredGroups = useMemo(
        () => groups.filter((g) => g.name.toLowerCase().includes(searchGroup.toLowerCase())),
        [groups, searchGroup]
    );
    const filteredTags = useMemo(
        () => tags.filter((t) => t.name.toLowerCase().includes(searchTag.toLowerCase())),
        [tags, searchTag]
    );
    const filteredModules = useMemo(
        () => modules.filter((m) => m.name.toLowerCase().includes(searchModule.toLowerCase())),
        [modules, searchModule]
    );
    const filteredSubmodules = useMemo(
        () => submodules.filter((s) => s.name.toLowerCase().includes(searchSubmodule.toLowerCase())),
        [submodules, searchSubmodule]
    );

    const createGroupHandler = async () => {
        if (!groupName || !createdByGroup)
            return toast.error("Group name and 'created by' fields are required.");
        try {
            setCreatingGroup(true);
            const response = await axios.put(`${URL_API_ALB}groups`, {
                name: groupName,
                createdBy: createdByGroup,
            });
            if (response.status === 200 && !String(response.data).includes("Error")) {
                toast.success("Group created successfully!");
                setGroupName("");
                setCreatedByGroup("");
                setGrpPage(1);
                fetchGroups();
            } else {
                toast.error("Error creating group: " + response.data);
            }
        } catch (error) {
            console.error("Error during group creation:", error);
            toast.error("Network or server error while creating group.");
        } finally {
            setCreatingGroup(false);
        }
    };

    const createTagHandler = async () => {
        if (!tagName || !createdByTag)
            return toast.error("Tag name and created by fields are required.");
        try {
            setCreatingTag(true);
            const response = await axios.put(`${URL_API_ALB}tags`, {
                name: tagName,
                createdBy: createdByTag,
            });
            if (response.status === 200 && !String(response.data).includes("Error")) {
                toast.success("Tag created successfully!");
                setTagName("");
                setCreatedByTag("");
                setTagPage(1);
                fetchTags();
            } else {
                toast.error("Error creating tag: " + response.data);
            }
        } catch (error) {
            console.error("Error creating tag:", error);
            toast.error("Network or server error while creating tag.");
        } finally {
            setCreatingTag(false);
        }
    };

    const createModuleHandler = async () => {
        if (!moduleName || !createdByModule || !selectedGroupForModule)
            return toast.error("Module name, group and created by are required.");
        try {
            setCreatingModule(true);
            const response = await axios.put(`${URL_API_ALB}modules`, {
                name: moduleName,
                groupId: selectedGroupForModule,
                createdBy: createdByModule,
            });
            if (response.status === 200 && !String(response.data).includes("Error")) {
                toast.success("Module created successfully!");
                setModuleName("");
                setCreatedByModule("");
                setSelectedGroupForModule("");
                setModPage(1);
                fetchModules();
            } else {
                toast.error("Error creating module: " + response.data);
            }
        } catch (error) {
            console.error("Error creating module:", error);
            toast.error("Network or server error while creating module.");
        } finally {
            setCreatingModule(false);
        }
    };

    const createSubmoduleHandler = async () => {
        if (!submoduleName || !createdBySubmodule || !selectedGroupForSubmodule || !parentModule)
            return toast.error(
                "Submodule name, group, parent module and created by are required."
            );
        try {
            setCreatingSubmodule(true);
            const payload = {
                groupId: selectedGroupForSubmodule,
                moduleId: parentModule,
                name: submoduleName,
                createdBy: createdBySubmodule,
            };
            const response = await axios.put(`${URL_API_ALB}subModules`, payload);
            if (response.status === 200 && !String(response.data).includes("Error")) {
                toast.success("Submodule created successfully!");
                setSubmoduleName("");
                setCreatedBySubmodule("");
                setSelectedGroupForSubmodule("");
                setParentModule("");
                setSubPage(1);
                fetchSubmodules();
            } else {
                toast.error("Error creating submodule: " + response.data);
            }
        } catch (error) {
            console.error("Error creating submodule:", error);
            toast.error("Network or server error while creating submodule.");
        } finally {
            setCreatingSubmodule(false);
        }
    };

    const deleteGroup = async (id: string) => {
        try {
            await axios.delete(`${URL_API_ALB}groups`, { data: { id } });
            toast.success("Group deleted");
            fetchGroups();
        } catch (e) {
            toast.error("Failed to delete group");
        }
    };
    const deleteTag = async (id: string) => {
        try {
            await axios.delete(`${URL_API_ALB}tags`, { data: { id } });
            toast.success("Tag deleted");
            fetchTags();
        } catch (e) {
            toast.error("Failed to delete tag");
        }
    };
    const deleteModule = async (id: string) => {
        try {
            await axios.delete(`${URL_API_ALB}modules`, { data: { id } });
            toast.success("Module deleted");
            fetchModules();
        } catch (e) {
            toast.error("Failed to delete module");
        }
    };
    const deleteSubmodule = async (id: string) => {
        try {
            await axios.delete(`${URL_API_ALB}subModules`, { data: { id } });
            toast.success("Submodule deleted");
            fetchSubmodules();
        } catch (e) {
            toast.error("Failed to delete submodule");
        }
    };

    const openEdit = (type: Tab, entity: any) => {
        setEditEntityType(type);
        setEditEntity(entity);
        setIsEditOpen(true);

        if (type === "submodule" && entity.groupId) {
            fetchEditModules(entity.groupId);
        }
    };

    const submitEdit = async () => {
        try {
            if (!editEntityType || !editEntity) return;
            if (editEntityType === "group") {
                await axios.patch(`${URL_API_ALB}groups`, {
                    id: editEntity.id,
                    name: editEntity.name,
                    updatedBy: editEntity.createdBy,
                });
                toast.success("Group updated");
                fetchGroups();
            }
            if (editEntityType === "tag") {
                await axios.patch(`${URL_API_ALB}tags`, {
                    id: editEntity.id,
                    name: editEntity.name,
                    updatedBy: editEntity.createdBy,
                });
                toast.success("Tag updated");
                fetchTags();
            }
            if (editEntityType === "module") {
                await axios.patch(`${URL_API_ALB}modules`, {
                    id: editEntity.id,
                    name: editEntity.name,
                    groupId: editEntity.groupId,
                    updatedBy: editEntity.createdBy,
                });
                toast.success("Module updated");
                fetchModules();
            }
            if (editEntityType === "submodule") {
                await axios.patch(`${URL_API_ALB}subModules`, {
                    id: editEntity.id,
                    name: editEntity.name,
                    groupId: editEntity.groupId,
                    moduleId: editEntity.moduleId,
                    updatedBy: editEntity.createdBy,
                });
                toast.success("Submodule updated");
                fetchSubmodules();
            }
            setIsEditOpen(false);
            setEditEntity(null);
            setEditEntityType(null);
            setEditModules([]);
        } catch (e) {
            toast.error("Failed to update");
        }
    };

    const onEditField = (key: string, val: any) => {
        setEditEntity((prev: any) => ({ ...prev, [key]: val }));

        if (key === "groupId" && editEntityType === "submodule") {
            setEditEntity((prev: any) => ({ ...prev, moduleId: "" }));
            if (val) {
                fetchEditModules(val);
            } else {
                setEditModules([]);
            }
        }
    };

    const editModuleGroupValue = useMemo(() => {
        const id = editEntity?.groupId;
        const name = editEntity?.groupName;
        if (id) return String(id);
        if (name) {
            const match = (groupOptions || []).find((o) => o.label === name);
            return match?.value ?? "";
        }
        return "";
    }, [editEntity?.groupId, editEntity?.groupName, groupOptions]);

    return (
        <DashboardHeader>
            <div className="w-2/3 flex flex-col items-center justify-start h-full gap-6 px-4 py-8">
                <h2 className=" text-2xl font-bold mb-2 text-primary/80 text-center">
                    Location Information
                </h2>

                <div className="flex gap-2 justify-center mb-2">
                    <TabButton active={activeTab === "tag"} onClick={() => setActiveTab("tag")}>
                        Tag
                    </TabButton>
                    <TabButton active={activeTab === "group"} onClick={() => setActiveTab("group")}>
                        Group
                    </TabButton>
                    <TabButton active={activeTab === "module"} onClick={() => setActiveTab("module")}>
                        Module
                    </TabButton>
                    <TabButton
                        active={activeTab === "submodule"}
                        onClick={() => setActiveTab("submodule")}
                    >
                        Submodule
                    </TabButton>
                </div>

                {activeTab === "group" && (
                    <div className="w-full flex flex-col gap-4 text-primary/80">
                        <div className="flex flex-col gap-3">
                            <TextInputWithClearButton
                                id="groupName"
                                type="text"
                                inputMode="text"
                                placeholder="Enter Group Name"
                                label="Enter Group Name"
                                onChangeHandler={(e: any) => setGroupName(e.target.value)}
                                value={groupName}
                            />
                            <SearchField
                                label="Created By"
                                value={createdByGroup}
                                onChange={setCreatedByGroup}
                                options={userOptions}
                                placeholder={loadingUsers ? "Loading users…" : "Select creator"}
                            />
                        </div>
                        <button
                            disabled={creatingGroup}
                            onClick={createGroupHandler}
                            className="cursor-pointer bg-slate-600 hover:bg-slate-700 disabled:opacity-60 shadow-md text-white py-2 px-4 rounded-md transition-colors"
                        >
                            {creatingGroup ? "Saving…" : "Save Group"}
                        </button>

                        <div className="w-full mt-4">
                            <div className="flex items-center justify-between mb-2">
                                <h4 className="text-md font-semibold text-primary/80">
                                    Existing Groups
                                </h4>
                                <TextInputWithClearButton
                                    id="searchGroup"
                                    type="text"
                                    inputMode="text"
                                    placeholder="Search groups..."
                                    label="Search Groups"
                                    onChangeHandler={(e: any) => {
                                        setSearchGroup(e.target.value);
                                        setGrpPage(1);
                                    }}
                                    value={searchGroup}
                                    isSearch={true}
                                />
                            </div>

                            <PaginatedTable
                                data={filteredGroups}
                                columns={[
                                    { key: "name", header: "Name", className: "col-span-3" },
                                    {
                                        key: "id",
                                        header: "ID",
                                        className: "col-span-3",
                                        render: (g: Group) => (
                                            <span className="text-xs text-gray-500">{g.id}</span>
                                        ),
                                    },
                                    {
                                        key: "meta",
                                        header: "Meta",
                                        className: "col-span-4",
                                        render: (g: Group) => (
                                            <div className="flex flex-col text-xs">
                                                <span>{g.createdByName}</span>
                                                <span className="text-gray-500">{fmtDate(g.createdAt)}</span>
                                            </div>
                                        ),
                                    },
                                    {
                                        key: "actions",
                                        header: "Actions",
                                        className: "col-span-2",
                                        render: (g: Group) => (
                                            <div className="flex items-center gap-2">
                                                <button
                                                    onClick={() => openEdit("group", { ...g })}
                                                    className="text-xs px-2 py-1 rounded bg-primary/20 hover:bg-primary/30"
                                                >
                                                    Edit
                                                </button>
                                                <button
                                                    onClick={() => deleteGroup(g.id)}
                                                    className="text-xs px-2 py-1 rounded bg-red-500/80 text-white hover:bg-red-600"
                                                >
                                                    Delete
                                                </button>
                                            </div>
                                        ),
                                    },
                                ]}
                                page={grpPage}
                                setPage={setGrpPage}
                                pageSize={grpPageSize}
                                setPageSize={setGrpPageSize}
                                loading={loadingGroups}
                                emptyText="No groups found. Create a new group to get started."
                                rowKey={(g) => (g as Group).id}
                            />
                        </div>
                    </div>
                )}

                {activeTab === "tag" && (
                    <div className="w-full flex flex-col gap-4 text-primary/80">
                        <div className="flex flex-col gap-3">
                            <TextInputWithClearButton
                                label="Enter Tag"
                                id="tagName"
                                type="text"
                                inputMode="text"
                                placeholder="Enter Tag Name"
                                onChangeHandler={(e: any) => setTagName(e.target.value)}
                                value={tagName}
                            />
                            <SearchField
                                label="Created By"
                                value={createdByTag}
                                onChange={setCreatedByTag}
                                options={userOptions}
                                placeholder={loadingUsers ? "Loading users…" : "Select creator"}
                            />
                        </div>
                        <button
                            disabled={creatingTag}
                            onClick={createTagHandler}
                            className="cursor-pointer bg-primary/80 hover:bg-slate-700 disabled:opacity-60 shadow-md text-white py-2 px-4 rounded-md transition-colors"
                        >
                            {creatingTag ? "Saving…" : "Save Tag"}
                        </button>

                        <div className="w-full mt-4">
                            <div className="flex items-center justify-between mb-2">
                                <h4 className="text-md font-semibold text-primary/80">
                                    Existing Tags
                                </h4>
                                <TextInputWithClearButton
                                    id="searchTag"
                                    type="text"
                                    label="Search Tags"
                                    inputMode="text"
                                    placeholder="Search tags..."
                                    onChangeHandler={(e: any) => {
                                        setSearchTag(e.target.value);
                                        setTagPage(1);
                                    }}
                                    value={searchTag}
                                    isSearch={true}
                                />
                            </div>

                            <PaginatedTable
                                data={filteredTags}
                                columns={[
                                    { key: "name", header: "Name", className: "col-span-3" },
                                    {
                                        key: "id",
                                        header: "ID",
                                        className: "col-span-3",
                                        render: (t: Tag) => (
                                            <span className="text-xs text-gray-500">{t.id}</span>
                                        ),
                                    },
                                    {
                                        key: "meta",
                                        header: "Meta",
                                        className: "col-span-4",
                                        render: (t: Tag) => (
                                            <div className="flex flex-col text-xs">
                                                <span>{t.createdByName}</span>
                                                <span className="text-gray-500">{fmtDate(t.createdAt)}</span>
                                            </div>
                                        ),
                                    },
                                    {
                                        key: "actions",
                                        header: "Actions",
                                        className: "col-span-2",
                                        render: (t: Tag) => (
                                            <div className="flex items-center gap-2">
                                                <button
                                                    onClick={() => openEdit("tag", { ...t })}
                                                    className="text-xs px-2 py-1 rounded bg-primary/20 hover:bg-primary/30"
                                                >
                                                    Edit
                                                </button>
                                                <button
                                                    onClick={() => deleteTag(t.id)}
                                                    className="text-xs px-2 py-1 rounded bg-red-500/80 text-white hover:bg-red-600"
                                                >
                                                    Delete
                                                </button>
                                            </div>
                                        ),
                                    },
                                ]}
                                page={tagPage}
                                setPage={setTagPage}
                                pageSize={tagPageSize}
                                setPageSize={setTagPageSize}
                                loading={loadingTags}
                                emptyText="No tags found. Create a new tag to get started."
                                rowKey={(t) => (t as Tag).id}
                            />
                        </div>
                    </div>
                )}

                {activeTab === "module" && (
                    <div className="w-full flex flex-col gap-4 text-primary/80">
                        <div className="flex flex-col gap-3">
                            <TextInputWithClearButton
                                id="moduleName"
                                type="text"
                                inputMode="text"
                                label="Enter Module Name"
                                placeholder="Enter Module Name"
                                onChangeHandler={(e: any) => setModuleName(e.target.value)}
                                value={moduleName}
                            />
                            <SearchField
                                label="Select Group"
                                value={selectedGroupForModule}
                                onChange={setSelectedGroupForModule}
                                options={groupOptions}
                                placeholder={loadingGroups ? "Loading groups…" : "Select group"}
                            />
                            <SearchField
                                label="Created By"
                                value={createdByModule}
                                onChange={setCreatedByModule}
                                options={userOptions}
                                placeholder={loadingUsers ? "Loading users…" : "Select creator"}
                            />
                        </div>
                        <button
                            disabled={creatingModule}
                            onClick={createModuleHandler}
                            className="cursor-pointer bg-slate-600 hover:bg-slate-700 disabled:opacity-60 shadow-md text-white py-2 px-4 rounded-md transition-colors"
                        >
                            {creatingModule ? "Saving…" : "Save Module"}
                        </button>

                        <div className="w-full mt-4">
                            <div className="w-full flex items-center justify-between mb-2">
                                <h4 className="text-md font-semibold text-primary/80">
                                    Existing Modules
                                </h4>
                                <TextInputWithClearButton
                                    id="searchModule"
                                    type="text"
                                    label="Search Modules"
                                    inputMode="text"
                                    placeholder="Search modules..."
                                    onChangeHandler={(e: any) => {
                                        setSearchModule(e.target.value);
                                        setModPage(1);
                                    }}
                                    value={searchModule}
                                    isSearch={true}
                                />
                            </div>

                            <PaginatedTable
                                data={filteredModules}
                                columns={[
                                    { key: "name", header: "Name", className: "col-span-3" },
                                    {
                                        key: "id",
                                        header: "ID",
                                        className: "col-span-3",
                                        render: (m: Module) => (
                                            <span className="text-xs text-gray-500">{m.id}</span>
                                        ),
                                    },
                                    {
                                        key: "meta",
                                        header: "Meta",
                                        className: "col-span-4",
                                        render: (m: Module) => (
                                            <div className="flex flex-col text-xs">
                                                <span>{m.groupName}</span>
                                                <div className="flex gap-2">
                                                    <span>{m.createdByName}</span>
                                                    <span className="text-gray-500">{fmtDate(m.createdAt)}</span>
                                                </div>
                                            </div>
                                        ),
                                    },
                                    {
                                        key: "actions",
                                        header: "Actions",
                                        className: "col-span-2",
                                        render: (m: Module) => (
                                            <div className="flex items-center gap-2">
                                                <button
                                                    onClick={() => openEdit("module", { ...m })}
                                                    className="text-xs px-2 py-1 rounded bg-primary/20 hover:bg-primary/30"
                                                >
                                                    Edit
                                                </button>
                                                <button
                                                    onClick={() => deleteModule(m.id)}
                                                    className="text-xs px-2 py-1 rounded bg-red-500/80 text-white hover:bg-red-600"
                                                >
                                                    Delete
                                                </button>
                                            </div>
                                        ),
                                    },
                                ]}
                                page={modPage}
                                setPage={setModPage}
                                pageSize={modPageSize}
                                setPageSize={setModPageSize}
                                loading={loadingModules}
                                emptyText="No modules found. Create a new module to get started."
                                rowKey={(m) => (m as Module).id}
                            />
                        </div>
                    </div>
                )}

                {activeTab === "submodule" && (
                    <div className="w-full flex flex-col gap-4 text-primary/80">
                        <div className="flex flex-col gap-3">
                            <TextInputWithClearButton
                                id="submoduleName"
                                type="text"
                                inputMode="text"
                                placeholder="Enter Submodule Name"
                                label="Enter Submodule Name"
                                onChangeHandler={(e: any) => setSubmoduleName(e.target.value)}
                                value={submoduleName}
                            />
                            <SearchField
                                label="Select Group"
                                value={selectedGroupForSubmodule}
                                onChange={(v: string) => {
                                    setSelectedGroupForSubmodule(v);
                                    setParentModule("");
                                }}
                                options={groupOptions}
                                placeholder={loadingGroups ? "Loading groups…" : "Select group"}
                            />
                            <SearchField
                                label="Select Parent Module"
                                value={parentModule}
                                onChange={setParentModule}
                                options={moduleOptions}
                                placeholder={loadingModules ? "Loading modules…" : "Select module"}
                            />
                            <SearchField
                                label="Created By"
                                value={createdBySubmodule}
                                onChange={setCreatedBySubmodule}
                                options={userOptions}
                                placeholder={loadingUsers ? "Loading users…" : "Select creator"}
                            />
                        </div>
                        <button
                            disabled={creatingSubmodule}
                            onClick={createSubmoduleHandler}
                            className="cursor-pointer bg-slate-600 hover:bg-slate-700 disabled:opacity-60 shadow-md text-white py-2 px-4 rounded-md transition-colors"
                        >
                            {creatingSubmodule ? "Saving…" : "Save Submodule"}
                        </button>

                        <div className="w-full mt-4">
                            <div className="flex items-center justify-between mb-2">
                                <h4 className="text-md font-semibold text-primary/80">
                                    Existing Submodules
                                </h4>
                                <TextInputWithClearButton
                                    id="searchSubmodule"
                                    type="text"
                                    inputMode="text"
                                    label="Search Submodules"
                                    placeholder="Search submodules..."
                                    onChangeHandler={(e: any) => {
                                        setSearchSubmodule(e.target.value);
                                        setSubPage(1);
                                    }}
                                    value={searchSubmodule}
                                    isSearch={true}
                                />
                            </div>

                            <PaginatedTable
                                data={filteredSubmodules}
                                columns={[
                                    { key: "name", header: "Name", className: "col-span-3" },
                                    {
                                        key: "id",
                                        header: "ID",
                                        className: "col-span-3",
                                        render: (s: Submodule) => (
                                            <span className="text-xs text-gray-500">{s.id}</span>
                                        ),
                                    },
                                    {
                                        key: "meta",
                                        header: "Meta",
                                        className: "col-span-4",
                                        render: (s: Submodule) => (
                                            <div className="flex flex-col text-xs">
                                                <span>{s.moduleName}</span>
                                                <div className="flex gap-2">
                                                    <span>{s.createdByName}</span>
                                                    <span className="text-gray-500">{fmtDate(s.createdAt)}</span>
                                                </div>
                                            </div>
                                        ),
                                    },
                                    {
                                        key: "actions",
                                        header: "Actions",
                                        className: "col-span-2",
                                        render: (s: Submodule) => (
                                            <div className="flex items-center gap-2">
                                                <button
                                                    onClick={() => openEdit("submodule", { ...s })}
                                                    className="text-xs px-2 py-1 rounded bg-primary/20 hover:bg-primary/30"
                                                >
                                                    Edit
                                                </button>
                                                <button
                                                    onClick={() => deleteSubmodule(s.id)}
                                                    className="text-xs px-2 py-1 rounded bg-red-500/80 text-white hover:bg-red-600"
                                                >
                                                    Delete
                                                </button>
                                            </div>
                                        ),
                                    },
                                ]}
                                page={subPage}
                                setPage={setSubPage}
                                pageSize={subPageSize}
                                setPageSize={setSubPageSize}
                                loading={loadingSubmodules}
                                emptyText="No submodules found. Create a new submodule to get started."
                                rowKey={(s) => (s as Submodule).id}
                            />
                        </div>
                    </div>
                )}

                {isEditOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
                        <div className="bg-white rounded-2xl shadow-xl w-full max-w-xl p-6 space-y-4">
                            <div className="flex items-center justify-between">
                                <h4 className="text-lg font-semibold text-primary/80">
                                    Edit {editEntityType}
                                </h4>
                                <button
                                    onClick={() => setIsEditOpen(false)}
                                    className="px-2 py-1 rounded hover:bg-black/5"
                                >
                                    ✕
                                </button>
                            </div>

                            <TextInputWithClearButton
                                label="Enter Name"
                                id="edit-name"
                                type="text"
                                inputMode="text"
                                placeholder="Name"
                                onChangeHandler={(e: any) => onEditField("name", e.target.value)}
                                value={editEntity?.name || ""}
                            />

                            {editEntityType === "module" && (
                                <SearchField
                                    label="Group"
                                    value={editModuleGroupValue}
                                    onChange={(v: string) => {
                                        onEditField("groupId", v);
                                        const match = (groupOptions || []).find((o) => o.value === v);
                                        if (match) onEditField("groupName", match.label);
                                    }}
                                    options={groupOptions}
                                    placeholder={loadingGroups ? "Loading groups…" : "Select group"}
                                />
                            )}

                            {editEntityType === "submodule" && (
                                <div className="grid gap-3 sm:grid-cols-2">
                                    <SearchField
                                        label="Group"
                                        value={
                                            editEntity?.groupId ||
                                            (groupOptions.find((o) => o.label === editEntity?.groupName)?.value ??
                                                "")
                                        }
                                        onChange={(v: string) => {
                                            onEditField("groupId", v);
                                            const match = (groupOptions || []).find((o) => o.value === v);
                                            if (match) onEditField("groupName", match.label);
                                        }}
                                        options={groupOptions}
                                        placeholder={loadingGroups ? "Loading groups…" : "Select group"}
                                    />
                                    <SearchField
                                        label="Parent Module"
                                        value={
                                            editEntity?.moduleId ||
                                            (modules.find((m) => m.name === editEntity?.moduleName)?.id ?? "")
                                        }
                                        onChange={(v: string) => {
                                            onEditField("moduleId", v);
                                            const match = modules.find((m) => m.id === v);
                                            if (match) onEditField("moduleName", match.name);
                                        }}
                                        options={(modules || [])
                                            .filter((m) => !editEntity?.groupId || m.groupId === editEntity.groupId)
                                            .map((m) => ({ label: m.name, value: m.id }))}
                                        placeholder={loadingModules ? "Loading modules…" : "Select module"}
                                    />
                                </div>
                            )}

                            <SearchField
                                label="Created By"
                                value={editEntity?.createdBy || ""}
                                onChange={(v: string) => onEditField("createdBy", v)}
                                options={userOptions}
                                placeholder={loadingUsers ? "Loading users…" : "Select creator"}
                            />

                            <div className="flex justify-end gap-2 pt-2">
                                <button
                                    onClick={() => setIsEditOpen(false)}
                                    className="px-3 py-2 rounded bg-gray-200 hover:bg-gray-300"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={submitEdit}
                                    className="px-3 py-2 rounded bg-primary/80 text-white hover:bg-primary"
                                >
                                    Save
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </DashboardHeader>
    );
}

export default CreateForm;