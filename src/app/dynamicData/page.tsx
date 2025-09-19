"use client";

import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { DashboardHeader } from "../Layouts/main";
import { URL_API_ALB } from "@/config";
import { ChevronDown, ChevronUp, Download, Trash2, PencilLine, Save, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import JSONDropzone from "../components/JSONDropzone";
import { SearchField } from "../components/SearchField";
import TextInputWithClearButton from "../components/InputClear";

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

const TAGS_TO_ARRAY = (s: string) =>
  s
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);

const ARRAY_TO_TAGS = (arr: string[]) => arr?.join(", ") ?? "";

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

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<EditForm | null>(null);
  const isEditing = useMemo(() => !!editingId, [editingId]);

  const [editJsonTextMap, setEditJsonTextMap] = useState<Record<string, string>>({}); // NEW
  const [editJsonErrorMap, setEditJsonErrorMap] = useState<Record<string, string | null>>({}); // NEW

  useEffect(() => {
    fetchHeaders();
    fetchCatalogs();
  }, []);

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
      console.error(e);
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
    } catch (error) {
      console.error(error);
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
      setEditJsonTextMap((m) => ({ ...m, [key]: pretty })); // NEW
      setEditJsonErrorMap((m) => ({ ...m, [key]: null })); // NEW
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
      toast.info("Cargá el JSON de dynamicData (arreglo de objetos) con el Dropzone.");
      return;
    }
    if (!createForm.createdBy) {
      toast.info("Selecciona el Created By.");
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
      console.error(e);
      toast.error(e?.response?.data?.error || "Can't create dynamic data.");
    } finally {
      setCreating(false);
    }
  };

  const startEdit = (hdr: DynamicHeader, detail: any | null) => {
    const id = hdr.id;
    const key = String(id);
    setEditingId(key);

    const dyn = detail?.dynamicData;
    setEditForm({
      id,
      groupName: hdr.groupName ?? "",
      name: hdr.name ?? "",
      description: hdr.description ?? "",
      tagNames: Array.isArray(hdr.tagNames) ? hdr.tagNames : [],
      createdBy: hdr.createdBy ?? hdr.createdByName ?? "",
      dynamicData: Array.isArray(dyn) ? dyn : [],
    });

    const pretty = JSON.stringify(Array.isArray(dyn) ? dyn : [], null, 2);
    setEditJsonTextMap((m) => ({ ...m, [key]: pretty }));
    setEditJsonErrorMap((m) => ({ ...m, [key]: null }));
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditForm(null);
  };

  const applyEditJsonTextToState = (key: string) => {
    try {
      const text = editJsonTextMap[key] ?? "[]";
      const parsed = JSON.parse(text);
      if (!Array.isArray(parsed)) throw new Error("JSON should be an array.");
      setEditForm((f) => (f ? { ...f, dynamicData: parsed } : f));
      setEditJsonErrorMap((m) => ({ ...m, [key]: null }));
      return true;
    } catch (err: any) {
      setEditJsonErrorMap((m) => ({ ...m, [key]: err?.message || "JSON invalid" }));
      return false;
    }
  };

  const saveEdit = async () => {
    if (!editForm) return;
    const key = String(editForm.id);

    const ok = applyEditJsonTextToState(key);
    if (!ok) {
      toast.error("Fix JSON errors before saving.");
      return;
    }

    const payload = {
      id: editForm.id,
      groupName: editForm.groupName,
      name: editForm.name,
      description: editForm.description,
      tagNames: editForm.tagNames,
      createdBy: editForm.createdBy,
      dynamicData: editForm.dynamicData,
      updatedBy: editForm.createdBy
    };

    try {
      await axios.patch(`${URL_API_ALB}dynamicData`, payload, {
        headers: { "Content-Type": "application/json" },
      });
      toast.success("Dynamic Data updated.");
      setEditingId(null);
      setEditForm(null);
      await fetchHeaders();
      if (expanded[key]) fetchDetail(editForm.id);
    } catch (e: any) {
      console.error(e);
      toast.error(e?.response?.data?.message || "Can't update dynamic data.");
    }
  };

  const deleteItem = async (id: string | number) => {
    try {
      await axios.delete(`${URL_API_ALB}dynamicData`, {
        data: { id }
      });
      toast.success("Deleted dynamic data.");
      setExpanded((ex) => {
        const copy = { ...ex };
        delete copy[String(id)];
        return copy;
      });
      await fetchHeaders();
    } catch (e: any) {
      console.error(e);
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

  return (
    <DashboardHeader onDarkModeChange={setDarkMode}>
      <div className="p-4 space-y-6">
        <h1 className="text-2xl font-semibold text-primary/80">Dynamic Data</h1>

        <section className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
          <h2 className="text-lg font-medium mb-3 text-primary/70">Create Dynamic Data</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <SearchField
                label="Select Group"
                value={createForm.groupName}
                onChange={(v) => setCreateForm((f) => ({ ...f, groupName: v }))}
                placeholder="Search group..."
                className="w-full"
                disabled={loadingCats}
                options={groupOptions}
              />
            </div>

            <div>
              <TextInputWithClearButton
                label="Name"
                id="name"
                placeholder="Test Dynamic Data 1"
                value={createForm.name}
                onChangeHandler={(e) => setCreateForm((f) => ({ ...f, name: e.target.value }))}
              />
            </div>

            <div className="md:col-span-2 flex flex-wrap gap-3">
              <TextInputWithClearButton
                label="Description"
                id="description"
                placeholder="Descripción"
                value={createForm.description}
                onChangeHandler={(e) => setCreateForm((f) => ({ ...f, description: e.target.value }))}
              />
              <SearchField
                label="Select tag"
                value={ARRAY_TO_TAGS(createForm.tagNames)}
                onChange={(v) => setCreateForm((f) => ({ ...f, tagNames: v ? [v] : [] }))}
                placeholder="Search tag..."
                className="w-full"
                disabled={loadingCats}
                options={tagOptions}
              />
              <SearchField
                label="Select Created By"
                value={createForm.createdBy}
                onChange={(v) => setCreateForm((f) => ({ ...f, createdBy: v }))}
                placeholder="Select Created By..."
                className="w-full"
                disabled={loadingCats}
                options={userOptions}
              />
            </div>

            <div className="md:col-span-2 flex flex-col">

              <div className="mt-2 self-center">

                <JSONDropzone
                  inputId="jsondz-create"
                  onJSONParsed={(json) => setCreateForm(f => ({ ...f, dynamicData: Array.isArray(json) ? json : [] }))}
                  onClear={() => setCreateForm(f => ({ ...f, dynamicData: [] }))}
                  isDarkMode={darkMode}
                />
              </div>

              <div className="mt-3 rounded-xl border border-gray-200 bg-gray-50 p-3 max-h-64 overflow-auto">
                <pre className="text-xs whitespace-pre-wrap break-all">
                  {createForm.dynamicData.length
                    ? JSON.stringify(createForm.dynamicData, null, 2)
                    : "// Still no dynamicData loaded"}
                </pre>
              </div>
            </div>
          </div>

          <div className="mt-4">
            <Button
              onClick={handleCreate}
              disabled={creating}
              variant="outline"
              className="rounded-2xl shadow-md bg-primary/90 hover:bg-primary/80 hover:text-white text-white/95"
            >
              {creating ? "Creating..." : "Create"}
            </Button>
          </div>
        </section>

        <div className="flex items-center gap-2 justify-between">
          <Button
            onClick={fetchHeaders}
            variant="outline"
            className="rounded-2xl border border-gray-300 hover:border-gray-400"
          >
            {loadingHeaders ? "Loading..." : "Refresh List"}
          </Button>
          <span className="text-sm text-gray-500">
            {loadingHeaders ? "Loading ..." : `${dynamicDataHeaders.length} ítem(s)`}
          </span>
        </div>

        <div className="space-y-4">
          {dynamicDataHeaders.map((item) => {
            const id = item.id;
            const key = String(id);
            const isOpen = !!expanded[key];
            const state = details[key];

            console.log("editForm for key", key, editForm);

            return (
              <div key={key} className="bg-white rounded-2xl shadow-md border border-gray-200 overflow-hidden">
                <div className="flex items-center justify-between px-4 py-3 gap-2">
                  <button
                    type="button"
                    onClick={() => toggleExpand(id)}
                    className="flex-1 flex items-center justify-between hover:bg-gray-50 rounded-xl px-2 py-2"
                  >
                    <div className="flex flex-col">
                      <p className="self-start text-[18px] font-medium text-primary/80 truncate">
                        {item?.name ?? "(Sin nombre)"}
                      </p>
                      <div className="self-start mt-1 flex flex-col items-center gap-2">
                        <span className="text-xs text-gray-500">ID: {String(id)}</span>
                        <div className="self-start flex items-center gap-2 flex-wrap">
                          {item?.groupName && (
                            <span className="text-xs text-white bg-primary/70 px-2 py-1 rounded-2xl">
                              {item.groupName}
                            </span>
                          )}
                          {Array.isArray(item?.tagNames) &&
                            item.tagNames.map((tag, i) => (
                              <span
                                key={`${key}-tag-${i}`}
                                className="text-xs bg-primary/80 text-white rounded-2xl px-2 py-1"
                              >
                                {tag}
                              </span>
                            ))}
                        </div>
                      </div>
                    </div>
                    <span className="ml-3 inline-flex h-6 w-6 items-center justify-center rounded-full">
                      {!isOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
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
                            disabled={true}
                            readOnly={true}
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
                            disabled={true}
                            readOnly={true}
                          />
                        </div>
                      )}

                    </div>

                    <div className="flex justify-end items-center mb-3 gap-2">
                      <Button
                        variant="outline"
                        className="rounded-xl px-3 py-2 border border-gray-300"
                        onClick={() => {
                          const st = details[key];
                          if (!st?.data) {
                            toast.info("Abre la tarjeta para cargar el detalle antes de editar.");
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
                        className="rounded-xl px-3 py-2 border border-red-300 text-red-600 hover:border-red-400"
                        onClick={() => deleteItem(id)}
                        title="Eliminar"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>

                    {state?.loading && <div className="text-sm text-gray-500">Loading detail…</div>}
                    {!state?.loading && state?.error && (
                      <div className="text-sm text-red-600">Error: {state?.error}</div>
                    )}

                    {!state?.loading && !state?.error && (
                      <>
                        {(!isEditing || editingId !== key) && (
                          <div className="rounded-xl border border-gray-200 bg-gray-50 p-3 max-h-[700px] overflow-y-auto">
                            <pre className="text-xs whitespace-pre-wrap break-all text-primary/80">
                              {JSON.stringify(details[key]?.data?.dynamicData ?? [], null, 2)}
                            </pre>
                          </div>
                        )}

                        {isEditing && editingId === key && editForm && (
                          <div className="mt-4 space-y-3">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">

                              <div>
                                <TextInputWithClearButton
                                  label="Name"
                                  id={`edit-name-${key}`}
                                  value={editForm.name}
                                  onChangeHandler={(e) =>
                                    setEditForm((f) => (f ? { ...f, name: e.target.value } : f))
                                  }
                                  placeholder="Test Dynamic Data 1"
                                />
                              </div>

                              <div className="md:col-span-2">

                                <TextInputWithClearButton
                                  label="Description"
                                  id={`edit-description-${key}`}
                                  value={editForm.description}
                                  onChangeHandler={(e) =>
                                    setEditForm((f) =>
                                      f ? { ...f, description: e.target.value } : f
                                    )
                                  }
                                  placeholder="Descripción"
                                />
                              </div>

                              <SearchField
                                label="Group"
                                value={editForm.groupName}
                                onChange={(v) =>
                                  setEditForm((f) => (f ? { ...f, groupName: v } : f))
                                }
                                placeholder="Search group..."
                                className="w-full"
                                disabled={loadingCats}
                                options={groupOptions}
                              />
                              <div>
                                <SearchField
                                  label="Tag"
                                  value={ARRAY_TO_TAGS(editForm.tagNames)}
                                  onChange={(v) =>
                                    setEditForm((f) =>
                                      f ? { ...f, tagNames: v ? [v] : [] } : f
                                    )
                                  }
                                  placeholder="Search tag..."
                                  className="w-full"
                                  disabled={loadingCats}
                                  options={tagOptions}
                                />
                              </div>

                              <div>
                                <SearchField
                                  label="Created By"
                                  value={userIdToName[editForm.createdBy] || ""}
                                  onChange={(v) =>
                                    setEditForm((f) => (f ? { ...f, createdBy: v } : f))
                                  }
                                  placeholder="Select user..."
                                  className="w-full"
                                  disabled={loadingCats}
                                  options={userOptions}
                                />
                              </div>
                            </div>

                            <div>
                              <div className="flex items-center justify-between">
                                <Label className="text-primary/70">dynamicData</Label>
                                <span className="text-xs text-gray-500">
                                  Should be an array of objects
                                </span>
                              </div>

                              <div className="max-h-[700px] flex overflow-y-auto">
                                <textarea
                                  className="mt-3 w-full text-primary/90 bg-primary/5 max-h-[700px] overflow-y-auto resize-none rounded-xl border border-gray-300 px-3 py-2 font-mono text-xs"
                                  value={editJsonTextMap[key] ?? "[]"}
                                  rows={20}
                                  onInput={(e) => {
                                    const el = e.currentTarget;
                                    el.style.height = "auto";
                                    const newH = Math.min(el.scrollHeight, MAX_H);
                                    el.style.height = `${newH}px`;
                                    el.style.overflowY = el.scrollHeight > MAX_H ? "auto" : "hidden";
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
                                  onBlur={() => {
                                    applyEditJsonTextToState(key);
                                  }}
                                />
                              </div>

                              {editJsonErrorMap[key] && (
                                <p className="mt-1 text-xs text-red-600">{editJsonErrorMap[key]}</p>
                              )}

                              <div className="mt-2">
                                <Button
                                  variant="outline"
                                  className="rounded-xl border border-gray-300"
                                  onClick={() => {
                                    const ok = applyEditJsonTextToState(key);
                                    if (ok) toast.success("JSON applied to state.");
                                  }}
                                >
                                  Apply JSON
                                </Button>
                              </div>
                            </div>

                            <div className="flex items-center gap-2 pt-1">
                              <Button
                                variant="outline"
                                className="rounded-xl bg-primary/90 hover:bg-primary/80 hover:text-white text-white/95 border border-primary/80"
                                onClick={saveEdit}
                              >
                                <Save className="w-4 h-4 mr-1" /> Save
                              </Button>
                              <Button
                                variant="outline"
                                className="rounded-xl border border-gray-300"
                                onClick={cancelEdit}
                              >
                                <X className="w-4 h-4 mr-1" /> Cancel
                              </Button>
                            </div>
                          </div>
                        )}
                      </>
                    )}

                    {!details[key] && (
                      <div className="text-sm text-gray-500">Open to card for details</div>
                    )}
                  </div>
                )}
              </div>
            );
          })}

          {!loadingHeaders && dynamicDataHeaders.length === 0 && (
            <div className="p-6 text-center text-sm text-gray-500">
              No there are headers to display.
            </div>
          )}
        </div>
      </div>
    </DashboardHeader>
  );
};

export default DynamicDataCrudPage;
