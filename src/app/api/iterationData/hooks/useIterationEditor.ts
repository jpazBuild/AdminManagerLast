"use client";

import { useMemo, useRef, useState } from "react";
import axios from "axios";
import { URL_API_ALB } from "@/config";
import type { Row, IterationHeader, DetailResponse } from "../types";

const apiUrl = (p: string) => new URL(p, URL_API_ALB).toString();
const makeRowId = () => `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

// --- Helpers para filas meta (description, createdBy, etc.) ---
const metaRowsFrom = (
  detail?: Partial<DetailResponse> | Partial<IterationHeader> | null
): Row[] => {
  if (!detail) return [];
  const items: Array<[string, any]> = [
    ["description", (detail as any).description],
    ["createdAt", (detail as any).createdAt],
    ["createdBy", (detail as any).createdBy],
    ["createdByName", (detail as any).createdByName],
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
  base.forEach((r) => map.set(r.variable, { ...r }));
  inc.forEach((r) =>
    map.set(r.variable, { id: makeRowId(), variable: r.variable, value: r.value })
  );
  return [...map.values()];
};

export type LocalSnapshot = {
  pkgId: string;
  pkgName: string;
  checked: boolean;
  tagNames: string[];
  rows: Row[];
};

export type IterationEditorAPI = {
  selected: IterationHeader | null;

  pkgId: string;
  pkgName: string;
  setPkgName: (v: string) => void;

  pkgChecked: boolean;
  toggleChecked: () => void;

  rows: Row[];
  addRow: () => void;
  removeRow: (id: string) => void;
  updateRow: (id: string, patch: Partial<Row>) => void;

  selectedTags: string[];
  addTag: (t: string) => void;
  removeTag: (t: string) => void;

  isCollapsed: boolean;
  setIsCollapsed: React.Dispatch<React.SetStateAction<boolean>>;
  menuOpen: boolean;
  setMenuOpen: React.Dispatch<React.SetStateAction<boolean>>;
  isDirty: boolean;
  saving: boolean;

  /** NUEVO: indica si es un borrador local (no existe en backend aún) */
  isNew: boolean;

  loadFromHeader: (h: IterationHeader) => Promise<void>;

  /** NUEVO: crea un borrador local totalmente en blanco (sin API) */
  createLocalBlankDraft: (createdBy?: string) => void;

  /** Save: PUT si isNew, PATCH si es existente */
  save: () => Promise<
    | { ok: true; status: number; data?: any }
    | { ok: false; status?: number; error: string }
  >;

  deleteOnServer: () => Promise<
    | { ok: true; status: number }
    | { ok: false; status?: number; error: string }
  >;

  reset: () => void;

  duplicateLocalSnapshot: () => LocalSnapshot;
};

export function useIterationEditor(): IterationEditorAPI {
  const [selected, setSelected] = useState<IterationHeader | null>(null);

  const [pkgId, setPkgId] = useState<string>("");
  const [pkgName, setPkgName] = useState<string>("");
  const [pkgChecked, setPkgChecked] = useState<boolean>(true);
  const toggleChecked = () => setPkgChecked((v) => !v);

  const [rows, setRows] = useState<Row[]>([]);
  const originalRowsRef = useRef<Row[]>([]);
  const originalIterationBlockRef = useRef<DetailResponse["iterationData"] | null>(null);

  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const addTag = (t: string) =>
    setSelectedTags((prev) => (prev.includes(t) ? prev : [...prev, t]));
  const removeTag = (t: string) =>
    setSelectedTags((prev) => prev.filter((x) => x !== t));

  const [isCollapsed, setIsCollapsed] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  /** NUEVO: modo borrador local (no existe en backend) */
  const [isNew, setIsNew] = useState(false);

  // helpers nested
  const setNested = (obj: any, path: string[], value: any) => {
    if (path.length === 0) return;
    let cursor = obj;
    for (let i = 0; i < path.length - 1; i++) {
      const k = path[i];
      if (cursor[k] == null || typeof cursor[k] !== "object") cursor[k] = {};
      cursor = cursor[k];
    }
    cursor[path[path.length - 1]] = value;
  };

  const buildNestedFromRows = (allRows: Row[], iterationKey: string) => {
    const out: Record<string, any> = {};
    for (const r of allRows) {
      const v = r.variable.trim();
      if (!v.startsWith(iterationKey + ".")) continue;
      const parts = v.split(".").slice(1);
      if (parts.length === 0) continue;
      setNested(out, parts, r.value);
    }
    return out;
  };

  // Cargar existente → PATCH
  const loadFromHeader = async (h: IterationHeader) => {
    if (!h?.id) {
      console.warn("[loadFromHeader] missing id, abort.");
      return;
    }

    setIsNew(false); // ← EXISTENTE
    setSelected(h);
    setIsCollapsed(false);
    setMenuOpen(false);

    setPkgId(h.id);
    setPkgName(h.name || "");
    setPkgChecked(true);
    setSelectedTags(h.tagNames ?? []);

    const headerMeta = metaRowsFrom(h);
    setRows(
      headerMeta.length
        ? headerMeta
        : [{ id: makeRowId(), variable: "description", value: h.description ?? "" }]
    );
    originalRowsRef.current = JSON.parse(JSON.stringify(headerMeta));
    originalIterationBlockRef.current = [];

    try {
      const { data } = await axios.post<DetailResponse>(
        apiUrl("iterationData"),
        { id: h.id },
        { withCredentials: true }
      );
      originalIterationBlockRef.current = data?.iterationData ?? [];

      setPkgId(String(data?.id ?? h.id));
      setPkgName(String(data?.name ?? h.name));
      setSelectedTags(data?.tagNames ?? h.tagNames ?? []);

      const detailMeta = metaRowsFrom(data);
      const merged = mergeRowsByKey(headerMeta, detailMeta);

      setRows(
        merged.length ? merged : [{ id: makeRowId(), variable: "description", value: "" }]
      );
      originalRowsRef.current = JSON.parse(JSON.stringify(merged));
    } catch {
      originalIterationBlockRef.current = [];
    }
  };

  // NUEVO: crear borrador local totalmente en blanco (sin API)
  const createLocalBlankDraft = (createdBy = "") => {
    const localId =
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : `${Date.now()}`;

    setIsNew(true);
    setSelected({
      id: localId,
      name: "",
      description: "",
      tagNames: [],
    } as any);

    setPkgId(localId);
    setPkgName("");
    setPkgChecked(true);
    setSelectedTags([]);

    // Una sola fila vacía para arrancar
    const startRows: Row[] = [{ id: makeRowId(), variable: "", value: "" }];
    setRows(startRows);

    // baseline para que Save quede deshabilitado hasta que cambien algo
    originalRowsRef.current = JSON.parse(JSON.stringify(startRows));
    originalIterationBlockRef.current = [];
    setIsCollapsed(false);
    setMenuOpen(false);
  };

  // Acciones de filas
  const addRow = () =>
    setRows((prev) => [...prev, { id: makeRowId(), variable: "", value: "" }]);
  const removeRow = (id: string) => setRows((prev) => prev.filter((r) => r.id !== id));
  const updateRow = (id: string, patch: Partial<Row>) =>
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch } : r)));

  // Dirty: compara filas, nombre, id, tags y checkbox contra baseline
  const isDirty = useMemo(() => {
    const a = rows;
    const b = originalRowsRef.current;
    if (a.length !== b.length) return true;
    for (let i = 0; i < a.length; i++) {
      if (a[i].variable !== b[i].variable || a[i].value !== b[i].value) return true;
    }
    if ((selected?.name || "") !== pkgName) return true;
    if ((selected?.id || "") !== pkgId) return true;

    const baselineTags = selected?.tagNames ?? [];
    if (baselineTags.length !== selectedTags.length) return true;
    const aSet = new Set(selectedTags);
    for (const t of baselineTags) if (!aSet.has(t)) return true;

    if (pkgChecked !== true) return true;

    return false;
  }, [rows, pkgName, pkgId, selected, selectedTags, pkgChecked]);

  const reset = () => {
    const snap = JSON.parse(JSON.stringify(originalRowsRef.current)) as Row[];
    setRows(snap.length ? snap : [{ id: makeRowId(), variable: "description", value: "" }]);
    setPkgName(selected?.name || "");
    setPkgId(selected?.id || "");
    setPkgChecked(true);
    setSelectedTags(selected?.tagNames ?? []);
  };

  // Delete (DELETE) — solo id
  const deleteOnServer = async () => {
    if (!selected) return { ok: false as const, error: "No package selected" };
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
  };

  // Save:
  // - isNew = true  -> PUT (crear con estructura completa)
  // - isNew = false -> PATCH (actualizar existente)
  const save = async () => {
    if (!selected) return { ok: false as const, error: "No package selected" };
    setSaving(true);

    const META_KEYS = new Set([
      "description",
      "createdAt",
      "createdBy",
      "createdByName",
      "tagIds",
      "type",
      "route",
      "id",
      "name",
    ]);

    const meta: Record<string, string> = {};
    for (const r of rows) {
      const key = r.variable.trim();
      if (!key) continue;
      if (META_KEYS.has(key)) meta[key] = r.value;
    }

    const description = meta["description"] ?? "";
    const tagNames = (selectedTags?.length ? selectedTags : []) as string[];

    // Nested a partir de rows
    const iter1 = buildNestedFromRows(rows, "iteration1");
    const iter2 = buildNestedFromRows(rows, "iteration2");

    const defaultBlock = {
      urlSite: "",
      UsernameInput: "",
      PasswordInput: "",
    };

    const iteration1Block = Object.keys(iter1).length ? iter1 : defaultBlock;
    const iteration2Block = Object.keys(iter2).length ? iter2 : defaultBlock;

    const creator = selected?.createdByName || selected?.createdBy || "";

    try {
      if (isNew) {
        // === PUT (crear) ===
        const body = {
          name: pkgName.trim(),
          description,
          tagNames: tagNames.length ? tagNames : ["tag1"], // default si no eligieron tags
          iterationData: [
            {
              id: pkgId, // usamos el id local como id de bloque
              iterationCount: 2,
              iterationData: {
                iteration1: iteration1Block,
              },
              order: 0,
              apisScriptsName: "",
              createdBy: creator,
            },
            {
              id: pkgId,
              iterationCount: 3,
              iterationData: {
                iteration1: iteration1Block,
                iteration2: iteration2Block,
              },
              order: 1,
              apisScriptsName: "",
              createdBy: creator,
            },
          ],
          createdBy: creator,
        };

        const resp = await axios.put(apiUrl("iterationData"), body, {
          withCredentials: true,
        });

        // Después de crear, ya no es "nuevo"
        setIsNew(false);

        // Si el backend devuelve id de header, úsalo
        const newId =
          resp?.data?.id ||
          resp?.data?.header?.id ||
          resp?.data?.data?.id ||
          resp?.data?.resourceId ||
          pkgId;
        setPkgId(String(newId));
        setSelected((prev) =>
          prev ? { ...prev, id: String(newId), name: pkgName.trim(), tagNames } : prev
        );

        originalRowsRef.current = JSON.parse(JSON.stringify(rows));
        return { ok: true as const, status: resp.status, data: resp.data };
      } else {
        // === PATCH (actualizar existente) ===
        const body = {
          id: pkgId,
          tagNames,
          name: pkgName.trim(),
          description,
          // mantenemos iterationData original (salvo que tengas otra lógica de edición por filas)
          iterationData: originalIterationBlockRef.current ?? [],
          updatedBy: creator,
        };

        const resp = await axios.patch(apiUrl("iterationData"), body, {
          withCredentials: true,
        });

        originalRowsRef.current = JSON.parse(JSON.stringify(rows));
        return { ok: true as const, status: resp.status, data: resp.data };
      }
    } catch (err: any) {
      const status = err?.response?.status;
      const serverData = err?.response?.data;
      const serverMsg =
        serverData?.message ??
        serverData?.error ??
        (typeof serverData === "string" ? serverData : JSON.stringify(serverData));
      const fallback = err?.message || "Unknown error";
      const errorMsg = serverMsg || fallback;
      return { ok: false as const, status, error: errorMsg };
    } finally {
      setSaving(false);
    }
  };

  const duplicateLocalSnapshot = (): LocalSnapshot => ({
    pkgId,
    pkgName,
    checked: pkgChecked,
    tagNames: [...selectedTags],
    rows: rows.map((r) => ({ ...r })),
  });

  return {
    selected,

    pkgId,
    pkgName,
    setPkgName,

    pkgChecked,
    toggleChecked,

    rows,
    addRow,
    removeRow,
    updateRow,

    selectedTags,
    addTag,
    removeTag,

    isCollapsed,
    setIsCollapsed,
    menuOpen,
    setMenuOpen,
    isDirty,
    saving,

    isNew,

    loadFromHeader,
    createLocalBlankDraft,
    save,
    deleteOnServer,
    reset,

    duplicateLocalSnapshot,
  };
}
