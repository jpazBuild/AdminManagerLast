// import safeJsonParse from "@/utils/safeJsonParse";
// import { ChevronDown } from "lucide-react";
// import { useMemo, useState } from "react";
// import { PrismLight as SyntaxHighlighter } from "react-syntax-highlighter";
// import { stackoverflowLight } from "react-syntax-highlighter/dist/esm/styles/hljs";
// import IterationTabBtn from "./IterationTabBtn";

// type Stage = "pre" | "request" | "post";
// type ModalTab = "metadata" | "error" | "environment";

// type ExecPiece = {
//     name: string;
//     request?: { success?: boolean; status?: number | null; detail?: any; _error?: any };
//     test?: { success?: boolean; detail?: any };
// };

// type CollectionMainProps = {
//     response?: any;
//     children: React.ReactNode;
//     envEditorOpen?: boolean;
// };

// const isPlainObj = (v: any) => v && typeof v === "object" && !Array.isArray(v);
// const deepMerge = (a: any, b: any): any => {
//     if (Array.isArray(a) && Array.isArray(b)) return b;
//     if (isPlainObj(a) && isPlainObj(b)) {
//         const out: any = { ...a };
//         for (const k of Object.keys(b)) out[k] = k in a ? deepMerge(a[k], b[k]) : b[k];
//         return out;
//     }
//     return b ?? a;
// };
// const pick = (obj: any, keys: string[]) =>
//     keys.reduce((acc, k) => (obj && k in obj ? ((acc as any)[k] = obj[k], acc) : acc), {} as any);

// function buildPiecesFromMessages(msgs: any[]): { pieces: ExecPiece[]; progressPct: number } {
//     const byName: Record<string, ExecPiece> = {};

//     const ensure = (name?: string | null): ExecPiece | null => {
//         if (!name) return null;
//         if (!byName[name]) byName[name] = { name };
//         return byName[name];
//     };

//     for (const m of msgs) {
//         const resp = m?.payload?.response;
//         const item = m?.payload?.item;

//         if (typeof item === "string") {
//             let match = item.match(/^(?:Running request|Request completed):\s*(.+)$/i);
//             if (match?.[1]) {
//                 const e = ensure(match[1].trim());
//                 if (e && /^Running request:/i.test(item)) {
//                     e.request = e.request ?? { success: undefined, status: null, detail: {} };
//                 }
//             }
//             match = item.match(/^(?:Running test script|Test script completed):\s*(.+)$/i);
//             if (match?.[1]) {
//                 const e = ensure(match[1].trim());
//                 if (e && /^Running test script:/i.test(item)) {
//                     e.test = e.test ?? { success: undefined, detail: {} };
//                 }
//             }
//         }

//         if (resp && (resp.name || resp.type)) {
//             const rName: string | null = resp.name ?? null;
//             const rType: string | null = resp.type ?? null;

//             if (rName && rType === "request") {
//                 const e = ensure(rName);
//                 if (!e) continue;
//                 e.request = {
//                     success: typeof resp.success === "boolean" ? resp.success : e.request?.success ?? undefined,
//                     status:
//                         typeof resp.status === "number"
//                             ? resp.status
//                             : typeof e.request?.status === "number"
//                                 ? e.request?.status
//                                 : null,
//                     detail: deepMerge(e.request?.detail ?? {}, pick(resp, ["request", "response", "env"])),
//                 };
//             }

//             if (rName && rType === "script" && resp.listen === "test") {
//                 const e = ensure(rName);
//                 if (!e) continue;
//                 e.test = {
//                     success: typeof resp.success === "boolean" ? resp.success : e.test?.success ?? undefined,
//                     detail: deepMerge(e.test?.detail ?? {}, resp),
//                 };
//             }
//         }
//     }

//     const list = Object.values(byName);
//     const totalSteps = list.reduce((acc, p) => acc + (p.request ? 1 : 0) + (p.test ? 1 : 0), 0) || 0;
//     const doneSteps =
//         list.reduce(
//             (acc, p) =>
//                 acc +
//                 (typeof p.request?.success === "boolean" ? 1 : 0) +
//                 (typeof p.test?.success === "boolean" ? 1 : 0),
//             0
//         ) || 0;
//     const pct = totalSteps ? Math.round((doneSteps / totalSteps) * 100) : 0;
//     return { pieces: list, progressPct: pct };
// }

// const CollectionMain = ({ response, children, envEditorOpen }: CollectionMainProps) => {
//     const [isOpen, setIsOpen] = useState(false);

