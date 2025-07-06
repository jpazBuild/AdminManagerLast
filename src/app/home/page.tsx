"use client"
import { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Submodule, Tag, TestCase, Module } from "./types";
import { DashboardHeader } from "../Layouts/main";
import TestSettings from "../components/TestSettings";
import { FaChevronDown, FaChevronUp, FaSearch } from "react-icons/fa";
import TestReports from "../components/TestReports";
import TestCaseList from "../components/TestCaseList";
import { FiPlay } from "react-icons/fi";
import { useTestExecution } from "../hooks/useTestExecution";
import NoData from "../components/NoData";
import { toast } from "sonner";
import { SearchField } from "../components/SearchField";
import { SelectField } from "../components/SelectField";
import SearchTestCaseComboBox from "../components/SearchTestCaseComboBox";
import { useTagsModules } from "../hooks/useTagsModules";
import { FaXmark } from "react-icons/fa6";
import { Filter, Loader } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch"

const Home = () => {
    const [darkMode, setDarkMode] = useState(false);
    const [selectedCases, setSelectedCases] = useState<string[]>([]);
    const [maxBrowsers, setMaxBrowsers] = useState<number>(1)
    const [isHeadless, setIsHeadless] = useState<boolean>(true)
    const [isDropdownOpenTC, setIsDropdownOpenTC] = useState(true);
    const [testData, setTestData] = useState<any>();
    const [responseData, setResponseData] = useState<TestCase[]>([]);
    const [selectedCreatedBy, setSelectedCreatedBy] = useState("");
    const [availableCreators, setAvailableCreators] = useState<string[]>([]);
    const [testCasesUpdated, setTestCasesUpdated] = useState<TestCase[]>([]);
    const [executeRun, setExecuteRun] = useState(false);
    const [searchTestCaseName, setSearchTestCaseName] = useState("");
    const [isMobile, setIsMobile] = useState(false);
    const [editMode, setEditMode] = useState<'global' | 'individual'>('global');
    useEffect(() => {
        if (Array.isArray(responseData)) {
            const uniqueCreators = Array.from(new Set(responseData.map((tc: any) => tc?.createdBy).filter(Boolean)));
            setAvailableCreators(uniqueCreators);
        }
    }, [responseData]);

    const handleToggleDarkMode = (darkMode: boolean) => {
        setDarkMode(darkMode);
    };

    const toggleDropdown = () => {
        setIsDropdownOpenTC(!isDropdownOpenTC);
    };

    const handleSearch = async () => {
        setIsLoading(true);
        try {
            const searchParams = new URLSearchParams();

            if (selectedTag) {
                searchParams.append("tagName", selectedTag);
            }

            if (selectedModule) {
                searchParams.append("moduleName", selectedModule);
            }

            if (selectedSubmodule) {
                searchParams.append("subModuleName", selectedSubmodule);
            }

            const response = await fetch(
                `${process.env.URL_API_INTEGRATION}retrieveAutomationFlow?${searchParams.toString()}`
            );

            const data = await response.json();

            if (selectedSubmodule) {
                const filteredData = await data?.response?.filter((item: TestCase) =>
                    item?.subModuleName === selectedSubmodule || item?.subModuleName?.includes(selectedSubmodule)
                );
                setResponseData(filteredData || []);
            } else {
                setResponseData(data?.response || []);
            }

        } catch (error) {
            console.error('Error to obtain data', error);
            toast.error('Error to obtain data');
            setResponseData([]);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        const checkMobile = () => setIsMobile(window.innerWidth < 768);
        checkMobile();
        window.addEventListener("resize", checkMobile);
        return () => window.removeEventListener("resize", checkMobile);
    }, []);
    const {
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
    } = useTagsModules();

    const {
        reports,
        loading,
        progress,
        executeTests,
        idReports,
        stopTest,
        stopped
    } = useTestExecution();

    const toggleSelectAll = (checked: boolean) => {
        setSelectedCases(checked ? responseData.map((tc: any) => tc.testCaseId) : []);
    };

    const toggleSelect = (testCaseId: string) => {
        setSelectedCases(prev => prev.includes(testCaseId) ? prev.filter(tcId => tcId !== testCaseId) : [...prev, testCaseId]);
    };

    const handleBrowserLimitChange = (value: number) => {
        setMaxBrowsers(value);
    };

    const handleHeadlessChange = (value: boolean) => {
        setIsHeadless(true);
    };

    const onDataChangeRead = (data: any) => {
        setTestData(data)
    }

    const onTestCasesDataChange = (data: any) => {
        setTestCasesUpdated(data)
    }
    const filteredTestCases = useMemo(() => {
        return responseData.filter((tc: TestCase) => {
            const matchesCreator =
                !selectedCreatedBy || selectedCreatedBy === "All" || tc?.createdBy?.toLowerCase() === selectedCreatedBy?.toLowerCase();
            console.log("tc?.name ", tc);

            const matchesName =
                !searchTestCaseName || tc?.testCaseName?.toLowerCase().includes(searchTestCaseName.toLowerCase());

            return matchesCreator && matchesName;
        });
    }, [responseData, selectedCreatedBy, searchTestCaseName]);


    const selectAllChecked = responseData?.length > 0 && selectedCases?.length === responseData?.length;

    const isSearchButtonDisabled = !(selectedTag || selectedModule);

    const selectedTests: any = testCasesUpdated?.filter((tc: any) =>
        selectedCases.includes(tc.testCaseId)
    );

    const anyLoading = Object.values(loading).some(Boolean);
    const everyStopped = Object.values(stopped).every(Boolean)
    console.log(selectedCases.length === 0 || isLoading || anyLoading || !everyStopped);

    return (
        <DashboardHeader onToggleDarkMode={handleToggleDarkMode}>
            <div className="w-full p-4 flex flex-col gap-4 justify-center mx-auto text-primary">
                <div className="flex flex-wrap gap-4 mb-4 mt-2 w-full">
                    <h2 className="font-semibold tracking-wide text-xl">Filters Test Cases</h2>
                    <SearchField
                        label="Tag"
                        value={selectedTag}
                        onChange={setSelectedTag}
                        options={tags?.map((tag) => ({
                            label: String(tag),
                            value: String(tag),
                        }))}
                        placeholder="Select a tag"
                    />
                    <SearchField
                        label="Module"
                        value={selectedModule}
                        onChange={setSelectedModule}
                        options={modules?.map((mod) => ({
                            label: String(mod),
                            value: String(mod),
                        }))}
                        placeholder="Select a module"
                    />

                    <SearchField
                        label="Submodule"
                        value={selectedSubmodule}
                        onChange={setSelectedSubmodule}
                        options={submodules?.map((sub: string) => ({
                            label: String(sub),
                            value: String(sub),
                        }))}
                        placeholder="Select a submodule"
                        disabled={!selectedModule || isLoadingSubmodules}
                    />

                    <div className="flex items-center gap-2 flex-col w-full">

                        <div className={`flex ${isMobile ? "flex-col" : ""} md:justify-center lg:justify-center items-center gap-2 pb-2 w-full`}>
                            <button
                                onClick={handleSearch}
                                disabled={isSearchButtonDisabled || isLoading}
                                className={`bg-primary/90  w-full justify-center md:w-50 lg:w-50 px-4 py-2 shadow-md cursor-pointer font-semibold tracking-wide rounded-xl hover:bg-primary/95 text-white flex items-center gap-2
                            ${isSearchButtonDisabled ? "!bg-primary/10 !cursor-not-allowed" : ""}
                            ${isLoading ? "!bg-primary/10 !cursor-not-allowed" : ""}

                                `}
                            >
                                {isLoading ? <>
                                    <Loader className="h-5 w-5 text-xl text-primary/80 animate-spin" />
                                    <span className="text-primary/90">Searching...</span>

                                </> : (
                                    <>
                                        <FaSearch />
                                        Search
                                    </>
                                )}
                            </button>
                            {selectedTag || selectedModule || selectedSubmodule ? (
                                <button
                                    onClick={() => {
                                        setSelectedModule("");
                                        setSelectedSubmodule("");
                                        setSelectedTag("");
                                    }}
                                    className=" w-full px-4 border text-md border-primary/60 py-2 justify-center text-primary/70 flex md:w-50 lg:w-50 items-center gap-2 shadow-md cursor-pointer font-semibold tracking-wide rounded-xl"
                                >
                                    <Filter /> Clear Filters
                                </button>
                            ) : null}
                        </div>

                        <div className="flex items-center gap-2 w-full flex-wrap">
                            {selectedTag && (
                                <div className="bg-primary/85 shadow-md text-white/90 px-2 py-1 rounded-full text-sm flex items-center gap-2">
                                    <span>{selectedTag}</span>
                                    <button
                                        onClick={() => {
                                            setSelectedTag("")
                                        }
                                        }
                                        className="cursor-pointer text-white/90 hover:text-white"
                                    >
                                        <FaXmark />
                                    </button>
                                </div>
                            )}
                            {selectedModule && (
                                <div className="bg-primary/65 shadow-md text-white px-2 py-1 rounded-full text-sm flex items-center gap-1">
                                    <span>{selectedModule}</span>
                                    <button
                                        onClick={() => {
                                            setSelectedModule("")
                                        }
                                        }
                                        className="cursor-pointer text-white/90 hover:text-white"
                                    >
                                        <FaXmark />
                                    </button>
                                </div>
                            )}

                            {selectedSubmodule && (
                                <div className="bg-primary/50 shadow-md text-white px-2 py-1 rounded-full text-sm flex items-center gap-1">
                                    <span>{selectedSubmodule}</span>
                                    <button
                                        onClick={() => {
                                            setSelectedSubmodule("");
                                        }}
                                        className="cursor-pointer text-white/90 hover:text-white"
                                    >
                                        <FaXmark />
                                    </button>
                                </div>
                            )}
                        </div>
                        {availableCreators.length > 0 && (
                            <label htmlFor="created-by" className="text-sm font-medium text-primary/90 mb-1 block">
                                Filter by Created By
                            </label>
                        )}
                        {availableCreators.length > 0 && (

                            <SearchField

                                label="Created By"
                                value={selectedCreatedBy}
                                onChange={setSelectedCreatedBy}
                                options={[
                                    { label: "All", value: "All" },
                                    ...availableCreators.map(creator => ({ label: creator, value: creator }))
                                ]}
                                placeholder="Select Creator"
                                className="w-full text-primary/70"
                            />
                        )}
                        {responseData?.length > 1 && (
                            <SearchField
                                label="Search by Test Case Name"
                                value={searchTestCaseName}
                                onChange={setSearchTestCaseName}
                                options={responseData
                                    .filter(tc => typeof tc.testCaseName === "string")
                                    .map((tc) => ({
                                        label: tc.testCaseName as string,
                                        value: tc.testCaseName as string,
                                    }))}
                                placeholder="Search test case name..."
                                className="w-full"
                            />

                        )}

                    </div>
                </div>
                <div className="p-2 rounded-lg border border-primary/30">

                    {(responseData?.length > 0 && filteredTestCases.length > 0) ? (
                        <>
                            <div className="flex flex-col gap-2 mb-2">
                                <button
                                    onClick={toggleDropdown}
                                    className="border-l-4 flex w-full cursor-pointer items-center justify-between shadow-md p-2 font-semibold tracking-wide rounded-md"
                                >
                                    <span className="text-xl font-semibold tracking-wide">Test cases </span>
                                    <span className="text-primary/70">{filteredTestCases.length} results</span>
                                    {isDropdownOpenTC ? (
                                        <FaChevronUp className="" />
                                    ) : (
                                        <FaChevronDown className="" />
                                    )}
                                </button>

                                {(isDropdownOpenTC) && (
                                    <>
                                        <div className="flex justify-between gap-2 mt-2">
                                            <div className="flex items-center gap-2">
                                                <div className="flex items-center gap-2">

                                                    <Switch
                                                        id="edit-mode"
                                                        checked={editMode === 'global'}
                                                        onCheckedChange={(checked) => setEditMode && setEditMode(checked ? 'global' : 'individual')}
                                                        aria-label="Toggle Edit Mode"
                                                    />
                                                    <Label htmlFor="edit-mode" className="font-medium">
                                                        {editMode === 'global' ? 'Editing all tests' : 'Editing individual tests'}
                                                    </Label>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Checkbox
                                                id="select-all"
                                                checked={selectAllChecked}
                                                onCheckedChange={toggleSelectAll}
                                                className={`w-5 h-5 rounded-md transition-all duration-200 ${darkMode
                                                    ? "bg-white border-gray-300 text-primary focus:ring-primary hover:bg-gray-100"
                                                    : "bg-primary border-gray-600 text-white focus:ring-white hover:bg-primary/90 "}`}
                                            />
                                            <label htmlFor="select-all" className="cursor-pointer text-primary/80 text-sm">
                                                Select All
                                            </label>
                                            </div>
                                        </div>
                                        <TestCaseList testCases={filteredTestCases} selectedCases={selectedCases} toggleSelect={toggleSelect} onDataChange={onDataChangeRead}
                                            onTestCasesDataChange={onTestCasesDataChange} onRefreshAfterUpdateOrDelete={fetchInitialData}
                                            editMode={editMode} setEditMode={setEditMode}
                                        />
                                        <TestSettings
                                            onBrowserLimitChange={handleBrowserLimitChange}
                                            onHeadlessChange={handleHeadlessChange}
                                        />
                                    </>
                                )}
                            </div>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => {
                                        setExecuteRun(true);
                                        if (selectedCases.length === 0) {
                                            toast.error("Please select at least one test case");
                                            return;
                                        }
                                        executeTests(selectedTests, testData, maxBrowsers, isHeadless);
                                    }}
                                    disabled={selectedCases.length === 0 || isLoading}
                                    className={`cursor-pointer px-4 py-2 font-semibold tracking-wide mt-4 rounded-lg transition-all duration-300 ${darkMode
                                        ? "bg-white text-[#021d3d] hover:bg-gray-200"
                                        : "bg-[#021d3d] text-white hover:bg-[rgb(2,29,61)]"}
                                        ${isLoading || selectedCases.length === 0 ? "opacity-50 cursor-not-allowed" : ""}`}
                                >
                                    {isLoading ? "Executing..." : (<>
                                        <span className="flex items-center gap-2"><FiPlay /> Run Tests</span>
                                    </>)}
                                </button>


                            </div>
                            {executeRun && (
                                <TestReports stopped={stopped} testData={testData} reports={reports} idReports={idReports} progress={progress} selectedCases={selectedCases} selectedTest={selectedTests} darkMode={darkMode} />

                            )}
                        </>
                    ) : (
                        <>
                            {isLoading ? (
                                <div className="flex flex-col gap-4 justify-center items-center h-64">
                                    <div className="h-16 bg-primary/20 rounded w-full mb-2 animate-pulse"></div>
                                    <div className="h-16 bg-primary/20 rounded w-full mb-2 animate-pulse"></div>
                                    <div className="h-16 bg-primary/20 rounded w-full mb-2 animate-pulse"></div>

                                </div>
                            ) : (
                                <NoData />
                            )}

                        </>
                    )}
                </div>
            </div>
        </DashboardHeader >
    );
};

export default Home;