"use client";

import React from "react";
import TextInputWithClearButton from "@/app/components/InputClear";
import { Trash2Icon } from "lucide-react";
import { Row } from "../types";

type Props = {
  rows: Row[];
  onUpdate: (rowId: string, patch: Partial<Row>) => void;
  onRemove: (rowId: string) => void;
  onAdd: () => void;
};

export default function VariablesList({ rows, onUpdate, onRemove, onAdd }: Props) {
  return (
    <div className="w-full">
      {/* Encabezados Variable / Value */}
      <div className="grid grid-cols-12 gap-2 mb-2">
        <div className="col-span-6 text-sm font-medium text-gray-600">Variable</div>
        <div className="col-span-6 text-sm font-medium text-gray-600">Value</div>
      </div>

      {/* Filas */}
      <div className="flex flex-col gap-2">
        {rows.map((r) => (
          <div key={r.id} className="grid grid-cols-12 gap-2 items-center">
            <div className="col-span-6">
              <TextInputWithClearButton
                id={`var-${r.id}`}
                label=""
                value={r.variable}
                isSearch={false}
                onChangeHandler={(e) => onUpdate(r.id, { variable: e.target.value })} placeholder={""}              />
            </div>
            <div className="col-span-5">
              <TextInputWithClearButton
                id={`val-${r.id}`}
                label=""
                value={r.value}
                isSearch={false}
                onChangeHandler={(e) => onUpdate(r.id, { value: e.target.value })} placeholder={""}              />
            </div>
            <div className="col-span-1 flex justify-end">
              <button
                onClick={() => onRemove(r.id)}
                className="p-2"
                title="Delete row"
              >
                <Trash2Icon className="w-5 h-5 text-primary/80" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Botón sticky al fondo (dentro de la card scrolleable) */}
      <div className="sticky bottom-0 bg-white pt-2 mt-3 border-t border-[#E1E8F0]">
        <button
          onClick={onAdd}
          className="inline-flex items-center gap-2 rounded-full border border-[#E1E8F0] px-4 py-2 text-[#0A2342] hover:bg-[#F5F8FB]"
        >
          + add row
        </button>
      </div>
    </div>
  );
}
