import React, { useEffect, useRef, useState } from "react";
import { AiOutlineClose } from "react-icons/ai";
import { faker } from "@faker-js/faker";
import ReactDOM from "react-dom";
import TextInputWithClearButton from "./InputClear";

export const FakerInputWithAutocomplete = ({
    value,
    onChange,
    placeholder,
    id,
}: {
    value: string;
    onChange: (val: string) => void;
    placeholder?: string;
    id?: string;
}) => {
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [filteredSuggestions, setFilteredSuggestions] = useState<string[]>([]);
    const [highlightedIndex, setHighlightedIndex] = useState(0);
    const [fakerExpression, setFakerExpression] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    const inputRef = useRef<HTMLInputElement | null>(null);

    useEffect(() => {
        if (isFakerExpression(value) && endsWithCall(value)) {
            const evaluated = evaluateFakerExpression(value);
            if (evaluated && evaluated !== value) {
                onChange(evaluated);
                setFakerExpression(value);
                setShowSuggestions(false);
                setError(null);
            } else if (evaluated === null) {
                setError("Expresión inválida o error al ejecutar Faker.");
            }
        }
    }, [value, onChange]);

    useEffect(() => {
        if (isFakerExpression(value) && !endsWithCall(value)) {
            const parts = value.replace("faker.", "").split(".");
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
        } else {
            setShowSuggestions(false);
        }
    }, [value]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        onChange(e.target.value);
        setError(null);
    };

    const handleClear = () => {
        onChange("");
        setFakerExpression("");
        setShowSuggestions(false);
        setError(null);
    };

    const handleSuggestionClick = (suggestion: string) => {
        onChange(suggestion);
        setShowSuggestions(false);
        setError(null);
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (!showSuggestions) return;
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
                onChange(selected);
                setShowSuggestions(false);
                setError(null);
            }
        }
    };

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

    return (
        <div className="relative w-full overflow-visible z-40 flex flex-col gap-2">
            <div className="relative w-full">
                <input
                    ref={inputRef}
                    id={id}
                    value={value}
                    onChange={handleChange}
                    onKeyDown={handleKeyDown}
                    placeholder={placeholder}
                    autoComplete="off"
                    className="w-full p-2 pr-10 rounded-md bg-primary/10 text-primary/80 focus:outline-none focus:ring-2 focus:ring-primary/90 shadow-md"
                />
                {value && (
                    <button
                        type="button"
                        onClick={handleClear}
                        className="absolute cursor-pointer right-3 top-1/2 transform -translate-y-1/2 text-primary/80 hover:text-primary/90"
                    >
                        <AiOutlineClose className="w-4 h-4" />
                    </button>
                )}
            </div>
            {fakerExpression && (
                <p className="text-xs text-muted-foreground mt-1">
                    <strong>Expression:</strong>{" "}
                    <code className="bg-gray-100 px-1 rounded">{fakerExpression}</code>
                </p>
            )}
            {error && (
                <p className="text-xs text-red-500 mt-1">{error}</p>
            )}
            {showSuggestions &&
                filteredSuggestions.length > 0 &&
                inputRef.current &&
                ReactDOM.createPortal(
                    <ul
                        className="z-50 absolute bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto text-sm w-[300px]"
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
