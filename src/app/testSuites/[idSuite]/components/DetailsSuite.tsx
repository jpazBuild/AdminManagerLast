// import CopyToClipboard from "@/app/components/CopyToClipboard";
// import { ExecutionSummary } from "@/app/components/ExecutionSummary";
// import InteractionItem from "@/app/components/Interaction";
// import NoData from "@/app/components/NoData";
// import { SearchField } from "@/app/components/SearchField";
// import StepActions from "@/app/components/StepActions";
// import UnifiedInput from "@/app/components/Unified";
// import ReusableStepModal from "@/app/dashboard/components/ReusableStepModal";
// import TestReports from "@/app/dashboard/components/TestReports";
// import { FullTest } from "@/types/types";
// import { Database, Eye, File, Loader2, PlayIcon, PlusIcon, RefreshCcw, Save, Settings, StopCircle, Trash2 } from "lucide-react";
// import { Fragment } from "react/jsx-runtime";


// type Props = {
//     isDarkMode: boolean;
//     editingTitle: boolean;
//     setEditingTitle: (edit: boolean) => void;
//     titleDraft: string;
//     setTitleDraft: (title: string) => void;
//     commitTitle: () => void;
//     editingDesc: boolean;
//     setEditingDesc: (edit: boolean) => void;
//     descDraft: string;
//     setDescDraft: (desc: string) => void;
//     commitDesc: () => void;
//     savingMeta: boolean;
//     isLoadingComputedData: boolean;
//     computeSuiteExecutionSummary: () => void;
//     suiteDetails: any;
//     suiteSummary: {
//         failed: number;
//         passed: number;
//         pending: number;
//     };
//     summaryTick: number;
//     suiteTests: any[];
//     hasLiveFor: any;
//     setSelectedDynamicDataId: (id: string) => void;
//     selectedDynamicDataId: string;
//     dynamicDataHeaders: any[];
//     ddCount: number;

//     filterTag: string;
//     setFilterTag: (tag: string) => void;
//     filterGroup: string;
//     setFilterGroup: (group: string) => void;
//     filterModule: string;
//     setFilterModule: (module: string) => void;
//     filterSubmodule: string;
//     setFilterSubmodule: (submodule: string) => void;
//     filterStatus: string;
//     setFilterStatus: (status: string) => void;
//     excelFilterOptions: {
//         tags: string[];
//         groups: string[];
//         modules: string[];
//         submodules: string[];
//         statuses: string[];
//     };
//     filteredSuiteTests: any[];
//     rowHover: string;
//     tableBorder: string;
//     tableHeaderBg: string;
//     expanded: Record<string, boolean>;
//     loadingTest: Record<string, boolean>;
//     savingTest: Record<string, boolean>;
//     fullById: Record<string, FullTest>;
//     showData: Record<string, boolean>;
//     showSteps: Record<string, boolean>;
//     showReports: Record<string, boolean>;
//     testData: { data: Record<string, any> } | null;
//     dataBufById: Record<string, any>;
//     getProgressForTest: (testId: string) => number;
//     statusById: Record<string, string>;

//     savingTestDataById: Record<string, boolean>;
//     dataDraftById: Record<string, any>;
//     setDataDraftById: (testId: string, data: any) => void;
//     saveTestDataById: (testId: string) => Promise<void>;
//     reusableStepModalTest: FullTest | null;
//     setReusableStepModalTest: (test: FullTest | null) => void;
//     dynamicValueForThisTest: Record<string, any>;
//     toDeleteId: string;
//     openDeleteModal: boolean;
//     setOpenDeleteModal: (open: boolean) => void;
//     confirmDelete: () => void;

//     handleViewReports: (testId: string) => void;
//     loading: Record<string, boolean>;
//     handlePlaySingleTest?: (testId: string) => void;
//     handlePlaySingle: (testId: string) => void;
//     openDataView: (testId: string) => void;
//     openStepsView: (testId: string) => void;
//     setOpenAddModal: (open: boolean) => void;
// };

// const fmtDate = (ts?: number | string) => {
//     if (!ts) return "";
//     const n = typeof ts === "string" ? Number(ts) : ts;
//     if (!Number.isFinite(n)) return "";
//     try {
//         return new Intl.DateTimeFormat("es-ES", {
//             day: "2-digit",
//             month: "2-digit",
//             year: "numeric",
//             hour: "2-digit",
//             minute: "2-digit",
//         }).format(n);
//     } catch {
//         return "";
//     }
// };


// const DetailsSuite = ({
//     isDarkMode,
//     editingTitle,
//     setEditingTitle,
//     titleDraft,
//     setTitleDraft,
//     commitTitle,
//     editingDesc,
//     setEditingDesc,
//     descDraft,
//     setDescDraft,
//     commitDesc,
//     savingMeta,
//     isLoadingComputedData,
//     computeSuiteExecutionSummary,
//     suiteDetails,
//     suiteSummary,
//     summaryTick,
//     suiteTests,
//     setSelectedDynamicDataId,
//     selectedDynamicDataId,
//     dynamicDataHeaders,
//     ddCount,

//     filterTag,
//     setFilterTag,
//     filterGroup,
//     setFilterGroup,
//     filterModule,
//     setFilterModule,
//     filterSubmodule,
//     setFilterSubmodule,
//     filterStatus,
//     setFilterStatus,
//     excelFilterOptions,
//     filteredSuiteTests,
//     rowHover,
//     tableBorder,
//     tableHeaderBg,
//     expanded,
//     loadingTest,

//     savingTest,
//     fullById,
//     showData,
//     showSteps,
//     showReports,
//     testData,
//     dataBufById,
//     getProgressForTest,
//     statusById,
    
