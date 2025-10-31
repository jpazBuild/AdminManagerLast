import React, { useState, useEffect, useRef } from "react";
import { X, ChevronDown, Check, Search } from "lucide-react";
import { useLockScrollBubbling } from "../hooks/useLockScrollBubbling";

interface SelectOption {
  label: string;
  value: string;
}

interface TagSelectorProps {
  id?: string;
  label?: string;
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  textColorLabel?: string;
  darkMode?: boolean;
  widthComponent?: string;
  showSearch?: boolean;
  customDarkColor?: string;
}

export const SearchField = ({
  id,
  label,
  value,
  onChange,
  options,
  placeholder = "Select an option",
  className = "",
  disabled = false,
  textColorLabel = "text-primary/90",
  darkMode = false,
  widthComponent = "w-full",
  showSearch = true,
  customDarkColor="bg-gray-800"
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
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
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
      <div className={`flex flex-col gap-2 ${widthComponent} relative`} ref={wrapperRef}>
        <div
          id={id}
          onClick={() => !disabled && setOpen(true)}
          className={[
            "flex items-center justify-between w-full px-3 rounded-xl text-sm cursor-pointer transition-all duration-200 z-20",
            selectedOption ? "py-2" : "py-3",
            disabled ? "opacity-50 cursor-not-allowed" : "",
            open
              ? darkMode
                ? `${customDarkColor} border border-transparent`
                : "bg-primary/15 border border-transparent"
              : darkMode
              ? `${customDarkColor} border border-transparent`
              : "bg-primary/10 border border-transparent",
            className,
          ].join(" ")}
        >
          <div className="truncate">
            {selectedOption ? (
              <div className="flex flex-col gap-0.5">
                {label && (
                  <span className={`text-xs font-medium ${darkMode ? "text-white":""} ${textColorLabel}`}>
                    {label}
                  </span>
                )}
                <span className={`font-medium ${darkMode ? "text-white" : "text-primary/90"}`}>
                  {selectedOption.label}
                </span>
              </div>
            ) : (
              <div className="flex flex-col gap-1">
                {label && (
                  <span className={`text-xs font-medium ${darkMode ? "text-white" : "text-primary/90"} ${textColorLabel}`}>
                    {label}
                  </span>
                )}
                <span className={`${darkMode ? "text-white/60" : "text-primary/50"} font-medium`}>
                  {placeholder}
                </span>
              </div>
            )}
          </div>

          {value ? (
            <X
              className={`ml-2 h-4 w-4 flex-shrink-0 ${darkMode ? "text-white/60 hover:text-white" : "text-primary/50 hover:text-primary/70"}`}
              onClick={handleClear}
            />
          ) : (
            <ChevronDown
              className={`ml-2 h-4 w-4 flex-shrink-0 transition-transform ${open ? "rotate-180" : ""} ${darkMode ? "text-white/60" : "text-primary/40"}`}
            />
          )}
        </div>

        {open && !isMobile && (
          <div
            className={[
              "absolute top-[calc(100%+0.25rem)] left-0 w-full z-50 rounded-xl border shadow-lg overflow-hidden",
              darkMode ? "bg-gray-900 border-white/15" : "bg-white border-gray-200",
            ].join(" ")}
            onClick={(e) => e.stopPropagation()}
          >
            {showSearch && (
              <div
                className={[
                  "flex items-center border-b",
                  darkMode ? "border-white/10 bg-gray-900" : "bg-primary/15 border-transparent",
                ].join(" ")}
              >
                <Search className={`h-5 w-5 ml-4 ${darkMode ? "text-white/60" : "text-primary/60"}`} />
                <input
                  type="text"
                  placeholder="Search options..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className={[
                    "w-full px-4 py-3 text-sm outline-none",
                    darkMode
                      ? "bg-gray-900 text-white placeholder-white/50"
                      : "bg-transparent text-primary placeholder:text-primary/60",
                  ].join(" ")}
                />
              </div>
            )}

            <div
              className={`max-h-60 overflow-y-auto ${darkMode ? "bg-gray-900" : "bg-white"}`}
              style={{ scrollbarGutter: "stable" }}
            >
              {filteredOptions?.length === 0 ? (
                <div className={`p-3 text-center text-sm ${darkMode ? "text-white/60" : "text-gray-500"}`}>
                  No options found
                </div>
              ) : (
                <div className="p-1 flex flex-col gap-1.5">
                  {filteredOptions?.map((opt, index) => {
                    const selected = value === opt.value;
                    return (
                      <button
                        key={`${opt.value}-${opt.label}-${index}`}
                        id={`option-${opt.value}`}
                        onClick={() => handleSelect(opt.value)}
                        className={[
                          "w-full flex items-center justify-between px-4 py-3 rounded-lg text-left text-sm transition-colors focus:outline-none focus:ring-2",
                          darkMode
                            ? `text-white hover:bg-white/10 focus:ring-white/20 ${selected ? "bg-white/10" : ""}`
                            : `text-gray-800 hover:bg-primary/10 focus:ring-primary/40 ${selected ? "bg-gray-100" : ""}`,
                        ].join(" ")}
                      >
                        <span className={selected ? "font-medium" : ""}>{opt.label}</span>
                        {selected && <Check className={`h-4 w-4 ${darkMode ? "text-white/90" : "text-primary"}`} />}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {open && isMobile && (
        <div
          ref={scrollSearchField}
          className={`fixed inset-0 z-50 ${darkMode ? "bg-black/70" : "bg-black/40"} flex items-end justify-center`}
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setOpen(false);
              setIsKeyboardOpen(false);
            }
          }}
        >
          <div
            className={[
              "w-full mx-2 rounded-2xl overflow-hidden animate-in slide-in-from-bottom-4 duration-300 shadow-2xl",
              darkMode ? "bg-[#0B0E11] text-white border border-white/15" : "bg-white text-primary",
            ].join(" ")}
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

            <div
              className={`flex items-center justify-between px-6 py-4 border-b ${
                darkMode ? "border-white/15 bg-[#0F1318] text-white" : "border-primary/20 bg-primary/10 text-primary"
              }`}
            >
              <h3 className="text-lg font-semibold">{label || "Select option"}</h3>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setOpen(false);
                  setIsKeyboardOpen(false);
                }}
                className={`p-2 rounded-full transition-colors ${darkMode ? "hover:bg-white/10" : "hover:bg-primary/20"}`}
              >
                <X className={`h-5 w-5 ${darkMode ? "text-white/70" : "text-primary/80"}`} />
              </button>
            </div>

            <div className={`px-6 py-3 border-b ${darkMode ? "border-white/15" : "border-primary/20"}`}>
              <div className="flex items-center gap-2">
                <Search className={`h-5 w-5 ${darkMode ? "text-white/60" : "text-primary/70"}`} />
                <input
                  ref={inputRef}
                  type="text"
                  placeholder="Search..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className={`w-full px-3 py-2 rounded-lg text-base outline-none ${
                    darkMode
                      ? "bg-[#0F1318] text-white placeholder-white/50 border border-white/15"
                      : "bg-white text-primary placeholder:text-primary/60 border border-primary/20"
                  }`}
                  onFocus={handleFocus}
                  onBlur={handleBlur}
                  spellCheck={false}
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto px-4 py-2">
              {filteredOptions.length === 0 ? (
                <div className="p-6 text-center">
                  <p className={`text-base ${darkMode ? "text-white/60" : "text-primary/60"}`}>No options found</p>
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  {filteredOptions.map((opt, index) => {
                    const selected = value === opt.value;
                    return (
                      <button
                        key={`${opt.value}-${opt.label}-${index}`}
                        type="button"
                        onClick={() => handleSelect(opt.value)}
                        className={[
                          "w-full flex items-center justify-between p-3 rounded-xl min-h-[2.5rem] transition-all duration-200",
                          darkMode ? "hover:bg-white/10" : "hover:bg-primary/10",
                          selected
                            ? darkMode
                              ? "bg-white/10 border border-white/15"
                              : "bg-primary/10 border border-primary/20"
                            : "",
                        ].join(" ")}
                      >
                        <span className={`text-base ${selected ? "font-medium" : ""}`}>{opt.label}</span>
                        {selected && <Check className={`h-5 w-5 ${darkMode ? "text-white/90" : "text-primary/90"}`} />}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};
