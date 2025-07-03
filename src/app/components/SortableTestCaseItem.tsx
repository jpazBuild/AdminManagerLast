// import React, { useState } from "react";
// import {
//     AccordionItem,
//     AccordionTrigger,
//     AccordionContent,
// } from "@/components/ui/accordion";
// import { Button } from "@/components/ui/button";
// import { Eye, File } from "lucide-react";
// import { Checkbox } from "@/components/ui/checkbox";
// import { Label } from "@/components/ui/label";
// import { SearchField } from "./SearchField";
// import CopyToClipboard from "./CopyToClipboard";
// import StepActions from "./StepActions";
// import InteractionItem from "./Interaction";
// import TestCaseActions from "./TestCaseActions";
// import { FakerInputWithAutocomplete } from "./FakerInput";
// import { toast } from "sonner";
// import { handleAxiosRequest } from "@/utils/handleAxiosRequest";
// import axios from "axios";
// import { TOKEN_API } from "@/config";

// interface TestStep {
//     action: string;
//     indexStep: number;
//     data: {
//         attributes: {
//             value?: string;
//             [key: string]: string | number | boolean | undefined | Record<string, unknown>;
//         };
//         [key: string]: unknown;
//     };
// }

// interface TestCase {
//     subModuleName?: string;
//     moduleName?: string;
//     testCaseName?: string;
//     testCaseId?: string;
//     stepsData?: TestStep[];
//     jsonSteps?: TestStep[];
//     tagName?: string;
//     contextGeneral?: {
//         data?: {
//             url?: string;
//         };
//     };
//     createdBy?: string;
//     createdAt?: string;
// }

// interface Props {
//     test: TestCase;
//     index: number;
//     selectedCases: string[];
//     toggleSelect: (id: string) => void;
//     tags: string[];
//     modules: string[];
//     submodules: string[];
//     isLoadingSubmodules: boolean;
//     setOpenItems: React.Dispatch<React.SetStateAction<string[]>>;
//     openItems: string[];
//     viewMode: string;
//     setViewMode: React.Dispatch<React.SetStateAction<'data' | 'steps' | 'editLocation'>>;
//     handleUpdateTestCase: (test: TestCase) => void;
//     handleDeleteTestCase: (testId: string) => void;
//     setTestCasesData: React.Dispatch<React.SetStateAction<TestCase[]>>;
//     testCasesData: TestCase[];
//     getFieldValue: (id: string, field: string) => string;
//     handleValueChange: (field: string, value: string, id: string) => void;
//     testFields: string[];
//     onRefreshAfterUpdateOrDelete: () => void;
//     dynamicValues: any[];
//     setDynamicValues: React.Dispatch<React.SetStateAction<any[]>>;
// }

// const SortableTestCaseItem: React.FC<Props> = ({
//     test,
//     index,
//     selectedCases,
//     toggleSelect,
//     tags,
//     modules,
//     submodules,
//     isLoadingSubmodules,
//     setOpenItems,
//     openItems,
//     viewMode,
//     setViewMode,
//     // handleUpdateTestCase,
//     // handleDeleteTestCase,
//     setTestCasesData,
//     testCasesData,
//     getFieldValue,
//     handleValueChange,
//     testFields,
//     onRefreshAfterUpdateOrDelete,
//     dynamicValues,
//     setDynamicValues,
// }) => {
//     const [editTag, setEditTag] = useState(test.tagName || "");
//     const [editModule, setEditModule] = useState(test.moduleName || "");
//     const [editSubmodule, setEditSubmodule] = useState(test.subModuleName || "");

//     const currentTestCase = testCasesData.find(tc => tc?.testCaseId === test?.testCaseId);
//     const steps = currentTestCase?.stepsData ?? [];

//     // const onUpdate = (updated: TestCase) => {
//     //     handleUpdateTestCase(updated);
//     // };
//     // const handleDeleteTestCase = async (testCaseId: string) => {
//     //     const res = await handleAxiosRequest(() =>
//     //         axios.delete(`${process.env.URL_API_INTEGRATION?.replace(/\/+$/, "")}/deleteAutomationFlow`, {
//     //             data: { testCaseId },
//     //             headers: {
//     //                 "Content-Type": "application/json",
//     //                 Authorization: `Bearer ${TOKEN_API}`
//     //             },
//     //         }),
//     //         "Test case deleted successfully"
//     //     );

//     //     if (res) {
//     //         setTestCasesData(prev => prev.filter(tc => tc.testCaseId !== testCaseId));
//     //         setDynamicValues(prev => prev.filter(val => val.id !== testCaseId));
//     //         onRefreshAfterUpdateOrDelete();
//     //     }
//     // };

//     // const handleUpdateTestCase = async (test: TestCase) => {
//     //     console.log("Updating test case:", test);
//     //     // if (selectedTag) test.tagName = selectedTag;
//     //     // if (selectedModule) test.moduleName = selectedModule;
//     //     // if (selectedSubmodule) test.subModuleName = selectedSubmodule;
//     //     console.log("Updating test case updated:", test);
//     //     // try {
//     //     //     const url = `${process.env.URL_API_INTEGRATION?.replace(/\/+$/, "")}/updateAutomationFlow`;

