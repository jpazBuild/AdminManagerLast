"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import axios from "axios";
import { DashboardHeader } from "@/app/Layouts/main";
import TextInputWithClearButton from "@/app/components/InputClear";
import { URL_API_ALB } from "@/config";
import {
  Settings,
  Trash2Icon,
  RefreshCcw,
  ChevronDown,
  ChevronUp,
  MoreVertical,
  CopyPlus,
} from "lucide-react";

/** === Tipos === */
type IterationHeader = {
  id: string;
  name: string;
  description?: string;
  tagNames?: string[];
  tagIds?: string[];
  createdAt?: number;
  createdBy?: string;
  createdByName?: string;
  type?: string;
  route?: string;
};

type Row = { id: string; variable: string; value: string };

type DetailResponse = {
  id: string;
  name: string;
  description?: string;
  tagNames?: string[];
  tagIds?: string[];
  createdAt?: number;
  createdBy?: string;
  createdByName?: string;
  type?: string;
  route?: string;
  iterationData: Array<{
    id?: string;
    apisScriptsName?: string;
    iterationCount?: number;
    iterationData: Record<string, unknown>;
    order?: number;
    createdBy?: string;
  }>;
};

/** === Utils === */
const apiUrl = (path: string) => new URL(path, URL_API_ALB).toString();
const makeRowId = () => `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

// variables “reservadas” que NO van a iterationData
const RESERVED_META_KEYS = new Set([
  "description",
  "createdAt",
  "createdBy",
  "createdByName",
  "tagIds",
  "tagNames",
  "type",
  "route",
  "id",
  "name",
]);

const rowsFromIterationData = (detail?: DetailResponse | null): Row[] => {
  if (!detail || !Array.isArray(detail.iterationData)) return [];
  const out: Row[] = [];
  for (const item of detail.iterationData) {
    for (const [key, val] of Object.entries(item.iterationData || {})) {
      if (val && typeof val === "object") {
        for (const [subKey, subVal] of Object.entries(val as Record<string, unknown>)) {
          out.push({ id: makeRowId(), variable: `${key}.${subKey}`, value: String(subVal) });
        }
      } else {
        out.push({ id: makeRowId(), variable: key, value: String(val) });
      }
    }
  }
  return out;
};

const metaRowsFromDetail = (detail?: Partial<DetailResponse> | null): Row[] => {
  if (!detail) return [];
  const items: Array<[string, string | number | string[] | undefined]> = [
    ["description", detail.description],
    ["createdAt", detail.createdAt],
    ["createdBy", detail.createdBy],
    ["createdByName", detail.createdByName],
    ["tagIds", detail.tagIds],
    ["tagNames", detail.tagNames],
    ["type", detail.type],
    ["route", detail.route],
  ];

  return items
    .filter(([, v]) => v !== undefined && v !== null)
    .map(([k, v]) => {
      let value = "";
      if (Array.isArray(v)) value = v.join(", ");
      else if (typeof v === "number") value = String(v);
      else value = String(v);
      return { id: makeRowId(), variable: k, value };
    });
};

// si la API responde con array directo o { data: [] } u otras llaves
const extractArray = <T,>(payload: any): T[] => {
  if (!payload) return [];
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload.data)) return payload.data;
  for (const key of ["headers", "items", "result", "results", "list", "rows"]) {
    if (Array.isArray(payload[key])) return payload[key];
  }
  for (const v of Object.values(payload)) {
    if (Array.isArray(v) && v.some((x) => x && typeof x === "object" && ("id" in x || "name" in x))) {
      return v as T[];
    }
  }
  return [];
};

/** === Página principal === */
export default function IterationDataPage() {
  // Sidebar / listado
  const [iterations, setIterations] = useState<IterationHeader[]>([]);
  const [loadingList, setLoadingList] = useState(false);
  const [listError, setListError] = useState<string | null>(null);
  const [query, setQuery] = useState("");

  // Selección + edición
  const [selected, setSelected] = useState<IterationHeader | null>(null);

  // En card: name (editable) + id (read-only)
  const [pkgName, setPkgName] = useState("");
  const [pkgId, setPkgId] = useState("");

  // Metadatos “de respaldo”
  const [fallbackTagNames, setFallbackTagNames] = useState<string[]>([]);

  // Filas variables/valores
  const [rows, setRows] = useState<Row[]>([]);
  const originalRowsRef = useRef<Row[]>([]);

  // Acordeón (colapsar Variables)
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Menu more options
  const [menuOpen, setMenuOpen] = useState(false);
  const menuBtnRef = useRef<HTMLButtonElement | null>(null);

  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [toastError, setToastError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  /** === Fetch headers (lista) === */
  const fetchHeaders = async () => {
    setLoadingList(true);
    setListError(null);
    const ENDPOINT = apiUrl("getIterationDataHeaders");
    try {
      const res = await axios.post(ENDPOINT, {}, { timeout: 20000, withCredentials: true });
      const arr = extractArray<IterationHeader>(res.data);
      setIterations(arr);
    } catch (postErr: any) {
      try {
        const resGet = await axios.get(ENDPOINT, { timeout: 20000, withCredentials: true });
        const arr = extractArray<IterationHeader>(resGet.data);
        setIterations(arr);
      } catch (getErr: any) {
        setIterations([]);
        setListError(getErr?.message || "Failed to load iterations.");
      }
    } finally {
      setLoadingList(false);
    }
  };

  useEffect(() => { fetchHeaders(); }, []);

  useEffect(() => {
    // Log que pediste
    console.log("headers:", { raw: iterations, loadingList, listError });
  }, [iterations, loadingList, listError]);

  /** === Selección desde la lista === */
  const onPickIteration = async (h: IterationHeader) => {
    setSelected(h);
    setIsCollapsed(false); // al cambiar de item, expandimos por defecto
    setMenuOpen(false);

    const DETAIL_ENDPOINT = apiUrl("iterationData");
    console.log("[detail] POST", DETAIL_ENDPOINT, { id: h.id });

    try {
      const { data } = await axios.post<DetailResponse>(DETAIL_ENDPOINT, { id: h.id }, { withCredentials: true });
      console.log("[detail] OK", data);

      setPkgId(String(data?.id ?? h.id ?? ""));
      setPkgName(String(data?.name ?? h.name ?? ""));
      setFallbackTagNames(data?.tagNames ?? h.tagNames ?? []);

      const metaRows = metaRowsFromDetail(data);
      const iterRows = rowsFromIterationData(data);
      const merged = [...metaRows, ...iterRows];
      setRows(merged.length ? merged : [{ id: makeRowId(), variable: "", value: "" }]);
      originalRowsRef.current = JSON.parse(JSON.stringify(merged));
    } catch (e) {
      console.error("[detail] ERR", e);
      setPkgId(h.id);
      setPkgName(h.name || "");
      setFallbackTagNames(h.tagNames ?? []);
      const metaRows = metaRowsFromDetail(h as any);
      const merged = metaRows.length ? metaRows : [{ id: makeRowId(), variable: "", value: "" }];
      setRows(merged);
      originalRowsRef.current = JSON.parse(JSON.stringify(merged));
    }
  };

  /** === Crear paquete en blanco (empty state) === */
  const createBlankPackage = () => {
    const tempId =
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : `${Date.now()}`;

    const blank: IterationHeader = { id: tempId, name: "Number1", description: "", tagNames: [] };

    setSelected(blank);
    setPkgId(tempId);
    setPkgName(blank.name);
    setFallbackTagNames([]);

    const blankRows = [{ id: makeRowId(), variable: "", value: "" }];
    setRows(blankRows);
    originalRowsRef.current = JSON.parse(JSON.stringify(blankRows));
    setIsCollapsed(false);
    setMenuOpen(false);
  };

  /** === Filtro de filas por query (opcional) === */
  const filteredRows = useMemo(() => {
    if (!query.trim()) return rows;
    const q = query.toLowerCase();
    return rows.filter(
      r => r.variable.toLowerCase().includes(q) || String(r.value).toLowerCase().includes(q)
    );
  }, [rows, query]);

  /** === Dirty & Reset === */
  const isDirty = useMemo(() => {
    const a = rows;
    const b = originalRowsRef.current;
    if (a.length !== b.length) return true;
    for (let i = 0; i < a.length; i++) {
      if (a[i].variable !== b[i].variable || a[i].value !== b[i].value) return true;
    }
    if ((selected?.name || "") !== pkgName) return true;
    return false;
  }, [rows, selected, pkgName]);

  const doReset = () => {
    const snap = JSON.parse(JSON.stringify(originalRowsRef.current)) as Row[];
    setRows(snap.length ? snap : [{ id: makeRowId(), variable: "", value: "" }]);
    setPkgName(selected?.name || "");
    setToastMsg("Changes have been reset to the last loaded version.");
    setTimeout(() => setToastMsg(null), 3000);
  };

  /** === Acciones filas === */
  const addRow = () => setRows(prev => [...prev, { id: makeRowId(), variable: "", value: "" }]);
  const removeRow = (id: string) => setRows(prev => prev.filter(r => r.id !== id));
  const updateRow = (id: string, patch: Partial<Row>) =>
    setRows(prev => prev.map(r => (r.id === id ? { ...r, ...patch } : r)));

  /** === More options (duplicate / delete) === */
  const duplicateSelected = () => {
    if (!selected) return;
    const newId =
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : `${Date.now()}`;
    const newHeader: IterationHeader = {
      ...selected,
      id: newId,
      name: `${pkgName || selected.name} Copy`,
    };
    // dup rows
    const clonedRows = JSON.parse(JSON.stringify(rows)) as Row[];

    // agrega a la lista y selecciona
    setIterations(prev => [newHeader, ...prev]);
    setSelected(newHeader);
    setPkgId(newId);
    setPkgName(newHeader.name);
    setRows(clonedRows.length ? clonedRows : [{ id: makeRowId(), variable: "", value: "" }]);
    originalRowsRef.current = JSON.parse(JSON.stringify(clonedRows));
    setMenuOpen(false);
    setToastMsg("Package duplicated.");
    setTimeout(() => setToastMsg(null), 2500);
  };

  const [confirmOpen, setConfirmOpen] = useState(false);
  const openDeleteConfirm = () => setConfirmOpen(true);
  const closeDeleteConfirm = () => setConfirmOpen(false);

  const confirmDelete = () => {
    if (!selected) return;
    const idToRemove = selected.id;
    // quita de la lista local
    setIterations(prev => prev.filter(h => h.id !== idToRemove));
    // limpia selección
    setSelected(null);
    setPkgId("");
    setPkgName("");
    setRows([]);
    setMenuOpen(false);
    setConfirmOpen(false);
    setToastMsg("The data package has been deleted.");
    setTimeout(() => setToastMsg(null), 3000);
  };

  // cerrar menú con click fuera
  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      if (!menuOpen) return;
      const target = e.target as Node;
      if (menuBtnRef.current && !menuBtnRef.current.contains(target)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("click", onDocClick);
    return () => document.removeEventListener("click", onDocClick);
  }, [menuOpen]);

  /** === Save (PATCH) === */
  const onSave = async () => {
    if (!selected) return;
    setSaving(true);

    const meta: Record<string, string> = {};
    for (const r of rows) {
      const key = r.variable.trim();
      if (!key) continue;
      if (RESERVED_META_KEYS.has(key)) meta[key] = r.value;
    }

    const description = meta["description"] ?? "";
    const tagNames =
      (meta["tagNames"] ? meta["tagNames"].split(",").map(s => s.trim()).filter(Boolean) : fallbackTagNames) ?? [];

    const iterationVars = rows.filter(r => !RESERVED_META_KEYS.has(r.variable.trim()) && r.variable.trim() !== "");

    const iterationDataObject = iterationVars.reduce<Record<string, any>>((acc, r) => {
      const [root, ...rest] = r.variable.split(".");
      if (!root) return acc;
      if (rest.length === 0) {
        acc[root] = r.value;
      } else {
        acc[root] = acc[root] || {};
        let cursor = acc[root] as Record<string, any>;
        for (let i = 0; i < rest.length - 1; i++) {
          const k = rest[i];
          cursor[k] = cursor[k] || {};
          cursor = cursor[k];
        }
        cursor[rest[rest.length - 1]] = r.value;
      }
      return acc;
    }, {});

    const body = {
      id: pkgId,
      tagNames,
      name: pkgName.trim(),
      description,
      iterationData: [
        {
          id: pkgId,
          iterationCount: 1,
          iterationData: iterationDataObject,
          order: 0,
          apisScriptsName: selected.name,
          createdBy: selected.createdByName || selected.createdBy || "",
        },
      ],
      updatedBy: selected.createdByName || selected.createdBy || "",
    };

    try {
      console.log("[PATCH body]", body);
      // await axios.patch(apiUrl("iterationData"), body, { withCredentials: true });
      setToastMsg("Payload printed in console. Ready to PATCH.");
      setTimeout(() => setToastMsg(null), 3000);
      originalRowsRef.current = JSON.parse(JSON.stringify(rows));
    } catch (e) {
      console.error("[PATCH error]", e);
      setToastError("Error while saving changes.");
      setTimeout(() => setToastError(null), 3000);
    } finally {
      setSaving(false);
    }
  };

  /** === UI === */
  return (
    <DashboardHeader pageType="api">
      <div className="flex gap-2 w-full h-full overflow-hidden">
        {/* Sidebar simple (lista de iterations) */}
        <div className="w-72 border-r border-primary/10 bg-white flex-shrink-0 flex flex-col overflow-hidden">
          <div className="flex-shrink-0 p-4 bg-white border-b border-primary/10">
            <TextInputWithClearButton
              id="search-iterations"
              label="Search iterations"
              value={query}
              placeholder="Search iterations"
              isSearch
              onChangeHandler={(e) => setQuery(e.target.value)}
            />
          </div>

          <div className="max-h-[calc(100vh-200px)] overflow-y-auto">
            {loadingList ? (
              <div className="p-4 text-sm text-gray-500">Loading...</div>
            ) : iterations.length > 0 ? (
              <div className="flex flex-col gap-1 p-2">
                {iterations.map((it, idx) => (
                  <div
                    key={it.id}
                    className={`p-3 cursor-pointer rounded-lg hover:bg-primary/5 ${
                      selected?.id === it.id ? "bg-primary/10" : ""
                    }`}
                    onClick={() => onPickIteration(it)}
                    title={it.description || it.name}
                  >
                    <h3 className="font-medium text-primary/80">{`Iteration ${idx + 1}`}</h3>
                    <p className="text-xs text-gray-500 truncate">{it.name}</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex-1 flex items-center justify-center p-4">
                <p className="text-sm text-gray-500">{listError ?? "No iterations found."}</p>
              </div>
            )}
          </div>
        </div>

        {/* Panel derecho */}
        <div className="flex h-full w-full flex-col overflow-hidden">
          {/* Header superior: título + Save */}
          <div className="px-4 pt-6">
            <div className="flex items-start md:items-center justify-between gap-4">
              <div>
                <h1 className="text-[32px] leading-9 font-bold text-[#0A2342]">Data packages</h1>
                <p className="text-[#7B8CA6] mt-1">Selected sets will be used in iterations.</p>
              </div>
              <button
                onClick={onSave}
                className="shrink-0 inline-flex items-center gap-2 bg-[#0A2342] text-white px-6 py-3 rounded-full font-semibold shadow hover:bg-[#18345A] transition-all disabled:opacity-60"
                disabled={saving || !selected}
              >
                {saving ? "Saving..." : "Save"}
              </button>
            </div>
          </div>

          <div className="flex-1 flex flex-col items-center">
            {selected ? (
              <div className="w-full max-w-3xl p-4">
                {/* Card con Package name/id + Variables */}
                <div className="relative rounded-xl border border-primary/10 bg-white p-4">
                  {/* Encabezado de la card + acordeón + more options */}
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 flex-1">
                      <TextInputWithClearButton
                        id="pkg-name"
                        label="Package name"
                        value={pkgName}
                        placeholder="Number1"
                        isSearch={false}
                        onChangeHandler={(e) => setPkgName(e.target.value)}
                      />
                      <div>
                        <label className="mb-1 block text-sm font-medium text-gray-600">Package ID</label>
                        <input
                          className="w-full rounded-xl border border-[#E1E8F0] bg-gray-50 px-3 py-2 text-[#0A2342] shadow-sm"
                          value={pkgId}
                          readOnly
                          aria-readonly="true"
                        />
                      </div>
                    </div>

                    <div className="flex items-center gap-2 mt-6 md:mt-0">
                      {/* Acordeón */}
                      <button
                        onClick={() => setIsCollapsed(v => !v)}
                        className="inline-flex items-center justify-center rounded-md border border-primary/10 w-9 h-9 text-primary/80 hover:bg-primary/5 transition"
                        aria-expanded={!isCollapsed}
                        aria-controls="vars-panel"
                        aria-label={isCollapsed ? "Expand" : "Collapse"}
                        title={isCollapsed ? "Expand" : "Collapse"}
                      >
                        {isCollapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
                      </button>

                      {/* More options */}
                      <div className="relative">
                        <button
                          ref={menuBtnRef}
                          onClick={(e) => {
                            e.stopPropagation();
                            setMenuOpen((v) => !v);
                          }}
                          className="inline-flex items-center justify-center rounded-md border border-primary/10 w-9 h-9 text-primary/80 hover:bg-primary/5 transition"
                          aria-haspopup="menu"
                          aria-expanded={menuOpen}
                          title="More options"
                        >
                          <MoreVertical className="w-4 h-4" />
                        </button>

                        {menuOpen && (
                          <div
                            className="absolute right-0 mt-2 w-44 rounded-lg border border-gray-200 bg-white shadow-lg z-10"
                            role="menu"
                          >
                            <button
                              onClick={duplicateSelected}
                              className="flex items-center gap-2 w-full px-4 py-2 text-sm text-[#0A2342] hover:bg-gray-50"
                              role="menuitem"
                            >
                              <CopyPlus className="w-4 h-4" /> Duplicate
                            </button>
                            <button
                              onClick={openDeleteConfirm}
                              className="flex items-center gap-2 w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                              role="menuitem"
                            >
                              <Trash2Icon className="w-4 h-4" /> Delete
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Acordeón: Variables */}
                  <div
                    id="vars-panel"
                    className={`overflow-hidden transition-all duration-300 ${isCollapsed ? "max-h-0 opacity-0" : "max-h-[5000px] opacity-100"}`}
                  >
                    <div className="rounded-xl border border-primary/10 bg-white p-4">
                      <h3 className="text-base font-medium text-primary/80 mb-3">Variables</h3>

                      {/* Contenedor con scrollbar */}
                      <div className="max-h-[60vh] overflow-y-auto pr-2">
                        <div className="flex flex-col gap-2">
                          {filteredRows.map((r) => (
                            <div key={r.id} className="flex items-center gap-2">
                              <TextInputWithClearButton
                                id={`row-var-${r.id}`}
                                label="Variable"
                                value={r.variable}
                                placeholder="iteration1.urlSite / description / tagNames"
                                isSearch={false}
                                onChangeHandler={(e) => updateRow(r.id, { variable: e.target.value })}
                              />
                              <TextInputWithClearButton
                                id={`row-val-${r.id}`}
                                label="Value"
                                value={r.value}
                                placeholder="value"
                                isSearch={false}
                                onChangeHandler={(e) => updateRow(r.id, { value: e.target.value })}
                              />
                              <button
                                className="px-2"
                                onClick={() => removeRow(r.id)}
                                title="Delete row"
                              >
                                <Trash2Icon className="w-5 h-5 text-primary/80" />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* 🔻 Botón al final */}
                      <div className="flex justify-start mt-4">
                        <button
                          className="px-4 py-2 rounded-full border border-[#E1E8F0] text-[#0A2342] hover:bg-[#F5F8FB] text-sm"
                          onClick={addRow}
                        >
                          + add row
                        </button>
                      </div>
                    </div>

                    {/* Acciones secundarias */}
                    <div className="flex gap-2 mt-4">
                      <button
                        className="px-4 py-2 rounded-lg border text-sm hover:bg-gray-50 disabled:opacity-60"
                        disabled={!isDirty}
                        onClick={doReset}
                      >
                        Reset changes
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              // EMPTY STATE
              <div className="flex w-full h-full items-center justify-center p-6">
                <div className="text-center max-w-md">
                  <RefreshCcw className="mx-auto w-16 h-16 text-[#3956E8]" />
                  <h2 className="mt-6 text-[32px] font-bold text-[#5A6ACF]">
                    Create data packages
                  </h2>
                  <p className="mt-2 text-lg text-[#7B8CA6]">
                    Choose an item on the left or create a new one.
                  </p>
                  <button
                    onClick={createBlankPackage}
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

      {/* Confirm Delete modal */}
      {confirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/30" onClick={closeDeleteConfirm} />
          <div className="relative z-10 w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
            <div className="flex flex-col items-center text-center">
              <div className="mb-3 text-3xl">❗</div>
              <h3 className="text-lg font-semibold text-primary/90">
                Are you sure you want to delete this package?
              </h3>
              <p className="text-sm text-gray-500 mb-6">This action cannot be undone.</p>
            </div>
            <div className="flex items-center w-full gap-2">
              <button
                className="w-1/2 px-4 py-2 rounded-lg border text-sm hover:bg-gray-50"
                onClick={closeDeleteConfirm}
              >
                Cancel
              </button>
              <button
                className="w-1/2 px-4 py-2 rounded-lg bg-red-600 text-white text-sm hover:bg-red-700"
                onClick={confirmDelete}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toasts */}
      {toastMsg && (
        <div className="fixed lg:w-1/2 bottom-4 left-1/2 -translate-x-1/2 z-40">
          <div className="rounded-lg border border-green-200 bg-green-50 text-green-700 px-4 py-2 shadow flex justify-between items-center">
            {toastMsg}
            <button className="ml-2 text-green-500" onClick={() => setToastMsg(null)}>
              &times;
            </button>
          </div>
        </div>
      )}
      {toastError && (
        <div className="fixed lg:w-1/2 bottom-4 left-1/2 -translate-x-1/2 z-40">
          <div className=" rounded-lg border border-red-200 bg-red-50 text-red-700 px-4 py-2 shadow flex justify-between items-center">
            {toastError}
            <button className="ml-2 text-red-500" onClick={() => setToastError(null)}>
              &times;
            </button>
          </div>
        </div>
      )}
    </DashboardHeader>
  );
}
