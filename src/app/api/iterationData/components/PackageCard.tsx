// app/api/iterationData/components/PackageCard.tsx
"use client";

import { ChevronDown, ChevronUp, MoreVertical, CopyPlus, Trash2 } from "lucide-react";
import TextInputWithClearButton from "@/app/components/InputClear";
import { ReactNode } from "react";

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

  children: ReactNode; // TagPicker + VariablesList
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
  children,
}: Props) {
  return (
    // Scroll en TODA la card (incluye name, id, tags y variables)
    <div className="w-full h-full rounded-xl border border-primary/10 bg-white p-4 pb-6 overflow-y-auto overflow-x-hidden">
      {/* HEADER: una sola fila (checkbox | Package name | chevron | more) */}
      <div className="flex items-center gap-3 mb-3">
        {/* checkbox */}
        <input
          type="checkbox"
          className="h-5 w-5 accent-[#0A2342] rounded shrink-0"
          checked={checked}
          onChange={onToggleChecked}
          aria-label="Select package"
          title="Select package"
        />

        {/* Package name (ocupa todo el ancho disponible) */}
        <div className="flex-1">
          <TextInputWithClearButton
                      id="pkg-name"
                      label="Package name"
                      value={pkgName}
                      isSearch={false}
                      onChangeHandler={(e) => onChangeName(e.target.value)} placeholder={""}          />
        </div>

        {/* chevron */}
        <button
          onClick={toggleCollapse}
          className="inline-flex items-center justify-center rounded-md border border-primary/10 w-9 h-9 text-primary/80 hover:bg-primary/5 transition shrink-0"
          aria-expanded={!isCollapsed}
          aria-controls="vars-panel"
          aria-label={isCollapsed ? "Expand" : "Collapse"}
          title={isCollapsed ? "Expand" : "Collapse"}
          type="button"
        >
          {isCollapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
        </button>

        {/* more options */}
        <div className="relative shrink-0">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setMenuOpen(!menuOpen);
            }}
            className="inline-flex items-center justify-center rounded-md border border-primary/10 w-9 h-9 text-primary/80 hover:bg-primary/5 transition"
            aria-haspopup="menu"
            aria-expanded={menuOpen}
            title="More options"
            type="button"
          >
            <MoreVertical className="w-4 h-4" />
          </button>

          {menuOpen && (
            <div
              className="absolute right-0 mt-2 w-44 rounded-lg border border-gray-200 bg-white shadow-lg z-10"
              role="menu"
            >
              <button
                onClick={onDuplicate}
                className="w-full px-4 py-2 text-left text-sm text-[#0A2342] hover:bg-gray-50 flex items-center gap-2"
                role="menuitem"
                type="button"
              >
                <CopyPlus className="w-4 h-4" /> Duplicate
              </button>
              <button
                onClick={onDelete}
                className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                role="menuitem"
                type="button"
              >
                <Trash2 className="w-4 h-4" /> Delete
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Package ID (mismo estilo visual, SOLO LECTURA) */}
      <div className="mb-4">
        {/* Opción preferida: readOnly (mantiene el estilo, permite seleccionar/copiar) */}
        {/* <TextInputWithClearButton
                  id="pkg-id"
                  label="Package ID"
                  value={pkgId}
                  isSearch={false}
                  onChangeHandler={() => { } }
                  readOnly
                  aria-readonly="true" placeholder={""}        /> */}
        {/* Fallback si tu InputClear NO soporta readOnly:
        <TextInputWithClearButton
          id="pkg-id"
          label="Package ID"
          value={pkgId}
          isSearch={false}
          onChangeHandler={() => {}}
          disabled
          aria-readonly="true"
          readOnly
          aria-readonly="true"
        />
        */}
      </div>

      {/* CONTENIDO (Search tags + Variables, etc.) */}
      <div id="vars-panel" className={`${isCollapsed ? "" : ""} pr-1`}>
        {children}
      </div>
    </div>
  );
}