//     const normalized = useMemo(() => {
//         if (!response) return null;
//         const maybeObj = typeof response === "string" ? safeJsonParse(response) : response;
//         if (!maybeObj || typeof maybeObj !== "object") return null;
//         if ("flow-execution" in maybeObj) {
//             const fe = (maybeObj as any)["flow-execution"];
//             if (fe && typeof fe === "object" && Array.isArray(fe.messages)) return fe;
//         }
//         if (Array.isArray((maybeObj as any).messages)) return maybeObj;
//         return null;
//     }, [response]);

//     // 1) Ordenar mensajes
//     const allMessages = useMemo(
//         () =>
//             normalized?.messages
//                 ? normalized.messages.slice().sort((a: any, b: any) => a.ts - b.ts)
//                 : [],
//         [normalized]
//     );

//     const iterations = useMemo(() => {
//         if (!allMessages.length) return [];

//         const buckets: { index: number; messages: any[] }[] = [];
//         let currentIndex = 0;

//         for (const m of allMessages) {
//             const iterFromResp = m?.payload?.response?.iteration;
//             const iterFromText = (() => {
//                 const it = String(m?.payload?.item ?? "");
//                 const g = it.match(/Running iteration:\s*(\d+)/i);
//                 return g ? Number(g[1]) : null;
//             })();

//             if (typeof iterFromResp === "number") currentIndex = iterFromResp;
//             if (typeof iterFromText === "number") currentIndex = iterFromText;

//             if (!buckets[currentIndex]) buckets[currentIndex] = { index: currentIndex, messages: [] };
//             buckets[currentIndex].messages.push(m);
//         }

//         const compact = buckets.filter(Boolean).sort((a, b) => a.index - b.index);

//         return compact.map((b) => {
//             const { pieces, progressPct } = buildPiecesFromMessages(b.messages);
//             return { ...b, pieces, progressPct };
//         });
//     }, [allMessages]);

//     const [activeIt, setActiveIt] = useState(0);
//     const activeIter = iterations.find((it) => it.index === activeIt) ?? iterations[0];

//     const [chipModal, setChipModal] = useState<{
//         open: boolean;
//         apiName: string | null;
//         stage: Stage;
//         tab: ModalTab;
//     }>({ open: false, apiName: null, stage: "request", tab: "metadata" });

//     const openChipModal = (apiName: string, stage: Stage) => {
//         setChipModal({ open: true, apiName, stage, tab: "metadata" });
//     };
//     const closeChipModal = () => setChipModal((p) => ({ ...p, open: false }));
//     const getApiPiece = (apiName: string) => activeIter?.pieces.find((p) => p.name === apiName);
//     const stateLabel = (v?: boolean) => (v === true ? "Success" : v === false ? "Failed" : "Pending");

//     const apisCards = useMemo(() => {
//         if (!activeIter || !activeIter.pieces.length) return null;

//         return (
//             <div className="w-full">
//                 <div className="flex items-center justify-between mb-2">
//                     <div className="flex items-center gap-2 overflow-x-auto">
//                         {iterations.map((it) => (
//                             <IterationTabBtn
//                                 key={it.index}
//                                 idx={it.index}
//                                 activeIdx={activeIt}
//                                 onSelect={(idx) => setActiveIt(idx)}
//                                 labelPrefix="IT"
//                             />
//                         ))}
//                     </div>
//                     <div className="text-xs text-slate-400">{Math.round(activeIter.progressPct)}%</div>
//                 </div>

//                 <div className="space-y-3 pt-2">
//                     {activeIter.pieces.map((api) => {
//                         const related = activeIter.messages.filter(
//                             (m: any) =>
//                                 m?.payload?.response?.name === api.name ||
//                                 (typeof m?.payload?.item === "string" && m.payload.item.includes(api.name))
//                         );
//                         const start = related[0]?.ts ?? null;
//                         const end = related[related.length - 1]?.ts ?? null;
//                         const durSec = start && end ? Math.max(0, (end - start) / 1000) : null;

//                         const reqState =
//                             api.request?.success === true ? "ok" : api.request?.success === false ? "fail" : "pending";
//                         const testState =
//                             api.test?.success === true ? "ok" : api.test?.success === false ? "fail" : "pending";

//                         const chipBase = "px-3 py-1 rounded-full text-xs border bg-white";
//                         const chip = (state: "ok" | "fail" | "pending") =>
//                             state === "ok"
//                                 ? `${chipBase} border-emerald-600 text-primary/80`
//                                 : state === "fail"
//                                     ? `${chipBase} border-red-600 text-red-600`
//                                     : `${chipBase} border-primary/90 text-primary/70`;

