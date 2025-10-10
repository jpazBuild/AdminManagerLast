"use client";

import { useMemo, useState } from "react";
import axios from "axios";
import { URL_API_ALB } from "@/config";
import { Row } from "../types";

export type IterationHeader = {
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

const apiUrl = (path: string) => new URL(path, URL_API_ALB).toString();
const makeRowId = () => `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

// Claves reservadas tratadas como metadatos
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

export function useIterationEditor() {
  const [selected, setSelected] = useState<IterationHeader | null>(null);
  const [pkgId, setPkgId] = useState<string>("");
  const [pkgName, setPkgName] = useState<string>("");
  const [rows, setRows] = useState<Row[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [checked, setChecked] = useState<boolean>(true);
  const [isCollapsed, setIsCollapsed] = useState<boolean>(false);
  const [menuOpen, setMenuOpen] = useState<boolean>(false);
  const [isNew, setIsNew] = useState<boolean>(false);
  const [saving, setSaving] = useState<boolean>(false);

  // Marca de suciedad (simple, si necesitas algo más exacto, cámbialo)
  const isDirty = useMemo(() => {
    return true;
  }, [pkgName, rows, selectedTags]);

  const pkgChecked = checked;
  const toggleChecked = () => setChecked((p) => !p);

  // === Helpers de filas y tags ===
  const addRow = () => setRows((prev) => [...prev, { id: makeRowId(), variable: "", value: "" }]);
  const removeRow = (id: string) => setRows((prev) => prev.filter((r) => r.id !== id));
  const updateRow = (rowId: string, patch: Partial<Row>) =>
    setRows((prev) => prev.map((r) => (r.id === rowId ? { ...r, ...patch } : r)));

  // ✅ NUEVO: reemplazar todas las filas (útil para CSV)
  const replaceRows = (next: Row[]) => setRows(next);

  const addTag = (t: string) =>
    setSelectedTags((prev) => (prev.includes(t) ? prev : [...prev, t]));
  const removeTag = (t: string) =>
    setSelectedTags((prev) => prev.filter((x) => x !== t));

  // Duplicación local (si lo usas fuera)
  const duplicateLocalSnapshot = () => ({
    pkgId,
    pkgName,
    rows: rows.map((r) => ({ ...r })),
    tagNames: [...selectedTags],
    checked,
  });

  const reset = () => {
    setRows((prev) => [...prev]);
  };

  // Crear borrador local en blanco (Save hará PUT)
  const createLocalBlankDraft = (name = "") => {
    setSelected({
      id: "",
      name: "",
      createdByName: "",
    } as any);
    setPkgId("");
    setPkgName(name);
    setSelectedTags([]);
    setRows([
      { id: makeRowId(), variable: "description", value: "" },
      { id: makeRowId(), variable: "createdAt", value: "" },
      { id: makeRowId(), variable: "createdBy", value: "" },
      { id: makeRowId(), variable: "createdByName", value: "" },
      { id: makeRowId(), variable: "type", value: "" },
      { id: makeRowId(), variable: "route", value: "" },
    ]);
    setIsNew(true);
  };

  // Cargar detalle de un header (existente) -> PATCH
  const loadFromHeader = async (h: IterationHeader) => {
    setIsNew(false);
    setSelected(h);
    try {
      const { data } = await axios.post<DetailResponse>(apiUrl("iterationData"), { id: h.id }, { withCredentials: true });
      setPkgId(String(data?.id ?? h.id ?? ""));
      setPkgName(String(data?.name ?? h.name ?? ""));
      setSelectedTags(data?.tagNames ?? h.tagNames ?? []);
      const meta = metaRowsFromDetail(data);
      const iter = rowsFromIterationData(data);
      const merged = [...meta, ...iter];
      setRows(merged.length ? merged : [{ id: makeRowId(), variable: "", value: "" }]);
    } catch (e) {
      setPkgId(h.id);
      setPkgName(h.name || "");
      setSelectedTags(h.tagNames ?? []);
      const meta = metaRowsFromDetail(h as any);
      const merged = meta.length ? meta : [{ id: makeRowId(), variable: "", value: "" }];
      setRows(merged);
    }
  };

  // === SAVE: PATCH si existe, PUT si es nuevo ===
  const save = async (): Promise<{ ok: boolean; status?: number; error?: string }> => {
    setSaving(true);

    // metadatos desde filas reservadas
    const meta: Record<string, string> = {};
    for (const r of rows) {
      const k = r.variable.trim();
      if (RESERVED_META_KEYS.has(k)) meta[k] = r.value;
    }

    // iterationData anidado desde filas NO reservadas
    const nested: Record<string, any> = {};
    for (const r of rows) {
      const k = r.variable.trim();
      if (!k || RESERVED_META_KEYS.has(k)) continue;
      const parts = k.split(".");
      const root = parts[0];
      if (parts.length === 1) {
        nested[root] = r.value;
      } else {
        nested[root] = nested[root] || {};
        let cur = nested[root];
        for (let i = 1; i < parts.length - 1; i++) {
          const key = parts[i];
          cur[key] = cur[key] || {};
          cur = cur[key];
        }
        cur[parts[parts.length - 1]] = r.value;
      }
    }

    // Asegurar campos requeridos si faltan (cuando creas nuevo)
    const description = meta["description"] ?? (isNew ? "Imported from CSV" : "");
    const tags = selectedTags; // ← no forzamos 'imported'
    const creator = meta["createdBy"] ?? (selected?.createdByName || selected?.createdBy || (isNew ? "Uploader" : ""));

    const putBody = {
      name: (pkgName || "").trim(),
      description,
      tagNames: tags,
      iterationData: [
        {
          id: crypto.randomUUID(),
          iterationCount: 1,
          iterationData: nested,
          order: 0,
          apisScriptsName: (pkgName || "").trim(),
          createdBy: creator,
        },
      ],
      createdBy: creator,
    };

    const patchBody = {
      id: pkgId,
      name: (pkgName || "").trim(),
      description,
      tagNames: tags,
      iterationData: [
        {
          id: pkgId || selected?.id || "",
          iterationCount: 1,
          iterationData: nested,
          order: 0,
          apisScriptsName: (pkgName || "").trim(),
          createdBy: creator,
        },
      ],
      updatedBy: creator,
    };

    try {
      const res = isNew
        ? await axios.put(apiUrl("iterationData"), putBody, { withCredentials: true })
        : await axios.patch(apiUrl("iterationData"), patchBody, { withCredentials: true });

      return { ok: true, status: res.status };
    } catch (e: any) {
      return { ok: false, status: e?.response?.status, error: e?.response?.data?.message || e?.message };
    } finally {
      setSaving(false);
    }
  };

  // DELETE por id
  const deleteOnServer = async (): Promise<{ ok: boolean; status?: number; error?: string }> => {
    if (!pkgId) return { ok: false, error: "Missing id" };
    setSaving(true);
    try {
      const res = await axios.delete(apiUrl("iterationData"), { data: { id: pkgId }, withCredentials: true });
      return { ok: true, status: res.status };
    } catch (e: any) {
      return { ok: false, status: e?.response?.status, error: e?.response?.data?.message || e?.message };
    } finally {
      setSaving(false);
    }
  };

  // Construir body PUT desde el estado actual (para duplicar)
  const buildPutBody = (nameOverride?: string) => {
    const finalName = (nameOverride ?? pkgName ?? "").trim();

    const meta: Record<string, string> = {};
    for (const r of rows) {
      const k = r.variable?.trim?.() ?? "";
      if (k && RESERVED_META_KEYS.has(k)) meta[k] = r.value ?? "";
    }
    const creator = meta["createdBy"] ?? (selected?.createdByName || selected?.createdBy || "");

    const nested: Record<string, any> = {};
    for (const r of rows) {
      const key = r.variable?.trim?.() ?? "";
      if (!key || RESERVED_META_KEYS.has(key)) continue;

      const parts = key.split(".");
      const root = parts[0];
      if (parts.length === 1) {
        nested[root] = r.value ?? "";
      } else {
        nested[root] = nested[root] || {};
        let cur = nested[root];
        for (let i = 1; i < parts.length - 1; i++) {
          const k = parts[i];
          cur[k] = cur[k] || {};
          cur = cur[k];
        }
        cur[parts[parts.length - 1]] = r.value ?? "";
      }
    }

    return {
      name: finalName,
      description: meta["description"] ?? "",
      tagNames: selectedTags,
      iterationData: [
        {
          id: crypto.randomUUID(),
          iterationCount: 1,
          iterationData: nested,
          order: 0,
          apisScriptsName: finalName,
          createdBy: creator,
        },
      ],
      createdBy: creator,
    };
  };

  const duplicateAsNew = async (): Promise<{ ok: boolean; status?: number; error?: string }> => {
    const newName = `${(pkgName || "Untitled").trim()} Copy`;
    const body = buildPutBody(newName);
    setSaving(true);
    try {
      const res = await axios.put(apiUrl("iterationData"), body, { withCredentials: true });
      return { ok: true, status: res.status };
    } catch (e: any) {
      return { ok: false, status: e?.response?.status, error: e?.response?.data?.message || e?.message };
    } finally {
      setSaving(false);
    }
  };

  // Deseleccionar para empty state
  const deselect = () => {
    setSelected(null);
    setPkgId("");
    setPkgName("");
    setSelectedTags([]);
    setRows([]);
    setIsNew(false);
    setIsCollapsed(false);
    setMenuOpen(false);
  };

  return {
    // estado
    selected,
    selectedTags,
    pkgId,
    pkgName,
    rows,
    pkgChecked: checked,
    isCollapsed,
    menuOpen,
    isNew,
    saving,
    isDirty,

    // setters/acciones UI
    setPkgName,
    setIsCollapsed,
    setMenuOpen,
    toggleChecked,
    setSelectedTags,

    // filas
    addRow,
    removeRow,
    updateRow,
    replaceRows, // ✅ nuevo

    // tags
    addTag,
    removeTag,

    // flujos
    loadFromHeader,
    createLocalBlankDraft,
    save,
    reset,
    deleteOnServer,

    // duplicación
    duplicateLocalSnapshot,
    duplicateAsNew,

    deselect,
  };
}
