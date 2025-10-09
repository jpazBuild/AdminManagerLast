import React, { useState, useEffect, useRef } from "react";
import { X, ChevronDown, Check, Search } from "lucide-react";
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
  widthComponent?: string;
  showSearch?: boolean;
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
  widthComponent = "w-full",
  showSearch = true,
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
      <div className={`flex flex-col gap-2 ${widthComponent} relative`} ref={wrapperRef}>
        <div
          onClick={() => !disabled && setOpen(true)}
          className={`
            flex items-center justify-between w-full ${selectedOption ? "py-2" : "py-3"} px-3
            border rounded-xl text-sm cursor-pointer 
             transition-all duration-200 z-20 font-normal
            ${!value ? "text-primary/50" : "text-white"}
            ${disabled ? "opacity-50 cursor-not-allowed" : ""}
            ${open ? (darkMode ? "bg-white/20 border-white/30" : "bg-primary/5 border-primary/10") : ""}
            ${darkMode
              ? "bg-white/10 border-white/20 text-white shadow-xl"
              : "bg-primary/10 border-transparent text-primary/80"}
            ${className}
          `}
        >

          <div className={`truncate ${darkMode ? "text-white" : "text-primary/90"}`}>
            {selectedOption ? (
              <div id={`value ${value}`} className="flex flex-col gap-0.5">
                {label && <span className={`text-xs font-medium ${textColorLabel}`}>{label}</span>}
                <span className="font-medium">{selectedOption.label}</span>

              </div>
            ) : (
              <div className="flex flex-col gap-1">
                <span className="font-medium">{placeholder}</span>
              </div>
            )}

          </div>
          {value ? (
            <X
              className="ml-2 h-4 w-4 text-primary/40 hover:text-primary/50 flex-shrink-0"
              onClick={handleClear}
            />
          ) : (
            <ChevronDown
              className={`ml-2 h-4 w-4 text-primary/40 flex-shrink-0 transition-transform ${open ? "rotate-180" : ""
                }`}
            />
          )}
        </div>


        {open && !isMobile && (
          <div
            className={`
      absolute top-[calc(100%+0.25rem)] left-0 w-full z-50 
      rounded-xl border shadow-lg overflow-hidden
      ${darkMode ? "bg-[#101317] border-white/15" : "border-gray-200 bg-white"}
    `}
            onClick={(e) => e.stopPropagation()}
          >
            {showSearch &&(
  <div
              className={`flex items-center border-b top-0 z-20 rounded-md
        ${darkMode ? "border-white/10 bg-[#021d3d]" : "bg-primary/10 border-transparent"}`}
            >
              <Search className={`h-5 w-5 ml-4 ${darkMode ? "text-white/50" : "text-primary/60"}`} />
              <input
                type="text"
                placeholder="Search options..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={`
          w-full px-4 py-3 rounded-lg text-sm outline-none
           ${darkMode
                    ? "bg-[#0B0E11] text-white border border-white/15"
                    : "bg-transparent placeholder:text-primary/60 text-primary border border-transparent"}
        `}
              />
            </div>
            )}
          

            <div
              className={`
        max-h-60 overflow-y-auto
        ${darkMode ? "bg-[#101317]" : "bg-white"}
      `}
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
                        className={`
                  w-full flex items-center justify-between px-4 py-3 rounded-lg text-left text-sm
                  transition-colors
                  focus:outline-none focus:ring-2 
                  ${darkMode
                            ? `text-white hover:bg-primary/10 focus:ring-white/20 ${selected ? "bg-white/10" : ""}`
                            : `text-gray-800 hover:bg-primary/10 focus:ring-primary/40 ${selected ? "bg-gray-100" : ""}`
                          }
                `}
                      >
                        <span className={selected ? "font-medium" : ""}>{opt.label}</span>
                        {selected && (
                          <Check className={`h-4 w-4 ${darkMode ? "text-white/90" : "text-primary"}`} />
                        )}
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
          className="fixed inset-0 z-50 bg-white flex items-end justify-center"
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
                ? "bg-white backdrop-blur-xl text-primary/80 border border-white/20"
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

            <div className={`flex items-center bg-primary/20 justify-between px-6 py-4 border-b ${darkMode ? "border-white/20" : "border-primary/20"}`}>
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
                <X className={`h-5 w-5 ${darkMode ? "text-white/50" : "text-white"}`} />
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