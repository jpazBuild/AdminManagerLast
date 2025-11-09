import { SearchField } from "@/app/components/SearchField";
import { Module, Submodule, Tag } from "@/types/types";


type FilterTableProps = {
    isDarkMode: boolean;
    filterTag: string;
    setFilterTag: (tag: string) => void;
    filterGroup: string;
    setFilterGroup: (group: string) => void;
    filterModule: string;
    setFilterModule: (module: string) => void;
    filterSubmodule: string;
    setFilterSubmodule: (submodule: string) => void;
    filterStatus: string;
    setFilterStatus: (status: any) => void;
    excelFilterOptions: any;
};

const FilterTable = ({
    isDarkMode,
    filterTag,
    setFilterTag,
    filterGroup,
    setFilterGroup,
    filterModule,

    setFilterModule,


    filterSubmodule,
    setFilterSubmodule,
    filterStatus,
    setFilterStatus,
    excelFilterOptions,
    
}:FilterTableProps) => {


    return (
        <div
            className={[
                "sticky top-0 z-20",
                "w-full",
                isDarkMode ? "bg-gray-900/95 backdrop-blur border-y border-gray-800" : "bg-white/95 backdrop-blur border-y border-gray-200",
            ].join(" ")}
        >
            <div className="px-4 py-3">
                <div className="flex items-center justify-between gap-3 mb-2">
                    <h4 className={isDarkMode ? "text-white/80 text-sm font-semibold" : "text-primary/80 text-sm font-semibold"}>
                        Filters
                    </h4>
                    <div className="flex items-center gap-2">
                        {(filterTag || filterGroup || filterModule || filterSubmodule || filterStatus) && (
                            <span className={isDarkMode ? "text-xs text-white/50" : "text-xs text-primary/60"}>
                                Active: {[
                                    filterTag && `Tag: ${filterTag}`,
                                    filterGroup && `Group: ${filterGroup}`,
                                    filterModule && `Module: ${filterModule}`,
                                    filterSubmodule && `Submodule: ${filterSubmodule}`,
                                    filterStatus && `Status: ${String(filterStatus).charAt(0).toUpperCase() + String(filterStatus).slice(1)}`,
                                ].filter(Boolean).join(" • ")}
                            </span>
                        )}
                        <button
                            onClick={() => {
                                setFilterTag("");
                                setFilterGroup("");
                                setFilterModule("");
                                setFilterSubmodule("");
                                setFilterStatus("");
                            }}
                            className={[
                                "px-3 py-1.5 rounded-md text-xs font-medium",
                                isDarkMode ? "bg-gray-800 hover:bg-gray-700 text-white" : "bg-gray-200 hover:bg-gray-300 text-primary",
                                "transition"
                            ].join(" ")}
                            title="Reset filters"
                        >
                            Reset
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2">
                    <div className="relative">
                        <SearchField
                            darkMode={isDarkMode}
                            placeholder="Filter by tag"
                            onChange={(val: any) => setFilterTag(val)}
                            value={filterTag}
                            options={excelFilterOptions.tags.map((t:Tag) => ({ label: t, value: t }))}
                            customDarkColor="bg-gray-800"
                            className="!w-full !h-10"
                            widthComponent="w-full"
                        />
                    </div>

                    <div className="relative">
                        <SearchField
                            darkMode={isDarkMode}
                            placeholder="Group"
                            onChange={(val: any) => setFilterGroup(val)}
                            value={filterGroup}
                            options={excelFilterOptions.groups.map((g:any) => ({ label: g, value: g }))}
                            customDarkColor="bg-gray-800"
                            className="!w-full !h-10"
                            widthComponent="w-full"
                        />
                    </div>

                    <div className="relative">
                        <SearchField
                            darkMode={isDarkMode}
                            placeholder="Filter by module"
                            onChange={(val: any) => setFilterModule(val)}
                            value={filterModule}
                            options={excelFilterOptions.modules.map((m:Module) => ({ label: m, value: m }))}
                            customDarkColor="bg-gray-800"
                            className="!w-full !h-10"
                            widthComponent="w-full"
                        />
                    </div>

                    <div className="relative">
                        <SearchField
                            darkMode={isDarkMode}
                            placeholder="Filter by submodule"
                            onChange={(val: any) => setFilterSubmodule(val)}
                            value={filterSubmodule}
                            options={excelFilterOptions.submodules.map((s:Submodule) => ({ label: s, value: s }))}
                            customDarkColor="bg-gray-800"
                            className="!w-full !h-10"
                            widthComponent="w-full"
                        />
                    </div>

                    <div className="relative">
                        <SearchField
                            darkMode={isDarkMode}
                            placeholder="Filter by status"
                            onChange={(val: any) => setFilterStatus(val)}
                            value={filterStatus}
                            options={excelFilterOptions.statuses.map((s:any) => ({
                                label: s.charAt(0).toUpperCase() + s.slice(1),
                                value: s
                            }))}
                            customDarkColor="bg-gray-800"
                            className="!w-full !h-10"
                            widthComponent="w-full"
                        />
                    </div>
                </div>
            </div>
        </div>
    )
}

export default FilterTable;