"use client"
import { useState, useEffect, useMemo } from "react";
import { Button } from "../../components/ui/button";
import { Checkbox } from "../../components/ui/checkbox";
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
import { TOKEN_API } from "@/config";
import TextInputWithClearButton from "../components/InputClear";
import SearchTestCaseComboBox from "../components/SearchTestCaseComboBox";
import { useTagsModules } from "../hooks/useTagsModules";
import { FaXmark } from "react-icons/fa6";

const Home = () => {
    const [darkMode, setDarkMode] = useState(false);
    // const [modules, setModules] = useState<Module[]>([]);
    // const [submodules, setSubmodules] = useState<Submodule[]>([]);
    // const [tags, setTags] = useState<Tag[]>([]);
    const [selectedCases, setSelectedCases] = useState<string[]>([]);
    // const [selectedModule, setSelectedModule] = useState<string>("");
    // const [selectedSubmodule, setSelectedSubmodule] = useState<string>("");
    // const [selectedTag, setSelectedTag] = useState<string>("");
    // const [isLoading, setIsLoading] = useState<boolean>(false);
    const [maxBrowsers, setMaxBrowsers] = useState<number>(1)
    const [isHeadless, setIsHeadless] = useState<boolean>(true)
    const [isDropdownOpenTC, setIsDropdownOpenTC] = useState(true);
    const [testData, setTestData] = useState<any>();
    const [responseData, setResponseData] = useState<TestCase[]>([]);
    const [selectedCreatedBy, setSelectedCreatedBy] = useState("");
    const [availableCreators, setAvailableCreators] = useState<string[]>([]);
    const [testCasesUpdated, setTestCasesUpdated] = useState<TestCase[]>([]);
    // const [isLoadingSubmodules, setIsLoadingSubmodules] = useState<boolean>(false);
    const [executeRun, setExecuteRun] = useState(false);
    const [searchTestCaseName, setSearchTestCaseName] = useState("");

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
    // const BASE_URL = process.env.URL_API_INTEGRATION;
    // const AUTH_HEADER = {
    //     headers: { Authorization: `Bearer ${TOKEN_API}` },
    // };

    // const fetchInitialData = async () => {
    //     setIsLoading(true);
    //     try {
    //         const params = new URLSearchParams({ returnUniqueValues: "true" });
    //         const response = await fetch(`${BASE_URL}retrieveAutomationFlow?${params}`, AUTH_HEADER);
    //         const data = await response.json();

    //         setTags(data.response?.tagName || []);
    //         setModules(data.response?.moduleName || []);
    //         setSubmodules(data.response?.subModuleName || []);
    //     } catch (error) {
    //         console.error("Error al obtener los datos iniciales", error);
    //     } finally {
    //         setIsLoading(false);
    //     }
    // };

    // const fetchModulesByTag = async (tag: string) => {
    //     if (!tag) return;
    //     setIsLoading(true);
    //     try {
    //         const params = new URLSearchParams({ returnUniqueValues: "true", tagName: tag });
    //         const response = await fetch(`${BASE_URL}retrieveAutomationFlow?${params}`, AUTH_HEADER);
    //         const data = await response.json();
    //         setModules(data.response?.moduleName || []);
    //     } catch (error) {
    //         console.error("Error al obtener los módulos para el tag", error);
    //     } finally {
    //         setIsLoading(false);
    //     }
    // };

    // const fetchSubModulesByModule = async () => {
    //     if (!selectedTag && !selectedModule) return;
    //     setIsLoadingSubmodules(true);
    //     try {
    //         const params = new URLSearchParams();
    //         if (selectedTag) params.append("tagName", selectedTag);
    //         if (selectedModule) params.append("moduleName", selectedModule);

    //         const response = await fetch(`${BASE_URL}retrieveAutomationFlow?${params}`);
    //         const data = await response.json();

    //         const uniqueSubmodules = Array.from(
    //             new Set(
    //                 (data.response || [])
    //                     .map((item: any) => item.subModuleName)
    //                     .filter(Boolean)
    //             )
    //         );

    //         setSubmodules(uniqueSubmodules as Submodule[]);
    //     } catch (error) {
    //         console.error("Error al obtener los submódulos para el módulo", error);
    //     } finally {
    //         setIsLoadingSubmodules(false);
    //     }
    // };



    // useEffect(() => {
    //     fetchInitialData();
    // }, []);

    // useEffect(() => {
    //     setResponseData([]);
    // }, [selectedTag, selectedModule, selectedSubmodule]);

    // useEffect(() => {
    //     if (selectedTag) {
    //         fetchModulesByTag(selectedTag);
    //     }
    // }, [selectedTag]);

    // useEffect(() => {
    //     if (selectedModule) {
    //         fetchSubModulesByModule();
    //     }
    // }, [selectedModule]);

    // useEffect(() => {
    //     setSelectedSubmodule("");
    // }, [selectedModule]);

    // useEffect(() => {
    //     setSelectedModule("");
    // }, [selectedTag]);

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
        }finally {
            setIsLoading(false);
        }
    };

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

    // const filteredTestCases = useMemo(() => {
    //     if (!selectedCreatedBy || selectedCreatedBy === "All") return responseData;
    //     return responseData.filter((tc: TestCase) => tc?.createdBy?.toLowerCase() === selectedCreatedBy?.toLowerCase());
    // }, [responseData, selectedCreatedBy]);
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
                <div className="flex flex-wrap gap-4 mb-4 mt-2">
                    <h2 className="font-semibold tracking-wide text-xl">Filters Test Cases</h2>
                    <SearchField
                        label="Tag"
                        value={selectedTag}
                        onChange={setSelectedTag}
                        options={tags?.map((tag) => ({
                            label: String(tag),
                            value: String(tag),
                        }))}
                        placeholder="Tag"
                    />
                    <SearchField
                        label="Module"
                        value={selectedModule}
                        onChange={setSelectedModule}
                        options={modules?.map((mod) => ({
                            label: String(mod),
                            value: String(mod),
                        }))}
                        placeholder="Module"
                    />

                    <SearchField
                        label="Submodule"
                        value={selectedSubmodule}
                        onChange={setSelectedSubmodule}
                        options={submodules?.map((sub: string) => ({
                            label: String(sub),
                            value: String(sub),
                        }))}
                        placeholder="Submodule"
                        disabled={!selectedModule || isLoadingSubmodules}
                    />

                    <div className="flex items-center gap-2 w-full flex-col">

                        <div className="flex items-center gap-2 pb-2 w-full justify-center">
                            <Button
                                onClick={handleSearch}
                                disabled={isSearchButtonDisabled || isLoading}
                                className={`bg-primary/90 shadow-md font-semibold tracking-wide rounded-xl hover:bg-primary/95 text-white flex items-center gap-2
                            ${isSearchButtonDisabled ? "opacity-50 cursor-not-allowed" : ""}
                            ${isLoading ? "opacity-50 cursor-not-allowed" : ""}

                                `}
                            >
                                {isLoading ? "Searching..." : (
                                    <>
                                        <FaSearch />
                                        Search
                                    </>
                                )}
                            </Button>
                            {selectedTag || selectedModule || selectedSubmodule ? (
                                <Button
                                    variant="outline"
                                    onClick={() => {
                                        setSelectedModule("");
                                        setSelectedSubmodule("");
                                        setSelectedTag("");
                                    }}
                                    className="ml-2 shadow-md font-semibold tracking-wide rounded-xl"
                                >
                                    Clear Filters
                                </Button>
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
                                        className="text-white/90 hover:text-white"
                                    >
                                        <FaXmark/>
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
                                        className="text-white/90 hover:text-white"
                                    >
                                        <FaXmark/>
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
                                        className="text-white/90 hover:text-white"
                                    >
                                        <FaXmark/>
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
                            <SelectField
                                value={selectedCreatedBy}
                                onChange={setSelectedCreatedBy}
                                options={[
                                    { label: "All", value: "All" },
                                    ...availableCreators.map(creator => ({ label: creator, value: creator }))
                                ]}
                                placeholder="Created By"
                                className="text-primary"

                            />
                        )}
                        {responseData?.length > 1 && (

                            <SearchTestCaseComboBox
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
                <div className="border p-2 rounded-lg">

                    {(responseData?.length > 0 && filteredTestCases.length > 0) ? (
                        <>
                            <div className="flex flex-col gap-2 mb-2">
                                <button
                                    onClick={toggleDropdown}
                                    className="flex w-full items-center justify-between shadow-md p-2 font-semibold tracking-wide rounded-md"
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
                                        <div className="flex justify-end gap-2 mt-2">
                                            <Checkbox
                                                id="select-all"
                                                checked={selectAllChecked}
                                                onCheckedChange={toggleSelectAll}
                                                className={`w-5 h-5 rounded-md transition-all duration-200 ${darkMode
                                                    ? "bg-white border-gray-300 text-primary focus:ring-primary hover:bg-gray-100"
                                                    : "bg-primary border-gray-600 text-white focus:ring-white hover:bg-primary/90 "}`}
                                            />
                                            <label htmlFor="select-all" className="cursor-pointer">
                                                Select All
                                            </label>
                                        </div>
                                        <TestCaseList testCases={filteredTestCases} selectedCases={selectedCases} toggleSelect={toggleSelect} onDataChange={onDataChangeRead}
                                            onTestCasesDataChange={onTestCasesDataChange} onRefreshAfterUpdateOrDelete={fetchInitialData}
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
                                    className={`px-4 py-2 font-semibold tracking-wide mt-4 rounded-lg transition-all duration-300 ${darkMode
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