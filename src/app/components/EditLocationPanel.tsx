// "use client";
// import React, { useCallback, useEffect, useMemo, useState } from "react";
// import { Button } from "@/components/ui/button";
// import { toast } from "sonner";
// import axios from "axios";
// import { URL_API_ALB } from "@/config";
// import { SearchField } from "./SearchField";
// import { TestCase } from "@/types/TestCase";
// import TextInputWithClearButton from "./InputClear";

// type User = { id: string; name: string };
// type Group = { id: string; name: string };
// type Module = { id: string; name: string; groupId?: string };
// type Submodule = { id: string; name: string; moduleId?: string };

// type Props = {
//     test: TestCase;
//     responseTest: any;
//     setResponseTest: React.Dispatch<React.SetStateAction<any>>;
//     setTestCasesData: React.Dispatch<React.SetStateAction<TestCase[]>>;
//     isDarkMode?: boolean;
//     isLoadingUpdate: boolean;
//     setIsLoadingUpdate: React.Dispatch<React.SetStateAction<boolean>>;
// };

// const EditLocationPanel: React.FC<Props> = ({
//     test,
//     responseTest,
//     setResponseTest,
//     setTestCasesData,
//     isDarkMode = false,
//     isLoadingUpdate,
//     setIsLoadingUpdate,
// }) => {
//     const [users, setUsers] = useState<User[]>([]);
//     const [loadingUsers, setLoadingUsers] = useState(false);

//     const [groups, setGroups] = useState<Group[]>([]);
//     const [loadingGroups, setLoadingGroups] = useState(false);
//     const [errorGroups, setErrorGroups] = useState<string | null>(null);

//     const [modules, setModules] = useState<Module[]>([]);
//     const [loadingModules, setLoadingModules] = useState(false);
//     const [errorModules, setErrorModules] = useState<string | null>(null);

//     const [submodules, setSubmodules] = useState<Submodule[]>([]);
//     const [loadingSubmodules, setLoadingSubmodules] = useState(false);

//     const [selectedGroup, setSelectedGroup] = useState<string>("");
//     const [selectedModule, setSelectedModule] = useState<string>("");
//     const [selectedSubmodule, setSelectedSubmodule] = useState<string>("");
//     const [selectedUpdater, setSelectedUpdater] = useState<string>(responseTest?.createdBy);

//     const [name, setName] = useState<string>("");
//     const [nameTouched, setNameTouched] = useState(false);

//     const [seedGroupDone, setSeedGroupDone] = useState(false);
//     const [seedModuleDone, setSeedModuleDone] = useState(false);
//     const [seedSubDone, setSeedSubDone] = useState(false);
//     const [seedUpdaterDone, setSeedUpdaterDone] = useState(false);

//     const fetchUsers = useCallback(async () => {
//         try {
//             setLoadingUsers(true);
//             const res = await axios.post(`${URL_API_ALB}users`, {});
//             setUsers(Array.isArray(res.data) ? (res.data as User[]) : []);
//         } catch (err) {
//             console.error("Error fetching users:", err);
//             toast.error("Error fetching users");
//         } finally {
//             setLoadingUsers(false);
//         }
//     }, []);

//     const fetchGroups = useCallback(async () => {
//         try {
//             setErrorGroups(null);
//             setLoadingGroups(true);
//             const res = await axios.post(`${URL_API_ALB}groups`, {});
//             setGroups(Array.isArray(res.data) ? (res.data as Group[]) : []);
//         } catch (err: any) {
//             console.error("Error fetching groups:", err);
//             setErrorGroups("ERR");
//             toast.error("Error fetching groups");
//         } finally {
//             setLoadingGroups(false);
//         }
//     }, []);

//     const fetchModules = useCallback(async (groupId?: string) => {
//         try {
//             setErrorModules(null);
//             setLoadingModules(true);
//             const payload = groupId ? { groupId } : {};
//             const res = await axios.post(`${URL_API_ALB}modules`, payload);
//             setModules(Array.isArray(res.data) ? (res.data as Module[]) : []);
//         } catch (err: any) {
//             console.error("Error fetching modules:", err);
//             setErrorModules("ERR");
//             toast.error("Error fetching modules");
//         } finally {
//             setLoadingModules(false);
//         }
//     }, []);

