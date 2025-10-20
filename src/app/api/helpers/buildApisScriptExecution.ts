// types auxiliares (puedes moverlos arriba de useFlowRunner)
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
  order: number;         // primer avistamiento para ordenar
  request?: ApiStep;     // info de request
  test?: ApiStep;        // info del test script (listen: "test")
};

// Detecta tipo y nombre a partir de `payload.item`
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

// Determina si el mensaje es ruido/ignorable
function isIgnorable(payload: any): boolean {
  if (!payload) return true;
  // Mensajes de “processing/iteration/completed de iteración”
  if (payload?.response === "Processing...") return true;
  const item = String(payload?.item || "");
  if (/^Running iteration:/i.test(item)) return true;
  if (/^APIs iteration\s+\d+\s+completed$/i.test(item)) return true;
  return false;
}

// Construye el merge por flow a partir del array de messages
export function buildExecutedApis(messages: Array<{ ts: number; kind: string; payload: any }>): ExecutedApi[] {
  const map = new Map<string, ExecutedApi>();
  let orderCounter = 0;
  let finalSummaryResults: any[] | undefined;

  for (const m of messages) {
    const p = m?.payload;
    if (!p) continue;

    // Captura summary del mensaje final si viene
    const isDone =
      (m.kind === "done") ||
      (p?.routeKey === "runApis" && p?.response?.message === "APIs run completed");

    if (isDone) {
      const maybeSummary = p?.summary ?? p?.response?.summary;
      const results = maybeSummary?.summary?.results;
      if (Array.isArray(results)) finalSummaryResults = results;
    }

    // Filtra ruido
    if (isIgnorable(p)) continue;

    const { kind, name } = parseItem(p?.item);
    if (!name || (kind !== "request" && kind !== "test")) continue;

    // Crea/obtiene registro de la API por nombre
    if (!map.has(name)) {
      map.set(name, { name, order: orderCounter++ });
    }
    const entry = map.get(name)!;

    // Merge según el tipo + contenido del response
    const resp = p?.response || {};
    if (kind === "request") {
      // "Running request: X" no trae status, marcamos started
      if (/^Running request:/i.test(String(p.item))) {
        entry.request = { ...(entry.request || {}), startedAt: entry.request?.startedAt ?? m.ts };
      }
      // "Request completed: X" trae toda la info
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
      // "Running test script: X"
      if (/^Running test script:/i.test(String(p.item))) {
        entry.test = { ...(entry.test || {}), startedAt: entry.test?.startedAt ?? m.ts };
      }
      // "Test script completed: X"
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

  // Merge con summary.results (si vino en el “done”)
  if (finalSummaryResults) {
    for (const r of finalSummaryResults) {
      const name = r?.name;
      if (!name) continue;
      if (!map.has(name)) map.set(name, { name, order: 9999 }); // por si sólo vino en el summary
      const entry = map.get(name)!;

      if (r?.type === "request") {
        entry.request = {
          ...(entry.request || {}),
          success: r?.success,
          status: r?.status ?? entry.request?.status,
          // el summary no siempre trae request/response completos, mantenemos los ya vistos
        };
      } else if (r?.type === "script" && r?.listen === "test") {
        entry.test = {
          ...(entry.test || {}),
          success: r?.success,
        };
      }
    }
  }

  // Sólo las APIs que realmente tuvieron request o test (ejecutadas)
  const executed = Array
    .from(map.values())
    .filter(e => e.request || e.test)
    .sort((a, b) => a.order - b.order);

  return executed;
}