//     //     //     const response = await axios.put(url, test, {
//     //     //         headers: {
//     //     //             "Content-Type": "application/json",
//     //     //             Authorization: `Bearer ${TOKEN_API}`
//     //     //         },
//     //     //     });

//     //     //     toast.success("Test updated successfully");

//     //     //     if (response.status === 200) {
//     //     //         onRefreshAfterUpdateOrDelete();
//     //     //     }
//     //     // } catch (error: any) {
//     //     //     console.error("Update failed:", error);
//     //     //     toast.error("Failed to update test case");
//     //     // }
//     // };

//     const handleDelete = async (testCaseId: string) => {
//         const res = await handleAxiosRequest(() =>
//             axios.delete(`${process.env.URL_API_INTEGRATION?.replace(/\/+$/, "")}/deleteAutomationFlow`, {
//                 data: { testCaseId },
//                 headers: {
//                     "Content-Type": "application/json",
//                     Authorization: `Bearer ${TOKEN_API}`,
//                 },
//             }),
//             "Test case deleted successfully"
//         );

//         if (res) {
//             setTestCasesData(prev => prev.filter(tc => tc.testCaseId !== testCaseId));
//             onRefreshAfterUpdateOrDelete(); // debes recibir esta prop también
//         }
//     };

//     const handleUpdate = async (updatedTest: TestCase) => {
//         console.log("Updating test case:", updatedTest);

//         try {
//             const url = `${process.env.URL_API_INTEGRATION?.replace(/\/+$/, "")}/updateAutomationFlow`;

//             const response = await axios.put(url, updatedTest, {
//                 headers: {
//                     "Content-Type": "application/json",
//                     Authorization: `Bearer ${TOKEN_API}`,
//                 },
//             });

//             toast.success("Test updated successfully");

//             if (response.status === 200) {
//                 onRefreshAfterUpdateOrDelete(); // esta también debe venir como prop
//             }
//         } catch (error: any) {
//             console.error("Update failed:", error);
//             toast.error("Failed to update test case");
//         }
//     };
//     return (
//         <div className="w-full shadow-md rounded-md border-t-2 border-t-primary/10 pt-1">
//             <TestCaseActions test={test} onDelete={handleDeleteTestCase} onUpdate={handleUpdateTestCase} />

//             <AccordionItem value={test?.testCaseId ?? ''} className="border rounded-lg">
//                 <div className="flex items-center w-full h-auto bg-primary/5 p-0.5">
//                     <Checkbox
//                         id={test?.testCaseId ?? ''}
//                         checked={selectedCases?.includes(test?.testCaseId ?? '')}
//                         onCheckedChange={() => toggleSelect(test?.testCaseId ?? '')}
//                     />
//                     <AccordionTrigger
//                         className="flex hover:no-underline"
//                         onClick={() => {
//                             setOpenItems((prev) =>
//                                 prev.includes(test.testCaseId ?? '')
//                                     ? prev.filter(id => id !== test.testCaseId)
//                                     : [...prev, test.testCaseId ?? '']
//                             );
//                         }}
//                     >
//                         <div className="flex flex-col w-full h-auto">
//                             <div className="flex justify-between w-full gap-2 items-center p-1 rounded-br-xl text-[10px]">
//                                 <div className="flex gap-2 items-center border-2 p-0.5 rounded-md border-dotted border-primary/20">
//                                     <span className="text-xs font-mono tracking-wide text-muted-foreground">
//                                         Id: {test?.testCaseId}
//                                     </span>
//                                     {test?.testCaseId ? (
//                                         <CopyToClipboard text={test.testCaseId ?? ''} />
//                                     ) : toast.error("No ID found")}
//                                 </div>
//                                 <span className="text-xs break-words text-primary/80 shadow-md rounded-md px-2 py-1">
//                                     {test?.createdBy}
//                                 </span>
//                             </div>
//                             <h3 className="font-medium mt-2 px-2">{test?.testCaseName}</h3>
//                             {testFields.length > 0 && (
//                                 <p className="text-xs px-2 break-all whitespace-pre-wrap text-primary/70">
//                                     Dynamic fields: {testFields.join(", ")}
//                                 </p>
//                             )}
//                             <div className="flex justify-between w-full">
//                                 <span className="p-1 text-[11px] text-primary/80 rounded-md">
//                                     {steps?.length} Steps
//                                 </span>
//                                 <span className="p-1 text-[9px] text-primary/80 rounded-md">
//                                     {test?.createdAt}
//                                 </span>
//                             </div>
//                             {(test?.tagName || test?.moduleName || test?.subModuleName) && (
//                                 <div className="w-full flex flex-col lg:flex-row gap-1 rounded-md shadow-sm overflow-x-auto">
//                                     {test?.tagName && (
//                                         <span className="text-xs text-white bg-primary/85 px-2 py-1 rounded-full">
//                                             {test?.tagName}
//                                         </span>
//                                     )}
//                                     {test?.moduleName && (
//                                         <span className="text-xs text-white bg-primary/65 px-2 py-1 rounded-full">
//                                             {test?.moduleName}
//                                         </span>
//                                     )}
//                                     {test?.subModuleName && (
//                                         <span className="text-xs text-white bg-primary/50 px-2 py-1 rounded-full">
//                                             {test?.subModuleName}
//                                         </span>
//                                     )}
//                                 </div>
//                             )}
//                         </div>
//                     </AccordionTrigger>
//                 </div>

