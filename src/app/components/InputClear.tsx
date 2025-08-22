import { Eye, EyeClosed, Search, SearchIcon } from "lucide-react";
import React, { useEffect, useRef, useState } from "react";
import { AiOutlineClose } from "react-icons/ai";

interface TextInputWithClearButtonProps {
  label?: string;
  id: string;
  value: string;
  onChangeHandler?: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  placeholder: string;
  type?: string;
  disabled?: boolean;
  className?: string;
  rows?: number;
  maxLength?: number;
  minLength?: number;
  autoComplete?: string;
  autoFocus?: boolean;
  readOnly?: boolean;
  required?: boolean;
  inputMode?: "text" | "search" | "none"
  isDarkMode?: boolean;
  defaultValue?: string;
}

const TextInputWithClearButton: React.FC<TextInputWithClearButtonProps> = ({
  label,
  id,
  value,
  onChangeHandler,
  placeholder,
  inputMode = "text",
  type = "text",
  className = "",
  isDarkMode = false,
  defaultValue = "",
  readOnly = false,
  ...props
}) => {
  const spanRef = useRef<HTMLSpanElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [useTextarea, setUseTextarea] = useState(false);

  const [localValue, setLocalValue] = useState(value ?? "");
  const debounceTimeout = useRef<NodeJS.Timeout | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    setLocalValue(value ?? "");
  }, [value]);

  useEffect(() => {
    if (spanRef.current && inputRef.current) {
      const textWidth = spanRef.current.offsetWidth;
      const inputWidth = inputRef.current.offsetWidth - 40;
      setUseTextarea(textWidth > inputWidth || localValue.includes("\n"));
    }
  }, [localValue]);

  useEffect(() => {
    if (debounceTimeout.current) clearTimeout(debounceTimeout.current);
    debounceTimeout.current = setTimeout(() => {
      if (localValue !== value && onChangeHandler) {
        onChangeHandler({
          target: { value: localValue }
        } as React.ChangeEvent<HTMLInputElement>);
      }
    }, 200);
    return () => {
      if (debounceTimeout.current) clearTimeout(debounceTimeout.current);
    };
  }, [localValue]);

  const clearInput = () => setLocalValue("");
  const togglePasswordVisibility = () => setShowPassword(prev => !prev);

  const lineCount = localValue?.split("\n")?.length;
  const isPassword = type === "password";
  const inputType = isPassword ? (showPassword ? "text" : "password") : type;

  const baseSurface = isDarkMode ? "bg-primary/10" : "bg-primary/10";
  const textColor = isDarkMode ? "text-white/90" : "text-primary/80";
  const labelColor = isDarkMode ? "text-white/70" : "text-primary/70";
  const labelColorFocused = isDarkMode ? "peer-focus:text-white/90" : "peer-focus:text-primary/90";
  const ringFocus = isDarkMode ? "focus:ring-white/90" : "focus:ring-primary/90";

  return (
    <div className={`relative w-full ${baseSurface} rounded-lg`}>
      <div className="relative w-full">
        {useTextarea ? (
          <textarea
            id={id}
            aria-label={placeholder}
            placeholder={" "}
            value={localValue}
            rows={lineCount < 3 ? 3 : lineCount}
            onChange={e => setLocalValue(e.target.value)}
            className={`peer w-full ml-3 pr-10 pt-5 pb-2 rounded-md resize-none ${textColor} ${ringFocus} bg-transparent focus:outline-none ${className}`}
            defaultValue={defaultValue}
            readOnly={readOnly}
            {...props}
          />
        ) : (
            <input
            ref={inputRef}
            inputMode={inputMode}
            id={id}
            type={inputType}
            aria-label={placeholder}
            placeholder={" "}
            value={localValue}
            onChange={e => setLocalValue(e.target.value)}
            className={`peer w-full ml-3 pr-10 pt-5 pb-2 rounded-md ${textColor} ${ringFocus} bg-transparent focus:outline-none ${className}`}
            defaultValue={defaultValue}
            readOnly={readOnly}
            {...props}
          />
        )}

        {label && (
          <label
            htmlFor={id}
            className={`
              absolute left-3 tracking-wider 
              top-1/2 -translate-y-1/2 
              ${labelColor} ${labelColorFocused}
              pointer-events-none 
              transition-all duration-150 ease-out 
              tracking-wide font-medium
              /* Estados: enfocado o con contenido => pequeño y arriba */
              peer-focus:top-2 peer-focus:-translate-y-0 peer-focus:text-xs
              peer-[:not(:placeholder-shown)]:top-2 peer-[:not(:placeholder-shown)]:-translate-y-0 peer-[:not(:placeholder-shown)]:text-xs
            `}
          >
            {label}
          </label>
        )}

        {!isPassword && localValue?.length > 0 && readOnly === false && (
          <button
            type="button"
            onClick={clearInput}
            className={`absolute right-3 top-1/2 -translate-y-1/2 ${isDarkMode ? "text-white/90 hover:text-white/80" : "text-primary/80 hover:text-primary/90"}`}
          >
            <AiOutlineClose className="w-4 h-4" />
          </button>
        )}

        {isPassword && (
          <button
            type="button"
            onClick={togglePasswordVisibility}
            className={`absolute right-3 top-1/2 -translate-y-1/2 ${isDarkMode ? "text-white/90 hover:text-white/80" : "text-primary/80 hover:text-primary/90"}`}
          >
            {showPassword ? <Eye className="w-4 h-4" /> : <EyeClosed className="w-4 h-4" />}
          </button>
        )}

        <span ref={spanRef} className="absolute invisible whitespace-pre font-mono text-xs px-2">
          {localValue}
        </span>
      </div>
    </div>
  );
};

export default TextInputWithClearButton;
