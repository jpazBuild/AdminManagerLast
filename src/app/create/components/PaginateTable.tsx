import { Edit3, Trash2Icon } from "lucide-react";
import PaginatedTable from "./PaginatedTable";
import TagActionsMenu from "./TagActionsMenu";


type PaginatedTableReusableProps = {
    dataFiltered: any;
    openEdit: any;
    setOpenDeleteDialog: (open: boolean) => void;
    setDataToDelete: ({ id, type }: { id: string; type: Tab }) => void;

    page: number;
    setPage: (page: number) => void;
    pageSize: number;
    setPageSize: (size: number) => void;
    loading: boolean;
    emptyText: string;
};

type Type = {
    id: string;
    name?: string;
    createdByName?: string;
    createdAt?: number;
}

type Tab = "group" | "tag" | "module" | "submodule";

const PaginatedTableReusable = ({
    dataFiltered,
    openEdit,
    setOpenDeleteDialog,
    setDataToDelete,
    page,
    setPage,
    pageSize,
    setPageSize,
    loading,
    emptyText,
}: PaginatedTableReusableProps) => {


    const fmtDate = (ts?: number) =>
    ts
        ? new Intl.DateTimeFormat("es-ES", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        }).format(Number(ts))
        : "";
        
    return (
        <>
            <PaginatedTable
                data={dataFiltered}
                columns={[
                    { key: "name", header: "Name", className: "col-span-3" },
                    {
                        key: "id",
                        header: "ID",
                        className: "col-span-3",
                        render: (type: Type) => (
                            <span className="text-xs text-gray-500">{type.id}</span>
                        ),
                    },
                    {
                        key: "meta",
                        header: "Meta",
                        className: "col-span-4",
                        render: (t: Type) => (
                            <div className="flex flex-col text-xs">
                                <span>{t.createdByName}</span>
                                <span className="text-gray-500">{fmtDate(t.createdAt)}</span>
                            </div>
                        ),
                    },
                    {
                        key: "actions",
                        header: "Actions",
                        className: "col-span-2",
                        render: (t: Type) => (
                            <div className="flex items-center gap-2">
                                <TagActionsMenu
                                    t={t}
                                    openEdit={openEdit}
                                    setOpenDeleteDialog={setOpenDeleteDialog}
                                    setDataToDelete={setDataToDelete}
                                />

                                
                            </div>
                        ),
                    },
                ]}
                page={page}
                setPage={setPage}
                pageSize={pageSize}
                setPageSize={setPageSize}
                loading={loading}
                emptyText={emptyText}
                rowKey={(type:Type) => (type)?.id}
            />

        </>
    )
}

export default PaginatedTableReusable;