//                 <AccordionContent className="p-4 space-y-3">
//                     <div className="flex gap-2">
//                         <Button
//                             className={`bg-white hover:bg-white shadow-md text-primary/70 ${viewMode === 'editLocation' ? 'border-b-4 border-primary' : ''}`}
//                             onClick={() => setViewMode('editLocation')}
//                         >
//                             Edit Location<File className="ml-1" />
//                         </Button>
//                         <Button
//                             className={`bg-white hover:bg-white shadow-md text-primary/70 ${viewMode === 'data' ? 'border-b-4 border-primary' : ''}`}
//                             onClick={() => setViewMode('data')}
//                         >
//                             See Data<File className="ml-1" />
//                         </Button>
//                         <Button
//                             className={`bg-white hover:bg-white shadow-md text-primary/70 ${viewMode === 'steps' ? 'border-b-4 border-primary' : ''}`}
//                             onClick={() => setViewMode('steps')}
//                         >
//                             See steps<Eye className="ml-1" />
//                         </Button>
//                     </div>

//                     {viewMode === 'editLocation' && (
//                         <div className="flex flex-col gap-2">
//                             <SearchField
//                                 label="Tag"
//                                 value={editTag}
//                                 onChange={(newVal) => {
//                                     setEditTag(newVal);
//                                     setEditModule("");
//                                     setEditSubmodule("");
//                                     onUpdate({ ...test, tagName: newVal, moduleName: "", subModuleName: "" });
//                                 }}
//                                 options={tags.map(tag => ({ label: tag, value: tag }))}
//                                 placeholder="Tag"
//                             />
//                             <SearchField
//                                 label="Module"
//                                 value={editModule}
//                                 onChange={(newVal) => {
//                                     setEditModule(newVal);
//                                     setEditSubmodule("");
//                                     onUpdate({ ...test, tagName: editTag, moduleName: newVal, subModuleName: "" });
//                                 }}
//                                 options={modules.map(mod => ({ label: mod, value: mod }))}
//                                 placeholder="Module"
//                             />
//                             <SearchField
//                                 label="Submodule"
//                                 value={editSubmodule}
//                                 onChange={(newVal) => {
//                                     setEditSubmodule(newVal);
//                                     onUpdate({ ...test, tagName: editTag, moduleName: editModule, subModuleName: newVal });
//                                 }}
//                                 options={submodules.map(sub => ({ label: sub, value: sub }))}
//                                 placeholder="Submodule"
//                                 disabled={!editModule || isLoadingSubmodules}
//                             />
//                         </div>
//                     )}

//                     {viewMode === 'data' && (
//                         testFields.map((field, idx) => (
//                             <div key={`${field}-${idx}`} className="flex items-center gap-3">
//                                 <Label className="w-32 break-words">{field}</Label>
//                                 <FakerInputWithAutocomplete
//                                     id={`${field}-${test?.testCaseId}`}
//                                     value={getFieldValue(test?.testCaseId ?? '', field)}
//                                     onChange={(val: string) => handleValueChange(field, val, test?.testCaseId)}
//                                     placeholder={`Enter ${field}`}
//                                 />
//                             </div>
//                         ))
//                     )}

//                     {viewMode === 'steps' && (
//                         <div className="flex flex-col gap-4 max-h-[60vh] overflow-y-auto px-2">
//                             <div className="self-end mb-3 flex gap-2 items-center border-2 border-primary/60 rounded-md hover:shadow-md p-1">
//                                 <span>Copy All steps</span>
//                                 <CopyToClipboard text={JSON.stringify(currentTestCase?.stepsData)} />
//                             </div>
//                             <StepActions index={-1} steps={steps} test={{ ...test, index }} setTestCasesData={setTestCasesData} />
//                             {steps.map((step, i) => (
//                                 <div key={i} className="flex flex-col">
//                                     <InteractionItem
//                                         data={step}
//                                         index={i}
//                                         onDelete={(idx) => {
//                                             const updated = steps.filter((_, j) => j !== idx).map((s, k) => ({ ...s, indexStep: k + 1 }));
//                                             setTestCasesData(prev => {
//                                                 const newData = [...prev];
//                                                 newData[index] = { ...newData[index], stepsData: updated };
//                                                 return newData;
//                                             });
//                                         }}
//                                         onUpdate={(idx, newStep) => {
//                                             const updated = [...steps];
//                                             updated[idx] = { ...updated[idx], ...newStep };
//                                             setTestCasesData(prev => {
//                                                 const newData = [...prev];
//                                                 newData[index] = { ...newData[index], stepsData: updated };
//                                                 return newData;
//                                             });
//                                         }}
//                                     />
//                                     <StepActions index={i} steps={steps} test={{ ...test, index }} setTestCasesData={setTestCasesData} />
//                                 </div>
//                             ))}
//                         </div>
//                     )}
//                 </AccordionContent>
//             </AccordionItem>
//         </div>
//     );
// };

