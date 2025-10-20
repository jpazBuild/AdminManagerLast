"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import { DashboardHeader } from "../Layouts/main";
import { Filter, Loader } from "lucide-react";
import { SearchField } from "../components/SearchField";
import axios from "axios";
import { FaChrome, FaSearch } from "react-icons/fa";
import { toast } from "sonner";
import { FiPlay } from "react-icons/fi";
import TestCaseList from "./components/TestCaseList";
import TestSettings from "./components/TestSettings";
import TestReports from "./components/TestReports";
import NoData from "../components/NoData";
import { useTestExecution } from "../hooks/useTestExecution";
import { URL_API_ALB } from "@/config";
import { checkConnection } from "@/utils/DBBUtils";
import TextInputWithClearButton from "../components/InputClear";
import { User } from "@/types/types";
import { TbWorld } from "react-icons/tb";
import ButtonTab from "../components/ButtonTab";
import TabsUnderlineDemo from "./components/TabsLine";

interface TestCase {
    id: string;
    name: string;
    createdBy?: string;
    createdByName?: string;
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
    const [selectedCreatedBy, setSelectedCreatedBy] = useState<string>("All");
    const [searchTestCaseName, setSearchTestCaseName] = useState<string>("");
    const [searchTestCaseId, setSearchTestCaseId] = useState<string>("");
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
    const [loadingUsers, setLoadingUsers] = useState<boolean>(false);
    const [users, setUsers] = useState<any[]>([]);
    const [viewMode, setViewMode] = useState<'list' | 'reports'>('list');

    const {
        reports,
        loading,
        progress,
        executeTests,
        idReports,
        stopTest,
        stopped,
        setLoading,
        setStopped,
        runSingleTest
    } = useTestExecution();

    const handleDarkModeChange = (isDark: boolean) => {
        setIsDarkMode(isDark);
        console.log('Dark mode changed:', isDark);
    };

    const toggleDropdown = () => {
        setIsDropdownOpenTC(!isDropdownOpenTC);
    };

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

    useEffect(() => {
        fetchUsers();
    }, [])
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

                await checkConnection()
                const tagsRes = await axios.post(`${URL_API_ALB}tags`, {});

                if (tagsRes.data.error) throw new Error(tagsRes.data.error);

                setTags(Array.isArray(tagsRes.data) ? tagsRes.data : []);

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

    const handleSearch = useCallback(async () => {
        try {
            await checkConnection()
            setIsLoadingSearch(true);
            const searchParams: Record<string, any> = {};

            const tagId = await getSelectedTagId();
            const groupId = await getSelectedGroupId();
            const moduleId = await getSelectedModuleId();
            const submoduleId = await getSelectedSubmoduleId();
            if (searchTestCaseId) searchParams.id = await searchTestCaseId;

            if (tagId) searchParams.tagIds = [tagId];
            if (groupId) searchParams.groupId = await groupId;
            if (moduleId) searchParams.moduleId = await moduleId;
            if (submoduleId) searchParams.subModuleId = await submoduleId;
            if (searchTestCaseName) searchParams.partialName = await searchTestCaseName;
            if (selectedCreatedBy && selectedCreatedBy !== "All") searchParams.createdBy = await getUserIdByName(selectedCreatedBy);


            const response = await axios.post(`${URL_API_ALB}getTestHeaders`, await searchParams);

            await setDataTestCases(response.data || []);

        } catch (error) {
            console.error("Error fetching test cases:", error);
            toast.error("Error fetching test cases. Please try again later.");
            setDataTestCases([]);
        } finally {
            setIsLoadingSearch(false);
        }
    }, [selectedGroup, selectedTag, selectedModule, selectedSubmodule, selectedCreatedBy, searchTestCaseName, searchTestCaseId, getSelectedGroupId, getSelectedModuleId, getSelectedSubmoduleId]);


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


