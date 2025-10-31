import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { AiOutlineClose } from "react-icons/ai";
import { faker } from "@faker-js/faker";

type Props = {
  value: string;
  onChange: (val: string, originalExpression?: string) => void;
  placeholder?: string;
  id?: string;
  isDarkMode?: boolean;
};

const FAKER_CACHE = new Map<string, { keys: string[], functions: Set<string> }>();
const MAX_SUGGESTIONS = 15;
const DEBOUNCE_MS = 200;

const initializeFakerCache = () => {
  if (FAKER_CACHE.size > 0) return;
  
  const buildCache = (obj: any, path: string, maxDepth = 2) => {
    if (maxDepth <= 0 || !obj || typeof obj !== "object") return;
    
    const keys: string[] = [];
    const functions = new Set<string>();
    
    for (const key of Object.keys(obj)) {
      if (key.startsWith('_')) continue;
      
      const value = obj[key];
      if (typeof value === 'function') {
        keys.push(key);
        functions.add(key);
      } else if (typeof value === 'object' && value !== null) {
        keys.push(key);
        buildCache(value, `${path}.${key}`, maxDepth - 1);
      }
    }
    
    FAKER_CACHE.set(path, { keys, functions });
  };
  
  buildCache(faker, 'faker');
};

export const FakerInputWithAutocomplete: React.FC<Props> = ({
  value,
  onChange,
  placeholder,
  id,
  isDarkMode = false,
}) => {
  const [inputValue, setInputValue] = useState(value);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [fakerExpr, setFakerExpr] = useState<string>("");
  const [error, setError] = useState("");

  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<number | null>(null);
  const lastInputRef = useRef<string>("");
  const dropdownRef = useRef<HTMLUListElement>(null);

  useEffect(() => {
    initializeFakerCache();
  }, []);

  useEffect(() => {
    if (value !== inputValue) setInputValue(value);
  }, [value, inputValue]);

  const evaluateExpression = useCallback((expr: string): string | null => {
    if (!expr.startsWith('faker.') || !expr.endsWith('()')) return null;
    
    try {
      const fn = new Function('faker', `return ${expr}`);
      const result = fn(faker);
      return String(result);
    } catch {
      return null;
    }
  }, []);

  const generateSuggestions = useCallback((input: string) => {
    if (!input.startsWith('faker.')) {
      setShowDropdown(false);
      return;
    }

    if (input.endsWith('()')) {
      setShowDropdown(false);
      return;
    }

    if (input === lastInputRef.current) return;
    lastInputRef.current = input;

    const pathParts = input.slice(6).split('.');
    const searchTerm = pathParts.pop()?.toLowerCase() || '';
    const basePath = pathParts.length > 0 ? `faker.${pathParts.join('.')}` : 'faker';
    
    const cached = FAKER_CACHE.get(basePath);
    if (!cached) {
      setShowDropdown(false);
      return;
    }

    const matches: string[] = [];
    for (let i = 0; i < cached.keys.length && matches.length < MAX_SUGGESTIONS; i++) {
      const key = cached.keys[i];
      if (key.toLowerCase().startsWith(searchTerm)) {
        const isFunc = cached.functions.has(key);
        matches.push(`${basePath}.${key}${isFunc ? '()' : ''}`);
      }
    }

    setSuggestions(matches);
    setShowDropdown(matches.length > 0);
    setSelectedIndex(0);
  }, []);

  const handleInputChange = useCallback((newValue: string) => {
    setInputValue(newValue);
    setError("");

    if (newValue.startsWith('faker.') && newValue.endsWith('()')) {
      const result = evaluateExpression(newValue);
      if (result && result !== newValue) {
        onChange(result, newValue);
        setFakerExpr(newValue);
        setShowDropdown(false);
        return;
      } else if (result === null) {
        setError("Invalid expression");
      }
    } else {
      setFakerExpr("");
    }

    onChange(newValue);

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = window.setTimeout(() => {
      generateSuggestions(newValue);
    }, DEBOUNCE_MS);
  }, [onChange, evaluateExpression, generateSuggestions]);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    handleInputChange(e.target.value);
  }, [handleInputChange]);

  const handleClear = useCallback(() => {
    setInputValue("");
    setFakerExpr("");
    setError("");
    setShowDropdown(false);
    onChange("");
    lastInputRef.current = "";
    if (debounceRef.current) clearTimeout(debounceRef.current);
  }, [onChange]);

  const selectSuggestion = useCallback((suggestion: string) => {
    handleInputChange(suggestion);
    setShowDropdown(false);
    inputRef.current?.focus();
  }, [handleInputChange]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (!showDropdown || suggestions.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(i => i < suggestions.length - 1 ? i + 1 : i);
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(i => i > 0 ? i - 1 : 0);
        break;
      case 'Enter':
        e.preventDefault();
        if (suggestions[selectedIndex]) {
          selectSuggestion(suggestions[selectedIndex]);
        }
        break;
      case 'Escape':
        setShowDropdown(false);
        break;
    }
  }, [showDropdown, suggestions, selectedIndex, selectSuggestion]);

  const dropdownStyle = useMemo(() => {
    if (!inputRef.current) return { display: 'none' };
    
    const rect = inputRef.current.getBoundingClientRect();
    return {
      position: 'absolute' as const,
      top: rect.bottom + window.scrollY + 2,
      left: rect.left + window.scrollX,
      width: Math.max(rect.width, 280),
      zIndex: 10000,
    };
  }, [showDropdown]);

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  return (
    <>
      <div className="relative w-full">
        <input
          ref={inputRef}
          id={id}
          type="text"
          value={inputValue}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          autoComplete="off"
          spellCheck="false"
          className={`w-full px-3 py-2 pr-8 border rounded focus:outline-none focus:ring-1 transition-shadow ${
            isDarkMode 
              ? "bg-gray-800 text-white border-gray-600 focus:ring-blue-400" 
              : "bg-white text-gray-900 border-gray-300 focus:ring-blue-500"
          }`}
        />
        
        {inputValue && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-1 opacity-60 hover:opacity-100"
          >
            <AiOutlineClose className="w-4 h-4" />
          </button>
        )}
      </div>

      {fakerExpr && (
        <div className="mt-1 text-xs opacity-75">
          <span className="font-medium">Generated from:</span>{' '}
          <code className="bg-gray-100 dark:bg-gray-800 px-1 rounded text-xs">
            {fakerExpr}
          </code>
        </div>
      )}

      {error && <div className="mt-1 text-xs text-red-500">{error}</div>}

      {showDropdown && suggestions.length > 0 && (
        <ul
          ref={dropdownRef}
          className={`border rounded shadow-lg max-h-48 overflow-y-auto ${
            isDarkMode ? "bg-gray-800 border-gray-600" : "bg-white border-gray-200"
          }`}
          style={dropdownStyle}
        >
          {suggestions.map((suggestion, index) => (
            <li
              key={suggestion}
              onClick={() => selectSuggestion(suggestion)}
              className={`px-3 py-1.5 text-sm cursor-pointer font-mono ${
                index === selectedIndex
                  ? "bg-blue-500 text-white"
                  : isDarkMode
                    ? "text-gray-200 hover:bg-gray-700"
                    : "text-gray-800 hover:bg-gray-50"
              }`}
            >
              {suggestion}
            </li>
          ))}
        </ul>
      )}
    </>
  );
};