//     handleViewReports,
//     loading,
//     handlePlaySingle,
//     openDataView,
//     openStepsView,
//     setOpenAddModal
// }: Props) => {


//     const surface = isDarkMode
//         ? "bg-gray-800 border border-gray-700 text-white"
//         : "bg-white border border-gray-200 text-primary";
//     const strongText = isDarkMode ? "text-white/90" : "text-primary";
//     const softText = isDarkMode ? "text-white/80" : "text-primary/80";

//     const ActiveDot = ({ on, isDark }: { on: boolean; isDark: boolean }) =>
//         on ? (
//             <span
//                 className={[
//                     "absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full",
//                     "ring-2",
//                     isDark ? "bg-emerald-400 ring-gray-900" : "bg-emerald-500 ring-white",
//                 ].join(" ")}
//             />
//         ) : null;


//     const toEditable = (t: FullTest) => {
//         const keys = Array.isArray(t.testData) ? t.testData : Object.keys(t.testDataObj || {});
//         const values: Record<string, any> = { ...(t.testDataObj || {}) };
//         keys.forEach((k) => (values[k] = values[k] ?? ""));
//         return { keys, values };
//     };

//     const chip = (variant: "a" | "b" | "c") =>
//         variant === "a"
//             ? isDarkMode
//                 ? "text-xs bg-gray-900 text-white px-2 py-1 rounded-md"
//                 : "text-xs bg-primary/70 text-white px-2 py-1 rounded-md"
//             : variant === "b"
//                 ? isDarkMode
//                     ? "text-xs bg-gray-700 text-white px-2 py-1 rounded-md"
//                     : "text-xs bg-primary/50 text-white px-2 py-1 rounded-md"
//                 : isDarkMode
//                     ? "text-xs bg-primary/20 text-primary px-2 py-1 rounded-md"
//                     : "text-xs bg-primary/20 text-primary px-2 py-1 rounded-md";


//     return (
//         <div className={`w-full mt-6 p-4 rounded-md ${surface}`}>

//             <div className="flex items-center justify-between w-full">
//                 <div className="flex flex-col gap-1 min-w-0">
//                     {editingTitle ? (
//                         <input
//                             value={titleDraft}
//                             onChange={(e) => setTitleDraft(e.target.value)}
//                             onBlur={commitTitle}
//                             onKeyDown={(e) => {
//                                 if (e.key === "Enter") commitTitle();
//                                 if (e.key === "Escape") {
//                                     setTitleDraft(suiteDetails?.name || "");
//                                     setEditingTitle(false);
//                                 }
//                             }}
//                             disabled={savingMeta}
//                             className={[
//                                 "text-2xl font-bold rounded-md px-2 py-1 w-full",
//                                 isDarkMode
//                                     ? "bg-gray-900 border border-gray-700 focus:ring-0 text-white placeholder-white/40"
//                                     : "bg-white border border-gray-300 text-primary placeholder-primary/50",
//                             ].join(" ")}
//                             placeholder="Nombre de la suite"
//                             autoFocus
//                         />


//                     ) : (
//                         <h2
//                             className={`text-2xl font-bold truncate ${strongText} cursor-text`}
//                             title="Doble click para editar"
//                             onDoubleClick={() => !savingMeta && setEditingTitle(true)}
//                         >
//                             {suiteDetails.name}
//                         </h2>
//                     )}

//                     {editingDesc ? (
//                         <textarea
//                             value={descDraft}
//                             onChange={(e) => setDescDraft(e.target.value)}
//                             onBlur={commitDesc}
//                             onKeyDown={(e) => {
//                                 if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) commitDesc();
//                                 if (e.key === "Escape") {
//                                     setDescDraft(suiteDetails?.description || "");
//                                     setEditingDesc(false);
//                                 }
//                             }}
//                             disabled={savingMeta}
//                             rows={2}
//                             className={[
//                                 "rounded-md px-2 py-1 w-full resize-y",
//                                 isDarkMode
//                                     ? "bg-gray-900 border border-gray-700 text-white placeholder-white/40"
//                                     : "bg-white border border-gray-300 text-primary placeholder-primary/50",
//                             ].join(" ")}
//                             placeholder="Añade una descripción"
//                             autoFocus
//                         />
//                     ) : (
//                         <p
//                             className={`mt-1 break-words ${softText} cursor-text`}
//                             title="Doble click para editar"
//                             onDoubleClick={() => !savingMeta && setEditingDesc(true)}
//                         >
//                             {suiteDetails.description || <span className="opacity-60">Sin descripción</span>}
//                         </p>
//                     )}
//                 </div>

//                 <button
//                     className={`${isLoadingComputedData ? "animate-spin" : ""}`}
//                     onClick={computeSuiteExecutionSummary}
//                     disabled={savingMeta}
//                     title={savingMeta ? "Guardando..." : "Actualizar resumen"}
//                 >
//                     <RefreshCcw className="w-5 h-5" />
//                 </button>
//             </div>

//             <div className="mt-3 flex flex-wrap gap-2 items-center mb-4">
//                 {suiteDetails.tagNames?.map((t: string) => (
//                     <span key={t} className={chip("a")}>
//                         {t}
//                     </span>
//                 ))}
//                 {suiteDetails.createdByName && <span className={chip("b")}>By: {suiteDetails.createdByName}</span>}
//                 {suiteDetails.createdAt && <span className={chip("b")}>{fmtDate(suiteDetails.createdAt)}</span>}
//             </div>
//             <div className="flex self-end w-full justify-end mb-4">
//                 <div className="flex items-center gap-3">
//                     <SearchField
//                         label="Dynamic Data"
//                         darkMode={isDarkMode}
//                         placeholder=""
//                         onChange={setSelectedDynamicDataId}
//                         value={selectedDynamicDataId}
//                         options={dynamicDataHeaders.map((env: any) => ({ label: env.name, value: env.id }))}
//                         customDarkColor="bg-gray-900/60"
//                         className="!w-90 self-end"
//                         widthComponent="w-90"
//                     />
//                     {selectedDynamicDataId && (
//                         <span className={`text-xs ${softText}`}>
//                             {ddCount} assigned inputs
//                         </span>
//                     )}
//                 </div>
//             </div>