//     const getSelectedGroupId = useCallback(() => {
//         if (!selectedGroup) return "";
//         const group: any = groups.find((group: any) => group.name === selectedGroup);
//         return group ? group.id : selectedGroup;
//     }, [selectedGroup, groups]);

//     const getSelectedModuleId = useCallback(() => {
//         if (!selectedModule) return "";
//         const module: any = modules.find((module: any) => module.name === selectedModule);
//         return module ? module.id : selectedModule;
//     }, [selectedModule, modules]);

//     const fetchSubmodules = useCallback(async () => {
//         try {
//             setLoadingSubmodules(true);
//             const res = await axios.post(`${URL_API_ALB}subModules`, {
//                 moduleId: selectedModule || getSelectedModuleId(),
//                 groupId: selectedGroup || getSelectedGroupId(),
//             });
//             setSubmodules(Array.isArray(res.data) ? (res.data as Submodule[]) : []);
//         } catch (err) {
//             console.error("Error fetching submodules:", err);
//             toast.error("Error fetching submodules");
//         } finally {
//             setLoadingSubmodules(false);
//         }
//     }, []);

//     useEffect(() => {
//         fetchUsers();
//         fetchGroups();
//         fetchModules();
//         fetchSubmodules();
//     }, [fetchUsers, fetchGroups, fetchModules, fetchSubmodules]);

//     const userOptions = useMemo(
//         () => (users || []).map(u => ({ label: u.name, value: u.id })),
//         [users]
//     );
//     const groupOptions = useMemo(
//         () => (groups || []).map(g => ({ label: g.name, value: g.id })),
//         [groups]
//     );
//     const moduleOptions = useMemo(() => {
//         const list = modules || [];
//         const filtered = selectedGroup ? list.filter(m => !m.groupId || m.groupId === selectedGroup) : list;
//         return filtered.map(m => ({ label: m.name, value: m.id }));
//     }, [modules, selectedGroup]);
//     const submoduleOptions = useMemo(() => {
//         const list = submodules || [];
//         const filtered = selectedModule ? list.filter(s => !s.moduleId || s.moduleId === selectedModule) : list;
//         return filtered.map(s => ({ label: s.name, value: s.id }));
//     }, [submodules, selectedModule]);

//     useEffect(() => {
//         const initialName = responseTest?.name || test?.testCaseName || test?.name || "";
//         if (!nameTouched) setName(initialName);
//     }, [responseTest?.name, test?.testCaseName, test?.name, nameTouched]);

//     useEffect(() => {
//         if (seedUpdaterDone) return;
//         if (!users || users.length === 0) return;

//         const byId = (responseTest?.updatedBy as string) || "";
//         if (byId && users.some(u => u.id === byId)) {
//             setSelectedUpdater(byId);
//             setSeedUpdaterDone(true);
//             return;
//         }

//         const byName = (responseTest?.updatedByName as string) || "";
//         if (byName) {
//             const match = users.find(u => u.name === byName);
//             if (match) setSelectedUpdater(match.id);
//         }
//         setSeedUpdaterDone(true);
//     }, [users, responseTest?.updatedBy, responseTest?.updatedByName, seedUpdaterDone]);

//     useEffect(() => {
//         if (!responseTest || seedGroupDone) return;
//         if (!groups || groups.length === 0) return;

//         const gId = (responseTest.groupId as string) ||
//             groups.find(x => x.name?.trim() === responseTest.groupName?.trim())?.id ||
//             "";

//         if (gId && gId !== selectedGroup) {
//             setSelectedGroup(gId);
//             setSelectedModule("");
//             setSelectedSubmodule("");
//         }
//         setSeedGroupDone(true);
//     }, [responseTest, groups, selectedGroup, seedGroupDone]);

//     useEffect(() => {
//         if (!responseTest || seedModuleDone || !seedGroupDone) return;
//         if (!modules || modules.length === 0) return;

//         const mId = (responseTest.moduleId as string) ||
//             modules
//                 .filter(m => !selectedGroup || !m.groupId || m.groupId === selectedGroup)
//                 .find(x => x.name?.trim() === responseTest.moduleName?.trim())?.id ||
//             "";

