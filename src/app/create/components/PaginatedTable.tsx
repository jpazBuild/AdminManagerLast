import NoData from "@/app/components/NoData";
import { useEffect } from "react";

type Column<T> = {
    key: string;
    header: string;
    className?: string;
    render?: (row: T) => React.ReactNode;
};

type PaginatedTableProps<T> = {
    data: T[];
    columns: Column<T>[];
    page: number;
    setPage: (n: number) => void;
    pageSize: number;
    setPageSize: (n: number) => void;
    loading?: boolean;
    emptyText: string;
    rowKey: (row: T, idx: number) => string | number;
};


const PaginatedTable = <T,>({
    data,
    columns,
    page,
    setPage,
    pageSize,
    setPageSize,
    loading,
    emptyText,
    rowKey,
}: PaginatedTableProps<T>) => {
    const total = data.length;
    const maxPage = Math.max(1, Math.ceil(total / pageSize));
    const safePage = Math.min(page, maxPage);
    const start = (safePage - 1) * pageSize;
    const end = Math.min(start + pageSize, total);
    const slice = data.slice(start, end);

    const PAGE_SIZE_OPTIONS = [5, 10, 15, 20];

    useEffect(() => {
        if (page > maxPage) setPage(maxPage);
    }, [total, pageSize]);

    return (
        <div className="w-full flex flex-col gap-4">
            <div className="text-sm text-primary/70">
                {loading ? (
                    <span>Loading data...</span>
                ) : total > 0 ? (
                    <span>
                        Show <b>{start + 1}</b>–<b>{end}</b> of <b>{total}</b>
                    </span>
                ) : (
                    "No data available"
                )}
            </div>
            <div className="w-full overflow-hidden rounded-lg border border-primary/20">

                <div className="grid grid-cols-12 bg-primary/10 text-primary/80 text-sm font-medium">
                    {columns.map((c, i) => (
                        <div key={i} className={`px-3 py-2 ${c.className ?? "col-span-3"}`}>
                            {c.header}
                        </div>
                    ))}
                </div>
                {loading ? (
                    <div className="p-4 text-sm">Cargando…</div>
                ) : slice.length > 0 ? (
                    slice.map((row, idx) => (
                        <div
                            key={rowKey(row, idx)}
                            className="grid grid-cols-12 items-center border-t border-primary/10 hover:bg-primary/5"
                        >
                            {columns.map((c, i) => (
                                <div key={i} className={`px-3 py-2 ${c.className ?? "col-span-3"}`}>
                                    {c.render ? (c.render as any)(row) : (row as any)[c.key]}
                                </div>
                            ))}
                        </div>
                    ))
                ) : (
                    <NoData text={emptyText} />
                )}
            </div>

            <div className="w-full flex items-center justify-between mb-2 gap-3">

                <div className="w-full flex items-center gap-2">
                    <div className="w-full"></div>
                    <div className="w-full flex items-center gap-1">
                        <button
                            className="px-2 py-1 rounded border border-primary/20 text-sm hover:bg-primary/10 disabled:opacity-50"
                            onClick={() => setPage(1)}
                            disabled={safePage === 1}
                        >
                            «
                        </button>
                        <button
                            className="px-2 py-1 rounded border border-primary/20 text-sm hover:bg-primary/10 disabled:opacity-50"
                            onClick={() => setPage(Math.max(1, safePage - 1))}
                            disabled={safePage === 1}
                        >
                            Prev
                        </button>
                        <span className="px-2 text-sm text-primary/70">
                            {safePage} / {maxPage}
                        </span>
                        <button
                            className="px-2 py-1 rounded border border-primary/20 text-sm hover:bg-primary/10 disabled:opacity-50"
                            onClick={() => setPage(Math.min(maxPage, safePage + 1))}
                            disabled={safePage === maxPage}
                        >
                            Next
                        </button>
                        <button
                            className="px-2 py-1 rounded border border-primary/20 text-sm hover:bg-primary/10 disabled:opacity-50"
                            onClick={() => setPage(maxPage)}
                            disabled={safePage === maxPage}
                        >
                            »
                        </button>
                    </div>

                    <div className="self-end w-full flex items-center justify-end gap-1">
                        <label className="text-sm text-primary/70">Rows per page</label>
                        <select
                            className="rounded-md border border-primary/20 bg-white px-2 py-1 text-sm"
                            value={pageSize}
                            onChange={(e) => {
                                setPageSize(Number(e.target.value));
                                setPage(1);
                            }}
                        >
                            {PAGE_SIZE_OPTIONS.map((opt) => (
                                <option key={opt} value={opt}>
                                    {opt}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default PaginatedTable;