"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import { DashboardHeader } from "../Layouts/main";
import { Filter, Loader } from "lucide-react";
import { SearchField } from "../components/SearchField";
import axios from "axios";
import { FaSearch} from "react-icons/fa";
import { toast } from "sonner";
import { FiPlay } from "react-icons/fi";
import TestCaseList from "../components/TestCaseList";
import TestSettings from "../components/TestSettings";
import TestReports from "../components/TestReports";
import NoData from "../components/NoData";
import { useTestExecution } from "../hooks/useTestExecution";
import { FaXmark } from "react-icons/fa6";
import { URL_API_ALB } from "@/config";
import { checkConnection } from "@/utils/DBBUtils";
import { SearchCombobox } from "../components/SearchCombobox";

interface TestCase {
    id: string;
    name: string;
    createdBy?: string;
    group?: string;
    tagNames?: string[];
    module?: string;
    subModuleIds?: string[];
}

const DashboardPage = () => {
    const [isDarkMode, setIsDarkMode] = useState<boolean>(false);
    const [groups, setGroups] = useState<any[]>([]);
    const [tags, setTags] = useState<any[]>([]);
    const [modules, setModules] = useState<any[]>([]);
    const [submodules, setSubmodules] = useState<any[]>([]);
    const [selectedGroup, setSelectedGroup] = useState<string>("");
    const [selectedTag, setSelectedTag] = useState<string>("");
    const [selectedModule, setSelectedModule] = useState<string>("");
    const [selectedSubmodule, setSelectedSubmodule] = useState<string>("");
    const [isMobile, setIsMobile] = useState<boolean>(false);
    const [isLoadingSearch, setIsLoadingSearch] = useState<boolean>(false);
    const [isLoadingSubmodules, setIsLoadingSubmodules] = useState<boolean>(false);
    const [dataTestCases, setDataTestCases] = useState<TestCase[]>([]);
    const [availableCreators, setAvailableCreators] = useState<string[]>([]);
    const [selectedCreatedBy, setSelectedCreatedBy] = useState<string>("All");
    const [searchTestCaseName, setSearchTestCaseName] = useState<string>("");
    const [selectedCases, setSelectedCases] = useState<string[]>([]);
    const [maxBrowsers, setMaxBrowsers] = useState<number>(1);
    const [isHeadless, setIsHeadless] = useState<boolean>(true);
    const [isDropdownOpenTC, setIsDropdownOpenTC] = useState<boolean>(true);
    const [testData, setTestData] = useState<any>();
    const [testCasesUpdated, setTestCasesUpdated] = useState<TestCase[]>([]);
    const [executeRun, setExecuteRun] = useState<boolean>(false);
    const [editMode, setEditMode] = useState<'global' | 'individual'>('global');
    const [isLoadingGroups, setIsLoadingGroups] = useState<boolean>(false);
    const [isLoadingModules, setIsLoadingModules] = useState<boolean>(false);
    const [errorModules, setErrorModules] = useState<any>(false)
    const [errorGroups, setErrorGroups] = useState<any>(false)
    const [isLoadingTags, setIsLoadingTags] = useState<boolean>(false);

    const {
        reports,
        loading,
        progress,
        executeTests,
        idReports,
        stopTest,
        stopped,
        setLoading,
        setStopped
    } = useTestExecution();

    const handleDarkModeChange = (isDark: boolean) => {
        setIsDarkMode(isDark);
        console.log('Dark mode changed:', isDark);
    };

    const toggleDropdown = () => {
        setIsDropdownOpenTC(!isDropdownOpenTC);
    };

    useEffect(() => {
        const checkMobile = () => setIsMobile(window.innerWidth < 768);
        checkMobile();
        window.addEventListener("resize", checkMobile);
        return () => window.removeEventListener("resize", checkMobile);
    }, []);


    useEffect(() => {
        const fetchInitialData = async () => {
            try {
                setIsLoadingTags(true);
                // setErrorGroups(false);

                await checkConnection()
                const tagsRes = await axios.post(`${URL_API_ALB}tags`, {});

                if (tagsRes.data.error) throw new Error(tagsRes.data.error);

                setTags(Array.isArray(tagsRes.data) ? tagsRes.data : []);
                // setErrorGroups(false);

            } catch (error) {
                console.error("Error fetching initial data:", error);
                toast.error(error instanceof Error ? error.message : "Error fetching tags");

                setTags([]);
                setSelectedTag("");
                setSelectedGroup("");
                setModules([]);
                setSelectedModule("");
                setSubmodules([]);
                setSelectedSubmodule("");

                // setErrorGroups(true);
            } finally {
                setIsLoadingTags(false);
            }
        };

        fetchInitialData();
    }, []);

    useEffect(() => {
        const fetchInitialData = async () => {
            try {
                setIsLoadingGroups(true);
                setErrorGroups(false);
                const tagId = getSelectedTagId();
                await checkConnection()
                const groupsRes = await axios.post(`${URL_API_ALB}groups`, {
                    tagIds: tagId ? [tagId] : []
                });

                if (groupsRes.data.error) throw new Error(groupsRes.data.error);

                setGroups(Array.isArray(groupsRes.data) ? groupsRes.data : []);
                setErrorGroups(false);

            } catch (error) {
                console.error("Error fetching initial data:", error);
                toast.error(error instanceof Error ? error.message : "Error fetching groups");

                setGroups([]);
                setSelectedGroup("");
                setModules([]);
                setSelectedModule("");
                setSubmodules([]);
                setSelectedSubmodule("");

                setErrorGroups(true);
            } finally {
                setIsLoadingGroups(false);
            }
        };

        fetchInitialData();
    }, []);

    useEffect(() => {
        const handleBeforeUnload = (event: BeforeUnloadEvent) => {
            event.preventDefault();
            event.returnValue = "";
        };

        window.addEventListener("beforeunload", handleBeforeUnload);

        return () => {
            window.removeEventListener("beforeunload", handleBeforeUnload);
        };
    }, []);

    const getSelectedTagId = useCallback(() => {
        if (!selectedTag) return "";
        const tag: any = tags.find((tag: any) => tag.name === selectedTag);
        return tag ? tag.id : selectedTag;
    }, [selectedTag, tags]);

    const getSelectedGroupId = useCallback(() => {
        if (!selectedGroup) return "";
        const group: any = groups.find((group: any) => group.name === selectedGroup);
        return group ? group.id : selectedGroup;
    }, [selectedGroup, groups]);

    const getSelectedModuleId = useCallback(() => {
        if (!selectedModule) return "";
        const module: any = modules.find((module: any) => module.name === selectedModule);
        return module ? module.id : selectedModule;
    }, [selectedModule, modules]);

    const getSelectedSubmoduleId = useCallback(() => {
        if (!selectedSubmodule) return "";
        const submodule: any = submodules.find((sub: any) => sub.name === selectedSubmodule);
        return submodule ? submodule.id : selectedSubmodule;
    }, [selectedSubmodule, submodules]);

    useEffect(() => {
        const fetchModules = async () => {
            if (!selectedGroup) {
                setModules([]);
                setSelectedModule("");
                setSubmodules([]);
                setSelectedSubmodule("");
                setErrorModules(false);
                return;
            }

            try {
                await checkConnection()
                const groupId = getSelectedGroupId();
                if (!groupId) {
                    setModules([]);
                    setErrorModules(true);
                    return;
                }

                setIsLoadingModules(true);
                setErrorModules(false);

                const response = await axios.post(`${URL_API_ALB}modules`, { groupId });

                if (response.data.error) throw new Error(response.data.error);

                const modulesData = Array.isArray(response.data) ? response.data : [];
                setModules(modulesData);
                setSelectedModule("");
                setSubmodules([]);
                setSelectedSubmodule("");
                setErrorModules(false);

            } catch (error) {
                console.error("Error fetching modules:", error);
                toast.error(error instanceof Error ? error.message : "Error fetching modules");
                setModules([]);
                setSelectedModule("");
                setSubmodules([]);
                setSelectedSubmodule("");
                setErrorModules(true);
            } finally {
                setIsLoadingModules(false);
            }
        };

        fetchModules();
    }, [selectedGroup, getSelectedGroupId]);


    useEffect(() => {
        const fetchSubmodules = async () => {
            if (!selectedGroup || !selectedModule) {
                setSubmodules([]);
                setSelectedSubmodule("");
                return;
            }

            try {
                await checkConnection()
                setIsLoadingSubmodules(true);
                const groupId = getSelectedGroupId();
                const moduleId = getSelectedModuleId();

                const response = await axios.post(`${URL_API_ALB}subModules`, {
                    groupId,
                    moduleId
                });

                if (response.data.error) throw new Error(response.data.error);

                const submodulesData = Array.isArray(response.data) ? response.data : [];
                setSubmodules(submodulesData);
                setSelectedSubmodule("");
            } catch (error) {
                console.error("Error fetching submodules:", error);
                toast.error(error instanceof Error ? error.message : "Error fetching submodules");
                setSubmodules([]);
            } finally {
                setIsLoadingSubmodules(false);
            }
        };

        fetchSubmodules();
    }, [selectedGroup, selectedModule, getSelectedGroupId, getSelectedModuleId]);

    useEffect(() => {
        if (Array.isArray(dataTestCases) && dataTestCases.length > 0) {
            const uniqueCreators = Array.from(new Set(
                dataTestCases
                    .map((tc: any) => tc?.createdBy)
                    .filter(Boolean)
            ));
            setAvailableCreators(uniqueCreators);
        } else {
            setAvailableCreators([]);
        }
    }, [dataTestCases]);

    const handleSearch = useCallback(async () => {
        try {
            await checkConnection()
            setIsLoadingSearch(true);
            const searchParams: Record<string, any> = {};

            const tagId = getSelectedTagId();
            const groupId = getSelectedGroupId();
            const moduleId = getSelectedModuleId();
            const submoduleId = getSelectedSubmoduleId();

            if (tagId) searchParams.tagIds = [tagId];
            if (groupId) searchParams.groupId = groupId;
            // if (selectedTag) searchParams.tagNames = [selectedTag];
            if (moduleId) searchParams.moduleId = moduleId;
            if (submoduleId) searchParams.subModuleId = submoduleId;

            const response = await axios.post(`${URL_API_ALB}getTestHeaders`, searchParams);
            setDataTestCases(response.data || []);

        } catch (error) {
            console.error("Error fetching test cases:", error);
            toast.error("Error fetching test cases. Please try again later.");
            setDataTestCases([]);
        } finally {
            setIsLoadingSearch(false);
        }
    }, [selectedGroup, selectedTag, selectedModule, selectedSubmodule, getSelectedGroupId, getSelectedModuleId, getSelectedSubmoduleId]);

    const filteredTestCases = useMemo(() => {
        return dataTestCases.filter((tc: TestCase) => {
            const matchesCreator =
                !selectedCreatedBy || selectedCreatedBy === "All" ||
                tc?.createdBy?.toLowerCase() === selectedCreatedBy?.toLowerCase();

            const matchesName =
                !searchTestCaseName ||
                tc?.name?.toLowerCase().includes(searchTestCaseName.toLowerCase());

            return matchesCreator && matchesName;
        });
    }, [dataTestCases, selectedCreatedBy, searchTestCaseName]);

    const toggleSelectAll = useCallback((checked: boolean) => {
        setSelectedCases(checked ? filteredTestCases.map((tc: TestCase) => tc.id) : []);
    }, [filteredTestCases]);

    const toggleSelect = useCallback((testCaseId: string) => {
        setSelectedCases(prev =>
            prev.includes(testCaseId)
                ? prev.filter(tcId => tcId !== testCaseId)
                : [...prev, testCaseId]
        );
    }, []);

    const handleBrowserLimitChange = useCallback((value: number) => {
        setMaxBrowsers(value);
    }, []);

    const handleHeadlessChange = useCallback((value: boolean) => {
        setIsHeadless(value);
    }, []);

    const onDataChangeRead = useCallback((data: any) => {
        setTestData(data);
    }, []);

    const onTestCasesDataChange = useCallback((data: any) => {
        setTestCasesUpdated(data);
    }, []);

    const selectAllChecked = useMemo(() =>
        filteredTestCases?.length > 0 && selectedCases?.length === filteredTestCases?.length,
        [filteredTestCases, selectedCases]
    );

    const isSearchButtonDisabled = useMemo(() =>
        !(selectedGroup || selectedTag || selectedModule),
        [selectedGroup, selectedTag, selectedModule]
    );

    const selectedTests = useMemo(() =>
        testCasesUpdated?.filter((tc: any) => selectedCases.includes(tc.id)),
        [testCasesUpdated, selectedCases]
    );

    const anyLoading = useMemo(() =>
        Object.entries(loading)
            .filter(([key]) => key && key !== "undefined")
            .some(([_, value]) => Boolean(value)),
        [loading]
    );


    const everyStopped = useMemo(() =>
        Object.values(stopped).every(Boolean),
        [stopped]
    );

    const fetchInitialData = useCallback(async () => {
        await handleSearch();
    }, [handleSearch]);

    const clearFilters = useCallback(() => {
        setSelectedGroup("");
        setSelectedTag("");
        setSelectedModule("");
        setSelectedSubmodule("");
    }, []);

    const handleRunTests = useCallback(async () => {
        setExecuteRun(true);
        if (selectedCases.length === 0) {
            toast.error("Please select at least one test case");
            return;
        }
        executeTests(selectedTests, testData, maxBrowsers, isHeadless);
    }, [selectedCases, selectedTests, testData, maxBrowsers, isHeadless, executeTests]);

    return (
        <DashboardHeader onDarkModeChange={handleDarkModeChange}>
            <div className={`p-4 flex justify-center items-center w-full flex-col gap-4 ${isDarkMode ? "bg-gray-900 text-white" : "bg-white text-primary"} transition-colors duration-300`}>
                <div className="lg:w-2/3 flex flex-col gap-4 mb-4 mt-2 justify-center items-center">
                    <h2 className="font-medium tracking-wide text-center text-[20px] w-full">Find test cases</h2>

                    <SearchCombobox
                        textOptionSelect="Tags" textSearch="tag ..." options={tags?.map((tag: any) => ({
                            label: String(tag?.name),
                            value: String(tag?.name),
                        }))}
                        defaultValue=""
                        onChange={(value, option) => {
                            setSelectedTag(value)
                        }}
                        disabled={isLoadingTags}
                    />
                    <SearchCombobox
                        textOptionSelect="Groups" textSearch="group ..." options={groups?.map((group: any) => ({
                            label: String(group?.name),
                            value: String(group?.name),
                        }))}
                        value={selectedGroup}
                        onChange={(value, option) => {
                            setSelectedGroup(value)
                        }}
                        disabled={isLoadingGroups || errorGroups}
                    />

                    <SearchCombobox
                        textOptionSelect="Module" textSearch="module ..." options={modules?.map((module: any) => ({
                            label: String(module.name),
                            value: String(module.name),
                        }))}
                        value={selectedModule}
                        onChange={(value, option) => {
                            setSelectedModule(value)
                        }}
                        disabled={!selectedGroup || modules.length === 0 || isLoadingModules || errorModules}
                    />

                    {isLoadingSubmodules ? (
                        <div className="flex items-center gap-2">
                            <Loader className="h-5 w-5 text-primary/80 animate-spin" />
                            <span className="text-primary/80">Loading submodules...</span>
                        </div>
                    ) : (
                        <SearchCombobox
                            textOptionSelect="Submodule" textSearch="submodule ..." options={submodules?.map((submodule: any) => ({
                                label: String(submodule.name),
                                value: String(submodule.name),
                            }))}
                            defaultValue=""
                            onChange={(value, option) => {
                                setSelectedSubmodule(value)
                            }}
                            disabled={!selectedModule || modules.length === 0 || isLoadingSubmodules}
                        />
                    )}


                    <div className="flex items-center gap-2 flex-col w-full">
                        <div className={`flex ${isMobile ? "flex-col" : ""} md:justify-center lg:justify-center items-center gap-2 pb-2 w-full`}>
                            <button
                                onClick={handleSearch}
                                disabled={isSearchButtonDisabled || isLoadingSearch}
                                className={` w-full justify-center md:w-50 lg:w-50 px-4 py-2 shadow-md cursor-pointer font-semibold tracking-wide rounded-xl  text-white flex items-center gap-2
                                    ${isLoadingSearch ? "!bg-primary/10 !cursor-not-allowed" : ""}
                                    ${isDarkMode ? "bg-blue-700 hover:bg-blue-800" : "bg-primary/90 hover:bg-primary/80"}`}
                            >
                                {isLoadingSearch ? (
                                    <>
                                        <Loader className="h-5 w-5 text-xl text-primary/80 animate-spin" />
                                        <span className="text-white">Searching...</span>
                                    </>
                                ) : (
                                    <>
                                        <FaSearch />
                                        Search
                                    </>
                                )}
                            </button>

                            {(selectedGroup || selectedTag || selectedModule || selectedSubmodule) && (
                                <button
                                    onClick={clearFilters}
                                    className="w-full px-4 border text-md border-primary/60 py-2 justify-center text-primary/70 flex md:w-50 lg:w-50 items-center gap-2 shadow-md cursor-pointer font-semibold tracking-wide rounded-xl"
                                >
                                    <Filter /> Clear Filters
                                </button>
                            )}
                        </div>

                        <div className="flex items-center gap-2 w-full flex-wrap">
                            {selectedGroup && (
                                <div className="bg-primary/85 shadow-md text-white/90 px-2 py-1 rounded-full text-sm flex items-center gap-2">
                                    <span>{selectedGroup}</span>
                                    <button
                                        onClick={() => setSelectedGroup("")}
                                        className="cursor-pointer text-white/90 hover:text-white"
                                    >
                                        <FaXmark />
                                    </button>
                                </div>
                            )}
                            {selectedTag && (
                                <div className="bg-primary/65 shadow-md text-white px-2 py-1 rounded-full text-sm flex items-center gap-1">
                                    <span>{selectedTag}</span>
                                    <button
                                        onClick={() => setSelectedTag("")}
                                        className="cursor-pointer text-white/90 hover:text-white"
                                    >
                                        <FaXmark />
                                    </button>
                                </div>
                            )}
                            {selectedModule && (
                                <div className="bg-primary/50 shadow-md text-white px-2 py-1 rounded-full text-sm flex items-center gap-1">
                                    <span>{selectedModule}</span>
                                    <button
                                        onClick={() => setSelectedModule("")}
                                        className="cursor-pointer text-white/90 hover:text-white"
                                    >
                                        <FaXmark />
                                    </button>
                                </div>
                            )}
                            {selectedSubmodule && (
                                <div className="bg-primary/30 shadow-md text-white px-2 py-1 rounded-full text-sm flex items-center gap-1">
                                    <span>{selectedSubmodule}</span>
                                    <button
                                        onClick={() => setSelectedSubmodule("")}
                                        className="cursor-pointer text-white/90 hover:text-white"
                                    >
                                        <FaXmark />
                                    </button>
                                </div>
                            )}
                        </div>

                        {availableCreators.length > 0 && (
                            <SearchCombobox
                                textOptionSelect="Created By" textSearch="created by ..." 
                                options={[
                                    { label: "All", value: "All" },
                                    ...availableCreators.map(creator => ({ label: creator, value: creator }))
                                ]}
                                value={selectedCreatedBy}
                                onChange={setSelectedCreatedBy}
                            />
                        )}

                        {dataTestCases?.length > 1 && (

                            <SearchCombobox
                                textOptionSelect="Test Case Name" textSearch="Test Case Name ..." 
                                options={dataTestCases
                                    .filter(tc => typeof tc.name === "string")
                                    .map((tc) => ({
                                        label: tc.name as string,
                                        value: tc.name as string,
                                    }))}
                                value={searchTestCaseName}
                                onChange={setSearchTestCaseName}
                            />
                        )}
                    </div>
                </div>

                {isLoadingSearch ? (
                    <div className="w-full flex flex-col gap-4 justify-center items-center h-64">
                        <div className="h-16 bg-primary/20 rounded w-full mb-2 animate-pulse"></div>
                        <div className="h-16 bg-primary/20 rounded w-full mb-2 animate-pulse"></div>
                        <div className="h-16 bg-primary/20 rounded w-full mb-2 animate-pulse"></div>
                    </div>
                ) : (
                    <div className="w-full flex flex-col gap-4 justify-center items-center">
                        {filteredTestCases.length > 0 ? (
                            <div className="lg:w-2/3">
                                <TestCaseList
                                    testCases={filteredTestCases}
                                    selectedCases={selectedCases}
                                    toggleSelect={toggleSelect}
                                    onDataChange={onDataChangeRead}
                                    onTestCasesDataChange={onTestCasesDataChange}
                                    onRefreshAfterUpdateOrDelete={fetchInitialData}
                                    editMode={editMode}
                                    setEditMode={setEditMode}
                                    isDarkMode={isDarkMode}
                                />

                                <TestSettings
                                    onBrowserLimitChange={handleBrowserLimitChange}
                                    onHeadlessChange={handleHeadlessChange}
                                    isDarkMode={isDarkMode}
                                />

                                <div className="flex gap-2">
                                    <button
                                        onClick={handleRunTests}
                                        disabled={selectedCases.length === 0 || isLoadingSearch || anyLoading}
                                        className={`cursor-pointer px-4 py-2 font-semibold tracking-wide mt-4 rounded-lg transition-all duration-300 ${isDarkMode
                                            ? "bg-white text-[#021d3d] hover:bg-gray-200"
                                            : "bg-[#021d3d] text-white hover:bg-[rgb(2,29,61)]"}
                                        ${isSearchButtonDisabled ? "!bg-primary/10 !cursor-not-allowed" : ""}
                                        ${(isLoadingSearch || anyLoading) || selectedCases.length === 0 ? "opacity-50 !cursor-not-allowed" : ""}`}
                                    >
                                        {(isLoadingSearch || anyLoading) ? "Executing..." : (
                                            <span className="flex items-center gap-2"><FiPlay /> Run Tests</span>
                                        )}
                                    </button>
                                </div>

                                {executeRun && (
                                    <TestReports
                                        stopped={stopped}
                                        setStopped={setStopped}
                                        setLoading={setLoading}
                                        testData={testData}
                                        reports={reports}
                                        idReports={idReports}
                                        progress={progress}
                                        selectedCases={selectedCases}
                                        selectedTest={selectedTests}
                                        darkMode={isDarkMode}
                                    />
                                )}
                            </div>


                        ) : (
                            <NoData />
                        )}
                    </div>
                )}
            </div>
        </DashboardHeader>
    );
};

export default DashboardPage;