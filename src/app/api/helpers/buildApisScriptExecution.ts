type ApiStep = {
  startedAt?: number;
  completedAt?: number;
  success?: boolean;
  status?: number;
  request?: any;
  response?: any;
  env?: any;
};

export type ExecutedApi = {
  name: string;
  order: number;
  request?: ApiStep;
  test?: ApiStep; 
};

function parseItem(item?: string): { kind: "request" | "test" | "iteration" | "other"; name?: string } {
  const txt = String(item || "");
  if (/^Running request:\s*/i.test(txt)) {
    return { kind: "request", name: txt.replace(/^Running request:\s*/i, "") };
  }
  if (/^Request completed:\s*/i.test(txt)) {
    return { kind: "request", name: txt.replace(/^Request completed:\s*/i, "") };
  }
  if (/^Running test script:\s*/i.test(txt)) {
    return { kind: "test", name: txt.replace(/^Running test script:\s*/i, "") };
  }
  if (/^Test script completed:\s*/i.test(txt)) {
    return { kind: "test", name: txt.replace(/^Test script completed:\s*/i, "") };
  }
  if (/^APIs iteration\s+\d+\s+completed$/i.test(txt) || /^Running iteration:/i.test(txt)) {
    return { kind: "iteration" };
  }
  return { kind: "other" };
}

function isIgnorable(payload: any): boolean {
  if (!payload) return true;
  if (payload?.response === "Processing...") return true;
  const item = String(payload?.item || "");
  if (/^Running iteration:/i.test(item)) return true;
  if (/^APIs iteration\s+\d+\s+completed$/i.test(item)) return true;
  return false;
}

export function buildExecutedApis(messages: Array<{ ts: number; kind: string; payload: any }>): ExecutedApi[] {
  const map = new Map<string, ExecutedApi>();
  let orderCounter = 0;
  let finalSummaryResults: any[] | undefined;

  for (const m of messages) {
    const p = m?.payload;
    if (!p) continue;

    const isDone =
      (m.kind === "done") ||
      (p?.routeKey === "runApis" && p?.response?.message === "APIs run completed");

    if (isDone) {
      const maybeSummary = p?.summary ?? p?.response?.summary;
      const results = maybeSummary?.summary?.results;
      if (Array.isArray(results)) finalSummaryResults = results;
    }

    if (isIgnorable(p)) continue;

    const { kind, name } = parseItem(p?.item);
    if (!name || (kind !== "request" && kind !== "test")) continue;

    if (!map.has(name)) {
      map.set(name, { name, order: orderCounter++ });
    }
    const entry = map.get(name)!;

    const resp = p?.response || {};
    if (kind === "request") {
      if (/^Running request:/i.test(String(p.item))) {
        entry.request = { ...(entry.request || {}), startedAt: entry.request?.startedAt ?? m.ts };
      }
      if (/^Request completed:/i.test(String(p.item))) {
        entry.request = {
          ...(entry.request || {}),
          completedAt: m.ts,
          success: resp?.success,
          status: resp?.status,
          request: resp?.request,
          response: resp?.response,
          env: resp?.env,
          startedAt: entry.request?.startedAt ?? m.ts
        };
      }
    } else if (kind === "test") {
      if (/^Running test script:/i.test(String(p.item))) {
        entry.test = { ...(entry.test || {}), startedAt: entry.test?.startedAt ?? m.ts };
      }
      if (/^Test script completed:/i.test(String(p.item))) {
        entry.test = {
          ...(entry.test || {}),
          completedAt: m.ts,
          success: resp?.success,
          env: resp?.env,
          startedAt: entry.test?.startedAt ?? m.ts
        };
      }
    }
  }

  if (finalSummaryResults) {
    for (const r of finalSummaryResults) {
      const name = r?.name;
      if (!name) continue;
      if (!map.has(name)) map.set(name, { name, order: 9999 });
      const entry = map.get(name)!;

      if (r?.type === "request") {
        entry.request = {
          ...(entry.request || {}),
          success: r?.success,
          status: r?.status ?? entry.request?.status,
        };
      } else if (r?.type === "script" && r?.listen === "test") {
        entry.test = {
          ...(entry.test || {}),
          success: r?.success,
        };
      }
    }
  }

  const executed = Array
    .from(map.values())
    .filter(e => e.request || e.test)
    .sort((a, b) => a.order - b.order);

  return executed;
}
