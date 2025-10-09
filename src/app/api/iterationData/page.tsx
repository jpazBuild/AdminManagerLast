"use client";

import React, { useMemo, useState } from "react";
import Image from "next/image";
import { DashboardHeader } from "@/app/Layouts/main";
<<<<<<< HEAD
import { URL_API_ALB } from "@/config";
import TextInputWithClearButton from "@/app/components/InputClear";
import { CopyPlus, MoreVertical, Trash2Icon } from "lucide-react";
=======
import SidebarList from "./components/SidebarList";
import PackageCard from "./components/PackageCard";
import VariablesList from "./components/VariablesList";
import TagPicker from "./components/tagPicker";
import ConfirmModal from "./components/ConfirmModal";
import { useIterationList } from "./hooks/useIterationList";
import { useIterationEditor } from "./hooks/useIterationEditor";
import { useToast } from "./hooks/useToast";
import { Row } from "./types";
import selectIterationDataIcon from "../../../assets/apisImages/select-iterationData.svg";
import { SearchField } from "@/app/components/SearchField";
import useTags, { Tag } from "../hooks/useTags";
>>>>>>> 092e7ae

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
  const { tags, isLoadingTags, error, refresh: refreshTags } = useTags();
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [selectedTag, setSelectedTag] = useState<string>("");
  const availableTags = tags
    .filter((t: string | Tag) => !selectedTags.includes(t.toString()))
    .map(tag => ({
      label: typeof tag === "string" ? tag : tag.name ?? "",
      value: typeof tag === "string" ? tag : tag.name ?? ""
    }))



  const [drafts, setDrafts] = useState<Draft[]>([]);
  const addDraftFromMain = () => {
    const snap = editor.duplicateLocalSnapshot();
    setDrafts((prev) => [
      ...prev,
      {
        id: newLocalId(),
        pkgId: snap.pkgId,
        pkgName: `${snap.pkgName || "Number"} Copy`,
        checked: snap.checked,
        tagNames: [...snap.tagNames],
        rows: snap.rows.map((r) => ({ ...r })),
      },
    ]);
    show("Draft duplicated below.", "success", 1800);
  };
  const duplicateDraft = (d: Draft) => {
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
  };
  const removeDraft = (id: string) => setDrafts((prev) => prev.filter((x) => x.id !== id));

  const actionsDisabled = !editor.isDirty || editor.saving;

  return (
    <DashboardHeader pageType="api">
      <div className="flex gap-2 w-full h-full overflow-hidden ">
        {/* Sidebar */}
        <SidebarList
          iterations={iterations}
          loading={loadingList}
          error={listError}
          query={query}
          setQuery={setQuery}
          onPick={async (h) => {
            await editor.loadFromHeader(h); // ← EXISTENTE → PATCH
          }}
          onCreateBlank={() => {
            // ← BORRADOR LOCAL EN BLANCO (sin API). El Save hará PUT.
            editor.createLocalBlankDraft("");
            show("Blank package ready to edit.", "success", 1200);
          }}
          onUploadCsv={(file) => {
            console.log("CSV uploaded:", file.name, file.size, file.type);
            show(`Uploaded ${file.name}`, "success", 2500);
          }}
          selectedId={editor.selected?.id}
        />

        {/* Panel derecho */}
        <div className=" flex flex-col w-full h-full">
          {editor.selected && (
            <div className="px-6 pt-6 pb-2">
              <div className="flex items-start justify-between">
                <div>
                  <h1 className="text-[32px] font-bold leading-tight text-[#0A2342]">
                    Data packages
                  </h1>
                  <p className="text-[#7B8CA6] mt-1">
                    Selected sets will be used in iterations.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      editor.reset();
                      show("Changes reset.", "success", 2000);
                    }}
                    className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full border border-[#0A2342] text-[#0A2342] font-semibold hover:bg-[#F5F8FB] transition disabled:opacity-60"
                    disabled={actionsDisabled}
                  >
                    Reset changes
                  </button>
                  <button
                    onClick={async () => {
                      const res = await editor.save(); // ← PUT si isNew, PATCH si existente
                      if (res.ok) {
                        show(editor.isNew ? "Created." : "Saved.", "success");
                        await refresh(); // refresca sidebar si fue PUT/PATCH
                      } else {
                        const prefix = res.status ? `(${res.status}) ` : "";
                        show(`Save failed: ${prefix}${res.error}`, "error");
                      }
                    }}
                    className="inline-flex items-center gap-2 bg-[#0A2342] text-white px-6 py-2.5 rounded-full font-semibold shadow hover:bg-[#18345A] transition disabled:opacity-60"
                    disabled={actionsDisabled}
                  >
                    {editor.saving ? "Saving..." : "Save"}
                  </button>
                </div>
              </div>
            </div>
          )}

          <div className="px-6 pb-8 flex flex-col gap-6 w-full h-full">
            {editor.selected ? (
              <PackageCard
                pkgName={editor.pkgName}
                pkgId={editor.pkgId}
                onChangeName={editor.setPkgName}
                checked={editor.pkgChecked}
                onToggleChecked={editor.toggleChecked}
                isCollapsed={editor.isCollapsed}
                toggleCollapse={() => editor.setIsCollapsed((v) => !v)}
                menuOpen={editor.menuOpen}
                setMenuOpen={editor.setMenuOpen}
                onDuplicate={addDraftFromMain}
                onDelete={() => setConfirmOpen(true)}
              >
                <div className="mb-4 overflow-x-hiden">

                  {/* <TagPicker
                    label="Search tags"
                    selected={editor.selectedTags ?? []}
                    options={availableTags ?? []}
                    onAdd={editor.addTag}
                    onRemove={editor.removeTag}
                  /> */}
                  <SearchField
                    label="Search tags"
                    placeholder="Search tags"
                    value={selectedTag}
                    className="z-30"
                    onChange={(val: string) => {
                      const v = (val || "").trim();
                      setSelectedTag(v);
                      if (!v) return;
                      // evita duplicados y fuera de catálogo
                      if (!selectedTags.includes(v) && (availableTags.length === 0 || availableTags.map(t => t.value).includes(v))) {
                        setSelectedTags(prev => [...prev, v]);
                        editor.addTag(v);
                        setSelectedTag("");
                      }
                    }}
                    options={availableTags
                      .filter((o) => !selectedTags.includes(o.value))
                      .map((o) => ({ label: o.label, value: o.value }))}
                  />
                </div>

                <VariablesList
                  rows={editor.rows}
                  onUpdate={editor.updateRow}
                  onRemove={editor.removeRow}
                  onAdd={editor.addRow}
                />
              </PackageCard>
            ) : (
<<<<<<< HEAD
                <>
                    {/* 🔹 SOLO aparece si hay packages */}


                    <div className="space-y-6 w-full lg:w-1/2 mx-auto">
                        <h1 className="text-2xl font-bold text-[#0A2342]">Data packages</h1>
                        <p className="text-[#7B8CA6] mb-6">
                            Selected sets will be used in iterations.
                        </p>
                        {packages.map((pkg) => (
                            <div
                                key={pkg.id}
                                className="rounded-2xl border border-[#E1E8F0] bg-white p-6"
                            >
                                {/* Header de la card */}
                                <div className="flex items-start gap-3">
                                    <input
                                        type="checkbox"
                                        className="mt-2 h-5 w-5 accent-[#0A2342] rounded"
                                        checked={pkg.selected}
                                        onChange={() => toggleSelected(pkg.id)}
                                    />
                                    <div className="flex-1">
                                        <TextInputWithClearButton
                                            id={`package-name-${pkg.id}`}
                                            label="Package name"
                                            placeholder="Number1"
                                            value={pkg.name}
                                            onChangeHandler={(e) => updateName(pkg.id, e.target.value)}
                                            isSearch={false}
                                        />
                                    </div>
                                    {/* 🔹 Botón Delete package con estilo */}
                                    <div className="relative">
                                        {/* Botón ⋮ */}
                                        <button
                                            onClick={() => setOpenMenu(openMenu === pkg.id ? null : pkg.id)}
                                            className="p-2 rounded-full hover:bg-gray-100"
                                        >
                                            <MoreVertical className="h-5 w-5 text-gray-600" />
                                        </button>

                                        {/* Dropdown */}
                                        {openMenu === pkg.id && (
                                            <div className="absolute right-0 mt-2 w-40 rounded-lg border border-gray-200 bg-white shadow-lg z-10">
                                                {/* Duplicate */}
                                                <button
                                                    onClick={() => {
                                                        const duplicate = {
                                                            ...pkg,
                                                            id: crypto.randomUUID(),
                                                            name: pkg.name + " Copy",
                                                        };
                                                        setPackages((prev) => [...prev, duplicate]);
                                                        setOpenMenu(null);
                                                    }}
                                                    className="flex items-center gap-2 w-full px-4 py-2 text-sm text-[#0A2342] hover:bg-gray-50"
                                                >
                                                    <CopyPlus className="w-4 h-4"/> Duplicate
                                                </button>

                                                {/* Delete */}
                                                <button
                                                    onClick={() => {
                                                        deletePackage(pkg.id);
                                                        setOpenMenu(null);
                                                    }}
                                                    className="flex items-center gap-2 w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                                                >
                                                    <Trash2Icon className="w-4 h-4"/> Delete
                                                </button>
                                            </div>
                                        )}
                                    </div>



                                </div>

                                {/* Columnas */}

                                <div className="mt-4 flex flex-col gap-2">
                                    {pkg.rows.map((row, i) => (
                                        <div key={i} className="flex gap-2 items-center">
                                            <TextInputWithClearButton
                                                id={`row-variable-${pkg.id}-${i}`}
                                                type="text"
                                                inputMode="text"
                                                value={row.variable}
                                                onChangeHandler={(e) => updateRow(pkg.id, i, "variable", e.target.value)}
                                                placeholder="Enter variable"
                                                label="Variable"
                                            />
                                            <TextInputWithClearButton
                                                id={`row-value-${pkg.id}-${i}`}
                                                type="text"
                                                inputMode="text"
                                                value={row.value}
                                                onChangeHandler={(e) => updateRow(pkg.id, i, "value", e.target.value)}
                                                placeholder="Enter value"
                                                label="Value"
                                            />
                                            <button
                                                onClick={() => deleteRow(pkg.id, i)}
                                                className="px-2"
                                            >
                                                <Trash2Icon className="w-5 h-5 text-primary/80" />
                                            </button>
                                        </div>
                                    ))}
                                </div>

                                {/* Add row */}
                                <button
                                    onClick={() => addRow(pkg.id)}
                                    className="inline-flex items-center gap-2 rounded-full border border-[#E1E8F0] px-4 py-2 text-[#0A2342] hover:bg-[#F5F8FB] mt-3"
                                >
                                    <span className="text-lg">＋</span> Add row
                                </button>
                            </div>
                        ))}

                        {/* Botones globales */}
                        <div className="flex gap-4">
                            <button
                                disabled={loadingNewPackage}
                                onClick={handleNewPackage}
                                className="flex items-center gap-2 bg-[#0A2342] text-white px-6 py-2.5 rounded-full font-semibold shadow hover:bg-[#18345A] transition-all disabled:opacity-60"
                            >
                                <span className="text-xl">+</span>
                                {loadingNewPackage ? "Creating..." : "New package"}
                            </button>
                            <button className="flex items-center gap-2 bg-white text-[#0A2342] px-6 py-2.5 rounded-full font-semibold border border-[#0A2342] shadow hover:bg-[#F5F8FB] transition-all">
                                Upload CSV
                            </button>
                        </div>
                    </div>
                </>
=======
              <div className="flex flex-col items-center justify-center min-h-[50vh] w/full text-center rounded-2xl border border-[#E1E8F0] bg-white p-8">
                <Image
                  src={selectIterationDataIcon}
                  alt="Select a collection"
                  className="h-20 w-auto rounded-md p-2"
                />
                <h2 className="text-2xl font-bold text-[#5A6ACF] mb-2">
                  Create data packages
                </h2>
                <span className="block text-[#7B8CA6] text-base font-medium mb-6">
                  Choose an item on the left or create a new one.
                </span>
              </div>
>>>>>>> 092e7ae
            )}

