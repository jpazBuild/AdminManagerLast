"use client";
import { ChevronDown, ChevronUp, MoreVertical } from "lucide-react";
import TextInputWithClearButton from "@/app/components/InputClear";
import { ReactNode } from "react";

type Props = {
  pkgName: string;
  pkgId: string;
  onChangeName: (v: string) => void;
  isCollapsed: boolean;
  toggleCollapse: () => void;
  menuOpen: boolean;
  setMenuOpen: (v: boolean) => void;
  onDuplicate: () => void;
  onDelete: () => void;
  children: ReactNode; // aquí metemos VariablesList
};

export default function PackageCard({
  pkgName, pkgId, onChangeName, isCollapsed, toggleCollapse,
  menuOpen, setMenuOpen, onDuplicate, onDelete, children,
}: Props) {
  return (
    <div className="relative rounded-xl border border-primary/10 bg-white p-4">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 flex-1">
          <TextInputWithClearButton
            id="pkg-name"
            label="Package name"
            value={pkgName}
            placeholder="Number1"
            isSearch={false}
            onChangeHandler={(e) => onChangeName(e.target.value)}
          />
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-600">Package ID</label>
            <input
              className="w-full rounded-xl border border-[#E1E8F0] bg-gray-50 px-3 py-2 text-[#0A2342] shadow-sm"
              value={pkgId}
              readOnly
              aria-readonly="true"
            />
          </div>
        </div>

        <div className="flex items-center gap-2 mt-6 md:mt-0">
          <button
            onClick={toggleCollapse}
            className="inline-flex items-center justify-center rounded-md border border-primary/10 w-9 h-9 text-primary/80 hover:bg-primary/5 transition"
            aria-expanded={!isCollapsed}
            aria-controls="vars-panel"
            aria-label={isCollapsed ? "Expand" : "Collapse"}
            title={isCollapsed ? "Expand" : "Collapse"}
          >
            {isCollapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
          </button>

          <div className="relative">
            <button
              onClick={(e) => { e.stopPropagation(); setMenuOpen(!menuOpen); }}
              className="inline-flex items-center justify-center rounded-md border border-primary/10 w-9 h-9 text-primary/80 hover:bg-primary/5 transition"
              aria-haspopup="menu"
              aria-expanded={menuOpen}
              title="More options"
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
                  className="w-full px-4 py-2 text-left text-sm text-[#0A2342] hover:bg-gray-50"
                  role="menuitem"
                >
                  Duplicate
                </button>
                <button
                  onClick={onDelete}
                  className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50"
                  role="menuitem"
                >
                  Delete
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Acordeón */}
      <div
        id="vars-panel"
        className={`overflow-hidden transition-all duration-300 ${isCollapsed ? "max-h-0 opacity-0" : "max-h-[5000px] opacity-100"}`}
      >
        {children}
      </div>
    </div>
  );
}