//         if (mId && mId !== selectedModule) {
//             setSelectedModule(mId);
//             setSelectedSubmodule("");
//         }
//         setSeedModuleDone(true);
//     }, [responseTest, modules, selectedGroup, selectedModule, seedGroupDone, seedModuleDone]);

//     useEffect(() => {
//         if (!responseTest || seedSubDone || !seedModuleDone) return;
//         if (!submodules || submodules.length === 0) return;

//         const sId = (responseTest.subModuleId as string) ||
//             submodules
//                 .filter(s => !selectedModule || !s.moduleId || s.moduleId === selectedModule)
//                 .find(x => x.name?.trim() === responseTest.subModuleName?.trim())?.id ||
//             "";

//         if (sId && sId !== selectedSubmodule) {
//             setSelectedSubmodule(sId);
//         }
//         setSeedSubDone(true);
//     }, [responseTest, submodules, selectedModule, selectedSubmodule, seedModuleDone, seedSubDone]);

//     useEffect(() => {
//         if (!selectedGroup) return;
//         fetchModules(selectedGroup);
//     }, [selectedGroup, fetchModules]);

//     const buildLocationUpdatePayload = useCallback(() => {
//         const updater =
//             selectedUpdater ||
//             (responseTest?.updatedBy as string) ||
//             "";

//         return {
//             id: test.id,
//             name: name?.trim() || responseTest?.name || test.testCaseName || test.name,
//             tagIds: responseTest?.tagIds || test.tagIds || [],
//             groupId: selectedGroup || "",
//             moduleId: selectedModule || "",
//             subModuleId: selectedSubmodule || "",
//             updatedBy: updater,
//         };
//     }, [
//         test.id,
//         name,
//         responseTest?.name,
//         responseTest?.tagIds,
//         responseTest?.updatedBy,
//         test.testCaseName,
//         test.name,
//         test.tagIds,
//         selectedGroup,
//         selectedModule,
//         selectedSubmodule,
//         selectedUpdater,
//     ]);

//     const handleUpdateLocation = useCallback(async () => {
//         if (!test.id) {
//             toast.error("No test ID available");
//             return;
//         }

//         const payload = buildLocationUpdatePayload();

//         if (!payload.groupId || !payload.moduleId || !payload.subModuleId) {
//             toast.error("Please select group, module and submodule");
//             return;
//         }

//         try {
//             setIsLoadingUpdate(true);

//             const res = await axios.post(`${URL_API_ALB}tests`, payload);
//             if (res.data?.error) throw new Error(res.data.error);

//             const group = groups.find(g => g.id === payload.groupId);
//             const module = modules.find(m => m.id === payload.moduleId);
//             const submodule = submodules.find(s => s.id === payload.subModuleId);
//             const updater = users.find(u => u.id === payload.updatedBy);

//             setResponseTest((prev: any) =>
//                 prev
//                     ? {
//                         ...prev,
//                         name: payload.name,
//                         groupId: payload.groupId,
//                         moduleId: payload.moduleId,
//                         subModuleId: payload.subModuleId,
//                         groupName: group?.name ?? prev.groupName,
//                         moduleName: module?.name ?? prev.moduleName,
//                         subModuleName: submodule?.name ?? prev.subModuleName,
//                         updatedBy: updater?.name,
//                         updatedByName: updater?.name ?? prev.updatedByName,
//                     }
//                     : prev
//             );

//             setTestCasesData(prev =>
//                 prev.map(tc =>
//                     tc.id === test.id
//                         ? {
//                             ...tc,
//                             name: payload.name,
//                             testCaseName: payload.name,
//                             groupName: group?.name ?? tc.groupName,
//                             moduleName: module?.name ?? tc.moduleName,
//                             subModuleName: submodule?.name ?? tc.subModuleName,
//                             updatedBy: payload.updatedBy,
//                             updatedByName: updater?.name ?? (tc as any).updatedByName,
//                         }
//                         : tc
//                 )
//             );

