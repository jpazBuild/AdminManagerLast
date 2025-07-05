import React, { useState, useMemo } from "react";
import {
  Command,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
} from "@/components/ui/command";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { X, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface ComboBoxProps {
  label?: string;
  value: string;
  onChange: (value: string) => void;
  options: { label: string; value: string }[];
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

const SearchTestCaseComboBox = ({
  label,
  value,
  onChange,
  options,
  placeholder = "Search test case...",
  className = "",
  disabled = false,
}: ComboBoxProps) => {
  const [open, setOpen] = useState(false);
  const selectedOption = options.find((opt) => opt.value === value);

  const handleClear = () => {
    onChange("");
    setOpen(false);
  };

  const filteredOptions = useMemo(() => {
    return options.sort((a, b) => a.label.localeCompare(b.label));
  }, [options]);

  return (
    <div className="flex flex-col gap-2 w-full">
      {label && <label className="font-medium text-sm text-primary/90 self-center">{label}</label>}

      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <div
            onClick={() => !disabled && setOpen(true)}
            className={cn(
              "flex items-center justify-between w-full px-3 py-2 border rounded-md text-sm cursor-pointer bg-white",
              !value && "text-muted-foreground",
              disabled && "opacity-50 cursor-not-allowed",
              className
            )}
          >
            <span className="truncate">{selectedOption ? selectedOption.label : placeholder}</span>
            {value ? (
              <X
                className="ml-2 h-4 w-4 text-muted-foreground hover:text-red-500"
                onClick={(e) => {
                  e.stopPropagation();
                  if (!disabled) handleClear();
                }}
              />
            ) : (
              <ChevronDown className="ml-2 h-4 w-4 opacity-50" />
            )}
          </div>
        </PopoverTrigger>

        {!disabled && (
          <PopoverContent className="p-0 w-full">
            <Command>
              <CommandInput placeholder="Search test case name..." />
              <CommandList>
                <CommandEmpty>No test cases found.</CommandEmpty>
                <CommandGroup>
                  {filteredOptions.map((opt) => (
                    <CommandItem
                      key={opt.value}
                      onSelect={() => {
                        onChange(opt.value);
                        setOpen(false);
                      }}
                    >
                      {opt.label}
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        )}
      </Popover>
    </div>
  );
};

export default SearchTestCaseComboBox;
