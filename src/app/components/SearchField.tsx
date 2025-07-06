"use client";
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
}

export const SearchField = ({
  label,
  value,
  onChange,
  options,
  placeholder = "Select a tag",
  className = "",
  disabled = false,
}: TagSelectorProps) => {
  const [open, setOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [isMobile, setIsMobile] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const scrollSearchField = useRef<HTMLDivElement>(null!);
  useLockScrollBubbling(scrollSearchField);
  // Detect mobile
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  useEffect(() => {
    if (open && isMobile) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open, isMobile]);

  const selectedOption = options?.find((opt) => opt.value === value);
  const filteredOptions = isMobile
    ? options
    : options.filter((opt) =>
      opt.label.toLowerCase().includes(searchTerm.toLowerCase())
    );

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange("");
    setOpen(false);
  };

  // Click outside handler para desktop
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
    return () =>
      document.removeEventListener("mousedown", handleClickOutside, true);
  }, [open, isMobile]);

  // Seleccionar opción - simplificado
  const handleSelect = (optionValue: string) => {
    onChange(optionValue);
    setOpen(false);
    if (!isMobile) {
      setSearchTerm("");
    }
  };

  return (
    <>
      <div className="flex flex-col gap-2 w-full relative" ref={wrapperRef}>
        {label && (
          <label className="font-medium text-sm text-primary/90 ">
            {label}
          </label>
        )}
        {/* Trigger Button */}
        <div
          onClick={() => !disabled && setOpen(true)}
          className={`
            flex items-center justify-between w-full px-4 py-3 
            border border-gray-300 rounded-xl text-sm cursor-pointer 
            bg-white 
            shadow-sm hover:shadow-md transition-all duration-200
            ${!value ? "text-primary/50" : "text-primary/90"}
            ${disabled ? "opacity-50 cursor-not-allowed" : "hover:border-primary/40"}
            ${open ? "border-primary/50 " : ""}
            ${className}
          `}
        >
          <span className="truncate">
            {selectedOption ? selectedOption.label : placeholder}
          </span>
          {value ? (
            <X
              className="ml-2 h-4 w-4 text-gray-400 hover:text-gray-600  flex-shrink-0"
              onClick={handleClear}
            />
          ) : (
            <ChevronDown className={`ml-2 h-4 w-4 text-gray-400 flex-shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} />
          )}
        </div>

        {/* Desktop Dropdown */}
        {open && !isMobile && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-300 rounded-xl shadow-xl z-50 max-h-60 overflow-hidden animate-in slide-in-from-top-4">
            {/* Desktop Search */}
            <div className="p-3 border-b border-gray-200 bg-white">
              <div className="relative" onClick={(e) => e.stopPropagation()}>
                <input
                  type="text"
                  placeholder="Search options..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onClick={(e) => e.stopPropagation()}
                  className="w-full pl-3 pr-4 py-2 border border-gray-300 rounded-lg 
                           bg-white  text-gray-900 
                            focus:border-transparent outline-none text-sm"
                  autoFocus
                />
              </div>
            </div>
            {/* Desktop Options */}
            <div className="max-h-40 overflow-y-auto bg-white ">
              {filteredOptions?.length === 0 ? (
                <div className="p-3 text-center text-gray-500  text-sm">
                  No options found
                </div>
              ) : (
                <div className="p-1">
                  {filteredOptions?.map((opt, index) => (
                    <button
                      key={`${opt.value}-${opt.label}-${index}`}
                      onClick={() => handleSelect(opt.value)}
                      className={`
                        w-full flex cursor-pointer items-center justify-between p-2 rounded-lg text-left text-sm
                        hover:bg-primary/30 transition-colors
                        ${value === opt.value ? "bg-primary/20 text-primary" : ""}
                      `}
                    >
                      <span className={`
                        ${value === opt.value
                          ? "text-primary/90 font-medium"
                          : "text-gray-900"
                        }
                      `}>
                        {opt.label}
                      </span>
                      {value === opt.value && (
                        <Check className="h-4 w-4 text-primary/60 " />
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Mobile Modal Overlay */}
      {open && isMobile && (
        <div
          ref={scrollSearchField}
          className="fixed inset-0 z-50 bg-primary/40 backdrop-blur-sm flex items-end justify-center"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setOpen(false);
            }
          }}
        >
          <div
            className="w-full mx-2 bg-white rounded-2xl shadow-2xl overflow-hidden animate-in slide-in-from-bottom-4 duration-300"
            style={{ height: "60vh", maxWidth: 480 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-center py-3 flex-shrink-0">
              <div className="w-10 h-1 bg-primary/30  rounded-full"></div>
            </div>
            <div className="flex items-center justify-between px-6 py-4 border-b border-primary/20  flex-shrink-0 bg-white ">
              <h3 className="text-lg font-semibold text-primary/80 ">
                {label || "Select Option"}
              </h3>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setOpen(false);
                }}
                className="p-2 cursor-pointer hover:bg-primary/30 rounded-full transition-colors"
              >
                <X className="h-5 w-5 text-primary/50 " />
              </button>
            </div>
            {/* Options List */}
            <div className="flex-1 overflow-y-auto px-4 py-2 bg-white max-h-[44vh]">
              {filteredOptions.length === 0 ? (
                <div className="p-6 text-center text-primary/50 ">
                  <p className="text-base">No options found</p>
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  {filteredOptions.map((opt, index) => (
                    <button
                      key={`${opt.value}-${opt.label}-${index}`}
                      type="button"
                      onClick={() => handleSelect(opt.value)}
                      className={`
                      w-full cursor-pointer flex gap-2 items-center justify-between p-2 rounded-xl text-left min-h-[2.5rem]
                      hover:bg-primary/40 transition-all duration-200
                      ${value === opt.value ? "bg-primary/30 border border-primary/20" : "border border-transparent"}
                    `}
                    >
                      <div className="flex-1 text-base break-words text-primary">
                        <span className={`${value === opt.value ? "text-primary/90 font-medium" : "text-primary/90"}`}>
                          {opt.label}
                        </span>
                      </div>
                      {value === opt.value && (
                        <span className="flex-shrink-0 self-center pl-2">
                          <Check className="h-6 w-6 text-primary/90" />
                        </span>
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