//             {suiteSummary.failed === 0 && suiteSummary.passed === 0 && suiteSummary.pending === 0 ? (
//                 <div className={`h-48 flex items-center justify-center border rounded-md mt-6 ${isDarkMode ? "border-gray-700" : "border-gray-300"}`}>
//                     <p className={softText}>No execution data available for this suite.</p>
//                 </div>
//             ) : (
//                 <ExecutionSummary
//                     key={summaryTick}
//                     totalFailed={suiteSummary.failed}
//                     totalSuccess={suiteSummary.passed}
//                     totalPending={suiteSummary.pending}
//                     darkMode={isDarkMode}
//                 />
//             )}

//             {suiteTests.length > 0 && (
//                 <div className="mt-6 flex flex-col w-full">
//                     <div className="flex items-center justify-between">
//                         <h3 className={`text-lg font-semibold ${strongText}`}>Test Cases in this Suite</h3>

//                     </div>

//                     <div
//                         className={[
//                             "sticky top-0 z-20",
//                             "w-full",
//                             isDarkMode ? "bg-gray-900/95 backdrop-blur border-y border-gray-800" : "bg-white/95 backdrop-blur border-y border-gray-200",
//                         ].join(" ")}
//                     >
//                         <div className="px-4 py-3">
//                             <div className="flex items-center justify-between gap-3 mb-2">
//                                 <h4 className={isDarkMode ? "text-white/80 text-sm font-semibold" : "text-primary/80 text-sm font-semibold"}>
//                                     Filters
//                                 </h4>
//                                 <div className="flex items-center gap-2">
//                                     {(filterTag || filterGroup || filterModule || filterSubmodule || filterStatus) && (
//                                         <span className={isDarkMode ? "text-xs text-white/50" : "text-xs text-primary/60"}>
//                                             Active: {[
//                                                 filterTag && `Tag: ${filterTag}`,
//                                                 filterGroup && `Group: ${filterGroup}`,
//                                                 filterModule && `Module: ${filterModule}`,
//                                                 filterSubmodule && `Submodule: ${filterSubmodule}`,
//                                                 filterStatus && `Status: ${String(filterStatus).charAt(0).toUpperCase() + String(filterStatus).slice(1)}`,
//                                             ].filter(Boolean).join(" • ")}
//                                         </span>
//                                     )}
//                                     <button
//                                         onClick={() => {
//                                             setFilterTag("");
//                                             setFilterGroup("");
//                                             setFilterModule("");
//                                             setFilterSubmodule("");
//                                             setFilterStatus("");
//                                         }}
//                                         className={[
//                                             "px-3 py-1.5 rounded-md text-xs font-medium",
//                                             isDarkMode ? "bg-gray-800 hover:bg-gray-700 text-white" : "bg-gray-200 hover:bg-gray-300 text-primary",
//                                             "transition"
//                                         ].join(" ")}
//                                         title="Reset filters"
//                                     >
//                                         Reset
//                                     </button>
//                                 </div>
//                             </div>

//                             <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2">
//                                 <div className="relative">
//                                     <SearchField
//                                         darkMode={isDarkMode}
//                                         placeholder="Filter by tag"
//                                         onChange={(val: any) => setFilterTag(val)}
//                                         value={filterTag}
//                                         options={excelFilterOptions.tags.map((t) => ({ label: t, value: t }))}
//                                         customDarkColor="bg-gray-800"
//                                         className="!w-full !h-10"
//                                         widthComponent="w-full"
//                                     />
//                                 </div>

//                                 <div className="relative">
//                                     <SearchField
//                                         darkMode={isDarkMode}
//                                         placeholder="Group"
//                                         onChange={(val: any) => setFilterGroup(val)}
//                                         value={filterGroup}
//                                         options={excelFilterOptions.groups.map((g) => ({ label: g, value: g }))}
//                                         customDarkColor="bg-gray-800"
//                                         className="!w-full !h-10"
//                                         widthComponent="w-full"
//                                     />
//                                 </div>

//                                 <div className="relative">
//                                     <SearchField
//                                         darkMode={isDarkMode}
//                                         placeholder="Filter by module"
//                                         onChange={(val: any) => setFilterModule(val)}
//                                         value={filterModule}
//                                         options={excelFilterOptions.modules.map((m) => ({ label: m, value: m }))}
//                                         customDarkColor="bg-gray-800"
//                                         className="!w-full !h-10"
//                                         widthComponent="w-full"
//                                     />
//                                 </div>

//                                 <div className="relative">
//                                     <SearchField
//                                         darkMode={isDarkMode}
//                                         placeholder="Filter by submodule"
//                                         onChange={(val: any) => setFilterSubmodule(val)}
//                                         value={filterSubmodule}
//                                         options={excelFilterOptions.submodules.map((s) => ({ label: s, value: s }))}
//                                         customDarkColor="bg-gray-800"
//                                         className="!w-full !h-10"
//                                         widthComponent="w-full"
//                                     />
//                                 </div>

