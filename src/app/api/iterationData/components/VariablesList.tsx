"use client";

import React from "react";
import TextInputWithClearButton from "@/app/components/InputClear";
import { PlusIcon, Trash2Icon } from "lucide-react";

export type Row = { id: string; variable: string; value: string };

type Props = {
  rows: Row[];
  onUpdate: (rowId: string, patch: Partial<Row>) => void;
  onRemove: (rowId: string) => void;
  onAdd: () => void;
};

const VariablesList: React.FC<Props> = ({ rows, onUpdate, onRemove, onAdd }) => {
  
  return (
    <div className="flex flex-col min-h-0">
      <div className="grid grid-cols-[1fr_1fr_auto] gap-2 mb-2 px-1 items-end">
        <label className="text-xs font-medium text-gray-500">Variable</label>
        <label className="text-xs font-medium text-gray-500">Value</label>
        <span className="text-xs text-transparent select-none">.</span>
      </div>

      <div className="flex flex-col gap-2 pb-16">
        {rows.map((r) => (
          <div key={r.id} className="grid grid-cols-[1fr_1fr_auto] gap-2 items-start">
            <TextInputWithClearButton
              id={`var-${r.id}`}
              label=""
              value={r.variable}
              isSearch={false}
              placeholder=""
              onChangeHandler={(e) => onUpdate(r.id, { variable: e.target.value })}
            />
            <TextInputWithClearButton
              id={`val-${r.id}`}
              label=""
              value={r.value}
              isSearch={false}
              placeholder=""
              onChangeHandler={(e) => onUpdate(r.id, { value: e.target.value })}
            />
            <button
              className="px-2 py-2 self-center"
              onClick={() => onRemove(r.id)}
              title="Delete row"
            >
              <Trash2Icon className="w-5 h-5 text-primary/80" />
            </button>
          </div>
        ))}
      </div>

      <div className="sticky bottom-0 left-0 right-0 border-t border-primary/20 py-2">
        <div className="flex">
          <button
            onClick={onAdd}
            className="items-center cursor-pointer flex gap-2 px-5 py-1.5 font-semibold rounded-full hover:bg-gray-200"
          >
            <PlusIcon className="w-5 h-5"/> Add row
          </button>
        </div>
      </div>
    </div>
  );
};

export default VariablesList;
