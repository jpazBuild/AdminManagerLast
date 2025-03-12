"use client";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { FaPlus } from "react-icons/fa";
import { DashboardHeader } from "../../Layouts/main";

const CreateForm = () => {
    const [tag, setTag] = useState<string>("");
    const [module, setModule] = useState<string>("");
    const [submodule, setSubmodule] = useState<string>("");
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [activeField, setActiveField] = useState<string>("");
    const [modulesList, setModulesList] = useState<string[]>([]);
    const [responseMessage, setResponseMessage] = useState<string>("");
    const [isDropdownOpen, setIsDropdownOpen] = useState(false); 

    const isFormValid =
        (activeField === "tag" && tag.length > 3) ||
        (activeField === "module" && module.length > 0) ||
        (activeField === "submodule" && submodule.length > 3 && module.length > 0);

        console.log("process.env.URL_API_INTEGRATION ",process.env.URL_API_INTEGRATION);
        
    useEffect(() => {
        if (activeField === "submodule") {
            fetchModules();
        }
    }, [activeField]);

    const handleDropdownToggle = () => {
        setIsDropdownOpen(!isDropdownOpen);
        if (!isDropdownOpen) {
            fetchModules();
        }
    };

    const fetchModules = async () => {
        interface Module {
            id: string;
            moduleName: string;
            createdBy: string;
            createdAt: string;
            updatedAt: string;
        }
        try {
            const response = await fetch(`${process.env.URL_API_INTEGRATION}retrieveAutomationFlow?returnUniqueValues=`, {
                method: "GET",
                cache: "no-store",
            });

            if (!response.ok) {
                throw new Error(`Error ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();
            const allModulesData = data.allModules;
            const modules: string[] = allModulesData.map((module: Module) => module.moduleName);
            const uniqueModules = [...new Set(modules as string[])].sort();
            setModulesList(uniqueModules);
        } catch (error) {
            console.error("Error al obtener módulos:", error);
            alert("No se pudieron cargar los módulos. Intente de nuevo más tarde.");
        }
    };

    const resetForm = () => {
        setTag("");
        setModule("");
        setSubmodule("");
        setResponseMessage("");
    };

    const handleRadioChange = (field: string) => {
        resetForm();
        setActiveField(field);
        if (field === "submodule") {
            fetchModules();
        }
    };

    const handleSubmit = async () => {
        setIsLoading(true);
        setResponseMessage(""); 


        const responseFull = await fetch(`${process.env.URL_API_INTEGRATION}retrieveAutomationFlow?returnUniqueValues=false`, {
            method: "GET",
        });

        let apiUrl = "";
        let bodyData = {};

        if (activeField === "tag" && tag) {
            apiUrl = `${process.env.URL_API_INTEGRATION}createTag`;
            bodyData = { "name" : tag, "createdBy": "adminManager" };

        } else if (activeField === "module" && module) {
            apiUrl = `${process.env.URL_API_INTEGRATION}createModule`;
            bodyData = { "name" : module, "createdBy": "adminManager" };

        } else if (activeField === "submodule" && submodule && module) {
            apiUrl = `${process.env.URL_API_INTEGRATION}createSubModule`;

            const responseJson = await responseFull.json();

            const allModulesResponse = responseJson.allModules;
            const moduleId = allModulesResponse.find((m: { moduleName: string; id: number }) => m.moduleName === module)?.id;
            bodyData = { "moduleId" : moduleId, "name" : submodule, "createdBy":"adminManager" };
        }

        try {
            const response = await fetch(apiUrl, {
                method: "POST",
                headers: {
                    'Content-Type': 'application/json; charset=utf-8',
                },
                body: JSON.stringify(bodyData),
            });
            
            const data = await response.json();

            if (!response.ok) {
                setResponseMessage(data?.message || `Error HTTP: ${response.status}`);
                return;
            }
            setResponseMessage("The entry was created successfully!");

        } catch (error) {
            console.error("Error during POST request:", error);
            if (error instanceof Error) {
                setResponseMessage(error.message || "An error occurred. Please try again.");
            } else {
                setResponseMessage("An error occurred. Please try again.");
            }
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <DashboardHeader>
            <div className="w-full p-4 flex flex-col gap-4 justify-center mx-auto">
                <h2 className="font-semibold tracking-wide text-xl">Create New Entry</h2>

                <div className="flex flex-wrap gap-4">
                    <div className="flex items-center gap-2">
                        <input
                            type="radio"
                            id="tagRadio"
                            name="fieldToggle"
                            checked={activeField === "tag"}
                            onChange={() => handleRadioChange("tag")}
                        />
                        <label htmlFor="tagRadio">Tag</label>
                    </div>

                    <div className="flex items-center gap-2">
                        <input
                            type="radio"
                            id="moduleRadio"
                            name="fieldToggle"
                            checked={activeField === "module"}
                            onChange={() => handleRadioChange("module")}
                        />
                        <label htmlFor="moduleRadio">Module</label>
                    </div>

                    <div className="flex items-center gap-2">
                        <input
                            type="radio"
                            id="submoduleRadio"
                            name="fieldToggle"
                            checked={activeField === "submodule"}
                            onChange={() => handleRadioChange("submodule")}
                        />
                        <label htmlFor="submoduleRadio">Submodule</label>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div className="flex flex-col gap-2">
                        <label htmlFor="tag" className="font-semibold">Tag</label>
                        <input
                            id="tag"
                            type="text"
                            value={tag}
                            onChange={(e) => setTag(e.target.value)}
                            placeholder="Enter Tag"
                            className="border px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#021d3d] transition-all w-full"
                            disabled={activeField !== "tag"}
                        />
                    </div>

                    <div className="flex flex-col gap-2">
                        <label htmlFor="module" className="font-semibold">Module</label>
                        {activeField === "submodule" ? (
                            <select
                                id="module"
                                value={module}
                                onChange={(e) => setModule(e.target.value)}
                                onFocus={handleDropdownToggle}
                                className="border px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#021d3d] transition-all w-full"
                            >
                                <option value="">Select a Module</option>
                                {modulesList.map((mod) => (
                                    <option key={mod} value={mod}>{mod}</option>
                                ))}
                            </select>
                        ) : (
                            <input
                                id="module"
                                type="text"
                                value={module}
                                onChange={(e) => setModule(e.target.value)}
                                placeholder="Enter Module"
                                className="border px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#021d3d] transition-all w-full"
                                disabled={activeField !== "module"}
                            />
                        )}
                    </div>

                    <div className="flex flex-col gap-2">
                        <label htmlFor="submodule" className="font-semibold">Submodule</label>
                        <input
                            id="submodule"
                            type="text"
                            value={submodule}
                            onChange={(e) => setSubmodule(e.target.value)}
                            placeholder="Enter Submodule"
                            className="border px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#021d3d] transition-all w-full"
                            disabled={activeField !== "submodule" || !module}
                        />
                        {activeField === "submodule" && !module && (
                            <p className="text-red-500 text-sm">Seleccione un módulo para habilitar el campo Submodule.</p>
                        )}
                    </div>
                </div>

                {/* Response Message */}
                {responseMessage && (
                    <div className={`mt-4 text-sm ${responseMessage.includes("successfully") ? "text-green-600" : "text-red-600"}`}>
                        {responseMessage}
                    </div>
                )}

                <Button
                    onClick={handleSubmit}
                    disabled={!isFormValid || isLoading}
                    className={`w-full md:w-auto font-semibold tracking-wide mt-4 rounded-lg transition-all duration-300 ${isLoading || !isFormValid ? "opacity-50 cursor-not-allowed" : "bg-[#021d3d] text-white hover:bg-[rgb(2,29,61)]"}`}
                >
                    {isLoading ? "Creating..." : <><FaPlus /> Create</>}
                </Button>
            </div>
        </DashboardHeader>
    );
};

export default CreateForm;
