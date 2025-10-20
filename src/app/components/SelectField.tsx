"use client";

import React, { useEffect, useMemo, useState } from "react";

type Option = { label: string; value: string };
type MaybeOption = Option | string;

type Props = {
  label?: string;
  placeholder?: string;
  options: MaybeOption[];
  value?: string;
  onChange: (value: string) => void;
  onClear?: () => void;
  disabled?: boolean;
  id?: string;
  className?: string;
};

function normalizeOptions(options: MaybeOption[] | undefined | null): Option[] {
  if (!Array.isArray(options)) return [];
  return options.map((opt) => {
    if (typeof opt === "string") {
      const s = String(opt);
      return { label: s, value: s };
    }
    const label = typeof opt.label === "string" ? opt.label : String(opt.label ?? "");
    const value = typeof opt.value === "string" ? opt.value : String(opt.value ?? "");
    return { label, value };
  });
}

export default function SearchField({
  label,
  placeholder = "Search…",
  options,
  value,
  onChange,
  onClear,
  disabled,
  id,
  className,
}: Props) {
  const [open, setOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const normalized = useMemo(() => normalizeOptions(options), [options]);

  const selectedOption = useMemo(
    () => normalized.find((opt) => opt.value === (value ?? "")) || null,
    [normalized, value]
  );

  const filteredOptions = useMemo(() => {
    const q = (searchTerm || "").toLowerCase();
    if (!q) return normalized;
    return normalized.filter((opt) => opt.label.toLowerCase().includes(q));
  }, [normalized, searchTerm]);

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange("");
    setSearchTerm("");
    onClear?.();
  };

  useEffect(() => {
    if (!value) setSearchTerm("");
  }, [value]);

  return (
    <div className={className}>
      {label && (
        <label htmlFor={id} className="mb-1 block text-sm font-medium text-gray-600">
          {label}
        </label>
      )}

      <div className="relative">
        <input
          id={id}
          className="w-full rounded-xl border border-[#E1E8F0] bg-white px-3 py-2 text-[#0A2342] shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
          placeholder={placeholder}
          disabled={disabled}
          value={selectedOption ? selectedOption.label : searchTerm}
          onFocus={() => setOpen(true)}
          onChange={(e) => {
            const text = e.target.value;
            setSearchTerm(text);
            setOpen(true);
            if (text === "") onChange("");
          }}
        />

        {(value || searchTerm) && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            aria-label="Clear"
          >
            ×
          </button>
        )}

        {open && (
          <div className="absolute z-20 mt-1 w-full rounded-lg border border-gray-200 bg-white shadow-lg max-h-56 overflow-auto">
            {filteredOptions.length === 0 ? (
              <div className="px-3 py-2 text-sm text-gray-500">No results</div>
            ) : (
              filteredOptions.map((opt) => (
                <button
                  key={opt.value + opt.label}
                  type="button"
                  className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-50 ${
                    value === opt.value ? "bg-gray-50" : ""
                  }`}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => {
                    onChange(opt.value);
                    setSearchTerm(opt.label);
                    setOpen(false);
                  }}
                >
                  {opt.label}
                </button>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}
