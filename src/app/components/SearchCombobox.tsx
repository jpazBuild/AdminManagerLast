"use client"

import * as React from "react"
import { Check, ChevronDown, ChevronsUpDown, X } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"

type Option = { label: string; value: string }

interface SearchComboboxProps {
  textOptionSelect: string
  textSearch: string
  options?: Option[]
  value?: string
  defaultValue?: string
  onChange?: (value: string, option?: Option) => void
  disabled?: boolean
}

export function SearchCombobox({
  textOptionSelect,
  textSearch,
  options = [],
  value: valueProp,
  defaultValue,
  onChange,
  disabled,
}: SearchComboboxProps) {
  const [open, setOpen] = React.useState(false)

  const isControlled = valueProp !== undefined
  const [innerValue, setInnerValue] = React.useState(defaultValue ?? "")
  const value = isControlled ? (valueProp as string) : innerValue

  const selectedOption = React.useMemo(
    () => options.find(o => o.value === value),
    [options, value]
  )

  const handleSelect = (nextValue: string) => {
    const newVal = nextValue === value ? "" : nextValue
    if (!isControlled) setInnerValue(newVal)
    onChange?.(newVal, options.find(o => o.value === newVal))
    setOpen(false)
  }

  const handleClear = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (!isControlled) setInnerValue("")
    onChange?.("", undefined)
    setOpen(false)
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          className="w-full justify-between !bg-primary/10 border-primary/20 hover:bg-primary/20"
        >
          {selectedOption ? selectedOption.label : `Select ${textOptionSelect}`}
          <div className="flex items-center gap-1">
            {value && (
              <button
                type="button"
                onClick={handleClear}
                className="p-0.5 hover:bg-gray-100 rounded-sm"
              >
                <X className="h-4 w-4 opacity-50 hover:opacity-100" />
              </button>
            )}
            <ChevronDown className="opacity-50" />
          </div>
        </Button>
      </PopoverTrigger>

      <PopoverContent
        className="p-0 overflow-hidden bg-white text-primary/90"
        style={{ width: "var(--radix-popover-trigger-width)" }}
      >
        <Command>
          <CommandInput placeholder={`Search ${textSearch}`} className="h-9" />
          <CommandList>
            <CommandEmpty>No options found.</CommandEmpty>
            <CommandGroup>
              {options.map((option) => (
                <CommandItem
                  key={option.value}
                  value={option.value}
                  onSelect={handleSelect}
                  className="hover:bg-primary/10 cursor-pointer"
                >
                  {option.label}
                  <Check
                    className={cn(
                      "ml-auto",
                      value === option.value ? "opacity-100" : "opacity-0"
                    )}
                  />
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}