//             toast.success("Test location updated successfully");
//         } catch (error: any) {
//             console.error("Error updating test location:", error);
//             toast.error(error.message || "Failed to update test location");
//         } finally {
//             setIsLoadingUpdate(false);
//         }
//     }, [
//         test.id,
//         buildLocationUpdatePayload,
//         groups,
//         modules,
//         submodules,
//         users,
//         setResponseTest,
//         setTestCasesData,
//         setIsLoadingUpdate,
//     ]);

//     return (
//         <div className="w-full p-1 min-h-[580px] flex flex-col gap-3">

//             <TextInputWithClearButton
//                 id="name"
//                 label="Name"
//                 placeholder="Enter test name"
//                 value={name}
//                 onChangeHandler={e => {
//                     setNameTouched(true);
//                     setName(e.target.value);
//                 }
//                 }
//             />

//             <div className="z-60">
//                 <SearchField
//                     label="Updated By"
//                     value={selectedUpdater}
//                     onChange={(v: string) => setSelectedUpdater(v)}
//                     options={userOptions}
//                     placeholder={loadingUsers ? "Loading users…" : "Select user"}
//                 />
//             </div>


//             <div className="z-50">
//                 <SearchField
//                     label="Group"
//                     value={selectedGroup || ""}
//                     onChange={(groupId: string) => {
//                         setSelectedGroup(groupId);
//                         setSelectedModule("");
//                         setSelectedSubmodule("");
//                         setSeedGroupDone(true);
//                         setSeedModuleDone(false);
//                         setSeedSubDone(false);
//                     }}
//                     placeholder="Select group"
//                     className="w-full"
//                     disabled={loadingGroups || !!errorGroups}
//                     options={groupOptions}
//                 />
//             </div>


//             <div className="z-40">
//                 <SearchField
//                     label="Module"
//                     value={selectedModule || ""}
//                     onChange={(moduleId: string) => {
//                         setSelectedModule(moduleId);
//                         setSelectedSubmodule("");
//                         setSeedModuleDone(true);
//                         setSeedSubDone(false);
//                     }}
//                     placeholder="Select module"
//                     className="w-full"
//                     disabled={!selectedGroup || loadingModules || !!errorModules}
//                     options={moduleOptions}
//                 />
//             </div>


//             <div className="z-30">
//                 <SearchField
//                     label="Submodule"
//                     value={selectedSubmodule || ""}
//                     onChange={(subId: string) => {
//                         setSelectedSubmodule(subId);
//                         setSeedSubDone(true);
//                     }}
//                     placeholder="Select submodule"
//                     className="w-full"
//                     disabled={!selectedModule || loadingSubmodules}
//                     options={submoduleOptions}
//                 />
//             </div>

//             <button className="self-center text-white text-[16px] bg-primary/80 px-3 py-2 rounded-md w-1/2 justify-center"
//                 onClick={handleUpdateLocation}
//                 disabled={
//                     isLoadingUpdate || !selectedGroup || !selectedModule || !selectedSubmodule
//                 }
//             >
//                 {isLoadingUpdate ? "Updating..." : "Update Location"}
//             </button>

//         </div>
//     );
// };

// export default EditLocationPanel;


"use client";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import axios from "axios";
import { URL_API_ALB } from "@/config";
import { SearchField } from "./SearchField";
import { TestCase } from "@/types/TestCase";
import TextInputWithClearButton from "./InputClear";

type User = { id: string; name: string };
type Group = { id: string; name: string };
type Module = { id: string; name: string; groupId?: string };
type Submodule = { id: string; name: string; moduleId?: string; groupId?: string };

type Props = {
  test: TestCase;
  responseTest: any;
  setResponseTest: React.Dispatch<React.SetStateAction<any>>;
  setTestCasesData: React.Dispatch<React.SetStateAction<TestCase[]>>;
  isDarkMode?: boolean;
  isLoadingUpdate: boolean;
  setIsLoadingUpdate: React.Dispatch<React.SetStateAction<boolean>>;
};