    const isSearchButtonDisabled = useMemo(() =>
        !(selectedGroup || selectedTag || selectedModule || searchTestCaseName || selectedCreatedBy),
        [selectedGroup, selectedTag, selectedModule, searchTestCaseName, selectedCreatedBy]
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
        setSearchTestCaseName("");
        setSelectedCreatedBy("All");
    }, []);

    const handleRunTests = useCallback(async () => {
        setExecuteRun(true);
        if (selectedCases.length === 0) {
            toast.error("Please select at least one test case");
            return;
        }
        console.log("testData?.data ", await testData?.data);
        const testdataIn = await testData?.data;
        await executeTests(selectedTests, testdataIn, maxBrowsers, isHeadless);
    }, [selectedCases, selectedTests, testData, maxBrowsers, isHeadless, executeTests]);

    const userOptions = useMemo(
        () => (users || []).map((u) => ({ label: u.name, value: u.name })),
        [users]
    );

    const handlePlaySingle = useCallback((test: any) => {
        const perTestData = testData?.data?.[test.id] ?? undefined;
        setExecuteRun(true);

        runSingleTest(test, perTestData, isHeadless);
    }, [runSingleTest, testData, isHeadless]);

    const getUserIdByName = useCallback((name: string) => {
        const user = users.find((u) => u.name === name);
        return user ? user.id : null;
    }, [users]);
    return (
        <DashboardHeader typeFixed={false} onDarkModeChange={handleDarkModeChange}>
            <div className={`p-4 flex justify-center items-center w-full h-full flex-col gap-4 ${isDarkMode ? "bg-gray-900 text-white" : "bg-white text-primary"} transition-colors duration-300`}>
                <div className="w-full lg:w-2/3 flex flex-col gap-4 mb-4 mt-2 justify-center items-center">
                    <h2 className="font-medium tracking-wide text-center text-[20px] w-full">Find test cases</h2>
                    
                    <SearchField
                        label="Search Test by tags"
                        value={selectedTag}
                        onChange={setSelectedTag}
                        placeholder="Search by tags..."
                        className="w-full"
                        disabled={isLoadingSearch}
                        options={tags?.map((tag: any) => ({
                            label: String(tag?.name),
                            value: String(tag?.name),
                        }))}
                    />

                    <SearchField
                        label="Search Test by groups"
                        value={selectedGroup}
                        onChange={setSelectedGroup}
                        placeholder="Search by groups..."
                        className="w-full"
                        disabled={isLoadingGroups || errorGroups}
                        options={groups?.map((group: any) => ({
                            label: String(group?.name),
                            value: String(group?.name),
                        }))}
                    />

                    <SearchField
                        label="Search Test by modules"
                        value={selectedModule}
                        onChange={setSelectedModule}
                        placeholder="Search by modules..."
                        className="w-full"
                        disabled={!selectedGroup || modules.length === 0 || isLoadingModules || errorModules}
                        options={modules?.map((module: any) => ({
                            label: String(module?.name),
                            value: String(module?.name),
                        }))}
                    />


                    {isLoadingSubmodules ? (
                        <div className="flex items-center gap-2">
                            <Loader className="h-5 w-5 text-primary/80 animate-spin" />
                            <span className="text-primary/80">Loading submodules...</span>
                        </div>
                    ) : (

                        <SearchField
                            label="Search Test by submodules"
                            value={selectedSubmodule}
                            onChange={setSelectedSubmodule}
                            placeholder="Search by submodules..."
                            className="w-full"
                            disabled={!selectedModule || submodules.length === 0 || isLoadingSubmodules}
                            options={submodules?.map((submodule: any) => ({
                                label: String(submodule?.name),
                                value: String(submodule?.id),
                            }))}
                        />
                    )}

                    <SearchField
                        label="Search Test by created by"
                        value={selectedCreatedBy}
                        onChange={(value) => setSelectedCreatedBy(value)}
                        placeholder="Select creator..."
                        className="w-full"
                        options={userOptions}
                    />

                    <TextInputWithClearButton
                        id="search-test-case-name"
                        label="Search Test by name"
                        value={searchTestCaseName}
                        onChangeHandler={(e) => setSearchTestCaseName(e.target.value)}
                        placeholder="Search by test case name..."
                        className="w-full"
                        isSearch={true}
                    />

                    <TextInputWithClearButton
                        id="search-test-case-id"
                        label="Search Test by id"
                        value={searchTestCaseId}
                        onChangeHandler={(e) => setSearchTestCaseId(e.target.value)}
                        placeholder="Search by test case id..."
                        className="w-full"
                        isSearch={true}
                    />

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
                                        Search {isSearchButtonDisabled}
                                    </>
                                )}
                            </button>

                            {(selectedGroup || selectedTag || selectedModule || selectedSubmodule || searchTestCaseName || selectedCreatedBy) && (
                                <button
                                    onClick={clearFilters}
                                    className="w-full px-4 border text-md border-primary/60 py-2 justify-center text-primary/70 flex md:w-50 lg:w-50 items-center gap-2 shadow-md cursor-pointer font-semibold tracking-wide rounded-xl"
                                >
                                    <Filter /> Clear Filters
                                </button>
                            )}
                        </div>
                    </div>
                </div>


                <div className="flex gap-2">
                    <ButtonTab
                        label="View Test Cases"
                        value="list"
                        isActive={viewMode === "list"}
                        onClick={() => setViewMode("list")}
                        isDarkMode={isDarkMode}
                    />
                    <ButtonTab
                        label="View Reports"
                        value="reports"
                        isActive={viewMode === "reports"}
                        onClick={() => setViewMode("reports")}
                        isDarkMode={isDarkMode}
                    />


                </div>

                <div className="w-full lg:w-2/3 flex flex-col gap-4 justify-center items-center">
                    <div
                        className={viewMode === 'list' ? 'block w-full' : 'hidden w-full'}
                        aria-hidden={viewMode !== 'list'}
                    >
                        {dataTestCases.length > 0 ? (
                            <div className="w-full">
                                <TestCaseList
                                    testCases={dataTestCases}
                                    selectedCases={selectedCases}
                                    toggleSelect={toggleSelect}
                                    onDataChange={onDataChangeRead}
                                    onTestCasesDataChange={onTestCasesDataChange}
                                    onRefreshAfterUpdateOrDelete={fetchInitialData}
                                    editMode={editMode}
                                    setEditMode={setEditMode}
                                    isDarkMode={isDarkMode}
                                />

                            </div>
                        ) : (
                            <NoData />
                        )}
                    </div>

                    <div
                        className={viewMode === 'reports' ? 'block w-full' : 'hidden w-full'}
                        aria-hidden={viewMode !== 'reports'}
                    >
                        {
                            dataTestCases.length > 0 && (
                                <div className="w-full flex justify-end items-center">
                                    <FaChrome className="w-6 h-6 text-primary mr-2" title="Chrome Browser" />
                                    <TestSettings
                                        onBrowserLimitChange={handleBrowserLimitChange}
                                        onHeadlessChange={handleHeadlessChange}
                                        isDarkMode={isDarkMode}

                                    />
                                </div>
                            )
                        }
                        {dataTestCases.length === 0 && (
                            <div className="w-full h-full p-10 flex flex-col gap-4 justify-center items-center mb-4">
                                <TbWorld className="w-8 h-8 text-blue-500 mr-2" title="No test cases available" />
                                <span className="text-primary/80">Select test cases for execute</span>
                                <button onClick={() => setViewMode("list")} className="bg-primary/80 font-bold text-white px-4 py-2 rounded-lg">View test cases</button>
                            </div>
                        )}


                        <TestReports
                            stopped={stopped}
                            setStopped={setStopped}
                            setLoading={setLoading}
                            loading={loading}
                            testData={testData}
                            reports={reports}
                            idReports={idReports}
                            progress={progress}
                            selectedCases={selectedCases}
                            selectedTest={selectedTests}
                            darkMode={isDarkMode}
                            onPlayTest={handlePlaySingle}
                            onRunAll={handleRunTests}
                        />
                    </div>
                </div>
            </div>
        </DashboardHeader>
    );
};

export default DashboardPage;