"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { ChevronDown, Search, Settings, SquarePen } from "lucide-react";
import { RiCheckboxCircleFill } from "react-icons/ri";

type Environment = { id: string; name: string; env: Record<string, string> };
type Option = { value: string; label: string };

type Props = {
  environments: Environment[];
  value: string | null;
  onChange: (envId: string | null) => void;
  onEdit: (envId: string) => void;
  onCreateCustom: () => void;
  label?: string;
  widthClass?: string;
  darkMode?: boolean;
};

const EnvSelect: React.FC<Props> = ({
  environments,
  value,
  onChange,
  onEdit,
  onCreateCustom,
  widthClass = "w-48",
  darkMode = false,
}) => {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (!ref.current) return;
      if (!ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const items: Option[] = useMemo(
    () =>
      environments.map((e) => ({
        value: e.id,
        label: e.name || "(unnamed)",
      })),
    [environments]
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter((i) => i.label.toLowerCase().includes(q));
  }, [items, query]);

  const selectedLabel = items.find((i) => i.value === value)?.label ?? "Select environment";

  return (
    <div className={`relative ${widthClass}`} ref={ref}>
      <div
        className={`flex items-center gap-1 px-3 py-2 rounded-full mb-1 text-sm font-medium ${
          darkMode ? "bg-gray-800 text-gray-100" : "bg-primary/20 text-primary"
        }`}
      >
        <Settings className={`w-5 h-5 ${darkMode ? "text-gray-200" : "text-primary"} pointer-events-none`} />
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className={`w-full px-3 rounded-xl text-left flex items-center justify-between font-semibold ${
            darkMode ? "text-gray-100" : "text-primary"
          }`}
        >
          <span className="truncate">{value ? selectedLabel : "Select environment..."}</span>
          <ChevronDown className={`w-4 h-4 opacity-70 ${darkMode ? "text-gray-300" : ""}`} />
        </button>
      </div>

      {open && (
        <div
          className={`absolute z-50 mt-2 w-full rounded-2xl shadow-xl ${
            darkMode ? "border border-gray-700 bg-gray-900" : "border border-gray-200 bg-white"
          }`}
        >
          <div className="p-2">
            <div
              className={`flex items-center gap-2 rounded-lg px-2 ${
                darkMode ? "border border-gray-700 bg-gray-800" : "border border-gray-200 bg-gray-200"
              }`}
            >
              <Search className={`w-4 h-4 ${darkMode ? "text-gray-400" : "opacity-60"}`} />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search..."
                className={`h-9 flex-1 outline-none text-sm ${
                  darkMode ? "bg-transparent text-gray-100 placeholder:text-gray-500" : ""
                }`}
              />
            </div>

            <div className="flex w-full items-center justify-between mt-3">
              <p className={`text-sm ${darkMode ? "text-gray-400" : "text-primary/60"}`}>Select an Environment</p>
              <button
                onClick={() => onCreateCustom()}
                className={`text-sm px-3 py-1.5 cursor-pointer rounded-full font-semibold ${
                  darkMode ? "text-blue-400 hover:text-blue-300" : "text-primary-blue hover:text-primary-blue/90"
                }`}
              >
                Custom
              </button>
            </div>
          </div>

          <div className="max-h-64 overflow-y-auto py-2">
            {filtered.map((opt) => (
              <div
                key={opt.value}
                className={`flex items-center justify-between gap-2 px-3 py-2 ${
                  darkMode ? "hover:bg-gray-800" : "hover:bg-gray-50"
                }`}
              >
                <button
                  className={`flex-1 text-left ${darkMode ? "text-gray-100" : ""}`}
                  onClick={() => {
                    onChange(opt.value);
                    setOpen(false);
                  }}
                >
                  <span className="text-sm">{opt.label}</span>
                </button>
                <div className="flex items-center gap-2">
                  <button
                    title="Edit"
                    onClick={() => onEdit(opt.value)}
                    className={`p-1 rounded ${darkMode ? "hover:bg-gray-800" : "hover:bg-gray-100"}`}
                  >
                    <SquarePen className={`w-4 h-4 ${darkMode ? "text-gray-300" : "text-primary/80"}`} />
                  </button>
                  {opt.value === value && (
                    <RiCheckboxCircleFill className={`${darkMode ? "text-blue-400" : "text-primary"} w-5 h-5`} />
                  )}
                </div>
              </div>
            ))}
            {filtered.length === 0 && (
              <div className={`px-3 py-6 text-sm ${darkMode ? "text-gray-400" : "text-gray-500"}`}>No results</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default EnvSelect;
