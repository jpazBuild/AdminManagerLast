"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import { DashboardHeader } from "@/app/Layouts/main";
import selectIterationDataIcon from "../../../assets/apisImages/select-iterationData.svg";
import SidebarList from "./components/SidebarList";
import PackageCard from "./components/PackageCard";
import VariablesList from "./components/VariablesList";
import TagChips from "./components/tagChips";
import ConfirmModal from "./components/ConfirmModal";
import { useIterationList } from "./hooks/useIterationList";
import { useIterationEditor } from "./hooks/useIterationEditor";
import { useToast } from "./hooks/useToast";
import useTags, { Tag } from "../hooks/useTags";
import {SearchField} from "@/app/components/SearchField";
import { Row } from "./types";

// --- Utils CSV simple ---
function parseCsvToRows(text: string): Row[] {
  // Espera un CSV con cabecera: variable,value
  // Soporta separador coma; líneas vacías ignoradas
  const lines = text.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
  if (lines.length === 0) return [];

  const header = lines[0].split(",").map(s => s.trim().toLowerCase());
  const varIdx = header.indexOf("variable");
  const valIdx = header.indexOf("value");

  const hasHeader = varIdx !== -1 && valIdx !== -1;

  const start = hasHeader ? 1 : 0;
  const rows: Row[] = [];
  for (let i = start; i < lines.length; i++) {
    const parts = lines[i].split(",");
    const variable = (hasHeader ? parts[varIdx] : parts[0])?.trim?.() ?? "";
    const value = (hasHeader ? parts[valIdx] : parts[1])?.trim?.() ?? "";
    if (!variable) continue;
    rows.push({
      id: `${Date.now()}-${i}-${Math.random().toString(36).slice(2,6)}`,
      variable,
      value,
    });
  }
  return rows;
}

