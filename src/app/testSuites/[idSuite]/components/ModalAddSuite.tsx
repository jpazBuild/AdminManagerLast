import TextInputWithClearButton from "@/app/components/InputClear";
import ModalCustom from "@/app/components/ModalCustom";
import NoData from "@/app/components/NoData";
import { SearchField } from "@/app/components/SearchField";
import { Check } from "lucide-react";

type ModalAddSuiteProps = {
    openAddModal: boolean;
    setOpenAddModal: (open: boolean) => void;
    isDarkMode: boolean;
    isLoadingTags: boolean;
    tags: any[];
    isLoadingGroups: boolean;
    groups: any[];
    isLoadingModules: boolean;
    modules: any[];
    isLoadingSubmodules: boolean;
    submodules: any[];
    loadingUsers: boolean;
    userOptions: { label: string; value: string }[];
    selectedTag: string;
    setSelectedTag: (tag: string) => void;
    selectedGroup: string;
    setSelectedGroup: (group: string) => void;
    selectedModule: string;
    setSelectedModule: (module: string) => void;
    selectedSubmodule: string;
    setSelectedSubmodule: (submodule: string) => void;
    selectedCreatedBy: string;
    setSelectedCreatedBy: (userId: string) => void;
    searchTestCaseName: string;
    setSearchTestCaseName: (name: string) => void;
    searchTestCaseId: string;
    setSearchTestCaseId: (id: string) => void;
    isSearchingTC: boolean;
    handleSearchModal: () => void;
    searchResults: any[];
    selectedCaseIdsForAdd: string[];
    setSelectedCaseIdsForAdd: (ids: string[]) => void;
    allVisibleSelected: boolean;
    someVisibleSelected: boolean;
    toggleAllVisible: () => void;
    toggleSelectResult: (id: string) => void;
    handleAddToSuite: () => void;
}