const EditLocationPanel: React.FC<Props> = ({
  test,
  responseTest,
  setResponseTest,
  setTestCasesData,
  isDarkMode = false,
  isLoadingUpdate,
  setIsLoadingUpdate,
}) => {
  const [users, setUsers] = useState<User[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);

  const [groups, setGroups] = useState<Group[]>([]);
  const [loadingGroups, setLoadingGroups] = useState(false);
  const [errorGroups, setErrorGroups] = useState<string | null>(null);

  const [modules, setModules] = useState<Module[]>([]);
  const [loadingModules, setLoadingModules] = useState(false);
  const [errorModules, setErrorModules] = useState<string | null>(null);

  const [submodules, setSubmodules] = useState<Submodule[]>([]);
  const [loadingSubmodules, setLoadingSubmodules] = useState(false);

  const [selectedGroup, setSelectedGroup] = useState<string>("");
  const [selectedModule, setSelectedModule] = useState<string>("");
  const [selectedSubmodule, setSelectedSubmodule] = useState<string>("");
  const [selectedUpdater, setSelectedUpdater] = useState<string>(responseTest?.createdBy);

  const [name, setName] = useState<string>("");
  const [nameTouched, setNameTouched] = useState(false);

  const [seedGroupDone, setSeedGroupDone] = useState(false);
  const [seedModuleDone, setSeedModuleDone] = useState(false);
  const [seedSubDone, setSeedSubDone] = useState(false);
  const [seedUpdaterDone, setSeedUpdaterDone] = useState(false);

  const fetchUsers = useCallback(async () => {
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
  }, []);

  const fetchGroups = useCallback(async () => {
    try {
      setErrorGroups(null);
      setLoadingGroups(true);
      const res = await axios.post(`${URL_API_ALB}groups`, {});
      setGroups(Array.isArray(res.data) ? (res.data as Group[]) : []);
    } catch (err: any) {
      console.error("Error fetching groups:", err);
      setErrorGroups("ERR");
      toast.error("Error fetching groups");
    } finally {
      setLoadingGroups(false);
    }
  }, []);

  const fetchModules = useCallback(async (groupId?: string) => {
    try {
      setErrorModules(null);
      setLoadingModules(true);
      const payload = groupId ? { groupId } : {};
      const res = await axios.post(`${URL_API_ALB}modules`, payload);
      setModules(Array.isArray(res.data) ? (res.data as Module[]) : []);
    } catch (err: any) {
      console.error("Error fetching modules:", err);
      setErrorModules("ERR");
      toast.error("Error fetching modules");
    } finally {
      setLoadingModules(false);
    }
  }, []);

  const fetchSubmodules = useCallback(async (groupId?: string, moduleId?: string) => {
    try {
      setLoadingSubmodules(true);
      const payload: any = {};
      if (groupId) payload.groupId = groupId;
      if (moduleId) payload.moduleId = moduleId;
      const res = await axios.post(`${URL_API_ALB}subModules`, payload);
      setSubmodules(Array.isArray(res.data) ? (res.data as Submodule[]) : []);
    } catch (err) {
      console.error("Error fetching submodules:", err);
      toast.error("Error fetching submodules");
    } finally {
      setLoadingSubmodules(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
    fetchGroups();
    fetchModules();
    fetchSubmodules();
  }, [fetchUsers, fetchGroups, fetchModules, fetchSubmodules]);

  const userOptions = useMemo(
    () => (users || []).map(u => ({ label: u.name, value: u.id })),
    [users]
  );
  const groupOptions = useMemo(
    () => (groups || []).map(g => ({ label: g.name, value: g.id })),
    [groups]
  );
  const moduleOptions = useMemo(() => {
    const list = modules || [];
    const filtered = selectedGroup ? list.filter(m => !m.groupId || m.groupId === selectedGroup) : list;
    return filtered.map(m => ({ label: m.name, value: m.id }));
  }, [modules, selectedGroup]);
  const submoduleOptions = useMemo(() => {
    const list = submodules || [];
    const filtered = selectedModule ? list.filter(s => !s.moduleId || s.moduleId === selectedModule) : list;
    return filtered.map(s => ({ label: s.name, value: s.id }));
  }, [submodules, selectedModule]);

  useEffect(() => {
    const initialName = responseTest?.name || test?.testCaseName || test?.name || "";
    if (!nameTouched) setName(initialName);
  }, [responseTest?.name, test?.testCaseName, test?.name, nameTouched]);

  useEffect(() => {
    if (seedUpdaterDone) return;
    if (!users || users.length === 0) return;
    const byId = (responseTest?.updatedBy as string) || "";
    if (byId && users.some(u => u.id === byId)) {
      setSelectedUpdater(byId);
      setSeedUpdaterDone(true);
      return;
    }
    const byName = (responseTest?.updatedByName as string) || "";
    if (byName) {
      const match = users.find(u => u.name === byName);
      if (match) setSelectedUpdater(match.id);
    }
    setSeedUpdaterDone(true);
  }, [users, responseTest?.updatedBy, responseTest?.updatedByName, seedUpdaterDone]);

  useEffect(() => {
    if (!responseTest || seedGroupDone) return;
    if (!groups || groups.length === 0) return;
    const gId =
      (responseTest.groupId as string) ||
      groups.find(x => x.name?.trim() === responseTest.groupName?.trim())?.id ||
      "";
    if (gId && gId !== selectedGroup) {
      setSelectedGroup(gId);
      setSelectedModule("");
      setSelectedSubmodule("");
    }
    setSeedGroupDone(true);
  }, [responseTest, groups, selectedGroup, seedGroupDone]);

  useEffect(() => {
    if (!responseTest || seedModuleDone || !seedGroupDone) return;
    if (!modules || modules.length === 0) return;
    const mId =
      (responseTest.moduleId as string) ||
      modules
        .filter(m => !selectedGroup || !m.groupId || m.groupId === selectedGroup)
        .find(x => x.name?.trim() === responseTest.moduleName?.trim())?.id ||
      "";
    if (mId && mId !== selectedModule) {
      setSelectedModule(mId);
      setSelectedSubmodule("");
    }
    setSeedModuleDone(true);
  }, [responseTest, modules, selectedGroup, selectedModule, seedGroupDone, seedModuleDone]);

  useEffect(() => {
    if (!responseTest || seedSubDone || !seedModuleDone) return;
    if (!submodules || submodules.length === 0) return;
    const sId =
      (responseTest.subModuleId as string) ||
      submodules
        .filter(s => !selectedModule || !s.moduleId || s.moduleId === selectedModule)
        .find(x => x.name?.trim() === responseTest.subModuleName?.trim())?.id ||
      "";
    if (sId && sId !== selectedSubmodule) {
      setSelectedSubmodule(sId);
    }
    setSeedSubDone(true);
  }, [responseTest, submodules, selectedModule, selectedSubmodule, seedModuleDone, seedSubDone]);

  useEffect(() => {
    if (!selectedGroup) return;
    fetchModules(selectedGroup);
    fetchSubmodules(selectedGroup, selectedModule || undefined);
  }, [selectedGroup, selectedModule, fetchModules, fetchSubmodules]);

  useEffect(() => {
    if (!selectedGroup || !selectedModule) return;
    fetchSubmodules(selectedGroup, selectedModule);
  }, [selectedGroup, selectedModule, fetchSubmodules]);

  const buildLocationUpdatePayload = useCallback(() => {
    const updater = selectedUpdater || (responseTest?.updatedBy as string) || "";
    return {
      id: test.id,
      name: name?.trim() || responseTest?.name || test.testCaseName || test.name,
      tagIds: responseTest?.tagIds || test.tagIds || [],
      groupId: selectedGroup || "",
      moduleId: selectedModule || "",
      subModuleId: selectedSubmodule || "",
      updatedBy: updater,
    };
  }, [
    test.id,
    name,
    responseTest?.name,
    responseTest?.tagIds,
    responseTest?.updatedBy,
    test.testCaseName,
    test.name,
    test.tagIds,
    selectedGroup,
    selectedModule,
    selectedSubmodule,
    selectedUpdater,
  ]);

  const handleUpdateLocation = useCallback(async () => {
    if (!test.id) {
      toast.error("No test ID available");
      return;
    }
    const payload = buildLocationUpdatePayload();
    if (!payload.groupId || !payload.moduleId || !payload.subModuleId) {
      toast.error("Please select group, module and submodule");
      return;
    }
    try {
      setIsLoadingUpdate(true);
      const res = await axios.post(`${URL_API_ALB}tests`, payload);
      if (res.data?.error) throw new Error(res.data.error);
      const group = groups.find(g => g.id === payload.groupId);
      const module = modules.find(m => m.id === payload.moduleId);
      const submodule = submodules.find(s => s.id === payload.subModuleId);
      const updater = users.find(u => u.id === payload.updatedBy);
      setResponseTest((prev: any) =>
        prev
          ? {
              ...prev,
              name: payload.name,
              groupId: payload.groupId,
              moduleId: payload.moduleId,
              subModuleId: payload.subModuleId,
              groupName: group?.name ?? prev.groupName,
              moduleName: module?.name ?? prev.moduleName,
              subModuleName: submodule?.name ?? prev.subModuleName,
              updatedBy: payload.updatedBy,
              updatedByName: updater?.name ?? prev.updatedByName,
            }
          : prev
      );
      setTestCasesData(prev =>
        prev.map(tc =>
          tc.id === test.id
            ? {
                ...tc,
                name: payload.name,
                testCaseName: payload.name,
                groupName: group?.name ?? tc.groupName,
                moduleName: module?.name ?? tc.moduleName,
                subModuleName: submodule?.name ?? tc.subModuleName,
                updatedBy: payload.updatedBy,
                updatedByName: updater?.name ?? (tc as any).updatedByName,
              }
            : tc
        )
      );
      toast.success("Test location updated successfully");
    } catch (error: any) {
      console.error("Error updating test location:", error);
      toast.error(error.message || "Failed to update test location");
    } finally {
      setIsLoadingUpdate(false);
    }
  }, [
    test.id,
    buildLocationUpdatePayload,
    groups,
    modules,
    submodules,
    users,
    setResponseTest,
    setTestCasesData,
    setIsLoadingUpdate,
  ]);

  return (
    <div className="w-full p-2 min-h-[580px] flex flex-col gap-3">
      <TextInputWithClearButton
        id="name"
        label="Name"
        placeholder="Enter test name"
        value={name}
        onChangeHandler={e => {
          setNameTouched(true);
          setName(e.target.value);
        }}
      />

      <div className="z-60">
        <SearchField
          label="Updated By"
          value={selectedUpdater}
          onChange={(v: string) => setSelectedUpdater(v)}
          options={userOptions}
          placeholder={loadingUsers ? "Loading users…" : "Select user"}
        />
      </div>

      <div className="z-50">
        <SearchField
          label="Group"
          value={selectedGroup || ""}
          onChange={(groupId: string) => {
            setSelectedGroup(groupId);
            setSelectedModule("");
            setSelectedSubmodule("");
            setSeedGroupDone(true);
            setSeedModuleDone(false);
            setSeedSubDone(false);
          }}
          placeholder="Select group"
          className="w-full"
          disabled={loadingGroups || !!errorGroups}
          options={groupOptions}
        />
      </div>

      <div className="z-40">
        <SearchField
          label="Module"
          value={selectedModule || ""}
          onChange={(moduleId: string) => {
            setSelectedModule(moduleId);
            setSelectedSubmodule("");
            setSeedModuleDone(true);
            setSeedSubDone(false);
          }}
          placeholder="Select module"
          className="w-full"
          disabled={!selectedGroup || loadingModules || !!errorModules}
          options={moduleOptions}
        />
      </div>

      <div className="z-30">
        <SearchField
          label="Submodule"
          value={selectedSubmodule || ""}
          onChange={(subId: string) => {
            setSelectedSubmodule(subId);
            setSeedSubDone(true);
          }}
          placeholder="Select submodule"
          className="w-full"
          disabled={!selectedModule || loadingSubmodules}
          options={submoduleOptions}
        />
      </div>

      <button
        className="self-center text-white text-[16px] bg-primary/80 px-3 py-2 rounded-md w-1/2 justify-center"
        onClick={handleUpdateLocation}
        disabled={isLoadingUpdate || !selectedGroup || !selectedModule || !selectedSubmodule}
      >
        {isLoadingUpdate ? "Updating..." : "Update Location"}
      </button>
    </div>
  );
};

export default EditLocationPanel;