export default function IterationDataPage() {
  const { iterations, loadingList, listError, query, setQuery, refresh } =
    useIterationList();
  const editor = useIterationEditor();
  const { toast, show, hide } = useToast();
  const [confirmOpen, setConfirmOpen] = useState(false);

  // Catálogo de tags -> opciones del SearchField
  const { tags } = useTags();
  const [searchTagText, setSearchTagText] = useState("");
  const availableTagOptions =
    (tags || []).map((t: string | Tag) => {
      const name = typeof t === "string" ? t : t?.name ?? "";
      return { label: name, value: name };
    }) || [];

  const actionsDisabled = !editor.isDirty || editor.saving;

  // === Auto-seleccionar el recién creado tras refresh ===
  useEffect(() => {
    // si ya hay seleccionado, no tocar
    // esto se usa justo después de crear desde CSV
  }, [iterations]);

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
            await editor.loadFromHeader(h); // cargar existente -> PATCH
          }}
          onCreateBlank={() => {
            editor.createLocalBlankDraft(""); // crear local en blanco -> PUT en Save
            show("Blank package ready to edit.", "success", 1200);
          }}
          onUploadCsv={(file) => {
            // === NUEVO: crear y guardar automáticamente desde CSV ===
            const baseName = (file?.name || "New Package").replace(/\.[^/.]+$/, "");

            const reader = new FileReader();
            reader.onload = async () => {
              try {
                const text = String(reader.result || "");
                // 1) Parsear CSV a filas variable/value
                const parsedRows = parseCsvToRows(text);

                // 2) Asegurar metadatos mínimos obligatorios para PUT si faltan
                // - description, createdBy, tagNames (usamos 'imported')
                const ensuredMeta: Row[] = [];
                const has = (key: string) => parsedRows.some(r => r.variable.trim().toLowerCase() === key);

                if (!has("description")) ensuredMeta.push({
                  id: `${Date.now()}-md-1`,
                  variable: "description",
                  value: `Imported from ${file.name}`,
                });
                if (!has("createdBy")) ensuredMeta.push({
                  id: `${Date.now()}-md-2`,
                  variable: "createdBy",
                  value: "Uploader",
                });
                // tagNames como fila no es estrictamente necesario porque usamos editor.addTag,
                // pero si quieres dejarla visible como fila:
                // if (!has("tagNames")) ensuredMeta.push({ id: ..., variable:"tagNames", value: "imported" });

                // 3) Crear borrador local con ese nombre
                editor.createLocalBlankDraft(baseName);

                // 4) Reemplazar filas con meta + CSV
                editor.replaceRows([...ensuredMeta, ...parsedRows]);

                // 6) Guardar (PUT, porque isNew=true en createLocalBlankDraft)
                const res = await editor.save();
                if (res.ok) {
                  show(`Created: ${baseName}`, "success", 2200);
                  // 7) Refrescar sidebar y auto-seleccionar la creada (por nombre)
                  await refresh();
                  const just = (iterations || []).find(it => it.name === baseName);
                  if (just) {
                    await editor.loadFromHeader(just);
                  }
                } else {
                  const prefix = res.status ? `(${res.status}) ` : "";
                  show(`Save failed: ${prefix}${res.error}`, "error");
                }
              } catch (err: any) {
                show(`CSV error: ${err?.message || "Invalid CSV"}`, "error");
              }
            };
            reader.onerror = () => {
              show("Failed to read CSV file.", "error");
            };
            reader.readAsText(file);
          }}
          selectedId={editor.selected?.id}
        />

        {/* Panel derecho */}
        <div className="flex flex-col w-full h-full">
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
                showPackageId={false}
                pkgName={editor.pkgName}
                onChangeName={editor.setPkgName}
                checked={editor.pkgChecked}
                onToggleChecked={editor.toggleChecked}
                isCollapsed={editor.isCollapsed}
                toggleCollapse={() => editor.setIsCollapsed((v) => !v)}
                menuOpen={editor.menuOpen}
                setMenuOpen={editor.setMenuOpen}
                // DUPLICAR: PUT en servidor y refresh; NO crea card local
                onDuplicate={async () => {
                  const res = await editor.duplicateAsNew();
                  if (res.ok) {
                    show("Duplicated.", "success");
                    await refresh();
                  } else {
                    const prefix = res.status ? `(${res.status}) ` : "";
                    show(`Duplicate failed: ${prefix}${res.error}`, "error");
                  }
                }}
                onDelete={() => setConfirmOpen(true)}
                // Search tags en el header (alineado con ⋮)
                headerExtras={
                  <div className="w-80">
                    <SearchField
                      label="Search tags"
                      placeholder="Search tags"
                      value={searchTagText}
                      onChange={(val: string) => {
                        const v = (val || "").trim();
                        setSearchTagText(v);
                        if (!v) return;
                        const inCatalog = availableTagOptions.some(
                          (o) => o.value === v
                        );
                        if (inCatalog && !editor.selectedTags.includes(v)) {
                          editor.addTag(v);
                          setSearchTagText("");
                        }
                      }}
                      options={availableTagOptions.filter(
                        (o) => !editor.selectedTags.includes(o.value)
                      )}
                      // onClear={() => setSearchTagText("")}
                    />
                  </div>
                }
              >
                {/* Chips de tags debajo del header */}
                <div className="mb-3">
                  <TagChips
                    tags={editor.selectedTags}
                    onRemove={editor.removeTag}
                  />
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
              <div className="flex flex-col items-center justify-center min-h-[50vh] w-full text-center rounded-2xl border border-[#E1E8F0] bg-white p-8">
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

      {/* Confirm Delete */}
      <ConfirmModal
        open={confirmOpen}
        title="Are you sure you want to delete this package?"
        message="This action cannot be undone."
        onCancel={() => setConfirmOpen(false)}
        onConfirm={async () => {
          const res = await editor.deleteOnServer();
          if (res.ok) {
            await refresh();     // refresca listado del sidebar
            editor.deselect();   // limpia selección -> empty state
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
