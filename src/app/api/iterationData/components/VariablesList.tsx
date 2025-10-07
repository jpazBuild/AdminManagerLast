"use client";
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
    <div className="rounded-xl border border-primary/10 bg-white p-4">
      <h3 className="text-base font-medium text-primary/80 mb-3">Variables</h3>

      <div className="max-h-[60vh] overflow-y-auto pr-2">
        <div className="flex flex-col gap-2">
          {rows.map((r) => (
            <div key={r.id} className="flex items-center gap-2">
              <TextInputWithClearButton
                id={`row-var-${r.id}`}
                label="Variable"
                value={r.variable}
                placeholder="description / tagNames / createdByName ..."
                isSearch={false}
                onChangeHandler={(e) => onUpdate(r.id, { variable: e.target.value })}
              />
              <TextInputWithClearButton
                id={`row-val-${r.id}`}
                label="Value"
                value={r.value}
                placeholder="value"
                isSearch={false}
                onChangeHandler={(e) => onUpdate(r.id, { value: e.target.value })}
              />
              <button className="px-2" onClick={() => onRemove(r.id)} title="Delete row">
                <Trash2Icon className="w-5 h-5 text-primary/80" />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* botón al final */}
      <div className="flex justify-start mt-4">
        <button
          className="px-4 py-2 rounded-full border border-[#E1E8F0] text-[#0A2342] hover:bg-[#F5F8FB] text-sm"
          onClick={onAdd}
        >
          + add row
        </button>
      </div>
    </div>
  );
}
