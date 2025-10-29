"use client";
import React, { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { FaChevronDown, FaChevronUp, FaEdit } from "react-icons/fa";
import { ChevronDown, ChevronUp, PlusIcon, Save, Trash2, Trash2Icon } from "lucide-react";
import { FaXmark } from "react-icons/fa6";
import CopyToClipboard from "./CopyToClipboard";
import TextInputWithClearButton from "./InputClear";
import { PrismLight as SyntaxHighlighter } from "react-syntax-highlighter";
import { atomOneDark, atomOneLight } from "react-syntax-highlighter/dist/esm/styles/hljs";
import ButtonTab from "./ButtonTab";
import { SearchField } from "./SearchField";
import { httpMethodsStyle } from "../api/utils/colorMethods";

const HTTP_METHODS = ["GET", "POST", "PUT", "PATCH", "DELETE", "HEAD", "OPTIONS"];
const METHOD_OPTIONS = HTTP_METHODS.map((m) => ({ label: m, value: m }));

interface InteractionItemData {
  id: string;
  action?: string;
  name?: string;
  description?: string;
  type?: string;
  stepsData?: any[];
  stepData?: any;
  [key: string]: any;
}

interface InteractionItemProps {
  data: InteractionItemData;
  index: number;
  isContext?: boolean;
  onDelete?: (index: number) => void;
  onUpdate?: (index: number, updatedData: InteractionItemData) => void;
  isDarkMode?: boolean;
  test?: any;
  steps?: any[];
  setTestCasesData?: React.Dispatch<React.SetStateAction<any[]>>;
  setResponseTest?: React.Dispatch<React.SetStateAction<any>>;
  showDelete?: boolean;
}

interface JSONBoxProps {
  value: any;
  onChange?: (value: any) => void;
  isDarkMode?: boolean;
}

interface PanelState {
  [key: string]: boolean;
}

const DeleteButton = ({ onClick, isDarkMode = false }: { onClick: () => void; isDarkMode: boolean }) => (
  <button onClick={onClick} className={`p-1 rounded ${isDarkMode ? "text-gray-300 hover:text-white" : "text-gray-600 hover:text-gray-800"}`}>
    <Trash2 className="w-4 h-4" />
  </button>
);

function DisplayImageWithFetch({
  src,
  alt,
  isDarkMode = true,
  ...props
}: {
  src: string;
  alt?: string;
  isDarkMode?: boolean;
  [key: string]: any;
}) {
  const [isError, setIsError] = React.useState(false);
  React.useEffect(() => setIsError(false), [src]);
  if (!src || isError) {
    const containerClasses = isDarkMode
      ? "flex flex-col items-center justify-center bg-gray-700 border border-gray-600 px-3 py-4 rounded-md max-h-32 min-h-[6rem] min-w-[8rem]"
      : "flex flex-col items-center justify-center bg-gray-100 px-3 py-4 rounded-md max-h-32 min-h-[6rem] min-w-[8rem]";
    const iconColor = "text-gray-400";
    const textColor = isDarkMode ? "text-gray-300" : "text-gray-400";
    return (
      <div className={containerClasses}>
        <svg className={`w-10 h-10 ${iconColor} mb-2`} fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
          <rect x="3" y="3" width="18" height="18" rx="2" fill={isDarkMode ? "#475569" : "#e5e7eb"} />
          <circle cx="8.5" cy="8.5" r="1.5" fill={isDarkMode ? "#64748b" : "#cbd5e1"} />
          <path d="M21 17l-5-5-7 7" stroke="#94a3b8" strokeWidth={2} />
        </svg>
        <span className={`text-xs ${textColor} break-all`}>Image not available</span>
      </div>
    );
  }
  return <img src={src} alt={alt || "Imagen"} onError={() => setIsError(true)} className="max-h-32 w-auto rounded-md shadow-sm" {...props} />;
}

const JSONBox: React.FC<JSONBoxProps> = React.memo(({ value, onChange, isDarkMode = true }) => {
  const [openPanels, setOpenPanels] = useState<PanelState>({});
  const [editingJson, setEditingJson] = useState(false);
  const [jsonValue, setJsonValue] = useState(() => JSON.stringify(value, null, 2));
  const [jsonError, setJsonError] = useState<string | null>(null);

  const lastSavedStrRef = useRef<string | null>(null);
  const [collapsedApis, setCollapsedApis] = useState<Record<number, boolean>>({});
  const [viewModeApiByIdx, setViewModeApiByIdx] = useState<Record<number, "request" | "env" | "script">>({});
  const setViewModeApiFor = (i: number, tab: "request" | "env" | "script") => setViewModeApiByIdx((p) => ({ ...p, [i]: tab }));

  useEffect(() => {
    if (editingJson) return;
    const incoming = JSON.stringify(value, null, 2);
    if (lastSavedStrRef.current) {
      if (incoming === lastSavedStrRef.current) {
        setJsonValue(incoming);
        lastSavedStrRef.current = null;
      }
      return;
    }
    setJsonValue(incoming);
  }, [value, editingJson]);

  function handleSave() {
    try {
      const parsed = JSON.parse(jsonValue);
      if (!parsed.action && (value as any)?.action) {
        (parsed as any).action = (value as any).action;
      }
      setJsonError(null);
      const pretty = JSON.stringify(parsed, null, 2);
      lastSavedStrRef.current = pretty;
      setJsonValue(pretty);
      onChange?.(parsed);
      setEditingJson(false);
    } catch (err: any) {
      setJsonError("Invalid JSON: " + err.message);
    }
  }

  const getDropdownHeaderClasses = () =>
    isDarkMode
      ? "w-full h-full flex justify-between items-center bg-gray-800 cursor-pointer rounded-md p-2 hover:bg-gray-700 transition-colors duration-200 w-full"
      : "w-full h-full flex justify-between items-center  bg-gray-200 cursor-pointer rounded-md border-l-4 border-primary/90 p-2 hover:bg-gray-300 transition-colors";

  const getDropdownHeaderTextClasses = () => (isDarkMode ? "text-gray-100 font-semibold" : "text-gray-700 font-semibold");
  const getDropdownHeaderIconClasses = () => (isDarkMode ? "text-gray-200" : "text-gray-600");
  const getPanelContainerClasses = () => (isDarkMode ? "bg-gray-800/60 border border-gray-600 rounded-lg overflow-hidden" : "border border-gray-200 rounded-lg overflow-hidden w-full h-full");

  const getFieldEditorContainerClasses = () =>
    isDarkMode ? "flex flex-col gap-2 mb-3 p-2 bg-gray-700 text-gray-100 rounded-md border border-gray-600/60" : "flex flex-col gap-2 mb-3 p-2 bg-gray-50 rounded-md";

  const getFieldEditorLabelClasses = () => (isDarkMode ? "text-xs text-gray-300 font-medium" : "text-xs text-gray-600 font-medium");

  const getFieldEditorButtonClasses = () =>
    isDarkMode ? "text-xs cursor-pointer text-gray-300 px-2 py-1 rounded bg-gray-700 hover:bg-gray-600 hover:text-white transition-colors duration-200" : "text-xs cursor-pointer text-gray-600 px-2 py-1 rounded hover:bg-gray-100 transition-colors";

  const getJSONPreviewClasses = () => (isDarkMode ? "bg-gray-900 border border-gray-700 text-gray-100 p-2 rounded-md overflow-auto text-xs font-mono max-h-64" : "bg-gray-100 text-gray-800 p-2 rounded-md overflow-auto text-xs font-mono max-h-64");

  const getEditButtonClasses = () =>
    isDarkMode
      ? "w-32 flex items-center gap-1 mt-2 px-3 py-1 rounded bg-gray-700 text-gray-100 text-md hover:bg-gray-600 transition-colors duration-200"
      : "absolute top-0 right-4 flex w-32 items-center gap-2 justify-start gap-1 mt-2 px-3 py-1 rounded bg-gray-200 text-gray-700 text-md hover:bg-gray-200";

  const getTextareaClasses = () =>
    isDarkMode
      ? "focus:outline-none focus:ring-2 focus:ring-gray-600 w-full p-3 rounded-md bg-gray-800 border border-gray-700 font-mono text-xs text-gray-100 placeholder-gray-400 min-h[180px] max-h-64"
      : "focus:outline-none focus:ring-0 focus:border-gray-300 w-full p-3 rounded-md bg-gray-100 border border-gray-200 font-mono text-xs text-gray-800 min-h-[180px] break-words";

  const getSaveButtonClasses = () =>
    isDarkMode ? "flex items-center gap-1 px-3 py-1 text-md rounded bg-gray-200 text-gray-900 hover:bg-white transition-colors duration-200" : "flex items-center gap-1 px-3 py-1 text-md rounded bg-gray-800 text-white hover:bg-gray-900";

  const getCancelButtonClasses = () =>
    isDarkMode ? "flex items-center gap-1 px-3 py-1 text-md rounded bg-gray-700 text-gray-100 hover:bg-gray-600 transition-colors duration-200" : "flex items-center gap-1 px-3 py-1 text-md rounded bg-gray-200 text-gray-800 hover:bg-gray-300";

  const getErrorTextClasses = () => (isDarkMode ? "text-red-400 text-md mt-1" : "text-red-600 text-md mt-1");

  const updateNestedData = useCallback(
    (path: string[], newValue: any) => {
      if (!onChange) return;
      const updatedValue = JSON.parse(JSON.stringify(value));
      let current = updatedValue;
      for (let i = 0; i < path.length - 1; i++) {
        const key = path[i];
        if (current[key] === undefined || typeof current[key] !== "object") current[key] = {};
        current = current[key];
      }
      current[path[path.length - 1]] = newValue;
      if (!updatedValue.action && value.action) updatedValue.action = value.action;
      if (value.stepData?.action && (!updatedValue.stepData || !updatedValue.stepData.action)) {
        updatedValue.stepData = { ...updatedValue.stepData, action: value.stepData.action };
      }
      if (value.data?.action && (!updatedValue.data || !updatedValue.data.action)) {
        updatedValue.data = { ...updatedValue.data, action: value.data.action };
      }
      onChange(updatedValue);
    },
    [value, onChange]
  );

  const deleteNestedProperty = useCallback(
    (path: string[]) => {
      if (!onChange) return;
      const updatedValue = JSON.parse(JSON.stringify(value));
      let current = updatedValue;
      for (let i = 0; i < path.length - 1; i++) {
        const key = path[i];
        if (current[key] === undefined) return;
        current = current[key];
      }
      delete current[path[path.length - 1]];
      if (!updatedValue.action && value.action) updatedValue.action = value.action;
      if (value.stepData?.action && (!updatedValue.stepData || !updatedValue.stepData.action)) {
        updatedValue.stepData = { ...updatedValue.stepData, action: value.stepData.action };
      }
      if (value.data?.action && (!updatedValue.data || !updatedValue.data.action)) {
        updatedValue.data = { ...updatedValue.data, action: value.data.action };
      }
      onChange(updatedValue);
    },
    [value, onChange]
  );

  const FieldEditor = useMemo(
    () =>
      function FieldEditorInner({
        label,
        fieldValue,
        onUpdate,
        onDelete,
      }: {
        label: string;
        fieldValue: any;
        onUpdate: (newValue: string) => void;
        onDelete: () => void;
      }) {
        const [local, setLocal] = useState<string>(() => String(fieldValue ?? ""));
        const debRef = useRef<number | undefined>(undefined);

        useEffect(() => {
          setLocal(String(fieldValue ?? ""));
        }, [fieldValue]);

        const flush = useCallback(
          (val: string) => {
            onUpdate(val);
          },
          [onUpdate]
        );

        const handleChange = useCallback(
          (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
            const val = e.target.value;
            setLocal(val);
            if (debRef.current) window.clearTimeout(debRef.current);
            debRef.current = window.setTimeout(() => flush(val), 300);
          },
          [flush]
        );

        const handleBlur = useCallback(() => {
          if (debRef.current) window.clearTimeout(debRef.current);
          flush(local);
        }, [local, flush]);

        return (
          <div className={getFieldEditorContainerClasses()}>
            <div className="flex items-center justify-between w-full">
              <span className={getFieldEditorLabelClasses()}>{label}:</span>
              <div className="flex items-center gap-2">
                <CopyToClipboard text={String(fieldValue ?? "")} isDarkMode={isDarkMode} />
                <button onClick={onDelete} className={getFieldEditorButtonClasses()}>
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
            <TextInputWithClearButton id={label} value={local} onChangeHandler={handleChange} onBlur={handleBlur} placeholder={label} label={`Enter value for ${label}`} isDarkMode={isDarkMode} />
          </div>
        );
      },
    [isDarkMode]
  );

  const processedData = useMemo(() => {
    if (!value) return null;
    return {
      hasNavigation: value.action === "navigate" || value.stepData?.action === "navigate",
      hasApi: value.action === "apis" || value.stepData?.action === "apis",
      hasContext: value.context || value.stepData?.context,
      hasContextGeneral: value.action === "context-general" || value?.stepData?.action === "context-general",
      hasSelectors: value?.data?.selectors?.length > 0 || value?.stepData?.data?.selectors?.length > 0,
      hasAttributes: Object.keys(value?.data?.attributes || value?.stepData?.data?.attributes || {}).length > 0,
      hasCoordinates:
        (value?.data?.coordinates && Object.keys(value.data.coordinates).length > 0) ||
        (value?.stepData?.data?.coordinates && Object.keys(value.stepData.data.coordinates).length > 0),
      hasImage: value?.data?.image || value?.stepData?.data?.image,
      hasText: value?.data?.text || value?.text || value?.stepData?.data?.text || value?.stepData?.text,
      hasTimeStamp: value?.data?.timeStamp || value?.stepData?.data?.timeStamp,
      hasPageIndex: value?.pageIndex !== undefined || value?.stepData?.pageIndex !== undefined,
      hasIndexStep: value?.indexStep !== undefined || value?.stepData?.indexStep !== undefined,
      hasTypeToAssert: value?.typeAssert !== undefined || value?.stepData?.typeAssert !== undefined,
      hasValueToAssert: value?.valueToAssert !== undefined || value?.stepData?.valueToAssert !== undefined,
    };
  }, [value]);

  if (!value || !processedData) {
    const noDataClasses = isDarkMode ? "text-gray-300 text-center p-4 bg-gray-800/60 border border-gray-700 rounded-lg" : "text-gray-500 text-center p-4";
    return <div className={noDataClasses}>No data available</div>;
  }

  const containerClasses = isDarkMode ? "rounded-lg shadow-lg bg-gray-800 border border-gray-700 overflow-hidden px-2" : "rounded-lg shadow-lg bg-white overflow-hidden";

  const actualData = value.stepData || value;
  const apis = Array.isArray(actualData?.apisData?.apis) ? actualData.apisData.apis : [];
  const env = (actualData?.apisData?.env ?? {}) as Record<string, unknown>;
  const pretty = (v: unknown) => {
    try {
      return JSON.stringify(typeof v === "string" ? JSON.parse(v) : v, null, 2);
    } catch {
      return typeof v === "string" ? v : JSON.stringify(v, null, 2);
    }
  };

  const baseApisPath = value.stepData ? ["stepData", "apisData"] : ["apisData"];
  const apiPath = (idx: number, ...rest: any[]) => [...baseApisPath, "apis", idx, ...rest];

  const setRequestMethod = (idx: number, newMethod: string) => updateNestedData(apiPath(idx, "request", "method"), newMethod);

  const setRequestUrl = (idx: number, newUrl: string) => {
    updateNestedData(apiPath(idx, "request", "url", "raw"), newUrl);
  };

  const addHeader = (idx: number) => {
    const list = Array.isArray(apis[idx]?.request?.header) ? [...apis[idx].request.header] : [];
    list.push({ type: "text", key: "X-Header", value: "" });
    updateNestedData(apiPath(idx, "request", "header"), list);
  };

  const updateHeaderKey = (idx: number, hIdx: number, key: string) => {
    const list = Array.isArray(apis[idx]?.request?.header) ? [...apis[idx].request.header] : [];
    if (!list[hIdx]) return;
    list[hIdx] = { ...list[hIdx], key };
    updateNestedData(apiPath(idx, "request", "header"), list);
  };

  const updateHeaderValue = (idx: number, hIdx: number, value: string) => {
    const list = Array.isArray(apis[idx]?.request?.header) ? [...apis[idx].request.header] : [];
    if (!list[hIdx]) return;
    list[hIdx] = { ...list[hIdx], value };
    updateNestedData(apiPath(idx, "request", "header"), list);
  };

  const deleteHeader = (idx: number, hIdx: number) => {
    const list = Array.isArray(apis[idx]?.request?.header) ? [...apis[idx].request.header] : [];
    const next = list.filter((_, i) => i !== hIdx);
    updateNestedData(apiPath(idx, "request", "header"), next);
  };

  const setGqlQuery = (idx: number, text: string) => updateNestedData(apiPath(idx, "request", "body", "graphql", "query"), text);

  const setGqlVariables = (idx: number, text: string) => updateNestedData(apiPath(idx, "request", "body", "graphql", "variables"), text);

  const addEnvVar = () => {
    const curr = { ...(actualData?.apisData?.env ?? {}) };
    let newKey = "NEW_KEY";
    let i = 1;
    while (curr[newKey]) {
      newKey = `NEW_KEY_${i++}`;
    }
    curr[newKey] = "";
    updateNestedData([...baseApisPath, "env"], curr);
  };

  const updateEnvKey = (i: number, oldKey: string, newKey: string) => {
    const curr = { ...(actualData?.apisData?.env ?? {}) };
    if (!oldKey || !Object.prototype.hasOwnProperty.call(curr, oldKey)) return;
    if (newKey === oldKey || !newKey) return;
    const value = curr[oldKey];
    delete curr[oldKey];
    curr[newKey] = value;
    updateNestedData([...baseApisPath, "env"], curr);
  };

  const updateEnvValue = (i: number, key: string, val: string) => updateNestedData([...baseApisPath, "env", key], val);

  const deleteEnvVar = (i: number, key: string) => {
    const curr = { ...(actualData?.apisData?.env ?? {}) };
    delete curr[key];
    updateNestedData([...baseApisPath, "env"], curr);
  };

  const getTestEventIndex = (api: any) => (Array.isArray(api?.event) ? api.event.findIndex((e: any) => e?.listen === "test") : -1);

  const setTestScript = (idx: number, code: string) => {
    const api = apis[idx] ?? {};
    const evIdx = getTestEventIndex(api);
    const nextEvents = Array.isArray(api.event) ? [...api.event] : [];
    if (evIdx === -1) {
      nextEvents.push({
        listen: "test",
        script: { type: "text/javascript", packages: {}, exec: code.split("\n") },
      });
    } else {
      nextEvents[evIdx] = {
        ...nextEvents[evIdx],
        script: { ...(nextEvents[evIdx]?.script || {}), exec: code.split("\n") },
      };
    }
    updateNestedData(apiPath(idx, "event"), nextEvents);
  };

  return (
    <div className={containerClasses}>
      <div className={`${getDropdownHeaderClasses()} ${isDarkMode ? "text-gray-100" : "text-gray-700"}`} onClick={() => setOpenPanels((p) => ({ ...p, showOptions: !p.showOptions }))}>
        <span className={getDropdownHeaderTextClasses()}>Show Options</span>
        {openPanels.showOptions ? <FaChevronUp className={getDropdownHeaderIconClasses()} /> : <FaChevronDown className={getDropdownHeaderIconClasses()} />}
      </div>

      {openPanels.showOptions && (
        <div className="p-1 flex flex-col gap-2 mt-2">
          {processedData.hasNavigation && (
            <div className={getPanelContainerClasses()}>
              <div className={getDropdownHeaderClasses()} onClick={() => setOpenPanels((p) => ({ ...p, navigateData: !p.navigateData }))}>
                <span className={getDropdownHeaderTextClasses()}>Navigate Data</span>
                {openPanels.navigateData ? <FaChevronUp className={getDropdownHeaderIconClasses()} /> : <FaChevronDown className={getDropdownHeaderIconClasses()} />}
              </div>
              {openPanels.navigateData && (
                <div className={`p-4 ${isDarkMode ? "text-gray-200" : "text-gray-700"}`}>
                  {Object.entries(actualData.data)
                    .filter(([key]) => key !== "pageSize")
                    .map(([key, val]) => (
                      <FieldEditor
                        key={key}
                        label={key}
                        fieldValue={val}
                        onUpdate={(newValue) => updateNestedData(value.stepData ? ["stepData", "data", key] : ["data", key], newValue)}
                        onDelete={() => deleteNestedProperty(value.stepData ? ["stepData", "data", key] : ["data", key])}
                      />
                    ))}
                  {actualData.data.pageSize &&
                    Object.entries(actualData.data.pageSize).map(([key, val]) => (
                      <FieldEditor
                        key={`pageSize-${key}`}
                        label={`Page Size - ${key}`}
                        fieldValue={val}
                        onUpdate={(newValue) => updateNestedData(value.stepData ? ["stepData", "data", "pageSize", key] : ["data", "pageSize", key], newValue)}
                        onDelete={() => deleteNestedProperty(value.stepData ? ["stepData", "data", "pageSize", key] : ["data", "pageSize", key])}
                      />
                    ))}
                </div>
              )}
            </div>
          )}

          {processedData.hasContext && (
            <div className={getPanelContainerClasses()}>
              <div className={getDropdownHeaderClasses()} onClick={() => setOpenPanels((p) => ({ ...p, context: !p.context }))}>
                <span className={getDropdownHeaderTextClasses()}>Context</span>
                {openPanels.context ? <FaChevronUp className={getDropdownHeaderIconClasses()} /> : <FaChevronDown className={getDropdownHeaderIconClasses()} />}
              </div>
              {openPanels.context && (
                <div className="p-4 space-y-3">
                  {Object.entries(actualData.context.data)
                    .filter(([key]) => key !== "window")
                    .map(([key, val]) => (
                      <FieldEditor
                        key={key}
                        label={key}
                        fieldValue={val}
                        onUpdate={(newValue) => updateNestedData(value.stepData ? ["stepData", "context", "data", key] : ["context", "data", key], newValue)}
                        onDelete={() => deleteNestedProperty(value.stepData ? ["stepData", "context", "data", key] : ["context", "data", key])}
                      />
                    ))}
                  {actualData.context.data.window &&
                    Object.entries(actualData.context.data.window).map(([key, val]) => (
                      <FieldEditor
                        key={`window-${key}`}
                        label={`Window - ${key}`}
                        fieldValue={val}
                        onUpdate={(newValue) => updateNestedData(value.stepData ? ["stepData", "context", "data", "window", key] : ["context", "data", "window", key], newValue)}
                        onDelete={() => deleteNestedProperty(value.stepData ? ["stepData", "context", "data", "window", key] : ["context", "data", "window", key])}
                      />
                    ))}
                </div>
              )}
            </div>
          )}

          {processedData.hasSelectors && (
            <div className={getPanelContainerClasses()}>
              <div className={getDropdownHeaderClasses()} onClick={() => setOpenPanels((p) => ({ ...p, selectors: !p.selectors }))}>
                <span className={getDropdownHeaderTextClasses()}>Selectors</span>
                {openPanels.selectors ? <FaChevronUp className={getDropdownHeaderIconClasses()} /> : <FaChevronDown className={getDropdownHeaderIconClasses()} />}
              </div>
              {openPanels.selectors && (
                <div className="p-4 space-y-3">
                  {actualData.data.selectors.map((selector: any, idx: number) => (
                    <FieldEditor
                      key={idx}
                      label={selector.type}
                      fieldValue={selector.locator}
                      onUpdate={(newValue) => {
                        const path = value.stepData ? ["stepData", "data", "selectors"] : ["data", "selectors"];
                        const updatedSelectors = [...actualData.data.selectors];
                        updatedSelectors[idx] = { ...updatedSelectors[idx], locator: newValue };
                        updateNestedData(path, updatedSelectors);
                      }}
                      onDelete={() => {
                        const path = value.stepData ? ["stepData", "data", "selectors"] : ["data", "selectors"];
                        const updatedSelectors = actualData.data.selectors.filter((_: any, index: number) => index !== idx);
                        updateNestedData(path, updatedSelectors);
                      }}
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          {processedData.hasAttributes && (
            <div className={getPanelContainerClasses()}>
              <div className={getDropdownHeaderClasses()} onClick={() => setOpenPanels((p) => ({ ...p, attributes: !p.attributes }))}>
                <span className={getDropdownHeaderTextClasses()}>Attributes</span>
                {openPanels.attributes ? <FaChevronUp className={getDropdownHeaderIconClasses()} /> : <FaChevronDown className={getDropdownHeaderIconClasses()} />}
              </div>
              {openPanels.attributes && (
                <div className="p-4 space-y-3">
                  {Object.entries(actualData.data.attributes).map(([key, val]) => (
                    <FieldEditor key={key} label={key} fieldValue={val} onUpdate={(newValue) => updateNestedData(value.stepData ? ["stepData", "data", "attributes", key] : ["data", "attributes", key], newValue)} onDelete={() => deleteNestedProperty(value.stepData ? ["stepData", "data", "attributes", key] : ["data", "attributes", key])} />
                  ))}
                </div>
              )}
            </div>
          )}

          {processedData.hasCoordinates && (
            <div className={getPanelContainerClasses()}>
              <div className={getDropdownHeaderClasses()} onClick={() => setOpenPanels((p) => ({ ...p, coordinates: !p.coordinates }))}>
                <span className={getDropdownHeaderTextClasses()}>Coordinates</span>
                {openPanels.coordinates ? <FaChevronUp className={getDropdownHeaderIconClasses()} /> : <FaChevronDown className={getDropdownHeaderIconClasses()} />}
              </div>
              {openPanels.coordinates && (
                <div className="p-4 space-y-3">
                  {Object.entries(actualData.data.coordinates).map(([key, val]) => (
                    <FieldEditor key={key} label={key} fieldValue={val} onUpdate={(newValue) => updateNestedData(value.stepData ? ["stepData", "data", "coordinates", key] : ["data", "coordinates", key], newValue)} onDelete={() => deleteNestedProperty(value.stepData ? ["stepData", "data", "coordinates", key] : ["data", "coordinates", key])} />
                  ))}
                </div>
              )}
            </div>
          )}

          {processedData.hasImage && (
            <div className={getPanelContainerClasses()}>
              <div className={getDropdownHeaderClasses()} onClick={() => setOpenPanels((p) => ({ ...p, image: !p.image }))}>
                <span className={getDropdownHeaderTextClasses()}>Image</span>
                {openPanels.image ? <FaChevronUp className={getDropdownHeaderIconClasses()} /> : <FaChevronDown className={getDropdownHeaderIconClasses()} />}
              </div>
              {openPanels.image && <DisplayImageWithFetch src={actualData.data.image} alt="Interaction Image" isDarkMode={isDarkMode} />}
            </div>
          )}

          {processedData.hasTypeToAssert && (
            <div className={`${getPanelContainerClasses()} p-4`}>
              <FieldEditor label="Type to Assert" fieldValue={actualData?.typeAssert} onUpdate={(newValue) => updateNestedData(value.stepData ? ["stepData", "typeAssert"] : ["typeAssert"], newValue)} onDelete={() => deleteNestedProperty(value.stepData ? ["stepData", "typeAssert"] : ["typeAssert"])} />
            </div>
          )}

          {processedData.hasValueToAssert && (
            <div className={`${getPanelContainerClasses()} p-4`}>
              <FieldEditor label="Value to Assert" fieldValue={actualData?.valueToAssert} onUpdate={(newValue) => updateNestedData(value.stepData ? ["stepData", "valueToAssert"] : ["valueToAssert"], newValue)} onDelete={() => deleteNestedProperty(value.stepData ? ["stepData", "valueToAssert"] : ["valueToAssert"])} />
            </div>
          )}

          {processedData.hasText && (
            <div className={`${getPanelContainerClasses()} p-4`}>
              <FieldEditor
                label="Text"
                fieldValue={actualData.data?.text || actualData.text}
                onUpdate={(newValue) => {
                  if (actualData.data?.text !== undefined) {
                    updateNestedData(value.stepData ? ["stepData", "data", "text"] : ["data", "text"], newValue);
                  } else {
                    updateNestedData(value.stepData ? ["stepData", "text"] : ["text"], newValue);
                  }
                }}
                onDelete={() => {
                  if (actualData.data?.text !== undefined) {
                    deleteNestedProperty(value.stepData ? ["stepData", "data", "text"] : ["data", "text"]);
                  } else {
                    deleteNestedProperty(value.stepData ? ["stepData", "text"] : ["text"]);
                  }
                }}
              />
            </div>
          )}

          {processedData.hasTimeStamp && (
            <div className={`${getPanelContainerClasses()} p-4`}>
              <FieldEditor label="Timestamp" fieldValue={actualData?.data?.timeStamp} onUpdate={(newValue) => updateNestedData(value.stepData ? ["stepData", "data", "timeStamp"] : ["data", "timeStamp"], newValue)} onDelete={() => deleteNestedProperty(value.stepData ? ["stepData", "data", "timeStamp"] : ["data", "timeStamp"])} />
            </div>
          )}

          {processedData.hasPageIndex && (
            <div className={`${getPanelContainerClasses()} p-4`}>
              <FieldEditor label="Page Index" fieldValue={actualData?.pageIndex} onUpdate={(newValue) => updateNestedData(value.stepData ? ["stepData", "pageIndex"] : ["pageIndex"], newValue)} onDelete={() => deleteNestedProperty(value.stepData ? ["stepData", "pageIndex"] : ["pageIndex"])} />
            </div>
          )}

          {processedData.hasApi && (
            <div className={`${getPanelContainerClasses()} p-4`}>
              {apis.length === 0 && <span className={isDarkMode ? "text-gray-300" : "text-gray-600"}>No APIs found</span>}

              <div className="flex flex-col gap-3">
                {apis.map((api: any, i: number) => {
                  const isCollapsed = !!collapsedApis[i];
                  const vm = viewModeApiByIdx[i] ?? "request";

                  const req = api?.request ?? {};
                  const method: string = req?.method ?? "GET";
                  const urlRaw: string = req?.url?.raw ?? "";
                  const headers: Array<{ key: string; value: string }> = Array.isArray(req?.header) ? req.header : [];
                  const mode = req?.body?.mode;
                  const gql = req?.body?.graphql;

                  return (
                    <div key={api?.name ?? i} className={`rounded-lg overflow-hidden ${isDarkMode ? "border border-gray-700" : "border border-gray-200"}`}>
                      <div className={`flex items-center justify-between px-3 py-2 cursor-pointer ${isDarkMode ? "bg-gray-800 text-gray-100" : "bg-gray-100 text-gray-800"}`} onClick={() => setCollapsedApis((p) => ({ ...p, [i]: !p[i] }))}>
                        <div className="flex items-center gap-2">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-bold ${httpMethodsStyle(method)}`}>{method}</span>
                          <span className="font-semibold">{api?.name ?? `API ${i + 1}`}</span>
                        </div>
                        <div className="text-xs opacity-70">{isCollapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}</div>
                      </div>

                      {!isCollapsed && (
                        <div className="p-3 space-y-3">
                          <div className="flex items-center gap-2">
                            {(["request", "env", "script"] as const).map((tab) => (
                              <ButtonTab key={`${i}-${tab}`} value={tab} label={tab === "request" ? "Request" : tab === "env" ? "Environments" : "Script"} isActive={vm === tab} onClick={() => setViewModeApiFor(i, tab)} isDarkMode={isDarkMode} />
                            ))}
                          </div>

                          {vm === "request" && (
                            <div className="space-y-4">
                              <div className={`rounded-md p-3 ${isDarkMode ? "bg-gray-800" : "bg-gray-50"}`}>
                                <div className="flex flex-col md:flex-row gap-2 items-start md:items-center">
                                  <div className={`method-chip ${String(method).toUpperCase()}`}>
                                    <SearchField value={method} onChange={(val) => setRequestMethod(i, (val || "GET").toUpperCase())} placeholder="GET" label="HTTP Method" darkMode={isDarkMode} className="w-28" options={METHOD_OPTIONS} showSearch={false} widthComponent="w-32" />
                                  </div>

                                  <TextInputWithClearButton id={`url-${i}`} value={urlRaw} onChangeHandler={(e) => setRequestUrl(i, e.target.value)} placeholder="https://api.example.com/endpoint" label="Request URL" isDarkMode={isDarkMode} />
                                </div>
                              </div>

                              <div>
                                <div className="flex items-center justify-between mb-2">
                                  <div className="text-sm font-semibold">Headers</div>
                                  <button type="button" onClick={() => addHeader(i)} className={`text-xs border px-2 py-1 rounded cursor-pointer hover:shadow flex gap-2 items-center ${isDarkMode ? "border-gray-600 text-gray-200" : "border-gray-300 text-gray-700"}`}>
                                    <PlusIcon className="w-4 h-4" /> Add Header
                                  </button>
                                </div>
                                <div className={`rounded-md p-3 flex flex-col gap-3 ${isDarkMode ? "bg-gray-900 border border-gray-700" : "bg-white border border-gray-200"}`}>
                                  {headers.length === 0 && <div className="text-xs opacity-70">No headers.</div>}
                                  {headers.map((h, idx) => (
                                    <div key={`${h.key}-${idx}`} className="grid md:grid-cols-2 gap-2 items-start">
                                      <TextInputWithClearButton id={`hk-${i}-${idx}`} value={String(h.key ?? "")} onChangeHandler={(e) => updateHeaderKey(i, idx, e.target.value)} placeholder="Header key" label="Key" isDarkMode={isDarkMode} />
                                      <div className="flex gap-2 items-center">
                                        <div className="flex w-full">
                                          <TextInputWithClearButton id={`hv-${i}-${idx}`} value={String(h.value ?? "")} onChangeHandler={(e) => updateHeaderValue(i, idx, e.target.value)} placeholder="Header value" label="Value" isDarkMode={isDarkMode} />
                                        </div>
                                        <button type="button" onClick={() => deleteHeader(i, idx)} className={`text-xs px-2 py-1 rounded cursor-pointer ${isDarkMode ? "hover:bg-gray-800" : "hover:bg-gray-100"}`}>
                                          <Trash2Icon className="w-4 h-4" />
                                        </button>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>

                              {mode === "graphql" && (
                                <div className="grid md:grid-cols-2 gap-3">
                                  <div>
                                    <div className="text-sm font-semibold mb-1">GraphQL Query</div>
                                    <textarea
                                      rows={25}
                                      className={`w-full h-full resize-y p-4 font-mono text-xs rounded-md border border-transparent focus:outline-none focus:ring-0 ${isDarkMode ? "bg-gray-900 text-gray-100" : "bg-gray-200 text-gray-800"}`}
                                      value={String(gql?.query ?? "")}
                                      onChange={(e) => setGqlQuery(i, e.target.value)}
                                      spellCheck={false}
                                      style={{ whiteSpace: "pre", wordWrap: "break-word", lineHeight: "1.4", fontFamily: "'Fira Code','Source Code Pro',monospace" }}
                                    />
                                  </div>
                                  <div>
                                    <div className="text-sm font-semibold mb-1">Variables (JSON or string)</div>
                                    <textarea
                                      rows={25}
                                      className={`w-full h-full resize-y p-4 font-mono text-xs rounded-md border border-transparent focus:outline-none focus:ring-0 ${isDarkMode ? "bg-gray-900 text-gray-100" : "bg-gray-200 text-gray-800"}`}
                                      value={pretty(gql?.variables ?? "{}")}
                                      onChange={(e) => setGqlVariables(i, e.target.value)}
                                      spellCheck={false}
                                      style={{ whiteSpace: "pre", wordWrap: "break-word", lineHeight: "1.4", fontFamily: "'Fira Code','Source Code Pro',monospace" }}
                                    />
                                  </div>
                                </div>
                              )}
                            </div>
                          )}

                          {vm === "env" && (() => {
                            const entries = Object.entries(env ?? {});
                            return (
                              <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                  <div className="text-sm font-semibold">Environment</div>
                                  <button type="button" onClick={() => addEnvVar()} className={`text-xs border px-2 py-1 rounded cursor-pointer hover:shadow flex gap-2 items-center ${isDarkMode ? "border-gray-600 text-gray-200" : "border-gray-300 text-gray-700"}`}>
                                    <PlusIcon className="w-4 h-4" /> Add Variable
                                  </button>
                                </div>

                                {entries.length === 0 ? (
                                  <div className={`${isDarkMode ? "bg-gray-800" : "bg-gray-100"} rounded-md p-3 text-xs`}>No environment variables.</div>
                                ) : (
                                  <div className={`rounded-md p-3 flex flex-col gap-3 ${isDarkMode ? "bg-gray-900 border border-gray-700" : "bg-white border border-gray-200"}`}>
                                    {entries.map(([key, val]) => (
                                      <div key={`${i}-${key}`} className="grid md:grid-cols-2 gap-2 items-start">
                                        <TextInputWithClearButton id={`env-key-${i}-${key}`} value={key} onChangeHandler={(e) => updateEnvKey(i, key, e.target.value)} placeholder="KEY" label="Key" isDarkMode={isDarkMode} />
                                        <div className="flex items-center gap-2">
                                          <div className="flex w-full">
                                            <TextInputWithClearButton id={`env-val-${i}-${key}`} value={String(val ?? "")} onChangeHandler={(e) => updateEnvValue(i, key, e.target.value)} placeholder="value" label="Value" isDarkMode={isDarkMode} />
                                          </div>
                                          <button type="button" onClick={() => deleteEnvVar(i, key)} className={`text-xs px-2 py-1 rounded cursor-pointer ${isDarkMode ? "hover:bg-gray-800" : "hover:bg-gray-100"}`}>
                                            <Trash2Icon className="w-4 h-4" />
                                          </button>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            );
                          })()}

                          {vm === "script" && (() => {
                            const listenTest = Array.isArray(api.event) ? api.event.find((e: any) => e.listen === "test") : undefined;
                            const scriptLines: string[] = listenTest?.script?.exec ?? [];
                            const scriptText = scriptLines.join("\n");
                            return (
                              <div className="space-y-2">
                                <div className="text-sm font-semibold">Test Script</div>
                                <textarea
                                  rows={8}
                                  className={`w-full h-full resize-none p-4 font-mono text-xs rounded-md border border-transparent focus:outline-none focus:ring-0 ${isDarkMode ? "bg-gray-900 text-gray-100" : "bg-gray-200 text-gray-800"}`}
                                  value={scriptText}
                                  onChange={(e) => setTestScript(i, e.target.value)}
                                  spellCheck={false}
                                  style={{ whiteSpace: "pre", wordWrap: "break-word", lineHeight: "1.4", fontFamily: "'Fira Code','Source Code Pro',monospace" }}
                                />
                              </div>
                            );
                          })()}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <div className={getPanelContainerClasses()}>
            <div className={getDropdownHeaderClasses()} onClick={() => setOpenPanels((p) => ({ ...p, jsonPreview: !p.jsonPreview }))}>
              <span className={getDropdownHeaderTextClasses()}>JSON Preview</span>
              {openPanels.jsonPreview ? <FaChevronUp className={getDropdownHeaderIconClasses()} /> : <FaChevronDown className={getDropdownHeaderIconClasses()} />}
            </div>
            {openPanels.jsonPreview && (
              <div className="pt-2 w-full h-full flex flex-col items-start break-words min-h-0">
                {!editingJson ? (
                  <div key="preview" className={`w-full flex flex-col min-h-0 gap-2 relative ${isDarkMode ? "" : "bg-gray-50"}`}>
                    <SyntaxHighlighter language="json" style={isDarkMode ? atomOneDark : atomOneLight} className={`${getJSONPreviewClasses()} max-h-[50vh] overflow-auto w-full rounded-md`} customStyle={{ padding: "1rem", fontSize: "12px", lineHeight: "1.4", backgroundColor: isDarkMode ? "transparent" : "inherit" }}>
                      {jsonValue}
                    </SyntaxHighlighter>
                    <button className={getEditButtonClasses()} onClick={() => setEditingJson(true)}>
                      <FaEdit className="w-4 h-4" /> Edit JSON
                    </button>
                  </div>
                ) : (
                  <div key={"editor"} className="w-full h-full flex flex-col break-words overflow-y-auto">
                    <textarea
                      rows={25}
                      className={`w-full h-full resize-none p-4 font-mono text-xs rounded-md border border-transparent focus:outline-none focus:ring-0 ${isDarkMode ? "bg-gray-800 text-gray-100" : "bg-gray-200 text-gray-800"}`}
                      value={jsonValue}
                      onChange={(e) => setJsonValue(e.target.value)}
                      autoFocus
                      spellCheck={false}
                      style={{
                        whiteSpace: "pre",
                        wordWrap: "break-word",
                        lineHeight: "1.4",
                        fontFamily: "'Fira Code', 'Source Code Pro', monospace",
                        caretColor: isDarkMode ? "#9ca3af" : "#111827",
                      }}
                    />

                    {jsonError && <div className={getErrorTextClasses()}>{jsonError}</div>}
                    <div className="flex gap-2 mt-2">
                      <button className={getSaveButtonClasses()} onClick={handleSave}>
                        <Save className="w-4 h-4" /> Save
                      </button>
                      <button
                        className={getCancelButtonClasses()}
                        onClick={() => {
                          setJsonValue(JSON.stringify(value, null, 2));
                          setEditingJson(false);
                          setJsonError(null);
                        }}
                      >
                        <FaXmark className="w-4 h-4" /> Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      <style jsx global>{`
        .method-chip > div > div:first-child {
          background: transparent !important;
          border-color: transparent !important;
        }
        .method-chip.GET > div > div:first-child {
          background: rgba(16, 185, 129, 0.14) !important;
          border: 1px solid rgba(16, 185, 129, 0.32) !important;
          color: #065f46 !important;
        }
        #option-GET:hover {
          background: rgba(16, 185, 129, 0.2);
        }
        #option-GET {
          background: rgba(16, 185, 129, 0.1);
          border: 1px solid rgba(16, 185, 129, 0.25);
        }
        .method-chip.POST > div > div:first-child {
          background: rgba(37, 99, 235, 0.14) !important;
          border: 1px solid rgba(37, 99, 235, 0.32) !important;
          color: #1e3a8a !important;
        }
        #option-POST {
          background: rgba(37, 99, 235, 0.1);
          border: 1px solid rgba(37, 99, 235, 0.25);
        }
        .method-chip.PUT > div > div:first-child {
          background: rgba(245, 158, 11, 0.16) !important;
          border: 1px solid rgba(245, 158, 11, 0.34) !important;
          color: #92400e !important;
        }
        .method-chip.PATCH > div > div:first-child {
          background: rgba(168, 85, 247, 0.14) !important;
          border: 1px solid rgba(168, 85, 247, 0.32) !important;
          color: #5b21b6 !important;
        }
        .method-chip.DELETE > div > div:first-child {
          background: rgba(244, 63, 94, 0.14) !important;
          border: 1px solid rgba(244, 63, 94, 0.32) !important;
          color: #9f1239 !important;
        }
        .method-chip.HEAD > div > div:first-child {
          background: rgba(8, 145, 178, 0.14) !important;
          border: 1px solid rgba(8, 145, 178, 0.32) !important;
          color: #155e75 !important;
        }
        .method-chip.OPTIONS > div > div:first-child {
          background: rgba(71, 85, 105, 0.16) !important;
          border: 1px solid rgba(71, 85, 105, 0.34) !important;
          color: #0f172a !important;
        }
        #option-PUT {
          background: rgba(245, 158, 11, 0.1);
          border: 1px solid rgba(245, 158, 11, 0.25);
        }
        #option-PUT:hover {
          background: rgba(245, 158, 11, 0.2);
        }
        #option-PATCH {
          background: rgba(168, 85, 247, 0.1);
          border: 1px solid rgba(168, 85, 247, 0.25);
        }
        #option-PATCH:hover {
          background: rgba(168, 85, 247, 0.2);
        }
        #option-DELETE {
          background: rgba(244, 63, 94, 0.1);
          border: 1px solid rgba(244, 63, 94, 0.25);
        }
        #option-DELETE:hover {
          background: rgba(244, 63, 94, 0.2);
        }
        #option-HEAD {
          background: rgba(8, 145, 178, 0.1);
          border: 1px solid rgba(8, 145, 178, 0.25);
        }
        #option-HEAD:hover {
          background: rgba(8, 145, 178, 0.2);
        }
        #option-OPTIONS {
          background: rgba(71, 85, 105, 0.1);
          border: 1px solid rgba(71, 85, 105, 0.25);
        }
        #option-OPTIONS:hover {
          background: rgba(71, 85, 105, 0.2);
        }
      `}</style>
    </div>
  );
});
JSONBox.displayName = "JSONBox";

const ReusableStepsBlock = ({ data, isDarkMode = true, onUpdate, onDelete, test }: { data: InteractionItemData; isDarkMode?: boolean; onUpdate?: (updatedData: InteractionItemData) => void; onDelete?: () => void; test?: any }) => {
  const [openPanels, setOpenPanels] = useState<PanelState>({});

  const getReusableContainerClasses = () =>
    isDarkMode
      ? "relative max-h[480px] max-h-[480px] overflow-y-auto flex flex-col gap-3 py-4 px-3 text-gray-100 rounded-lg border-2 border-dashed border-amber-400 shadow-lg bg-gray-800"
      : "relative max-h-[480px] overflow-y-auto flex flex-col gap-3 py-4 px-3 text-gray-700 rounded-lg border-2 border-dashed border-amber-400 bg-gradient-to-r from-amber-50 to-orange-50 shadow-lg";

  const getReusableHeaderClasses = () =>
    isDarkMode ? "absolute top-0 left-0 bg-gray-700 text-white px-4 py-2 text-sm font-bold rounded-tl-lg rounded-br-full shadow-lg" : "absolute top-0 left-0 bg-gray-800 text-white px-4 py-2 text-sm font-bold rounded-tl-lg rounded-br-full shadow-lg";

  const updateReusableStepsData = (newStepsData: any[]) => {
    if (onUpdate) {
      const updatedData = {
        ...data,
        stepsData: newStepsData.map((step, index) => ({ ...step, indexStep: step.indexStep ?? index + 1 })),
      };
      onUpdate(updatedData);
    }
  };

  const getDropdownHeaderClasses = () =>
    isDarkMode
      ? "flex justify-between items-center mt-10 bg-gray-900 cursor-pointer rounded-md border border-gray-700 p-2 hover:bg-gray-800 transition-colors"
      : "flex justify-between items-center mt-10 bg-gray-100 border-l-4 border-primary/90 cursor-pointer rounded-md border border-gray-200 p-2 hover:bg-gray-50 transition-colors";
  const getDropdownHeaderTextClasses = () => (isDarkMode ? "text-gray-100 font-semibold" : "text-gray-700 font-semibold");
  const getDropdownHeaderIconClasses = () => (isDarkMode ? "text-gray-200" : "text-gray-600");

  return (
    <div className={getReusableContainerClasses()}>
      <div className={getReusableHeaderClasses()}>🔄 Reusable: {data.name || "Unnamed Step"}</div>

      <div className={`${getDropdownHeaderClasses()}`} onClick={() => setOpenPanels((p) => ({ ...p, showOptions: !p.showOptions }))}>
        <span className={getDropdownHeaderTextClasses()}>Show Steps ({data.stepsData?.length || 0})</span>
        {openPanels.showOptions ? <FaChevronUp className={getDropdownHeaderIconClasses()} /> : <FaChevronDown className={getDropdownHeaderIconClasses()} />}
      </div>

      {openPanels.showOptions && (
        <div className="space-y-3">
          {data.stepsData?.map((step: any, idx: number) => {
            const stableKeyRef = (step as any).__k || crypto.randomUUID();
            (step as any).__k = stableKeyRef;
            return <InteractionItem key={stableKeyRef} data={step} index={idx} isDarkMode={isDarkMode} onDelete={undefined} test={test} />;
          })}
        </div>
      )}

      <div className={`absolute top-2 right-2 flex gap-2 items-center ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>
        {onDelete && <DeleteButton onClick={onDelete} isDarkMode={isDarkMode} />}
        <CopyToClipboard text={JSON.stringify(data)} isDarkMode={isDarkMode} />
      </div>
    </div>
  );
};

const InteractionItem: React.FC<InteractionItemProps> = React.memo(({ data, index, onDelete, onUpdate, isDarkMode = false, showDelete = true }) => {
  const isReusableStep = data.type?.startsWith("STEPS") && Array.isArray(data.stepsData);
  if (isReusableStep) {
    return <ReusableStepsBlock data={data} isDarkMode={isDarkMode} onDelete={() => onDelete?.(index)} />;
  }

  const actualStepData = data.stepData || data;

  const getMainContainerClasses = (action: string) =>
    isDarkMode
      ? "relative flex flex-col gap-2 py-2 px-1 text-gray-100 rounded-md border-l-4 border-gray-600 bg-gray-800 shadow-lg transition-all duration-300"
      : `relative flex flex-col gap-2 py-2 px-1 text-gray-800 rounded-md border-l-4 border-primary/90 border bg-white shadow-lg transition-all duration-300`;

  const getStepNumberClasses = () =>
    isDarkMode ? "absolute top-0 left-0 bg-gray-700 text-white px-3 py-1 text-sm font-semibold rounded-tl-xl rounded-br-full shadow-md" : "absolute top-0 left-0 bg-gray-800 text-white px-3 py-1 text-sm font-semibold rounded-tl-xl rounded-br-full shadow-md font-bold";

  const getPageIndexClasses = () => (isDarkMode ? "text-xs text-gray-300" : "text-xs text-gray-600");

  return (
    <div className="flex flex-col gap-4">
      <div className={getMainContainerClasses(actualStepData.action)}>
        <div className="flex justify-center items-center w-full">
          <div className={`flex flex-col ${isDarkMode ? "text-gray-200" : "text-gray-700"} gap-1`}>
            <p className="font-semibold text-center">{actualStepData.action}</p>
            <p className="font-normal text-center">
              {actualStepData?.data?.text || actualStepData?.data?.attributes?.name || actualStepData?.data?.attributes?.placeholder || actualStepData?.data?.attributes?.["aria-label"] || data.name}
            </p>
          </div>
          <div className={getStepNumberClasses()}>{actualStepData.indexStep || data.indexStep}</div>

          <div className={`absolute top-0 right-0 flex gap-2 items-center ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>
            {onDelete && showDelete && onDelete != undefined && <DeleteButton onClick={() => onDelete(index)} isDarkMode={isDarkMode} />}
            <CopyToClipboard text={JSON.stringify(data)} isDarkMode={isDarkMode} />
          </div>
        </div>

        <JSONBox
          value={data}
          onChange={(edited) => {
            const updatedData = {
              ...edited,
              id: data.id ?? edited.id,
              indexStep: edited.indexStep ?? data.indexStep,
            };
            onUpdate?.(index, updatedData);
          }}
          isDarkMode={isDarkMode}
        />
        {(actualStepData?.hasOwnProperty("pageIndex") || data?.hasOwnProperty("pageIndex")) && <span className={getPageIndexClasses()}>Page index: {data?.pageIndex}</span>}
      </div>
    </div>
  );
});
InteractionItem.displayName = "InteractionItem";

export default InteractionItem;
