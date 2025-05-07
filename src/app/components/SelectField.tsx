import React, { useState, useRef, useEffect } from "react";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";

interface SelectOption {
  label: string;
  value: string;
}

interface SelectFieldProps {
  label?: string;
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

export const SelectField = ({
  label,
  value,
  onChange,
  options,
  placeholder = "Select an option",
  disabled = false,
  className = "",
}: SelectFieldProps) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const searchInputRef = useRef<HTMLInputElement | null>(null);

  const filteredOptions = options.filter((opt) =>
    opt.label.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isOpen]);

  const handleOptionClick = (value: string) => {
    setSearchTerm(value);
    onChange(value);
    setIsOpen(false);
  };

  return (
    <div className="flex flex-col gap-2 w-full">
      {label && <label className="font-medium text-sm text-primary/90">{label}</label>}

      <Select
        value={value}
        onValueChange={onChange}
        disabled={disabled}
        open={isOpen}
        onOpenChange={setIsOpen}
      >
        <SelectTrigger className={`w-full ${className}`}>
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          <div className="p-2 sticky top-0 bg-white z-10">
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Search..."
              value={searchTerm}
              onChange={handleSearchChange}
              onClick={(e) => e.stopPropagation()}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          {filteredOptions.length > 0 ? (
            filteredOptions.map((opt) => (
              <SelectItem
                key={opt.value}
                value={opt.value}
                onClick={() => handleOptionClick(opt.value)}
              >
                {opt.label}
              </SelectItem>
            ))
          ) : (
            <div className="p-2 text-sm text-gray-500">No options found</div>
          )}
        </SelectContent>
      </Select>
    </div>
  );
};