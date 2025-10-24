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
    Icon = <Settings className="w-5 h-5 text-primary" />,
    isIterationCount = false,
    minCount = 1,
    maxCount = 100,
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

    const selectedLabel =
        items.find((i) => i.value === value)?.label ?? labelDefault;

    const setCount = (n: number) => {
        const clamped = Math.min(Math.max(n, minCount), maxCount);
        onChange?.(String(clamped));
        setOpen(false);
    };

    const count = value ? Number(value) : null;

    return (
        <div className={`relative ${widthClass}`} ref={ref}>
            <div className="flex items-center gap-1 bg-primary/20 px-3 py-2 rounded-full mb-1 text-sm text-primary font-medium">
                {Icon}
                <button
                    type="button"
                    onClick={() => setOpen((v) => !v)}
                    className="w-full px-3 rounded-xl text-left flex items-center justify-between font-semibold"
                >
                    {isIterationCount ? (
                        <span className="truncate">
                            {count ?? labelDefault}
                        </span>
                    ) : (
                        <span className="truncate">
                            {value ? selectedLabel : `${labelDefault}`}
                        </span>
                    )}
                    {value &&(
                        <button
                            type="button"
                            onClick={(e) => {
                                e.stopPropagation();
                                onChange?.(null);
                            }}
                            className="text-xs text-primary/70 hover:text-primary/90 mr-2"
                        >
                            ✕
                        </button>
                    )}
                    <ChevronDown className="w-4 h-4 opacity-70" />
                </button>
            </div>

            {open && isIterationCount && (
                <div className="absolute z-50 mt-2 rounded-2xl border border-gray-200 bg-white shadow-xl p-3 w-[22rem]">
                    <div className="rounded-2xl bg-gray-100/70 px-4 py-4">
                        <div className="flex items-center gap-3 mb-2">
                            <Hash className="w-5 h-5 text-primary/80" />
                            <span className="text-sm font-semibold text-primary/80">
                                Iteration count
                            </span>
                        </div>

                        <input
                            type="text"
                            inputMode="numeric"
                            pattern="[0-9]*"
                            className="w-full rounded-xl bg-primary/15 px-3 py-2 outline-none ring-1 ring-gray-200 focus:ring-primary [appearance:textfield]"
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

                        <div className="mt-3 flex gap-2">
                            {[1, 5, 10, 20, 50, 100]
                                .filter((n) => n >= minCount && n <= maxCount)
                                .map((n) => (
                                    <button
                                        key={n}
                                        onClick={() => setCount(n)}
                                        className={`px-3 py-1.5 rounded-full text-sm border ${value === String(n)
                                                ? "bg-primary text-white border-primary"
                                                : "bg-gray-200 hover:bg-gray-50 border-gray-200 text-primary"
                                            }`}
                                    >
                                        {n}
                                    </button>
                                ))}
                        </div>
                    </div>
                </div>
            )}


            {open && !isIterationCount && (
                <div className="absolute z-50 mt-2 w-full rounded-2xl border border-gray-200 bg-white shadow-xl">
                    <div className="p-2">
                        <div className="flex items-center gap-2 rounded-lg border border-gray-200 px-2 bg-gray-200">
                            <Search className="w-4 h-4 opacity-60" />
                            <input
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                placeholder="Search..."
                                className="h-9 flex-1 outline-none text-sm "
                            />
                        </div>

                        <div className="flex w-full items-center justify-between mt-3">
                            <p className="text-sm text-primary/60">{textOptions}</p>
                            {isCustomFlow && (
                                <button
                                    onClick={() => onCreateCustom?.()}
                                    className=" text-sm px-3 py-1.5 cursor-pointer rounded-full text-primary-blue font-semibold hover:text-primary-blue/90"
                                >
                                    Custom
                                </button>
                            )}
                        </div>
                    </div>

                    <div className="max-h-64 overflow-y-auto py-2">
                        {filtered.map((opt) => (
                            <div
                                key={opt.value}
                                className="flex items-center justify-between gap-2 px-3 py-2 hover:bg-gray-50"
                            >
                                <button
                                    className="flex-1 text-left"
                                    onClick={() => {
                                        onChange?.(opt.value);
                                        setOpen(false);
                                    }}
                                >
                                    <span className="text-sm">{opt.label}</span>
                                </button>
                                {onEdit && (
                                    <div className="flex items-center gap-2">
                                        <button
                                            title="Edit"
                                            onClick={() => onEdit?.(opt.value)}
                                            className="p-1 rounded hover:bg-gray-100"
                                        >
                                            <SquarePen className="w-4 h-4 text-primary/80" />
                                        </button>
                                        {opt.value === value && (
                                            <RiCheckboxCircleFill className="w-5 h-5 text-primary" />
                                        )}
                                    </div>
                                )}
                            </div>
                        ))}
                        {filtered.length === 0 && (
                            <div className="px-3 py-6 text-sm text-gray-500">No results</div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default SelectInFlows;