// export default SortableTestCaseItem;


// import React, { useState } from "react";
// import {
//     AccordionItem,
//     AccordionTrigger,
//     AccordionContent,
// } from "@/components/ui/accordion";
// import { Button } from "@/components/ui/button";
// import { Eye, File } from "lucide-react";
// import { Checkbox } from "@/components/ui/checkbox";
// import { Label } from "@/components/ui/label";
// import { SearchField } from "./SearchField";
// import CopyToClipboard from "./CopyToClipboard";
// import StepActions from "./StepActions";
// import InteractionItem from "./Interaction";
// import TestCaseActions from "./TestCaseActions";
// import { FakerInputWithAutocomplete } from "./FakerInput";
// import { toast } from "sonner";
// import { handleAxiosRequest } from "@/utils/handleAxiosRequest";
// import axios from "axios";
// import { TOKEN_API } from "@/config";
// import { useTagsModules } from "../hooks/useTagsModules";

// interface TestStep {
//     action: string;
//     indexStep: number;
//     data: {
//         attributes: {
//             value?: string;
//             [key: string]: string | number | boolean | undefined | Record<string, unknown>;
//         };
//         [key: string]: unknown;
//     };
// }

// interface TestCase {
//     subModuleName?: string;
//     moduleName?: string;
//     testCaseName?: string;
//     testCaseId?: string;
//     stepsData?: TestStep[];
//     jsonSteps?: TestStep[];
//     tagName?: string;
//     contextGeneral?: {
//         data?: {
//             url?: string;
//         };
//     };
//     createdBy?: string;
//     createdAt?: string;
// }

// interface Props {
//     test: TestCase;
//     index: number;
//     selectedCases: string[];
//     toggleSelect: (id: string) => void;
//     tags: string[];
//     modules: string[];
//     submodules: string[];
//     isLoadingSubmodules: boolean;
//     setOpenItems: React.Dispatch<React.SetStateAction<string[]>>;
//     openItems: string[];
//     viewMode: string;
//     setViewMode: React.Dispatch<React.SetStateAction<'data' | 'steps' | 'editLocation'>>;
//     setTestCasesData: React.Dispatch<React.SetStateAction<TestCase[]>>;
//     testCasesData: TestCase[];
//     getFieldValue: (id: string, field: string) => string;
//     handleValueChange: (field: string, value: string, id: string) => void;
//     testFields: string[];
//     onRefreshAfterUpdateOrDelete: () => void;
//     dynamicValues: any[];
//     setDynamicValues: React.Dispatch<React.SetStateAction<any[]>>;
// }

// const SortableTestCaseItem: React.FC<Props> = ({
//     test,
//     index,
//     selectedCases,
//     toggleSelect,
//     setOpenItems,
//     openItems,
//     viewMode,
//     setViewMode,
//     setTestCasesData,
//     testCasesData,
//     getFieldValue,
//     handleValueChange,
//     testFields,
//     onRefreshAfterUpdateOrDelete,
//     dynamicValues,
//     setDynamicValues,
// }) => {
//     const [editTag, setEditTag] = useState(test.tagName || "");
//     const [editModule, setEditModule] = useState(test.moduleName || "");
//     const [editSubmodule, setEditSubmodule] = useState(test.subModuleName || "");

//     const currentTestCase = testCasesData.find(tc => tc?.testCaseId === test?.testCaseId);
//     const steps = currentTestCase?.stepsData ?? [];

//     const handleDelete = async () => {
//         const res = await handleAxiosRequest(() =>
//             axios.delete(`${process.env.URL_API_INTEGRATION?.replace(/\/+$/, "")}/deleteAutomationFlow`, {
//                 data: { testCaseId: test.testCaseId },
//                 headers: {
//                     "Content-Type": "application/json",
//                     Authorization: `Bearer ${TOKEN_API}`,
//                 },
//             }),
//             "Test case deleted successfully"
//         );

//         if (res) {
//             setTestCasesData(prev => prev.filter(tc => tc.testCaseId !== test.testCaseId));
//             setDynamicValues(prev => prev.filter(val => val.id !== test.testCaseId));
//             onRefreshAfterUpdateOrDelete();
//         }
//     };

//     const {
//         tags,
//         modules,
//         submodules,
//         selectedTag,
//         selectedModule,
//         selectedSubmodule,
//         setSelectedTag,
//         setSelectedModule,
//         setSelectedSubmodule,
//         isLoading,
//         setIsLoading,
//         isLoadingSubmodules,
//         fetchInitialData,
//     } = useTagsModules();


