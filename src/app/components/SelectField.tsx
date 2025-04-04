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
    return (
      <div className="flex flex-col gap-2 w-full">
        {label && <label className="font-medium text-sm text-primary/90">{label}</label>}
  
        <Select value={value} onValueChange={onChange} disabled={disabled}>
          <SelectTrigger className={`w-full ${className}`}>
            <SelectValue placeholder={placeholder} />
          </SelectTrigger>
          <SelectContent>
            {options.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    );
  };