// app/api/iterationData/components/VariablesList.tsx
"use client";

import React from "react";
import { Trash2Icon } from "lucide-react";
import TextInputWithClearButton from "@/app/components/InputClear";
import { Row } from "../types";

type Props = {
  rows: Row[];
  onUpdate: (id: string, patch: Partial<Row>) => void;
  onRemove: (id: string) => void;
  onAdd: () => void;
};

export default function VariablesList({ rows, onUpdate, onRemove, onAdd }: Props) {
  return (
    <div>
      {/* Encabezado: dos columnas (Variable | Value) */}
      <div className="grid grid-cols-2 gap-3 mb-2 sticky top-0 bg-white z-10">
        <div className="text-xs font-semibold text-[#7B8CA6] uppercase tracking-wide">
          Variable
        </div>
        <div className="text-xs font-semibold text-[#7B8CA6] uppercase tracking-wide">
          Value
        </div>
      </div>

      {/* Filas: inputs en 2 columnas + botón Delete a la derecha (fuera del input) */}
      <div className="flex flex-col gap-2 overflow-auto max-h-[700px]">
        {rows.map((r) => (
          <div key={r.id} className="flex items-center gap-2">
            {/* Dos columnas para los inputs */}
            <div className="grid grid-cols-2 gap-3 flex-1">
              <TextInputWithClearButton
                        id={`row-var-${r.id}`}
                        label="" // sin label/placeholder visibles
                        value={r.variable}
                        isSearch={false}
                        onChangeHandler={(e) => onUpdate(r.id, { variable: e.target.value })} placeholder={""}              />
              <TextInputWithClearButton
                        id={`row-val-${r.id}`}
                        label="" // sin label/placeholder visibles
                        value={r.value}
                        isSearch={false}
                        onChangeHandler={(e) => onUpdate(r.id, { value: e.target.value })} placeholder={""}              />
            </div>

            {/* Botón Delete fuera del input de Value */}
            <button
              type="button"
              title="Delete row"
              aria-label="Delete row"
              onClick={() => onRemove(r.id)}
              className="p-2 rounded hover:bg-gray-100 shrink-0"
            >
              <Trash2Icon className="w-5 h-5 text-primary/80" />
            </button>
          </div>
        ))}
      </div>

      {/* Botón al final (dentro del área scrolleable) */}
      <div className="mt-4">
        <button
          type="button"
          onClick={onAdd}
          className="px-4 py-2 rounded-full border border-[#E1E8F0] text-[#0A2342] hover:bg-[#F5F8FB] text-sm"
        >
          + add row
        </button>
      </div>
    </div>
  );
}