//     const handleUpdate = async (updatedTest: TestCase) => {
//         console.log("Updating test case:", updatedTest);

//         // try {
//         //     const url = `${process.env.URL_API_INTEGRATION?.replace(/\/+$/, "")}/updateAutomationFlow`;

//         //     const response = await axios.put(url, updatedTest, {
//         //         headers: {
//         //             "Content-Type": "application/json",
//         //             Authorization: `Bearer ${TOKEN_API}`,
//         //         },
//         //     });

//         //     toast.success("Test updated successfully");

//         //     if (response.status === 200) {
//         //         onRefreshAfterUpdateOrDelete();
//         //     }
//         // } catch (error: any) {
//         //     console.error("Update failed:", error);
//         //     toast.error("Failed to update test case");
//         // }
//     };

//     return (
//         <div className="w-full shadow-md rounded-md border-t-2 border-t-primary/10 pt-1">
//             <TestCaseActions
//                 test={test}
//                 onDelete={handleDelete}
//                 onUpdate={() => handleUpdate(test)}
//             />

//             <AccordionItem value={test?.testCaseId ?? ''} className="border rounded-lg">
//                 <div className="flex items-center w-full h-auto bg-primary/5 p-0.5">
//                     <Checkbox
//                         id={test?.testCaseId ?? ''}
//                         checked={selectedCases?.includes(test?.testCaseId ?? '')}
//                         onCheckedChange={() => toggleSelect(test?.testCaseId ?? '')}
//                     />
//                     <AccordionTrigger
//                         className="flex hover:no-underline"
//                         onClick={() => {
//                             setOpenItems((prev) =>
//                                 prev.includes(test.testCaseId ?? '')
//                                     ? prev.filter(id => id !== test.testCaseId)
//                                     : [...prev, test.testCaseId ?? '']
//                             );
//                         }}
//                     >
//                         <div className="flex flex-col w-full h-auto">
//                             <div className="flex justify-between w-full gap-2 items-center p-1 rounded-br-xl text-[10px]">
//                                 <div className="flex gap-2 items-center border-2 p-0.5 rounded-md border-dotted border-primary/20">
//                                     <span className="text-xs font-mono tracking-wide text-muted-foreground">
//                                         Id: {test?.testCaseId}
//                                     </span>
//                                     {test?.testCaseId ? (
//                                         <CopyToClipboard text={test.testCaseId ?? ''} />
//                                     ) : toast.error("No ID found")}
//                                 </div>
//                                 <span className="text-xs break-words text-primary/80 shadow-md rounded-md px-2 py-1">
//                                     {test?.createdBy}
//                                 </span>
//                             </div>
//                             <h3 className="font-medium mt-2 px-2">{test?.testCaseName}</h3>
//                             {testFields.length > 0 && (
//                                 <p className="text-xs px-2 break-all whitespace-pre-wrap text-primary/70">
//                                     Dynamic fields: {testFields.join(", ")}
//                                 </p>
//                             )}
//                             <div className="flex justify-between w-full">
//                                 <span className="p-1 text-[11px] text-primary/80 rounded-md">
//                                     {steps?.length} Steps
//                                 </span>
//                                 <span className="p-1 text-[9px] text-primary/80 rounded-md">
//                                     {test?.createdAt}
//                                 </span>
//                             </div>
//                             {(test?.tagName || test?.moduleName || test?.subModuleName) && (
//                                 <div className="w-full flex flex-col lg:flex-row gap-1 rounded-md shadow-sm overflow-x-auto">
//                                     {test?.tagName && (
//                                         <span className="text-xs text-white bg-primary/85 px-2 py-1 rounded-full">
//                                             {test?.tagName}
//                                         </span>
//                                     )}
//                                     {test?.moduleName && (
//                                         <span className="text-xs text-white bg-primary/65 px-2 py-1 rounded-full">
//                                             {test?.moduleName}
//                                         </span>
//                                     )}
//                                     {test?.subModuleName && (
//                                         <span className="text-xs text-white bg-primary/50 px-2 py-1 rounded-full">
//                                             {test?.subModuleName}
//                                         </span>
//                                     )}
//                                 </div>
//                             )}
//                         </div>
//                     </AccordionTrigger>
//                 </div>

//                 <AccordionContent className="p-4 space-y-3">
//                     <div className="flex gap-2">
//                         <Button className={`bg-white shadow-md text-primary/70 ${viewMode === 'editLocation' ? 'border-b-4 border-primary' : ''}`} onClick={() => setViewMode('editLocation')}>Edit Location<File className="ml-1" /></Button>
//                         <Button className={`bg-white shadow-md text-primary/70 ${viewMode === 'data' ? 'border-b-4 border-primary' : ''}`} onClick={() => setViewMode('data')}>See Data<File className="ml-1" /></Button>
//                         <Button className={`bg-white shadow-md text-primary/70 ${viewMode === 'steps' ? 'border-b-4 border-primary' : ''}`} onClick={() => setViewMode('steps')}>See Steps<Eye className="ml-1" /></Button>
//                     </div>

