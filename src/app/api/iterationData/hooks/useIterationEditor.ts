"use client";

import { useCallback, useMemo, useState } from "react";
import axios from "axios";
import { URL_API_ALB } from "@/config";
import type { IterationHeader } from "./useIterationList";

const api = (p: string) => new URL(p, URL_API_ALB).toString();
const newIterKeyFrom = (rows: RowsMap) => {
  const nums = Object.keys(rows)
    .map((k) => Number((k.match(/^iteration(\d+)$/i) || [])[1]))
    .filter((n) => Number.isFinite(n));
  const n = nums.length ? Math.max(...nums) + 1 : 1;
  return `iteration${n}`;
};
const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const randomUuidV4 = () =>
  "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });

export type RowsMap = Record<string, Record<string, string>>;
type SaveResult = { ok: true } | { ok: false; status?: number; error: string };

export function useIterationEditor() {
  const [selected, setSelected] = useState<IterationHeader | null>(null);
  const [pkgName, setPkgName] = useState("");
  const [pkgId, setPkgId] = useState("");
  const [pkgChecked, setPkgChecked] = useState(true);
  const [tagNames, setTagNames] = useState<string[]>([]);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const [metaRows, setMetaRows] = useState<{ [k: string]: string }>({
    description: "",
    createdAt: "",
    createdBy: "",
    createdByName: "",
    type: "ITERATIONDATA",
    route: "",
  });

  const [rows, setRows] = useState<RowsMap>({});
  const [snapshot, setSnapshot] = useState<RowsMap>({});

  const isNew = !selected?.id;
  const isDirty = useMemo(
    () => JSON.stringify(rows) !== JSON.stringify(snapshot),
    [rows, snapshot]
  );

  const addTag = (t: string) =>
    setTagNames((prev) => (prev.includes(t) ? prev : [...prev, t]));
  const removeTag = (t: string) =>
    setTagNames((prev) => prev.filter((x) => x !== t));
  const toggleChecked = () => setPkgChecked((v) => !v);
  const reset = () => setRows(JSON.parse(JSON.stringify(snapshot)));

  const clearSelection = () => {
    setSelected(null);
    setPkgName("");
    setPkgId("");
    setPkgChecked(true);
    setTagNames([]);
    setMetaRows({
      description: "",
      createdAt: "",
      createdBy: "",
      createdByName: "",
      type: "ITERATIONDATA",
      route: "",
    });
    setRows({});
    setSnapshot({});
  };

  const addIteration = () =>
    setRows((prev) => {
      const key = newIterKeyFrom(prev);
      const lastKey =
        Object.keys(prev)
          .sort(
            (a, b) =>
              Number((a.match(/\d+/)?.[0] ?? 0)) -
              Number((b.match(/\d+/)?.[0] ?? 0))
          )
          .pop() || "";
      const template = lastKey ? Object.keys(prev[lastKey]) : [];
      return {
        ...prev,
        [key]: template.reduce<Record<string, string>>((acc, k) => {
          acc[k] = "";
          return acc;
        }, {}),
      };
    });

  const addRow = (iterKey: string) =>
    setRows((prev) => {
      const current = prev[iterKey] || {};
      let base = "new_field";
      let i = 1;
      while (current[`${base}${i}`] !== undefined) i++;
      return { ...prev, [iterKey]: { ...current, [`${base}${i}`]: "" } };
    });

  const updateRow = (
    iterKey: string,
    varKey: string,
    patch: { newVarKey?: string; value?: string }
  ) =>
    setRows((prev) => {
      const current = { ...(prev[iterKey] || {}) };
      const value = patch.value ?? current[varKey] ?? "";
      const newVarKey = (patch.newVarKey ?? varKey).trim();
      if (!newVarKey) return prev;
      if (newVarKey !== varKey) delete current[varKey];
      current[newVarKey] = value;
      return { ...prev, [iterKey]: current };
    });

  const removeRow = (iterKey: string, varKey: string) =>
    setRows((prev) => {
      const current = { ...(prev[iterKey] || {}) };
      delete current[varKey];
      return { ...prev, [iterKey]: current };
    });

  const loadFromHeader = useCallback(async (h: IterationHeader) => {
    setSelected(h);
    setPkgName(h.name || "");
    setPkgId(h.id || "");

    try {
      const { data } = await axios.post(
        api("iterationData"),
        { id: h.id },
        { withCredentials: true }
      );

      const bucket: RowsMap = {};
      if (Array.isArray(data?.iterationData) && data.iterationData.length) {
        data.iterationData.forEach((item: any, idx: number) => {
          const obj = item?.iterationData || {};
          const pushLeaf = (path: string[], val: any) => {
            if (!path.length) return;
            const first = path[0];
            if (/^iteration\d+$/i.test(first)) {
              const iterKey = first;
              const varKey = path.slice(1).join(".");
              if (!varKey) return;
              bucket[iterKey] = bucket[iterKey] || {};
              bucket[iterKey][varKey] = String(val ?? "");
            } else {
              const iterKey = `iteration${idx + 1}`;
              const varKey = path.join(".");
              bucket[iterKey] = bucket[iterKey] || {};
              bucket[iterKey][varKey] = String(val ?? "");
            }
          };
          const walk = (prefix: string[], o: any) => {
            Object.entries(o || {}).forEach(([k, v]) => {
              const p = [...prefix, k];
              if (v && typeof v === "object" && !Array.isArray(v)) walk(p, v);
              else pushLeaf(p, v);
            });
          };
          walk([], obj);
        });
      }

      if (!Object.keys(bucket).length) {
        bucket["iteration1"] = {
          personal_username: "automationqa",
          password: "Secret1234*",
        };
      }

      setRows(bucket);
      setSnapshot(JSON.parse(JSON.stringify(bucket)));
    } catch {
      const base: RowsMap = {
        iteration1: {
          personal_username: "automationqa",
          password: "Secret1234*",
        },
      };
      setRows(base);
      setSnapshot(JSON.parse(JSON.stringify(base)));
    }
  }, []);

  const loadFromCsvFile = async (file: File): Promise<boolean> => {
    try {
      const text = await file.text();
      const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
      if (!lines.length) return false;

      const header = lines[0].split(",").map((s) => s.trim().toLowerCase());
      const varIdx = header.indexOf("variable");
      const valIdx = header.indexOf("value");
      if (varIdx === -1 || valIdx === -1) return false;

      const map: RowsMap = {};
      for (let i = 1; i < lines.length; i++) {
        const parts = lines[i].split(",");
        const rawVar = (parts[varIdx] ?? "").trim();
        const value = (parts[valIdx] ?? "").trim();
        if (!rawVar) continue;

        const m = rawVar.match(/^iteration(\d+)\.(.+)$/i);
        if (m) {
          const iterKey = `iteration${m[1]}`;
          const varKey = m[2];
          map[iterKey] = map[iterKey] || {};
          map[iterKey][varKey] = value;
        } else {
          const iterKey = "iteration1";
          const varKey = rawVar;
          map[iterKey] = map[iterKey] || {};
          map[iterKey][varKey] = value;
        }
      }
      if (!Object.keys(map).length) return false;

      setRows(map);
      setSnapshot(JSON.parse(JSON.stringify(map)));
      return true;
    } catch {
      return false;
    }
  };

  const validateForSave = (): { ok: true } | { ok: false; missingFields: string[] } => {
    const missing: string[] = [];
    if (!pkgName.trim()) missing.push("Package name");
    const hasAny = Object.values(rows).some((obj) =>
      Object.values(obj).some((v) => String(v ?? "").trim() !== "")
    );
    if (!hasAny) missing.push("iterationData (at least one value)");
    const createdByVal = metaRows.createdBy?.trim();
    if (isNew && !createdByVal) missing.push("createdBy");
    if (isNew && createdByVal && !UUID_RE.test(createdByVal))
      missing.push("createdBy (must be UUID)");
    const ts = metaRows.createdAt ? Number(metaRows.createdAt) : Date.now();
    if (!Number.isFinite(ts)) missing.push("createdAt (must be numeric timestamp)");
    return missing.length ? { ok: false, missingFields: missing } : { ok: true };
  };

  const buildBody = () => {
    const iterationData = Object.keys(rows)
      .sort(
        (a, b) =>
          Number((a.match(/\d+/)?.[0] ?? 0)) - Number((b.match(/\d+/)?.[0] ?? 0))
      )
      .map((iterKey, idx) => {
        const flat = rows[iterKey] || {};
        console.log("Building iterationData for", iterKey, "with", flat);
        
        const obj: Record<string, any> = {};
        Object.entries(flat).forEach(([k, v]) => {
          const parts = k.split(".").filter(Boolean);
          let cursor = obj as any;
          for (let i = 0; i < parts.length - 1; i++) {
            const t = parts[i];
            cursor[t] = cursor[t] || {};
            cursor = cursor[t];
          }
          cursor[parts[parts.length - 1]] = v;
        });
        return {
          id: selected?.id || undefined,
          iterationCount: 1,
          iterationData: obj,
          order: idx,
          apisScriptsName: pkgName.trim(),
          createdBy: metaRows.createdBy || "",
          };
      });

    console.log("selected in buildBody:", selected);
    
    const base: any = {
      id: selected?.id || pkgId || undefined,
      name: pkgName.trim(),
      tagNames,
      description: metaRows.description || "",
      createdBy: metaRows.createdBy || "",
      updatedBy: selected?.createdByName || metaRows.createdBy || "",
      createdAt: metaRows.createdAt ? Number(metaRows.createdAt) : Date.now(),
      iterationData,
    };

    return isNew ? sanitizeForCreate(base) : base;
  };

  function sanitizeForCreate(body: any) {
    const clone = JSON.parse(JSON.stringify(body));
    delete clone.id;
    if (!Array.isArray(clone.iterationData)) clone.iterationData = [];
    if (!clone.description) clone.description = "New package";
    if (!Array.isArray(clone.tagNames) || clone.tagNames.length === 0)
      clone.tagNames = ["Iteration 1"];

    clone.iterationData = clone.iterationData.map((it: any, idx: number) => {
      const c = { ...it };
      delete c.id;
      if (typeof c.iterationCount !== "number") c.iterationCount = 1;
      if (typeof c.order !== "number") c.order = idx;
      if (!c.apisScriptsName) c.apisScriptsName = clone.name || "iteration";
      if (!c.createdBy) c.createdBy = clone.createdBy || "system";
      return c;
    });

    if (
      !clone.iterationData.some((it: any) =>
        Object.values(it.iterationData || {}).some((v: any) =>
          typeof v === "object"
            ? Object.values(v).some((sv) => String(sv).trim() !== "")
            : String(v).trim() !== ""
        )
      )
    ) {
      clone.iterationData.push({
        iterationCount: 1,
        iterationData: {
          personal_username: "automationqa",
          password: "Secret1234*",
        },
        order: clone.iterationData.length,
        apisScriptsName: clone.name || "iteration",
        createdBy: clone.createdBy || "system",
      });
    }
    return clone;
  }

  const duplicateAsNew = async (): Promise<SaveResult> => {
    const copyName =
      (pkgName?.trim() || "iteration") +
      (pkgName.endsWith(" Copy") ? ` ${Date.now()}` : " Copy");
    try {
      setSaving(true);
      const body = buildBody();
      const createBody = sanitizeForCreate(body);
      createBody.name = copyName;
      await axios.put(api("iterationData"), createBody, { withCredentials: true });
      return { ok: true };
    } catch (e: any) {
      return {
        ok: false,
        status: e?.response?.status,
        error: e?.response?.data?.message || e?.message || "Unknown error",
      };
    } finally {
      setSaving(false);
    }
  };

  const save = async (): Promise<SaveResult> => {
    const val = validateForSave();
    if (val.ok === false) {
      return { ok: false, error: `Missing: ${val.missingFields.join(", ")}` };
    }
    try {
      setSaving(true);
      const body = buildBody();
      if (isNew) {
        const createBody = sanitizeForCreate(body);
        await axios.put(api("iterationData"), createBody, { withCredentials: true });
      } else {
        await axios.patch(api("iterationData"), body, { withCredentials: true });
      }
      setSnapshot(JSON.parse(JSON.stringify(rows)));
      return { ok: true };
    } catch (e: any) {
      return {
        ok: false,
        status: e?.response?.status,
        error: e?.response?.data?.message || e?.message || "Unknown error",
      };
    } finally {
      setSaving(false);
    }
  };

  const deleteOnServer = async (): Promise<SaveResult> => {
    if (!selected?.id) return { ok: false, error: "No package selected." };
    try {
      await axios.delete(api("iterationData"), {
        data: { id: selected.id },
        withCredentials: true,
      });
      clearSelection();
      return { ok: true };
    } catch (e: any) {
      return {
        ok: false,
        status: e?.response?.status,
        error: e?.response?.data?.message || e?.message || "Unknown error",
      };
    }
  };

  const createLocalBlankDraft = (name = "") => {
    setSelected({ id: "", name });
    setPkgName(name || "New package");
    setPkgId("");
    setPkgChecked(true);
    const initialTags = ["Iteration 1"];
    setTagNames(initialTags);
    const now = Date.now().toString();
    const routeId = randomUuidV4();
    setMetaRows({
      description: "New package",
      createdAt: now,
      createdBy: "92a4a7a4-8721-47b0-8666-ad551284cd46",
      createdByName: "Juan Camilo Gonzalez",
      type: "ITERATIONDATA",
      route: `ITERATIONDATA#${routeId}`,
    });
    const seed: RowsMap = {
      iteration1: {
        personal_username: "automationqa",
        password: "Secret1234*",
      },
    };
    setRows(seed);
    setSnapshot(JSON.parse(JSON.stringify(seed)));
  };

  const duplicateLocalSnapshot = () => ({
    pkgId,
    pkgName,
    checked: pkgChecked,
    tagNames: [...tagNames],
    rows: JSON.parse(JSON.stringify(rows)) as RowsMap,
  });

  return {
    selected,
    clearSelection,
    pkgName,
    setPkgName,
    pkgId,
    setPkgId,
    pkgChecked,
    toggleChecked,
    tagNames,
    addTag,
    removeTag,
    rows,
    setRows,
    addRow,
    updateRow,
    removeRow,
    addIteration,
    isCollapsed,
    setIsCollapsed,
    menuOpen,
    setMenuOpen,
    isNew,
    isDirty,
    saving,
    loadFromHeader,
    loadFromCsvFile,
    save,
    duplicateAsNew,
    deleteOnServer,
    reset,
    duplicateLocalSnapshot,
    validateForSave,
    metaRows,
    setMetaRows,
    createLocalBlankDraft,
  };
}
