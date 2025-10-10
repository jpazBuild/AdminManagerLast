"use client";

import React from "react";
import TextInputWithClearButton from "@/app/components/InputClear";
import {
  ChevronDown,
  ChevronRight,
  MoreVertical,
  CopyPlus,
  Trash2Icon,
} from "lucide-react";

type Props = {
  showPackageId?: boolean; // por defecto false
  pkgName: string;
  onChangeName: (v: string) => void;

  checked: boolean;
  onToggleChecked: () => void;

  isCollapsed: boolean;
  toggleCollapse: () => void;

  menuOpen: boolean;
  setMenuOpen: (v: boolean) => void;

  onDuplicate: () => void;
  onDelete: () => void;

  /** ✅ Nuevo: renderiza contenido extra en el header (p.ej. Search tags) */
  headerExtras?: React.ReactNode;

  children: React.ReactNode;
};

export default function PackageCard({
  showPackageId = false,
  pkgName,
  onChangeName,
  checked,
  onToggleChecked,
  isCollapsed,
  toggleCollapse,
  menuOpen,
  setMenuOpen,
  onDuplicate,
  onDelete,
  headerExtras,
  children,
}: Props) {
  return (
    <div className="rounded-2xl border border-[#E1E8F0] bg-white">
      {/* Header */}
      <div className="p-4 border-b border-[#E1E8F0]">
        <div className="flex items-center gap-3">
          {/* Checkbox */}
          <input
            type="checkbox"
            className="h-5 w-5 accent-[#0A2342] rounded"
            checked={checked}
            onChange={onToggleChecked}
          />

          {/* Chevron */}
          <button
            onClick={toggleCollapse}
            className="p-1 rounded hover:bg-gray-100"
            aria-label={isCollapsed ? "Expand" : "Collapse"}
          >
            {isCollapsed ? (
              <ChevronRight className="w-5 h-5 text-gray-600" />
            ) : (
              <ChevronDown className="w-5 h-5 text-gray-600" />
            )}
          </button>

          {/* Package name (grow) */}
          <div className="flex-1">
            <TextInputWithClearButton
              id="pkg-name"
              label="Package name"
              value={pkgName}
              placeholder="Number1"
              isSearch={false}
              onChangeHandler={(e) => onChangeName(e.target.value)}
            />
          </div>

          {/* ✅ Extras (Search tags) en la MISMA FILA */}
          {headerExtras && <div className="shrink-0">{headerExtras}</div>}

          {/* More options */}
          <div className="relative">
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="p-2 rounded-full hover:bg-gray-100"
              aria-haspopup="menu"
              aria-expanded={menuOpen}
            >
              <MoreVertical className="h-5 w-5 text-gray-600" />
            </button>

            {menuOpen && (
              <div className="absolute right-0 mt-2 w-44 rounded-lg border border-gray-200 bg-white shadow-lg z-40">
                <button
                  onClick={() => {
                    onDuplicate();
                    setMenuOpen(false);
                  }}
                  className="flex items-center gap-2 w-full px-4 py-2 text-sm text-[#0A2342] hover:bg-gray-50"
                >
                  <CopyPlus className="w-4 h-4" /> Duplicate
                </button>
                <button
                  onClick={() => {
                    onDelete();
                    setMenuOpen(false);
                  }}
                  className="flex items-center gap-2 w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                >
                  <Trash2Icon className="w-4 h-4" /> Delete
                </button>
              </div>
            )}
          </div>
        </div>

        {/* ❌ Oculto: Package ID */}
        {showPackageId && (
          <div className="mt-4">
            <label className="mb-1 block text-sm font-medium text-gray-600">
              Package ID
            </label>
            <input
              className="w-full rounded-xl border border-[#E1E8F0] bg-gray-50 px-3 py-2 text-[#0A2342] shadow-sm"
              readOnly
              aria-readonly="true"
              value={"<READONLY_ID>"}
            />
          </div>
        )}
      </div>

      {/* Contenido con scroll para variables */}
      {!isCollapsed && (
        <div className="p-4 max-h-[60vh] overflow-auto">{children}</div>
      )}
    </div>
  );
}