//                     {viewMode === 'editLocation' && (
//                         <div className="flex flex-col gap-2">
//                             <SearchField
//                                 label="Tag"
//                                 value={editTag}
//                                 onChange={setSelectedTag}
//                                 options={tags?.map((tag) => ({
//                                     label: String(tag),
//                                     value: String(tag),
//                                 }))}
//                                 placeholder="Tag"
//                             />
//                             <SearchField
//                                 label="Module"
//                                 value={editModule}
//                                 onChange={setSelectedModule}
//                                 options={modules?.map((mod) => ({
//                                     label: String(mod),
//                                     value: String(mod),
//                                 }))}
//                                 placeholder="Module"
//                             />

//                             <SearchField
//                                 label="Submodule"
//                                 value={editSubmodule}
//                                 onChange={setSelectedSubmodule}
//                                 options={submodules?.map((sub: string) => ({
//                                     label: String(sub),
//                                     value: String(sub),
//                                 }))}
//                                 placeholder="Submodule"
//                                 disabled={!selectedModule || isLoadingSubmodules}
//                             />

//                         </div>
//                     )}

//                     {viewMode === 'data' && testFields.map((field, idx) => (
//                         <div key={`${field}-${idx}`} className="flex items-center gap-3">
//                             <Label className="w-32 break-words">{field}</Label>
//                             <FakerInputWithAutocomplete
//                                 id={`${field}-${test.testCaseId}`}
//                                 value={getFieldValue(test.testCaseId ?? '', field)}
//                                 onChange={(val) => handleValueChange(field, val, test.testCaseId ?? '')}
//                                 placeholder={`Enter ${field}`}
//                             />
//                         </div>
//                     ))}

//                     {viewMode === 'steps' && (
//                         <div className="flex flex-col gap-4 max-h-[60vh] overflow-y-auto px-2">
//                             <div className="self-end mb-3 flex gap-2 items-center border-2 border-primary/60 rounded-md hover:shadow-md p-1">
//                                 <span>Copy All steps</span>
//                                 <CopyToClipboard text={JSON.stringify(currentTestCase?.stepsData)} />
//                             </div>
//                             <StepActions index={-1} steps={steps} test={{ ...test, index }} setTestCasesData={setTestCasesData} />
//                             {steps.map((step, i) => (
//                                 <div key={i} className="flex flex-col">
//                                     <InteractionItem
//                                         data={{ id: `${test.testCaseId ?? ''}-step-${i}`, ...step }}
//                                         index={i}
//                                         onDelete={(idx) => {
//                                             const updated = steps.filter((_, j) => j !== idx).map((s, k) => ({ ...s, indexStep: k + 1 }));
//                                             setTestCasesData(prev => {
//                                                 const newData = [...prev];
//                                                 newData[index] = { ...newData[index], stepsData: updated };
//                                                 return newData;
//                                             });
//                                         }}
//                                         onUpdate={(idx, newStep) => {
//                                             const updated = [...steps];
//                                             updated[idx] = { ...updated[idx], ...newStep };
//                                             setTestCasesData(prev => {
//                                                 const newData = [...prev];
//                                                 newData[index] = { ...newData[index], stepsData: updated };
//                                                 return newData;
//                                             });
//                                         }}
//                                     />
//                                     <StepActions index={i} steps={steps} test={{ ...test, index }} setTestCasesData={setTestCasesData} />
//                                 </div>
//                             ))}
//                         </div>
//                     )}
//                 </AccordionContent>
//             </AccordionItem>
//         </div>
//     );
// };

// export default SortableTestCaseItem;


import React, { useState, useMemo } from "react";
import {
    AccordionItem,
    AccordionTrigger,
    AccordionContent,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Eye, File, Locate } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { SearchField } from "./SearchField";
import CopyToClipboard from "./CopyToClipboard";
import StepActions from "./StepActions";
import InteractionItem from "./Interaction";
import TestCaseActions from "./TestCaseActions";
import { FakerInputWithAutocomplete } from "./FakerInput";
import { toast } from "sonner";
import { handleAxiosRequest } from "@/utils/handleAxiosRequest";
import axios from "axios";
import { TOKEN_API } from "@/config";
import { useTagsModules } from "../hooks/useTagsModules";
import EditLocationFields from "./EditLocationFields";

interface TestStep {
    action: string;
    indexStep: number;
    data: {
        attributes: Record<string, any>;
        [key: string]: unknown;
    };
}

interface TestCase {
    subModuleName?: string;
    moduleName?: string;
    testCaseName?: string;
    testCaseId?: string;
    stepsData?: TestStep[];
    jsonSteps?: TestStep[];
    tagName?: string;
    contextGeneral?: { data?: { url?: string } };
    createdBy?: string;
    createdAt?: string;
}

