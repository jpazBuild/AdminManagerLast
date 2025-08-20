"use client";
import { useEffect, useMemo, useState } from "react";
import { MdArrowBack } from "react-icons/md";
import Link from "next/link";
import TextInputWithClearButton from "@/app/components/InputClear";
import axios from "axios";
import { toast } from "sonner";
import { SearchField } from "@/app/components/SearchField";
import { URL_API_ALB } from "@/config";
import { DashboardHeader } from "../Layouts/main";
import NoData from "../components/NoData";

type User = {
    passwordHash: string;
    createdAt: number;
    id: string;
    name: string;
    route: string;
    type: string;
};

type Group = { id: string; name: string; createdByName?: string; createdAt?: number };
type Tag = { id: string; name: string; createdByName?: string; createdAt?: number };
type Module = { id: string; name: string; groupId?: string; groupName?: string; createdByName?: string; createdAt?: number };
type Submodule = { id: string; name: string; groupId?: string; moduleId?: string; moduleName?: string; createdByName?: string; createdAt?: number };

type Tab = "group" | "tag" | "module" | "submodule";

const TabButton = ({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) => (
    <button
        onClick={onClick}
        className={`px-4 cursor-pointer py-2 rounded-xl transition shadow-sm border text-sm md:text-base ${active ? "bg-primary/20 text-primary/90 border-transparent" : "bg-white/70 text-primary/80 hover:bg-white border-white/50"
            }`}
    >
        {children}
    </button>
);

const fmtDate = (ts?: number) => (ts ? new Intl.DateTimeFormat("es-ES", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" }).format(Number(ts)) : "");

export default function CreateForm() {
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
        if (activeTab === "module" && modules.length === 0) {
            fetchModules();
        }
    }, [activeTab]);

    useEffect(() => {
        if (activeTab === "submodule" && selectedGroupForSubmodule) {
            fetchModules(selectedGroupForSubmodule);
        }
    }, [activeTab, selectedGroupForSubmodule]);

    useEffect(() => {
        if (activeTab === "group") fetchGroups();
        if (activeTab === "tag") fetchTags();
        if (activeTab === "module") { fetchGroups(); fetchModules(); }
        if (activeTab === "submodule") { fetchGroups(); fetchModules(); fetchSubmodules(); }
    }, [activeTab]);

    useEffect(() => {
        if (isEditOpen && editEntityType === "submodule" && editEntity?.groupId) {
            fetchEditModules(editEntity.groupId);
        }
    }, [isEditOpen, editEntityType, editEntity?.groupId]);

    const userOptions = useMemo(() => (users || []).map(u => ({ label: u.name, value: u.id })), [users]);
    const groupOptions = useMemo(() => (groups || []).map(g => ({ label: g.name, value: g.id })), [groups]);
    const moduleOptions = useMemo(
        () => (modules || []).map(m => ({ label: m.name, value: m.id || m.name })),
        [modules]
    );
    const editModuleOptions = useMemo(
        () => (editModules || []).map(m => ({ label: m.name, value: m.id || m.name })),
        [editModules]
    );

    const filteredGroups = useMemo(() =>
        groups.filter(g => g.name.toLowerCase().includes(searchGroup.toLowerCase())),
        [groups, searchGroup]
    );

    const filteredTags = useMemo(() =>
        tags.filter(t => t.name.toLowerCase().includes(searchTag.toLowerCase())),
        [tags, searchTag]
    );

    const filteredModules = useMemo(() =>
        modules.filter(m => m.name.toLowerCase().includes(searchModule.toLowerCase())),
        [modules, searchModule]
    );

    const filteredSubmodules = useMemo(() =>
        submodules.filter(s => s.name.toLowerCase().includes(searchSubmodule.toLowerCase())),
        [submodules, searchSubmodule]
    );

    const createGroupHandler = async () => {
        if (!groupName || !createdByGroup) return toast.error("Group name and 'created by' fields are required.");
        try {
            setCreatingGroup(true);
            const response = await axios.put(`${URL_API_ALB}groups`, { name: groupName, createdBy: createdByGroup });
            if (response.status === 200 && !String(response.data).includes("Error")) {
                toast.success("Group created successfully!");
                setGroupName("");
                setCreatedByGroup("");
                fetchGroups();
            } else {
                toast.error("Error creating group: " + response.data);
            }
        } catch (error) {
            console.error("Error during group creation:", error);
            toast.error("Network or server error while creating group.");
        } finally { setCreatingGroup(false); }
    };

    const createTagHandler = async () => {
        if (!tagName || !createdByTag) return toast.error("Tag name and created by fields are required.");
        try {
            setCreatingTag(true);
            const response = await axios.put(`${URL_API_ALB}tags`, { name: tagName, createdBy: createdByTag });
            if (response.status === 200 && !String(response.data).includes("Error")) {
                toast.success("Tag created successfully!");
                setTagName("");
                setCreatedByTag("");
                fetchTags();
            } else {
                toast.error("Error creating tag: " + response.data);
            }
        } catch (error) {
            console.error("Error creating tag:", error);
            toast.error("Network or server error while creating tag.");
        } finally { setCreatingTag(false); }
    };

    const createModuleHandler = async () => {
        if (!moduleName || !createdByModule || !selectedGroupForModule) return toast.error("Module name, group and created by are required.");
        try {
            setCreatingModule(true);
            const response = await axios.put(`${URL_API_ALB}modules`, { name: moduleName, groupId: selectedGroupForModule, createdBy: createdByModule });
            if (response.status === 200 && !String(response.data).includes("Error")) {
                toast.success("Module created successfully!");
                setModuleName("");
                setCreatedByModule("");
                setSelectedGroupForModule("");
                fetchModules();
            } else {
                toast.error("Error creating module: " + response.data);
            }
        } catch (error) {
            console.error("Error creating module:", error);
            toast.error("Network or server error while creating module.");
        } finally { setCreatingModule(false); }
    };

    const createSubmoduleHandler = async () => {
        if (!submoduleName || !createdBySubmodule || !selectedGroupForSubmodule || !parentModule) return toast.error("Submodule name, group, parent module and created by are required.");
        try {
            setCreatingSubmodule(true);
            const payload = { groupId: selectedGroupForSubmodule, moduleId: parentModule, name: submoduleName, createdBy: createdBySubmodule };
            const response = await axios.put(`${URL_API_ALB}subModules`, payload);
            if (response.status === 200 && !String(response.data).includes("Error")) {
                toast.success("Submodule created successfully!");
                setSubmoduleName("");
                setCreatedBySubmodule("");
                setSelectedGroupForSubmodule("");
                setParentModule("");
                fetchSubmodules();
            } else {
                toast.error("Error creating submodule: " + response.data);
            }
        } catch (error) {
            console.error("Error creating submodule:", error);
            toast.error("Network or server error while creating submodule.");
        } finally { setCreatingSubmodule(false); }
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
                await axios.patch(`${URL_API_ALB}groups`, { id: editEntity.id, name: editEntity.name, updatedBy: editEntity.createdBy });
                toast.success("Group updated");
                fetchGroups();
            }
            if (editEntityType === "tag") {
                await axios.patch(`${URL_API_ALB}tags`, { id: editEntity.id, name: editEntity.name, updatedBy: editEntity.createdBy });
                toast.success("Tag updated");
                fetchTags();
            }
            if (editEntityType === "module") {
                await axios.patch(`${URL_API_ALB}modules`, { id: editEntity.id, name: editEntity.name, groupId: editEntity.groupId, updatedBy: editEntity.createdBy });
                toast.success("Module updated");
                fetchModules();
            }
            if (editEntityType === "submodule") {
                await axios.patch(`${URL_API_ALB}subModules`, { id: editEntity.id, name: editEntity.name, groupId: editEntity.groupId, moduleId: editEntity.moduleId, updatedBy: editEntity.createdBy });
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
            const match = (groupOptions || []).find(o => o.label === name);
            return match?.value ?? "";
        }
        return "";
    }, [editEntity?.groupId, editEntity?.groupName, groupOptions]);

    return (
        <DashboardHeader>
            <div className="w-2/3 flex flex-col items-center justify-start h-full gap-6 px-4 py-8">
                <Link href="/home" className="fixed flex self-start items-center gap-2 text-primary/80 hover:text-primary transition">
                    <MdArrowBack className="w-5 h-5" />
                    <span>Back to Home</span>
                </Link>

                <h2 className=" text-2xl font-bold mb-2 text-primary/80 text-center">Create Entities</h2>

                <div className="flex gap-2 justify-center mb-2">
                    <TabButton active={activeTab === "tag"} onClick={() => setActiveTab("tag")}>Tag</TabButton>
                    <TabButton active={activeTab === "group"} onClick={() => setActiveTab("group")}>Group</TabButton>
                    <TabButton active={activeTab === "module"} onClick={() => setActiveTab("module")}>Module</TabButton>
                    <TabButton active={activeTab === "submodule"} onClick={() => setActiveTab("submodule")}>Submodule</TabButton>
                </div>

                {activeTab === "group" && (
                    <div className="w-full flex flex-col gap-4 text-primary/80">
                        <div className="flex flex-col gap-3">
                            <TextInputWithClearButton id="groupName" type="text" inputMode="text" placeholder="Enter Group Name" className="p-2 !bg-primary/20 rounded-md text-primary/90 placeholder:text-primary/60" onChangeHandler={(e: any) => setGroupName(e.target.value)} value={groupName} />
                            <SearchField label="Created By" value={createdByGroup} onChange={setCreatedByGroup} options={userOptions} placeholder={loadingUsers ? "Loading users…" : "Select creator"} />
                        </div>
                        <button disabled={creatingGroup} onClick={createGroupHandler} className="cursor-pointer bg-slate-600 hover:bg-slate-700 disabled:opacity-60 shadow-md text-white py-2 px-4 rounded-md transition-colors">{creatingGroup ? "Saving…" : "Save Group"}</button>

                        {groups.length > 0 ? (
                            <div className="w-full mt-4">
                                <div className="flex items-center justify-between mb-2">
                                    <h4 className="text-md font-semibold text-primary/80">Existing Groups</h4>
                                    <TextInputWithClearButton
                                        id="searchGroup"
                                        type="text"
                                        inputMode="text"
                                        placeholder="Search groups..."
                                        className="p-1 text-sm !bg-white border border-primary/20 rounded-md text-primary/90 placeholder:text-primary/60 "
                                        onChangeHandler={(e: any) => setSearchGroup(e.target.value)}
                                        value={searchGroup}
                                    />
                                </div>
                                <div className="flex flex-col gap-2 max-h-72 overflow-y-auto">
                                    {filteredGroups.length > 0 && filteredGroups.map(g => (
                                        <div key={g.id} className="flex items-center justify-between p-2 border border-primary/20 rounded-md hover:bg-primary/10 transition-colors">
                                            <div className="flex flex-col">
                                                <span className="text-primary/80">{g.name}</span>
                                                <span className="text-xs text-gray-500">{g.id}</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <span className="text-xs mr-2">{g.createdByName}</span>
                                                <span className="text-xs mr-2">{fmtDate(g.createdAt)}</span>
                                                <button onClick={() => openEdit("group", { ...g })} className="text-xs px-2 py-1 rounded bg-primary/20 hover:bg-primary/30">Edit</button>
                                                <button onClick={() => deleteGroup(g.id)} className="text-xs px-2 py-1 rounded bg-red-500/80 text-white hover:bg-red-600">Delete</button>
                                            </div>
                                        </div>
                                    ))}
                                    {filteredGroups.length === 0 && <NoData text="No groups found. Create a new group to get started." />}
                                </div>
                            </div>
                        ):(
                            <NoData text="No groups found. Create a new group to get started." />
                        )}
                    </div>
                )}

                {activeTab === "tag" && (
                    <div className="w-full flex flex-col gap-4 text-primary/80">
                        <div className="flex flex-col gap-3">
                            <TextInputWithClearButton id="tagName" type="text" inputMode="text" placeholder="Enter Tag Name" className="p-2 !bg-primary/20 rounded-md text-primary/90 placeholder:text-primary/60" onChangeHandler={(e: any) => setTagName(e.target.value)} value={tagName} />
                            <SearchField label="Created By" value={createdByTag} onChange={setCreatedByTag} options={userOptions} placeholder={loadingUsers ? "Loading users…" : "Select creator"} />
                        </div>
                        <button disabled={creatingTag} onClick={createTagHandler} className="cursor-pointer bg-primary/80 hover:bg-slate-700 disabled:opacity-60 shadow-md text-white py-2 px-4 rounded-md transition-colors">{creatingTag ? "Saving…" : "Save Tag"}</button>

                        {tags.length > 0 && (
                            <div className="w-full mt-4">
                                <div className="flex items-center justify-between mb-2">
                                    <h4 className="text-md font-semibold text-primary/80">Existing Tags</h4>
                                    <TextInputWithClearButton
                                        id="searchTag"
                                        type="text"
                                        inputMode="text"
                                        placeholder="Search tags..."
                                        className="w-full p-1 text-sm !bg-white border border-primary/20 rounded-md text-primary/90 placeholder:text-primary/60 "
                                        onChangeHandler={(e: any) => setSearchTag(e.target.value)}
                                        value={searchTag}
                                    />
                                </div>
                                <div className="flex flex-col gap-2 max-h-72 overflow-y-auto">
                                    {filteredTags.length > 0 && filteredTags.map(t => (
                                        <div key={t.id} className="flex items-center justify-between p-2 border border-primary/20 rounded-md hover:bg-primary/10 transition-colors">
                                            <div className="flex flex-col">
                                                <span className="text-primary/80">{t.name}</span>
                                                <span className="text-xs text-gray-500">{t.id}</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <span className="text-xs mr-2">{t.createdByName}</span>
                                                <span className="text-xs mr-2">{fmtDate(t.createdAt)}</span>
                                                <button onClick={() => openEdit("tag", { ...t })} className="text-xs px-2 py-1 rounded bg-primary/20 hover:bg-primary/30">Edit</button>
                                                <button onClick={() => deleteTag(t.id)} className="text-xs px-2 py-1 rounded bg-red-500/80 text-white hover:bg-red-600">Delete</button>
                                            </div>
                                        </div>
                                    ))}
                                    {filteredTags.length === 0 && <NoData text="No tags found. Create a new tag to get started." />}
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {activeTab === "module" && (
                    <div className="w-full flex flex-col gap-4 text-primary/80">
                        <div className="flex flex-col gap-3">
                            <TextInputWithClearButton id="moduleName" type="text" inputMode="text" placeholder="Enter Module Name" className="p-2 !bg-primary/20 rounded-md text-primary/90 placeholder:text-primary/60" onChangeHandler={(e: any) => setModuleName(e.target.value)} value={moduleName} />
                            <SearchField label="Select Group" value={selectedGroupForModule} onChange={setSelectedGroupForModule} options={groupOptions} placeholder={loadingGroups ? "Loading groups…" : "Select group"} />
                            <SearchField label="Created By" value={createdByModule} onChange={setCreatedByModule} options={userOptions} placeholder={loadingUsers ? "Loading users…" : "Select creator"} />
                        </div>
                        <button disabled={creatingModule} onClick={createModuleHandler} className="cursor-pointer bg-slate-600 hover:bg-slate-700 disabled:opacity-60 shadow-md text-white py-2 px-4 rounded-md transition-colors">{creatingModule ? "Saving…" : "Save Module"}</button>

                        {modules.length > 0 && (
                            <div className="w-full mt-4">
                                <div className="w-full flex items-center justify-between mb-2">
                                    <h4 className="text-md font-semibold text-primary/80">Existing Modules</h4>
                                    <TextInputWithClearButton
                                        id="searchModule"
                                        type="text"
                                        inputMode="text"
                                        placeholder="Search modules..."
                                        className="w-full p-1 text-sm !bg-white border border-primary/20 rounded-md text-primary/90 placeholder:text-primary/60"
                                        onChangeHandler={(e: any) => setSearchModule(e.target.value)}
                                        value={searchModule}
                                    />
                                </div>
                                <div className="flex flex-col gap-2 max-h-72 overflow-y-auto">
                                    {filteredModules.length >0 && filteredModules.map(m => (
                                        <div key={m.id} className="flex items-center justify-between p-2 border border-primary/20 rounded-md hover:bg-primary/10 transition-colors">
                                            <div className="flex flex-col">
                                                <span className="text-primary/80">{m.name}</span>
                                                <span className="text-xs text-gray-500">{m.id}</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <span className="text-xs mr-2">{m.groupName}</span>
                                                <span className="text-xs mr-2">{m.createdByName}</span>
                                                <span className="text-xs mr-2">{fmtDate(m.createdAt)}</span>
                                                <button onClick={() => openEdit("module", { ...m })} className="text-xs px-2 py-1 rounded bg-primary/20 hover:bg-primary/30">Edit</button>
                                                <button onClick={() => deleteModule(m.id)} className="text-xs px-2 py-1 rounded bg-red-500/80 text-white hover:bg-red-600">Delete</button>
                                            </div>
                                        </div>
                                    ))}
                                    {filteredModules.length === 0 && <NoData text="No modules found. Create a new module to get started." />}
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {activeTab === "submodule" && (
                    <div className="w-full flex flex-col gap-4 text-primary/80">
                        <div className="flex flex-col gap-3">
                            <SearchField label="Select Group" value={selectedGroupForSubmodule} onChange={(v: string) => { setSelectedGroupForSubmodule(v); setParentModule(""); }} options={groupOptions} placeholder={loadingGroups ? "Loading groups…" : "Select group"} />
                            <SearchField label="Select Parent Module" value={parentModule} onChange={setParentModule} options={moduleOptions} placeholder={loadingModules ? "Loading modules…" : "Select module"} />
                            <TextInputWithClearButton id="submoduleName" type="text" inputMode="text" placeholder="Enter Submodule Name" className="p-2 !bg-primary/20 rounded-md text-primary/90 placeholder:text-primary/60" onChangeHandler={(e: any) => setSubmoduleName(e.target.value)} value={submoduleName} />
                            <SearchField label="Created By" value={createdBySubmodule} onChange={setCreatedBySubmodule} options={userOptions} placeholder={loadingUsers ? "Loading users…" : "Select creator"} />
                        </div>
                        <button disabled={creatingSubmodule} onClick={createSubmoduleHandler} className="cursor-pointer bg-slate-600 hover:bg-slate-700 disabled:opacity-60 shadow-md text-white py-2 px-4 rounded-md transition-colors">{creatingSubmodule ? "Saving…" : "Save Submodule"}</button>

                        {submodules.length > 0 && (
                            <div className="w-full mt-4">
                                <div className="flex items-center justify-between mb-2">
                                    <h4 className="text-md font-semibold text-primary/80">Existing Submodules</h4>
                                    <TextInputWithClearButton
                                        id="searchSubmodule"
                                        type="text"
                                        inputMode="text"
                                        placeholder="Search submodules..."
                                        className="p-1 text-sm !bg-white border border-primary/20 rounded-md text-primary/90 placeholder:text-primary/60"
                                        onChangeHandler={(e: any) => setSearchSubmodule(e.target.value)}
                                        value={searchSubmodule}
                                    />
                                </div>
                                <div className="flex flex-col gap-2 max-h-72 overflow-y-auto">
                                    {filteredSubmodules.length  > 0 && filteredSubmodules.map(s => (
                                        <div key={s.id} className="flex items-center justify-between p-2 border border-primary/20 rounded-md hover:bg-primary/10 transition-colors">
                                            <div className="flex flex-col">
                                                <span className="text-primary/80">{s.name}</span>
                                                <span className="text-xs text-gray-500">{s.id}</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <span className="text-xs mr-2">{s.moduleName}</span>
                                                <span className="text-xs mr-2">{s.createdByName}</span>
                                                <span className="text-xs mr-2">{fmtDate(s.createdAt)}</span>
                                                <button onClick={() => openEdit("submodule", { ...s })} className="text-xs px-2 py-1 rounded bg-primary/20 hover:bg-primary/30">Edit</button>
                                                <button onClick={() => deleteSubmodule(s.id)} className="text-xs px-2 py-1 rounded bg-red-500/80 text-white hover:bg-red-600">Delete</button>
                                            </div>
                                        </div>
                                    ))}
                                    {filteredSubmodules.length === 0 && <NoData text="No submodules found. Create a new submodule to get started." />}
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {isEditOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
                        <div className="bg-white rounded-2xl shadow-xl w-full max-w-xl p-6 space-y-4">
                            <div className="flex items-center justify-between">
                                <h4 className="text-lg font-semibold text-primary/80">Edit {editEntityType}</h4>
                                <button onClick={() => setIsEditOpen(false)} className="px-2 py-1 rounded hover:bg-black/5">✕</button>
                            </div>

                            <TextInputWithClearButton className="p-2 !bg-primary/20 rounded-md text-primary/90 placeholder:text-primary/60" id="edit-name" type="text" inputMode="text" placeholder="Name" onChangeHandler={(e: any) => onEditField("name", e.target.value)} value={editEntity?.name || ""} />

                            {editEntityType === "module" && (
                                <SearchField
                                    label="Group"
                                    value={editModuleGroupValue}
                                    onChange={(v: string) => {
                                        onEditField("groupId", v);
                                        const match = (groupOptions || []).find(o => o.value === v);
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
                                        value={(editEntity?.groupId) || ((groupOptions.find(o => o.label === editEntity?.groupName))?.value ?? "")}
                                        onChange={(v: string) => {
                                            onEditField("groupId", v);
                                            const match = (groupOptions || []).find(o => o.value === v);
                                            if (match) onEditField("groupName", match.label);
                                        }}
                                        options={groupOptions}
                                        placeholder={loadingGroups ? "Loading groups…" : "Select group"}
                                    />
                                    <SearchField
                                        label="Parent Module"
                                        value={(editEntity?.moduleId) || ((modules.find(m => m.name === editEntity?.moduleName))?.id ?? "")}
                                        onChange={(v: string) => {
                                            onEditField("moduleId", v);
                                            const match = modules.find(m => m.id === v);
                                            if (match) onEditField("moduleName", match.name);
                                        }}
                                        options={(modules || []).filter(m => !editEntity?.groupId || m.groupId === editEntity.groupId).map(m => ({ label: m.name, value: m.id }))}
                                        placeholder={loadingModules ? "Loading modules…" : "Select module"}
                                    />
                                </div>
                            )}

                            <SearchField label="Created By" value={editEntity?.createdBy || ""} onChange={(v: string) => onEditField("createdBy", v)} options={userOptions} placeholder={loadingUsers ? "Loading users…" : "Select creator"} />

                            <div className="flex justify-end gap-2 pt-2">
                                <button onClick={() => setIsEditOpen(false)} className="px-3 py-2 rounded bg-gray-200 hover:bg-gray-300">Cancel</button>
                                <button onClick={submitEdit} className="px-3 py-2 rounded bg-primary/80 text-white hover:bg-primary">Save</button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </DashboardHeader>
    );
}