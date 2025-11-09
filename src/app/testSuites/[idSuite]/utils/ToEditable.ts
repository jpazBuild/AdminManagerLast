import { FullTest } from "@/types/types";

const toEditable = (t: FullTest) => {
    const keys = Array.isArray(t.testData) ? t.testData : Object.keys(t.testDataObj || {});
    const values: Record<string, any> = { ...(t.testDataObj || {}) };
    keys.forEach((k) => (values[k] = values[k] ?? ""));
    return { keys, values };
};
export default toEditable;