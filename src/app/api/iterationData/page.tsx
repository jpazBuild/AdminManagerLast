"use client";

import React, { useMemo, useState } from "react";
import Image from "next/image";
import { DashboardHeader } from "@/app/Layouts/main";
import TextInputWithClearButton from "@/app/components/InputClear";
import { CopyPlus, MoreVertical, Trash2Icon } from "lucide-react";

import SidebarList from "./components/SidebarList";
import PackageCard from "./components/PackageCard";
import VariablesList from "./components/VariablesList";
import ConfirmModal from "./components/ConfirmModal";
import { Row } from "./types";
import selectIterationDataIcon from "../../../assets/apisImages/select-iterationData.svg";

import {SearchField} from "@/app/components/SearchField";
import useTags, { Tag } from "../hooks/useTags";

import { useIterationList } from "./hooks/useIterationList";
import { useIterationEditor } from "./hooks/useIterationEditor";
import { useToast } from "./hooks/useToast";

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
  // Sidebar list
  const { iterations, loadingList, listError, query, setQuery, refresh } = useIterationList();

  // Main editor
  const editor = useIterationEditor();

  // Toast
  const { toast, show, hide } = useToast();

  // Delete confirmation modal
  const [confirmOpen, setConfirmOpen] = useState(false);

  // Tags (for SearchField)
  const { tags, isLoadingTags } = useTags();
  const tagOptionsRaw = (tags ?? [])
    .map((t: string | Tag) => (typeof t === "string" ? t : t?.name ?? ""))
    .filter(Boolean);
  const tagOptionsVisible = tagOptionsRaw
    .filter((t) => !editor.tagNames.includes(t))
    .map((t) => ({ label: t, value: t }));

  // Local drafts support (duplicados locales, opcional)
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

  // Helper para guardar con validación + toast de faltantes
  const handleSave = async () => {
    const v = editor.validateForSave();
    if (!v.ok) {
      // Muestra qué falta
      const missingText = v.missingFields.join(", ");
      show(`Missing fields: ${missingText}`, "error", 3500);
      return;
    }
    const res = await editor.save(); // PUT si es nuevo, PATCH si es existente
    if (res.ok) {
      show(editor.isNew ? "Created." : "Saved.", "success");
      await refresh();
    } else {
      const prefix = res.status ? `(${res.status}) ` : "";
      show(`Save failed: ${prefix}${res.error}`, "error");
    }
  };

  return (
    <DashboardHeader pageType="api">
      <div className="flex gap-2 w-full h-full overflow-hidden">
        {/* Sidebar */}
        <SidebarList
          iterations={iterations}
          loading={loadingList}
          error={listError}
          query={query}
          setQuery={setQuery}
          onPick={async (h) => {
            await editor.loadFromHeader(h); // EXISTENTE -> PATCH
          }}
          onCreateBlank={() => {
            editor.createLocalBlankDraft("New iteration1"); // NUEVO -> PUT
            show("Blank package ready to edit.", "success", 1200);
          }}
          onUploadCsv={(file) => {
            editor.loadFromCsvFile(file).then((ok) => {
              if (ok) show("CSV loaded. Review and Save to create.", "success");
              else show("CSV could not be parsed.", "error");
            });
          }}
          selectedId={editor.selected?.id}
        />

        {/* Panel derecho */}
        <div className="flex flex-col w-full h-full">
          {/* Encabezado superior solo cuando hay selección */}
          {editor.selected && (
            <div className="px-6 pt-6 pb-2">
              <div className="flex items-start justify-between">
                <div>
                  <h1 className="text-[32px] font-bold leading-tight text-[#0A2342]">
                    Data packages
                  </h1>
                  <p className="text-[#7B8CA6] mt-1">Selected sets will be used in iterations.</p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      editor.reset();
                      show("Changes reset.", "success", 2000);
                    }}
                    className="inline-flex items-center gap-2 px-6 h-12 rounded-full border border-[#0A2342] text-[#0A2342] font-semibold hover:bg-[#F5F8FB] transition disabled:opacity-60"
                    disabled={!editor.isDirty && !editor.isNew}
                  >
                    Reset changes
                  </button>

                  {/* Save SIEMPRE clickeable; la validación muestra toast si falta algo */}
                  <button
                    onClick={handleSave}
                    className="inline-flex items-center gap-2 bg-[#062241] hover:bg-[#0A2F5C] text-white px-6 h-12 rounded-full font-semibold shadow transition disabled:opacity-60"
                    disabled={editor.saving}
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
                // header right side: Search tags and 3-dots menu
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
                        // no clear; es picker
                      />
                    </div>

                    {/* 3-dot menu */}
                    <div className="relative">
                      <button
                        className="p-2 rounded-md hover:bg-gray-100"
                        onClick={() => editor.setMenuOpen((m) => !m)}
                        aria-label="More options"
                      >
                        <MoreVertical className="w-5 h-5 text-primary/80" />
                      </button>
                      {editor.menuOpen && (
                        <div className="absolute right-0 mt-2 w-44 rounded-xl border border-gray-200 bg-white shadow-lg z-30">
                          <button
                            className="flex w-full items-center gap-2 px-4 py-2 text-sm text-[#0A2342] hover:bg-gray-50"
                            onClick={async () => {
                              editor.setMenuOpen(false);
                              const res = await editor.duplicateAsNew(); // PUT con name "Copy"
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
                            className="flex w-full items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                            onClick={() => {
                              editor.setMenuOpen(false);
                              // abre confirm modal
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
                {/* PILLS (tags seleccionados) */}
                {editor.tagNames.length > 0 && (
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
                )}

                <VariablesList
                  rows={editor.rows}
                  onUpdate={editor.updateRow}
                  onRemove={editor.removeRow}
                  onAdd={editor.addRow}
                />
              </PackageCard>
            ) : (
              <div className="flex flex-col items-center justify-center min-h-[50vh] w/full text-center rounded-2xl border border-[#E1E8F0] bg-white p-8">
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

            {/* Drafts locales (si los usas) */}
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

      {/* Confirm delete */}
      <ConfirmModal
        open={confirmOpen}
        title="Are you sure you want to delete this package?"
        message="This action cannot be undone."
        onCancel={() => setConfirmOpen(false)}
        onConfirm={async () => {
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
      />

      {/* Toast */}
      {toast.visible && (
        <div className="fixed lg:w-1/2 bottom-4 left-1/2 -translate-x-1/2 z-40">
          <div
            className={`rounded-lg px-4 py-2 shadow flex justify-between items-center border
            ${
              toast.variant === "success"
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
