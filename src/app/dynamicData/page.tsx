"use client";

import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { DashboardHeader } from "../Layouts/main";
import { URL_API_ALB } from "@/config";
import {
  ChevronDown,
  ChevronUp,
  Trash2,
  PencilLine,
  Save,
  X,
  ChevronRight,
  ArrowDown,
  ArrowUp,
  Copy,
  PlusIcon,
  ArrowLeft,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import JSONDropzone from "../components/JSONDropzone";
import { SearchField } from "../components/SearchField";
import TextInputWithClearButton from "../components/InputClear";
import AddCustomStep from "../components/AddCustomStep";
import { FaSync } from "react-icons/fa";
import CopyToClipboard from "../components/CopyToClipboard";
import { Switch } from "@/components/ui/switch";
import ButtonTab from "../components/ButtonTab";
import PaginationResults from "../dashboard/components/PaginationResults";
import { usePagination } from "../hooks/usePagination";
import NoData from "../components/NoData";

type DynamicHeader = {
  id: string | number;
  name?: string;
  groupName?: string;
  tagNames?: string[];
  route?: string;
  description?: string;
  createdAt?: string;
  createdBy?: string;
  createdByName?: string;
  type?: string;
};

type DetailState = {
  loading: boolean;
  error: string | null;
  data: any | null;
};

type CreateForm = {
  groupName: string;
  name: string;
  description: string;
  tagNames: string[];
  createdBy: string;
  dynamicData: any[];
};

type EditForm = {
  id: string | number;
  groupName: string;
  name: string;
  description: string;
  tagNames: string[];
  createdBy: string;
  dynamicData: any[];
};

const ARRAY_TO_TAGS = (arr: string[]) => arr?.join(", ") ?? "";

const toText = (v: unknown) => (v === null || v === undefined ? "" : String(v));

const haystackFromHeader = (h: DynamicHeader) => {
  const bits: string[] = [];
  bits.push(
    toText(h.id),
    toText(h.name),
    toText(h.groupName),
    toText(h.route),
    toText(h.description),
    toText(h.createdBy),
    toText(h.createdByName),
    Array.isArray(h.tagNames) ? h.tagNames.join(" ") : toText(h.tagNames)
  );
  Object.entries(h).forEach(([k, v]) => {
    if (
      [
        "tagNames",
        "description",
        "name",
        "groupName",
        "route",
        "id",
        "createdBy",
        "createdByName",
      ].includes(k)
    )
      return;
    if (["string", "number", "boolean"].includes(typeof v)) {
      bits.push(k, String(v));
    }
  });
  return bits.join(" \u0001 ").toLowerCase();
};

const DynamicDataCrudPage = () => {
  const [darkMode, setDarkMode] = useState(false);
  const [dynamicDataHeaders, setDynamicDataHeaders] = useState<DynamicHeader[]>([]);
  const [loadingHeaders, setLoadingHeaders] = useState(false);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [details, setDetails] = useState<Record<string, DetailState>>({});
  const [creating, setCreating] = useState(false);
  const [createForm, setCreateForm] = useState<CreateForm>({
    groupName: "",
    name: "",
    description: "",
    tagNames: [],
    createdBy: "",
    dynamicData: [],
  });
  const [tags, setTags] = useState<any[]>([]);
  const [groups, setGroups] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [loadingCats, setLoadingCats] = useState(false);

  const [editingMap, setEditingMap] = useState<Record<string, boolean>>({});
  const [editForms, setEditForms] = useState<Record<string, EditForm>>({});
  const isEditing = (id: string | number) => !!editingMap[String(id)];
  const [viewCreate, setViewCreate] = useState(false);
  const [editJsonTextMap, setEditJsonTextMap] = useState<Record<string, string>>({});
  const [editJsonErrorMap, setEditJsonErrorMap] = useState<Record<string, string | null>>({});
  const [createMode, setCreateMode] = useState<"dropzone" | "editor">("dropzone");
  const [createJsonText, setCreateJsonText] = useState<string>("[]");
  const [createJsonError, setCreateJsonError] = useState<string | null>(null);
  const [openDynamicIds, setOpenDynamicIds] = useState<Record<string, boolean>>({});
  const [editViewMode, setEditViewMode] = useState<"json" | "cards">("cards");
  const [openEditItemIds, setOpenEditItemIds] = useState<Record<string, boolean>>({});
  const [showCustomDynamic, setShowCustomDynamic] = useState(false);
  const [insertAfterIndex, setInsertAfterIndex] = useState<number | null>(null);
  const [searchDD, setSearchDD] = useState("");

  const toggleDynamicId = (id: string | number) => {
    const k = String(id);
    setOpenDynamicIds((prev) => ({ ...prev, [k]: !prev[k] }));
  };

  useEffect(() => {
    fetchHeaders();
    fetchCatalogs();
  }, []);

  const toggleEditItem = (id: string | number) => {
    const k = String(id);
    setOpenEditItemIds((prev) => ({ ...prev, [k]: !prev[k] }));
  };

  const fetchCatalogs = async () => {
    try {
      setLoadingCats(true);
      const [tagsRes, groupsRes, usersRes] = await Promise.all([
        axios.post(`${URL_API_ALB}tags`, {}),
        axios.post(`${URL_API_ALB}groups`, {}),
        axios.post(`${URL_API_ALB}users`, {}),
      ]);
      setTags(Array.isArray(tagsRes.data) ? tagsRes.data : []);
      setGroups(Array.isArray(groupsRes.data) ? groupsRes.data : []);
      setUsers(Array.isArray(usersRes.data) ? usersRes.data : []);
    } catch (e) {
      toast.error("No se pudieron cargar Tags/Groups/Users.");
    } finally {
      setLoadingCats(false);
    }
  };

  const fetchHeaders = async () => {
    try {
      setLoadingHeaders(true);
      const response = await axios.post(`${URL_API_ALB}getDynamicDataHeaders`, {});
      const arr = Array.isArray(response.data) ? response.data : [];
      const normalized: DynamicHeader[] = arr.map((x: any, idx: number) =>
        typeof x === "string" ? { id: `idx-${idx}`, name: x } : x
      );
      setDynamicDataHeaders(normalized);
    } catch {
      toast.error("No se pudieron cargar los headers.");
    } finally {
      setLoadingHeaders(false);
    }
  };

  const fetchDetail = async (id: string | number) => {
    const key = String(id);
    setDetails((d) => ({
      ...d,
      [key]: { ...(d[key] ?? { data: null }), loading: true, error: null },
    }));
    try {
      const res = await axios.post(`${URL_API_ALB}dynamicData`, { id });
      setDetails((d) => ({
        ...d,
        [key]: { loading: false, error: null, data: res.data },
      }));
      const pretty = JSON.stringify(res?.data?.dynamicData ?? [], null, 2);
      setEditJsonTextMap((m) => ({ ...m, [key]: pretty }));
      setEditJsonErrorMap((m) => ({ ...m, [key]: null }));
    } catch (e: any) {
      setDetails((d) => ({
        ...d,
        [key]: {
          loading: false,
          error: e?.response?.data?.message || e?.message || "Error al cargar el detalle",
          data: null,
        },
      }));
    }
  };

  const toggleExpand = (id: string | number) => {
    const key = String(id);
    setExpanded((prev) => {
      const willOpen = !prev[key];
      if (willOpen) {
        const st = details[key];
        if (!st?.data && !st?.loading) {
          fetchDetail(id);
        }
      }
      return { ...prev, [key]: willOpen };
    });
  };

  const handleCreate = async () => {
    if (!createForm.groupName.trim() || !createForm.name.trim()) {
      toast.info("Completa al menos Group Name y Name.");
      return;
    }
    if (!Array.isArray(createForm.dynamicData) || createForm.dynamicData.length === 0) {
      toast.info("Upload with JSON Dropzone or fill dynamicData with JSON.");
      return;
    }
    if (!createForm.createdBy) {
      toast.info("Select Created By.");
      return;
    }

    const payload = {
      groupName: createForm.groupName,
      name: createForm.name,
      description: createForm.description,
      tagNames: createForm.tagNames,
      createdBy: createForm.createdBy,
      dynamicData: createForm.dynamicData,
    };

    try {
      setCreating(true);
      const res = await axios.put(`${URL_API_ALB}dynamicData`, payload, {
        headers: { "Content-Type": "application/json" },
      });
      if (res.status !== 200) throw new Error("Error creating dynamic data.");
      toast.success("Dynamic Data create succesfull.");
      setCreateForm({
        groupName: "",
        name: "",
        description: "",
        tagNames: [],
        createdBy: "",
        dynamicData: [],
      });
      await fetchHeaders();
    } catch (e: any) {
      toast.error(e?.response?.data?.error || "Can't create dynamic data.");
    } finally {
      setCreating(false);
    }
  };

  const startEdit = (hdr: DynamicHeader, detail: any | null) => {
    const id = hdr.id;
    const key = String(id);
    setEditingMap((m) => ({ ...m, [key]: true }));
    const dyn = detail?.dynamicData;
    const form: EditForm = {
      id,
      groupName: hdr.groupName ?? "",
      name: hdr.name ?? "",
      description: hdr.description ?? "",
      tagNames: Array.isArray(hdr.tagNames) ? hdr.tagNames : [],
      createdBy: hdr.createdBy ?? hdr.createdByName ?? "",
      dynamicData: Array.isArray(dyn) ? dyn : [],
    };
    setEditForms((f) => ({ ...f, [key]: form }));
    const pretty = JSON.stringify(form.dynamicData ?? [], null, 2);
    setEditJsonTextMap((m) => ({ ...m, [key]: pretty }));
    setEditJsonErrorMap((m) => ({ ...m, [key]: null }));
  };

  const cancelEdit = (key: string) => {
    setEditingMap((m) => {
      const c = { ...m };
      delete c[key];
      return c;
    });
    setEditForms((f) => {
      const c = { ...f };
      delete c[key];
      return c;
    });
  };

  const applyEditJsonTextToState = (key: string) => {
    try {
      const text = editJsonTextMap[key] ?? "[]";
      const parsed = JSON.parse(text);
      if (!Array.isArray(parsed)) throw new Error("JSON should be an array.");
      setEditForms((fs) => ({
        ...fs,
        [key]: { ...(fs[key] ?? ({} as any)), dynamicData: parsed },
      }));
      setEditJsonErrorMap((m) => ({ ...m, [key]: null }));
      return true;
    } catch (err: any) {
      setEditJsonErrorMap((m) => ({ ...m, [key]: err?.message || "JSON invalid" }));
      return false;
    }
  };

  const saveEdit = async (key: string) => {
    const form = editForms[key];
    if (!form) return;
    if (editViewMode === "json") {
      const ok = applyEditJsonTextToState(key);
      if (!ok) {
        toast.error("Fix JSON errors before saving.");
        return;
      }
    } else {
      setEditJsonTextMap((m) => ({
        ...m,
        [key]: JSON.stringify(form.dynamicData ?? [], null, 2),
      }));
    }
    const reindexedForSave = reindexDynamicData(editForms[key]?.dynamicData ?? []);
    const payload = {
      id: form.id,
      groupName: form.groupName,
      name: form.name,
      description: form.description,
      tagNames: form.tagNames,
      createdBy: form.createdBy,
      dynamicData: reindexedForSave,
      updatedBy: form.createdBy,
    };
    try {
      await axios.patch(`${URL_API_ALB}dynamicData`, payload, {
        headers: { "Content-Type": "application/json" },
      });
      toast.success("Dynamic Data updated.");
      cancelEdit(key);
      await fetchHeaders();
      if (expanded[key]) fetchDetail(payload.id);
    } catch (e: any) {
      toast.error(e?.response?.data?.message || "Can't update dynamic data.");
    }
  };

  const deleteItem = async (id: string | number) => {
    try {
      await axios.delete(`${URL_API_ALB}dynamicData`, {
        data: { id },
      });
      toast.success("Deleted dynamic data.");
      setExpanded((ex) => {
        const copy = { ...ex };
        delete copy[String(id)];
        return copy;
      });
      await fetchHeaders();
    } catch (e: any) {
      toast.error(e?.response?.data?.message || "Can't delete dynamic data.");
    }
  };

  const exportDetail = (id: string | number) => {
    const st = details[String(id)];
    const data = st?.data?.dynamicData;
    if (!Array.isArray(data)) {
      toast.info("No hay dynamicData para exportar.");
      return;
    }
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `dynamic-data-${id}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const tagOptions = useMemo(
    () => (tags || []).map((t: any) => ({ label: String(t.name), value: String(t.name) })),
    [tags]
  );
  const groupOptions = useMemo(
    () => (groups || []).map((g: any) => ({ label: String(g.name), value: String(g.name) })),
    [groups]
  );
  const userOptions = useMemo(
    () => (users || []).map((u: any) => ({ label: String(u.name), value: String(u.name) })),
    [users]
  );

  const userIdToName = useMemo(() => {
    const map: Record<string, string> = {};
    (users || []).forEach((u: any) => {
      map[String(u.id)] = String(u.name);
    });
    return map;
  }, [users]);

  const MAX_H = 700;

  const applyCreateJsonText = () => {
    try {
      const parsed = JSON.parse(createJsonText);
      if (!Array.isArray(parsed)) throw new Error("JSON should be an array.");
      setCreateForm((f) => ({ ...f, dynamicData: parsed }));
      setCreateJsonError(null);
      toast.success("JSON applied to state.");
      return true;
    } catch (err: any) {
      setCreateJsonError(err?.message || "JSON invalid");
      toast.error("Fix JSON errors.");
      return false;
    }
  };

  const reindexDynamicData = (list: any[], startAt = 0) => {
    const arr = Array.isArray(list) ? list : [];
    return arr.map((item, idx) => {
      const newOrder = startAt + idx;
      const inputObj =
        item && typeof item.input === "object" && item.input !== null ? item.input : {};
      return {
        ...item,
        order: newOrder,
        input: {
          ...inputObj,
        },
      };
    });
  };

  const normalizeToDynamicItem = (raw: any) => {
    const base = raw && typeof raw === "object" ? raw : {};
    const { id, input: maybeInput, order: _ignoreOrder, ...rest } = base;
    const input = maybeInput && typeof maybeInput === "object" ? maybeInput : base;
    return {
      id: id,
      input,
      order: 0,
      ...rest,
    };
  };

  const insertCustomDynamic = (rawItems: any[], afterIndex: number | null, docKey: string) => {
    setEditForms((fs) => {
      const currentForm = fs[docKey];
      if (!currentForm) return fs;
      const current = [...(currentForm.dynamicData ?? [])];
      const idx =
        afterIndex == null ? current.length : Math.min(Math.max(afterIndex + 1, 0), current.length);
      const items = rawItems.map(normalizeToDynamicItem);
      current.splice(idx, 0, ...items);
      const reindexed = reindexDynamicData(current);
      setEditJsonTextMap((m) => ({ ...m, [docKey]: JSON.stringify(reindexed, null, 2) }));
      return { ...fs, [docKey]: { ...currentForm, dynamicData: reindexed } };
    });
    setShowCustomDynamic(false);
    setInsertAfterIndex(null);
  };

  const handleChangeView =
    (docKey: string, form?: EditForm) =>
      (mode: "json" | "cards") => {
        switch (mode) {
          case "json": {
            setEditJsonTextMap((m) => ({
              ...m,
              [docKey]: JSON.stringify(form?.dynamicData ?? [], null, 2),
            }));
            setEditViewMode("json");
            break;
          }
          case "cards": {
            const ok = applyEditJsonTextToState(docKey);
            if (!ok) break;
            setEditForms((fs) => {
              const current = fs[docKey];
              if (!current) return fs;
              const reindexed = reindexDynamicData(current.dynamicData);
              setEditJsonTextMap((m) => ({
                ...m,
                [docKey]: JSON.stringify(reindexed, null, 2),
              }));
              return { ...fs, [docKey]: { ...current, dynamicData: reindexed } };
            });
            setEditViewMode("cards");
            break;
          }
        }
      };

  const filteredHeaders = useMemo(() => {
    const q = searchDD.trim().toLowerCase();
    if (!q) return dynamicDataHeaders;
    return dynamicDataHeaders.filter((h) => haystackFromHeader(h).includes(q));
  }, [dynamicDataHeaders, searchDD]);

  const { page, setPage, pageSize, setPageSize, totalItems, items: paginatedSelectedTests } =
    usePagination(filteredHeaders, 10);

  useEffect(() => {
    setPage(1);
  }, [searchDD, setPage]);

  // Helpers de clases para dark / light
  const pageTitle = darkMode ? "text-gray-100" : "text-primary/80";
  const cardBase =
    "rounded-2xl shadow-md overflow-hidden border transition-colors duration-200";
  const card = darkMode
    ? `${cardBase} bg-gray-900 border-gray-700`
    : `${cardBase} bg-white border-gray-200`;
  const subCard = darkMode
    ? "rounded-xl border border-gray-700 bg-gray-800"
    : "rounded-xl border border-gray-200 bg-gray-50";
  const softRow = darkMode ? "hover:bg-gray-900" : "hover:bg-gray-50";
  const mutedText = darkMode ? "text-gray-300" : "text-gray-500";
  const hardChip = darkMode
    ? "text-xs text-white bg-gray-700 px-2 py-1 rounded-2xl"
    : "text-xs text-white bg-primary/80 px-2 py-1 rounded-2xl";
  const fieldCard = darkMode
    ? "relative mb-3 rounded-md border border-gray-700 bg-gray-900 shadow-sm overflow-hidden py-4"
    : "relative mb-3 rounded-md border border-gray-200 bg-gray-100 shadow-sm overflow-hidden py-4";
  const textareaBase =
    "w-full max-h-[700px] overflow-y-auto resize-none rounded-xl px-3 py-2 font-mono text-xs border";
  const textarea = darkMode
    ? `${textareaBase} bg-gray-900 text-gray-100 border-gray-700`
    : `${textareaBase} bg-primary/5 text-primary/90 border-gray-300`;
  const smallBtnBorder = darkMode
    ? "rounded-xl px-3 py-2 border border-gray-600 text-gray-200"
    : "rounded-xl px-3 py-2 border border-gray-300";
  const primaryAction =
    "rounded-2xl shadow-md bg-primary/90 hover:bg-primary/80 hover:text-white text-white/95 border border-primary/80";

  return (
    <DashboardHeader onDarkModeChange={setDarkMode}>
      <div className={`p-4 space-y-6 ${darkMode ? "bg-gray-900 text-gray-100" : ""}`}>
        <div className="flex items-center justify-between">
          {!viewCreate && (
            <>
              <h1 className={`text-2xl font-bold ${pageTitle}`}>Dynamic Data Management</h1>
              <button
                onClick={() => setViewCreate(true)}
                className={`cursor-pointer flex gap-2 px-4 py-2 rounded-2xl shadow-2xl ${darkMode
                    ? "bg-gray-700 hover:bg-gray-600 text-gray-100"
                    : "bg-gray-300 hover:bg-gray-200 text-gray-800"
                  }`}
              >
                <PlusIcon className="w-5 h-5" /> Create
              </button>
            </>
          )}

          {viewCreate && (
            <>
              <h1 className={`text-2xl font-bold ${pageTitle}`}>Create Dynamic Data</h1>
              <button
                onClick={() => setViewCreate(false)}
                className={`cursor-pointer flex gap-2 px-4 py-2 rounded-2xl shadow-2xl ${darkMode
                    ? "bg-gray-700 hover:bg-gray-600 text-gray-100"
                    : "bg-gray-300 hover:bg-gray-200 text-gray-800"
                  }`}
              >
                <ArrowLeft className="w-5 h-5" /> Back to list
              </button>
            </>
          )}
        </div>

        {viewCreate && (
          <section className={card}>
            <div className="p-4">
              <h2 className={`text-lg font-medium mb-3 ${darkMode ? "text-gray-200" : "text-primary/70"}`}>
                Create Dynamic Data
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <SearchField
                    label="Select Group"
                    value={createForm.groupName}
                    onChange={(v) => setCreateForm((f) => ({ ...f, groupName: v }))}
                    placeholder="Search group..."
                    className="w-full"
                    disabled={loadingCats}
                    options={tagOptions}
                    darkMode={darkMode}
                  />
                </div>

                <div>
                  <TextInputWithClearButton
                    label="Name"
                    id="name"
                    placeholder="Test Dynamic Data 1"
                    value={createForm.name}
                    onChangeHandler={(e) => setCreateForm((f) => ({ ...f, name: e.target.value }))}
                    isDarkMode={darkMode}
                  />
                </div>

                <div className="md:col-span-2 flex flex-wrap gap-3">
                  <TextInputWithClearButton
                    label="Description"
                    id="description"
                    placeholder="Descripción"
                    value={createForm.description}
                    onChangeHandler={(e) => setCreateForm((f) => ({ ...f, description: e.target.value }))}
                    isDarkMode={darkMode}
                  />
                  <SearchField
                    label="Select tag"
                    value={ARRAY_TO_TAGS(createForm.tagNames)}
                    onChange={(v) => setCreateForm((f) => ({ ...f, tagNames: v ? [v] : [] }))}
                    placeholder="Search tag..."
                    className="w-full"
                    disabled={loadingCats}
                    options={tagOptions}
                    darkMode={darkMode}
                  />
                  <SearchField
                    label="Select Created By"
                    value={createForm.createdBy}
                    onChange={(v) => setCreateForm((f) => ({ ...f, createdBy: v }))}
                    placeholder="Select Created By..."
                    className="w-full"
                    disabled={loadingCats}
                    options={userOptions}
                    darkMode={darkMode}
                  />
                </div>

                <div className="md:col-span-2 flex flex-col">
                  <div className="flex items-center gap-2 mb-3 justify-center">
                    <ButtonTab
                      label="Upload JSON (Dropzone)"
                      value="dropzone"
                      isActive={createMode === "dropzone"}
                      onClick={() => setCreateMode("dropzone")}
                      isDarkMode={darkMode}
                    />
                    <ButtonTab
                      label="Edit JSON (Editor)"
                      value="editor"
                      isActive={createMode === "editor"}
                      onClick={() => setCreateMode("editor")}
                      isDarkMode={darkMode}
                    />
                  </div>

                  <div className="mt-2 self-center w-full flex flex-col justify-center">
                    {createMode === "dropzone" ? (
                      <>
                        <div className="mt-2 self-center">
                          <JSONDropzone
                            inputId="jsondz-create"
                            onJSONParsed={(json) =>
                              setCreateForm((f) => ({
                                ...f,
                                dynamicData: Array.isArray(json) ? json : [],
                              }))
                            }
                            onClear={() =>
                              setCreateForm((f) => ({
                                ...f,
                                dynamicData: [],
                              }))
                            }
                            isDarkMode={darkMode}
                          />
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="flex items-center justify-between">
                          <Label className={darkMode ? "text-gray-300" : "text-primary/70"}>
                            dynamicData
                          </Label>
                          <span className={`text-xs ${mutedText}`}>Should be an array of objects</span>
                        </div>
                        <textarea
                          className={textarea}
                          value={createJsonText}
                          rows={18}
                          onChange={(e) => {
                            const val = e.target.value;
                            setCreateJsonText(val);
                            try {
                              const parsed = JSON.parse(val);
                              if (!Array.isArray(parsed)) throw new Error("JSON should be an array.");
                              setCreateJsonError(null);
                            } catch (err: any) {
                              setCreateJsonError(err?.message || "JSON invalid");
                            }
                          }}
                          onInput={(e) => {
                            const el = e.currentTarget;
                            el.style.height = "auto";
                            const newH = Math.min(el.scrollHeight, MAX_H);
                            el.style.height = `${newH}px`;
                            el.style.overflowY = el.scrollHeight > MAX_H ? "auto" : "hidden";
                          }}
                          onBlur={applyCreateJsonText}
                          placeholder='[{"key":"value"}]'
                        />
                        {createJsonError && (
                          <p className={`mt-1 text-xs ${darkMode ? "text-rose-400" : "text-red-600"}`}>
                            {createJsonError}
                          </p>
                        )}
                        <div className="mt-2">
                          <Button
                            type="button"
                            variant="outline"
                            className={smallBtnBorder}
                            onClick={applyCreateJsonText}
                          >
                            Apply JSON
                          </Button>
                        </div>
                      </>
                    )}
                  </div>

                  {createMode === "dropzone" && createForm.dynamicData.length > 0 && (
                    <div className={`${subCard} mt-3 p-3 max-h-64 overflow-auto`}>
                      <pre className="text-xs whitespace-pre-wrap break-all">
                        {createForm.dynamicData.length > 0 &&
                          JSON.stringify(createForm.dynamicData, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-4">
                <Button
                  onClick={handleCreate}
                  disabled={creating}
                  variant="outline"
                  className={primaryAction}
                >
                  {creating ? "Creating..." : "Create"}
                </Button>
              </div>
            </div>
          </section>
        )}

        {!viewCreate && (
          <>
            <div className="flex items-center gap-2 justify-between">
              <Button
                onClick={fetchHeaders}
                variant="outline"
                className={`rounded-2xl border ${darkMode
                    ? "border-gray-600 hover:border-gray-500 text-gray-200"
                    : "border-gray-300 hover:border-gray-400"
                  }`}
              >
                {loadingHeaders ? (
                  <>
                    <FaSync className="w-4 h-4 mr-2 animate-pulse" /> Loading ...
                  </>
                ) : (
                  <>
                    <FaSync className="w-4 h-4 mr-2" /> Refresh List
                  </>
                )}
              </Button>
              <span className={`text-sm ${mutedText}`}>
                {loadingHeaders ? "Loading ..." : `${dynamicDataHeaders.length} ítem(s)`}
              </span>
            </div>

            <TextInputWithClearButton
              label="Search Dynamic Data"
              id="search-dynamic-data"
              value={searchDD}
              onChangeHandler={(e) => setSearchDD(e.target.value)}
              placeholder="Buscar por nombre, grupo, tags, descripción..."
              isDarkMode={darkMode}
            />

            <div className="space-y-4 min-h-[500px]">
              <PaginationResults
                totalItems={totalItems}
                pageSize={pageSize}
                setPageSize={setPageSize}
                page={page}
                setPage={setPage}
                darkMode={darkMode}
              />

              {paginatedSelectedTests.length === 0 && (
                <NoData text="No dynamic data found." darkMode={darkMode} />
              )}

              {paginatedSelectedTests?.map((item) => {
                const id = item.id;
                const key = String(id);
                const isOpen = !!expanded[key];
                const state = details[key];
                const ef = editForms[key];

                return (
                  <div key={key} className={card}>
                    <div className="flex items-center justify-between px-4 py-3 gap-2">
                      <button
                        type="button"
                        onClick={() => toggleExpand(id)}
                        className={`flex-1 flex items-center justify-between rounded-xl px-2 py-2 ${softRow}`}
                      >
                        <div className="flex flex-col">
                          <p
                            className={`self-start text-[18px] font-medium ${darkMode ? "text-gray-100" : "text-primary/80"
                              } truncate`}
                          >
                            {item?.name ?? "(Sin nombre)"}
                          </p>
                          <div className="self-start mt-1 flex flex-col items-start gap-2">
                            <span className={`text-xs ${mutedText}`}>ID: {String(id)}</span>
                            <div className="self-start flex items-center gap-2 flex-wrap">
                              {item?.groupName && (
                                <span
                                  className={
                                    darkMode
                                      ? "text-xs text-white bg-gray-700 px-2 py-1 rounded-2xl"
                                      : "text-xs text-white bg-primary/70 px-2 py-1 rounded-2xl"
                                  }
                                >
                                  {item.groupName}
                                </span>
                              )}
                              {Array.isArray(item?.tagNames) &&
                                item.tagNames.map((tag, i) => (
                                  <span key={`${key}-tag-${i}`} className={hardChip}>
                                    {tag}
                                  </span>
                                ))}
                            </div>
                          </div>
                        </div>
                        <span className="ml-3 inline-flex h-6 w-6 items-center justify-center rounded-full">
                          {!isOpen ? (
                            <ChevronDown className="w-4 h-4" />
                          ) : (
                            <ChevronUp className="w-4 h-4" />
                          )}
                        </span>
                      </button>
                    </div>

                    {isOpen && (
                      <div className="px-4 pb-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                          {item?.createdByName && (
                            <div className="text-sm">
                              <TextInputWithClearButton
                                label="Created by"
                                id={`created-by-${key}`}
                                value={item.createdByName}
                                onChangeHandler={() => { }}
                                placeholder="Created by"
                                disabled
                                readOnly
                                isDarkMode={darkMode}
                              />
                            </div>
                          )}
                          {item?.description && (
                            <div className="text-sm md:col-span-2">
                              <TextInputWithClearButton
                                label="Description"
                                id={`description-${key}`}
                                value={item.description}
                                onChangeHandler={() => { }}
                                placeholder="Description"
                                disabled
                                readOnly
                                isDarkMode={darkMode}
                              />
                            </div>
                          )}
                        </div>

                        {!isEditing(item.id) && (
                          <div className="flex justify-end items-center mb-3 gap-2">
                            <Button
                              variant="outline"
                              className={`rounded-xl px-3 py-2 border ${darkMode
                                  ? "border-gray-600 text-gray-200 hover:border-gray-500"
                                  : "border-gray-300"
                                }`}
                              onClick={() => {
                                const st = details[key];
                                if (!st?.data) {
                                  toast.info("Abre la tarjeta...");
                                  toggleExpand(id);
                                  return;
                                }
                                startEdit(item, st?.data);
                              }}
                              title="Editar"
                            >
                              <PencilLine className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="outline"
                              className={`rounded-xl px-3 py-2 border ${darkMode
                                  ? "border-rose-500/50 text-rose-300 hover:border-rose-400"
                                  : "border-red-300 text-red-600 hover:border-red-400"
                                }`}
                              onClick={() => deleteItem(id)}
                              title="Eliminar"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        )}

                        {state?.loading && (
                          <div className={`text-sm ${mutedText}`}>Loading detail…</div>
                        )}
                        {!state?.loading && state?.error && (
                          <div className={`text-sm ${darkMode ? "text-rose-400" : "text-red-600"}`}>
                            Error: {state?.error}
                          </div>
                        )}

                        {!state?.loading && !state?.error && (
                          <>
                            {!isEditing(item.id) && (
                              <div className={`${subCard} p-3 max-h-[700px] overflow-y-auto`}>
                                {!(details[key]?.data?.dynamicData || []).length && (
                                  <p className={`text-sm ${mutedText}`}>No dynamicData available.</p>
                                )}
                                {(details[key]?.data?.dynamicData ?? []).map(
                                  (obj: any, i: number) => {
                                    const objId = String(obj?.id ?? i);
                                    const open = !!openDynamicIds[objId];

                                    return (
                                      <div key={`${key}-obj-${objId}`} className={fieldCard}>
                                        <div className="text-white/90 absolute top-0 left-0 bg-primary/90 p-2 rounded-l-md rounded-br-full text-[12px] font-semibold">
                                          {obj.order}
                                        </div>
                                        <button
                                          type="button"
                                          onClick={() => toggleDynamicId(objId)}
                                          className={`w-full flex items-center justify-between px-3 py-2 mt-2 rounded-md ${darkMode ? "hover:bg-gray-800" : "hover:bg-gray-50"
                                            }`}
                                          aria-expanded={open}
                                          aria-controls={`dd-panel-${objId}`}
                                        >
                                          <div
                                            className={`flex items-center gap-2 ${darkMode ? "text-gray-200" : "text-primary/80"
                                              }`}
                                          >
                                            <span
                                              className={`transition-transform duration-200 ${open ? "rotate-90" : "rotate-0"
                                                }`}
                                            >
                                              <ChevronRight className="w-5 h-5" />
                                            </span>
                                            <span className="font-medium text-sm">
                                              {obj?.id ?? `Item #${i + 1}`}
                                            </span>
                                          </div>
                                          <span className={`text-xs ${mutedText}`}>
                                            {Object.keys(obj.input ?? {}).length} fields
                                          </span>
                                        </button>
                                        {open && (
                                          <div id={`dd-panel-${objId}`} className="px-3 pb-3">
                                            {Object.keys(obj.input ?? {}).length === 0 && (
                                              <p className={`text-sm ${mutedText}`}>
                                                No fields available.
                                              </p>
                                            )}
                                            {Object.entries(obj.input ?? {}).map(
                                              ([fieldKey, fieldVal]) => (
                                                <div
                                                  key={`${objId}-field-${fieldKey}`}
                                                  className="mb-2"
                                                >
                                                  <TextInputWithClearButton
                                                    id={`${objId}-input-${fieldKey}`}
                                                    label={fieldKey}
                                                    value={String(fieldVal ?? "")}
                                                    readOnly
                                                    onChangeHandler={() => { }}
                                                    placeholder={`Value for ${fieldKey}`}
                                                    isDarkMode={darkMode}
                                                  />
                                                </div>
                                              )
                                            )}
                                          </div>
                                        )}
                                      </div>
                                    );
                                  }
                                )}
                              </div>
                            )}

                            {isEditing(item.id) && ef && (
                              <div className="mt-4 space-y-3">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                  <div>
                                    <TextInputWithClearButton
                                      label="Name"
                                      id={`edit-name-${key}`}
                                      value={ef.name}
                                      onChangeHandler={(e) =>
                                        setEditForms((fs) => ({
                                          ...fs,
                                          [key]: { ...fs[key], name: e.target.value },
                                        }))
                                      }
                                      placeholder="Test Dynamic Data 1"
                                      isDarkMode={darkMode}
                                    />
                                  </div>
                                  <div className="md:col-span-2">
                                    <TextInputWithClearButton
                                      label="Description"
                                      id={`edit-description-${key}`}
                                      value={ef.description}
                                      onChangeHandler={(e) =>
                                        setEditForms((fs) => ({
                                          ...fs,
                                          [key]: { ...fs[key], description: e.target.value },
                                        }))
                                      }
                                      placeholder="Descripción"
                                      isDarkMode={darkMode}
                                    />
                                  </div>
                                  <SearchField
                                    label="Group"
                                    value={ef.groupName}
                                    onChange={(v) =>
                                      setEditForms((fs) => ({
                                        ...fs,
                                        [key]: { ...fs[key], groupName: v },
                                      }))
                                    }
                                    placeholder="Search group..."
                                    className="w-full"
                                    disabled={loadingCats}
                                    options={groupOptions}
                                    darkMode={darkMode}
                                  />
                                  <div>
                                    <SearchField
                                      label="Tag"
                                      value={ARRAY_TO_TAGS(ef.tagNames)}
                                      onChange={(v) =>
                                        setEditForms((fs) => ({
                                          ...fs,
                                          [key]: { ...fs[key], tagNames: v ? [v] : [] },
                                        }))
                                      }
                                      placeholder="Search tag..."
                                      className="w-full"
                                      disabled={loadingCats}
                                      options={tagOptions}
                                      darkMode={darkMode}
                                    />
                                  </div>
                                  <div>
                                    <SearchField
                                      label="Created By"
                                      value={userIdToName[ef.createdBy] || ""}
                                      onChange={(v) =>
                                        setEditForms((fs) => ({
                                          ...fs,
                                          [key]: { ...fs[key], createdBy: v },
                                        }))
                                      }
                                      placeholder="Select user..."
                                      className="w-full"
                                      disabled={loadingCats}
                                      options={userOptions}
                                      darkMode={darkMode}
                                    />
                                  </div>
                                </div>

                                {(() => {
                                  const onChangeView = handleChangeView(key, ef);
                                  const isCards = editViewMode === "cards";

                                  const tabActive =
                                    darkMode
                                      ? "text-primary/80 border-b-2 border-primary/60"
                                      : "text-primary/90 border-b-2 border-primary/70";

                                  const tabInactive =
                                    darkMode ? "text-gray-400" : "text-gray-500";

                                  const switchCls =
                                    // pista/fondo del switch
                                    (darkMode ? "bg-gray-700" : "bg-gray-300") +
                                    " data-[state=checked]:bg-primary/70 " +
                                    // borde sutil en dark
                                    (darkMode ? " border border-gray-600" : " border border-transparent");

                                  return (
                                    <div className="flex items-center gap-3 mb-2">
                                      <span className={`${isCards ? tabInactive : tabActive} text-sm`}>JSON</span>
                                      <Switch
                                        checked={isCards}
                                        onCheckedChange={(checked) => onChangeView(checked ? "cards" : "json")}
                                        aria-label="Toggle JSON/UI"
                                        className={switchCls}
                                      />
                                      <span className={`${isCards ? tabActive : tabInactive} text-sm`}>UI</span>
                                    </div>
                                  );
                                })()}

                                {editViewMode === "json" ? (
                                  <>
                                    <div className="flex items-center justify-between">
                                      <Label className={darkMode ? "text-gray-300" : "text-primary/70"}>
                                        dynamicData
                                      </Label>
                                      <span className={`text-xs ${mutedText}`}>
                                        Should be an array of objects
                                      </span>
                                    </div>
                                    <div className="max-h-[700px] flex overflow-y-auto">
                                      <textarea
                                        className={textarea}
                                        value={editJsonTextMap[key] ?? "[]"}
                                        rows={20}
                                        onInput={(e) => {
                                          const el = e.currentTarget;
                                          el.style.height = "auto";
                                          const newH = Math.min(el.scrollHeight, MAX_H);
                                          el.style.height = `${newH}px`;
                                          el.style.overflowY =
                                            el.scrollHeight > MAX_H ? "auto" : "hidden";
                                        }}
                                        onChange={(e) => {
                                          const val = e.target.value;
                                          setEditJsonTextMap((m) => ({ ...m, [key]: val }));
                                          try {
                                            const parsed = JSON.parse(val);
                                            if (!Array.isArray(parsed))
                                              throw new Error("JSON should be an array.");
                                            setEditJsonErrorMap((m) => ({ ...m, [key]: null }));
                                          } catch (err: any) {
                                            setEditJsonErrorMap((m) => ({
                                              ...m,
                                              [key]: err?.message || "JSON invalid",
                                            }));
                                          }
                                        }}
                                        onBlur={() => applyEditJsonTextToState(key)}
                                      />
                                    </div>
                                    {editJsonErrorMap[key] && (
                                      <p
                                        className={`mt-1 text-xs ${darkMode ? "text-rose-400" : "text-red-600"
                                          }`}
                                      >
                                        {editJsonErrorMap[key]}
                                      </p>
                                    )}
                                    <div className="mt-2">
                                      <Button
                                        variant="outline"
                                        className={smallBtnBorder}
                                        onClick={() => {
                                          const ok = applyEditJsonTextToState(key);
                                          if (ok) toast.success("JSON applied to state.");
                                        }}
                                      >
                                        Apply JSON
                                      </Button>
                                    </div>
                                  </>
                                ) : (
                                  <div className="mt-2 space-y-3 max-h-[700px] overflow-y-auto">
                                    {(ef?.dynamicData ?? []).length === 0 && (
                                      <p className={`text-sm ${mutedText}`}>
                                        No dynamicData available.
                                      </p>
                                    )}
                                    <div
                                      className={`w-56 flex mb-2 gap-2 p-2 border border-dashed rounded-xl ${darkMode ? "border-gray-600" : "border-gray-300"
                                        }`}
                                    >
                                      <CopyToClipboard
                                        text={JSON.stringify(ef?.dynamicData ?? [], null, 2)}
                                        isDarkMode={darkMode}
                                      />
                                      <p className={darkMode ? "text-gray-200" : "text-primary/70"}>
                                        Copy all dynamic data
                                      </p>
                                    </div>
                                    {(ef?.dynamicData ?? []).map((obj: any, i: number) => {
                                      const objId = String(obj?.id ?? `idx-${i}`);
                                      const open = !!openEditItemIds[objId];

                                      const moveItem = (idx: number, dir: -1 | 1) => {
                                        setEditForms((fs) => {
                                          const f = fs[key];
                                          if (!f) return fs;
                                          const arr = [...(f.dynamicData ?? [])];
                                          const newIdx = idx + dir;
                                          if (newIdx < 0 || newIdx >= arr.length) return fs;
                                          [arr[idx], arr[newIdx]] = [arr[newIdx], arr[idx]];
                                          const reindexed = reindexDynamicData(arr);
                                          setEditJsonTextMap((m) => ({
                                            ...m,
                                            [key]: JSON.stringify(reindexed, null, 2),
                                          }));
                                          return { ...fs, [key]: { ...f, dynamicData: reindexed } };
                                        });
                                      };

                                      const deleteItemAt = (idx: number) => {
                                        setEditForms((fs) => {
                                          const f = fs[key];
                                          if (!f) return fs;
                                          const arr = [...(f.dynamicData ?? [])];
                                          const removed = arr.splice(idx, 1);
                                          const reindexed = reindexDynamicData(arr);
                                          setEditJsonTextMap((m) => ({
                                            ...m,
                                            [key]: JSON.stringify(reindexed, null, 2),
                                          }));
                                          setOpenEditItemIds((prev) => {
                                            const copy = { ...prev };
                                            const rem = removed?.[0];
                                            if (rem?.id) delete copy[String(rem.id)];
                                            return copy;
                                          });
                                          return { ...fs, [key]: { ...f, dynamicData: reindexed } };
                                        });
                                      };

                                      return (
                                        <div
                                          key={`${key}-card-${objId}`}
                                          className={`relative rounded-md shadow-sm overflow-hidden py-3 ${darkMode
                                              ? "border border-gray-700 bg-gray-900"
                                              : "border border-gray-200 bg-gray-100"
                                            }`}
                                        >
                                          <div className="text-white/90 absolute top-0 left-0 bg-primary/90 p-2 rounded-l-md rounded-br-full text-[12px] font-semibold">
                                            {obj.order}
                                          </div>

                                          <div className="flex items-center justify-between px-3 py-2 mt-4">
                                            <button
                                              type="button"
                                              onClick={() => toggleEditItem(objId)}
                                              className={`flex items-center gap-2 ${darkMode
                                                  ? "text-gray-200 hover:opacity-80"
                                                  : "text-primary/80 hover:opacity-80"
                                                }`}
                                              aria-expanded={open}
                                              aria-controls={`edit-card-panel-${objId}`}
                                            >
                                              <span
                                                className={`transition-transform duration-200 ${open ? "rotate-90" : "rotate-0"
                                                  }`}
                                              >
                                                <ChevronRight className="w-5 h-5" />
                                              </span>
                                              <span className="font-medium text-sm">
                                                {obj?.id ?? `Item #${i + 1}`}
                                              </span>
                                            </button>

                                            <div className="flex items-center gap-1">
                                              <Button
                                                type="button"
                                                variant="outline"
                                                className={`h-8 w-8 p-0 rounded-lg ${darkMode ? "border-gray-600" : "border-primary/50"
                                                  }`}
                                                onClick={() => moveItem(i, -1)}
                                                disabled={i === 0}
                                                title="Move up"
                                              >
                                                <ArrowUp className="w-4 h-4" />
                                              </Button>
                                              <Button
                                                type="button"
                                                variant="outline"
                                                className={`h-8 w-8 p-0 rounded-lg ${darkMode ? "border-gray-600" : "border-primary/50"
                                                  }`}
                                                onClick={() => moveItem(i, +1)}
                                                disabled={i === (ef?.dynamicData?.length ?? 1) - 1}
                                                title="Move down"
                                              >
                                                <ArrowDown className="w-4 h-4" />
                                              </Button>
                                              <div
                                                className={`h-8 w-8 p-0 rounded-lg flex items-center justify-center ${darkMode
                                                    ? "border border-gray-600"
                                                    : "border border-primary/50"
                                                  }`}
                                                title="Copy JSON to clipboard"
                                              >
                                                <CopyToClipboard
                                                  text={JSON.stringify(obj, null, 2)}
                                                  isDarkMode={darkMode}
                                                />
                                              </div>

                                              <Button
                                                type="button"
                                                variant="outline"
                                                className={`h-8 w-8 p-0 rounded-lg ${darkMode
                                                    ? "border-rose-500/50 text-rose-300 hover:border-rose-400"
                                                    : "border-red-300 text-red-600 hover:border-red-400"
                                                  }`}
                                                onClick={() => {
                                                  deleteItemAt(i);
                                                  toast.success("Item deleted.");
                                                }}
                                                title="Delete item"
                                              >
                                                <Trash2 className="w-4 h-4" />
                                              </Button>
                                            </div>
                                          </div>

                                          {open && (
                                            <div id={`edit-card-panel-${objId}`} className="px-3 pb-3">
                                              {Object.keys(obj?.input ?? {}).length === 0 && (
                                                <p className={`text-sm ${mutedText}`}>
                                                  No input available.
                                                </p>
                                              )}
                                              {Object.entries(obj.input ?? {}).map(
                                                ([fieldKey, fieldVal]) => (
                                                  <div
                                                    key={`${objId}-field-${fieldKey}`}
                                                    className="mb-2"
                                                  >
                                                    <TextInputWithClearButton
                                                      id={`${objId}-input-${fieldKey}`}
                                                      label={fieldKey}
                                                      value={String(fieldVal ?? "")}
                                                      onChangeHandler={(e) => {
                                                        const val = e.target.value;
                                                        setEditForms((fs) => {
                                                          const f = fs[key];
                                                          if (!f) return fs;
                                                          const arr = [...(f.dynamicData ?? [])];
                                                          const objToUpdate = { ...arr[i] };
                                                          objToUpdate.input = {
                                                            ...objToUpdate.input,
                                                            [fieldKey]: val,
                                                          };
                                                          arr[i] = objToUpdate;
                                                          setEditJsonTextMap((m) => ({
                                                            ...m,
                                                            [key]: JSON.stringify(arr, null, 2),
                                                          }));
                                                          return {
                                                            ...fs,
                                                            [key]: { ...f, dynamicData: arr },
                                                          };
                                                        });
                                                      }}
                                                      placeholder={`Value for ${fieldKey}`}
                                                      isDarkMode={darkMode}
                                                    />
                                                  </div>
                                                )
                                              )}
                                            </div>
                                          )}
                                        </div>
                                      );
                                    })}

                                    <div className="flex mb-2">
                                      <Button
                                        type="button"
                                        variant="outline"
                                        className={`rounded-xl ${darkMode
                                            ? "border border-gray-600 text-gray-200"
                                            : "border border-gray-300"
                                          }`}
                                        onClick={() => {
                                          setInsertAfterIndex(null);
                                          setShowCustomDynamic(true);
                                        }}
                                      >
                                        + Add item
                                      </Button>
                                    </div>
                                    {showCustomDynamic && (
                                      <AddCustomStep
                                        setOpen={setShowCustomDynamic}
                                        onAdd={(custom) => {
                                          const toInsert = Array.isArray(custom) ? custom : [custom];
                                          const docKey = String(ef.id ?? "");
                                          insertCustomDynamic(toInsert, insertAfterIndex, docKey);
                                        }}
                                      />
                                    )}
                                  </div>
                                )}

                                <div className="flex items-center gap-2 pt-1">
                                  <Button
                                    variant="outline"
                                    className={primaryAction}
                                    onClick={() => saveEdit(key)}
                                  >
                                    <Save className="w-4 h-4 mr-1" /> Save
                                  </Button>
                                  <Button
                                    variant="outline"
                                    className={smallBtnBorder}
                                    onClick={() => cancelEdit(key)}
                                  >
                                    <X className="w-4 h-4 mr-1" /> Cancel
                                  </Button>
                                </div>
                              </div>
                            )}
                          </>
                        )}

                        {!details[key] && (
                          <div className={`text-sm ${mutedText}`}>Open to card for details</div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}

              {!loadingHeaders && dynamicDataHeaders.length === 0 && (
                <div className={`p-6 text-center text-sm ${mutedText}`}>
                  No there are headers to display.
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </DashboardHeader>
  );
};

export default DynamicDataCrudPage;
