"use client";

import React, { useState } from "react";
import Image from "next/image";
import { DashboardHeader } from "@/app/Layouts/main";
import { CopyPlus, MoreVertical, PlusCircleIcon, PlusIcon, Trash2Icon } from "lucide-react";
import SidebarList from "./components/SidebarList";
import PackageCard from "./components/PackageCard";
import VariablesList, { Row } from "./components/VariablesList";
import ConfirmModal from "./components/ConfirmModal";
import selectIterationDataIcon from "../../../assets/apisImages/select-iterationData.svg";
import { SearchField } from "@/app/components/SearchField";
import useTags, { Tag } from "../hooks/useTags";
import { useIterationList } from "./hooks/useIterationList";
import { useIterationEditor } from "./hooks/useIterationEditor";
import { useToast } from "./hooks/useToast";
import ModalCustom from "@/app/components/ModalCustom";

const newLocalId = () => `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

type Draft = {
  id: string;
  pkgId: string;
  pkgName: string;
  checked: boolean;
  tagNames: string[];
  rows: Row[];
  collapsed?: boolean;
  menuOpen?: boolean;
};

export default function IterationDataPage() {
  const { iterations, loadingList, listError, query, setQuery, refresh } = useIterationList();
  const editor = useIterationEditor();
  const { toast, show, hide } = useToast();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const { tags, isLoadingTags } = useTags();
  const tagOptionsRaw = (tags ?? [])
    .map((t: string | Tag) => (typeof t === "string" ? t : t?.name ?? ""))
    .filter(Boolean);
  const tagOptionsVisible = tagOptionsRaw
    .filter((t) => !editor.tagNames.includes(t))
    .map((t) => ({ label: t, value: t }));

  const [drafts, setDrafts] = useState<Draft[]>([]);

  const handleSave = async () => {
    const v = editor.validateForSave();
    if (!v.ok) {
      const missingText = v.missingFields.join(", ");
      show(`Missing fields: ${missingText}`, "error", 3500);
      return;
    }
    const res = await editor.save();
    if (res.ok) {
      show(editor.isNew ? "Created." : "Saved.", "success");
      await refresh();
    } else {
      const prefix = res.status ? `(${res.status}) ` : "";
      show(`Save failed: ${prefix}${res.error}`, "error");
    }
  };

  return (
    <DashboardHeader onDarkModeChange={setDarkMode} pageType="api">
      <div className="flex gap-2 w-full h-full overflow-hidden">
        <SidebarList
          iterations={iterations}
          loading={loadingList}
          error={listError}
          query={query}
          setQuery={setQuery}
          onPick={async (h) => {
            await editor.loadFromHeader(h);
          }}
          onCreateBlank={() => {
            editor.createLocalBlankDraft("New iteration1");
            show("Blank package ready to edit.", "success", 1200);
          }}
          onUploadCsv={(file) => {
            editor.loadFromCsvFile(file).then((ok) => {
              if (ok) show("CSV loaded. Review and Save to create.", "success");
              else show("CSV could not be parsed.", "error");
            });
          }}
          selectedId={editor.selected?.id}
          darkMode={darkMode}  
        />

        <div className="flex flex-col w-full h-full max-h-[80vh]">
          {editor.selected && (
            <div className="px-6 pt-6 pb-2">
              <div className={`flex items-center justify-between ${darkMode ? "text-white":"text-primary/90"}`}>
                <div className="">
                  <h1 className="text-[24px] font-semibold leading-tight ">
                    Data packages
                  </h1>
                  <p className=" mt-1 opacity-60">Selected sets will be used in iterations.</p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      editor.reset();
                      show("Changes reset.", "success", 2000);
                    }}
                    className={`cursor-pointer items-center gap-2 px-6 py-1.5 rounded-full ${darkMode?"bg-gray-800 text-white hover:bg-gray-700":" text-primary font-semibold bg-gray-200 hover:bg-gray-100"} transition disabled:opacity-60`}
                    disabled={!editor.isDirty && !editor.isNew}
                  >
                    Reset changes
                  </button>

                  <button
                    onClick={handleSave}
                    className={`cursor-pointer items-center gap-2 px-6 py-1.5 rounded-full ${darkMode?"bg-primary-blue/90 text-white hover:bg-primary-blue/80":" bg-primary text-white hover:bg-primary/90"} font-semibold shadow transition disabled:opacity-60`}
                    disabled={editor.saving}
                  >
                    {editor.saving ? "Saving..." : "Save"}
                  </button>
                </div>
              </div>
            </div>
          )}

          <div className="px-6 pb-8 flex flex-col gap-6 w-full">
            {editor.selected ? (
              <PackageCard
                pkgName={editor.pkgName}
                pkgId={editor.pkgId}
                onChangeName={editor.setPkgName}
                checked={editor.pkgChecked}
                onToggleChecked={editor.toggleChecked}
                isCollapsed={editor.isCollapsed}
                toggleCollapse={() => editor.setIsCollapsed((v) => !v)}
                darkMode={darkMode}
                headerExtras={
                  <div className="flex items-center gap-3">
                    <div className="w-full md:w-[420px]">
                      <SearchField
                        label="Search tags"
                        placeholder={isLoadingTags ? "Loading tags..." : "Search tags"}
                        value={""}
                        options={tagOptionsVisible}
                        onChange={(val: string) => {
                          const v = (val || "").trim();
                          if (!v) return;
                          editor.addTag(v);
                        }}
                        darkMode={darkMode}
                        customDarkColor="bg-gray-900"
                      />
                    </div>

                    <div className="relative">
                      <button
                        className={`p-2 rounded-md hover:bg-gray-100 ${darkMode ? "text-white bg-gray-800 hover:bg-gray-700":"bg-gray-200 hover:bg-gray-300"}`}
                        onClick={() => editor.setMenuOpen((m) => !m)}
                        aria-label="More options"
                      >
                        <MoreVertical className="w-5 h-5" />
                      </button>
                      {editor.menuOpen && (
                        <div className={`absolute right-0 mt-2 w-44 rounded-xl shadow-2xl border ${darkMode?"bg-gray-800 text-white border-none":"border-gray-200 bg-white"} shadow-lg z-30`}>
                          <button
                            className={`flex w-full items-center gap-2 px-4 py-2 text-sm ${darkMode?"text-white hover:bg-gray-700":"text-primary hover:bg-gray-100"}`}
                            onClick={async () => {
                              editor.setMenuOpen(false);
                              const res = await editor.duplicateAsNew();
                              if (res.ok) {
                                show("Duplicated.", "success");
                                await refresh();
                              } else {
                                const prefix = res.status ? `(${res.status}) ` : "";
                                show(`Duplicate failed: ${prefix}${res.error}`, "error");
                              }
                            }}
                          >
                            <CopyPlus className="w-4 h-4" />
                            Duplicate
                          </button>

                          <button
                            className={`flex w-full items-center gap-2 px-4 py-2 text-sm ${darkMode?"text-white hover:bg-gray-700":"text-primary hover:bg-gray-100"}`}
                            onClick={() => {
                              editor.setMenuOpen(false);
                              setConfirmOpen(true);
                            }}
                          >
                            <Trash2Icon className="w-4 h-4" />
                            Delete
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                }
              >
                {/* {editor.tagNames.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-3">
                    {editor.tagNames.map((t) => (
                      <span
                        key={t}
                        className="inline-flex items-center gap-2 bg-gray-100 text-primary/90 rounded-full px-3 py-1 text-sm"
                      >
                        {t}
                        <button
                          className="hover:text-primary"
                          onClick={() => editor.removeTag(t)}
                          title="Remove tag"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                )} */}

               <div className="mt-4">
                 {Object.entries(editor.rows).map(([iterKey, vars], idx) => {
                  const rowsArray: Row[] = Object.entries(vars).map(([k, v]) => {
                    const clean = k.replace(/^iteration\d+\./i, "");
                    return { id: `${iterKey}:${k}`, variable: clean, value: v };
                  });
                  return (
                    <div key={iterKey} className={`rounded-xl border border-gray-200 p-4 mb-4`}>
                      <div className="flex items-center justify-between mb-3">
                        <h3 className={`${darkMode ? "text-gray-200":"text-primary/70"} text-lg font-semibold`}>
                          {`Iteration ${idx + 1}`}
                        </h3>
                      </div>

                      <VariablesList
                        rows={rowsArray}
                        onUpdate={(rowId, patch) => {
                          const [ik, oldStoredKey] = rowId.split(":");
                          const currentClean = oldStoredKey.replace(/^iteration\d+\./i, "");
                          const newVarKey = (patch.variable ?? currentClean).trim();
                          const value = patch.value as string | undefined;
                          editor.updateRow(ik, oldStoredKey, {
                            newVarKey,
                            value,
                          });
                        }}
                        onRemove={(rowId) => {
                          const [ik, storedKey] = rowId.split(":");
                          editor.removeRow(ik, storedKey);
                        }}
                        onAdd={() => editor.addRow(iterKey)}
                        darkMode={darkMode}
                      />
                    </div>
                  );
                })}

               </div>
                <div>
                  <button
                    onClick={editor.addIteration}
                    className="mt-2 text-sm cursor-pointer px-4 py-2 flex gap-1 items-center rounded-full bg-gray-200 text-primary font-semibold hover:bg-gray-300"
                  >
                    <PlusCircleIcon className="w-5 h-5"/> New iteration
                  </button>
                </div>
              </PackageCard>
            ) : (
              <div className={`min-h-[80vh] flex flex-col items-center justify-center h-full w-full my-auto text-center rounded-2xl ${darkMode ? "":"] bg-white"}  p-8`}>
                <Image
                  src={selectIterationDataIcon}
                  alt="Select a collection"
                  className="h-20 w-auto rounded-md p-2"
                />
                <h2 className="text-2xl font-bold text-[#5A6ACF] mb-2">Create data packages</h2>
                <span className="block text-[#7B8CA6] text-base font-medium mb-6">
                  Choose an item on the left or create a new one.
                </span>
              </div>
            )}

            {drafts.map((d) => (
              <PackageCard
                key={d.id}
                pkgName={d.pkgName}
                pkgId={d.pkgId}
                onChangeName={(v) =>
                  setDrafts((prev) => prev.map((x) => (x.id === d.id ? { ...x, pkgName: v } : x)))
                }
                checked={d.checked}
                onToggleChecked={() =>
                  setDrafts((prev) =>
                    prev.map((x) => (x.id === d.id ? { ...x, checked: !x.checked } : x))
                  )
                }
                isCollapsed={!!d.collapsed}
                toggleCollapse={() =>
                  setDrafts((prev) =>
                    prev.map((x) => (x.id === d.id ? { ...x, collapsed: !x.collapsed } : x))
                  )
                }
                headerExtras={null}
                onDuplicate={() => {
                  const copy: Draft = {
                    ...d,
                    id: newLocalId(),
                    pkgId: newLocalId(),
                    pkgName: `${d.pkgName} Copy`,
                    rows: d.rows.map((r) => ({ ...r })),
                    tagNames: [...d.tagNames],
                    menuOpen: false,
                  };
                  setDrafts((prev) => [...prev, copy]);
                }}
                onDelete={() => setDrafts((prev) => prev.filter((x) => x.id !== d.id))}
              >
                <VariablesList
                  rows={d.rows}
                  onUpdate={(rowId, patch) =>
                    setDrafts((prev) =>
                      prev.map((x) =>
                        x.id === d.id
                          ? {
                            ...x,
                            rows: x.rows.map((r) => (r.id === rowId ? { ...r, ...patch } : r)),
                          }
                          : x
                      )
                    )
                  }
                  onRemove={(rowId) =>
                    setDrafts((prev) =>
                      prev.map((x) =>
                        x.id === d.id
                          ? { ...x, rows: x.rows.filter((r) => r.id !== rowId) }
                          : x
                      )
                    )
                  }
                  onAdd={() =>
                    setDrafts((prev) =>
                      prev.map((x) =>
                        x.id === d.id
                          ? { ...x, rows: [...x.rows, { id: newLocalId(), variable: "", value: "" }] }
                          : x
                      )
                    )
                  }
                />
              </PackageCard>
            ))}
          </div>
        </div>
      </div>

      <ModalCustom
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        width="max-w-md"
        isDarkMode={darkMode}
      >
        <div className={`flex flex-col gap-4 p-6 ${darkMode ? "text-white":"text-primary/90"}`}>
          <h3 className="text-lg font-semibold text-center">
            Are you sure you want to delete this package?
          </h3>z
          <p className="text-sm  my-4 text-center">
            This action cannot be undone.
          </p>
          <div className="flex items-center w-full gap-2">
            <button
              className={`cursor-pointer w-1/2 px-4 py-2 rounded-lg text-sm ${darkMode ? "bg-gray-800 hover:bg-gray-700":"bg-gray-200 hover:bg-gray-100"}`}
              onClick={() => setConfirmOpen(false)}
            >
              Cancel
            </button>
            <button
              className="cursor-pointer w-1/2 px-4 py-2 rounded-lg bg-red-600 text-white text-sm hover:bg-red-700"
              onClick={async () => {
                const res = await editor.deleteOnServer();
                if (res.ok) {
                  await refresh();
                  editor.clearSelection();
                  show("The data package has been deleted.", "success");
                } else {
                  const prefix = res.status ? `(${res.status}) ` : "";
                  show(`Delete failed: ${prefix}${res.error}`, "error");
                }
                setConfirmOpen(false);
              }}
            >
              Delete
            </button>
          </div>
        </div>
      </ModalCustom>

      {toast.visible && (
        <div className="fixed lg:w-1/2 bottom-4 left-1/2 -translate-x-1/2 z-40">
          <div
            className={`rounded-lg px-4 py-2 shadow flex justify-between items-center border
            ${toast.variant === "success"
                ? "border-green-200 bg-green-50 text-green-700"
                : "border-red-200 bg-red-50 text-red-700"
              }`}
          >
            {toast.msg}
            <button className="ml-2" onClick={hide}>
              &times;
            </button>
          </div>
        </div>
      )}
    </DashboardHeader>
  );
}
