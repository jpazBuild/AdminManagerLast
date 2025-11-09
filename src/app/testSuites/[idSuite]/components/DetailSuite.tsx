import { SearchField } from "@/app/components/SearchField";
import { RefreshCcw } from "lucide-react";
import { getUiThemeClasses } from "../utils/stylesComponents";
import { fmtDate } from "@/utils/suiteUtils";



type DetailSuiteProps = {
    suiteDetails: any;
    isDarkMode: boolean;
    editingTitle: boolean;
    setEditingTitle: (val: boolean) => void;
    titleDraft: string;
    setTitleDraft: (val: string) => void;
    commitTitle: () => void;
    editingDesc: boolean;
    setEditingDesc: (val: boolean) => void;
    descDraft: string;
    setDescDraft: (val: string) => void;
    commitDesc: () => void;
    savingMeta: boolean;
    isLoadingComputedData: boolean;
    computeSuiteExecutionSummary: () => void;
    dynamicDataHeaders: any[];
    selectedDynamicDataId: string | any;
    setSelectedDynamicDataId: (val: string | any) => void;
    ddCount: number;
};

const DetailSuite = ({
    suiteDetails,
    isDarkMode,
    editingTitle,
    setEditingTitle,
    titleDraft,
    setTitleDraft,
    commitTitle,
    editingDesc,
    setEditingDesc,
    descDraft,
    setDescDraft,
    commitDesc,
    savingMeta,
    isLoadingComputedData,
    computeSuiteExecutionSummary,
    dynamicDataHeaders,
    selectedDynamicDataId,
    setSelectedDynamicDataId,
    ddCount

}: DetailSuiteProps) => {

    const { strongText, softText, chip } =
        getUiThemeClasses(isDarkMode);

    return (
        <>
            <div className="flex items-center justify-between w-full">
                <div className="flex flex-col gap-1 min-w-0">
                    {editingTitle ? (
                        <input
                            value={titleDraft}
                            onChange={(e) => setTitleDraft(e.target.value)}
                            onBlur={commitTitle}
                            onKeyDown={(e) => {
                                if (e.key === "Enter") commitTitle();
                                if (e.key === "Escape") {
                                    setTitleDraft(suiteDetails?.name || "");
                                    setEditingTitle(false);
                                }
                            }}
                            disabled={savingMeta}
                            className={[
                                "text-2xl font-bold rounded-md px-2 py-1 w-full",
                                isDarkMode
                                    ? "bg-gray-900 border border-gray-700 focus:ring-0 text-white placeholder-white/40"
                                    : "bg-white border border-gray-300 text-primary placeholder-primary/50",
                            ].join(" ")}
                            placeholder="Nombre de la suite"
                            autoFocus
                        />


                    ) : (
                        <h2
                            className={`text-2xl font-bold truncate ${strongText} cursor-text`}
                            title="Doble click para editar"
                            onDoubleClick={() => !savingMeta && setEditingTitle(true)}
                        >
                            {suiteDetails.name}
                        </h2>
                    )}

                    {editingDesc ? (
                        <textarea
                            value={descDraft}
                            onChange={(e) => setDescDraft(e.target.value)}
                            onBlur={commitDesc}
                            onKeyDown={(e) => {
                                if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) commitDesc();
                                if (e.key === "Escape") {
                                    setDescDraft(suiteDetails?.description || "");
                                    setEditingDesc(false);
                                }
                            }}
                            disabled={savingMeta}
                            rows={2}
                            className={[
                                "rounded-md px-2 py-1 w-full resize-y",
                                isDarkMode
                                    ? "bg-gray-900 border border-gray-700 text-white placeholder-white/40"
                                    : "bg-white border border-gray-300 text-primary placeholder-primary/50",
                            ].join(" ")}
                            placeholder="Añade una descripción"
                            autoFocus
                        />
                    ) : (
                        <p
                            className={`mt-1 break-words ${softText} cursor-text`}
                            title="Doble click para editar"
                            onDoubleClick={() => !savingMeta && setEditingDesc(true)}
                        >
                            {suiteDetails.description || <span className="opacity-60">Sin descripción</span>}
                        </p>
                    )}
                </div>

                <button
                    className={`${isLoadingComputedData ? "animate-spin" : ""}`}
                    onClick={computeSuiteExecutionSummary}
                    disabled={savingMeta}
                    title={savingMeta ? "Guardando..." : "Actualizar resumen"}
                >
                    <RefreshCcw className="w-5 h-5" />
                </button>
            </div>

            <div className="mt-3 flex flex-wrap gap-2 items-center mb-4">
                {suiteDetails.tagNames?.map((t:string) => (
                    <span key={t} className={chip("a")}>
                        {t}
                    </span>
                ))}
                {suiteDetails.createdByName && <span className={chip("b")}>By: {suiteDetails.createdByName}</span>}
                {suiteDetails.createdAt && <span className={chip("b")}>{fmtDate(suiteDetails.createdAt)}</span>}
            </div>
            <div className="flex self-end w-full justify-end mb-4">
                <div className="flex items-center gap-3">
                    <SearchField
                        label="Dynamic Data"
                        darkMode={isDarkMode}
                        placeholder=""
                        onChange={setSelectedDynamicDataId}
                        value={selectedDynamicDataId}
                        options={dynamicDataHeaders.map((env: any) => ({ label: env.name, value: env.id }))}
                        customDarkColor="bg-gray-900/60"
                        className="!w-90 self-end"
                        widthComponent="w-90"
                    />
                    {selectedDynamicDataId && (
                        <span className={`text-xs ${softText}`}>
                            {ddCount} assigned inputs
                        </span>
                    )}
                </div>
            </div>

        </>
    )
}

export default DetailSuite;