<<<<<<< HEAD
export default IterationDataPage;
=======
            {/* Drafts locales (si los usas) */}
            {drafts.map((d) => (
              <PackageCard
                key={d.id}
                pkgName={d.pkgName}
                pkgId={d.pkgId}
                onChangeName={(v) =>
                  setDrafts((prev) =>
                    prev.map((x) => (x.id === d.id ? { ...x, pkgName: v } : x))
                  )
                }
                checked={d.checked}
                onToggleChecked={() =>
                  setDrafts((prev) =>
                    prev.map((x) =>
                      x.id === d.id ? { ...x, checked: !x.checked } : x
                    )
                  )
                }
                isCollapsed={!!d.collapsed}
                toggleCollapse={() =>
                  setDrafts((prev) =>
                    prev.map((x) =>
                      x.id === d.id ? { ...x, collapsed: !x.collapsed } : x
                    )
                  )
                }
                menuOpen={!!d.menuOpen}
                setMenuOpen={(v) =>
                  setDrafts((prev) =>
                    prev.map((x) => (x.id === d.id ? { ...x, menuOpen: v } : x))
                  )
                }
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
                <div className="mb-4">
                  <TagPicker
                    label="Search tags"
                    selected={d.tagNames}
                    options={availableTags ?? []}
                    onAdd={(t) =>
                      setDrafts((prev) =>
                        prev.map((x) =>
                          x.id === d.id
                            ? {
                              ...x,
                              tagNames: x.tagNames.includes(t)
                                ? x.tagNames
                                : [...x.tagNames, t],
                            }
                            : x
                        )
                      )
                    }
                    onRemove={(t) =>
                      setDrafts((prev) =>
                        prev.map((x) =>
                          x.id === d.id
                            ? { ...x, tagNames: x.tagNames.filter((z) => z !== t) }
                            : x
                        )
                      )
                    }
                  />
                </div>

                <VariablesList
                  rows={d.rows}
                  onUpdate={(rowId, patch) =>
                    setDrafts((prev) =>
                      prev.map((x) =>
                        x.id === d.id
                          ? {
                            ...x,
                            rows: x.rows.map((r) =>
                              r.id === rowId ? { ...r, ...patch } : r
                            ),
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
                          ? {
                            ...x,
                            rows: [
                              ...x.rows,
                              { id: newLocalId(), variable: "", value: "" },
                            ],
                          }
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

      <ConfirmModal
        open={confirmOpen}
        title="Are you sure you want to delete this package?"
        message="This action cannot be undone."
        onCancel={() => setConfirmOpen(false)}
        onConfirm={async () => {
          const res = await editor.deleteOnServer();
          if (res.ok) {
            await refresh();
            show("The data package has been deleted.", "success");
          } else {
            const prefix = res.status ? `(${res.status}) ` : "";
            show(`Delete failed: ${prefix}${res.error}`, "error");
          }
          setConfirmOpen(false);
        }}
      />

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
>>>>>>> 092e7ae
