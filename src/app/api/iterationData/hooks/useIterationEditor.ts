"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import axios from "axios";
import { URL_API_ALB } from "@/config";
import { Row } from "../types";

export type IterationHeader = {
  id: string;
  name: string;
  description?: string;
  tagNames?: string[];
  tagIds?: string[];
  createdAt?: number | string;
  createdBy?: string;
  createdByName?: string;
  type?: string;
  route?: string;
};

type DetailResponse = {
  id?: string;
  name?: string;
  description?: string;
  tagNames?: string[];
  tagIds?: string[];
  createdAt?: number | string;
  createdBy?: string;
  createdByName?: string;
  type?: string;
  route?: string;
  iterationData?: Array<{
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

const META_KEYS = new Set([
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
    const bag = item?.iterationData || {};
    for (const [key, val] of Object.entries(bag)) {
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
    ["createdAt", detail.createdAt as any],
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
      else value = String(v);
      return { id: makeRowId(), variable: k, value };
    });
};

// Convierte rows flat a un objeto nested por root (iteration1, iteration2, etc.)
const buildNestedFromRows = (rows: Row[], onlyRoot?: string) => {
  const out: Record<string, any> = {};
  for (const r of rows) {
    const key = (r.variable || "").trim();
    if (!key || META_KEYS.has(key)) continue;
    const parts = key.split(".");
    const root = parts[0];
    if (onlyRoot && root !== onlyRoot) continue;

    if (parts.length === 1) {
      out[root] = r.value;
      continue;
    }

    out[root] = out[root] || {};
    let cursor = out[root];
    for (let i = 1; i < parts.length - 1; i++) {
      const p = parts[i];
      cursor[p] = cursor[p] || {};
      cursor = cursor[p];
    }
    cursor[parts[parts.length - 1]] = r.value;
  }
  return onlyRoot ? out[onlyRoot] || {} : out;
};

export type IterationEditorAPI = {
  // selección/identidad
  selected: IterationHeader | null;
  isNew: boolean; // true si es borrador local (PUT en save)
  saving: boolean;
  isDirty: boolean;

  // UI state
  pkgName: string;
  pkgId: string;
  pkgChecked: boolean;
  isCollapsed: boolean;
  menuOpen: boolean;

  // datos
  rows: Row[];
  selectedTags: string[];

  // acciones UI
  setPkgName: (v: string) => void;
  toggleChecked: () => void;
  setIsCollapsed: (fn: (v: boolean) => boolean) => void;
  setMenuOpen: (v: boolean) => void;

  // filas
  addRow: () => void;
  removeRow: (rowId: string) => void;
  updateRow: (rowId: string, patch: Partial<Row>) => void;

  // tags
  addTag: (tag: string) => void;
  removeTag: (tag: string) => void;

  // flujo
  loadFromHeader: (h: IterationHeader) => Promise<void>;
  createLocalBlankDraft: (meta?: Partial<Record<string, string>>) => void;
  reset: () => void;
  save: () => Promise<{ ok: true; status: number } | { ok: false; status?: number; error: string }>;
  deleteOnServer: () => Promise<{ ok: true; status: number } | { ok: false; status?: number; error: string }>;

  // NUEVO: duplicar como nuevo (PUT con "Copy")
  duplicateAsNew: () => Promise<
    | { ok: true; status: number; newId: string }
    | { ok: false; status?: number; error: string }
  >;

  // util
  duplicateLocalSnapshot: () => {
    pkgId: string;
    pkgName: string;
    checked: boolean;
    tagNames: string[];
    rows: Row[];
  };
};

export function useIterationEditor(): IterationEditorAPI {
  const [selected, setSelected] = useState<IterationHeader | null>(null);
  const [pkgName, setPkgName] = useState("");
  const [pkgId, setPkgId] = useState("");
  const [pkgChecked, setPkgChecked] = useState(true);

  const [rows, setRows] = useState<Row[]>([]);
  const originalRowsRef = useRef<Row[]>([]);

  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  const [isNew, setIsNew] = useState(false);
  const [saving, setSaving] = useState(false);

  const [isCollapsed, setIsCollapsed] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  const addRow = () =>
    setRows((prev) => [...prev, { id: makeRowId(), variable: "", value: "" }]);
  const removeRow = (rowId: string) =>
    setRows((prev) => prev.filter((r) => r.id !== rowId));
  const updateRow = (rowId: string, patch: Partial<Row>) =>
    setRows((prev) => prev.map((r) => (r.id === rowId ? { ...r, ...patch } : r)));

  const addTag = (tag: string) =>
    setSelectedTags((prev) => (prev.includes(tag) ? prev : [...prev, tag]));
  const removeTag = (tag: string) =>
    setSelectedTags((prev) => prev.filter((t) => t !== tag));

  const toggleChecked = () => setPkgChecked((v) => !v);

  const isDirty = useMemo(() => {
    // nombre
    if ((selected?.name || "") !== pkgName) return true;
    // filas
    const a = rows;
    const b = originalRowsRef.current;
    if (a.length !== b.length) return true;
    for (let i = 0; i < a.length; i++) {
      if (a[i].variable !== b[i].variable || a[i].value !== b[i].value) return true;
    }
    return false;
  }, [rows, selected, pkgName]);

  const loadFromHeader = useCallback(async (h: IterationHeader) => {
    setIsNew(false);
    setSelected(h);
    setPkgName(h.name || "");
    setPkgId(h.id || "");

    try {
      const { data } = await axios.post<DetailResponse>(
        apiUrl("iterationData"),
        { id: h.id },
        { withCredentials: true }
      );
      const metaRows = metaRowsFromDetail(data);
      const iterRows = rowsFromIterationData(data);
      const merged = [...metaRows, ...iterRows];
      setRows(merged.length ? merged : [{ id: makeRowId(), variable: "", value: "" }]);
      originalRowsRef.current = JSON.parse(JSON.stringify(merged));

      const tags = (data?.tagNames ?? h.tagNames ?? []).map(String).filter(Boolean);
      setSelectedTags(tags);
    } catch (e) {
      // fallback: solo header
      const metaRows = metaRowsFromDetail(h as any);
      const merged = metaRows.length ? metaRows : [{ id: makeRowId(), variable: "", value: "" }];
      setRows(merged);
      originalRowsRef.current = JSON.parse(JSON.stringify(merged));
      setSelectedTags((h.tagNames ?? []).map(String).filter(Boolean));
    }
  }, []);

  const createLocalBlankDraft = useCallback((meta?: Partial<Record<string, string>>) => {
    setIsNew(true);
    const newId =
      (typeof crypto !== "undefined" && "randomUUID" in crypto && (crypto as any).randomUUID()) ||
      `${Date.now()}`;

    const baseRows: Row[] = [
      { id: makeRowId(), variable: "description", value: meta?.description ?? "testcreate" },
      { id: makeRowId(), variable: "createdAt", value: meta?.createdAt ?? String(Date.now()) },
      { id: makeRowId(), variable: "createdBy", value: meta?.createdBy ?? "" },
      { id: makeRowId(), variable: "createdByName", value: meta?.createdByName ?? "" },
      { id: makeRowId(), variable: "type", value: meta?.type ?? "ITERATIONDATA" },
      { id: makeRowId(), variable: "route", value: meta?.route ?? `ITERATIONDATA#${newId}` },
      // ejemplo de variables
      { id: makeRowId(), variable: "iteration1.urlSite", value: "" },
      { id: makeRowId(), variable: "iteration1.UsernameInput", value: "" },
      { id: makeRowId(), variable: "iteration1.PasswordInput", value: "" },
      { id: makeRowId(), variable: "iteration2.urlSite", value: "" },
      { id: makeRowId(), variable: "iteration2.UsernameInput", value: "" },
      { id: makeRowId(), variable: "iteration2.PasswordInput", value: "" },
    ];

    setSelected({
      id: newId,
      name: "",
      description: meta?.description ?? "testcreate",
      createdAt: meta?.createdAt ?? String(Date.now()),
      createdBy: meta?.createdBy ?? "",
      createdByName: meta?.createdByName ?? "",
      type: meta?.type ?? "ITERATIONDATA",
      route: meta?.route ?? `ITERATIONDATA#${newId}`,
    });
    setPkgId(newId);
    setPkgName("");
    setPkgChecked(true);
    setSelectedTags(["tag1"]);
    setRows(baseRows);
    originalRowsRef.current = JSON.parse(JSON.stringify(baseRows));
  }, []);

  const reset = useCallback(() => {
    const snap = JSON.parse(JSON.stringify(originalRowsRef.current)) as Row[];
    setRows(snap.length ? snap : [{ id: makeRowId(), variable: "", value: "" }]);
    setPkgName(selected?.name || "");
  }, [selected]);

  const save = useCallback(async () => {
    if (!selected) return { ok: false as const, error: "No package selected" };
    setSaving(true);

    // meta
    const meta: Record<string, string> = {};
    for (const r of rows) {
      const k = (r.variable || "").trim();
      if (k && META_KEYS.has(k)) meta[k] = r.value;
    }
    const description = (meta["description"] || "").trim();
    const creator =
      (meta["createdByName"] || meta["createdBy"] || selected.createdByName || selected.createdBy || "").trim();
    const tagNames = (selectedTags ?? []).map(String).filter(Boolean);

    // nested vars
    const iteration1Block = buildNestedFromRows(rows, "iteration1");
    const iteration2Block = buildNestedFromRows(rows, "iteration2");
    const defaultBlock = { urlSite: "", UsernameInput: "", PasswordInput: "" };
    const iter1 = Object.keys(iteration1Block).length ? iteration1Block : defaultBlock;
    const iter2 = Object.keys(iteration2Block).length ? iteration2Block : defaultBlock;

    if (!pkgName.trim()) return { ok: false as const, error: "name is required" };
    if (!description) return { ok: false as const, error: "description is required" };
    if (!creator) return { ok: false as const, error: "createdBy is required" };
    if (!tagNames.length) return { ok: false as const, error: "tagNames is required" };

    const body = {
      id: pkgId,
      name: pkgName.trim(),
      description,
      tagNames,
      iterationData: [
        {
          id: pkgId,
          iterationCount: 2,
          iterationData: { iteration1: iter1 },
          order: 0,
          apisScriptsName: "",
          createdBy: creator,
        },
        {
          id: pkgId,
          iterationCount: 3,
          iterationData: { iteration1: iter1, iteration2: iter2 },
          order: 1,
          apisScriptsName: "",
          createdBy: creator,
        },
      ],
      updatedBy: creator,
      createdBy: creator,
    };

    try {
      const method = isNew ? "put" : "patch";
      const url = apiUrl("iterationData");
      const resp = await axios[method](url, body, { withCredentials: true });

      // sync snapshot
      originalRowsRef.current = JSON.parse(JSON.stringify(rows));
      setIsNew(false);
      return { ok: true as const, status: resp.status };
    } catch (err: any) {
      const status = err?.response?.status;
      const data = err?.response?.data;
      const msg =
        data?.message ??
        data?.error ??
        (typeof data === "string" ? data : err?.message || "Unknown error");
      return { ok: false as const, status, error: msg };
    } finally {
      setSaving(false);
    }
  }, [selected, rows, pkgName, pkgId, selectedTags, isNew]);

  const deleteOnServer = useCallback(async () => {
    if (!selected?.id) return { ok: false as const, error: "No package selected" };
    try {
      const resp = await axios.delete(apiUrl("iterationData"), {
        data: { id: selected.id },
        withCredentials: true,
      });
      return { ok: true as const, status: resp.status };
    } catch (err: any) {
      const status = err?.response?.status;
      const data = err?.response?.data;
      const msg =
        data?.message ??
        data?.error ??
        (typeof data === "string" ? data : err?.message || "Unknown error");
      return { ok: false as const, status, error: msg };
    }
  }, [selected]);

  // === NUEVO: Duplicar como nuevo (PUT con “Copy”) ==========================
  const duplicateAsNew = useCallback(async () => {
    if (!selected) return { ok: false as const, error: "No package selected" };

    const newId =
      (typeof crypto !== "undefined" && "randomUUID" in crypto && (crypto as any).randomUUID()) ||
      `${Date.now()}`;

    // meta
    const meta: Record<string, string> = {};
    for (const r of rows) {
      const k = (r.variable || "").trim();
      if (k && META_KEYS.has(k)) meta[k] = r.value;
    }

    const baseName = (pkgName || selected.name || "Number").trim();
    const copyName = `${baseName} Copy`;
    const description = (meta["description"] || "").trim();
    const creator =
      (selected.createdByName || selected.createdBy || meta["createdBy"] || "").trim();
    const tagNames = (selectedTags ?? []).map(String).filter(Boolean);

    const iteration1Block = buildNestedFromRows(rows, "iteration1");
    const iteration2Block = buildNestedFromRows(rows, "iteration2");
    const defaultBlock = { urlSite: "", UsernameInput: "", PasswordInput: "" };
    const iter1 = Object.keys(iteration1Block).length ? iteration1Block : defaultBlock;
    const iter2 = Object.keys(iteration2Block).length ? iteration2Block : defaultBlock;

    if (!copyName) return { ok: false as const, error: "Package name is required" };
    if (!description) return { ok: false as const, error: "Description is required" };
    if (!creator) return { ok: false as const, error: "createdBy is required" };
    if (!tagNames.length) return { ok: false as const, error: "At least one tag is required" };

    const body = {
      name: copyName,
      description,
      tagNames,
      iterationData: [
        {
          id: newId,
          iterationCount: 2,
          iterationData: { iteration1: iter1 },
          order: 0,
          apisScriptsName: "",
          createdBy: creator,
        },
        {
          id: newId,
          iterationCount: 3,
          iterationData: { iteration1: iter1, iteration2: iter2 },
          order: 1,
          apisScriptsName: "",
          createdBy: creator,
        },
      ],
      createdBy: creator,
    };

    try {
      const resp = await axios.put(apiUrl("iterationData"), body, { withCredentials: true });
      const serverId =
        resp?.data?.id ||
        resp?.data?.header?.id ||
        resp?.data?.data?.id ||
        resp?.data?.resourceId ||
        newId;

      return { ok: true as const, status: resp.status, newId: String(serverId) };
    } catch (err: any) {
      const status = err?.response?.status;
      const data = err?.response?.data;
      const msg =
        data?.message ??
        data?.error ??
        (typeof data === "string" ? data : err?.message || "Unknown error");
      return { ok: false as const, status, error: msg };
    }
  }, [selected, rows, pkgName, selectedTags]);

  const duplicateLocalSnapshot = () => ({
    pkgId,
    pkgName,
    checked: pkgChecked,
    tagNames: [...selectedTags],
    rows: rows.map((r) => ({ ...r })),
  });

  return {
    // selección
    selected,
    isNew,
    saving,
    isDirty,

    // ui
    pkgName,
    pkgId,
    pkgChecked,
    isCollapsed,
    menuOpen,

    // datos
    rows,
    selectedTags,

    // acciones ui
    setPkgName,
    toggleChecked,
    setIsCollapsed,
    setMenuOpen,

    // filas
    addRow,
    removeRow,
    updateRow,

    // tags
    addTag,
    removeTag,

    // flujo
    loadFromHeader,
    createLocalBlankDraft,
    reset,
    save,
    deleteOnServer,

    // nuevo
    duplicateAsNew,

    // util
    duplicateLocalSnapshot,
  };
}
