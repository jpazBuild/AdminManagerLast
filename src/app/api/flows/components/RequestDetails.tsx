"use client";

import React, { useEffect, useMemo, useState } from "react";
import TextInputWithClearButton from "@/app/components/InputClear";
import { FlowNode } from "@/types/types";
import { ArrowLeft, PlusIcon, Trash2Icon } from "lucide-react";
import { httpMethodsStyle } from "../../utils/colorMethods";
import { TbBrandGraphql } from "react-icons/tb";
import { VscJson } from "react-icons/vsc";
import ButtonTab from "@/app/components/ButtonTab";

type HeaderKV = { key: string; value: string };

const CodeBox: React.FC<{ value: string; lang?: "json" | "graphql" | "js"; darkMode?: boolean }> = ({
  value,
  darkMode = false,
}) => (
  <pre
    className={`w-full text-[13px] leading-5 font-mono rounded-lg p-4 overflow-auto ${darkMode
        ? "bg-gray-900 text-gray-100 border border-gray-800"
        : "bg-[#F3F6F9] text-gray-800"
      }`}
  >
    {value}
  </pre>
);

const DEFAULT_VARS_OBJ = {};
const DEFAULT_VARS_PRETTY = JSON.stringify(DEFAULT_VARS_OBJ, null, 2);

const normalizeVarsPretty = (raw: unknown): string => {
  if (raw == null) return DEFAULT_VARS_PRETTY;
  if (typeof raw === "string") {
    const s = raw.trim();
    try {
      const parsed = JSON.parse(s);
      if (typeof parsed === "string") {
        const inner = JSON.parse(parsed);
        return JSON.stringify(inner, null, 2);
      }
      if (typeof parsed === "object") return JSON.stringify(parsed, null, 2);
    } catch {
      try {
        if (s.startsWith("{")) return JSON.stringify(JSON.parse(s), null, 2);
      } catch { }
    }
    return DEFAULT_VARS_PRETTY;
  }
  try {
    return JSON.stringify(raw, null, 2);
  } catch {
    return DEFAULT_VARS_PRETTY;
  }
};

