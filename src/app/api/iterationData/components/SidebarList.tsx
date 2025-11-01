"use client";

import TextInputWithClearButton from "@/app/components/InputClear";
import { IterationHeader } from "../types";
import { useRef } from "react";
import { PlusIcon, UploadCloud, UploadIcon } from "lucide-react";

type Props = {
  iterations: IterationHeader[];
  loading: boolean;
  error?: string | null;
  query: string;
  setQuery: (v: string) => void;
  onPick: (h: IterationHeader) => void;
  onCreateBlank: () => void;
  onUploadCsv: (file: File) => void;
  selectedId?: string;
  darkMode?: boolean;
};

export default function SidebarList({
  iterations,
  loading,
  error,
  query,
  setQuery,
  onPick,
  onCreateBlank,
  onUploadCsv,
  selectedId,
  darkMode,
}: Props) {
  const fileRef = useRef<HTMLInputElement | null>(null);

  const triggerUpload = () => fileRef.current?.click();
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) onUploadCsv(f);
    if (fileRef.current) fileRef.current.value = "";
  };

  return (
    <div
      className={`w-72 border-r flex-shrink-0 flex flex-col overflow-hidden ${
        darkMode ? "border-gray-700 bg-gray-900" : "border-primary/10 bg-white"
      }`}
    >
      <div
        className={`flex-shrink-0 p-4 border-b ${
          darkMode ? "bg-gray-900 border-gray-800" : "bg-white border-primary/10"
        }`}
      >
        <TextInputWithClearButton
          id="search-iterations"
          label="Search iterations"
          value={query}
          placeholder="Search iterations"
          isSearch
          onChangeHandler={(e) => setQuery(e.target.value)}
          isDarkMode={darkMode}
        />
      </div>

      <div
        className={`flex items-center gap-3 px-4 py-3 border-b ${
          darkMode ? "border-gray-800 bg-gray-900" : "border-primary/10 bg-white"
        }`}
      >
        <button
          className={`cursor-pointer px-4 py-1.5 transition flex items-center gap-2 text-[14px] font-semibold rounded-full tracking-wide ${
            darkMode ? "bg-gray-700 text-gray-100 hover:bg-gray-600" : "bg-gray-300 text-gray-800 hover:bg-gray-200"
          }`}
          onClick={onCreateBlank}
        >
          <PlusIcon className="w-4 h-4" /> Create
        </button>
        <button
          className={`cursor-pointer px-4 py-1.5 transition flex items-center gap-2 text-[14px] font-semibold rounded-full tracking-wide ${
            darkMode ? "bg-gray-700 text-gray-100 hover:bg-gray-600" : "bg-gray-300 text-gray-800 hover:bg-gray-200"
          }`}
          onClick={triggerUpload}
          title="Upload CSV"
        >
          <UploadIcon className="w-4 h-4" /> Upload CSV
        </button>
        <input ref={fileRef} type="file" accept=".csv" className="hidden" onChange={handleFileChange} />
      </div>

      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className={`p-4 text-sm ${darkMode ? "text-gray-400" : "text-gray-500"}`}>Loading...</div>
        ) : iterations.length > 0 ? (
          <div className="flex flex-col gap-1 p-2">
            {iterations.map((it) => (
              <div
                key={it.id}
                className={`p-3 cursor-pointer rounded-lg ${
                  darkMode
                    ? `hover:bg-gray-800 ${selectedId === it.id ? "bg-gray-800" : ""}`
                    : `hover:bg-primary/5 ${selectedId === it.id ? "bg-primary/10" : ""}`
                }`}
                onClick={() => onPick(it)}
                title={it.description || it.name}
              >
                <h3
                  className={`text-lg font-semibold truncate ${
                    darkMode ? "text-gray-200" : "text-gray-500"
                  }`}
                >
                  {it.name}
                </h3>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center p-4">
            <p className={`text-sm ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
              {error ?? "No iterations found."}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