//                                 <div className="relative">
//                                     <SearchField
//                                         darkMode={isDarkMode}
//                                         placeholder="Filter by status"
//                                         onChange={(val: any) => setFilterStatus(val)}
//                                         value={filterStatus}
//                                         options={excelFilterOptions.statuses.map((s) => ({
//                                             label: s.charAt(0).toUpperCase() + s.slice(1),
//                                             value: s
//                                         }))}
//                                         customDarkColor="bg-gray-800"
//                                         className="!w-full !h-10"
//                                         widthComponent="w-full"
//                                     />
//                                 </div>
//                             </div>
//                         </div>
//                     </div>
//                     <div className={`mt-3 overflow-x-auto min-h-[400px] rounded-lg border ${tableBorder}`}>
//                         <table className="min-w-full text-sm">
//                             <thead className={tableHeaderBg}>
//                                 <tr className={`text-left ${isDarkMode ? "text-gray-200" : "text-gray-700"}`}>
//                                     <th className={`px-4 py-3 font-semibold border-b ${tableBorder}`}>Name</th>
//                                     <th className={`px-4 py-3 font-semibold border-b ${tableBorder}`}>Description</th>
//                                     <th className={`px-4 py-3 font-semibold border-b ${tableBorder}`}>Tags</th>
//                                     <th className={`px-4 py-3 font-semibold border-b ${tableBorder}`}>Group</th>
//                                     <th className={`px-4 py-3 font-semibold border-b ${tableBorder}`}>Module</th>
//                                     <th className={`px-4 py-3 font-semibold border-b ${tableBorder}`}>Submodule</th>
//                                     <th className={`px-4 py-3 font-semibold border-b ${tableBorder}`}>Status</th>

//                                     <th className={`px-4 py-3 font-semibold border-b ${tableBorder}`}>Actions</th>
//                                 </tr>

//                             </thead>


//                             <tbody key={suiteDetails?.id} className={`${isDarkMode ? "divide-y-2 divide-white/90" : "divide-y divide-gray-200"} max-h-[900px]`}>
//                                 {filteredSuiteTests.map((test) => {
//                                     const testId = test.id;
//                                     const isOpen = !!expanded[testId];
//                                     const isLoading = !!loadingTest[testId];
//                                     const isSaving = !!savingTest[testId];
//                                     const full = fullById[testId];
//                                     const showD = !!showData[testId];
//                                     const showS = !!showSteps[testId];
//                                     const showR = !!showReports[testId];

//                                     const computedTestDataFor = {
//                                         data: {
//                                             ...(testData?.data ?? {}),
//                                             [testId]: (dataBufById[testId] ?? (testData?.data?.[testId] ?? {})),
//                                         }
//                                     };
//                                     const pForThisTest = getProgressForTest(testId);
//                                     const isRunningNow = pForThisTest > 0 && pForThisTest < 100;

//                                     return (
//                                         <Fragment key={testId}>
//                                             <tr key={test.id} className={`${rowHover} ${isDarkMode ? "border-gray-800" : "border-gray-600 bg-gray-200"}`}>
//                                                 <td className={`px-4 py-3 align-top ${strongText}`}>
//                                                     <div className="font-medium">{test.name || "Unnamed Test Case"}</div>
//                                                     <div className={`text-xs ${softText}`}>ID: {test.id}</div>
//                                                 </td>

//                                                 <td className={`px-4 py-3 align-top ${softText}`}>
//                                                     {test.description ? test.description : <span className="opacity-60">—</span>}
//                                                 </td>

//                                                 <td className="px-4 py-3 align-top">
//                                                     <div className="flex flex-wrap gap-1">
//                                                         {Array.isArray(test.tagNames) && test.tagNames.length > 0 ? (
//                                                             test.tagNames.map((tag:string) => (
//                                                                 <span key={tag} className={chip("a")}>
//                                                                     {tag}
//                                                                 </span>
//                                                             ))
//                                                         ) : (
//                                                             <span className={`text-xs ${softText} opacity-70`}>—</span>
//                                                         )}
//                                                     </div>
//                                                 </td>

//                                                 <td className="px-4 py-3 align-top">
//                                                     {test.groupName ? (
//                                                         <span className={chip("b")}>{test.groupName}</span>
//                                                     ) : (
//                                                         <span className={`text-xs ${softText} opacity-70`}>—</span>
//                                                     )}
//                                                 </td>

//                                                 <td className="px-4 py-3 align-top">
//                                                     {test.moduleName ? (
//                                                         <span className={chip("b")}>{test.moduleName}</span>
//                                                     ) : (
//                                                         <span className={`text-xs ${softText} opacity-70`}>—</span>
//                                                     )}
//                                                 </td>

//                                                 <td className="px-4 py-3 align-top">
//                                                     {test.subModuleName ? (
//                                                         <span className={chip("b")}>{test.subModuleName}</span>
//                                                     ) : (
//                                                         <span className={`text-xs ${softText} opacity-70`}>—</span>
//                                                     )}
//                                                 </td>

//                                                 <td className="px-4 py-3 align-top">
//                                                     {(() => {
//                                                         const s = statusById[testId] || "pending";
//                                                         const label = s.charAt(0).toUpperCase() + s.slice(1);
//                                                         const style =
//                                                             s === "passed"
//                                                                 ? (isDarkMode ? "bg-green-700 text-white" : "bg-green-100 text-green-700")
//                                                                 : s === "failed"
//                                                                     ? (isDarkMode ? "bg-red-700 text-white" : "bg-red-100 text-red-700")
//                                                                     : (isDarkMode ? "bg-yellow-800 text-white" : "bg-yellow-100 text-yellow-700");
//                                                         return <span className={`text-xs px-2 py-1 rounded-md font-medium ${style}`}>{label}</span>;
//                                                     })()}
//                                                 </td>

