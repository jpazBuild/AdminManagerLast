"use client";

import React, { useEffect, useRef, useState } from "react";
import { MoreVertical, Copy, Trash2 } from "lucide-react";

type MoreMenuProps = {
    onDuplicate?: () => void;
    onDelete?: () => void;
    disabled?: boolean;
    className?: string;
    darkMode?: boolean;
};

const MoreMenu: React.FC<MoreMenuProps> = ({ onDuplicate, onDelete, disabled, className,darkMode }) => {
    const [open, setOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const onDocClick = (e: MouseEvent) => {
            if (!ref.current) return;
            if (!ref.current.contains(e.target as Node)) setOpen(false);
        };
        const onEsc = (e: KeyboardEvent) => {
            if (e.key === "Escape") setOpen(false);
        };
        document.addEventListener("mousedown", onDocClick);
        document.addEventListener("keydown", onEsc);
        return () => {
            document.removeEventListener("mousedown", onDocClick);
            document.removeEventListener("keydown", onEsc);
        };
    }, []);

    const itemBase = darkMode ? "flex items-center gap-2 w-full px-3 py-2 text-sm rounded-md hover:bg-gray-700 focus:bg-gray-700 focus:outline-none" :
        "flex items-center gap-2 w-full px-3 py-2 text-sm rounded-md hover:bg-gray-50 focus:bg-gray-50 focus:outline-none";

    return (
        <div ref={ref} className={`relative ${className ?? ""}`}>
            <button
                type="button"
                aria-haspopup="menu"
                aria-expanded={open}
                onClick={() => !disabled && setOpen((o) => !o)}
                className={`cursor-pointer h-9 w-9 grid place-items-center rounded-xl ${darkMode ? "bg-gray-800 text-white hover:bg-gray-700":"bg-gray-100 text-primary hover:bg-gray-200 "} transition ${disabled ? "opacity-50 cursor-not-allowed" : ""
                    }`}
            >
                <MoreVertical className="w-4 h-4" />
            </button>

            {open && (
                <div
                    role="menu"
                    className={`absolute right-0 mt-2 w-40 rounded-md shadow-lg z-50 ${darkMode ? "bg-gray-800":"bg-white"} border ${darkMode ? "border-gray-700":"border-gray-200"}`}
                >
                    {onDuplicate && (
                        <button
                            role="menuitem"
                            className={itemBase + " text-gray-700"}
                            onClick={() => {
                                setOpen(false);
                                onDuplicate?.();
                            }}
                        >
                            <Copy className="w-4 h-4 text-primary" />
                            <span>Duplicate</span>
                        </button>
                    )}


                    <button
                        role="menuitem"
                        className={itemBase +"cursor-pointer"+ "text-red-600"}
                        onClick={() => {
                            setOpen(false);
                            onDelete?.();
                        }}
                    >
                        <Trash2 className="w-4 h-4" />
                        <span>Delete</span>
                    </button>
                </div>
            )}
        </div>
    );
};

export default MoreMenu;
