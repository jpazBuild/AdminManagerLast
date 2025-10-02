"use client";

import Image from "next/image";
import axios from "axios";
import { useEffect, useRef, useState } from "react";
import selectIterationDataIcon from "../../../assets/apisImages/select-iterationData.svg";
import { DashboardHeader } from "@/app/Layouts/main";
import { URL_API_ALB } from "@/config";
import TextInputWithClearButton from "@/app/components/InputClear";
import {
  CopyPlus,
  MoreVertical,
  Trash2Icon,
  AlertCircle,
  X,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

type Row = { variable: string; value: string };
type Pkg = { id: string; name: string; selected: boolean; rows: Row[] };

type IterationHeader = { id: string; name: string; description?: string };
type IterationDetailItem = {
  id: string;
  apisScriptsName: string;
  iterationData: Record<string, unknown>;
};
type IterationDetailResponse = {
  iterationData: IterationDetailItem[];
};

const IterationDataPage = () => {
  const [packages, setPackages] = useState<Pkg[]>([]);
  const [availableHeaders, setAvailableHeaders] = useState<IterationHeader[]>([]);
  const [iterationDetails, setIterationDetails] = useState<
    Record<string, IterationDetailResponse>
  >({});
  const [loadingNewPackage, setLoadingNewPackage] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // --- Toast success (deleted) ---
  const [toast, setToast] = useState<{ visible: boolean; message: string }>({
    visible: false,
    message: "",
  });
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const showToast = (message: string, duration = 4000) => {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    setToast({ visible: true, message });
    toastTimerRef.current = setTimeout(() => {
      setToast({ visible: false, message: "" });
      toastTimerRef.current = null;
    }, duration);
  };
  const closeToast = () => {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    setToast({ visible: false, message: "" });
    toastTimerRef.current = null;
  };
  useEffect(() => {
    return () => {
      if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    };
  }, []);

  // Modal de confirmación de borrado
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  // Helper de ID reutilizable y a prueba de entorno
  const genId = () =>
    typeof crypto !== "undefined" && typeof (crypto as any).randomUUID === "function"
      ? (crypto as any).randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2)}`;

  const rowsFromIterationDetails = (detail: IterationDetailResponse): Row[] => {
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
  };

  // Botón azul (solo en empty state): limpia, llama API y crea el primer package (con datos si hay, en blanco si no)
  const handleNewPackage = async () => {
    setLoadingNewPackage(true);
    setError(null);
    setPackages([]); // Reiniciar

    let created = false;

    try {
      const { data: headers } = await axios.post<IterationHeader[]>(
        `${URL_API_ALB}getIterationDataHeaders`,
        {}
      );
      setAvailableHeaders(headers || []);

      let rows: Row[] = [];

      if (headers && headers.length > 0) {
        const firstHeader = headers[0];
        try {
          const { data: detail } = await axios.post<IterationDetailResponse>(
            `${URL_API_ALB}iterationData`,
            { id: firstHeader.id }
          );
          setIterationDetails((prev) => ({ ...prev, [firstHeader.id]: detail }));
          rows = rowsFromIterationDetails(detail);
        } catch (err) {
          console.error("Error trayendo iterationData:", err);
        }
      }

      const newPkg: Pkg = {
        id: genId(),
        name: `Number1`,
        selected: true,
        rows: rows.length ? rows : [{ variable: "", value: "" }],
      };

      setPackages([newPkg]);
      created = true;
    } catch (err) {
      console.error("Error trayendo headers:", err);
      setError("No se pudo cargar la información de iteraciones.");
    } finally {
      if (!created) {
        setPackages([
          {
            id: genId(),
            name: "Number1",
            selected: true,
            rows: [{ variable: "", value: "" }],
          },
        ]);
      }
      setLoadingNewPackage(false);
    }
  };

  // Botón gris (cuando ya hay packages): agrega un package vacío SIN llamar al API
  const handleAddBlankPackage = () => {
    const nextIndex = packages.length + 1;
    const blankPkg: Pkg = {
      id: genId(),
      name: `Number${nextIndex}`,
      selected: true,
      rows: [{ variable: "", value: "" }],
    };
    setPackages((prev) => [...prev, blankPkg]);
  };

  const addRow = (pkgId: string) =>
    setPackages((prev) =>
      prev.map((p) =>
        p.id === pkgId ? { ...p, rows: [...p.rows, { variable: "", value: "" }] } : p
      )
    );
  const deleteRow = (pkgId: string, rowIndex: number) =>
    setPackages((prev) =>
      prev.map((p) =>
        p.id === pkgId ? { ...p, rows: p.rows.filter((_, i) => i !== rowIndex) } : p
      )
    );

  const updateRow = (pkgId: string, rowIndex: number, field: keyof Row, value: string) =>
    setPackages((prev) =>
      prev.map((p) =>
        p.id === pkgId
          ? {
              ...p,
              rows: p.rows.map((r, i) => (i === rowIndex ? { ...r, [field]: value } : r)),
            }
          : p
      )
    );

  const updateName = (pkgId: string, name: string) =>
    setPackages((prev) => prev.map((p) => (p.id === pkgId ? { ...p, name } : p)));

  const toggleSelected = (pkgId: string) =>
    setPackages((prev) =>
      prev.map((p) => (p.id === pkgId ? { ...p, selected: !p.selected } : p))
    );

  // --- Colapsado por card (sin tocar la estructura Pkg)
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());
  const toggleCollapse = (pkgId: string) => {
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(pkgId)) next.delete(pkgId);
      else next.add(pkgId);
      return next;
    });
  };

  const deletePackage = (pkgId: string) => {
    setPackages((prev) => prev.filter((p) => p.id !== pkgId));
    // limpiar estado de colapso si existía
    setCollapsed((prev) => {
      const next = new Set(prev);
      next.delete(pkgId);
      return next;
    });
  };

  // --- Menú & Modal handlers ---
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const openDeleteModal = (pkgId: string) => {
    setConfirmDeleteId(pkgId);
    setOpenMenu(null); // cerrar dropdown
  };
  const closeDeleteModal = () => setConfirmDeleteId(null);
  const handleConfirmDelete = () => {
    if (confirmDeleteId) {
      deletePackage(confirmDeleteId);
      showToast("The data package has been deleted.");
    }
    setConfirmDeleteId(null);
  };

  return (
    <DashboardHeader pageType="api">
      {packages.length === 0 ? (
        // --- EMPTY STATE ---
        <div className="flex flex-col items-center justify-center min-h-[60vh] w-full text-center">
          <Image
            src={selectIterationDataIcon}
            alt="Select a collection"
            className="h-20 w-auto rounded-md p-2"
          />
          <h2 className="text-2xl font-bold text-[#5A6ACF] mb-2">Create data packages</h2>
          <span className="block text-[#7B8CA6] text-base font-medium mb-6">
            To use in your iterations
          </span>

          {error && <div className="text-red-600 text-sm mb-3">{error}</div>}

          <div className="flex flex-row gap-4 mt-2 justify-center w-full">
            {/* Botón azul SOLO en empty state */}
            <button
              disabled={loadingNewPackage}
              onClick={handleNewPackage}
              className="flex items-center gap-2 bg-[#0A2342] text-white px-8 py-3 rounded-full font-semibold shadow hover:bg-[#18345A] transition-all text-lg disabled:opacity-60"
            >
              <span className="text-xl">+</span>
              {loadingNewPackage ? "Creating..." : "New package"}
            </button>
            <button className="flex items-center gap-2 bg-white text-[#0A2342] px-8 py-3 rounded-full font-semibold border border-[#0A2342] shadow hover:bg-[#F5F8FB] transition-all text-lg">
              Upload CSV
            </button>
          </div>
        </div>
      ) : (
        <>
          {/* 🔹 SOLO aparece si hay packages */}
          <div className="space-y-6 w-full lg:w-1/2 mx-auto">
            <h1 className="text-2xl font-bold text-[#0A2342]">Data packages</h1>
            <p className="text-[#7B8CA6] mb-6">Selected sets will be used in iterations.</p>
            {packages.map((pkg) => {
              const isCollapsed = collapsed.has(pkg.id);
              return (
                <div key={pkg.id} className="rounded-2xl border border-[#E1E8F0] bg-white p-6">
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

                    {/* Botón colapsar/expandir */}
                    <button
                      onClick={() => toggleCollapse(pkg.id)}
                      aria-expanded={!isCollapsed}
                      aria-controls={`pkg-content-${pkg.id}`}
                      title={isCollapsed ? "Expand" : "Collapse"}
                      className="p-2 rounded-full hover:bg-gray-100"
                    >
                      {isCollapsed ? (
                        <ChevronDown className="h-5 w-5 text-gray-600" />
                      ) : (
                        <ChevronUp className="h-5 w-5 text-gray-600" />
                      )}
                    </button>

                    {/* Menú ⋮ */}
                    <div className="relative">
                      <button
                        onClick={() => setOpenMenu(openMenu === pkg.id ? null : pkg.id)}
                        className="p-2 rounded-full hover:bg-gray-100"
                      >
                        <MoreVertical className="h-5 w-5 text-gray-600" />
                      </button>

                      {openMenu === pkg.id && (
                        <div className="absolute right-0 mt-2 w-40 rounded-lg border border-gray-200 bg-white shadow-lg z-10">
                          <button
                            onClick={() => {
                              const duplicate = {
                                ...pkg,
                                id: genId(),
                                name: pkg.name + " Copy",
                              };
                              setPackages((prev) => [...prev, duplicate]);
                              setOpenMenu(null);
                            }}
                            className="flex items-center gap-2 w-full px-4 py-2 text-sm text-[#0A2342] hover:bg-gray-50"
                          >
                            <CopyPlus className="w-4 h-4" /> Duplicate
                          </button>

                          <button
                            onClick={() => openDeleteModal(pkg.id)}
                            className="flex items-center gap-2 w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                          >
                            <Trash2Icon className="w-4 h-4" /> Delete
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Contenido colapsable */}
                  <div
                    id={`pkg-content-${pkg.id}`}
                    className={`${isCollapsed ? "hidden" : "block"}`}
                  >
                    <div className="mt-4 flex flex-col gap-2">
                      {pkg.rows.map((row, i) => (
                        <div key={i} className="flex gap-2 items-center">
                          <TextInputWithClearButton
                            id={`row-variable-${pkg.id}-${i}`}
                            type="text"
                            inputMode="text"
                            value={row.variable}
                            onChangeHandler={(e) =>
                              updateRow(pkg.id, i, "variable", e.target.value)
                            }
                            placeholder="Enter variable"
                            label="Variable"
                          />
                          <TextInputWithClearButton
                            id={`row-value-${pkg.id}-${i}`}
                            type="text"
                            inputMode="text"
                            value={row.value}
                            onChangeHandler={(e) =>
                              updateRow(pkg.id, i, "value", e.target.value)
                            }
                            placeholder="Enter value"
                            label="Value"
                          />
                          <button onClick={() => deleteRow(pkg.id, i)} className="px-2">
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
                </div>
              );
            })}

            {/* Botones globales cuando YA hay packages */}
            <div className="flex gap-4">
              <button
                onClick={handleAddBlankPackage}
                className="flex items-center gap-2 bg-gray-100 text-[#0A2342] px-6 py-2.5 rounded-full font-semibold border border-gray-300 shadow hover:bg-gray-200 transition-all"
              >
                <span className="text-xl">+</span>
                New package
              </button>
              <button className="flex items-center gap-2 bg-white text-[#0A2342] px-6 py-2.5 rounded-full font-semibold border border-[#0A2342] shadow hover:bg-[#F5F8FB] transition-all">
                Upload CSV
              </button>
            </div>

            {/* Toast debajo de packages */}
            {toast.visible && (
              <div className="mt-4">
                <div
                  role="status"
                  aria-live="polite"
                  className="flex w-full items-center justify-between rounded-2xl border border-green-200 bg-green-50 px-5 py-3 text-green-700 shadow"
                >
                  <span className="text-base font-semibold">{toast.message}</span>
                  <button
                    onClick={closeToast}
                    aria-label="Close notification"
                    className="rounded-full p-1 hover:bg-green-100/70"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </>
      )}

      {/* Modal de confirmación de borrado */}
      {confirmDeleteId && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
          role="dialog"
          aria-modal="true"
        >
          {/* Overlay */}
          <div
            className="absolute inset-0 bg-black/30"
            onClick={closeDeleteModal}
            aria-hidden="true"
          />

          {/* Card */}
          <div className="relative z-10 w-[min(560px,90vw)] rounded-2xl bg-white p-6 shadow-xl">
            {/* Close (X) */}
            <button
              onClick={closeDeleteModal}
              className="absolute right-4 top-4 rounded-full p-1 hover:bg-gray-100"
              aria-label="Close"
            >
              <X className="h-5 w-5 text-gray-500" />
            </button>

            {/* Icono */}
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-red-50">
              <AlertCircle className="h-7 w-7 text-red-600" />
            </div>

            {/* Título y texto */}
            <h3 className="text-center text-xl font-semibold text-[#0A2342]">
              Are you sure you want to delete this package?
            </h3>
            <p className="mt-1 text-center text-[#7B8CA6]">This action cannot be undone.</p>

            {/* Acciones */}
            <div className="mt-6 grid grid-cols-2 gap-3">
              <button
                onClick={closeDeleteModal}
                className="inline-flex items-center justify-center rounded-full border border-[#0A2342] px-6 py-2.5 font-semibold text-[#0A2342] hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDelete}
                className="inline-flex items-center justify-center rounded-full bg-red-600 px-6 py-2.5 font-semibold text-white hover:bg-red-700"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardHeader>
  );
};

export default IterationDataPage;