//                         return (
//                             <div
//                                 key={`${api.name}-${activeIter.index}`}
//                                 className={`rounded-2xl border-2 px-4 py-3 ${reqState === "fail" || testState === "fail"
//                                         ? "border-red-300"
//                                         : reqState === "ok" && testState === "ok"
//                                             ? "border-emerald-600"
//                                             : "border-primary/50"
//                                     }`}
//                             >
//                                 <div className="flex items-start justify-between gap-4">
//                                     <div className="min-w-0">
//                                         <div className="text-base font-semibold text-primary/80 truncate">{api.name}</div>

//                                         <div className="mt-2 flex flex-wrap gap-2">
//                                             <button
//                                                 type="button"
//                                                 onClick={() => openChipModal(api.name, "pre")}
//                                                 className={`${chip("pending")}`}
//                                             >
//                                                 Pre-request
//                                             </button>

//                                             <button
//                                                 type="button"
//                                                 onClick={() => openChipModal(api.name, "request")}
//                                                 className={chip(reqState as any)}
//                                             >
//                                                 Request
//                                             </button>

//                                             <button
//                                                 type="button"
//                                                 onClick={() => openChipModal(api.name, "post")}
//                                                 className={chip("pending")}
//                                             >
//                                                 Post-response
//                                             </button>
//                                         </div>
//                                     </div>

//                                     <div className="text-xs text-primary/80 whitespace-nowrap">
//                                         {durSec != null ? `${durSec.toFixed(2)} s` : ""}
//                                     </div>
//                                 </div>
//                             </div>
//                         );
//                     })}
//                 </div>
//             </div>
//         );
//     }, [iterations, activeIter, activeIt]);

//     const modalContent = useMemo(() => {
//         if (!chipModal.open || !chipModal.apiName || !activeIter) return null;
//         const piece = getApiPiece(chipModal.apiName);
//         const req = piece?.request;
//         const test = piece?.test;

//         const detailReq = req?.detail ?? {};
//         const detailTest = test?.detail ?? {};

//         const envObj =
//             chipModal.stage === "request" ? detailReq?.env : chipModal.stage === "post" ? detailTest?.env : undefined;

//         const postErr = detailTest?._error || detailTest?.env?.__error || detailTest?.error || detailTest?.__error;

//         const meta =
//             chipModal.stage === "request"
//                 ? {
//                     Name: piece?.name ?? "—",
//                     Status: typeof req?.status === "number" ? String(req.status) : "—",
//                     Type: "request",
//                     Success: (req?.success === true ? "Success" : req?.success === false ? "Failed" : "Pending") as string,
//                 }
//                 : chipModal.stage === "post"
//                     ? {
//                         Name: piece?.name ?? "—",
//                         Status: String(req?.status) || (req as any)?._error?.status || (postErr as any)?.status || "—",
//                         Type: "script(test)",
//                         Success: (test?.success === true ? "Success" : test?.success === false ? "Failed" : "Pending") as string,
//                     }
//                     : {
//                         Name: piece?.name ?? "—",
//                         Status: "—",
//                         Type: "pre-request",
//                         Success: "Pending/No data",
//                     };

//         const TabBtnSmall: React.FC<{ k: ModalTab; label: string }> = ({ k, label }) => (
//             <button
//                 onClick={() => setChipModal((prev) => ({ ...prev, tab: k }))}
//                 className={`px-3 py-2 text-sm border-b-2 ${chipModal.tab === k ? "border-primary-blue text-slate-800" : "border-transparent text-slate-500"
//                     }`}
//             >
//                 {label}
//             </button>
//         );

//         const J = ({ obj }: { obj: any }) => (
//             <SyntaxHighlighter
//                 language="json"
//                 style={stackoverflowLight}
//                 customStyle={{ backgroundColor: "transparent", padding: 0, margin: 0, fontSize: 12, lineHeight: "16px" }}
//             >
//                 {JSON.stringify(obj ?? {}, null, 2)}
//             </SyntaxHighlighter>
//         );

//         const errorFromReq = detailReq?.response?.error || detailReq?.error || detailReq?._error;
//         const errorFromTest =
//             detailTest?.error || detailTest?.__error || detailTest?._error || detailTest?.env?.__error || undefined;
//         const errorData = chipModal.stage === "request" ? errorFromReq : chipModal.stage === "post" ? errorFromTest : null;

