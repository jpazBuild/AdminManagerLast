import { Eye, EyeClosed } from "lucide-react";
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
      if (debounceTimeout.current) {
        clearTimeout(debounceTimeout.current);
      }
    };
  }, [localValue]);

  const clearInput = () => setLocalValue("");
  const togglePasswordVisibility = () => setShowPassword(prev => !prev);

  const lineCount = localValue?.split("\n").length;
  const isPassword = type === "password";
  const inputType = isPassword ? (showPassword ? "text" : "password") : type;

  return (
    <div className="relative w-full">
      {label && (
        <label htmlFor={id} className={`text-sm ${isDarkMode ? "text-white/90 " : "text-primary/80 "}`}>
          {label}
        </label>
      )}
      <div className="relative w-full flex items-center justify-between">
        {useTextarea ? (
          <textarea
            id={id}
            placeholder={placeholder}
            value={localValue}
            rows={lineCount < 3 ? 3 : lineCount}
            onChange={e => setLocalValue(e.target.value)}
            className={`w-full p-2 pr-10 rounded-md ${isDarkMode ? "bg-primary/20 text-white/90 focus:ring-white/60" : "bg-primary/20  text-primary/80 focus:ring-primary/90"} resize-none focus:outline-none focus:ring-1  shadow-md`}
            defaultValue={defaultValue}
            readOnly={readOnly}
          />
        ) : (
          <input
            ref={inputRef}
            inputMode={inputMode}
            id={id}
            type={inputType}
            placeholder={placeholder}
            value={localValue}
            onChange={e => setLocalValue(e.target.value)}
            className={`w-full p-2 pr-10 rounded-md  focus:outline-none focus:ring-1 ${isDarkMode ? "focus:ring-white/90 bg-primary/10 text-white/90" :"!bg-primary/20  text-primary/80 focus:ring-primary/90"} shadow-md ${className}`}
            defaultValue={defaultValue}
            readOnly={readOnly}
          />
        )}

          {!isPassword && localValue?.length > 0 && readOnly === false && (
          <button
            type="button"
            onClick={clearInput}
            className={`absolute cursor-pointer right-3 top-1/2 transform -translate-y-1/2  ${isDarkMode ? "text-white/90 hover:text-white/80" : "text-primary/80 hover:text-primary/90"}`}
          >
            <AiOutlineClose className="w-4 h-4" />
          </button>
        )}
        {isPassword && (
          <button
            type="button"
            onClick={togglePasswordVisibility}
            className={`absolute right-3 top-1/2 transform -translate-y-1/2 ${isDarkMode ? "text-white/90 hover:text-white/80" : "text-primary/80 hover:text-primary/90"}`}
          >
            {showPassword ? (
              <Eye className="w-4 h-4" />
            ) : (
              <EyeClosed className="w-4 h-4" />
            )}
          </button>
        )}

        <span
          ref={spanRef}
          className="absolute invisible whitespace-pre font-mono text-xs px-2"
        >
          {localValue}
        </span>
      </div>
    </div>
  );
};

export default TextInputWithClearButton;