import { Database, Eye, File, Loader2, PlayIcon, StopCircle, Trash2 } from "lucide-react";
import ActiveDot from "./ActiveDot";


type RowTableProps = {
    test: any;
    testId: string;
    statusById: Record<string, string>;
    isRunningNow: boolean;
    pForThisTest: number;
    isDarkMode: boolean;
    loading: Record<string, boolean>;
    showD: boolean;
    showS: boolean;
    showR: boolean;
    handleViewReports: (test: any) => void;
    handlePlaySingle: (test: any) => void;
    openDataView: (testId: string) => void;
    openStepsView: (testId: string) => void;
    openDeleteFor: (testId: string) => void;
    isLoading: boolean;
    isSaving: boolean;
    rowHover: string;
    strongText: string;
    softText: string;
};


const RowTable = ({
    test,
    testId,
    statusById,
    isRunningNow,
    pForThisTest,
    isDarkMode,
    loading,
    showD,
    showS,
    showR,
    handleViewReports,
    handlePlaySingle,
    openDataView,
    openStepsView,
    openDeleteFor,
    isLoading,
    isSaving,
    rowHover,
    strongText,
    softText,
}:RowTableProps) => {

    const chip = (variant: "a" | "b" | "c") =>
        variant === "a"
            ? isDarkMode
                ? "text-xs bg-gray-900 text-white px-2 py-1 rounded-md"
                : "text-xs bg-primary/70 text-white px-2 py-1 rounded-md"
            : variant === "b"
                ? isDarkMode
                    ? "text-xs bg-gray-700 text-white px-2 py-1 rounded-md"
                    : "text-xs bg-primary/50 text-white px-2 py-1 rounded-md"
                : isDarkMode
                    ? "text-xs bg-primary/20 text-primary px-2 py-1 rounded-md"
                    : "text-xs bg-primary/20 text-primary px-2 py-1 rounded-md";


    console.log("loading in row:", isLoading);
    

    return (
        <tr key={test.id} className={`${rowHover} ${isDarkMode ? "border-gray-800" : "border-gray-600 bg-gray-200"}`}>
            <td className={`px-4 py-3 align-top ${strongText}`}>
                <div className="font-medium">{test.name || "Unnamed Test Case"}</div>
                <div className={`text-xs ${softText}`}>ID: {test.id}</div>
            </td>

            <td className={`px-4 py-3 align-top ${softText}`}>
                {test.description ? test.description : <span className="opacity-60">—</span>}
            </td>

            <td className="px-4 py-3 align-top">
                <div className="flex flex-wrap gap-1">
                    {Array.isArray(test.tagNames) && test.tagNames.length > 0 ? (
                        test.tagNames.map((tag:string) => (
                            <span key={tag} className={chip("a")}>
                                {tag}
                            </span>
                        ))
                    ) : (
                        <span className={`text-xs ${softText} opacity-70`}>—</span>
                    )}
                </div>
            </td>

            <td className="px-4 py-3 align-top">
                {test.groupName ? (
                    <span className={chip("b")}>{test.groupName}</span>
                ) : (
                    <span className={`text-xs ${softText} opacity-70`}>—</span>
                )}
            </td>

            <td className="px-4 py-3 align-top">
                {test.moduleName ? (
                    <span className={chip("b")}>{test.moduleName}</span>
                ) : (
                    <span className={`text-xs ${softText} opacity-70`}>—</span>
                )}
            </td>

            <td className="px-4 py-3 align-top">
                {test.subModuleName ? (
                    <span className={chip("b")}>{test.subModuleName}</span>
                ) : (
                    <span className={`text-xs ${softText} opacity-70`}>—</span>
                )}
            </td>

            <td className="px-4 py-3 align-top">
                {(() => {
                    const s = statusById[testId] || "pending";
                    const label = s.charAt(0).toUpperCase() + s.slice(1);
                    const style =
                        s === "passed"
                            ? (isDarkMode ? "bg-green-700 text-white" : "bg-green-100 text-green-700")
                            : s === "failed"
                                ? (isDarkMode ? "bg-red-700 text-white" : "bg-red-100 text-red-700")
                                : (isDarkMode ? "bg-yellow-800 text-white" : "bg-yellow-100 text-yellow-700");
                    return <span className={`text-xs px-2 py-1 rounded-md font-medium ${style}`}>{label}</span>;
                })()}
            </td>

            <td className="px-4 py-3 align-top">
                <div className="flex items-center gap-2">
                    <button
                        title={isRunningNow ? `Running... ${pForThisTest}%` : "Run"}
                        className={[
                            "relative cursor-pointer rounded-md p-2 border transition",
                            loading[testId] ? "cursor-not-allowed":"",
                            isDarkMode
                                ? "border-gray-700 hover:bg-primary-blue/70 bg-primary-blue/60"
                                : "border-gray-200 hover:bg-primary/90 text-white bg-primary/70",
                        ].join(" ")}
                        onClick={loading[testId] ? () => handleViewReports(test) : () => handlePlaySingle(test)}
                        disabled={loading[testId]}
                    >
                        {loading[testId] ? (
                            <StopCircle className="w-4 h-4 text-white animate-pulse" />

                        ) : (
                            <PlayIcon className="w-4 h-4 text-white" />
                        )}
                    </button>

                    <button
                        title="Data"
                        className={[
                            "relative cursor-pointer rounded-md p-2 border transition",
                            isDarkMode
                                ? showD
                                    ? "border-emerald-400 bg-gray-900"
                                    : "border-gray-700 hover:bg-gray-900"
                                : showD
                                    ? "border-emerald-500 bg-gray-100"
                                    : "border-gray-200 hover:bg-gray-50",
                        ].join(" ")}
                        onClick={() => openDataView(testId)}
                        disabled={isLoading || isSaving}
                    >
                        <Database className={isDarkMode ? "w-4 h-4 text-white" : "w-4 h-4 text-primary"} />
                        <ActiveDot on={showD} isDark={isDarkMode} />
                    </button>

                    <button
                        title="Steps"
                        className={[
                            "relative cursor-pointer rounded-md p-2 border transition",
                            isDarkMode
                                ? showS
                                    ? "border-emerald-400 bg-gray-900"
                                    : "border-gray-700 hover:bg-gray-900"
                                : showS
                                    ? "border-emerald-500 bg-gray-100"
                                    : "border-gray-200 hover:bg-gray-50",
                        ].join(" ")}
                        onClick={() => openStepsView(testId)}
                        disabled={isLoading || isSaving}
                    >
                        <Eye className={isDarkMode ? "w-4 h-4 text-white" : "w-4 h-4 text-primary"} />
                        <ActiveDot on={showS} isDark={isDarkMode} />
                    </button>

                    <button
                        className={[
                            "relative cursor-pointer rounded-md p-2 border transition",
                            isDarkMode
                                ? showR
                                    ? "border-emerald-400 bg-gray-900"
                                    : "border-gray-700 hover:bg-gray-900"
                                : showR
                                    ? "border-emerald-500 bg-gray-100"
                                    : "border-gray-200 hover:bg-gray-50",
                        ].join(" ")}
                        title="View Reports"
                        onClick={() => handleViewReports(test)}
                    >
                        <File className={isDarkMode ? "w-4 h-4 text-white" : "w-4 h-4 text-primary"} />
                        <ActiveDot on={showR} isDark={isDarkMode} />
                    </button>

                    <button
                        className={`cursor-pointer rounded-md p-2 border transition ${isDarkMode ? "border-gray-700 hover:bg-gray-900" : "border-gray-200 hover:bg-gray-50"
                            }`}
                        title="Delete from Suite"
                        onClick={() => openDeleteFor(testId)}
                    >
                        <Trash2 className={isDarkMode ? "text-white w-4 h-4" : "text-primary w-4 h-4"} />
                    </button>
                </div>

                <div className="mt-2 text-xs min-h-5">
                    {/* {isLoading && (
                        <span className={softText}>
                            <Loader2 className="inline-block w-3 h-3 mr-1 animate-spin" /> Loading test…
                        </span>
                    )} */}
                    {isSaving && (
                        <span className={softText}>
                            <Loader2 className="inline-block w-3 h-3 mr-1 animate-spin" /> Saving…
                        </span>
                    )}
                </div>
            </td>

        </tr>
    )
}

export default RowTable;