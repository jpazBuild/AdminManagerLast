import React, { useState } from "react";
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
  const selectedOption = options?.find((opt) => opt?.value === value);

  const handleClear = () => {
    onChange("");
    setOpen(false);
  };

  return (
    <div className="flex flex-col gap-2 w-full">
      {label && <label className="font-medium text-sm text-primary/90">{label}</label>}

      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <div
            onClick={() => !disabled && setOpen(true)}
            className={cn(
              "flex items-center text-primary/70 justify-between w-full px-3 py-2 border rounded-md text-sm cursor-pointer bg-white",
              !value && "text-muted-foreground",
              disabled && "opacity-50 cursor-not-allowed",
              className
            )}
          >
            <span>{selectedOption ? selectedOption.label : placeholder}</span>
            {value ? (
              <X
                className="ml-2 h-4 w-4 text-muted-foreground hover:text-primary/60"
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
          <PopoverContent className="p-0 text-primary/90 w-[var(--radix-popover-trigger-width)]">
            <Command>
              <CommandInput placeholder="Search tags..." />
              <CommandList>
                <CommandEmpty>No tags found.</CommandEmpty>
                <CommandGroup>
                  {options?.map((opt) => (
                    <CommandItem
                      key={opt?.value}
                      onSelect={() => {
                        onChange(opt?.value);
                        setOpen(false);
                      }}
                      className="cursor-pointer !text-primary hover:bg-primary/10 focus:bg-primary/20"
                    >
                      {opt?.label}
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