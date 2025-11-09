import { useCallback, useEffect, useMemo, useState } from "react";
import axios from "axios";
import { URL_API_ALB } from "@/config";
import { toast } from "sonner";

type Header = { id: string; name?: string; tagNames?: string[] };

export function useSuiteSearchModal(openAddModal: boolean) {
  const [tags, setTags] = useState<any[]>([]);
  const [groups, setGroups] = useState<any[]>([]);
  const [modules, setModules] = useState<any[]>([]);
  const [submodules, setSubmodules] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);

  const [selectedTag, setSelectedTag] = useState("");
  const [selectedGroup, setSelectedGroup] = useState("");
  const [selectedModule, setSelectedModule] = useState("");
  const [selectedSubmodule, setSelectedSubmodule] = useState("");
  const [selectedCreatedBy, setSelectedCreatedBy] = useState("");

  const [searchTestCaseName, setSearchTestCaseName] = useState("");
  const [searchTestCaseId, setSearchTestCaseId] = useState("");

  const [isLoadingTags, setIsLoadingTags] = useState(false);
  const [isLoadingGroups, setIsLoadingGroups] = useState(false);
  const [isLoadingModules, setIsLoadingModules] = useState(false);
  const [isLoadingSubmodules, setIsLoadingSubmodules] = useState(false);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [isSearchingTC, setIsSearchingTC] = useState(false);

  const [searchResults, setSearchResults] = useState<Header[]>([]);
  const [selectedCaseIdsForAdd, setSelectedCaseIdsForAdd] = useState<string[]>([]);

  const getSelectedTagId = useCallback(() => {
    if (!selectedTag) return "";
    const tag = tags.find((t: any) => t.name === selectedTag);
    return tag ? tag.id : selectedTag;
  }, [selectedTag, tags]);

  const getSelectedGroupId = useCallback(() => {
    if (!selectedGroup) return "";
    const group = groups.find((g: any) => g.name === selectedGroup);
    return group ? group.id : selectedGroup;
  }, [selectedGroup, groups]);

  const getSelectedModuleId = useCallback(() => {
    if (!selectedModule) return "";
    const mod = modules.find((m: any) => m.name === selectedModule);
    return mod ? mod.id : selectedModule;
  }, [selectedModule, modules]);

  const getSelectedSubmoduleId = useCallback(() => {
    if (!selectedSubmodule) return "";
    const sub = submodules.find((s: any) => s.name === selectedSubmodule);
    return sub ? sub.id : selectedSubmodule;
  }, [selectedSubmodule, submodules]);

  const getUserIdByName = useCallback((name: string) => {
    const user = users.find((u: any) => u.name === name);
    return user ? user.id : null;
  }, [users]);

  const userOptions = useMemo(
    () => (users || []).map((u: any) => ({ label: u.name, value: u.name })),
    [users]
  );

  useEffect(() => {
    if (!openAddModal) return;
    (async () => {
      try {
        setIsLoadingTags(true);
        const tagsRes = await axios.post(`${URL_API_ALB}tags`, {});
        setTags(Array.isArray(tagsRes.data) ? tagsRes.data : []);
      } catch { setTags([]); } finally { setIsLoadingTags(false); }

      try {
        setLoadingUsers(true);
        const usersRes = await axios.post(`${URL_API_ALB}users`, {});
        setUsers(Array.isArray(usersRes.data) ? usersRes.data : []);
      } catch { setUsers([]); } finally { setLoadingUsers(false); }
    })();
  }, [openAddModal]);

  useEffect(() => {
    if (!openAddModal) return;
    (async () => {
      try {
        setIsLoadingGroups(true);
        await axios.post(`${URL_API_ALB}groups`, {});
        const res = await axios.post(`${URL_API_ALB}groups`, {});
        setGroups(Array.isArray(res.data) ? res.data : []);
      } catch { setGroups([]); } finally { setIsLoadingGroups(false); }
    })();
  }, [openAddModal, selectedTag, getSelectedTagId]);

  useEffect(() => {
    if (!openAddModal) return;
    (async () => {
      if (!selectedGroup) { setModules([]); setSelectedModule(""); setSubmodules([]); setSelectedSubmodule(""); return; }
      try {
        setIsLoadingModules(true);
        const groupId = getSelectedGroupId();
        const res = await axios.post(`${URL_API_ALB}modules`, { groupId });
        setModules(Array.isArray(res.data) ? res.data : []);
      } catch { setModules([]); } finally { setIsLoadingModules(false); }
    })();
  }, [openAddModal, selectedGroup, getSelectedGroupId]);

  useEffect(() => {
    if (!openAddModal) return;
    (async () => {
      if (!selectedGroup || !selectedModule) { setSubmodules([]); setSelectedSubmodule(""); return; }
      try {
        setIsLoadingSubmodules(true);
        const groupId = getSelectedGroupId();
        const moduleId = getSelectedModuleId();
        const res = await axios.post(`${URL_API_ALB}subModules`, { groupId, moduleId });
        setSubmodules(Array.isArray(res.data) ? res.data : []);
      } catch { setSubmodules([]); } finally { setIsLoadingSubmodules(false); }
    })();
  }, [openAddModal, selectedGroup, selectedModule, getSelectedGroupId, getSelectedModuleId]);

  // buscar
  const handleSearchModal = useCallback(async () => {
    try {
      setIsSearchingTC(true);
      const params: Record<string, any> = {};
      const tagId = getSelectedTagId();
      const groupId = getSelectedGroupId();
      const moduleId = getSelectedModuleId();
      const submoduleId = getSelectedSubmoduleId();

      if (searchTestCaseId) params.id = searchTestCaseId;
      if (tagId) params.tagIds = [tagId];
      if (groupId) params.groupId = groupId;
      if (moduleId) params.moduleId = moduleId;
      if (submoduleId) params.subModuleId = submoduleId;
      if (searchTestCaseName) params.partialName = searchTestCaseName;
      if (selectedCreatedBy) params.createdBy = getUserIdByName(selectedCreatedBy);

      const response = await axios.post(`${URL_API_ALB}getTestHeaders`, params);

      if (response?.data?.responseSignedUrl) {
        const url = response.data.responseSignedUrl as string;
        const res = await fetch(url, { method: "GET" });
        const ct = res.headers.get("content-type") || "";
        const jsonData = ct.includes("application/json") ? await res.json() : JSON.parse((await res.text()) || "null");
        setSearchResults(Array.isArray(jsonData) ? jsonData : []);
      } else {
        setSearchResults(Array.isArray(response.data) ? response.data : []);
      }
    } catch {
      toast.error("Error fetching test cases");
      setSearchResults([]);
    } finally {
      setIsSearchingTC(false);
    }
  }, [
    searchTestCaseId, searchTestCaseName, selectedCreatedBy,
    getSelectedTagId, getSelectedGroupId, getSelectedModuleId, getSelectedSubmoduleId, getUserIdByName
  ]);

  const toggleSelectResult = useCallback((id: string) => {
    setSelectedCaseIdsForAdd(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  }, []);

  return {
    tags, groups, modules, submodules, users,
    selectedTag, setSelectedTag,
    selectedGroup, setSelectedGroup,
    selectedModule, setSelectedModule,
    selectedSubmodule, setSelectedSubmodule,
    selectedCreatedBy, setSelectedCreatedBy,
    isLoadingTags, isLoadingGroups, isLoadingModules, isLoadingSubmodules, loadingUsers,

    searchTestCaseName, setSearchTestCaseName,
    searchTestCaseId, setSearchTestCaseId,
    isSearchingTC, handleSearchModal,
    searchResults,
    selectedCaseIdsForAdd, setSelectedCaseIdsForAdd,
    toggleSelectResult,
    userOptions,
  };
}
