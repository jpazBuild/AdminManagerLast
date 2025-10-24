"use client";

import React, { useState, useRef } from "react";
import TextInputWithClearButton from "@/app/components/InputClear";
import { CopyPlus, MoreVertical, Trash2Icon, ChevronUp, ChevronDown } from "lucide-react";

type Props = {
  pkgName: string;
  pkgId?: string;

  onChangeName: (v: string) => void;

  checked: boolean;
  onToggleChecked: () => void;

  isCollapsed: boolean;
  toggleCollapse: () => void;

 
  headerExtras?: React.ReactNode;

  onDuplicate?: () => void;
  onDelete?: () => void;

  children?: React.ReactNode;
};

const PackageCard: React.FC<Props> = ({
  pkgName,
  pkgId,
  onChangeName,
  checked,
  onToggleChecked,
  isCollapsed,
  toggleCollapse,
  headerExtras,
  onDuplicate,
  onDelete,
  children,
}) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

  return (
    <div className="rounded-2xl border border-[#E1E8F0] bg-white overflow-hidden h-full">
      <div className="w-full">
        <div className="px-4 pt-4 grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
          <div className="flex items-start gap-3 min-w-0">
            <button
              type="button"
              aria-label={checked ? "Unselect package" : "Select package"}
              onClick={onToggleChecked}
              className={`mt-1 h-7 w-7 flex items-center justify-center rounded-lg border ${
                checked
                  ? "bg-[#0A2342] border-[#0A2342] text-white"
                  : "bg-white border-[#D8E0EA] text-[#0A2342]"
              }`}
            >
              <span className="text-sm leading-none">✓</span>
            </button>

            <div className="flex-1 min-w-0">
              <TextInputWithClearButton
                id="pkg-name"
                label="Package name"
                value={pkgName}
                placeholder="Number1"
                isSearch={false}
                onChangeHandler={(e) => onChangeName(e.target.value)}
              />
              {pkgId ? (
                <div className="mt-2 text-xs text-gray-500 select-all">{pkgId}</div>
              ) : null}
            </div>
          </div>

          <div className="flex items-start gap-2">
            <div className="flex-1 min-w-0">{headerExtras}</div>

            {(onDuplicate || onDelete) && (
              <div className="relative shrink-0" ref={menuRef}>
                <button
                  type="button"
                  className="p-2 rounded-md hover:bg-gray-100"
                  onClick={() => setMenuOpen((v) => !v)}
                  aria-label="More options"
                >
                  <MoreVertical className="h-5 w-5 text-[#0A2342]" />
                </button>

                {menuOpen && (
                  <div
                    className="absolute right-0 mt-2 w-44 rounded-lg border border-gray-200 bg-white shadow-lg z-30"
                    onMouseLeave={() => setMenuOpen(false)}
                  >
                    {onDuplicate && (
                      <button
                        type="button"
                        onClick={() => {
                          setMenuOpen(false);
                          onDuplicate();
                        }}
                        className="flex w-full items-center gap-2 px-3 py-2 text-sm text-[#0A2342] hover:bg-gray-50"
                      >
                        <CopyPlus className="h-4 w-4" />
                        Duplicate
                      </button>
                    )}
                    {onDelete && (
                      <button
                        type="button"
                        onClick={() => {
                          setMenuOpen(false);
                          onDelete();
                        }}
                        className="flex w-full items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50"
                      >
                        <Trash2Icon className="h-4 w-4" />
                        Delete
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="relative my-4 px-4">
          <hr className="border-[#E6ECF3]" />
          <button
            type="button"
            onClick={toggleCollapse}
            aria-label={isCollapsed ? "Expand" : "Collapse"}
            className="absolute left-1/2 -translate-x-1/2 -top-4 bg-white rounded-full border border-gray-300 w-8 h-8 flex items-center justify-center shadow-sm"
          >
            {isCollapsed ? (
              <ChevronDown className="h-4 w-4 text-[#0A2342]" />
            ) : (
              <ChevronUp className="h-4 w-4 text-[#0A2342]" />
            )}
          </button>
        </div>
      </div>

      {!isCollapsed && (
        <div className="px-4 pb-4 min-h-0 h-full max-h-[70vh]">
          <div className="h-full max-h-full overflow-y-auto pr-1">
            {children}
          </div>
        </div>
      )}
    </div>
  );
};

export default PackageCard;
