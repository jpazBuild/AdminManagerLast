"use client";

import React from "react";
import { CopyPlus, MoreVertical, Trash2Icon, ChevronUp } from "lucide-react";
import TextInputWithClearButton from "@/app/components/InputClear";

type Props = {
  pkgName: string;
  pkgId: string;
  onChangeName: (v: string) => void;

  checked: boolean;
  onToggleChecked: () => void;

  isCollapsed: boolean;
  toggleCollapse: () => void;

  menuOpen: boolean;
  setMenuOpen: (v: boolean) => void;

  onDuplicate: () => void;
  onDelete: () => void;

  showPackageId?: boolean; // opcional (default true)

  children?: React.ReactNode;
};

export default function PackageCard({
  pkgName,
  pkgId,
  onChangeName,
  checked,
  onToggleChecked,
  isCollapsed,
  toggleCollapse,
  menuOpen,
  setMenuOpen,
  onDuplicate,
  onDelete,
  showPackageId = true,
  children,
}: Props) {
  return (
    <div className="rounded-2xl border border-[#E1E8F0] bg-white p-4">
      {/* Header: checkbox + Package name + acciones */}
      <div className="flex items-center gap-3">
        <input
          type="checkbox"
          className="h-5 w-5 accent-[#0A2342] rounded"
          checked={checked}
          onChange={onToggleChecked}
        />

        {/* ⬇️ Limitar el ancho del Package name en md+ */}
        <div className="flex-1 w-full md:max-w-[560px]">
          <TextInputWithClearButton
            id="pkg-name"
            label="Package name"
            value={pkgName}
            placeholder="Number1"
            isSearch={false}
            onChangeHandler={(e) => onChangeName(e.target.value)}
          />
        </div>

        {/* Chevron */}
        <button
          onClick={toggleCollapse}
          className="p-2 rounded-lg border border-[#E1E8F0] hover:bg-gray-50"
          aria-label="Collapse"
        >
          <ChevronUp
            className={`w-5 h-5 text-primary/80 transition-transform ${
              isCollapsed ? "rotate-180" : ""
            }`}
          />
        </button>

        {/* More options a la derecha */}
        <div className="relative">
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="p-2 rounded-lg border border-[#E1E8F0] hover:bg-gray-50"
            aria-label="More options"
          >
            <MoreVertical className="w-5 h-5 text-primary/80" />
          </button>

          {menuOpen && (
            <div
              className="
                absolute left-full ml-2 top-0
                z-50 w-48 rounded-lg border border-gray-200 bg-white shadow-lg
              "
            >
              <button
                onClick={() => {
                  setMenuOpen(false);
                  onDuplicate();
                }}
                className="flex w-full items-center gap-2 px-4 py-2 text-sm hover:bg-gray-50"
              >
                <CopyPlus className="w-4 h-4 text-primary/80" />
                <span>Duplicate</span>
              </button>

              <button
                onClick={() => {
                  setMenuOpen(false);
                  onDelete();
                }}
                className="flex w-full items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50"
              >
                <Trash2Icon className="w-4 h-4" />
                <span>Delete</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Body scrolleable */}
      {!isCollapsed && (
        <div className="mt-4 max-h-[calc(100vh-280px)] overflow-y-auto pr-2">
          {/* Package ID opcional */}
          {showPackageId && (
            <div className="mb-4">
              <label className="mb-1 block text-sm font-medium text-gray-600">
                Package ID
              </label>
              <input
                className="w-full rounded-xl border border-[#E1E8F0] bg-gray-50 px-3 py-2 text-[#0A2342] shadow-sm"
                value={pkgId}
                readOnly
                aria-readonly="true"
              />
            </div>
          )}

          {/* Slot para Search tags + Variables */}
          {children}

          {/* Espaciador para que no se corte lo último */}
          <div className="h-4" />
        </div>
      )}
    </div>
  );
}