//         const metadataBlock = (
//             <div className="space-y-3">
//                 {Object.entries(meta).map(([k, v]) => (
//                     <div key={k}>
//                         <div className="text-xs text-slate-500">{k}</div>
//                         <div className="mt-1 rounded bg-slate-100 text-[13px] px-3 py-2">{String(v)}</div>
//                     </div>
//                 ))}
//                 {chipModal.stage === "request" && (
//                     <>
//                         <div>
//                             <div className="text-xs text-slate-500">Request</div>
//                             <J obj={detailReq?.request} />
//                         </div>
//                         <div>
//                             <div className="text-xs text-slate-500">Response</div>
//                             <J obj={detailReq?.response} />
//                         </div>
//                     </>
//                 )}
//                 {chipModal.stage === "post" && (
//                     <>
//                         <div>
//                             <div className="text-xs text-slate-500">Script payload</div>
//                             <J obj={detailTest} />
//                         </div>
//                         {(detailTest?._error || detailTest?.env?.__error) && (
//                             <div className="mt-3">
//                                 <div className="text-xs text-slate-500">Post error (_error)</div>
//                                 <J obj={detailTest?._error ?? detailTest?.env?.__error} />
//                             </div>
//                         )}
//                     </>
//                 )}
//             </div>
//         );

//         const errorBlock = <div>{errorData ? <J obj={errorData} /> : <div className="text-sm text-slate-500">No errors</div>}</div>;
//         const environmentBlock = <J obj={envObj} />;

//         return (
//             <div>
//                 <div className="flex items-center gap-4 border-b border-primary/20 mb-4">
//                     <TabBtnSmall k="metadata" label="Metadata" />
//                     <TabBtnSmall k="error" label="Error" />
//                     <TabBtnSmall k="environment" label="Environment" />
//                 </div>

//                 {chipModal.tab === "metadata" && metadataBlock}
//                 {chipModal.tab === "error" && errorBlock}
//                 {chipModal.tab === "environment" && environmentBlock}
//             </div>
//         );
//     }, [chipModal, activeIter]);

//     console.log("normalized response:", normalized);
    
//     return (
//         <div className="flex h-full w-full flex-col gap-4 overflow-hidden">
//             <div className="flex w-full h-full border border-primary/20 rounded-md bg-white shadow-sm justify-center overflow-y-auto">
//                 {children}
//             </div>

//             {!envEditorOpen && (
//                 <div className={`flex border border-primary/20 rounded-md bg-white shadow-sm flex-col ${isOpen ? "h-full" : ""}`}>
//                     <button
//                         onClick={() => setIsOpen(!isOpen)}
//                         className="flex-shrink-0 w-full flex items-center justify-between px-4 py-3 text-sm font-medium text-slate-800 hover:bg-slate-50 border-b border-primary/10"
//                     >
//                         <span>Response</span>
//                         <ChevronDown className={`h-4 w-4 transition-transform ${isOpen ? "rotate-180" : ""}`} />
//                     </button>

//                     {isOpen && (
//                         <div className="w-full h-full flex p-4 overflow-y-auto text-sm bg-slate-50">
//                             {normalized ? (
//                                 iterations.length && activeIter ? (
//                                     <div className="w-full">
//                                         {apisCards}

//                                         {chipModal.open && (
//                                             <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/30">
//                                                 <div className="w-full max-w-3xl mx-4 bg-white rounded-2xl shadow-xl flex flex-col max-h-[85vh]">
//                                                     <div className="flex items-center justify-between px-5 py-4 border-b border-primary/20 flex-shrink-0">
//                                                         <div className="text-[15px] font-semibold text-slate-800">
//                                                             {chipModal.stage === "pre"
//                                                                 ? "Pre-request"
//                                                                 : chipModal.stage === "post"
//                                                                     ? "Post-response"
//                                                                     : "Request"}
//                                                         </div>
//                                                         <button onClick={closeChipModal} className="rounded p-1.5 hover:bg-slate-100 focus:outline-none" aria-label="Close">
//                                                             ✕
//                                                         </button>
//                                                     </div>

//                                                     <div className="p-5 overflow-y-auto">{modalContent}</div>
//                                                 </div>
//                                             </div>
//                                         )}
//                                     </div>
//                                 ) : (
//                                     <div className="w-full h-full flex items-center justify-center text-slate-400 text-sm">
//                                         No response yet. Run the flow to see results.
//                                     </div>
//                                 )
//                             ) : typeof response === "string" ? (
//                                 <SyntaxHighlighter
//                                     language="json"
//                                     style={stackoverflowLight}
//                                     showLineNumbers
//                                     wrapLongLines
//                                     customStyle={{
//                                         margin: 0,
//                                         padding: "12px 16px",
//                                         borderRadius: "0 0 0.375rem 0.375rem",
//                                         background: "#ffffff",
//                                         fontSize: "0.9rem",
//                                         width: "100%",
//                                         height: "100%",
//                                     }}
//                                     lineNumberStyle={{
//                                         minWidth: "2ch",
//                                         paddingRight: "12px",
//                                         color: "#9AA0A6",
//                                         userSelect: "none",
//                                     }}
//                                 >
//                                     {response}
//                                 </SyntaxHighlighter>
//                             ) : (
//                                 <div className="w-full h-full flex items-center justify-center text-slate-400 text-sm">
//                                     No response yet. Run the flow to see results.
//                                 </div>
//                             )}
//                         </div>
//                     )}
//                 </div>
//             )}
//         </div>
//     );
// };

