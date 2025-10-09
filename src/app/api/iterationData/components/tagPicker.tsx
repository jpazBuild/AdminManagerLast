"use client";

import { X } from "lucide-react";
import { SearchField } from "@/app/components/SearchField";

type Props = {
  label?: string;
  selected?: string[];   // <- opcional con default
  options?: string[];    // <- opcional con default
  onAdd: (tag: string) => void;
  onRemove: (tag: string) => void;
};

export default function TagPicker({
  label = "Search tags",
  selected = [],        // <- default para evitar undefined.includes
  options = [],         // <- default para evitar map sobre undefined
  onAdd,
  onRemove,
}: Props) {
  return (
    <div>
      <label className="mb-1 block text-sm font-medium text-gray-600">{label}</label>

      <div className="rounded-xl border border-[#E1E8F0] bg-white p-2">
        <SearchField
          label=""
          placeholder="Search tags"
          value=""
          onChange={(val: string) => {
            const v = (val || "").trim();
            if (!v) return;
            // evita duplicados y fuera de catálogo
            if (!selected.includes(v) && (options.length === 0 || options.includes(v))) {
              onAdd(v);
            }
          }}
          options={options
            .filter((o) => !selected.includes(o))
            .map((o) => ({ label: o, value: o }))}
        />

        {/* Chips */}
        <div className="flex flex-wrap gap-2 mt-2">
          {selected.map((t) => (
            <span
              key={t}
              className="inline-flex items-center gap-1 rounded-full bg-primary/10 text-primary px-3 py-1 text-sm"
            >
              {t}
              <button
                onClick={() => onRemove(t)}
                className="ml-1 hover:opacity-70"
                title="Remove tag"
                type="button"
              >
                <X className="w-4 h-4" />
              </button>
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