//                                                 <td className="px-4 py-3 align-top">
//                                                     <div className="flex items-center gap-2">
//                                                         {/* Run */}
//                                                         <button
//                                                             title={isRunningNow ? `Running... ${pForThisTest}%` : "Run"}
//                                                             className={[
//                                                                 "relative cursor-pointer rounded-md p-2 border transition",
//                                                                 isDarkMode
//                                                                     ? "border-gray-700 hover:bg-primary-blue/70 bg-primary-blue/60"
//                                                                     : "border-gray-200 hover:bg-primary/90 text-white bg-primary/70",
//                                                             ].join(" ")}
//                                                             onClick={loading[testId] ? () => handleViewReports(test) : () => handlePlaySingle(test)}
//                                                             disabled={loading[testId]}
//                                                         >
//                                                             {loading[testId] ? (
//                                                                 <StopCircle className="w-4 h-4 text-white animate-pulse" />

//                                                             ) : (
//                                                                 <PlayIcon className="w-4 h-4 text-white" />
//                                                             )}
//                                                         </button>

//                                                         <button
//                                                             title="Data"
//                                                             className={[
//                                                                 "relative cursor-pointer rounded-md p-2 border transition",
//                                                                 isDarkMode
//                                                                     ? showD
//                                                                         ? "border-emerald-400 bg-gray-900"
//                                                                         : "border-gray-700 hover:bg-gray-900"
//                                                                     : showD
//                                                                         ? "border-emerald-500 bg-gray-100"
//                                                                         : "border-gray-200 hover:bg-gray-50",
//                                                             ].join(" ")}
//                                                             onClick={() => openDataView(testId)}
//                                                             disabled={isLoading || isSaving}
//                                                         >
//                                                             <Database className={isDarkMode ? "w-4 h-4 text-white" : "w-4 h-4 text-primary"} />
//                                                             <ActiveDot on={showD} isDark={isDarkMode} />
//                                                         </button>

//                                                         <button
//                                                             title="Steps"
//                                                             className={[
//                                                                 "relative cursor-pointer rounded-md p-2 border transition",
//                                                                 isDarkMode
//                                                                     ? showS
//                                                                         ? "border-emerald-400 bg-gray-900"
//                                                                         : "border-gray-700 hover:bg-gray-900"
//                                                                     : showS
//                                                                         ? "border-emerald-500 bg-gray-100"
//                                                                         : "border-gray-200 hover:bg-gray-50",
//                                                             ].join(" ")}
//                                                             onClick={() => openStepsView(testId)}
//                                                             disabled={isLoading || isSaving}
//                                                         >
//                                                             <Eye className={isDarkMode ? "w-4 h-4 text-white" : "w-4 h-4 text-primary"} />
//                                                             <ActiveDot on={showS} isDark={isDarkMode} />
//                                                         </button>

//                                                         <button
//                                                             className={[
//                                                                 "relative cursor-pointer rounded-md p-2 border transition",
//                                                                 isDarkMode
//                                                                     ? showR
//                                                                         ? "border-emerald-400 bg-gray-900"
//                                                                         : "border-gray-700 hover:bg-gray-900"
//                                                                     : showR
//                                                                         ? "border-emerald-500 bg-gray-100"
//                                                                         : "border-gray-200 hover:bg-gray-50",
//                                                             ].join(" ")}
//                                                             title="View Reports"
//                                                             onClick={() => handleViewReports(test)}
//                                                         >
//                                                             <File className={isDarkMode ? "w-4 h-4 text-white" : "w-4 h-4 text-primary"} />
//                                                             <ActiveDot on={showR} isDark={isDarkMode} />
//                                                         </button>

//                                                         <button
//                                                             className={`cursor-pointer rounded-md p-2 border transition ${isDarkMode ? "border-gray-700 hover:bg-gray-900" : "border-gray-200 hover:bg-gray-50"
//                                                                 }`}
//                                                             title="Delete from Suite"
//                                                             onClick={() => openDeleteFor(testId)}
//                                                         >
//                                                             <Trash2 className={isDarkMode ? "text-white w-4 h-4" : "text-primary w-4 h-4"} />
//                                                         </button>
//                                                     </div>

//                                                     <div className="mt-2 text-xs min-h-5">
//                                                         {isLoading && (
//                                                             <span className={softText}>
//                                                                 <Loader2 className="inline-block w-3 h-3 mr-1 animate-spin" /> Loading test…
//                                                             </span>
//                                                         )}
//                                                         {isSaving && (
//                                                             <span className={softText}>
//                                                                 <Loader2 className="inline-block w-3 h-3 mr-1 animate-spin" /> Saving…
//                                                             </span>
//                                                         )}
//                                                     </div>
//                                                 </td>

//                                             </tr>

//                                             {isOpen && (showD || showS || showReports[testId]) && (
//                                                 <tr>
//                                                     <td colSpan={8} className={`px-6 pb-6 ${isDarkMode ? "bg-gray-900/40" : "bg-gray-50"}`}>
//                                                         {full && (
//                                                             <div className="mt-3 space-y-3">
//                                                                 <div className="flex items-center gap-2">
//                                                                     {(showS || showD) && (
//                                                                         <div className="ml-auto flex items-center gap-2 w-full justify-between">
//                                                                             {showS && (
//                                                                                 <button
//                                                                                     className={`inline-flex items-center gap-1 px-3 py-1.5 rounded font-semibold ${isDarkMode ? "bg-primary-blue/80 text-white" : "bg-primary text-white"}`}
//                                                                                     onClick={() => onSave(testId)}
//                                                                                     disabled={isSaving}
//                                                                                 >
//                                                                                     <Save className="w-4 h-4" /> Save
//                                                                                 </button>
//                                                                             )}

