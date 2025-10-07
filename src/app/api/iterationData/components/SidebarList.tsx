"use client";
import TextInputWithClearButton from "@/app/components/InputClear";
import { IterationHeader } from "../types";

type Props = {
  iterations: IterationHeader[];
  loading: boolean;
  error?: string | null;
  query: string;
  setQuery: (v: string) => void;
  onPick: (h: IterationHeader) => void;
  onCreateBlank: () => void;
  selectedId?: string;
};

export default function SidebarList({
  iterations, loading, error, query, setQuery, onPick, onCreateBlank, selectedId
}: Props) {
  return (
    <div className="w-72 border-r border-primary/10 bg-white flex-shrink-0 flex flex-col overflow-hidden">
      <div className="flex-shrink-0 p-4 bg-white border-b border-primary/10">
        <TextInputWithClearButton
          id="search-iterations"
          label="Search iterations"
          value={query}
          placeholder="Search iterations"
          isSearch
          onChangeHandler={(e) => setQuery(e.target.value)}
        />
      </div>

      <div className="max-h-[calc(100vh-200px)] overflow-y-auto">
        {loading ? (
          <div className="p-4 text-sm text-gray-500">Loading...</div>
        ) : iterations.length > 0 ? (
          <div className="flex flex-col gap-1 p-2">
            {iterations.map((it, idx) => (
              <div
                key={it.id}
                className={`p-3 cursor-pointer rounded-lg hover:bg-primary/5 ${selectedId === it.id ? "bg-primary/10" : ""}`}
                onClick={() => onPick(it)}
                title={it.description || it.name}
              >
                <h3 className="font-medium text-primary/80">{`Iteration ${idx + 1}`}</h3>
                <p className="text-xs text-gray-500 truncate">{it.name}</p>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center p-4">
            <p className="text-sm text-gray-500">{error ?? "No iterations found."}</p>
          </div>
        )}
      </div>

      <button
        className="m-3 px-3 py-2.5 bg-primary rounded-md text-white font-medium hover:bg-primary/90 transition"
        onClick={onCreateBlank}
      >
        + Create
      </button>
    </div>
  );
}
