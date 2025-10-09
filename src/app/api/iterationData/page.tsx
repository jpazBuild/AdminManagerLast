"use client";

import React, { useState } from "react";
import Image from "next/image";
import { DashboardHeader } from "@/app/Layouts/main";
import SidebarList from "./components/SidebarList";
import PackageCard from "./components/PackageCard";
import VariablesList from "./components/VariablesList";
import ConfirmModal from "./components/ConfirmModal";
import { useIterationList } from "./hooks/useIterationList";
import { useIterationEditor } from "./hooks/useIterationEditor";
import { useToast } from "./hooks/useToast";
import selectIterationDataIcon from "../../../assets/apisImages/select-iterationData.svg";
import useTags, { Tag } from "../hooks/useTags";
import {SearchField} from "@/app/components/SearchField";

/** Pills para tags seleccionados */
function TagChips({
  tags,
  onRemove,
}: {
  tags: string[];
  onRemove: (tag: string) => void;
}) {
  if (!tags?.length) return null;
  return (
    <div className="mt-2 flex flex-wrap gap-2">
      {tags.map((t) => (
        <span
          key={t}
          className="inline-flex items-center gap-2 rounded-full bg-[#EEF3F8] text-[#0A2342] px-3 py-1 text-sm"
        >
          {t}
          <button
            type="button"
            aria-label={`Remove ${t}`}
            onClick={() => onRemove(t)}
            className="text-[#0A2342]/70 hover:text-[#0A2342]"
          >
            ×
          </button>
        </span>
      ))}
    </div>
  );
}

export default function IterationDataPage() {
  const { iterations, loadingList, listError, query, setQuery, refresh } = useIterationList();
  const editor = useIterationEditor();
  const { toast, show, hide } = useToast();
  const [confirmOpen, setConfirmOpen] = useState(false);

  // Tags disponibles (normalizados a label/value)
  const { tags, isLoadingTags } = useTags();
  const [searchTagText, setSearchTagText] = useState<string>("");

  const availableTagOptions = (tags || [])
    .map((t: string | Tag) => (typeof t === "string" ? t : (t?.name ?? "")))
    .filter(Boolean)
    .filter((t) => !editor.selectedTags.includes(t))
    .map((t) => ({ label: t, value: t }));

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
            await editor.loadFromHeader(h); // existente → PATCH
          }}
          onCreateBlank={() => {
            // nuevo borrador local → Save hará PUT
            editor.createLocalBlankDraft({
              description: "testcreate",
              createdAt: "1759529804491",
              createdBy: "92a4a7a4-8721-47b0-8666-ad551284cd46",
              createdByName: "Jose Camacho",
              type: "ITERATIONDATA",
              route: `ITERATIONDATA#${crypto?.randomUUID?.() ?? Date.now()}`,
            });
            show("Blank package ready to edit.", "success", 1200);
          }}
          onUploadCsv={(file) => {
            console.log("CSV uploaded:", file.name, file.size, file.type);
            show(`Uploaded ${file.name}`, "success", 2500);
          }}
          selectedId={editor.selected?.id}
        />

        {/* Panel derecho */}
        <div className="flex flex-col w-full h-full">
          {/* Título + acciones solo si hay algo seleccionado */}
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
                      const res = await editor.save(); // PUT si isNew, PATCH si existente
                      if (res.ok) {
                        show(editor.isNew ? "Created." : "Saved.", "success");
                        await refresh();
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
                onDuplicate={async () => {
                  const res = await editor.duplicateAsNew(); // crea copia vía PUT
                  if (res.ok) {
                    show("Package duplicated.", "success");
                    await refresh(); // refresca el sidebar
                  } else {
                    const prefix = res.status ? `(${res.status}) ` : "";
                    show(`Duplicate failed: ${prefix}${res.error}`, "error");
                  }
                }}
                onDelete={() => setConfirmOpen(true)}
                /** 👇 ocultamos el Package ID */
                showPackageId={false}
              >
                {/* Search + Pills */}
                <div className="mb-4">
                  <SearchField
                    label="Search tags"
                    placeholder="Search tags"
                    value={searchTagText}
                    className="z-30"
                    options={availableTagOptions}
                    disabled={isLoadingTags || availableTagOptions.length === 0}
                    onChange={(val: string) => {
                      const v = (val || "").trim();
                      setSearchTagText(v);
                      if (!v) return;
                      const found = availableTagOptions.find(
                        (o) => o.value.toLowerCase() === v.toLowerCase()
                      );
                      if (found && !editor.selectedTags.includes(found.value)) {
                        editor.addTag(found.value);
                        setSearchTagText(""); // limpiar input al añadir
                      }
                    }}
                  />

                  {/* Pills visibles */}
                  <TagChips tags={editor.selectedTags} onRemove={editor.removeTag} />
                </div>

                {/* Variables */}
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
