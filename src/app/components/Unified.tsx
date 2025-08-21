import { Eye, EyeClosed } from "lucide-react";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { AiOutlineClose } from "react-icons/ai";
import { faker } from "@faker-js/faker";
import ReactDOM from "react-dom";

interface UnifiedInputProps {
  label?: string;
  id: string;
  value: string;
  onChangeHandler?: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  onChange?: (val: string, originalExpression?: string) => void;
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
  inputMode?: "text" | "search" | "none";
  isDarkMode?: boolean;
  defaultValue?: string;
  enableFaker?: boolean;
}

const UnifiedInput: React.FC<UnifiedInputProps> = ({
  label,
  id,
  value,
  onChangeHandler,
  onChange,
  placeholder,
  inputMode = "text",
  type = "text",
  className = "",
  isDarkMode = false,
  defaultValue = "",
  readOnly = false,
  enableFaker = false,
  ...props
}) => {
  const spanRef = useRef<HTMLSpanElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [useTextarea, setUseTextarea] = useState(false);
  const [localValue, setLocalValue] = useState(value ?? "");
  const debounceTimeout = useRef<NodeJS.Timeout | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const [showSuggestions, setShowSuggestions] = useState(false);
  const [filteredSuggestions, setFilteredSuggestions] = useState<string[]>([]);
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const [fakerExpression, setFakerExpression] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [currentInput, setCurrentInput] = useState(value);

  const isFakerExpression = (str: unknown): str is string =>
    typeof str === "string" && str.startsWith("faker.");

  const endsWithCall = (str: string) => /\)\s*$/.test(str);

  const evaluateFakerExpression = (expr: string): string | null => {
    try {
      if (!isFakerExpression(expr)) return null;
      const func = new Function("faker", `return (${expr});`);
      const result = func(faker);
      return typeof result === "string" || typeof result === "number"
        ? String(result)
        : JSON.stringify(result);
    } catch (err) {
      return null;
    }
  };

  useEffect(() => {
    setLocalValue(value ?? "");
    if (enableFaker) {
      setCurrentInput(value);
    }
  }, [value, enableFaker]);

  useEffect(() => {
    if (spanRef.current && inputRef.current && !enableFaker) {
      const textWidth = spanRef.current.offsetWidth;
      const inputWidth = inputRef.current.offsetWidth - 40;
      setUseTextarea(textWidth > inputWidth || localValue.includes("\n"));
    }
  }, [localValue, enableFaker]);

  useEffect(() => {
    if (!enableFaker) {
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
    }
  }, [localValue, enableFaker, value, onChangeHandler]);

  useEffect(() => {
    if (enableFaker && isFakerExpression(currentInput) && endsWithCall(currentInput)) {
      const evaluated = evaluateFakerExpression(currentInput);
      if (evaluated && evaluated !== currentInput && onChange) {
        onChange(evaluated, currentInput);
        setFakerExpression(currentInput);
        setShowSuggestions(false);
        setError(null);
      } else if (evaluated === null) {
        setError("Invalid expression or error executing Faker.");
      }
    }
  }, [currentInput, onChange, enableFaker]);

  useEffect(() => {
    if (enableFaker && isFakerExpression(currentInput) && !endsWithCall(currentInput)) {
      const parts = currentInput.replace("faker.", "").split(".");
      let current: any = faker;
      let currentPath = "faker";
      for (let i = 0; i < parts.length - 1; i++) {
        if (current && typeof current === "object") {
          current = current[parts[i]];
          currentPath += "." + parts[i];
        }
      }
      const lastPart = parts[parts.length - 1];
      const options = current ? Object.keys(current) : [];
      const filtered = options.filter((opt) =>
        opt?.toLowerCase()?.startsWith(lastPart?.toLowerCase())
      );
      const suggestionsWithPath = filtered.map((opt) => {
        const valueAtPath = current ? current[opt] : undefined;
        if (typeof valueAtPath === "function") {
          return `${currentPath}.${opt}()`;
        }
        return `${currentPath}.${opt}`;
      });
      setFilteredSuggestions(suggestionsWithPath);
      setShowSuggestions(true);
    } else if (enableFaker) {
      setShowSuggestions(false);
    }
  }, [currentInput, enableFaker]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    
    if (enableFaker) {
      setCurrentInput(newValue);
      if (!isFakerExpression(newValue) || !endsWithCall(newValue)) {
        onChange?.(newValue);
      }
      setError(null);
    } else {
      setLocalValue(newValue);
    }
  };

  const clearInput = () => {
    if (enableFaker) {
      setCurrentInput("");
      onChange?.("");
      setFakerExpression("");
      setShowSuggestions(false);
      setError(null);
    } else {
      setLocalValue("");
    }
  };

  const togglePasswordVisibility = () => setShowPassword(prev => !prev);

  const handleSuggestionClick = (suggestion: string) => {
    if (!enableFaker || !onChange) return;
    
    setCurrentInput(suggestion);
    
    if (endsWithCall(suggestion)) {
      const evaluated = evaluateFakerExpression(suggestion);
      if (evaluated) {
        onChange(evaluated, suggestion);
        setFakerExpression(suggestion);
      } else {
        onChange(suggestion);
      }
    } else {
      onChange(suggestion);
    }
    
    setShowSuggestions(false);
    setError(null);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    if (!enableFaker || !showSuggestions) return;
    
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlightedIndex((prev) =>
        prev < filteredSuggestions.length - 1 ? prev + 1 : prev
      );
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const selected = filteredSuggestions[highlightedIndex];
      if (selected) {
        handleSuggestionClick(selected);
      }
    }
  };

  const displayValue = enableFaker ? currentInput : localValue;
  const lineCount = displayValue?.split("\n").length || 1;
  const isPassword = type === "password";
  const inputType = isPassword ? (showPassword ? "text" : "password") : type;

  const baseSurface = isDarkMode ? "bg-primary/10" : "bg-primary/10";
  const textColor = isDarkMode ? "text-white/90" : "text-primary/80";
  const labelColor = isDarkMode ? "text-white/70" : "text-primary/70";
  const labelColorFocused = isDarkMode ? "peer-focus:text-white/90" : "peer-focus:text-primary/90";
  const ringFocus = isDarkMode ? "focus:ring-white/90" : "focus:ring-primary/90";

  const inputClasses = enableFaker
    ? `peer w-full ml-3 pr-10 pt-6 pb-2 rounded-md ${textColor} ${ringFocus} bg-transparent focus:outline-none ${className} ${
        isDarkMode 
          ? "bg-primary/20 text-white border-gray-700" 
          : "bg-primary/20 text-gray-800 border-gray-300"
      }`
    : `peer w-full ml-3 pr-10 pt-5 pb-2 rounded-md ${textColor} ${ringFocus} bg-transparent focus:outline-none ${className}`;

  const containerClasses = enableFaker
    ? `relative w-full ${baseSurface} rounded-lg`
    : `relative w-full ${baseSurface} rounded-lg`;

  const currentRef = useTextarea ? textareaRef : inputRef;

  return (
    <div className={containerClasses}>
      <div className="relative w-full">
        {useTextarea && !enableFaker ? (
          <textarea
            ref={textareaRef}
            id={id}
            aria-label={placeholder}
            placeholder={label ? " " : placeholder}
            value={displayValue}
            rows={lineCount < 3 ? 3 : lineCount}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
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
            value={displayValue}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            className={inputClasses}
            defaultValue={defaultValue}
            readOnly={readOnly}
            autoComplete={enableFaker ? "off" : props.autoComplete}
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
              peer-focus:top-2 peer-focus:-translate-y-0 peer-focus:text-xs
              peer-[:not(:placeholder-shown)]:top-2 peer-[:not(:placeholder-shown)]:-translate-y-0 peer-[:not(:placeholder-shown)]:text-xs
            `}
          >
            {label}
          </label>
        )}

        {!isPassword && displayValue?.length > 0 && readOnly === false && (
          <button
            type="button"
            onClick={clearInput}
            className={`absolute ${enableFaker ? 'right-3' : 'right-3'} top-1/2 -translate-y-1/2 ${
              enableFaker 
                ? "text-primary/80 hover:text-primary/90" 
                : isDarkMode 
                  ? "text-white/90 hover:text-white/80" 
                  : "text-primary/80 hover:text-primary/90"
            }`}
          >
            <AiOutlineClose className="w-4 h-4" />
          </button>
        )}

        {isPassword && (
          <button
            type="button"
            onClick={togglePasswordVisibility}
            className={`absolute right-3 top-1/2 -translate-y-1/2 ${
              enableFaker 
                ? "text-primary/80 hover:text-primary/90" 
                : isDarkMode 
                  ? "text-white/90 hover:text-white/80" 
                  : "text-primary/80 hover:text-primary/90"
            }`}
          >
            {showPassword ? <Eye className="w-4 h-4" /> : <EyeClosed className="w-4 h-4" />}
          </button>
        )}

        {!enableFaker && (
          <span ref={spanRef} className="absolute invisible whitespace-pre font-mono text-xs px-2">
            {displayValue}
          </span>
        )}
      </div>

      {enableFaker && fakerExpression && (
        <p className="ml-3 text-xs text-muted-foreground mt-1">
          <strong>Expression:</strong>{" "}
          <code className={`px-1 rounded ${isDarkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
            {fakerExpression}
          </code>
        </p>
      )}

      {enableFaker && error && (
        <p className="text-xs text-red-500 mt-1">{error}</p>
      )}

      {enableFaker && showSuggestions && filteredSuggestions.length > 0 && inputRef.current &&
        ReactDOM.createPortal(
          <ul
            className={`z-50 absolute ${
              isDarkMode 
                ? "bg-primary/90 border-primary/80" 
                : "bg-white border border-gray-300"
            } rounded-md shadow-lg max-h-60 overflow-auto text-sm w-[300px]`}
            style={{
              position: "absolute",
              top: inputRef.current.getBoundingClientRect().bottom + window.scrollY,
              left: inputRef.current.getBoundingClientRect().left + window.scrollX,
            }}
          >
            {filteredSuggestions.map((suggestion, index) => (
              <li
                key={suggestion}
                onClick={() => handleSuggestionClick(suggestion)}
                className={`px-3 py-2 cursor-pointer ${
                  index === highlightedIndex
                    ? "bg-primary text-white"
                    : isDarkMode 
                      ? "hover:bg-gray-600 text-white" 
                      : "hover:bg-gray-100"
                }`}
              >
                {suggestion}
              </li>
            ))}
          </ul>,
          document.body
        )}
    </div>
  );
};

export default UnifiedInput;