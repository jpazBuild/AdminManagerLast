"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { ChevronDown, Search, Settings, SquarePen, Hash } from "lucide-react";
import { RiCheckboxCircleFill } from "react-icons/ri";

type Option = { value: string; label: string };

type Props = {
    options: Array<{ id: string | number; name: string }>;
    value: string | null;
    onChange?: (id: string | null) => void;
    onEdit?: (id: string) => void;
    onCreateCustom?: () => void;
    label?: string;
    widthClass?: string;
    isCustomFlow?: boolean;
    textOptions?: string;
    labelDefault?: string;
    Icon?: React.ReactNode;
    isIterationCount?: boolean;
    minCount?: number;
    maxCount?: number;
    darkMode?: boolean;
};

const SelectInFlows: React.FC<Props> = ({
    options,
    value,
    onChange,
    onEdit,
    onCreateCustom,
    widthClass = "w-48",
    isCustomFlow = false,
    textOptions = "Select an Environment",
    labelDefault = "Select environment",
    Icon = <Settings className="w-5 h-5" />,
    isIterationCount = false,
    minCount = 1,
    maxCount = 100,
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
            options.map((e) => ({
                value: String(e.id),
                label: e.name || "(unnamed)",
            })),
        [options]
    );

    const filtered = useMemo(() => {
        const q = query.trim().toLowerCase();
        if (!q) return items;
        return items.filter((i) => i.label.toLowerCase().includes(q));
    }, [items, query]);

    const selectedLabel = items.find((i) => i.value === value)?.label ?? labelDefault;

    const setCount = (n: number) => {
        const clamped = Math.min(Math.max(n, minCount), maxCount);
        onChange?.(String(clamped));
        setOpen(false);
    };

    const count = value ? Number(value) : null;

    const barCls = darkMode
        ? "bg-gray-800/60 text-gray-100 border border-gray-700"
        : "bg-primary/20 text-primary border border-transparent";
    const clearBtnCls = darkMode ? "text-gray-300 hover:text-white" : "text-primary/70 hover:text-primary/90";
    const panelBase = darkMode
        ? "border-gray-700 bg-gray-800 text-gray-100"
        : "border-gray-200 bg-white text-primary";
    const inputRing = darkMode ? "ring-gray-700 focus:ring-primary text-gray-100 placeholder-gray-400 bg-gray-800" : "ring-gray-200 focus:ring-primary bg-primary/15";
    const quickBtn = (active: boolean) =>
        active
            ? darkMode
                ? "bg-primary text-white border-primary"
                : "bg-primary text-white border-primary"
            : darkMode
                ? "bg-gray-700 hover:bg-gray-600 border-gray-700 text-gray-100"
                : "bg-gray-200 hover:bg-gray-50 border-gray-200 text-primary";
    const searchWrap = darkMode ? "border-gray-700 bg-gray-800" : "border-gray-200 bg-gray-200";
    const searchIcon = darkMode ? "text-gray-300" : "opacity-60";
    const searchInput = darkMode ? "text-sm h-9 flex-1 outline-none bg-transparent text-gray-100 placeholder-gray-400" : "text-sm h-9 flex-1 outline-none bg-transparent";
    const rowHover = darkMode ? "hover:bg-gray-700" : "hover:bg-gray-50";
    const editBtn = darkMode ? "p-1 rounded hover:bg-gray-700" : "p-1 rounded hover:bg-gray-100";
    const customBtn = darkMode ? "text-sm px-3 py-1.5 rounded-full text-primary-blue font-semibold hover:text-primary-blue/90" : "text-sm px-3 py-1.5 rounded-full text-primary-blue font-semibold hover:text-primary-blue/90";

    return (
        <div className={`relative ${widthClass}`} ref={ref}>
            <div className={`flex items-center gap-1 px-3 py-2 rounded-full mb-1 text-sm font-medium ${barCls}`}>
                {Icon}
                <button
                    type="button"
                    onClick={() => setOpen((v) => !v)}
                    className={`w-full px-3 rounded-xl text-left flex items-center justify-between font-semibold ${darkMode ? "text-gray-100" : "text-primary"}`}
                >
                    {isIterationCount ? (
                        <span className="truncate">{count ?? labelDefault}</span>
                    ) : (
                        <span className="truncate">{value ? selectedLabel : `${labelDefault}`}</span>
                    )}
                    {value && (
                        <button
                            type="button"
                            onClick={(e) => {
                                e.stopPropagation();
                                onChange?.(null);
                            }}
                            className={`text-xs mr-2 ${clearBtnCls}`}
                        >
                            ✕
                        </button>
                    )}
                    <ChevronDown className={`w-4 h-4 ${darkMode ? "text-gray-300" : "opacity-70"}`} />
                </button>
            </div>

            {open && isIterationCount && (
                <div className={`absolute z-50 mt-2 rounded-2xl border shadow-xl p-3 w-[22rem] ${panelBase}`}>
                    <div className={`${darkMode ? "bg-gray-900/50" : "bg-gray-100/70"} rounded-2xl px-4 py-4`}>
                        <div className="flex items-center gap-3 mb-2">
                            <Hash className={`w-5 h-5 ${darkMode ? "text-gray-200" : "text-primary/80"}`} />
                            <span className={`text-sm font-semibold ${darkMode ? "text-gray-200" : "text-primary/80"}`}>Iteration count</span>
                        </div>

                        <input
                            type="text"
                            inputMode="numeric"
                            pattern="[0-9]*"
                            className={`w-full rounded-xl px-3 py-2 outline-none ring-1 [appearance:textfield] ${inputRing}`}
                            placeholder={`${minCount}`}
                            value={value ?? ""}
                            onChange={(e) => {
                                const raw = e.target.value.replace(/\D+/g, "");
                                onChange?.(raw);
                            }}
                            onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                    const n = Number(value);
                                    if (value === "" || Number.isNaN(n)) {
                                        onChange?.(String(minCount));
                                    } else {
                                        const clamped = Math.min(Math.max(n, minCount), maxCount);
                                        onChange?.(String(clamped));
                                    }
                                    setOpen(false);
                                }
                            }}
                            onBlur={() => {
                                const n = Number(value);
                                if (value === "" || Number.isNaN(n)) {
                                    onChange?.(String(minCount));
                                } else {
                                    const clamped = Math.min(Math.max(n, minCount), maxCount);
                                    onChange?.(String(clamped));
                                }
                            }}
                        />

                        <div className="mt-3 flex gap-2 flex-wrap">
                            {[1, 5, 10, 20, 50, 100]
                                .filter((n) => n >= minCount && n <= maxCount)
                                .map((n) => (
                                    <button key={n} onClick={() => setCount(n)} className={`px-3 py-1.5 rounded-full text-sm border ${quickBtn(value === String(n))}`}>
                                        {n}
                                    </button>
                                ))}
                        </div>
                    </div>
                </div>
            )}

            {open && !isIterationCount && (
                <div className={`absolute z-50 mt-2 w-full rounded-2xl border shadow-xl ${panelBase}`}>
                    <div className="p-2">
                        <div className={`flex items-center gap-2 rounded-lg border px-2 ${searchWrap}`}>
                            <Search className={`w-4 h-4 ${searchIcon}`} />
                            <input
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                placeholder="Search..."
                                className={searchInput}
                            />
                        </div>

                        <div className="flex w-full items-center justify-between mt-3">
                            <p className={`text-sm ${darkMode ? "text-gray-300" : "text-primary/60"}`}>{textOptions}</p>
                            {isCustomFlow && (
                                <button onClick={() => onCreateCustom?.()} className={customBtn}>
                                    Custom
                                </button>
                            )}
                        </div>
                    </div>

                    <div className="max-h-64 overflow-y-auto py-2">
                        {filtered.map((opt) => (
                            <div key={opt.value} className={`flex items-center justify-between gap-2 px-3 py-2 ${rowHover}`}>
                                <button
                                    className={`flex-1 text-left ${darkMode ? "text-gray-100" : ""}`}
                                    onClick={() => {
                                        onChange?.(opt.value);
                                        setOpen(false);
                                    }}
                                >
                                    <span className="text-sm">{opt.label}</span>
                                </button>
                                {onEdit && (
                                    <div className="flex items-center gap-2">
                                        <button title="Edit" onClick={() => onEdit?.(opt.value)} className={editBtn}>
                                            <SquarePen className={`w-4 h-4 ${darkMode ? "text-gray-200" : "text-primary/80"}`} />
                                        </button>
                                        {opt.value === value && <RiCheckboxCircleFill className={`w-5 h-5 ${darkMode ? "text-white" : "text-primary"}`} />}
                                    </div>
                                )}
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

export default SelectInFlows;
