import TextInputWithClearButton from "@/app/components/InputClear";
import { Check, ChevronDown, PlayIcon, PlusIcon, RefreshCcw } from "lucide-react";
import MoreMenu from "../../components/MoreMenu";
import CopyToClipboard from "@/app/components/CopyToClipboard";
import { ExecutionSummary } from "@/app/components/ExecutionSummary";
import { FaXmark } from "react-icons/fa6";
import { Checkbox } from "@/components/ui/checkbox";
import PaginationResults from "@/app/dashboard/components/PaginationResults";
import { usePagination } from "@/app/hooks/usePagination";
import NoData from "@/app/components/NoData";
import axios from "axios";
import { URL_API_ALB } from "@/config";
import { toast } from "sonner";
import { useMemo, useState } from "react";
import IterationTabBtn from "../../collections/components/IterationTabBtn";

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

// type ExecPiece = {
//   name: string;
//   request?: { success?: boolean; status?: number | null; detail?: any; _error?: any };
//   response?: any;
//   test?: { success?: boolean; detail?: any };
// };


type SuccessFlag = true | false | "skipped";

type ExecPiece = {
  name: string;
  request?: { success?: SuccessFlag; status?: number | null; detail?: any; _error?: any };
  response?: any;
  test?: { success?: SuccessFlag; detail?: any };
};

const normalizeSuccess = (
  val: any,
  fallback?: SuccessFlag
): SuccessFlag | undefined => {
  if (val === true || val === false) return val;
  if (typeof val === "string" && val.toLowerCase() === "skipped") return "skipped";
  return fallback;
};

// function buildPiecesFromMessages(msgs: any[]): { pieces: ExecPiece[]; progressPct: number } {
//   const byName: Record<string, ExecPiece> = {};
//   const ensure = (name?: string | null): ExecPiece | null => {
//     if (!name) return null;
//     if (!byName[name]) byName[name] = { name };
//     return byName[name];
//   };

//   console.log("Building pieces from messages:", msgs);

//   for (const m of msgs) {
//     const kind = m?.kind;
//     const resp = m?.payload?.response;
//     const item = m?.payload?.item;

//     console.log("Processing message:", { kind, resp, item });

//     if (typeof item === "string") {
//       let match = item.match(/^(?:Running request|Request completed):\s*(.+)$/i);
//       if (match?.[1]) {
//         const e = ensure(match[1].trim());
//         if (e && /^Running request:/i.test(item)) {
//           e.request = e.request ?? { success: undefined, status: null, detail: {} };
//         }
//       }
//       match = item.match(/^(?:Running test script|Test script completed):\s*(.+)$/i);
//       if (match?.[1]) {
//         const e = ensure(match[1].trim());
//         if (e && /^Running test script:/i.test(item)) {
//           e.test = e.test ?? { success: undefined, detail: {} };
//         }
//       }
//     }

//     if (resp && (resp.name || resp.type)) {
//       const rName: string | null = resp.name ?? null;
//       const rType: string | null = resp.type ?? null;
//       console.log("Response details:", { rName, rType, resp });

//       if(rName && rType === "resp"){
//         const e = ensure(rName);
//         if(!e) continue;
//         e.response = resp;
//         continue;
//       }
//       if (rName && rType === "request") {
//         const e = ensure(rName);
//         console.log("test in ",{ rName, e });

//         if (!e) continue;
//         e.request = {
//           success: typeof resp.success === "boolean" ? resp.success : e.request?.success ?? undefined,
//           status:
//             typeof resp.status === "number"
//               ? resp.status
//               : typeof e.request?.status === "number"
//                 ? e.request?.status
//                 : null,
//           detail: deepMerge(e.request?.detail ?? {}, pick(resp, ["request", "response", "env"])),
//         };
//       }

//       if (rName && rType === "script" && resp.listen === "test") {
//         const e = ensure(rName);
//         if (!e) continue;
//         e.test = {
//           success: typeof resp.success === "boolean" ? resp.success : e.test?.success ?? undefined,
//           detail: deepMerge(e.test?.detail ?? {}, resp),
//         };
//       }
//     }

//     if (kind === "error") {
//       const rawResp = m?.payload?.raw?.response;
//       const nameFromError: string | null = rawResp?.name ?? null;
//       if (nameFromError) {
//         const e = ensure(nameFromError);
//         if (!e) continue;
//         const mergedDetail = deepMerge(e.request?.detail ?? {}, pick(rawResp, ["request", "response", "env"]));
//         const topErr =
//           m?.payload?.raw?.env?.__error ||
//           m?.payload?.error ||
//           m?.payload?.message;

