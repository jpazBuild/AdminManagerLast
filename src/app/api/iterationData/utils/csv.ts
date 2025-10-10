// src/app/api/iterationData/utils/csv.ts
export type CsvRow = { variable: string; value: string };

function parseCsvLine(line: string): string[] {
  const out: string[] = [];
  let cur = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        cur += '"'; i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (ch === "," && !inQuotes) {
      out.push(cur);
      cur = "";
    } else {
      cur += ch;
    }
  }
  out.push(cur);
  return out.map((s) => s.trim());
}

export async function fileToText(file: File): Promise<string> {
  return new Promise((res, rej) => {
    const reader = new FileReader();
    reader.onload = () => res(String(reader.result ?? ""));
    reader.onerror = rej;
    reader.readAsText(file);
  });
}

/** Convierte CSV en filas {variable,value}. Soporta:
 *  - Con cabecera: variable,value
 *  - Sin cabecera: <var>,<value>
 */
export function csvTextToRows(text: string): CsvRow[] {
  const lines = text
    .replace(/\r/g, "")
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);

  if (lines.length === 0) return [];

  let startIdx = 0;
  const cells0 = parseCsvLine(lines[0]).map((s) => s.toLowerCase());
  if (
    cells0.length >= 2 &&
    (cells0[0] === "variable" || cells0[0] === "key") &&
    (cells0[1] === "value" || cells0[1] === "val")
  ) {
    startIdx = 1; // tiene cabecera
  }

  const rows: CsvRow[] = [];
  for (let i = startIdx; i < lines.length; i++) {
    const cells = parseCsvLine(lines[i]);
    if (cells.length < 2) continue;
    rows.push({ variable: cells[0], value: cells[1] ?? "" });
  }
  return rows;
}
