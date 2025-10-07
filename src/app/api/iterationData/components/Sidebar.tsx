import { IterationHeader } from "../hooks/useIterationHeaders";

type Props = {
  items: IterationHeader[];
  loading: boolean;
  query: string;
  setQuery: (v: string) => void;
  onSelect: (h: IterationHeader) => void;
  onCreate: () => void;
  onUploadCsv: (file: File) => void;
};

export default function Sidebar({
  items,
  loading,
  query,
  setQuery,
  onSelect,
  onCreate,
  onUploadCsv,
}: Props) {
  return (
    <div className="rounded-2xl border border-[#E1E8F0] bg-white p-4">
      <h2 className="text-lg font-semibold text-[#0A2342] mb-3">Iteration data</h2>

      <input
        type="text"
        placeholder="Search iteration data"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="w-full rounded-xl border border-[#E1E8F0] px-3 py-2 text-sm mb-3 focus:outline-none focus:ring-2 focus:ring-[#5A6ACF]/30"
      />

      <div className="flex items-center gap-2 mb-4">
        <button
          onClick={onCreate}
          className="inline-flex flex-1 items-center justify-center gap-2 bg-[#0A2342] text-white px-4 py-2 rounded-xl font-semibold shadow hover:bg-[#18345A] transition-all"
        >
          <span className="text-lg">＋</span> Create
        </button>

        <input
          id="csv-upload"
          type="file"
          accept=".csv"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) onUploadCsv(file);
            e.currentTarget.value = "";
          }}
        />
        <label
          htmlFor="csv-upload"
          className="inline-flex cursor-pointer items-center justify-center rounded-xl border border-[#0A2342] bg-white px-4 py-2 font-semibold text-[#0A2342] shadow hover:bg-[#F5F8FB] transition-all"
        >
          Upload CSV
        </label>
      </div>

      <div className="max-h-[60vh] overflow-auto pr-1">
        {loading ? (
          <div className="text-sm text-[#7B8CA6]">Loading...</div>
        ) : items.length === 0 ? (
          <div className="text-sm text-[#7B8CA6]">No results</div>
        ) : (
          <ul className="space-y-2">
            {items.map((h, i) => (
              <li key={h.id}>
                <button
                  onClick={() => onSelect(h)}
                  className="w-full text-left rounded-xl border px-3 py-2 transition border-[#E1E8F0] hover:bg-gray-50"
                  title={h.description || h.name}
                >
                  {/* 🔹 Título: Iteration N */}
                  <div className="text-sm font-medium text-[#0A2342] truncate">
                    {`Iteration ${i + 1}`}
                  </div>
                  {/* 🔹 Subtítulo: el name real (útil como referencia) */}
                  {!!h.name && (
                    <div className="text-xs text-[#7B8CA6] truncate">{h.name}</div>
                  )}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
