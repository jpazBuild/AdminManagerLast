"use client";

import { useCallback, useMemo, useState } from "react";
import axios from "axios";
import { URL_API_ALB } from "@/config";
import type { IterationHeader } from "./useIterationList";
import type { Row } from "../types";

const api = (p: string) => new URL(p, URL_API_ALB).toString();
const newRowId = () => `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const randomUuidV4 = () =>
  "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0,
      v = c == "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });

type SaveResult = { ok: true } | { ok: false; status?: number; error: string };

export function useIterationEditor() {
  const [selected, setSelected] = useState<IterationHeader | null>(null);

  const [pkgName, setPkgName] = useState("");
  const [pkgId, setPkgId] = useState("");
  const [pkgChecked, setPkgChecked] = useState(true);

  const [tagNames, setTagNames] = useState<string[]>([]); // estado de chips

  const [rows, setRows] = useState<Row[]>([]);
  const [snapshot, setSnapshot] = useState<Row[]>([]);

  const [isCollapsed, setIsCollapsed] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const isNew = !selected?.id;

  const isDirty = useMemo(() => {
    return JSON.stringify(rows) !== JSON.stringify(snapshot);
  }, [rows, snapshot]);

  const addRow = () =>
    setRows((p) => [...p, { id: newRowId(), variable: "", value: "" }]);

  const removeRow = (id: string) =>
    setRows((p) => p.filter((r) => r.id !== id));

  const updateRow = (id: string, patch: Partial<Row>) =>
    setRows((p) => p.map((r) => (r.id === id ? { ...r, ...patch } : r)));

  const addTag = (t: string) =>
    setTagNames((prev) => (prev.includes(t) ? prev : [...prev, t]));

  const removeTag = (t: string) =>
    setTagNames((prev) => prev.filter((x) => x !== t));

  const toggleChecked = () => setPkgChecked((v) => !v);

  const reset = () => {
    if (!snapshot || snapshot.length === 0) return;
    setRows(JSON.parse(JSON.stringify(snapshot)));
  };

  const clearSelection = () => {
    setSelected(null);
    setPkgName("");
    setPkgId("");
    setPkgChecked(true);
    setTagNames([]);
    setRows([]);
    setSnapshot([]);
  };

  const parseTagNamesFromRows = (list: Row[]): string[] => {
    const row = list.find((r) => r.variable === "tagNames");
    if (!row || !row.value) return [];
    const raw = row.value;
    return raw
      .split(/[,;\n]/)
      .map((s) => s.trim())
      .filter(Boolean);
  };

  const loadFromHeader = useCallback(async (h: IterationHeader) => {
    setSelected(h);
    setPkgName(h.name || "");
    setPkgId(h.id || "");
    setTagNames(h.tagNames ?? []);

    try {
      const { data } = await axios.post(api("iterationData"), { id: h.id }, { withCredentials: true });

      const rowsLoaded: Row[] = [];
      const pushRow = (variable: string, value?: any) => {
        if (value === undefined || value === null) return;
        rowsLoaded.push({ id: newRowId(), variable, value: String(value) });
      };

      pushRow("description", data?.description);
      pushRow("createdAt", data?.createdAt);
      pushRow("createdBy", data?.createdBy);
      pushRow("createdByName", data?.createdByName);
      pushRow("type", data?.type);
      pushRow("route", data?.route);

      if (Array.isArray(data?.tagNames) && data.tagNames.length) {
        rowsLoaded.push({ id: newRowId(), variable: "tagNames", value: data.tagNames.join(", ") });
      }

      if (Array.isArray(data?.iterationData)) {
        for (const item of data.iterationData) {
          const obj = item?.iterationData || {};
          for (const [k, v] of Object.entries(obj)) {
            if (v && typeof v === "object") {
              for (const [sk, sv] of Object.entries(v as Record<string, unknown>)) {
                rowsLoaded.push({
                  id: newRowId(),
                  variable: `${k}.${sk}`,
                  value: String(sv),
                });
              }
            } else {
              rowsLoaded.push({ id: newRowId(), variable: k, value: String(v) });
            }
          }
        }
      }

      const tagsFromRows = parseTagNamesFromRows(rowsLoaded);
      if (tagsFromRows.length) setTagNames(tagsFromRows);
      else if (Array.isArray(data?.tagNames)) setTagNames(data.tagNames);

      const finalRows =
        rowsLoaded.length > 0
          ? rowsLoaded
          : [
              { id: newRowId(), variable: "description", value: h.description || "" },
              { id: newRowId(), variable: "createdBy", value: h.createdByName || h.createdBy || "" },
            ];

      setRows(finalRows);
      setSnapshot(JSON.parse(JSON.stringify(finalRows)));
    } catch {
      const base = [
        { id: newRowId(), variable: "description", value: h.description || "" },
        { id: newRowId(), variable: "createdBy", value: h.createdByName || h.createdBy || "" },
      ];
      setRows(base);
      setSnapshot(JSON.parse(JSON.stringify(base)));
    }
  }, []);

  const createLocalBlankDraft = (name = "") => {
    setSelected({ id: "", name });
    setPkgName(name || "New package");
    setPkgId("");
    setPkgChecked(true);

    const initialTags = ["Tag 1"];
    setTagNames(initialTags);

    const now = Date.now().toString();
    const routeId = randomUuidV4();

    const base: Row[] = [
      { id: newRowId(), variable: "description",   value: "New package" },
      { id: newRowId(), variable: "createdAt",     value: now },
      { id: newRowId(), variable: "createdBy",     value: "92a4a7a4-8721-47b0-8666-ad551284cd46" }, // <--- reemplaza por tu UUID si quieres
      { id: newRowId(), variable: "createdByName", value: "Juan Camilo Gonzalez" },
      { id: newRowId(), variable: "type",          value: "ITERATIONDATA" },
      { id: newRowId(), variable: "route",         value: `ITERATIONDATA#${routeId}` },

      { id: newRowId(), variable: "iteration1.urlSite",       value: "https://member.wp.blossombeta.com/home" },
      { id: newRowId(), variable: "iteration1.UsernameInput", value: "automationqa" },
      { id: newRowId(), variable: "iteration1.PasswordInput", value: "Secret1234*" },

      { id: newRowId(), variable: "tagNames", value: initialTags.join(", ") },
    ];

    setRows(base);
    setSnapshot(JSON.parse(JSON.stringify(base)));
  };

  const loadFromCsvFile = async (file: File): Promise<boolean> => {
    try {
      const text = await file.text();
      const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
      if (lines.length === 0) return false;

      const header = lines[0].split(",").map((s) => s.trim().toLowerCase());
      const varIdx = header.indexOf("variable");
      const valIdx = header.indexOf("value");
      if (varIdx === -1 || valIdx === -1) return false;

      const parsed: Row[] = [];
      for (let i = 1; i < lines.length; i++) {
        const parts = lines[i].split(",");
        const variable = (parts[varIdx] ?? "").trim();
        const value = (parts[valIdx] ?? "").trim();
        if (!variable) continue;
        parsed.push({ id: newRowId(), variable, value });
      }
      if (!parsed.length) return false;

      if (!selected) setSelected({ id: "", name: "Imported" });

      const ensure = [...parsed];
      const has = (v: string) => ensure.some((r) => r.variable === v);

      if (!has("description")) ensure.unshift({ id: newRowId(), variable: "description", value: "New package" });
      if (!has("createdBy")) ensure.unshift({ id: newRowId(), variable: "createdBy", value: "92a4a7a4-8721-47b0-8666-ad551284cd46" });
      if (!has("createdByName")) ensure.unshift({ id: newRowId(), variable: "createdByName", value: "Juan Camilo Gonzalez" });
      if (!has("createdAt")) ensure.unshift({ id: newRowId(), variable: "createdAt", value: Date.now().toString() });
      if (!has("type")) ensure.unshift({ id: newRowId(), variable: "type", value: "ITERATIONDATA" });
      if (!has("route")) ensure.unshift({ id: newRowId(), variable: "route", value: `ITERATIONDATA#${randomUuidV4()}` });

      const isReserved = /^(description|createdAt|createdBy|createdByName|type|route|tagNames)$/i;
      const hasIteration = ensure.some((r) => r.variable && !isReserved.test(r.variable));
      if (!hasIteration) {
        ensure.push({ id: newRowId(), variable: "iteration1.urlSite", value: "https://member.wp.blossombeta.com/home" });
      }

      if (!has("tagNames")) {
        ensure.push({ id: newRowId(), variable: "tagNames", value: "Tag 1" });
        setTagNames(["Tag 1"]);
      } else {
        const tagsFromRows = parseTagNamesFromRows(ensure);
        setTagNames(tagsFromRows);
      }

      setRows(ensure);
      setSnapshot(JSON.parse(JSON.stringify(ensure)));
      return true;
    } catch {
      return false;
    }
  };

  const validateForSave = (): { ok: true } | { ok: false; missingFields: string[] } => {
    const missing: string[] = [];

    if (!pkgName.trim()) missing.push("Package name");

    const desc = rows.find((r) => r.variable === "description")?.value?.trim();
    if (!desc) missing.push("description");

    const createdByVal = rows.find((r) => r.variable === "createdBy")?.value?.trim();
    if (isNew && !createdByVal) missing.push("createdBy");
    if (isNew && createdByVal && !UUID_RE.test(createdByVal)) {
      missing.push("createdBy (must be UUID)");
    }

    const createdAtStr = rows.find((r) => r.variable === "createdAt")?.value?.trim();
    if (isNew) {
      const ts = createdAtStr ? Number(createdAtStr) : NaN;
      if (!Number.isFinite(ts)) missing.push("createdAt (must be numeric timestamp)");
    }

    const tagsFromRows = parseTagNamesFromRows(rows);
    const effectiveTags = tagsFromRows.length ? tagsFromRows : tagNames;
    if (!effectiveTags || effectiveTags.length === 0) {
      missing.push("tagNames (add at least one tag)");
    }

    const isReserved = /^(description|createdAt|createdBy|createdByName|type|route|tagNames)$/i;
    const hasIter = rows.some((r) => r.variable && !isReserved.test(r.variable) && r.value?.trim());
    if (!hasIter) missing.push("iterationData (at least one non-empty value)");

    return missing.length ? { ok: false, missingFields: missing } : { ok: true };
  };

  const buildBody = () => {
    const meta: Record<string, string> = {};
    rows.forEach((r) => {
      const k = (r.variable || "").trim();
      if (!k) return;
      if (["description", "createdAt", "createdBy", "createdByName", "type", "route"].includes(k)) {
        meta[k] = r.value;
      }
    });

    const tagsFromRows = parseTagNamesFromRows(rows);
    const effectiveTags = tagsFromRows.length ? tagsFromRows : tagNames;

    const iterVars = rows.filter(
      (r) =>
        r.variable.trim() &&
        !["description", "createdAt", "createdBy", "createdByName", "type", "route", "tagNames"].includes(r.variable.trim())
    );

    const iterationDataObject = iterVars.reduce<Record<string, any>>((acc, r) => {
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

    const base = {
      tagNames: effectiveTags,
      name: pkgName.trim(),
      description: meta["description"] ?? "",
      iterationData: [
        {
          id: selected?.id || pkgId || undefined, 
          iterationCount: 1,
          iterationData: iterationDataObject,
          order: 0,
          apisScriptsName: pkgName.trim(),
          createdBy: meta["createdBy"] ?? "",
        },
      ],
      createdBy: meta["createdBy"] ?? "",
      updatedBy: meta["createdByName"] ?? meta["createdBy"] ?? "",
      createdAt: meta["createdAt"],
    };

    if (!isNew) {
      return { ...base, id: selected?.id || pkgId };
    }
    return base;
  };

  function sanitizeForCreate(body: any) {
    const clone = JSON.parse(JSON.stringify(body));
    delete clone.id;

    if (clone.createdAt != null) {
      const ts = Number(clone.createdAt);
      clone.createdAt = Number.isFinite(ts) ? ts : Date.now();
    } else {
      clone.createdAt = Date.now();
    }

    if (Array.isArray(clone.iterationData)) {
      clone.iterationData = clone.iterationData.map((it: any, idx: number) => {
        const copy = { ...it };
        delete copy.id;
        if (typeof copy.iterationCount !== "number") copy.iterationCount = 1;
        if (typeof copy.order !== "number") copy.order = idx;
        if (!copy.apisScriptsName) copy.apisScriptsName = clone.name || "iteration";
        if (!copy.createdBy) copy.createdBy = clone.createdBy || "system";
        return copy;
      });
    } else {
      clone.iterationData = [];
    }

    if (!clone.description) clone.description = "New package";

    if (!Array.isArray(clone.tagNames) || clone.tagNames.length === 0) {
      clone.tagNames = ["Tag 1"];
    }

    const hasValues =
      clone.iterationData.some((it: any) => it?.iterationData && Object.values(it.iterationData).some((v: any) => {
        if (v && typeof v === "object") return Object.values(v).some((sv) => String(sv).trim() !== "");
        return String(v).trim() !== "";
      }));

    if (!hasValues) {
      clone.iterationData.push({
        iterationCount: 1,
        iterationData: {
          iteration1: {
            urlSite: "https://member.wp.blossombeta.com/home",
            UsernameInput: "automationqa",
            PasswordInput: "Secret1234*",
          },
        },
        order: clone.iterationData.length,
        apisScriptsName: clone.name || "iteration",
        createdBy: clone.createdBy || "system",
      });
    }

    return clone;
  }

  const duplicateAsNew = async (): Promise<SaveResult> => {
    const baseName = pkgName?.trim() || "iteration";
    const copyName = baseName.endsWith(" Copy") ? `${baseName} ${Date.now()}` : `${baseName} Copy`;

    try {
      setSaving(true);
      const body = buildBody();
      const createBody = sanitizeForCreate(body);
      createBody.name = copyName;

      console.log("[PUT body - duplicate]", createBody);
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
        console.log("[PUT body]", createBody);
        await axios.put(api("iterationData"), createBody, { withCredentials: true });
      } else {
        console.log("[PATCH body]", body);
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
      await axios.delete(api("iterationData"), { data: { id: selected.id }, withCredentials: true });
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

  const duplicateLocalSnapshot = () => ({
    pkgId,
    pkgName,
    checked: pkgChecked,
    tagNames: [...tagNames],
    rows: JSON.parse(JSON.stringify(rows)) as Row[],
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
    addRow,
    removeRow,
    updateRow,

    isCollapsed,
    setIsCollapsed,
    menuOpen,
    setMenuOpen,

    isNew,
    isDirty,
    saving,

    loadFromHeader,
    createLocalBlankDraft,
    loadFromCsvFile,

    validateForSave,
    save,
    duplicateAsNew,
    deleteOnServer,
    reset,

    duplicateLocalSnapshot,
  };
}
