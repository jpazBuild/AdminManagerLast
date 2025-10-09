"use client";

import React, { useMemo, useState } from "react";
import Image from "next/image";
import { DashboardHeader } from "@/app/Layouts/main";
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

  const availableTags = useMemo(() => {
    const set = new Set<string>();
    iterations.forEach((it) => (it.tagNames || []).forEach((t) => set.add(String(t))));
    return Array.from(set);
  }, [iterations]);

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
      <div className="flex gap-2 w-full">
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
        <div className="flex-1 flex flex-col">
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

          <div className="px-6 pb-8 flex flex-col gap-6">
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
                <div className="mb-4">
                  <TagPicker
                    label="Search tags"
                    selected={editor.selectedTags ?? []}
                    options={availableTags ?? []}
                    onAdd={editor.addTag}
                    onRemove={editor.removeTag}
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
            )}

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