const RequestDetails: React.FC<{
  node: FlowNode;
  onBack: () => void;
  onUpdateNode: (patch: Partial<FlowNode>) => void;
  darkMode?: boolean;
}> = ({ node, onBack, onUpdateNode, darkMode = false }) => {
  const isGraphQL = (node.rawNode?.request?.body?.mode ?? "").toLowerCase() === "graphql";
  const method = (node.method || node.rawNode?.request?.method || "GET").toUpperCase();

  const initialHeaders: HeaderKV[] = useMemo(() => {
    const list = (node.rawNode?.request?.header ?? []) as Array<{ key?: string; value?: string }>;
    return list.length ? list.map((h) => ({ key: h?.key ?? "", value: h?.value ?? "" })) : [{ key: "", value: "" }];
  }, [node]);

  const [activeTab, setActiveTab] = useState<"request" | "test">("request");
  const [activeTabRequest, setActiveTabRequest] = useState<"headers" | "body" | "graphql" | "variables">(
    isGraphQL ? "graphql" : "body"
  );
  const [requestUrl, setRequestUrl] = useState<string>(node.url || "");
  const [requestHeaders, setRequestHeaders] = useState<HeaderKV[]>(initialHeaders);

  const initialVarsPretty = useMemo(
    () => normalizeVarsPretty(node.rawNode?.request?.body?.graphql?.variables),
    [node]
  );
  const [variablesPretty, setVariablesPretty] = useState<string>(initialVarsPretty);
  const [variablesErr, setVariablesErr] = useState<string | null>(null);

  const bodyRawString = useMemo(() => {
    const body = node.rawNode?.request?.body;
    if (!body) return "// Request body";
    if (body.mode === "graphql") return body.graphql?.query ?? "// Request body";
    if (body.mode === "raw") return typeof body.raw === "string" ? body.raw : JSON.stringify(body.raw ?? {}, null, 2);
    return "// Request body";
  }, [node]);

  const headersText = useMemo(
    () =>
      requestHeaders
        .filter((h) => h.key.trim() || h.value.trim())
        .map((h) => `${h.key}: ${h.value}`)
        .join("\n") || "// Headers",
    [requestHeaders]
  );

  const patchRawNode = (mutator: (draft: any) => void) => {
    const next = JSON.parse(JSON.stringify(node.rawNode ?? {}));
    mutator(next);
    onUpdateNode({ rawNode: next });
  };

  useEffect(() => {
    onUpdateNode({ url: requestUrl });
    patchRawNode((d) => {
      d.request = d.request || {};
      d.request.url = d.request.url || {};
      d.request.url.raw = requestUrl;
    });
  }, [requestUrl]);

  useEffect(() => {
    patchRawNode((d) => {
      d.request = d.request || {};
      d.request.header = requestHeaders
        .filter((h) => h.key.trim() || h.value.trim())
        .map((h) => ({ key: h.key, value: h.value, type: "text" }));
    });
  }, [requestHeaders]);

  useEffect(() => {
    if (!isGraphQL) return;
    try {
      const parsed = JSON.parse(variablesPretty || "{}");
      setVariablesErr(null);
      patchRawNode((d) => {
        d.request = d.request || {};
        d.request.body = d.request.body || {};
        d.request.body.mode = "graphql";
        d.request.body.graphql = d.request.body.graphql || {};
        d.request.body.graphql.variables = JSON.stringify(parsed, null, 2);
      });
    } catch {
      setVariablesErr("Invalid JSON");
    }
  }, [variablesPretty, isGraphQL]);

  return (
    <div
      className={`flex justify-center self-center h-full w-full p-2 overflow-y-auto ${darkMode ? "bg-gray-900" : ""
        }`}
    >
      <div className="w-2/3 py-2 h-full">
        <div className="flex items-center gap-2 mb-4">
          <button
            onClick={onBack}
            className={`rounded p-1 ${darkMode ? "hover:bg-gray-800" : "hover:bg-gray-100"}`}
          >
            <ArrowLeft className={`w-6 h-6 ${darkMode ? "text-gray-200" : "text-primary/80"}`} />
          </button>
        </div>

        <div className={`flex items-center text-lg font-semibold mb-1 ${darkMode ? "text-gray-100" : "text-primary/80"}`}>
          {node.name}
          <span className={`ml-2 text-xs px-2 py-1 rounded ${httpMethodsStyle(method)}`}>{method}</span>
        </div>
        <p className={`${darkMode ? "text-gray-400" : "text-gray-500"} mb-4`}>Set the information for this request below</p>

        <div className={`flex justify-center gap-2 mb-4 ${darkMode ? "text-gray-100" : "text-primary/85"}`}>
          <ButtonTab
            isDarkMode={darkMode}
            label="Request"
            value="request"
            isActive={activeTab === "request"}
            onClick={() => setActiveTab("request")}
          />
          <ButtonTab
            isDarkMode={darkMode}
            label="Test"
            value="test"
            isActive={activeTab === "test"}
            onClick={() => setActiveTab("test")}
          />
        </div>

        {activeTab === "request" && (
          <div>
            <TextInputWithClearButton
              id="request-url"
              type="text"
              inputMode="text"
              value={requestUrl}
              onChangeHandler={(e) => setRequestUrl(e.target.value)}
              placeholder="Enter request URL"
              label="Enter request URL"
              isDarkMode={darkMode}
            />

            {(node.rawNode?.request?.body?.mode ?? "").toLowerCase() === "graphql" ? (
              <div className="flex items-center gap-2 mt-4">
                <ButtonTab
                  isDarkMode={darkMode}
                  label="Headers"
                  value="headers"
                  isActive={activeTabRequest === "headers"}
                  onClick={() => setActiveTabRequest("headers")}
                />
                <ButtonTab
                  label="Query/Mutation"
                  value="graphql"
                  isActive={activeTabRequest === "graphql"}
                  onClick={() => setActiveTabRequest("graphql")}
                  Icon={<TbBrandGraphql className={`${darkMode ? "text-gray-100" : "text-primary/85"} w-5 h-5`} />}
                  isDarkMode={darkMode}
                />
                <ButtonTab
                  isDarkMode={darkMode}
                  label="Variables"
                  value="variables"
                  isActive={activeTabRequest === "variables"}
                  onClick={() => setActiveTabRequest("variables")}
                />
              </div>
            ) : (
              <div className="flex items-center gap-2 mt-4">
                <ButtonTab
                  isDarkMode={darkMode}
                  label="Headers"
                  value="headers"
                  isActive={activeTabRequest === "headers"}
                  onClick={() => setActiveTabRequest("headers")}
                />
                <ButtonTab
                  label="Body"
                  value="body"
                  isActive={activeTabRequest === "body"}
                  onClick={() => setActiveTabRequest("body")}
                  Icon={<VscJson className={`${darkMode ? "text-gray-100" : "text-primary/85"} w-5 h-5`} />}
                  isDarkMode={darkMode}
                />
              </div>
            )}

            {activeTabRequest === "body" && (
              <div className="max-h-[420px] overflow-y-auto mt-3">
                <CodeBox value={bodyRawString} darkMode={darkMode} />
              </div>
            )}

            {activeTabRequest === "graphql" && (
              <div className="max-h-[420px] overflow-y-auto mt-3">
                <CodeBox value={bodyRawString} darkMode={darkMode} />
              </div>
            )}

            {activeTabRequest === "variables" && (
              <div className="space-y-2 mt-3">
                <div className="flex items-center justify-between">
                  <h2 className={`text-sm ${darkMode ? "text-gray-300" : "text-slate-600"}`}>Variables</h2>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      className={`px-2 py-1 text-xs rounded border ${darkMode
                          ? "bg-gray-800 border-gray-700 text-gray-200 hover:bg-gray-700"
                          : "bg-white border-gray-200 hover:bg-slate-50"
                        }`}
                      onClick={() => {
                        try {
                          const pretty = JSON.stringify(JSON.parse(variablesPretty || "{}"), null, 2);
                          setVariablesPretty(pretty);
                          setVariablesErr(null);
                        } catch {
                          setVariablesPretty(DEFAULT_VARS_PRETTY);
                          setVariablesErr(null);
                        }
                      }}
                    >
                      Prettify
                    </button>
                    <button
                      type="button"
                      className={`px-2 py-1 text-xs rounded border ${darkMode
                          ? "bg-gray-800 border-gray-700 text-gray-200 hover:bg-gray-700"
                          : "bg-white border-gray-200 hover:bg-slate-50"
                        }`}
                      onClick={() => {
                        setVariablesPretty(DEFAULT_VARS_PRETTY);
                        setVariablesErr(null);
                      }}
                    >
                      Reset
                    </button>
                  </div>
                </div>

                <div className="max-h-[420px] overflow-y-auto">
                  <textarea
                    value={variablesPretty}
                    onChange={(e) => {
                      setVariablesPretty(e.target.value);
                      if (variablesErr) setVariablesErr(null);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Tab") {
                        e.preventDefault();
                        const el = e.currentTarget;
                        const start = el.selectionStart ?? 0;
                        const end = el.selectionEnd ?? 0;
                        const before = variablesPretty.slice(0, start);
                        const after = variablesPretty.slice(end);
                        const next = `${before}  ${after}`;
                        setVariablesPretty(next);
                        queueMicrotask(() => {
                          el.selectionStart = el.selectionEnd = start + 2;
                        });
                      }
                    }}
                    spellCheck={false}
                    className={`w-full font-mono text-[13px] leading-5 rounded-md p-3 outline-none focus:ring-2 ${darkMode
                        ? "border border-gray-700 bg-gray-900 text-gray-100 placeholder:text-gray-400 focus:ring-primary/30"
                        : "border border-slate-200 bg-[#F3F6F9] focus:ring-primary/30"
                      }`}
                    rows={14}
                    placeholder={DEFAULT_VARS_PRETTY}
                  />
                </div>

                {variablesErr && <div className="text-xs text-red-600">JSON error: {variablesErr}</div>}
              </div>
            )}

            {activeTabRequest === "headers" && (
              <div className="mt-4 w-full">
                <h2 className={`text-sm mb-2 ${darkMode ? "text-gray-300" : "text-slate-600"}`}>Headers</h2>
                <div className="flex flex-col gap-2 w-full h-full">
                  {requestHeaders.map((h, i) => (
                    <div key={`${i}-${h.key}-${h.value}`} className="flex gap-2 w-full items-center">
                      <div className="flex w-full">
                        <TextInputWithClearButton
                          id={`header-key-${i}`}
                          type="text"
                          inputMode="text"
                          value={h.key}
                          onChangeHandler={(e) => {
                            const arr = [...requestHeaders];
                            arr[i].key = e.target.value;
                            setRequestHeaders(arr);
                          }}
                          placeholder="Enter key"
                          label="Key"
                          isDarkMode={darkMode}
                        />
                      </div>
                      <div className="flex w-full">
                        <TextInputWithClearButton
                          id={`header-value-${i}`}
                          type="text"
                          inputMode="text"
                          value={h.value}
                          onChangeHandler={(e) => {
                            const arr = [...requestHeaders];
                            arr[i].value = e.target.value;
                            setRequestHeaders(arr);
                          }}
                          placeholder="Enter value"
                          label="Value"
                          isDarkMode={darkMode}
                        />
                      </div>
                      <button
                        onClick={() => {
                          const arr = requestHeaders.filter((_, idx) => idx !== i);
                          setRequestHeaders(arr.length ? arr : [{ key: "", value: "" }]);
                        }}
                        className={`w-10 p-2 rounded-md ${darkMode ? "hover:bg-gray-800" : "hover:bg-gray-100"}`}
                      >
                        <Trash2Icon
                          className={`w-5 h-5 ${darkMode ? "text-gray-300 hover:text-red-500" : "text-primary/60 hover:text-red-700"}`}
                        />
                      </button>
                    </div>
                  ))}
                </div>
                <button
                  onClick={() => setRequestHeaders([...requestHeaders, { key: "", value: "" }])}
                  className={`text-sm flex items-center gap-1 mt-2 ${darkMode ? "text-blue-400 hover:underline" : "text-blue-600 hover:underline"
                    }`}
                >
                  <PlusIcon className="w-4 h-4" /> Add header
                </button>

                <div className="mt-4">
                  <h3 className={`text-xs mb-1 ${darkMode ? "text-gray-400" : "text-slate-500"}`}>Preview</h3>
                  <CodeBox value={headersText} darkMode={darkMode} />
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === "test" && (
          <div>
            <h2 className={`text-sm mb-2 ${darkMode ? "text-gray-300" : "text-slate-600"}`}>Test Script</h2>
            <div className="max-h-[420px] overflow-y-auto">
              <CodeBox
                value={
                  (node.rawNode as any)?.event?.find((e: any) => e.listen === "test")?.script?.exec?.join("\n") ??
                  "// Test script"
                }
                darkMode={darkMode}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default RequestDetails;