//                                                                             {showD && (
//                                                                                 <div></div>
//                                                                             )}
//                                                                             <button
//                                                                                 className={`inline-flex items-center gap-1 px-3 py-1.5 rounded border ${isDarkMode ? "border-gray-700 hover:bg-gray-900" : "border-gray-300 hover:bg-gray-100"}`}
//                                                                                 onClick={() => {
//                                                                                     setShowData((prev) => ({ ...prev, [testId]: false }));
//                                                                                     setShowSteps((prev) => ({ ...prev, [testId]: false }));
//                                                                                     setShowReports((prev) => ({ ...prev, [testId]: false }));
//                                                                                 }}
//                                                                             >
//                                                                                 <X className="w-4 h-4" />
//                                                                             </button>
//                                                                         </div>
//                                                                     )}
//                                                                 </div>

//                                                                 {showD && (
//                                                                     <div className="w-full">
//                                                                         <h3 className={`${isDarkMode ? "text-white/70" : "text-primary/70"} text-center mb-2 font-semibold text-lg`}>Dynamic Data</h3>
//                                                                         <div className={`rounded-md border p-4 grid grid-cols-1 md:grid-cols-2 gap-4 ${isDarkMode ? "border-white/5" : "border-slate-200"}`}>

//                                                                             {(() => {
//                                                                                 const { keys } = toEditable(full);
//                                                                                 const values = dataBufById[testId] || {};
//                                                                                 return keys.map((k) => (
//                                                                                     <div key={k} className="flex flex-col gap-6">
//                                                                                         <UnifiedInput
//                                                                                             id={`${testId}-${k}`}
//                                                                                             value={values[k] ?? ""}
//                                                                                             placeholder={`Enter ${k}`}
//                                                                                             label={`Enter ${k}`}
//                                                                                             isDarkMode={isDarkMode}
//                                                                                             enableFaker
//                                                                                             onChange={(val) =>
//                                                                                                 setDataBufById((prev) => ({
//                                                                                                     ...prev,
//                                                                                                     [testId]: { ...(prev[testId] || {}), [k]: val },
//                                                                                                 }))
//                                                                                             }
//                                                                                         />
//                                                                                     </div>
//                                                                                 ));
//                                                                             })()}


//                                                                         </div>
//                                                                         <div className="flex justify-end mt-4">
//                                                                             <button
//                                                                                 onClick={() => handleSaveDynamicData(testId, test)}
//                                                                                 disabled={!!savingDDById[testId]}
//                                                                                 className={`px-4 py-2 flex items-center font-semibold gap-2 cursor-pointer rounded-md text-white ${isDarkMode ? "bg-primary-blue/70 hover:bg-primary-blue/80" : "hover:bg-primary/85 bg-primary/80"}`}
//                                                                             >
//                                                                                 {savingDDById[testId] ? (
//                                                                                     <>
//                                                                                         <Loader2 className="w-4 h-4 animate-spin" />
//                                                                                         Guardando...
//                                                                                     </>
//                                                                                 ) : (
//                                                                                     <>Save</>
//                                                                                 )}
//                                                                             </button>
//                                                                         </div>


//                                                                     </div>

//                                                                 )}

//                                                                 {showS && (
//                                                                     <div className="rounded-md p-3 space-y-3 max-h-[800px] overflow-y-auto">
//                                                                         <div className={[
//                                                                             "sticky top-0 z-10 px-2 py-2",
//                                                                             isDarkMode ? "bg-gray-900/80 backdrop-blur border-b border-white/10" : "bg-white/80 backdrop-blur border-b border-slate-200"
//                                                                         ].join(" ")}>
//                                                                             <div className="flex flex-wrap items-center gap-4 justify-between">
//                                                                                 <div className="flex items-center gap-2 font-semibold">
//                                                                                     <button
//                                                                                         onClick={() => toggleSelectionModeFor(testId)}
//                                                                                         className={[
//                                                                                             "border shadow-md cursor-pointer flex items-center px-4 py-1.5 rounded-md",
//                                                                                             isDarkMode ? "bg-gray-800 text-white border-white/40" : "bg-gray-200 text-gray-900 border-primary/40",
//                                                                                         ].join(" ")}
//                                                                                     >
//                                                                                         <Settings className="w-4 h-4 mr-1" />
//                                                                                         {selectionModeById[testId] ? "Cancel Selection" : "Select Steps for Reusable"}
//                                                                                     </button>

//                                                                                     {selectionModeById[testId] && (selectedStepsForReusableById[testId]?.length || 0) > 0 && (
//                                                                                         <button
//                                                                                             onClick={() => setShowReusableModalFor(testId, true)}
//                                                                                             className={`${isDarkMode ? "bg-primary-blue/60" : "bg-primary/90"} px-4 py-1.5 text-white cursor-pointer flex items-center rounded-md`}
//                                                                                         >
//                                                                                             <PlusIcon className="w-4 h-4 mr-1" />
//                                                                                             Create Reusable ({selectedStepsForReusableById[testId]?.length || 0})
//                                                                                         </button>
//                                                                                     )}
//                                                                                 </div>