//         e.request = {
//           success: false,
//           status:
//             typeof rawResp?.status === "number"
//               ? rawResp.status
//               : typeof e.request?.status === "number"
//                 ? e.request?.status
//                 : null,
//           detail: mergedDetail,
//           _error: topErr,
//         };
//       }
//     }
//   }

//   const list = Object.values(byName);
//   const totalSteps = list.reduce((acc, p) => acc + (p.request ? 1 : 0) + (p.test ? 1 : 0), 0) || 0;
//   const doneSteps =
//     list.reduce(
//       (acc, p) =>
//         acc +
//         (typeof p.request?.success === "boolean" ? 1 : 0) +
//         (typeof p.test?.success === "boolean" ? 1 : 0),
//       0
//     ) || 0;
//   const pct = totalSteps ? Math.round((doneSteps / totalSteps) * 100) : 0;

//   return { pieces: list, progressPct: pct };
// }

function buildPiecesFromMessages(msgs: any[]): { pieces: ExecPiece[]; progressPct: number } {
  const byName: Record<string, ExecPiece> = {};
  const ensure = (name?: string | null): ExecPiece | null => {
    if (!name) return null;
    if (!byName[name]) byName[name] = { name };
    return byName[name];
  };

  console.log("Building pieces from messages:", msgs);

  for (const m of msgs) {
    const kind = m?.kind;
    const resp = m?.payload?.response;
    const item = m?.payload?.item;

    console.log("Processing message:", { kind, resp, item });

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
      console.log("Response details:", { rName, rType, resp });

      if (rName && rType === "resp") {
        const e = ensure(rName);
        if (!e) continue;
        e.response = resp;
        // Si el success "skipped" viniera en este objeto "resp", también lo reflejamos en request si existe
        if (e.request) {
          e.request.success = normalizeSuccess(resp.success, e.request.success);
        }
        continue;
      }

      if (rName && rType === "request") {
        const e = ensure(rName);
        if (!e) continue;
        e.request = {
          success: normalizeSuccess(resp.success, e.request?.success),
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
          success: normalizeSuccess(resp.success, e.test?.success),
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
        const topErr =
          m?.payload?.raw?.env?.__error ||
          m?.payload?.error ||
          m?.payload?.message;

        e.request = {
          success: false, // error => fallo
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

  // Cuenta como "hecho" si success es boolean (true/false) O "skipped"
  const isDone = (s?: SuccessFlag) => s === true || s === false || s === "skipped";

  const totalSteps = list.reduce(
    (acc, p) => acc + (p.request ? 1 : 0) + (p.test ? 1 : 0),
    0
  ) || 0;

  const doneSteps = list.reduce(
    (acc, p) => acc + (isDone(p.request?.success) ? 1 : 0) + (isDone(p.test?.success) ? 1 : 0),
    0
  ) || 0;

  const pct = totalSteps ? Math.round((doneSteps / totalSteps) * 100) : 0;

  return { pieces: list, progressPct: pct };
}


type ListFlowsProps = {
  query: string;
  setQuery: (val: string) => void;
  onCreate: () => void;
  allVisibleSelected: boolean;
  onToggleSelectAllVisible: (val: boolean) => void;
  filteredFlows: any[];
  selectedIds: Set<string>;
  onToggleSelect: (id: string, val: boolean) => void;
  anyRunning: boolean;
  runFlows: (ids: string[]) => void;
  totalSuccess: number;
  totalFailed: number;
  totalPending: number;
  successRate: number;
  executedByFlow: Record<string, any[]>;
  flows: any[];
  expandedFlows: Record<string, boolean>;
  toggleFlowExpanded: (id: string) => void;
  openChipModal: (flowId: string, apiName: string, stage: "pre" | "request" | "post") => void;
  closeRowMenu: () => void;
  messagesResult: Record<string, any>;
  onOpen: (id: string) => void;
  refreshFlows: () => void;
};

const ListFlows = ({
  query, setQuery, onCreate, allVisibleSelected, onToggleSelectAllVisible, filteredFlows,
  selectedIds, onToggleSelect, anyRunning, runFlows, totalSuccess, totalFailed, totalPending, successRate,
  executedByFlow, flows, expandedFlows, toggleFlowExpanded, openChipModal, closeRowMenu, messagesResult,
  onOpen, refreshFlows
}: ListFlowsProps) => {
  const {
    page, setPage,
    pageSize, setPageSize,
    totalItems,
    items: paginatedSelectedTests,
  } = usePagination(filteredFlows, 10);

  const [activeItByFlow, setActiveItByFlow] = useState<Record<string, number>>({});

  const changeDelete = async (flowId: string) => {
    try {
      const { status, data } = await axios.delete(`${URL_API_ALB}apisScripts`, {
        data: { id: flowId },
      });
      const ok = (data?.status ?? status) === 200 || status === 204;
      if (ok) {
        closeRowMenu();
        await refreshFlows();
        toast.success("Flow deleted");
      } else {
        throw new Error(data?.message ?? `Unexpected status: ${status}`);
      }
    } catch (error) {
      toast.error("Error deleting flow");
    }
  };

  const SINGLE_FLOW_ID = "flow-execution";

  const perFlowData = useMemo(() => {
    const out: Record<
      string,
      {
        allMsgs: any[];
        iterations: Array<{ index: number; messages: any[]; pieces: ExecPiece[]; progressPct: number }>;
        status: "idle" | "running" | "done" | "error" | undefined;
        lastErrMsg?: string;
      }
    > = {};

    const ids = Object.keys(messagesResult || {});
    for (const fid of ids) {
      const fr = messagesResult[fid];
      const allMsgs = (fr?.messages ?? []).slice().sort((a: any, b: any) => a.ts - b.ts);

      const buckets: { index: number; messages: any[] }[] = [];
      let currentIndex = 0;

      for (const m of allMsgs) {
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
      const iterations = compact.map((b) => {
        const { pieces, progressPct } = buildPiecesFromMessages(b.messages);
        return { ...b, pieces, progressPct };
      });

      const status = fr?.status as ("idle" | "running" | "done" | "error" | undefined);
      const lastErrMsg = (() => {
        if (!fr?.messages?.length) return undefined;
        const m = [...fr.messages].reverse().find((mm: any) => mm.kind === "error");
        return (m?.payload?.error as string) || (m?.payload?.message as string) || undefined;
      })();

      out[fid] = { allMsgs, iterations, status, lastErrMsg };
    }

    return out;
  }, [messagesResult]);

  const toState = (v: SuccessFlag | undefined): "ok" | "fail" | "pending" | "skipped" =>
    v === false ? "fail"
      : v === true ? "ok"
        : v === "skipped" ? "skipped"
          : "pending";


  return (
    <div className="self-center flex w-full lg:w-2/3 flex-col gap-4">
      <div className="flex w-full items-center justify-between gap-2">
        <TextInputWithClearButton
          id="search-flows"
          value={query}
          onChangeHandler={(e) => setQuery(e.target.value)}
          placeholder="Search flows"
          isSearch={true}
          label="Search flows"
          className="w-full"
        />
        <button
          onClick={onCreate}
          className="w-38 flex gap-2 items-center rounded-full bg-gray-200 text-[14px] py-3 px-4"
        >
          <PlusIcon className="w-5 h-5" />
          <span className="font-medium">New flow</span>
        </button>
      </div>

      <div className="flex items-center gap-2 pl-1">
        <Checkbox
          checked={allVisibleSelected}
          onCheckedChange={(checked) => onToggleSelectAllVisible(checked === true)}
        />
        <div className="flex items-center gap-2">
          <span className="text-slate-600 text-sm">{filteredFlows.length} Results</span>
        </div>
      </div>

      <div className="flex flex-col gap-3">
        <PaginationResults
          totalItems={totalItems}
          pageSize={pageSize}
          setPageSize={setPageSize}
          page={page}
          setPage={setPage}
        />

        {paginatedSelectedTests
          .filter((f: any) => !query || f.name.toLowerCase().includes(query.toLowerCase()))
          .map((flow: any) => {
            const flowId = flow.id;

            return (
              <div key={flowId} className="rounded-2xl border border-gray-300 bg-white p-0.5">
                <div className="rounded-2xl bg-white px-5 py-6 border border-slate-100">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <Checkbox
                        checked={selectedIds.has(flowId)}
                        onCheckedChange={(checked) => onToggleSelect(flowId, checked === true)}
                      />
                      <div className="flex flex-col items-center">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-primary/60 text-[14px]">{flowId}</span>
                          <CopyToClipboard text={flowId} />
                        </div>
                        <button
                          onClick={() => onOpen(flowId)}
                          className="self-start text-[18px] font-semibold text-primary/70"
                        >
                          {flow.name}
                        </button>
                      </div>
                    </div>

                    <MoreMenu onDelete={() => changeDelete(flowId)} />
                  </div>
                </div>
              </div>
            );
          })}

        {paginatedSelectedTests.length === 0 && <NoData text="No flows found." />}
      </div>

      <button
        onClick={() => runFlows(Array.from(selectedIds))}
        disabled={anyRunning || selectedIds.size === 0}
        className="bg-primary-blue/90 w-32 cursor-pointer text-white rounded-2xl py-3 px-5 mt-4 mb-2 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {anyRunning ? "Running..." : "Run"}
      </button>

      <div className="mt-6 space-y-6 mb-4">
        {Array.from(selectedIds).length > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-lg font-semibold text-primary/80">Flows</span>
            <span className="text-slate-400 text-sm">({Array.from(selectedIds).length})</span>
          </div>
        )}

        {Array.from(selectedIds).length > 0 && (
          <div className="mt-4">
            <ExecutionSummary
              totalSuccess={totalSuccess}
              totalFailed={totalFailed}
              totalPending={totalPending}
              successRate={successRate}
            />
          </div>
        )}

        
        {Array.from(selectedIds)
          .filter(flowId => flowId !== SINGLE_FLOW_ID)
          .map((flowId) => {
            const meta = perFlowData[flowId];
            const iterations = meta?.iterations ?? [];
            const flowStatus = meta?.status;
            const isRunning = flowStatus === "running";
            const lastErrMsg = meta?.lastErrMsg;

            const activeIdx = activeItByFlow[flowId] ?? (iterations[0]?.index ?? 0);
            const setActive = (idx: number) => setActiveItByFlow(prev => ({ ...prev, [flowId]: idx }));
            const activeIter = iterations.find(it => it.index === activeIdx);
            const progressPct = activeIter?.progressPct ?? 0;

            const piecesForStatus = activeIter?.pieces ?? [];
            // const hasPieceFail = piecesForStatus.some(p => p.request?.success === false || p.test?.success === false);
            // const hasFail = !!lastErrMsg || hasPieceFail;
            // const allOk =
            //   piecesForStatus.length > 0 &&
            //   piecesForStatus.every(p =>
            //     (p.request ? p.request.success === true : true) &&
            //     (p.test ? p.test.success === true : true)
            //   );

            const isOkLike = (s?: SuccessFlag) => s === true || s === "skipped";
            const hasFail = piecesForStatus.some(p => p.request?.success === false || p.test?.success === false);
            const allOk =
              piecesForStatus.length > 0 &&
              piecesForStatus.every(p =>
                (p.request ? isOkLike(p.request.success) : true) &&
                (p.test ? isOkLike(p.test.success) : true)
              );
            
            console.log("p er flow render:", {flowId, piecesForStatus, hasFail, allOk });
            
            const flowMeta = flows.find((f: any) => f.id === flowId);
            const flowName = flowMeta?.name || flowId;
            const expanded = expandedFlows[flowId] ?? true;
            const anySkipped = piecesForStatus.some(
              p => p.request?.success === "skipped" || p.test?.success === "skipped"
            );
            const hasSkipped = !hasFail && anySkipped;
            console.log("flow render:", { flowId, flowName, expanded, hasSkipped });
            
            return (
              <div key={flowId} className="space-y-4">
                <div
                  className={`rounded-2xl border-2 px-5 py-4 ${hasFail
                      ? "border-red-500"
                      : allOk
                        ? "border-emerald-700"
                        : hasSkipped
                          ? "bg-primary"
                          : "border-slate-200"
                    }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p>{hasSkipped}</p>
                      <div className="text-xs text-primary/40">{flowId}</div>
                      <div className="text-lg font-semibold text-primary/85 truncate">{flowName}</div>

                      {lastErrMsg && (
                        <div className="mt-2 text-sm text-red-600">{lastErrMsg}</div>
                      )}
                    </div>

                    <div className="flex items-center gap-3">
                      {(hasFail || allOk) && (
                        <div
                          className={`flex h-8 w-8 items-center justify-center rounded-full border ${hasFail
                            ? "border-red-300 text-red-500"
                            : "border-emerald-600 text-emerald-700"
                            }`}
                          title={hasFail ? "Failed" : "Success"}
                        >
                          {hasFail ? <FaXmark className="w-5 h-5" /> : <Check className="w-5 h-5" />}
                        </div>
                      )}

                      <button
                        type="button"
                        onClick={() => runFlows([flowId])}
                        disabled={isRunning || anyRunning}
                        className="p-2 rounded-full border border-slate-200 hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed"
                        title="Run this flow"
                        aria-label={`Run flow ${flowName}`}
                      >
                        {progressPct > 0 && progressPct < 100 ? (
                          <RefreshCcw className="w-4 h-4" />
                        ) : (
                          <PlayIcon className="w-4 h-4" />
                        )}
                      </button>
                      <button
                        onClick={() => toggleFlowExpanded(flowId)}
                        className="p-2 rounded-full hover:bg-slate-100 transition"
                        aria-expanded={expanded}
                        aria-controls={`apis-${flowId}`}
                      >
                        <ChevronDown
                          className={`w-5 h-5 text-slate-400 transition-transform ${expanded ? "rotate-0" : "-rotate-90"}`}
                        />
                      </button>
                    </div>
                  </div>

                  <div className="mt-4">
                    <div className="h-2 rounded-full bg-gray-200 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${hasFail ? "bg-red-500"
                          : allOk ? "bg-emerald-700"
                            : "bg-amber-500"
                          }`}
                        style={{ width: `${progressPct}%` }}
                      />
                    </div>
                    <div className="mt-1 text-right text-xs text-primary/80">{progressPct}%</div>
                  </div>
                </div>

                <div
                  id={`apis-${flowId}`}
                  className={`overflow-hidden transition-all duration-300 ${expanded ? "max-h-[2000px] opacity-100" : "max-h-0 opacity-0"}`}
                >
                  {!!(iterations.length) && activeIter && (
                    <div className="space-y-3 pt-2">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2 overflow-x-auto">
                          {iterations.map((it) => (
                            <IterationTabBtn
                              key={it.index}
                              idx={it.index}
                              activeIdx={activeIdx}
                              onSelect={(idx) => setActive(idx)}
                              labelPrefix="IT"
                            />
                          ))}
                        </div>
                        <div className="text-xs text-slate-400">
                          {Math.round(activeIter.progressPct)}%
                        </div>
                      </div>

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

                        const reqState = toState(api.request?.success);
                        const testState = toState(api.test?.success);
                        const chipBase = "px-3 py-1 rounded-full text-xs border bg-white";
                        const chip = (state: "ok" | "fail" | "pending" | "skipped") =>
                          state === "ok"
                            ? `${chipBase} border-emerald-600 text-primary/80`
                            : state === "fail"
                              ? `${chipBase} border-red-600 text-red-600`
                              : state === "skipped"
                                ? `${chipBase} border-slate-400 text-slate-500`
                                : `${chipBase} border-primary/70 text-primary/70`;

                        console.log({ api, reqState, testState });
                         const anySkipped = piecesForStatus.some(
                            p => p.request?.success === "skipped" || p.test?.success === "skipped"
                          );
                          const hasSkipped = !hasFail && anySkipped;
                        return (
                          <div
                            key={`${api.name}-${activeIter.index}`}
                            className={`rounded-2xl border-2 px-4 py-3 ${reqState === "fail" || testState === "fail"
                              ? "border-red-300"
                              : reqState === "ok" && testState === "ok"
                                ? "border-emerald-600" : hasSkipped ?
                                  "border-amber-500"
                                : "border-slate-200"
                              }`}
                          >
                            <div className="flex items-start justify-between gap-4">
                              <div className="min-w-0">
                                <div className="text-base font-semibold text-primary/80 truncate">
                                  {api.name}
                                </div>

                                <div className="mt-2 flex flex-wrap gap-2">
                                  <button
                                    type="button"
                                    onClick={() => openChipModal(flowId, api.name, "pre")}
                                    className={chip("pending")}
                                  >
                                    Pre-request
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() => openChipModal(flowId, api.name, "request")}
                                    className={chip(reqState)}
                                  >
                                    Request
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() => openChipModal(flowId, api.name, "post")}
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
                  )}
                </div>
              </div>
            );
          })}
      </div>
    </div>
  );
};

export default ListFlows;
