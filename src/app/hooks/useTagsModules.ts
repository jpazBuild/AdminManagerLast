import { TOKEN_API } from "@/config";
import { useEffect, useState } from "react";

export const useTagsModules = () => {
    const [tags, setTags] = useState<string[]>([]);
    const [modules, setModules] = useState<string[]>([]);
    const [submodules, setSubmodules] = useState<string[]>([]);

    const [selectedTag, setSelectedTag] = useState<string>("");
    const [selectedModule, setSelectedModule] = useState<string>("");
    const [selectedSubmodule, setSelectedSubmodule] = useState<string>("");

    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [isLoadingSubmodules, setIsLoadingSubmodules] = useState<boolean>(false);

    const BASE_URL = process.env.URL_API_INTEGRATION!;
    const AUTH_HEADER = { headers: { Authorization: `Bearer ${TOKEN_API}` } };

    const fetchInitialData = async () => {
        setIsLoading(true);
        try {
            const params = new URLSearchParams({ returnUniqueValues: "true" });
            const response = await fetch(`${BASE_URL}retrieveAutomationFlow?${params}`, AUTH_HEADER);
            const data = await response.json();

            setTags(data.response?.tagName || []);
            setModules(data.response?.moduleName || []);
            setSubmodules(data.response?.subModuleName || []);
        } catch (error) {
            console.error("Error al obtener los datos iniciales", error);
        } finally {
            setIsLoading(false);
        }
    };

    const fetchModulesByTag = async (tag: string) => {
        if (!tag) return;
        setIsLoading(true);
        try {
            const params = new URLSearchParams({ returnUniqueValues: "true", tagName: tag });
            const response = await fetch(`${BASE_URL}retrieveAutomationFlow?${params}`, AUTH_HEADER);
            const data = await response.json();
            setModules(data.response?.moduleName || []);
        } catch (error) {
            console.error("Error al obtener los módulos para el tag", error);
        } finally {
            setIsLoading(false);
        }
    };

    const fetchSubModulesByModule = async (tag: string, module: string) => {
        if (!tag && !module) return;
        setIsLoadingSubmodules(true);
        try {
            const params = new URLSearchParams();
            if (tag) params.append("tagName", tag);
            if (module) params.append("moduleName", module);

            const response = await fetch(`${BASE_URL}retrieveAutomationFlow?${params}`);
            const data = await response.json();

            const uniqueSubmodules = Array.from(
                new Set(
                    (data.response || [])
                        .map((item: any) => item.subModuleName)
                        .filter(Boolean)
                )
            );

            setSubmodules(uniqueSubmodules as string[]);
        } catch (error) {
            console.error("Error al obtener los submódulos para el módulo", error);
        } finally {
            setIsLoadingSubmodules(false);
        }
    };

    // Sincronización
    useEffect(() => {
        fetchInitialData();
    }, []);

    useEffect(() => {
        setSelectedModule("");
    }, [selectedTag]);

    useEffect(() => {
        setSelectedSubmodule("");
    }, [selectedModule]);

    useEffect(() => {
        if (selectedTag) fetchModulesByTag(selectedTag);
    }, [selectedTag]);

    useEffect(() => {
        if (selectedModule) fetchSubModulesByModule(selectedTag, selectedModule);
    }, [selectedModule]);

    return {
        tags,
        modules,
        submodules,
        selectedTag,
        selectedModule,
        selectedSubmodule,
        setSelectedTag,
        setSelectedModule,
        setSelectedSubmodule,
        isLoading,
        setIsLoading,
        isLoadingSubmodules,
        fetchInitialData,
    };
};
