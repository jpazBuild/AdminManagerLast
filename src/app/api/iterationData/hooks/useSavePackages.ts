import axios from "axios";
import { URL_API_ALB } from "@/config";
import type { Pkg, Row } from "./usePackages";

const PATCH_ENDPOINT = `${URL_API_ALB}iterationData/update`;
const CREATED_BY = "Juan Camilo Gonzalez";
const UPDATED_BY = "Juan Camilo Gonzalez";

const rowsToNested = (rows: Row[]) => {
  const out: Record<string, Record<string, string>> = {};
  for (const r of rows) {
    const raw = (r.variable || "").trim();
    if (!raw) continue;
    const parts = raw.split(".");
    const group = parts.length > 1 ? parts[0] : "iteration1";
    const key = parts.length > 1 ? parts.slice(1).join(".") : parts[0];
    if (!out[group]) out[group] = {};
    out[group][key] = r.value ?? "";
  }
  return out;
};

const buildBody = (pkg: Pkg) => {
  const nested = rowsToNested(pkg.rows);
  return {
    id: pkg.id,
    tagNames: pkg.tagNames ?? [], // 👈 enviar tags
    name: pkg.name,
    description: pkg.description ?? "",
    iterationData: [
      {
        id: pkg.id,
        iterationCount: Object.keys(nested).length || 0,
        iterationData: nested,
        order: 0,
        apisScriptsName: pkg.name || "ApisScripts",
        createdBy: CREATED_BY,
      },
    ],
    updatedBy: UPDATED_BY,
  };
};

export async function savePackages(packages: Pkg[]) {
  const targets = packages.some((p) => p.selected) ? packages.filter((p) => p.selected) : packages;
  console.groupCollapsed(`[PATCH] ${targets.length} → ${PATCH_ENDPOINT}`);
  try {
    await Promise.all(
      targets.map((p, i) => {
        const body = buildBody(p);
        console.groupCollapsed(`[PATCH #${i + 1}] ${p.id} "${p.name}"`);
        console.log("Endpoint:", PATCH_ENDPOINT);
        console.log("Body (obj):", body);
        console.log("Body (JSON):\n", JSON.stringify(body, null, 2));
        console.groupEnd();
        return axios.patch(PATCH_ENDPOINT, body, {
          headers: { "Content-Type": "application/json" },
        });
      })
    );
  } finally {
    console.groupEnd();
  }
}
