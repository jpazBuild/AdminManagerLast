"use client";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { FaPlus } from "react-icons/fa";
import { DashboardHeader } from "../../Layouts/main";
import { ChevronLeft } from "lucide-react";
import Link from "next/link";
import TextInputWithClearButton from "@/app/components/InputClear";
import { SelectField } from "@/app/components/SelectField";
import { toast } from "sonner";
import { TOKEN_API } from "@/config";

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
            // ✅ Verificar conexión antes de hacer fetch
            if (!navigator.onLine) {
                toast.error("You are offline. Please check your internet connection.");
                return;
            }

            // const response = await fetch(
            //     `${process.env.URL_API_INTEGRATION}retrieveAutomationFlow?returnUniqueValues=`,
            //     {
            //         method: "GET",
            //         cache: "no-store",
            //     }
            // );


            const myHeaders = new Headers();
            myHeaders.append("Content-Type", "application/json");
            myHeaders.append("authorization", "Bearer eyJwcm92aWRlciI6IkhPTUVfQ1UiLCJ0b2tlbiI6ImFUVlRhR1pwZERkclZrNVVWak5vT2xGRE1GVXlRVXhFV2pCQmJWZE1Sblp4WW0xUyJ9");

            const requestOptions = {
                method: "GET",
                headers: myHeaders,
                redirect: "follow" as RequestRedirect
            };

            const response = await fetch("https://blossom-integrations-hub-development.blossomdev.com/dev/v2/automation/flow/retrieveAutomationFlow?returnUniqueValues=true", requestOptions)
            console.log("Response Full:", response);

            if (!response.ok) {
                throw new Error(`Error ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();
            const allModulesData = data.allModules;
            const modules: string[] = allModulesData.map((module: Module) => module.moduleName);
            const uniqueModules = [...new Set(modules)].sort();
            setModulesList(uniqueModules);
        } catch (error) {
            console.error("Error fetching modules:", error);

            if (!navigator.onLine) {
                toast.error("No internet connection. Please reconnect and try again.");
            } else if (error instanceof TypeError && error.message.includes("Failed to fetch")) {
                toast.error("Connection error. Server may be down or blocked.");
            } else if (error instanceof Error) {
                toast.error(error.message);
            } else {
                toast.error("An unknown error occurred while fetching modules.");
            }
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

        try {
            if (!navigator.onLine) {
                toast.error("You are offline. Please check your internet connection.");
                return;
            }
            console.log("Submitting form with activeField:", activeField);
            
            const myHeaders = new Headers();
            myHeaders.append("Content-Type", "application/json");
            myHeaders.append("authorization", "Bearer eyJwcm92aWRlciI6IkhPTUVfQ1UiLCJ0b2tlbiI6ImFUVlRhR1pwZERkclZrNVVWak5vT2xGRE1GVXlRVXhFV2pCQmJWZE1Sblp4WW0xUyJ9");

            const requestOptions = {
                method: "GET",
                headers: myHeaders,
                redirect: "follow" as RequestRedirect
            };

            const responseFull = await fetch("https://blossom-integrations-hub-development.blossomdev.com/dev/v2/automation/flow/retrieveAutomationFlow?returnUniqueValues=true", requestOptions)
            console.log("Response Full:", responseFull);
            
            // .then((response) => response.text())
            // .then((result) => console.log(result))
            // .catch((error) => console.error(error));
            // const responseFull = await fetch(
            //     `${process.env.URL_API_INTEGRATION}retrieveAutomationFlow?returnUniqueValues=false`,
            //     {
            //         method: "GET",
            //         headers: {
            //             "Content-Type": "application/json",
            //             Authorization: `Bearer ${TOKEN_API}`
            //         },
            //     }
            // );

            if (!responseFull.ok) {
                throw new Error(`Error ${responseFull.status}: ${responseFull.statusText}`);
            }

            const responseJson = await responseFull.json();
            const allModulesResponse = responseJson.allModules;

            let apiUrl = "";
            let bodyData = {};

            if (activeField === "tag" && tag) {
                apiUrl = `${process.env.URL_API_INTEGRATION}createTag`;
                bodyData = { name: tag, createdBy: "adminManager" };
            } else if (activeField === "module" && module) {
                apiUrl = `${process.env.URL_API_INTEGRATION}createModule`;
                bodyData = { name: module, createdBy: "adminManager" };
            } else if (activeField === "submodule" && submodule && module) {
                const moduleId = allModulesResponse.find(
                    (m: { moduleName: string; id: number }) => m.moduleName === module
                )?.id;

                if (!moduleId) {
                    toast.error("Module ID not found for selected module.");
                    return;
                }

                apiUrl = `${process.env.URL_API_INTEGRATION}createSubModule`;
                bodyData = {
                    moduleId,
                    name: submodule,
                    createdBy: "adminManager",
                };
            } else {
                toast.error("Please fill out the form correctly before submitting.");
                return;
            }

            const response = await fetch(apiUrl, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json; charset=utf-8",
                },
                body: JSON.stringify(bodyData),
            });

            const data = await response.json();

            if (!response.ok) {
                toast.error(data?.message || `HTTP Error: ${response.status}`);
                setResponseMessage(data?.message || "An error occurred.");
                return;
            }

            toast.success("The entry was created successfully!");
            setResponseMessage("The entry was created successfully!");
        } catch (error) {
            console.error("Error during form submission:", error);

            if (!navigator.onLine) {
                toast.error("No internet connection. Please reconnect and try again.");
            } else if (error instanceof TypeError && error.message.includes("Failed to fetch")) {
                toast.error(
                    "Connection failed. The server might be down or not allowing cross-origin requests (CORS)."
                );
            } else if (error instanceof Error) {
                toast.error(error.message || "An unexpected error occurred.");
                setResponseMessage(error.message);
            } else {
                toast.error("Unexpected error occurred. Please try again.");
                setResponseMessage("Unexpected error occurred. Please try again.");
            }
        } finally {
            setIsLoading(false);
        }
    };

    const options = [
        { id: "tagRadio", label: "Tag", value: "tag" },
        { id: "moduleRadio", label: "Module", value: "module" },
        { id: "submoduleRadio", label: "Submodule", value: "submodule" },
    ];

    const moduleOptions = modulesList.map((mod) => ({
        value: mod,
        label: mod,
    }));

    return (
        <DashboardHeader>
            <div className="w-full p-4 flex flex-col gap-4 justify-center mx-auto">
                <Link
                    href="/home"
                    className="flex items-center text-primary/80 hover:text-primary transition"
                >
                    <ChevronLeft className="w-5 h-5 mr-1" />
                    Back to Run Test
                </Link>
                <h2 className="font-semibold tracking-wide text-xl">Create New Entry</h2>


                <div className="flex flex-wrap gap-4">
                    {options.map(({ id, label, value }) => (
                        <div key={id} className="flex items-center gap-2">
                            <input
                                type="radio"
                                id={id}
                                name="fieldToggle"
                                value={value}
                                checked={activeField === value}
                                onChange={() => handleRadioChange(value)}
                                className="accent-primary"
                            />
                            <label htmlFor={id} className="text-[#223853] font-medium">
                                {label}
                            </label>
                        </div>
                    ))}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div className="flex flex-col gap-2">
                        <TextInputWithClearButton
                            label="Tag"
                            id="tag"
                            type="text"
                            value={tag}
                            onChangeHandler={(e) => setTag(e.target.value)}
                            placeholder="Enter Tag"
                            disabled={activeField !== "tag"}
                        />
                    </div>

                    <div className="flex flex-col gap-2">
                        {activeField === "submodule" ? (

                            <SelectField
                                label="Module"
                                value={String(module)}
                                onChange={(value: string) => setModule(value)}
                                options={moduleOptions}
                                placeholder="Select number of browsers"
                            />
                        ) : (
                            <div className="flex flex-col gap-2">
                                <TextInputWithClearButton
                                    id="module"
                                    label="Module"
                                    type="text"
                                    value={module}
                                    onChangeHandler={(e) => setModule(e.target.value)}
                                    placeholder="Enter Module"
                                    disabled={activeField !== "module"}
                                />
                            </div>
                        )}
                    </div>
                    <div>
                        <TextInputWithClearButton
                            label="Submodule"
                            id="submodule"
                            type="text"
                            value={submodule}
                            onChangeHandler={(e) => setSubmodule(e.target.value)}
                            placeholder="Enter Submodule"
                            disabled={activeField !== "submodule" || !module}
                        />
                        {activeField === "submodule" && !module && (
                            <p className="text-red-500 text-sm">Select a module to enable the Submodule field.</p>
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
                    className={`w-full md:w-auto font-semibold tracking-wide mt-4 rounded-lg transition-all duration-300 ${isLoading || !isFormValid ? "opacity-50 cursor-not-allowed text-white" : "bg-primary/80 text-white hover:bg-primary/90"}`}
                >
                    {isLoading ? "Creating..." : <><FaPlus /> Create</>}
                </Button>
            </div>
        </DashboardHeader>
    );
};

export default CreateForm;
