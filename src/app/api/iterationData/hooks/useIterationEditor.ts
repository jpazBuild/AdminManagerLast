"use client";
import { useMemo, useRef, useState } from "react";
import axios from "axios";
import { URL_API_ALB } from "@/config";
import { DetailResponse, IterationHeader, Row } from "../types";

const apiUrl = (p: string) => new URL(p, URL_API_ALB).toString();
const makeRowId = () => `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

const META_KEYS = new Set([
  "description","createdAt","createdBy","createdByName","tagIds","tagNames","type","route","id","name",
]);

const metaRowsFrom = (detail?: Partial<DetailResponse> | Partial<IterationHeader> | null): Row[] => {
  if (!detail) return [];
  const items: Array<[string, any]> = [
    ["description", (detail as any).description],
    ["createdAt", (detail as any).createdAt],
    ["createdBy", (detail as any).createdBy],
    ["createdByName", (detail as any).createdByName],
    ["tagIds", (detail as any).tagIds],
    ["tagNames", (detail as any).tagNames],
    ["type", (detail as any).type],
    ["route", (detail as any).route],
  ];
  return items
    .filter(([, v]) => v !== undefined && v !== null)
    .map(([k, v]) => ({
      id: makeRowId(),
      variable: k,
      value: Array.isArray(v) ? v.join(", ") : String(v),
    }));
};

const mergeRowsByKey = (base: Row[], inc: Row[]): Row[] => {
  const map = new Map<string, Row>();
  base.forEach(r => map.set(r.variable, { ...r }));
  inc.forEach(r => map.set(r.variable, { id: makeRowId(), variable: r.variable, value: r.value }));
  return [...map.values()];
};

export function useIterationEditor() {
  // seleccionado
  const [selected, setSelected] = useState<IterationHeader | null>(null);
  const [pkgName, setPkgName] = useState("");
  const [pkgId, setPkgId] = useState("");

  // filas (solo meta)
  const [rows, setRows] = useState<Row[]>([]);
  const originalRowsRef = useRef<Row[]>([]);

  // bloque iterationData original
  const originalIterationBlockRef = useRef<DetailResponse["iterationData"] | null>(null);

  // UI
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const loadFromHeader = async (h: IterationHeader) => {
    setSelected(h);
    setIsCollapsed(false);
    setMenuOpen(false);

    // pinta meta del header de una vez
    setPkgId(h.id);
    setPkgName(h.name || "");
    const headerMeta = metaRowsFrom(h);
    setRows(headerMeta.length ? headerMeta : [{ id: makeRowId(), variable: "description", value: h.description ?? "" }]);
    originalRowsRef.current = JSON.parse(JSON.stringify(headerMeta));

    // carga detalle para guardar iterationData original
    try {
      const { data } = await axios.post<DetailResponse>(apiUrl("iterationData"), { id: h.id }, { withCredentials: true });
      originalIterationBlockRef.current = data?.iterationData ?? [];

      setPkgId(String(data?.id ?? h.id));
      setPkgName(String(data?.name ?? h.name));

      const detailMeta = metaRowsFrom(data);
      const merged = mergeRowsByKey(headerMeta, detailMeta);
      setRows(merged.length ? merged : [{ id: makeRowId(), variable: "description", value: "" }]);
      originalRowsRef.current = JSON.parse(JSON.stringify(merged));
    } catch {
      originalIterationBlockRef.current = [];
    }
  };

  const addRow    = () => setRows(prev => [...prev, { id: makeRowId(), variable: "", value: "" }]);
  const removeRow = (id: string) => setRows(prev => prev.filter(r => r.id !== id));
  const updateRow = (id: string, patch: Partial<Row>) =>
    setRows(prev => prev.map(r => (r.id === id ? { ...r, ...patch } : r)));

  const isDirty = useMemo(() => {
    const a = rows, b = originalRowsRef.current;
    if (a.length !== b.length) return true;
    for (let i = 0; i < a.length; i++) if (a[i].variable !== b[i].variable || a[i].value !== b[i].value) return true;
    if ((selected?.name || "") !== pkgName) return true;
    if ((selected?.id || "") !== pkgId) return true;
    return false;
  }, [rows, pkgName, pkgId, selected]);

  const reset = () => {
    const snap = JSON.parse(JSON.stringify(originalRowsRef.current)) as Row[];
    setRows(snap.length ? snap : [{ id: makeRowId(), variable: "description", value: "" }]);
    setPkgName(selected?.name || "");
    setPkgId(selected?.id || "");
  };

  const duplicate = (pushHeader: (h: IterationHeader) => void) => {
    if (!selected) return;
    const newId = typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : `${Date.now()}`;
    const cloned: IterationHeader = { ...selected, id: newId, name: `${pkgName || selected.name} Copy` };
    pushHeader(cloned);
    setSelected(cloned);
    setPkgId(newId);
    setPkgName(cloned.name);
    const clonedRows = JSON.parse(JSON.stringify(rows)) as Row[];
    setRows(clonedRows);
    originalRowsRef.current = JSON.parse(JSON.stringify(clonedRows));
    originalIterationBlockRef.current = originalIterationBlockRef.current
      ? JSON.parse(JSON.stringify(originalIterationBlockRef.current))
      : [];
    setMenuOpen(false);
  };

  const removePackage = (removeHeaderById: (id: string) => void) => {
    if (!selected) return;
    removeHeaderById(selected.id);
    setSelected(null);
    setPkgId("");
    setPkgName("");
    setRows([]);
    originalIterationBlockRef.current = [];
    setMenuOpen(false);
  };

  /** DELETE persistente al mismo endpoint (body: { id }) */
  const deleteOnServer = async (): Promise<
    | { ok: true; status: number }
    | { ok: false; status?: number; error: string }
  > => {
    if (!selected) return { ok: false, error: "No package selected" };
    try {
      const resp = await axios.delete(apiUrl("iterationData"), {
        data: { id: selected.id },     // <-- body con id
        withCredentials: true,
      });
      return { ok: true, status: resp.status };
    } catch (err: any) {
      const status = err?.response?.status;
      const data = err?.response?.data;
      const msg =
        data?.message ?? data?.error ?? (typeof data === "string" ? data : err?.message || "Unknown error");
      return { ok: false, status, error: msg };
    }
  };

  /** PATCH (save) */
  const save = async (): Promise<
    | { ok: true; status: number; data: any }
    | { ok: false; status?: number; error: string }
  > => {
    if (!selected) return { ok: false, error: "No package selected" };
    setSaving(true);

    // 1) metadatos desde filas
    const meta: Record<string, string> = {};
    for (const r of rows) {
      const key = r.variable.trim();
      if (!key) continue;
      if (META_KEYS.has(key)) meta[key] = r.value;
    }

    const description = meta["description"] ?? "";
    const tagNames = meta["tagNames"]
      ? meta["tagNames"].split(",").map(s => s.trim()).filter(Boolean)
      : (selected.tagNames ?? []);

    // 2) reenviamos el bloque original de iterationData
    const body = {
      id: pkgId,
      tagNames,
      name: pkgName.trim(),
      description,
      iterationData: originalIterationBlockRef.current ?? [],
      updatedBy: selected.createdByName || selected.createdBy || "",
    };

    try {
      const resp = await axios.patch(apiUrl("iterationData"), body, { withCredentials: true });
      console.log("[PATCH ok]", resp.status, resp.data);

      originalRowsRef.current = JSON.parse(JSON.stringify(rows));
      return { ok: true, status: resp.status, data: resp.data };
    } catch (err: any) {
      const status = err?.response?.status;
      const serverData = err?.response?.data;
      const serverMsg =
        serverData?.message ??
        serverData?.error ??
        (typeof serverData === "string" ? serverData : JSON.stringify(serverData));
      const fallback = err?.message || "Unknown error";
      const errorMsg = serverMsg || fallback;

      console.error("[PATCH error]", status, serverData);
      return { ok: false, status, error: errorMsg };
    } finally {
      setSaving(false);
    }
  };

  return {
    // state
    selected, pkgName, setPkgName, pkgId,
    rows, addRow, removeRow, updateRow,
    isCollapsed, setIsCollapsed,
    menuOpen, setMenuOpen,
    isDirty, reset, saving,

    // actions
    loadFromHeader,
    duplicate,
    removePackage,
    deleteOnServer,  // <-- exportamos el delete
    save,
  };
}
