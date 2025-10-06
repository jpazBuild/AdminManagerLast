import { CopyPlus, MoreVertical, Trash2Icon, ChevronDown, ChevronUp } from "lucide-react";
import TextInputWithClearButton from "@/app/components/InputClear";
import { Pkg, Row } from "../../iterationData/hooks/usePackages";
import { useState } from "react";

type Props = {
  pkg: Pkg;
  isCollapsed: boolean;
  onToggleCollapse: (id: string) => void;
  onToggleSelected: (id: string) => void;
  onUpdateName: (id: string, name: string) => void;
  onUpdateDesc: (id: string, desc: string) => void;
  onAddRow: (id: string) => void;
  onDelRow: (id: string, i: number) => void;
  onUpdRow: (id: string, i: number, f: keyof Row, v: string) => void;
  onDuplicate: (pkg: Pkg) => void;
  onDelete: (id: string) => void;
};

export default function PackageCard({
  pkg,
  isCollapsed,
  onToggleCollapse,
  onToggleSelected,
  onUpdateName,
  onUpdateDesc,
  onAddRow,
  onDelRow,
  onUpdRow,
  onDuplicate,
  onDelete,
}: Props) {
  const [openMenu, setOpenMenu] = useState(false);

  return (
    <div className="rounded-2xl border border-[#E1E8F0] bg-white p-6">
      <div className="flex items-start gap-3">
        <input
          type="checkbox"
          className="mt-2 h-5 w-5 accent-[#0A2342] rounded"
          checked={pkg.selected}
          onChange={() => onToggleSelected(pkg.id)}
        />

        <div className="flex-1">
          <div className="space-y-2">
            <TextInputWithClearButton
              id={`pkg-name-${pkg.id}`}
              label="Package name"
              value={pkg.name}
              placeholder="Number1"
              onChangeHandler={(e) => onUpdateName(pkg.id, e.target.value)}
              isSearch={false}
            />

            <TextInputWithClearButton
              id={`pkg-desc-${pkg.id}`}
              label="Description"
              value={pkg.description ?? ""}
              placeholder="Add a short description"
              onChangeHandler={(e) => onUpdateDesc(pkg.id, e.target.value)}
              isSearch={false}
            />

            <div>
              <label htmlFor={`pkg-id-${pkg.id}`} className="mb-1 block text-sm font-medium text-gray-600">
                Package ID
              </label>
              <input
                id={`pkg-id-${pkg.id}`}
                value={pkg.id}
                readOnly
                aria-readonly="true"
                className="w-full rounded-xl border border-[#E1E8F0] bg-gray-50 px-3 py-2 text-[#0A2342] shadow-sm"
              />
            </div>
          </div>
        </div>

        <button
          onClick={() => onToggleCollapse(pkg.id)}
          aria-expanded={!isCollapsed}
          className="p-2 rounded-full hover:bg-gray-100"
        >
          {isCollapsed ? <ChevronDown className="h-5 w-5 text-gray-600" /> : <ChevronUp className="h-5 w-5 text-gray-600" />}
        </button>

        <div className="relative">
          <button onClick={() => setOpenMenu((s) => !s)} className="p-2 rounded-full hover:bg-gray-100">
            <MoreVertical className="h-5 w-5 text-gray-600" />
          </button>
          {openMenu && (
            <div className="absolute right-0 mt-2 w-40 rounded-lg border border-gray-200 bg-white shadow-lg z-10">
              <button
                onClick={() => {
                  onDuplicate(pkg);
                  setOpenMenu(false);
                }}
                className="flex items-center gap-2 w-full px-4 py-2 text-sm text-[#0A2342] hover:bg-gray-50"
              >
                <CopyPlus className="w-4 h-4" /> Duplicate
              </button>
              <button
                onClick={() => {
                  onDelete(pkg.id);
                  setOpenMenu(false);
                }}
                className="flex items-center gap-2 w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50"
              >
                <Trash2Icon className="w-4 h-4" /> Delete
              </button>
            </div>
          )}
        </div>
      </div>

      {!isCollapsed && (
        <>
          <div className="mt-4 flex flex-col gap-2">
            {pkg.rows.map((row, i) => (
              <div key={i} className="flex gap-2 items-center">
                <TextInputWithClearButton
                  id={`row-var-${pkg.id}-${i}`}
                  label="Variable"
                  value={row.variable}
                  placeholder="iteration1.urlSite"
                  onChangeHandler={(e) => onUpdRow(pkg.id, i, "variable", e.target.value)}
                  isSearch={false}
                />
                <TextInputWithClearButton
                  id={`row-val-${pkg.id}-${i}`}
                  label="Value"
                  value={row.value}
                  placeholder="https://..."
                  onChangeHandler={(e) => onUpdRow(pkg.id, i, "value", e.target.value)}
                  isSearch={false}
                />
                <button onClick={() => onDelRow(pkg.id, i)} className="px-2">
                  <Trash2Icon className="w-5 h-5 text-primary/80" />
                </button>
              </div>
            ))}
          </div>

          <button
            onClick={() => onAddRow(pkg.id)}
            className="inline-flex items-center gap-2 rounded-full border border-[#E1E8F0] px-4 py-2 text-[#0A2342] hover:bg-[#F5F8FB] mt-3"
          >
            <span className="text-lg">＋</span> Add row
          </button>
        </>
      )}
    </div>
  );
}
