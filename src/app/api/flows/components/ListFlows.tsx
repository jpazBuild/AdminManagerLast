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

const ListFlows = ({ query, setQuery, onCreate, allVisibleSelected, onToggleSelectAllVisible, filteredFlows,

    selectedIds, onToggleSelect, anyRunning, runFlows, totalSuccess, totalFailed, totalPending, successRate, executedByFlow, flows, expandedFlows, toggleFlowExpanded, openChipModal, closeRowMenu, messagesResult
    , onOpen, refreshFlows
}: ListFlowsProps) => {

    const {
        page, setPage,
        pageSize, setPageSize,
        totalItems, totalPages,
        start, end,
        items: paginatedSelectedTests,
    } = usePagination(filteredFlows, 10);


   const changeDelete = async (flowId: string) => {
        try {
            const { status, data } = await axios.delete(`${URL_API_ALB}apisScripts`, {
                data: { id: flowId }, // <- cuerpo del DELETE
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
            console.error(error);
            toast.error("Error deleting flow");
        }
    };
    const SINGLE_FLOW_ID = "flow-execution";
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
                    .map((flow: any) => (
                        <div
                            key={flow.id}
                            className="rounded-2xl border border-gray-300 bg-white p-0.5"
                        >
                            <div className="rounded-2xl bg-white px-5 py-6 border border-slate-100">
                                <div className="flex items-start justify-between gap-3">
                                    <div className="flex items-center gap-3">

                                        <Checkbox
                                            checked={selectedIds.has(flow.id)}
                                            onCheckedChange={(checked) => onToggleSelect(flow.id, checked === true)}
                                        />
                                        <div className="flex flex-col items-center">
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className="text-primary/60 text-[14px]">{flow.id}</span>
                                                <CopyToClipboard text={flow.id} />
                                            </div>
                                            <button
                                                onClick={() => onOpen(flow.id)}
                                                className="self-start text-[18px] font-semibold text-primary/70"
                                            >
                                                {flow.name}
                                            </button>

                                        </div>
                                    </div>

                                    <MoreMenu
                                        onDelete={() => changeDelete(flow.id)}
                                    />
                                </div>
                            </div>
                        </div>
                    ))}

                {paginatedSelectedTests.length === 0 && (
                    <NoData text="No flows found." />
                )}
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
                    const pieces = executedByFlow[flowId] ?? [];

                    const flowStatus = messagesResult[flowId]?.status as ("idle" | "running" | "done" | "error" | undefined);
                    const isRunning = flowStatus === "running";

                    const lastErrMsg = (() => {
                        const fr = messagesResult[flowId];
                        if (!fr?.messages?.length) return undefined;
                        const m = [...fr.messages].reverse().find(m => m.kind === "error");
                        return (m?.payload?.error as string) || (m?.payload?.message as string) || undefined;
                    })();

                    const isDone = (v: any) => v === true || v === "skipped";
                    const isOk = (v: any) => v === true || v === "skipped";
                    const toState = (v: any): "ok" | "fail" | "pending" =>
                        v === false ? "fail" : isDone(v) ? "ok" : "pending";

                    const totalSteps =
                        pieces.reduce((acc, p) => acc + (p.request ? 1 : 0) + (p.test ? 1 : 0), 0) || 0;

                    console.log("totalSteps ", { pieces, totalSteps });

                    const doneSteps = pieces.reduce((acc, p) =>
                        acc +
                        (p.request && isDone(p.request?.success) ? 1 : 0) +
                        (p.test && isDone(p.test?.success) ? 1 : 0)
                        , 0);

                    console.log("test ", { totalSteps, doneSteps });


                    const progressPct = totalSteps ? Math.round((doneSteps / totalSteps) * 100) : 0;

                    const reqState = toState(pieces.length ? pieces[0]?.request?.success : undefined);
                    const testState = toState(pieces.length ? pieces[0]?.test?.success : undefined);

                    const hasPieceFail = pieces.some(p => p.request?.success === false || p.test?.success === false);
                    const hasFail = !!lastErrMsg || hasPieceFail;

                    const allOk =
                        pieces.length > 0 &&
                        pieces.every(p => (p.request ? isOk(p.request.success) : true) && (p.test ? isOk(p.test.success) : true));

                    const flowMeta = flows.find((f: any) => f.id === flowId);
                    const flowName = flowMeta?.name || flowId;
                    const expanded = expandedFlows[flowId] ?? true;

                    console.log("isRunning ", isRunning);

                    return (
                        <div key={flowId} className="space-y-4">
                            <div
                                className={`rounded-2xl border-2 px-5 py-4 ${hasFail
                                    ? "border-red-300"
                                    : allOk
                                        ? "border-emerald-700"
                                        : "border-slate-200"
                                    }`}
                            >
                                <div className="flex items-start justify-between gap-3">
                                    <div className="min-w-0">
                                        <div className="text-xs text-primary/40">{flowId}</div>
                                        <div className="text-lg font-semibold text-primary/85 truncate">{flowName}</div>

                                        {lastErrMsg && (
                                            <div className="mt-2 text-sm text-red-600">
                                                {lastErrMsg}
                                            </div>
                                        )}
                                    </div>

                                    <div className="flex items-center gap-3">
                                        {hasFail || allOk && (
                                            <div
                                                className={`flex h-8 w-8 items-center justify-center rounded-full border ${hasFail
                                                    ? "border-red-300 text-red-500"
                                                    : allOk
                                                        ? "border-emerald-300 text-emerald-700"
                                                        : "border-slate-300 text-slate-400"
                                                    }`}
                                                title={hasFail ? "Failed" : allOk ? "Success" : isRunning ? "Running" : "In progress"}
                                            >
                                                {!allOk && hasFail && <FaXmark className="w-5 h-5" />}
                                                {!hasFail && allOk && <Check className="w-5 h-5" />}
                                            </div>
                                        )

                                        }

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
                                                className={`w-5 h-5 text-slate-400 transition-transform ${expanded ? "rotate-0" : "-rotate-90"
                                                    }`}
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
                                    <div className="mt-1 text-right text-xs text-primary/80">
                                        {progressPct}%
                                    </div>
                                </div>
                            </div>
                            <div
                                id={`apis-${flowId}`}
                                className={`overflow-hidden transition-all duration-300 ${expanded ? "max-h-[2000px] opacity-100" : "max-h-0 opacity-0"}`}
                            >
                                {!!pieces.length && (
                                    <div className="space-y-3 pt-2">
                                        <div className="flex items-center justify-between">
                                            <div className="text-sm text-slate-500">APIs</div>
                                            <div className="text-xs text-slate-400">
                                                {Math.round(progressPct)}%
                                            </div>
                                        </div>

                                        {pieces.map((api) => {
                                            const msgs = (messagesResult[flowId]?.messages ?? []).filter(
                                                (m: any) =>
                                                    m?.payload?.response?.name === api.name ||
                                                    (typeof m?.payload?.item === "string" &&
                                                        m.payload.item.includes(api.name))
                                            );
                                            const start = msgs[0]?.ts ?? null;
                                            const end = msgs[msgs.length - 1]?.ts ?? null;
                                            const durSec =
                                                start && end ? Math.max(0, (end - start) / 1000) : null;

                                            const chipBase =
                                                "px-3 py-1 rounded-full text-xs border bg-white";
                                            const chip = (state: "ok" | "fail" | "pending") =>
                                                state === "ok"
                                                    ? `${chipBase} border-emerald-600 text-primary/80`
                                                    : state === "fail"
                                                        ? `${chipBase} border-red-600 text-red-600`
                                                        : `${chipBase} border-slate-300 text-primary/70`;

                                            return (
                                                <div
                                                    key={api.name}
                                                    className={`rounded-2xl border px-4 py-3 ${reqState === "fail" || testState === "fail"
                                                        ? "border-red-300"
                                                        : reqState === "ok" && testState === "ok"
                                                            ? "border-emerald-600"
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
    )
}

export default ListFlows;