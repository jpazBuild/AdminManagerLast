"use client";

import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import axios from "axios";
import { toast } from "sonner";
import { URL_API_ALB } from "@/config";
import { checkConnection } from "@/utils/DBBUtils";

export const useTestLocationInformation = () => {
    const [tags, setTags] = useState<any[]>([]);
    const [groups, setGroups] = useState<any[]>([]);
    const [modules, setModules] = useState<any[]>([]);
    const [submodules, setSubmodules] = useState<any[]>([]);

    const [selectedTag, setSelectedTag] = useState<string>("");
    const [selectedGroup, setSelectedGroup] = useState<string>("");
    const [selectedModule, setSelectedModule] = useState<string>("");
    const [selectedSubmodule, setSelectedSubmodule] = useState<string>("");

    const [isLoadingTags, setIsLoadingTags] = useState(false);
    const [isLoadingGroups, setIsLoadingGroups] = useState(false);
    const [isLoadingModules, setIsLoadingModules] = useState(false);
    const [isLoadingSubmodules, setIsLoadingSubmodules] = useState(false);
    const [errorGroups, setErrorGroups] = useState(false);
    const [errorModules, setErrorModules] = useState(false);

    const mountedRef = useRef(true);
    useEffect(() => () => { mountedRef.current = false; }, []);
    const safeSet = (setter: any) => (v: any) => { if (mountedRef.current) setter(v); };

    const getSelectedTagId = useCallback(() => {
        if (!selectedTag) return "";
        const tag: any = tags.find((t: any) => t.name === selectedTag);
        return tag ? tag.id : selectedTag;
    }, [selectedTag, tags]);

    const getSelectedGroupId = useCallback(() => {
        if (!selectedGroup) return "";
        const group: any = groups.find((g: any) => g.name === selectedGroup);
        return group ? group.id : selectedGroup;
    }, [selectedGroup, groups]);

    const getSelectedModuleId = useCallback(() => {
        if (!selectedModule) return "";
        const mod: any = modules.find((m: any) => m.name === selectedModule);
        return mod ? mod.id : selectedModule;
    }, [selectedModule, modules]);

    const getSelectedSubmoduleId = useCallback(() => {
        if (!selectedSubmodule) return "";
        const sub: any = submodules.find((s: any) => s.name === selectedSubmodule);
        return sub ? sub.id : selectedSubmodule;
    }, [selectedSubmodule, submodules]);

    // fetchers
    const fetchTags = useCallback(async () => {
        try {
            safeSet(setIsLoadingTags)(true);
            await checkConnection();
            const res = await axios.post(`${URL_API_ALB}tags`, {});
            if (res.data?.error) throw new Error(res.data.error);
            safeSet(setTags)(Array.isArray(res.data) ? res.data : []);
        } catch (e: any) {
            console.error("Error fetching tags:", e);
            toast.error(e?.message ?? "Error fetching tags");
            safeSet(setTags)([]);
            setSelectedTag("");
        } finally {
            safeSet(setIsLoadingTags)(false);
        }
    }, []);

    const fetchGroups = useCallback(async () => {
        try {
            safeSet(setIsLoadingGroups)(true);
            setErrorGroups(false);
            await checkConnection();
            const tagId = getSelectedTagId();
            const res = await axios.post(`${URL_API_ALB}groups`, {
                tagIds: tagId ? [tagId] : [],
            });
            if (res.data?.error) throw new Error(res.data.error);
            const list = Array.isArray(res.data) ? res.data : [];
            safeSet(setGroups)(list);
        } catch (e: any) {
            console.error("Error fetching groups:", e);
            toast.error(e?.message ?? "Error fetching groups");
            safeSet(setGroups)([]);
            setSelectedGroup("");
            safeSet(setModules)([]);
            setSelectedModule("");
            safeSet(setSubmodules)([]);
            setSelectedSubmodule("");
            setErrorGroups(true);
        } finally {
            safeSet(setIsLoadingGroups)(false);
        }
    }, [getSelectedTagId]);

    const fetchModules = useCallback(async () => {
        if (!selectedGroup) {
            safeSet(setModules)([]);
            setSelectedModule("");
            safeSet(setSubmodules)([]);
            setSelectedSubmodule("");
            setErrorModules(false);
            return;
        }

        try {
            await checkConnection();
            safeSet(setIsLoadingModules)(true);
            setErrorModules(false);

            const groupId = getSelectedGroupId();
            if (!groupId) {
                safeSet(setModules)([]);
                setErrorModules(true);
                return;
            }

            const res = await axios.post(`${URL_API_ALB}modules`, { groupId });
            if (res.data?.error) throw new Error(res.data.error);
            const list = Array.isArray(res.data) ? res.data : [];
            safeSet(setModules)(list);
            setSelectedModule("");
            safeSet(setSubmodules)([]);
            setSelectedSubmodule("");
        } catch (e: any) {
            console.error("Error fetching modules:", e);
            toast.error(e?.message ?? "Error fetching modules");
            safeSet(setModules)([]);
            setSelectedModule("");
            safeSet(setSubmodules)([]);
            setSelectedSubmodule("");
            setErrorModules(true);
        } finally {
            safeSet(setIsLoadingModules)(false);
        }
    }, [selectedGroup, getSelectedGroupId]);

    const fetchSubmodules = useCallback(async () => {
        if (!selectedGroup || !selectedModule) {
            safeSet(setSubmodules)([]);
            setSelectedSubmodule("");
            return;
        }

        try {
            await checkConnection();
            safeSet(setIsLoadingSubmodules)(true);
            const groupId = getSelectedGroupId();
            const moduleId = getSelectedModuleId();
            const res = await axios.post(`${URL_API_ALB}subModules`, { groupId, moduleId });
            if (res.data?.error) throw new Error(res.data.error);
            const list = Array.isArray(res.data) ? res.data : [];
            safeSet(setSubmodules)(list);
            setSelectedSubmodule("");
        } catch (e: any) {
            console.error("Error fetching submodules:", e);
            toast.error(e?.message ?? "Error fetching submodules");
            safeSet(setSubmodules)([]);
            setSelectedSubmodule("");
        } finally {
            safeSet(setIsLoadingSubmodules)(false);
        }
    }, [selectedGroup, selectedModule, getSelectedGroupId, getSelectedModuleId]);

    // disparadores
    useEffect(() => { fetchTags(); }, [fetchTags]);
    useEffect(() => { fetchGroups(); }, [fetchGroups]);
    useEffect(() => { fetchModules(); }, [fetchModules]);
    useEffect(() => { fetchSubmodules(); }, [fetchSubmodules]);

    const clearFilters = useCallback(() => {
        setSelectedTag("");
        setSelectedGroup("");
        setSelectedModule("");
        setSelectedSubmodule("");
    }, []);

    const isSearchDisabled = useMemo(
        () => !(selectedGroup || selectedTag || selectedModule),
        [selectedGroup, selectedTag, selectedModule]
    );

    return {
        tags, groups, modules, submodules,
        selectedTag, setSelectedTag,
        selectedGroup, setSelectedGroup,
        selectedModule, setSelectedModule,
        selectedSubmodule, setSelectedSubmodule,
        isLoadingTags, isLoadingGroups, isLoadingModules, isLoadingSubmodules,
        errorGroups, errorModules,
        getSelectedTagId, getSelectedGroupId, getSelectedModuleId, getSelectedSubmoduleId,
        clearFilters, isSearchDisabled,
        refetch: { fetchTags, fetchGroups, fetchModules, fetchSubmodules },
    };
};
