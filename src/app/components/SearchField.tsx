import React, { useState, useEffect, useRef } from "react";
import { X, ChevronDown, Check } from "lucide-react";
import { useLockScrollBubbling } from "../hooks/useLockScrollBubbling";

interface SelectOption {
  label: string;
  value: string;
}

interface TagSelectorProps {
  label?: string;
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  textColorLabel?: string;
  darkMode?: boolean;
}

export const SearchField = ({
  label,
  value,
  onChange,
  options,
  placeholder = "Select a tag",
  className = "",
  disabled = false,
  textColorLabel = "text-primary/90",
  darkMode = false,
}: TagSelectorProps) => {
  const [open, setOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [isMobile, setIsMobile] = useState(false);
  const [isKeyboardOpen, setIsKeyboardOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const scrollSearchField = useRef<HTMLDivElement>(null!);

  useLockScrollBubbling(scrollSearchField);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  useEffect(() => {
    document.body.style.overflow = open && isMobile ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open, isMobile]);

  useEffect(() => {
    if (open && isMobile && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [open, isMobile]);

  const handleFocus = () => setIsKeyboardOpen(true);
  const handleBlur = () => setTimeout(() => setIsKeyboardOpen(false), 300);

  const selectedOption = options?.find((opt) => opt.value === value);
  const filteredOptions = options.filter((opt) =>
    opt.label.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange("");
    setOpen(false);
  };

  useEffect(() => {
    if (!open || isMobile) return;
    function handleClickOutside(event: MouseEvent) {
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside, true);
    return () => document.removeEventListener("mousedown", handleClickOutside, true);
  }, [open, isMobile]);

  const handleSelect = (optionValue: string) => {
    onChange(optionValue);
    setOpen(false);
    setSearchTerm("");
    setIsKeyboardOpen(false);
  };

  return (
    <>
      <div className="flex flex-col gap-2 w-full relative" ref={wrapperRef}>
        {label && (
          <label className={`font-medium text-sm ${darkMode ? "text-white/90" : "text-primary"} ${textColorLabel}`}>
            {label}
          </label>
        )}
        <div
          onClick={() => !disabled && setOpen(true)}
          className={`
            flex items-center justify-between w-full px-4 py-3 
            border rounded-xl text-sm cursor-pointer 
            shadow-sm hover:shadow-md transition-all duration-200
            ${!value ? "text-primary/50" : "text-white"}
            ${disabled ? "opacity-50 cursor-not-allowed" : "hover:border-gray-300"}
            ${open ? (darkMode ? "!bg-white/10 backdrop-blur-md border-white/30" : "border-primary/50") : ""}
            ${darkMode
              ? "!bg-white/10 backdrop-blur-md border-white/20 text-white shadow-xl"
              : "bg-white border-gray-300 text-primary/90"}
            ${className}
          `}
        >
          <span className={`truncate ${darkMode ? "text-white" : "text-primary/90"}`}>
            {selectedOption ? selectedOption.label : placeholder}
          </span>
          {value ? (
            <X
              className="ml-2 h-4 w-4 text-white hover:text-gray-300 flex-shrink-0"
              onClick={handleClear}
            />
          ) : (
            <ChevronDown
              className={`ml-2 h-4 w-4 text-white flex-shrink-0 transition-transform ${open ? "rotate-180" : ""
                }`}
            />
          )}
        </div>


        {open && !isMobile && (
          <div
            className={`
      absolute top-full left-0 right-0 mt-1 z-[99] max-h-60 overflow-hidden rounded-xl border shadow-xl animate-in slide-in-from-top-4
      ${darkMode
                ? "border-white/20 bg-white/10 backdrop-blur-md text-white shadow-2xl"
                : "bg-white border-gray-300 text-primary/90"}
    `}
          >
            <div className={`p-3 border-b ${darkMode ? "border-white/10" : "border-gray-200"}`}>
              <input
                type="text"
                placeholder="Search options..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onClick={(e) => e.stopPropagation()}
                className={`
          w-full pl-3 pr-4 py-2 rounded-lg text-sm outline-none
          ${darkMode
                    ? "bg-white/10 backdrop-blur-sm text-white border border-white/20 placeholder-white/50"
                    : "bg-white text-gray-900 border border-gray-300"}
        `}
                autoFocus
              />
            </div>

            <div className={`max-h-40 overflow-y-auto ${darkMode ? "bg-transparent" : "bg-white"}`}>
              {filteredOptions?.length === 0 ? (
                <div className="p-3 text-center text-sm opacity-60">
                  No options found
                </div>
              ) : (
                <div className="p-1 flex flex-col gap-2">
                  {filteredOptions?.map((opt, index) => (
                    <button
                      key={`${opt.value}-${opt.label}-${index}`}
                      onClick={() => handleSelect(opt.value)}
                      className={`
                w-full flex items-center justify-between p-2 rounded-lg text-left text-sm
                transition-colors
                ${darkMode
                          ? "hover:bg-white/20 backdrop-blur-sm"
                          : "hover:bg-primary/30"}
                ${value === opt.value
                          ? (darkMode ? "bg-white/20 backdrop-blur-sm" : "bg-primary/20")
                          : ""}
              `}
                    >
                      <span
                        className={`${value === opt.value
                          ? " font-medium"
                          : darkMode ? "text-white" : "text-gray-800"
                          }`}
                      >
                        {opt.label}
                      </span>
                      {value === opt.value && (
                        <Check className="h-4 w-4 text-white/80" />
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

      </div>

      {open && isMobile && (
        <div
          ref={scrollSearchField}
          className="fixed inset-0 z-50 bg-primary/40 backdrop-blur-sm flex items-end justify-center"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setOpen(false);
              setIsKeyboardOpen(false);
            }
          }}
        >
          <div
            className={`w-full mx-2 rounded-2xl overflow-hidden animate-in slide-in-from-bottom-4 duration-300 shadow-2xl
              ${darkMode
                ? "bg-white/10 backdrop-blur-xl text-white border border-white/20"
                : "bg-white text-primary"}
            `}
            style={{
              height: isKeyboardOpen ? "95vh" : "60vh",
              maxWidth: 480,
              transition: "height .25s cubic-bezier(.4,0,.2,1)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-center py-3">
              <div className={`w-10 h-1 rounded-full ${darkMode ? "bg-white/30" : "bg-primary/30"}`} />
            </div>

            <div className={`flex items-center justify-between px-6 py-4 border-b ${darkMode ? "border-white/20" : "border-primary/20"}`}>
              <h3 className="text-lg font-semibold">
                {label || "Select Option"}
              </h3>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setOpen(false);
                  setIsKeyboardOpen(false);
                }}
                className={`p-2 rounded-full transition-colors ${darkMode ? "hover:bg-white/20" : "hover:bg-primary/30"}`}
              >
                <X className={`h-5 w-5 ${darkMode ? "text-white/50" : "text-primary/50"}`} />
              </button>
            </div>

            <div className={`px-6 py-3 border-b ${darkMode ? "border-white/20" : "border-primary/20"}`}>
              <input
                ref={inputRef}
                type="text"
                placeholder="Search..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={`w-full pl-3 pr-4 py-2 rounded-lg text-base outline-none
                  ${darkMode
                    ? "bg-white/10 backdrop-blur-sm text-white border border-white/20 placeholder-white/50"
                    : "bg-white text-primary border border-primary/20"}
                `}
                onFocus={handleFocus}
                onBlur={handleBlur}
                spellCheck={false}
              />
            </div>

            <div className="flex-1 overflow-y-auto px-4 py-2">
              {filteredOptions.length === 0 ? (
                <div className="p-6 text-center">
                  <p className="text-base opacity-60">No options found</p>
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  {filteredOptions.map((opt, index) => (
                    <button
                      key={`${opt.value}-${opt.label}-${index}`}
                      type="button"
                      onClick={() => handleSelect(opt.value)}
                      className={`
                        w-full flex items-center justify-between p-2 rounded-xl min-h-[2.5rem]
                        transition-all duration-200
                        ${darkMode
                          ? "hover:bg-white/20 backdrop-blur-sm"
                          : "hover:bg-primary/40"}
                        ${value === opt.value
                          ? (darkMode
                            ? "bg-white/20 backdrop-blur-sm border border-white/20"
                            : "bg-primary/30 border border-primary/20")
                          : ""}
                      `}
                    >
                      <span className={`text-base ${value === opt.value ? "font-medium" : ""}`}>
                        {opt.label}
                      </span>
                      {value === opt.value && (
                        <Check className={`h-5 w-5 ${darkMode ? "text-white/90" : "text-primary/90"}`} />
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};