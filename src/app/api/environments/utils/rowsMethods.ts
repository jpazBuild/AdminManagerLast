import { EnvRow } from "../types/types";

const METADATA_KEYS = new Set([
    "name",
    "_postman_exported_using",
    "_postman_exported_at",
    "id",
    "_postman_variable_scope",
    "values",
]);

export const normalizeToRows = (
    selectedEnvironment: any
): { rows: EnvRow[]; source: "values" | "env" } => {
    const root = selectedEnvironment ?? {};
    const env = root?.env && typeof root.env === "object" ? root.env : null;

    if (Array.isArray(root?.values)) {
        const rows: EnvRow[] = root.values
            .filter((it: any) => it && typeof it.key === "string" && it.key.length)
            .map((it: any, idx: number) => ({
                id: String(it.key ?? idx),
                key: String(it.key ?? ""),
                value:
                    typeof it.value === "object"
                        ? JSON.stringify(it.value)
                        : String(it.value ?? ""),
                enabled: Boolean(it.enabled ?? true),
                _type: it.type ?? "default",
                _orig: {
                    key: String(it.key ?? ""),
                    value:
                        typeof it.value === "object"
                            ? JSON.stringify(it.value)
                            : String(it.value ?? ""),
                    enabled: Boolean(it.enabled ?? true),
                    type: it.type ?? "default",
                },
            }));
        return { rows, source: "values" };
    }

    if (env && Array.isArray(env.values)) {
        const rows: EnvRow[] = env.values
            .filter((it: any) => it && typeof it.key === "string" && it.key.length)
            .map((it: any, idx: number) => ({
                id: String(it.key ?? idx),
                key: String(it.key ?? ""),
                value:
                    typeof it.value === "object"
                        ? JSON.stringify(it.value)
                        : String(it.value ?? ""),
                enabled: Boolean(it.enabled ?? true),
                _type: it.type ?? "default",
                _orig: {
                    key: String(it.key ?? ""),
                    value:
                        typeof it.value === "object"
                            ? JSON.stringify(it.value)
                            : String(it.value ?? ""),
                    enabled: Boolean(it.enabled ?? true),
                    type: it.type ?? "default",
                },
            }));
        return { rows, source: "values" };
    }

    if (env) {
        const rows: EnvRow[] = Object.entries(env)
            .filter(([k]) => !METADATA_KEYS.has(String(k)))
            .map(([k, v]) => ({
                id: String(k),
                key: String(k),
                value: typeof v === "object" ? JSON.stringify(v) : String(v ?? ""),
                enabled: true,
                _orig: {
                    key: String(k),
                    value: typeof v === "object" ? JSON.stringify(v) : String(v ?? ""),
                    enabled: true,
                },
            }));
        return { rows, source: "env" };
    }

    if (root && typeof root === "object") {
        const rows: EnvRow[] = Object.entries(root)
            .filter(([k]) => !METADATA_KEYS.has(String(k)))
            .map(([k, v]) => ({
                id: String(k),
                key: String(k),
                value: typeof v === "object" ? JSON.stringify(v) : String(v ?? ""),
                enabled: true,
                _orig: {
                    key: String(k),
                    value: typeof v === "object" ? JSON.stringify(v) : String(v ?? ""),
                    enabled: true,
                },
            }));
        return { rows, source: "env" };
    }

    return { rows: [], source: "env" };
};


export const coerce = (s: string) => {
    if (typeof s !== "string") return s as any;
    try { return JSON.parse(s); } catch { return s; }
};

export const buildSavePayload = (
    original: any,
    rows: Array<{ key: string; value: string; enabled: boolean; _type?: string; _orig?: any }>,
    sourceType: "values" | "env"
) => {
    const clone = JSON.parse(JSON.stringify(original));

    if (sourceType === "values") {
        const valuesPayload = rows.map(r => ({
            key: r.key,
            value: coerce(r.value),
            enabled: r.enabled,
            type: r._type ?? r._orig?.type ?? "default",
        }));

        if (Array.isArray(clone?.values)) {
            clone.values = valuesPayload;
        } else if (clone?.env && Array.isArray(clone.env.values)) {
            clone.env = { ...clone.env, values: valuesPayload };
        } else {
            clone.values = valuesPayload;
            if (clone?.env?.values) delete clone.env.values;
        }
        return clone;
    }

    const envObj: Record<string, any> = {};
    rows.forEach(r => { envObj[r.key] = coerce(r.value); });

    if (clone?.env && typeof clone.env === "object") {
        const { values: _, ...rest } = clone.env;
        clone.env = { ...rest, ...envObj };
    } else {
        clone.env = envObj;
    }
    return clone;
}

export const renameKey = <T extends object>(
    obj: T,
    from: string,
    to: string,
    valueIfMissing?: any
) => {
    const o = obj as Record<string, any>;
    if (from in o) {
        o[to] = o[from];
        delete o[from];
    } else if (!(to in o) && valueIfMissing !== undefined) {
        o[to] = valueIfMissing;
    }
}