const ModalAddSuite = ({
    openAddModal,setOpenAddModal,isDarkMode,
    isLoadingTags,tags,
    isLoadingGroups,groups,
    isLoadingModules,modules,
    isLoadingSubmodules,submodules,
    loadingUsers,userOptions,
    selectedTag,setSelectedTag,
    selectedGroup,setSelectedGroup,
    selectedModule,setSelectedModule,
    selectedSubmodule,setSelectedSubmodule,
    selectedCreatedBy,setSelectedCreatedBy,
    searchTestCaseName,setSearchTestCaseName,
    searchTestCaseId,setSearchTestCaseId,
    isSearchingTC,handleSearchModal,
    searchResults,
    selectedCaseIdsForAdd,setSelectedCaseIdsForAdd,
    allVisibleSelected,someVisibleSelected,toggleAllVisible,
    toggleSelectResult,
    handleAddToSuite    




}:ModalAddSuiteProps) => {


    return(
          <ModalCustom
                open={openAddModal}
                onClose={() => setOpenAddModal(false)}
                isDarkMode={isDarkMode}
                width="max-w-3xl"
            >
                <div className={`max-h-[80vh] p-4 ${isDarkMode ? "text-white" : "text-primary"}`}>
                    <h3 className="text-lg font-semibold mb-3">Add Test Case to Suite</h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {isLoadingTags ? (
                            <div className={`h-10 rounded-md animate-pulse ${isDarkMode ? "bg-gray-700" : "bg-gray-200"}`} />
                        ) : (
                            <SearchField
                                label="Tags"
                                value={selectedTag}
                                onChange={setSelectedTag}
                                options={tags.map((t: any) => ({ label: t.name, value: t.name }))}
                                darkMode={isDarkMode}
                                className="w-full"
                            />
                        )}

                        {isLoadingGroups ? (
                            <div className={`h-10 rounded-md animate-pulse ${isDarkMode ? "bg-gray-700" : "bg-gray-200"}`} />
                        ) : (
                            <SearchField
                                label="Groups"
                                value={selectedGroup}
                                onChange={setSelectedGroup}
                                options={groups.map((g: any) => ({ label: g.name, value: g.name }))}
                                darkMode={isDarkMode}
                                className="w-full"
                                disabled={groups.length === 0}
                            />
                        )}

                        {isLoadingModules ? (
                            <div className={`h-10 rounded-md animate-pulse ${isDarkMode ? "bg-gray-700" : "bg-gray-200"}`} />
                        ) : (
                            <SearchField
                                label="Modules"
                                value={selectedModule}
                                onChange={setSelectedModule}
                                options={modules.map((m: any) => ({ label: m.name, value: m.name }))}
                                darkMode={isDarkMode}
                                className="w-full"
                                disabled={!selectedGroup || modules.length === 0}
                            />
                        )}

                        {isLoadingSubmodules ? (
                            <div className={`h-10 rounded-md animate-pulse ${isDarkMode ? "bg-gray-700" : "bg-gray-200"}`} />
                        ) : (
                            <SearchField
                                label="Submodules"
                                value={selectedSubmodule}
                                onChange={setSelectedSubmodule}
                                options={submodules.map((s: any) => ({ label: s.name, value: s.id }))}
                                darkMode={isDarkMode}
                                className="w-full"
                                disabled={!selectedModule || submodules.length === 0}
                            />
                        )}

                        {loadingUsers ? (
                            <div className={`h-10 rounded-md animate-pulse ${isDarkMode ? "bg-gray-700" : "bg-gray-200"}`} />
                        ) : (
                            <SearchField
                                label="Created by"
                                value={selectedCreatedBy}
                                onChange={setSelectedCreatedBy}
                                options={userOptions}
                                darkMode={isDarkMode}
                                className="w-full"
                            />
                        )}
                        <TextInputWithClearButton
                            id="modal-search-name"
                            label="Name"
                            value={searchTestCaseName}
                            onChangeHandler={(e) => setSearchTestCaseName(e.target.value)}
                            placeholder="Search by name..."
                            className="w-full"
                            isSearch
                            isDarkMode={isDarkMode}
                        />

                        <TextInputWithClearButton
                            id="modal-search-id"
                            label="Test Case ID"
                            value={searchTestCaseId}
                            onChangeHandler={(e) => setSearchTestCaseId(e.target.value)}
                            placeholder="Search by id..."
                            className="w-full"
                            isSearch
                            isDarkMode={isDarkMode}
                        />
                    </div>

                    <div className="mt-3 flex items-center gap-2">
                        <button
                            className={`px-4 py-2 rounded-md font-semibold ${isDarkMode ? "bg-primary-blue/70 hover:bg-primary-blue/80 text-white" : "bg-primary/90 hover:bg-primary/85 text-white"
                                }`}
                            onClick={handleSearchModal}
                            disabled={isSearchingTC}
                        >
                            {isSearchingTC ? "Searching..." : "Search"}
                        </button>

                        <button
                            className={`px-4 py-2 rounded-md border ${isDarkMode ? "border-gray-600" : "border-gray-300"
                                }`}
                            onClick={() => {
                                setSelectedTag(""); setSelectedGroup(""); setSelectedModule("");
                                setSelectedSubmodule(""); setSelectedCreatedBy("");
                                setSearchTestCaseName(""); setSearchTestCaseId("");
                                setSelectedCaseIdsForAdd([]);

                            }}
                        >
                            Clear
                        </button>
                    </div>

                    <div className="mt-4 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <label className="inline-flex items-center gap-2 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={allVisibleSelected}
                                    ref={el => {
                                        if (el) el.indeterminate = someVisibleSelected && !allVisibleSelected;
                                    }}
                                    onChange={toggleAllVisible}
                                    className={`${isDarkMode ? "accent-primary-blue" : "accent-primary"} h-4 w-4`}
                                    title={allVisibleSelected ? "Unselect all" : "Select all"}
                                />
                                <span className={isDarkMode ? "text-white/80" : "text-primary/80"}>
                                    {allVisibleSelected ? "Unselect all (visible)" : "Select all (visible)"}
                                </span>
                            </label>

                            <span className={isDarkMode ? "text-xs text-white/60" : "text-xs text-primary/60"}>
                                Selected: {selectedCaseIdsForAdd.length}
                            </span>
                        </div>

                        {selectedCaseIdsForAdd.length > 0 && (
                            <button
                                onClick={() => setSelectedCaseIdsForAdd([])}
                                className={[
                                    "px-3 py-1.5 rounded-md text-xs font-medium",
                                    isDarkMode ? "bg-gray-800 hover:bg-gray-700 text-white" : "bg-gray-200 hover:bg-gray-300 text-primary",
                                    "transition"
                                ].join(" ")}
                                title="Clear selection"
                            >
                                Clear selection
                            </button>
                        )}
                    </div>

                    <div className="mt-4 max-h-[45vh] overflow-y-auto rounded-md p-2">
                        {searchResults.length === 0 ? (
                            <NoData text="No test cases found." darkMode={isDarkMode} />
                        ) : (
                            <ul className="space-y-2">
                                {searchResults.map((r) => (
                                    <li
                                        key={r.id}
                                        onClick={() => toggleSelectResult(r.id)}
                                        className={[
                                            "p-2 rounded-md cursor-pointer transition",
                                            isDarkMode ? "bg-gray-800 hover:bg-gray-700" : "hover:bg-gray-100",
                                            selectedCaseIdsForAdd.includes(r.id)
                                                ? (isDarkMode ? "ring-1 ring-primary-blue/60 bg-gray-700" : "ring-1 ring-primary/40 bg-gray-100")
                                                : ""
                                        ].join(" ")}
                                    >
                                        <div className="flex items-start gap-2">
                                            <input
                                                type="checkbox"
                                                checked={selectedCaseIdsForAdd.includes(r.id)}
                                                onChange={() => toggleSelectResult(r.id)}
                                                onClick={(e) => e.stopPropagation()}
                                                className={`mt-1 ${isDarkMode ? "accent-primary-blue" : "accent-primary"} h-4 w-4`}
                                            />
                                            <div className="flex-1">
                                                <div className="font-medium">{r.name || "Unnamed"}</div>
                                                <div className="text-xs opacity-75">ID: {r.id}</div>
                                                {Array.isArray(r.tagNames) && r.tagNames.length > 0 && (
                                                    <div className="mt-1 flex flex-wrap gap-1">
                                                        {r.tagNames.map((t:string) => (
                                                            <span key={t} className={`text-[10px] ${isDarkMode ? "bg-gray-600" : "bg-primary/20 text-primary"} px-2 py-0.5 rounded`}>
                                                                {t}
                                                            </span>
                                                        ))}
                                                    </div>
                                                )}
                                                {selectedCaseIdsForAdd.includes(r.id) && (
                                                    <div className={`mt-2 text-sm font-bold ${isDarkMode ? "text-white" : "text-primary"}`}>
                                                        <Check className="w-4 h-4 inline-block mr-1" /> Selected
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </li>

                                ))}
                            </ul>
                        )}
                    </div>

                    <div className="mt-4 flex justify-end gap-2">
                        <button
                            className={`px-4 py-2 rounded-md border ${isDarkMode ? "border-gray-600" : "border-gray-300"}`}
                            onClick={() => setOpenAddModal(false)}
                        >
                            Cancel
                        </button>
                        <button
                            className={`cursor-pointer px-4 py-2 rounded-md font-semibold ${isDarkMode ? "bg-primary-blue/70 hover:bg-primary-blue/80 text-white" : "bg-primary/90 hover:bg-primary/85 text-white"
                                }`}
                            onClick={handleAddToSuite}
                            disabled={selectedCaseIdsForAdd.length === 0}
                        >
                            Add {selectedCaseIdsForAdd.length > 0 ? `(${selectedCaseIdsForAdd.length})` : ""} to Suite
                        </button>
                    </div>
                </div>
            </ModalCustom>
    )
}

export default ModalAddSuite;