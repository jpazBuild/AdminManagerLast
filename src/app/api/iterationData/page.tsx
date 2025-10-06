"use client";

import Image from "next/image";
import axios from "axios";
import { useEffect, useRef, useState } from "react";
import selectIterationDataIcon from "../../../assets/apisImages/select-iterationData.svg";
import { DashboardHeader } from "@/app/Layouts/main";
import { URL_API_ALB } from "@/config";

import Sidebar from "./components/Sidebar";
import PackageCard from "./components/PackageCard";
import Toast from "./components/Toast";
import ConfirmModal from "./components/ConfirmModal";

import { useIterationHeaders, IterationHeader } from "./hooks/useIterationHeaders";
import { usePackages, Row } from "./hooks/usePackages";
import { savePackages } from "./hooks/useSavePackages";

function rowsFromIterationDetails(detail: { iterationData: Array<{ iterationData: Record<string, unknown> }> }): Row[] {
  const rows: Row[] = [];
  for (const item of detail.iterationData) {
    for (const [key, val] of Object.entries(item.iterationData)) {
      if (val && typeof val === "object") {
        for (const [subKey, subVal] of Object.entries(val as Record<string, unknown>)) {
          rows.push({ variable: `${key}.${subKey}`, value: String(subVal) });
        }
      } else {
        rows.push({ variable: key, value: String(val) });
      }
    }
  }
  return rows;
}

export default function IterationDataPage() {
  // Sidebar
  const headers = useIterationHeaders();

  // Packages y acciones
  const {
    packages,
    collapsed,
    toggleCollapse,
    addBlank,
    addFromHeader,
    duplicate,
    remove,
    toggleSelected,
    updateName,
    updateDesc,
    addRow,
    delRow,
    updRow,
  } = usePackages();

  // Toast
  const [toast, setToast] = useState<{ visible: boolean; msg: string; variant: "success" | "error" }>({
    visible: false,
    msg: "",
    variant: "success",
  });
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const showToast = (msg: string, variant: "success" | "error" = "success") => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToast({ visible: true, msg, variant });
    toastTimer.current = setTimeout(() => setToast((t) => ({ ...t, visible: false })), 4000);
  };


  useEffect(() => () => toastTimer.current && clearTimeout(toastTimer.current), []);

  // Modal delete
  const [confirmId, setConfirmId] = useState<string | null>(null);

  // Selección desde el sidebar (GET detail)
  const onSelectHeader = async (h: IterationHeader) => {
    try {
      const { data: detail } = await axios.post(`${URL_API_ALB}iterationData`, { id: h.id });
      const rows = rowsFromIterationDetails(detail);
      const name = (h.name || (detail?.iterationData?.[0] as any)?.apisScriptsName || "Number1").trim();
      const resolvedId = ((detail?.iterationData?.[0] as any)?.id as string) || h.id;
      addFromHeader(resolvedId, name, h.description || "", rows);
    } catch (e) {
      console.error(e);
      // fallback en blanco con metadata del header
      addFromHeader(`${Date.now()}`, h.name || "Number1", h.description || "", []);
    }
  };

  // Guardar (PATCH)
  const onSave = async () => {
    try {
      await savePackages(packages);
      showToast("The data packages have been saved.", "success");
    } catch (e: any) {
      showToast(e?.response?.data?.message || "There was a problem saving.", "error");
    }
  };

  return (
    <DashboardHeader pageType="api">
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* Sidebar */}
        <aside className="md:col-span-3">
          <Sidebar
            items={headers.headers}
            loading={headers.loading}
            query={headers.query}
            setQuery={headers.setQuery}
            onSelect={onSelectHeader}
            onCreate={addBlank}
            onUploadCsv={(file) => {
              // TODO: aquí parseas el CSV y agregas rows o creas un package nuevo
              console.log("CSV subido:", file.name, file.size, file.type);
              // showToast(`Uploaded ${file.name}`, "success"); // si quieres feedback
            }}
          />

        </aside>

        {/* Panel principal */}
        <section className="md:col-span-9">
          {packages.length === 0 ? (
            <div className="flex flex-col items-center justify-center min-h-[50vh] w-full text-center rounded-2xl border border-[#E1E8F0] bg-white p-8">
              <Image src={selectIterationDataIcon} alt="Select a collection" className="h-20 w-auto rounded-md p-2" />
              <h2 className="text-2xl font-bold text-[#5A6ACF] mb-2">Create data packages</h2>
              <span className="block text-[#7B8CA6] text-base font-medium mb-6">
                Choose an item on the left or create a new one.
              </span>
              <div className="flex flex-row gap-4 mt-2 justify-center w-full">
                <button
                  onClick={addBlank}
                  className="flex items-center gap-2 bg-[#0A2342] text-white px-8 py-3 rounded-full font-semibold shadow hover:bg-[#18345A] transition-all text-lg"
                >
                  <span className="text-xl">+</span> New package
                </button>
              </div>
            </div>
          ) : (
            <>
              <div className="space-y-6">
                <h1 className="text-2xl font-bold text-[#0A2342]">Data packages</h1>

                {/* Fila: subtítulo a la izquierda, Save a la derecha */}
                <div className="mb-6 flex items-center justify-between gap-4">
                  <p className="text-[#7B8CA6]">Selected sets will be used in iterations.</p>

                  <button
                    onClick={onSave}
                    className="inline-flex items-center gap-2 bg-[#0A2342] text-white px-6 py-2.5 rounded-full font-semibold shadow hover:bg-[#18345A] transition-all"
                  >
                    Save
                  </button>
                </div>


                {packages.map((pkg) => (
                  <PackageCard
                    key={pkg.id}
                    pkg={pkg}
                    isCollapsed={collapsed.has(pkg.id)}
                    onToggleCollapse={toggleCollapse}
                    onToggleSelected={toggleSelected}
                    onUpdateName={updateName}
                    onUpdateDesc={updateDesc}
                    onAddRow={addRow}
                    onDelRow={delRow}
                    onUpdRow={updRow}
                    onDuplicate={duplicate}
                    onDelete={(id) => setConfirmId(id)}
                  />
                ))}

            

                <Toast
                  visible={toast.visible}
                  message={toast.msg}
                  variant={toast.variant}
                  onClose={() => setToast((t) => ({ ...t, visible: false }))}
                />
              </div>
            </>
          )}
        </section>
      </div>

      <ConfirmModal
        open={!!confirmId}
        title="Are you sure you want to delete this package?"
        message="This action cannot be undone."
        onCancel={() => setConfirmId(null)}
        onConfirm={() => {
          if (confirmId) {
            remove(confirmId);
            setConfirmId(null);
            showToast("The data package has been deleted.", "success");
          }
        }}
      />
    </DashboardHeader>
  );
}
