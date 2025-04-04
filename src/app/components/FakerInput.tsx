import React, { useEffect, useRef, useState } from "react";
import { AiOutlineClose } from "react-icons/ai";
import { faker } from "@faker-js/faker";
import ReactDOM from "react-dom";

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
    const [suggestions, setSuggestions] = useState<string[]>([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [filteredSuggestions, setFilteredSuggestions] = useState<string[]>([]);
    const [highlightedIndex, setHighlightedIndex] = useState(0);

    const inputRef = useRef<HTMLInputElement | null>(null);

    useEffect(() => {
        if (!value.endsWith(".") && value.startsWith("faker.")) {
            const evaluated = evaluateFakerExpression(value);
            if (evaluated && evaluated !== value) {
                onChange(evaluated);
                setShowSuggestions(false);
            }
        }
    }, [value]);



    useEffect(() => {
        if (value.startsWith("faker.")) {
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
                opt.toLowerCase().startsWith(lastPart.toLowerCase())
            );

            const suggestionsWithPath = filtered.map((opt) => `${currentPath}.${opt}`);
            setFilteredSuggestions(suggestionsWithPath);
            setShowSuggestions(true);
        } else {
            setShowSuggestions(false);
        }
    }, [value]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        onChange(e.target.value);
    };

    const handleClear = () => {
        onChange("");
        setShowSuggestions(false);
    };

    const handleSuggestionClick = (suggestion: string) => {
        onChange(suggestion);
        setShowSuggestions(false);
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
                const evaluated = evaluateFakerExpression(selected);

                if (evaluated !== null) {
                    onChange(evaluated);
                } else {
                    onChange(selected);
                }

                setShowSuggestions(false);
            }
        }


    };

    const evaluateFakerExpression = (path: string): string | null => {
        try {
            if (!path.startsWith("faker.")) return null;

            const parts = path.replace("faker.", "").split(".");
            let current: any = faker;

            for (const key of parts) {
                if (!current) return null;
                current = current[key];
            }

            if (typeof current === "function") {
                const result = current();
                return typeof result === "string" || typeof result === "number"
                    ? String(result)
                    : null;
            }

            return typeof current === "string" || typeof current === "number"
                ? String(current)
                : null;
        } catch (err) {
            console.warn("Invalid faker expression:", err);
            return null;
        }
    };



    return (
        <div className="relative w-full overflow-visible z-40">
            <input
                ref={inputRef}
                id={id}
                value={value}
                onChange={handleChange}
                onKeyDown={handleKeyDown}
                placeholder={placeholder}
                className="w-full p-2 pr-10 rounded-md text-primary/80 focus:outline-none focus:ring-2 focus:ring-primary/90 shadow-md"
            />
            {value && (
                <button
                    type="button"
                    onClick={handleClear}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-primary/80 hover:text-primary/90"
                >
                    <AiOutlineClose className="w-4 h-4" />
                </button>
            )}


            {showSuggestions && filteredSuggestions.length > 0 && inputRef.current &&
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
                                className={`px-3 py-2 cursor-pointer ${index === highlightedIndex
                                        ? "bg-primary text-white"
                                        : "hover:bg-gray-100"
                                    }`}
                            >
                                {suggestion}
                            </li>
                        ))}
                    </ul>,
                    document.body
                )
            }

        </div>
    );
};