//                                                                                 <div className="flex items-center gap-2">
//                                                                                     <div className={[
//                                                                                         "rounded-md flex items-center gap-2 border-dashed border p-1",
//                                                                                         isDarkMode ? "border-gray-600 text-white" : "border-primary/40 text-primary/90",
//                                                                                     ].join(" ")}>
//                                                                                         <span>Copy All steps</span>
//                                                                                         <CopyToClipboard
//                                                                                             text={JSON.stringify(transformedStepsToCopy(stepsBufById[testId] || []), null, 2)}
//                                                                                             isDarkMode={isDarkMode}
//                                                                                         />
//                                                                                     </div>
//                                                                                 </div>
//                                                                             </div>
//                                                                         </div>
//                                                                         {(stepsBufById[testId] || []).map((step, i) => (
//                                                                             <div key={i} className="flex flex-col gap-2">
//                                                                                 <div
//                                                                                     className={getStepSelectionClasses(testId, i)}
//                                                                                     onClick={() => selectionModeById[testId] && handleStepSelection(testId, i)}
//                                                                                 >
//                                                                                     <InteractionItem
//                                                                                         data={{ id: `${testId}-step-${i}`, ...step }}
//                                                                                         index={i}
//                                                                                         isDarkMode={isDarkMode}
//                                                                                         test={full as any}
//                                                                                         setTestCasesData={() => { }}
//                                                                                         setResponseTest={() => { }}
//                                                                                         onUpdate={(idx, newStep) => {
//                                                                                             setStepsBufById(prev => {
//                                                                                                 const arr = [...(prev[testId] || [])];
//                                                                                                 if (newStep?.type?.startsWith?.("STEPS") && Array.isArray(newStep?.stepsData)) {
//                                                                                                     arr[idx] = { ...newStep };
//                                                                                                 } else {
//                                                                                                     arr[idx] = { ...arr[idx], ...newStep };
//                                                                                                 }
//                                                                                                 const next = arr.map((s: any, k: number) => ({ ...s, indexStep: k + 1 }));
//                                                                                                 return { ...prev, [testId]: next };
//                                                                                             });
//                                                                                         }}
//                                                                                         onDelete={(idx) => {
//                                                                                             setStepsBufById(prev => {
//                                                                                                 const next = (prev[testId] || [])
//                                                                                                     .filter((_, j) => j !== idx)
//                                                                                                     .map((s: any, k: number) => ({ ...s, indexStep: k + 1 }));
//                                                                                                 setSelectedStepsForReusableById(selPrev => {
//                                                                                                     const cur = selPrev[testId] || [];
//                                                                                                     const fixed = cur
//                                                                                                         .filter(n => n !== idx)
//                                                                                                         .map(n => (n > idx ? n - 1 : n));
//                                                                                                     return { ...selPrev, [testId]: fixed };
//                                                                                                 });
//                                                                                                 return { ...prev, [testId]: next };
//                                                                                             });
//                                                                                         }}
//                                                                                     />
//                                                                                 </div>

//                                                                                 <StepActions
//                                                                                     index={i}
//                                                                                     steps={stepsBufById[testId] || []}
//                                                                                     test={{ ...(full || {}), id: testId }}
//                                                                                     setTestCasesData={() => { }}
//                                                                                     setResponseTest={(updater: any) => setResponseStepsCompat(testId, updater)}
//                                                                                     darkMode={isDarkMode}
//                                                                                 />
//                                                                             </div>
//                                                                         ))}

//                                                                         <ReusableStepModal
//                                                                             isOpen={!!showReusableModalById[testId]}
//                                                                             onClose={() => setShowReusableModalFor(testId, false)}
//                                                                             selectedSteps={selectedStepsForReusableById[testId] || []}
//                                                                             steps={stepsBufById[testId] || []}
//                                                                             onCreateReusable={(payload: { selectedIndexes?: number[] }) => {
//                                                                                 handleCreateReusableStep(testId, payload?.selectedIndexes || (selectedStepsForReusableById[testId] || []));
//                                                                             }}
//                                                                             isDarkMode={isDarkMode}
//                                                                             responseTest={{ stepsData: stepsBufById[testId] || [] }}
//                                                                             onSetResponseData={(next: any) =>
//                                                                                 setStepsBufById(prev => ({ ...prev, [testId]: Array.isArray(next?.stepsData) ? next.stepsData : (prev[testId] || []) }))
//                                                                             }

//                                                                         />
//                                                                     </div>
//                                                                 )}


//                                                             </div>
//                                                         )}


//                                                         {showR && (
//                                                             <div className={`rounded-md border p-3 space-y-3 mt-4 ${isDarkMode ? "border-white/5" : "border-slate-200"}`}>
//                                                                 <h3 className={`${isDarkMode ? "text-white/70" : "text-primary/70"} text-center mb-2 font-semibold text-lg`}></h3>

//                                                                 <div className="flex gap-2 justify-between items-center">
//                                                                     <div className="flex gap-2">
//                                                                         {hasLiveFor(testId) && (
//                                                                             <button
//                                                                                 className={`px-3 py-1.5 rounded-md text-sm font-semibold border ${(reportsTabById[testId] ?? "live") === "live"
//                                                                                     ? (isDarkMode ? "bg-primary-blue/70 text-white border-transparent" : "bg-primary text-white border-primary")
//                                                                                     : (isDarkMode ? "border-white/15 text-white/80" : "border-slate-300 text-primary/70")}`}
//                                                                                 onClick={() => setReportsTabById(prev => ({ ...prev, [testId]: "live" }))}
//                                                                             >
//                                                                                 Live
//                                                                             </button>
//                                                                         )}

//                                                                         <button
//                                                                             className={`px-3 py-1.5 rounded-md text-sm font-semibold border ${(reportsTabById[testId] ?? (hasLiveFor(testId) ? "live" : "saved")) === "saved"
//                                                                                 ? (isDarkMode ? "bg-primary-blue/70 text-white border-transparent" : "bg-primary text-white border-primary")
//                                                                                 : (isDarkMode ? "border-white/15 text-white/80" : "border-slate-300 text-primary/70")}`}
//                                                                             onClick={() => {
//                                                                                 setReportsTabById((prev) => ({ ...prev, [testId]: "saved" }));
//                                                                                 const meta = historicMetaById[testId];
//                                                                                 if (!meta?.fetched || meta?.empty) {
//                                                                                     const t = suiteTests.find((x) => String(x.id) === testId);
//                                                                                     if (t) fetchHistoricFor(t, { force: true });
//                                                                                 }
//                                                                             }}
//                                                                         >
//                                                                             Saved
//                                                                         </button>
//                                                                     </div>

