"use client"
import { useState, useEffect } from "react";
import { Button } from "../../components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../components/ui/select";
import { Checkbox } from "../../components/ui/checkbox";
import JsonViewer from './components/JsonViewer';
import { Submodule, Tag, TestCase, Module } from "./types";
import { DashboardHeader } from "../Layouts/main";
import TestSettings from "../components/TestSettings";
import { FaChevronDown, FaChevronUp, FaSearch } from "react-icons/fa";
import TestReports from "../components/TestReports";
import TestCaseList from "../components/TestCaseList";
import { FiPlay } from "react-icons/fi";
import { useTestExecution } from "../hooks/useTestExecution";

const Home = () => {
    const [darkMode, setDarkMode] = useState(false);
    const [modules, setModules] = useState<Module[]>([]);
    const [submodules, setSubmodules] = useState<Submodule[]>([]);
    const [tags, setTags] = useState<Tag[]>([]);
    const [testCases] = useState<TestCase[]>([]);
    const [selectedCases, setSelectedCases] = useState<string[]>([]);
    const [selectedModule, setSelectedModule] = useState<string>("");
    const [selectedSubmodule, setSelectedSubmodule] = useState<string>("");
    const [selectedTag, setSelectedTag] = useState<string>("");
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [maxBrowsers, setMaxBrowsers] = useState<number>(1)
    const [isHeadless, setIsHeadless] = useState<boolean>(true)
    const [isDropdownOpenTC, setIsDropdownOpenTC] = useState(true);
    const [testData, setTestData] = useState<{ [fieldName: string]: string }>({});
    const [responseData, setResponseData] = useState<TestCase[]>([]);

    const handleToggleDarkMode = (darkMode: boolean) => {
        setDarkMode(darkMode);
    };

    const toggleDropdown = () => {
        setIsDropdownOpenTC(!isDropdownOpenTC);
    };

    const fetchInitialData = async () => {
        setIsLoading(true);
        try {
            const response = await fetch(`${process.env.URL_API_INTEGRATION}retrieveAutomationFlow?returnUniqueValues=true`);
            const data = await response.json();
            setTags(data.response.tagName);
            setModules(data.response.moduleName);
            setSubmodules(data.response.subModuleName);
        } catch (error) {
            console.error('Error al obtener los datos', error);
        } finally {
            setIsLoading(false);
        }
    };

    const fetchModulesByTag = async (tag: any) => {
        setIsLoading(true);
        try {
            const response = await fetch(`${process.env.URL_API_INTEGRATION}retrieveAutomationFlow?returnUniqueValues=true&tagName=${tag}`);
            const data = await response.json();
            setModules(data.response.moduleName);
        } catch (error) {
            console.error('Error al obtener los módulos para el tag', error);
        } finally {
            setIsLoading(false);
        }
    };

    const fetchSubModulesByModule = async (mod: any) => {
        setIsLoading(true);
        try {
            const response = await fetch(`${process.env.URL_API_INTEGRATION}retrieveAutomationFlow?returnUniqueValues=true&moduleName=${mod}`);
            const data = await response.json();
            setSubmodules(data.response.subModuleName);
        } catch (error) {
            console.error('Error al obtener los subMódulos para el module', error);
        } finally {
            setIsLoading(false);
        }
    };

    const {
        reports,
        loading,
        progress,
        executeTests,
        idReports
    } = useTestExecution();

    useEffect(() => {
        fetchInitialData();
    }, []);

    useEffect(() => {
        setResponseData([]);
    }, [selectedTag, selectedModule, selectedSubmodule]);

    useEffect(() => {
        if (selectedTag) {
            fetchModulesByTag(selectedTag);
        }
    }, [selectedTag]);

    useEffect(() => {
        if (selectedModule) {
            fetchSubModulesByModule(selectedModule);
        }
    }, [selectedModule]);

    useEffect(() => {
        setSelectedSubmodule("");
    }, [selectedModule]);

    useEffect(() => {
        setSelectedModule("");
    }, [selectedTag]);

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

            setResponseData(data.response);

        } catch (error) {
            console.error('Error al obtener los datos', error);
            setResponseData([]);
        } finally {
            setIsLoading(false);
        }
    };


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
    const selectAllChecked = responseData.length > 0 && selectedCases.length === responseData.length;

    const isSearchButtonDisabled = !(selectedTag || selectedModule);

    return (
        <DashboardHeader onToggleDarkMode={handleToggleDarkMode}>
            <div className="w-full p-4 flex flex-col gap-4 justify-center mx-auto text-[#051d3d]">
                <div className="flex flex-wrap gap-4 mb-4 mt-2">
                    <h2 className="font-semibold tracking-wide text-xl">Filters Test Cases</h2>
                    <Select value={selectedTag} onValueChange={setSelectedTag}>
                        <SelectTrigger className="min-w-[200px]">
                            <SelectValue placeholder="Tag" />
                        </SelectTrigger>
                        <SelectContent>
                            {tags.map((tag: any, index) => (
                                <SelectItem key={index} value={tag}>
                                    {tag}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <Select value={selectedModule} onValueChange={setSelectedModule}>
                        <SelectTrigger className="min-w-[200px]">
                            <SelectValue placeholder="Module" />
                        </SelectTrigger>
                        <SelectContent>
                            {modules.map((mod: any, index) => (
                                <SelectItem key={index} value={mod}>
                                    {mod}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <Select value={selectedSubmodule} disabled={!selectedModule} onValueChange={setSelectedSubmodule}>
                        <SelectTrigger className="min-w-[200px]">
                            <SelectValue placeholder="Submodule" />
                        </SelectTrigger>
                        <SelectContent>
                            {submodules.map((sub: any, index) => (
                                <SelectItem key={index} value={sub}>
                                    {sub}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <div className="flex lg:flex-row flex-wrap items-center gap-2">
                        <Button
                            onClick={handleSearch}
                            disabled={isSearchButtonDisabled}
                            className="bg-[#021d3d]/90 font-semibold tracking-wide hover:bg-[#021d3d]/95 text-white flex items-center gap-2"
                        >
                            {isLoading ? "Searching..." : (
                                <>
                                    <FaSearch />
                                    Search
                                </>
                            )}
                        </Button>
                        <Button
                            variant="outline"
                            onClick={() => {
                                setSelectedModule("");
                                setSelectedSubmodule("");
                                setSelectedTag("");
                            }}
                            className="ml-2 font-semibold tracking-wide"
                        >
                            Clear Filters
                        </Button>
                        <div className="flex flex-wrap gap-2">
                        {selectedTag && (
                                <div className="bg-[#021d3d]/20 text-[#021d3d]/80 px-2 py-1 rounded-full text-sm flex items-center gap-2">
                                    <span>{selectedTag}</span>
                                    <button
                                        onClick={() => {
                                            setSelectedTag("")
                                        }
                                        }
                                        className="text-[#021d3d]/80 hover:text-[#021d3d]/80"
                                    >
                                        ×
                                    </button>
                                </div>
                            )}
                            {selectedModule && (
                                <div className="bg-[#021d3d]/10 text-[#021d3d]/80 px-2 py-1 rounded-full text-sm flex items-center gap-1">
                                    <span>{selectedModule}</span>
                                    <button
                                        onClick={() => {
                                            setSelectedModule("")
                                        }
                                        }
                                        className="text-[#021d3d]/60 hover:text-[#021d3d]/80"
                                    >
                                        ×
                                    </button>
                                </div>
                            )}

                            {selectedSubmodule && (
                                <div className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-sm flex items-center gap-1">
                                    <span>{selectedSubmodule}</span>
                                    <button
                                        onClick={() => {
                                            setSelectedSubmodule("");
                                        }}
                                        className="text-green-600 hover:text-green-800"
                                    >
                                        ×
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
                <div className="border p-4 rounded-lg">
                    {(Array.isArray(responseData) && responseData.length > 0) ? (
                        <>
                            <div className="flex flex-col gap-2 mb-2">
                                <button
                                    onClick={toggleDropdown}
                                    className="flex w-full items-center justify-between shadow-md p-2 font-semibold tracking-wide rounded-md"
                                >
                                    <span className="text-xl">Test cases </span>
                                    {isDropdownOpenTC ? (
                                        <FaChevronUp className="" />
                                    ) : (
                                        <FaChevronDown className="" />
                                    )}
                                </button>

                                {isDropdownOpenTC && (
                                    <>
                                        <div className="flex justify-end gap-2 mt-2">
                                            <Checkbox
                                                id="select-all"
                                                checked={selectAllChecked}
                                                onCheckedChange={toggleSelectAll}
                                                className={`w-5 h-5 rounded-md transition-all duration-200 ${darkMode
                                                    ? "bg-white border-gray-300 text-[#021d3d] focus:ring-[#021d3d] hover:bg-gray-100"
                                                    : "bg-[#1f2937] border-gray-600 text-white focus:ring-white hover:bg-gray-700 "}`}
                                            />
                                            <label htmlFor="select-all" className="cursor-pointer">
                                                Select All
                                            </label>
                                        </div>
                                        <TestCaseList testCases={responseData} selectedCases={selectedCases} toggleSelect={toggleSelect} onDataChange={onDataChangeRead}/>
                                        <TestSettings
                                            onBrowserLimitChange={handleBrowserLimitChange}
                                            onHeadlessChange={handleHeadlessChange}
                                        />
                                    </>
                                )}
                            </div>
                            <button
                                onClick={() => {                                    
                                    const selectedTests: any = responseData.filter((tc: any) =>
                                        selectedCases.includes(tc.testCaseId)
                                    );
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
                            <TestReports reports={reports} idReports={idReports} progress={progress} selectedCases={selectedCases} darkMode={darkMode} />
                        </>
                    ) : (
                        <>
                            <h3>No data</h3>
                        </>
                    )}
                </div>
            </div>
        </DashboardHeader>
    );
};

export default Home;