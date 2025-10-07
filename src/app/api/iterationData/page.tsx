"use client";

import React, { useMemo, useState } from "react";
import { DashboardHeader } from "@/app/Layouts/main";
import { Settings, RefreshCcw } from "lucide-react";

import { useIterationList } from "./hooks/useIterationList";
import { useIterationEditor } from "./hooks/useIterationEditor";
import { useToast } from "./hooks/useToast";

import SidebarList from "./components/SidebarList";
import PageHeader from "./components/pageHeader";
import PackageCard from "./components/PackageCard";
import VariablesList from "./components/VariablesList";
import ConfirmModal from "./components/ConfirmModal";

export default function IterationDataPage() {
  // data
  const { iterations, loadingList, listError, query, setQuery, setIterations } = useIterationList();
  const editor = useIterationEditor();
  const { toast, show, hide } = useToast();

  // delete confirm
  const [confirmOpen, setConfirmOpen] = useState(false);

  // helpers para lista local
  const pushHeader = (h: any) => setIterations(prev => [h, ...prev]);
  const removeHeaderById = (id: string) => setIterations(prev => prev.filter(x => x.id !== id));

  const filteredRows = useMemo(() => editor.rows, [editor.rows]); // si quisieras filtrar por query, aquí

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
          onPick={editor.loadFromHeader}
          onCreateBlank={() => {
            // create en el editor: reusamos loadFromHeader con un header temporal
            const temp = { id: crypto?.randomUUID?.() ?? `${Date.now()}`, name: "Number1", description: "" };
            editor.loadFromHeader(temp as any);
          }}
          selectedId={editor.selected?.id}
        />

        {/* Panel derecho */}
        <div className="flex h-full w-full flex-col overflow-hidden">
          <PageHeader
            onSave={async () => {
              const res = await editor.save();
              if (res.ok) {
                // Puedes usar res.status === 200/204 aquí si quieres mostrarlo
                show("Saved.", "success");
              } else {
                // Muestra el status si existe y el mensaje que vino del backend
                const prefix = res.status ? `(${res.status}) ` : "";
                show(`Save failed: ${prefix}${res.error}`, "error");
              }
            }}
            disabled={!editor.selected || editor.saving}
          />

          <div className="flex-1 flex flex-col items-center">
            {editor.selected ? (
              <div className="w-full max-w-3xl p-4">
                <PackageCard
                  pkgName={editor.pkgName}
                  pkgId={editor.pkgId}
                  onChangeName={editor.setPkgName}
                  isCollapsed={editor.isCollapsed}
                  toggleCollapse={() => editor.setIsCollapsed(v => !v)}
                  menuOpen={editor.menuOpen}
                  setMenuOpen={editor.setMenuOpen}
                  onDuplicate={() => {
                    editor.duplicate((h) => pushHeader(h));
                    show("Package duplicated.", "success", 2000);
                  }}
                  onDelete={() => setConfirmOpen(true)}
                >
                  <VariablesList
                    rows={filteredRows}
                    onUpdate={editor.updateRow}
                    onRemove={editor.removeRow}
                    onAdd={editor.addRow}
                  />
                  <div className="flex gap-2 mt-4">
                    <button
                      className="px-4 py-2 rounded-lg border text-sm hover:bg-gray-50 disabled:opacity-60"
                      disabled={!editor.isDirty}
                      onClick={() => { editor.reset(); show("Changes reset.", "success", 2000); }}
                    >
                      Reset changes
                    </button>
                  </div>
                </PackageCard>
              </div>
            ) : (
              <div className="flex w-full h-full items-center justify-center p-6">
                <div className="text-center max-w-md">
                  <RefreshCcw className="mx-auto w-16 h-16 text-[#3956E8]" />
                  <h2 className="mt-6 text-[32px] font-bold text-[#5A6ACF]">Create data packages</h2>
                  <p className="mt-2 text-lg text-[#7B8CA6]">Choose an item on the left or create a new one.</p>
                  <button
                    onClick={() => {
                      const temp = { id: crypto?.randomUUID?.() ?? `${Date.now()}`, name: "Number1", description: "" };
                      editor.loadFromHeader(temp as any);
                    }}
                    className="mt-8 inline-flex items-center gap-2 bg-[#0A2342] text-white px-8 py-4 rounded-full font-semibold shadow hover:bg-[#18345A] transition-all text-lg"
                  >
                    <span className="text-xl">+</span> New package
                  </button>
                </div>
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
        onConfirm={() => {
          editor.removePackage(removeHeaderById);
          setConfirmOpen(false);
          show("The data package has been deleted.", "success");
        }}
      />

      {/* Toast */}
      {toast.visible && (
        <div className="fixed lg:w-1/2 bottom-4 left-1/2 -translate-x-1/2 z-40">
          <div className={`rounded-lg px-4 py-2 shadow flex justify-between items-center border
            ${toast.variant === "success" ? "border-green-200 bg-green-50 text-green-700" : "border-red-200 bg-red-50 text-red-700"}`}>
            {toast.msg}
            <button className="ml-2" onClick={hide}>&times;</button>
          </div>
        </div>
      )}
    </DashboardHeader>
  );
}