//                                                                     <button
//                                                                         className={`inline-flex items-center gap-1 px-3 py-1.5 rounded border ${isDarkMode ? "border-gray-700 hover:bg-gray-900" : "border-gray-300 hover:bg-gray-100"}`}
//                                                                         onClick={() => {
//                                                                             setShowData((prev) => ({ ...prev, [testId]: false }));
//                                                                             setShowSteps((prev) => ({ ...prev, [testId]: false }));
//                                                                             setShowReports((prev) => ({ ...prev, [testId]: false }));
//                                                                         }}
//                                                                     >
//                                                                         <X className="w-4 h-4" />
//                                                                     </button>
//                                                                 </div>

//                                                                 {(() => {
//                                                                     const activeTab = reportsTabById[testId] ?? (hasLiveFor(testId) ? "live" : "saved");
//                                                                     if (activeTab === "live" && hasLiveFor(testId)) {
//                                                                         return (
//                                                                             <TestReports
//                                                                                 stopped={stopped}
//                                                                                 setStopped={setStopped}
//                                                                                 setLoading={setLoading}
//                                                                                 loading={loading}
//                                                                                 testData={computedTestDataFor}
//                                                                                 reports={reports}
//                                                                                 idReports={idReports}
//                                                                                 progress={progress}
//                                                                                 selectedCases={[test]}
//                                                                                 selectedTest={[test]}
//                                                                                 darkMode={isDarkMode}
//                                                                                 onPlayTest={handlePlaySingle}
//                                                                                 stopAll={stopAll}
//                                                                                 showOnlySingletest={true}
//                                                                                 onFinalStatus={handleTestFinalStatus}
//                                                                             />
//                                                                         );
//                                                                     }
//                                                                     return (
//                                                                         <div className="space-y-3">
//                                                                             {loadingHistoric[testId] && (
//                                                                                 <LoadingSkeleton darkMode={isDarkMode} />
//                                                                             )}
//                                                                             {!!errorHistoric[testId] && (
//                                                                                 <div className={isDarkMode ? "text-red-300" : "text-red-600"}>{errorHistoric[testId]}</div>
//                                                                             )}
//                                                                             {!loadingHistoric[testId] && !errorHistoric[testId] && (
//                                                                                 (() => {
//                                                                                     const evs = (historicById[testId] || []).slice().sort((a, b) => (a.indexStep ?? 0) - (b.indexStep ?? 0));
//                                                                                     if (evs.length === 0) {
//                                                                                         return <NoData darkMode={isDarkMode} text="No historical reports found for this test." />;
//                                                                                     }
//                                                                                     return (
//                                                                                         <div className={`rounded-md border ${isDarkMode ? "border-white/5" : "border-slate-200"}`}>
//                                                                                             <div className={isDarkMode ? "bg-gray-900/40 p-2" : "bg-slate-50 p-2"}>
//                                                                                                 <div className="text-lg opacity-80 text-center">Report</div>
//                                                                                             </div>
//                                                                                             <div className="max-h-[60vh] overflow-y-auto flex flex-col gap-2 px-4">
//                                                                                                 {evs.map((e, i) => (
//                                                                                                     <StepCard
//                                                                                                         key={i}
//                                                                                                         step={e}
//                                                                                                         index={e.indexStep || i + 1}
//                                                                                                         darkMode={isDarkMode}
//                                                                                                         stepData={e.stepData}
//                                                                                                         handleImageClick={() => handleImageClick(e?.screenshot)}
//                                                                                                     />
//                                                                                                 ))}
//                                                                                             </div>
//                                                                                         </div>
//                                                                                     );
//                                                                                 })()
//                                                                             )}
//                                                                         </div>
//                                                                     );
//                                                                 })()}
//                                                             </div>
//                                                         )}

//                                                     </td>
//                                                 </tr>
//                                             )}
//                                         </Fragment>
//                                     );
//                                 })}
//                             </tbody>
//                         </table>
//                         <button
//                             onClick={() => setOpenAddModal(true)}
//                             className={`mt-4 mb-2 px-4 py-2 rounded-md font-semibold ${isDarkMode ? "bg-primary-blue/70 hover:bg-primary-blue/80 text-white" : "bg-primary/90 hover:bg-primary/85 text-white"
//                                 }`}
//                         >
//                             <PlusIcon className="w-5 h-5 mr-2 inline-block" /> Add Test Case
//                         </button>
//                     </div>

//                     <div className={`mt-3 text-xs ${softText}`}>
//                         Showing {filteredSuiteTests.length} of {suiteTests.length} test{filteredSuiteTests.length !== 1 ? "s" : ""}
//                     </div>
//                 </div>
//             )}
//             {suiteTests.length === 0 && (
//                 <div className="mt-6">
//                     <NoData text="No test cases in this suite yet." darkMode={isDarkMode} />
//                     <div className="flex justify-center mt-4">
//                         <button
//                             onClick={() => setOpenAddModal(true)}
//                             className={`px-4 py-2 rounded-md font-semibold ${isDarkMode ? "bg-primary-blue/70 hover:bg-primary-blue/80 text-white" : "bg-primary/90 hover:bg-primary/85 text-white"
//                                 }`}
//                         >
//                             <PlusIcon className="w-5 h-5 mr-2 inline-block" /> Add Test Case
//                         </button>

//                     </div>
//                 </div>
//             )}
//         </div>
//     )
// }

// export default DetailsSuite;