// export default CollectionMain;


"use client";

import safeJsonParse from "@/utils/safeJsonParse";
import { ChevronDown } from "lucide-react";
import { useMemo, useState } from "react";
import { PrismLight as SyntaxHighlighter } from "react-syntax-highlighter";
import { stackoverflowLight } from "react-syntax-highlighter/dist/esm/styles/hljs";
import IterationTabBtn from "./IterationTabBtn";

type Stage = "pre" | "request" | "post";
type ModalTab = "metadata" | "error" | "environment";

type ExecPiece = {
  name: string;
  request?: { success?: boolean; status?: number | null; detail?: any; _error?: any };
  test?: { success?: boolean; detail?: any };
};

type CollectionMainProps = {
  response?: any;
  children: React.ReactNode;
  envEditorOpen?: boolean;
};

const isPlainObj = (v: any) => v && typeof v === "object" && !Array.isArray(v);
const deepMerge = (a: any, b: any): any => {
  if (Array.isArray(a) && Array.isArray(b)) return b;
  if (isPlainObj(a) && isPlainObj(b)) {
    const out: any = { ...a };
    for (const k of Object.keys(b)) out[k] = k in a ? deepMerge(a[k], b[k]) : b[k];
    return out;
  }
  return b ?? a;
};
const pick = (obj: any, keys: string[]) =>
  keys.reduce((acc, k) => (obj && k in obj ? ((acc as any)[k] = obj[k], acc) : acc), {} as any);

function buildPiecesFromMessages(msgs: any[]): { pieces: ExecPiece[]; progressPct: number } {
  const byName: Record<string, ExecPiece> = {};

  const ensure = (name?: string | null): ExecPiece | null => {
    if (!name) return null;
    if (!byName[name]) byName[name] = { name };
    return byName[name];
  };

  for (const m of msgs) {
    const kind = m?.kind;
    const resp = m?.payload?.response;
    const item = m?.payload?.item;

    if (typeof item === "string") {
      let match = item.match(/^(?:Running request|Request completed):\s*(.+)$/i);
      if (match?.[1]) {
        const e = ensure(match[1].trim());
        if (e && /^Running request:/i.test(item)) {
          e.request = e.request ?? { success: undefined, status: null, detail: {} };
        }
      }
      match = item.match(/^(?:Running test script|Test script completed):\s*(.+)$/i);
      if (match?.[1]) {
        const e = ensure(match[1].trim());
        if (e && /^Running test script:/i.test(item)) {
          e.test = e.test ?? { success: undefined, detail: {} };
        }
      }
    }

    if (resp && (resp.name || resp.type)) {
      const rName: string | null = resp.name ?? null;
      const rType: string | null = resp.type ?? null;

      if (rName && rType === "request") {
        const e = ensure(rName);
        if (!e) continue;
        e.request = {
          success: typeof resp.success === "boolean" ? resp.success : e.request?.success ?? undefined,
          status:
            typeof resp.status === "number"
              ? resp.status
              : typeof e.request?.status === "number"
              ? e.request?.status
              : null,
          detail: deepMerge(e.request?.detail ?? {}, pick(resp, ["request", "response", "env"])),
        };
      }

      if (rName && rType === "script" && resp.listen === "test") {
        const e = ensure(rName);
        if (!e) continue;
        e.test = {
          success: typeof resp.success === "boolean" ? resp.success : e.test?.success ?? undefined,
          detail: deepMerge(e.test?.detail ?? {}, resp),
        };
      }
    }

    if (kind === "error") {
      const rawResp = m?.payload?.raw?.response;
      const nameFromError: string | null = rawResp?.name ?? null;
      if (nameFromError) {
        const e = ensure(nameFromError);
        if (!e) continue;
        const mergedDetail = deepMerge(e.request?.detail ?? {}, pick(rawResp, ["request", "response", "env"]));
        const topErr = m?.payload?.raw?.env?.__error ?? m?.payload?.error ?? m?.payload?.message;
        e.request = {
          success: false,
          status:
            typeof rawResp?.status === "number"
              ? rawResp.status
              : typeof e.request?.status === "number"
              ? e.request?.status
              : null,
          detail: mergedDetail,
          _error: topErr,
        };
      }
    }
  }

  const list = Object.values(byName);
  const totalSteps = list.reduce((acc, p) => acc + (p.request ? 1 : 0) + (p.test ? 1 : 0), 0) || 0;
  const doneSteps =
    list.reduce(
      (acc, p) =>
        acc +
        (typeof p.request?.success === "boolean" ? 1 : 0) +
        (typeof p.test?.success === "boolean" ? 1 : 0),
      0
    ) || 0;
  const pct = totalSteps ? Math.round((doneSteps / totalSteps) * 100) : 0;
  return { pieces: list, progressPct: pct };
}

