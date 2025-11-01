import { BatchItem, FullTest, SuiteResponse } from "@/types/types";

export const toId = (item: BatchItem) => (typeof item === "string" ? item : item?.id);

export const fmtDate = (ts?: number | string) => {
    if (!ts) return "";
    const n = typeof ts === "string" ? Number(ts) : ts;
    if (!Number.isFinite(n)) return "";
    try {
        return new Intl.DateTimeFormat("es-ES", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        }).format(n);
    } catch {
        return "";
    }
};

export const toEditable = (t: FullTest) => {
    const keys = Array.isArray(t.testData) ? t.testData : Object.keys(t.testDataObj || {});
    const values: Record<string, any> = { ...(t.testDataObj || {}) };
    keys.forEach((k) => (values[k] = values[k] ?? ""));
    return { keys, values };
};

export const slug = (s?: string) =>
    (s || "")
        .toString()
        .normalize("NFKD")
        .replace(/[^\w\s-]/g, "")
        .trim()
        .replace(/\s+/g, "-")
        .toLowerCase();

export const isPlainEmptyObject = (v: any) =>
    v && typeof v === "object" && !Array.isArray(v) && Object.keys(v).length === 0;

export const buildReportCustomName = (suite?: SuiteResponse | null, testId?: string) => {
    const base = suite?.id || "suite";
    return `${base}-${testId}`;
};

export const buildUpdatePayloadSuite = (
    full: any,
    stepsBuf: any[],
    dataBuf?: Record<string, any>,
    updatedBy = "jpaz"
) => {
    const transformedSteps = (stepsBuf ?? []).map((step: any) => {
        if (!step) return step;
        const { stepsId, ...cleanStep } = step;
        if (cleanStep?.stepsData && Array.isArray(cleanStep.stepsData)) {
            return cleanStep.id;
        }
        return cleanStep;
    });

    return {
        id: full.id,
        name: full.name,
        description: full.description,
        groupName: full.groupName,
        moduleName: full.moduleName,
        subModuleName: full.subModuleName,
        tagIds: full.tagIds || [],
        tagNames: full.tagNames || (Array.isArray(full.tagName) ? full.tagName : []),
        contextGeneral: full.contextGeneral,
        testDataObj: dataBuf ?? full.testDataObj ?? {},
        stepsData: transformedSteps,
        updatedBy,
        deleteS3Images: true,
        temp: false,
    };
};

export const pickLatestFromIndex = (list?: any[]) => {
    if (!Array.isArray(list) || list.length === 0) return undefined;
    const parseTS = (s?: string) => (s ? new Date(s).getTime() : 0);
    const sorted = list.slice().sort((a, b) => parseTS(a?.timestamp) - parseTS(b?.timestamp));
    return sorted[sorted.length - 1];
};