interface Props {
    test: TestCase;
    index: number;
    selectedCases: string[];
    toggleSelect: (id: string) => void;
    setOpenItems: React.Dispatch<React.SetStateAction<string[]>>;
    openItems: string[];
    viewMode: string;
    setViewMode: React.Dispatch<React.SetStateAction<'data' | 'steps' | 'editLocation'>>;
    setTestCasesData: React.Dispatch<React.SetStateAction<TestCase[]>>;
    testCasesData: TestCase[];
    getFieldValue: (id: string, field: string) => string;
    handleValueChange: (field: string, value: string, id: string) => void;
    testFields: string[];
    onRefreshAfterUpdateOrDelete: () => void;
    dynamicValues: any[];
    setDynamicValues: React.Dispatch<React.SetStateAction<any[]>>;
}

const SortableTestCaseItem: React.FC<Props> = ({
    test,
    index,
    selectedCases,
    toggleSelect,
    setOpenItems,
    openItems,
    viewMode,
    setViewMode,
    setTestCasesData,
    testCasesData,
    getFieldValue,
    handleValueChange,
    testFields,
    onRefreshAfterUpdateOrDelete,
    dynamicValues,
    setDynamicValues,
}) => {
    const [editTag, setEditTag] = useState(test.tagName || "");
    const [editModule, setEditModule] = useState(test.moduleName || "");
    const [editSubmodule, setEditSubmodule] = useState(test.subModuleName || "");
    const [isLoadingUpdate, setIsLoadingUpdate] = useState(false);
    const currentTestCase = testCasesData.find(tc => tc?.testCaseId === test?.testCaseId);
    const steps = currentTestCase?.stepsData ?? [];
    const [updatedTest, setUpdatedTest] = useState<TestCase>(test);
    const [hasPendingChanges, setHasPendingChanges] = useState(false);

    const handleDelete = async () => {
        const res = await handleAxiosRequest(() =>
            axios.delete(`${process.env.URL_API_INTEGRATION?.replace(/\/+$/, "")}/deleteAutomationFlow`, {
                data: { testCaseId: test.testCaseId },
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${TOKEN_API}`,
                },
            }),
            "Test case deleted successfully"
        );

        if (res) {
            setTestCasesData(prev => prev.filter(tc => tc.testCaseId !== test.testCaseId));
            setDynamicValues(prev => prev.filter(val => val.id !== test.testCaseId));
            onRefreshAfterUpdateOrDelete();
        }
    };

    const handleFieldChange = (updatedFields: Partial<TestCase>) => {
        setUpdatedTest(prev => ({ ...prev, ...updatedFields }));
        setHasPendingChanges(true);
    };

    // const handleUpdate = async (updatedFields: Partial<TestCase>) => {
    //     const mergedTest: TestCase = {
    //         ...updatedTest,
    //         ...updatedFields,
    //     };

    //     setUpdatedTest(mergedTest);
    //     setIsLoadingUpdate(true);
    //     try {
    //         const url = `${process.env.URL_API_INTEGRATION?.replace(/\/+$/, "")}/updateAutomationFlow`;

    //         const response = await axios.put(url, updatedTest, {
    //             headers: {
    //                 "Content-Type": "application/json",
    //                 Authorization: `Bearer ${TOKEN_API}`,
    //             },
    //         });

    //         toast.success("Test updated successfully");

    //         if (response.status === 200) {
    //             onRefreshAfterUpdateOrDelete();
    //         }
    //     } catch (error: any) {
    //         console.error("Update failed:", error);
    //         toast.error("Failed to update test case");
    //     }finally{
    //         setIsLoadingUpdate(false);
    //     }
    // };

    const handleUpdateConfirm = async () => {
        setIsLoadingUpdate(true);
        console.log("Updating test case:", updatedTest);
        
        try {
            const url = `${process.env.URL_API_INTEGRATION?.replace(/\/+$/, "")}/updateAutomationFlow`;

            const response = await axios.put(url, updatedTest, {
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${TOKEN_API}`
                },
            });

            toast.success("Test updated successfully");

            if (response?.status === 200) {
                onRefreshAfterUpdateOrDelete();
            }
        } catch (error: any) {
            console.error("Update failed:", error);
            toast.error("Failed to update test case");
        } finally {
            setIsLoadingUpdate(false);
        }
    };

    return (
        <div className="w-full shadow-md rounded-md border-t-2 border-t-primary/10 pt-1">
            <TestCaseActions
                test={updatedTest}
                onDelete={handleDelete}
                onUpdate={handleUpdateConfirm}
                isLoadingUpdate={isLoadingUpdate}
            />


            <AccordionItem value={test.testCaseId ?? ''} className="border rounded-lg">
                <div className="flex items-center w-full bg-primary/5 p-0.5">
                    <Checkbox
                        id={test.testCaseId ?? ''}
                        checked={selectedCases.includes(test.testCaseId ?? '')}
                        onCheckedChange={() => toggleSelect(test.testCaseId ?? '')}
                    />
                    <AccordionTrigger
                        className="flex hover:no-underline"
                        onClick={() =>
                            setOpenItems(prev =>
                                prev.includes(test.testCaseId ?? '')
                                    ? prev.filter(id => id !== test.testCaseId)
                                    : [...prev, test.testCaseId ?? '']
                            )
                        }
                    >
                        <div className="flex flex-col w-full">
                            <div className="flex justify-between gap-2 p-1 text-[10px]">
                                <div className="flex gap-2 items-center border-2 p-0.5 rounded-md border-dotted border-primary/20">
                                    <span className="text-xs font-mono text-muted-foreground">
                                        Id: {test.testCaseId}
                                    </span>
                                    {test.testCaseId && <CopyToClipboard text={test.testCaseId} />}
                                </div>
                                <span className="text-xs text-primary/80 px-2 py-1 rounded-md shadow-md">
                                    {test.createdBy}
                                </span>
                            </div>
                            <h3 className="font-medium mt-2 px-2">{test.testCaseName}</h3>
                            {testFields.length > 0 && (
                                <p className="text-xs px-2 text-primary/70">
                                    Dynamic fields: {testFields.join(", ")}
                                </p>
                            )}
                            <div className="flex justify-between px-2 text-[11px] text-primary/80">
                                <span>{steps.length} Steps</span>
                                <span className="text-[9px]">{test.createdAt}</span>
                            </div>
                            <div className="flex flex-wrap gap-1 mt-1 px-2">
                                {test.tagName && (
                                    <span className="text-xs bg-primary/85 text-white px-2 py-1 rounded-full">
                                        {test.tagName}
                                    </span>
                                )}
                                {test.moduleName && (
                                    <span className="text-xs bg-primary/65 text-white px-2 py-1 rounded-full">
                                        {test.moduleName}
                                    </span>
                                )}
                                {test.subModuleName && (
                                    <span className="text-xs bg-primary/50 text-white px-2 py-1 rounded-full">
                                        {test.subModuleName}
                                    </span>
                                )}
                            </div>
                        </div>
                    </AccordionTrigger>
                </div>

                <AccordionContent className="p-4 space-y-3">
                    <div className="flex gap-2">
                        {['editLocation', 'data', 'steps'].map(mode => (
                            <button
                                key={mode}
                                className={`rounded-md flex gap-2 p-2 items-center bg-white shadow-md text-primary/70 ${viewMode === mode ? 'border-b-4 border-primary' : ''}`}
                                onClick={() => setViewMode(mode as any)}
                            >

                                {mode === 'editLocation' ? <Locate className="ml-1 h-6 w-6" /> :
                                    mode === 'data' ? <File className="ml-1" /> : <Eye className="ml-1" />}
                                {mode === 'editLocation' ? 'Edit Location' :
                                    mode === 'data' ? 'See Data' : 'See Steps'}
                            </button>
                        ))}
                    </div>
                    {/* <EditLocationFields
                        visible={viewMode === 'editLocation'}
                        test={updatedTest}
                        onUpdate={handleFieldChange}
                    /> */}

                    {viewMode === 'data' && testFields.map((field, idx) => (
                        <div key={`${field}-${idx}`} className="flex items-center gap-3">
                            <Label className="w-32">{field}</Label>
                            <FakerInputWithAutocomplete
                                id={`${field}-${test.testCaseId}`}
                                value={getFieldValue(test.testCaseId ?? '', field)}
                                onChange={(val) => handleValueChange(field, val, test.testCaseId ?? '')}
                                placeholder={`Enter ${field}`}
                            />
                        </div>
                    ))}

                    {viewMode === 'steps' && (
                        <div className="flex flex-col gap-4 max-h-[60vh] overflow-y-auto px-2">
                            <div className="self-end mb-3 flex gap-2 items-center border-2 border-primary/60 rounded-md p-1">
                                <span>Copy All steps</span>
                                <CopyToClipboard text={JSON.stringify(steps)} />
                            </div>
                            <StepActions index={-1} steps={steps} test={{ ...test, index }} setTestCasesData={setTestCasesData} />
                            {steps.map((step, i) => (
                                <div key={i} className="flex flex-col">
                                    <InteractionItem
                                        data={{ id: `${test.testCaseId}-step-${i}`, ...step }}
                                        index={i}
                                        onDelete={(idx) => {
                                            const updated = steps.filter((_, j) => j !== idx).map((s, k) => ({ ...s, indexStep: k + 1 }));
                                            setTestCasesData(prev => {
                                                const newData = [...prev];
                                                newData[index] = { ...newData[index], stepsData: updated };
                                                return newData;
                                            });
                                        }}
                                        onUpdate={(idx, newStep) => {
                                            const updated = [...steps];
                                            updated[idx] = { ...updated[idx], ...newStep };
                                            setTestCasesData(prev => {
                                                const newData = [...prev];
                                                newData[index] = { ...newData[index], stepsData: updated };
                                                return newData;
                                            });
                                        }}
                                    />
                                    <StepActions index={i} steps={steps} test={{ ...test, index }} setTestCasesData={setTestCasesData} />
                                </div>
                            ))}
                        </div>
                    )}
                </AccordionContent>
            </AccordionItem>
        </div>
    );
};

export default SortableTestCaseItem;