const CollectionMain = ({ response, children, envEditorOpen }: CollectionMainProps) => {
  const [isOpen, setIsOpen] = useState(false);

  const normalized = useMemo(() => {
    if (!response) return null;
    const maybeObj = typeof response === "string" ? safeJsonParse(response) : response;
    if (!maybeObj || typeof maybeObj !== "object") return null;
    if ("flow-execution" in maybeObj) {
      const fe = (maybeObj as any)["flow-execution"];
      if (fe && typeof fe === "object" && Array.isArray(fe.messages)) return fe;
    }
    if (Array.isArray((maybeObj as any).messages)) return maybeObj;
    return null;
  }, [response]);

  const allMessages = useMemo(
    () =>
      normalized?.messages ? normalized.messages.slice().sort((a: any, b: any) => a.ts - b.ts) : [],
    [normalized]
  );

  const iterations = useMemo(() => {
    if (!allMessages.length) return [];
    const buckets: { index: number; messages: any[] }[] = [];
    let currentIndex = 0;

    for (const m of allMessages) {
      const iterFromResp = m?.payload?.response?.iteration;
      const iterFromText = (() => {
        const it = String(m?.payload?.item ?? "");
        const g = it.match(/Running iteration:\s*(\d+)/i);
        return g ? Number(g[1]) : null;
      })();

      if (typeof iterFromResp === "number") currentIndex = iterFromResp;
      if (typeof iterFromText === "number") currentIndex = iterFromText;

      if (!buckets[currentIndex]) buckets[currentIndex] = { index: currentIndex, messages: [] };
      buckets[currentIndex].messages.push(m);
    }

    const compact = buckets.filter(Boolean).sort((a, b) => a.index - b.index);

    return compact.map((b) => {
      const { pieces, progressPct } = buildPiecesFromMessages(b.messages);
      return { ...b, pieces, progressPct };
    });
  }, [allMessages]);

  const [activeIt, setActiveIt] = useState(0);
  const activeIter = iterations.find((it) => it.index === activeIt) ?? iterations[0];

  const [chipModal, setChipModal] = useState<{
    open: boolean;
    apiName: string | null;
    stage: Stage;
    tab: ModalTab;
  }>({ open: false, apiName: null, stage: "request", tab: "metadata" });

  const openChipModal = (apiName: string, stage: Stage) => {
    setChipModal({ open: true, apiName, stage, tab: "metadata" });
  };
  const closeChipModal = () => setChipModal((p) => ({ ...p, open: false }));
  const getApiPiece = (apiName: string) => activeIter?.pieces.find((p) => p.name === apiName);

  const apisCards = useMemo(() => {
    if (!activeIter || !activeIter.pieces.length) return null;

    return (
      <div className="w-full">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2 overflow-x-auto">
            {iterations.map((it) => (
              <IterationTabBtn
                key={it.index}
                idx={it.index}
                activeIdx={activeIt}
                onSelect={(idx) => setActiveIt(idx)}
                labelPrefix="IT"
              />
            ))}
          </div>
          <div className="text-xs text-slate-400">{Math.round(activeIter.progressPct)}%</div>
        </div>

        <div className="space-y-3 pt-2">
          {activeIter.pieces.map((api) => {
            const related = activeIter.messages.filter(
              (m: any) =>
                m?.payload?.response?.name === api.name ||
                (typeof m?.payload?.item === "string" && m.payload.item.includes(api.name)) ||
                m?.payload?.raw?.response?.name === api.name
            );
            const start = related[0]?.ts ?? null;
            const end = related[related.length - 1]?.ts ?? null;
            const durSec = start && end ? Math.max(0, (end - start) / 1000) : null;

            const reqState =
              api.request?.success === true ? "ok" : api.request?.success === false ? "fail" : "pending";
            const testState =
              api.test?.success === true ? "ok" : api.test?.success === false ? "fail" : "pending";

            const chipBase = "px-3 py-1 rounded-full text-xs border bg-white";
            const chip = (state: "ok" | "fail" | "pending") =>
              state === "ok"
                ? `${chipBase} border-emerald-600 text-primary/80`
                : state === "fail"
                ? `${chipBase} border-red-600 text-red-600`
                : `${chipBase} border-primary/90 text-primary/70`;

            return (
              <div
                key={`${api.name}-${activeIter.index}`}
                className={`rounded-2xl border-2 px-4 py-3 ${
                  reqState === "fail" || testState === "fail"
                    ? "border-red-300"
                    : reqState === "ok" && testState === "ok"
                    ? "border-emerald-600"
                    : "border-primary/50"
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <div className="text-base font-semibold text-primary/80 truncate">{api.name}</div>

                    <div className="mt-2 flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => openChipModal(api.name, "pre")}
                        className={`${chip("pending")}`}
                      >
                        Pre-request
                      </button>

                      <button
                        type="button"
                        onClick={() => openChipModal(api.name, "request")}
                        className={chip(reqState as any)}
                      >
                        Request
                      </button>

                      <button
                        type="button"
                        onClick={() => openChipModal(api.name, "post")}
                        className={chip("pending")}
                      >
                        Post-response
                      </button>
                    </div>
                  </div>

                  <div className="text-xs text-primary/80 whitespace-nowrap">
                    {durSec != null ? `${durSec.toFixed(2)} s` : ""}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }, [iterations, activeIter, activeIt]);

  const modalContent = useMemo(() => {
    if (!chipModal.open || !chipModal.apiName || !activeIter) return null;
    const piece = getApiPiece(chipModal.apiName);
    const req = piece?.request;
    const test = piece?.test;

    const detailReq = req?.detail ?? {};
    const detailTest = test?.detail ?? {};

    const envObj =
      chipModal.stage === "request" ? detailReq?.env : chipModal.stage === "post" ? detailTest?.env : undefined;

    const postErr = detailTest?._error || detailTest?.env?.__error || detailTest?.error || detailTest?.__error;

    const meta =
      chipModal.stage === "request"
        ? {
            Name: piece?.name ?? "—",
            Status: typeof req?.status === "number" ? String(req.status) : "—",
            Type: "request",
            Success: req?.success === true ? "Success" : req?.success === false ? "Failed" : "Pending",
          }
        : chipModal.stage === "post"
        ? {
            Name: piece?.name ?? "—",
            Status: String(req?.status) || (req as any)?._error?.status || (postErr as any)?.status || "—",
            Type: "script(test)",
            Success: test?.success === true ? "Success" : test?.success === false ? "Failed" : "Pending",
          }
        : {
            Name: piece?.name ?? "—",
            Status: "—",
            Type: "pre-request",
            Success: "Pending/No data",
          };

    const TabBtnSmall: React.FC<{ k: ModalTab; label: string }> = ({ k, label }) => (
      <button
        onClick={() => setChipModal((prev) => ({ ...prev, tab: k }))}
        className={`px-3 py-2 text-sm border-b-2 ${
          chipModal.tab === k ? "border-primary-blue text-slate-800" : "border-transparent text-slate-500"
        }`}
      >
        {label}
      </button>
    );

    const J = ({ obj }: { obj: any }) => (
      <SyntaxHighlighter
        language="json"
        style={stackoverflowLight}
        customStyle={{ backgroundColor: "transparent", padding: 0, margin: 0, fontSize: 12, lineHeight: "16px" }}
      >
        {JSON.stringify(obj ?? {}, null, 2)}
      </SyntaxHighlighter>
    );

    const errorFromReq =
      detailReq?.response?.error ||
      detailReq?.response?.errors ||
      detailReq?.error ||
      detailReq?._error;

    const errorFromTest =
      detailTest?.error || detailTest?.__error || detailTest?._error || detailTest?.env?.__error || undefined;

    const errorData = chipModal.stage === "request" ? errorFromReq : chipModal.stage === "post" ? errorFromTest : null;

    const metadataBlock = (
      <div className="space-y-3">
        {Object.entries(meta).map(([k, v]) => (
          <div key={k}>
            <div className="text-xs text-slate-500">{k}</div>
            <div className="mt-1 rounded bg-slate-100 text-[13px] px-3 py-2">{String(v)}</div>
          </div>
        ))}
        {chipModal.stage === "request" && (
          <>
            <div>
              <div className="text-xs text-slate-500">Request</div>
              <J obj={detailReq?.request} />
            </div>
            <div>
              <div className="text-xs text-slate-500">Response</div>
              <J obj={detailReq?.response} />
            </div>
          </>
        )}
        {chipModal.stage === "post" && (
          <>
            <div>
              <div className="text-xs text-slate-500">Script payload</div>
              <J obj={detailTest} />
            </div>
            {(detailTest?._error || detailTest?.env?.__error) && (
              <div className="mt-3">
                <div className="text-xs text-slate-500">Post error (_error)</div>
                <J obj={detailTest?._error ?? detailTest?.env?.__error} />
              </div>
            )}
          </>
        )}
      </div>
    );

    const errorBlock = <div>{errorData ? <J obj={errorData} /> : <div className="text-sm text-slate-500">No errors</div>}</div>;
    const environmentBlock = <J obj={envObj} />;

    return (
      <div>
        <div className="flex items-center gap-4 border-b border-primary/20 mb-4">
          <TabBtnSmall k="metadata" label="Metadata" />
          <TabBtnSmall k="error" label="Error" />
          <TabBtnSmall k="environment" label="Environment" />
        </div>

        {chipModal.tab === "metadata" && metadataBlock}
        {chipModal.tab === "error" && errorBlock}
        {chipModal.tab === "environment" && environmentBlock}
      </div>
    );
  }, [chipModal, activeIter]);

  const lastErrorMsg = useMemo(() => {
    const errs = allMessages.filter((m: any) => m?.kind === "error");
    if (!errs.length) return null;
    const last = errs[errs.length - 1];
    return last?.payload?.error || last?.payload?.message || null;
  }, [allMessages]);

  return (
    <div className="flex h-full w-full flex-col gap-4 overflow-hidden">
      <div className="flex w-full h-full border border-primary/20 rounded-md bg-white shadow-sm justify-center overflow-y-auto">
        {children}
      </div>

      {!envEditorOpen && (
        <div className={`flex border border-primary/20 rounded-md bg-white shadow-sm flex-col ${isOpen ? "h-full" : ""}`}>
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="flex-shrink-0 w-full flex items-center justify-between px-4 py-3 text-sm font-medium text-slate-800 hover:bg-slate-50 border-b border-primary/10"
          >
            <span>Response</span>
            <ChevronDown className={`h-4 w-4 transition-transform ${isOpen ? "rotate-180" : ""}`} />
          </button>

          {isOpen && (
            <div className="w-full h-full flex p-4 overflow-y-auto text-sm bg-slate-50">
              {normalized ? (
                iterations.length && activeIter ? (
                  <div className="w-full">
                    {normalized.status === "error" && lastErrorMsg && (
                      <div className="mb-3 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-red-700">
                        {String(lastErrorMsg)}
                      </div>
                    )}

                    {apisCards}

                    {chipModal.open && (
                      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/30">
                        <div className="w-full max-w-3xl mx-4 bg-white rounded-2xl shadow-xl flex flex-col max-h-[85vh]">
                          <div className="flex items-center justify-between px-5 py-4 border-b border-primary/20 flex-shrink-0">
                            <div className="text-[15px] font-semibold text-slate-800">
                              {chipModal.stage === "pre"
                                ? "Pre-request"
                                : chipModal.stage === "post"
                                ? "Post-response"
                                : "Request"}
                            </div>
                            <button onClick={closeChipModal} className="rounded p-1.5 hover:bg-slate-100 focus:outline-none" aria-label="Close">
                              ✕
                            </button>
                          </div>

                          <div className="p-5 overflow-y-auto">{modalContent}</div>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-slate-400 text-sm">
                    No response yet. Run the flow to see results.
                  </div>
                )
              ) : typeof response === "string" ? (
                <SyntaxHighlighter
                  language="json"
                  style={stackoverflowLight}
                  showLineNumbers
                  wrapLongLines
                  customStyle={{
                    margin: 0,
                    padding: "12px 16px",
                    borderRadius: "0 0 0.375rem 0.375rem",
                    background: "#ffffff",
                    fontSize: "0.9rem",
                    width: "100%",
                    height: "100%",
                  }}
                  lineNumberStyle={{
                    minWidth: "2ch",
                    paddingRight: "12px",
                    color: "#9AA0A6",
                    userSelect: "none",
                  }}
                >
                  {response}
                </SyntaxHighlighter>
              ) : (
                <div className="w-full h-full flex items-center justify-center text-slate-400 text-sm">
                  No response yet. Run the flow to see results.
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default CollectionMain;
