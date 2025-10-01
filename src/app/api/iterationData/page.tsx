"use client";

import Image from "next/image";
import axios from "axios";
import { useState } from "react";
import selectIterationDataIcon from "../../../assets/apisImages/select-iterationData.svg";
import { DashboardHeader } from "@/app/Layouts/main";
import { URL_API_ALB } from "@/config";
import TextInputWithClearButton from "@/app/components/InputClear";
import { MoreVertical } from "lucide-react";


type Row = { variable: string; value: string };
type Pkg = { id: string; name: string; selected: boolean; rows: Row[] };

type IterationHeader = { id: string; name: string; description?: string };
type IterationDetailItem = {
    id: string;
    apisScriptsName: string;
    iterationData: Record<string, unknown>;
};
type IterationDetailResponse = {
    iterationData: IterationDetailItem[];
};

const IterationDataPage = () => {
    const [packages, setPackages] = useState<Pkg[]>([]);
    const [availableHeaders, setAvailableHeaders] = useState<IterationHeader[]>([]);
    const [iterationDetails, setIterationDetails] = useState<
        Record<string, IterationDetailResponse>
    >({});
    const [loadingNewPackage, setLoadingNewPackage] = useState(false);
    const [error, setError] = useState<string | null>(null);

    //  Convierte los detalles de iteración en filas (VARIABLE / VALUE)
    const rowsFromIterationDetails = (detail: IterationDetailResponse): Row[] => {
        const rows: Row[] = [];
        for (const item of detail.iterationData) {
            for (const [key, val] of Object.entries(item.iterationData)) {
                if (val && typeof val === "object") {
                    for (const [subKey, subVal] of Object.entries(val as Record<string, unknown>)) {
                        rows.push({ variable: `${key}.${subKey}`, value: String(subVal) });
                    }
                } else {
                    rows.push({ variable: key, value: String(val) });
                }
            }
        }

        return rows;
    };

    // 👉 Solo se llama cuando das clic en New package
    const handleNewPackage = async () => {
        setLoadingNewPackage(true);
        setError(null);
        try {
            // 1) Obtener headers
            const { data: headers } = await axios.post<IterationHeader[]>(
                `${URL_API_ALB}getIterationDataHeaders`,
                {}
            );
            setAvailableHeaders(headers || []);

            // 2) Obtener detalles de cada header
            const detailsEntries = await Promise.all(
                (headers || []).map(async (h) => {
                    const { data } = await axios.post<IterationDetailResponse>(
                        `${URL_API_ALB}iterationData`,
                        { id: h.id }
                    );
                    return [h.id, data] as const;
                })
            );
            const details = Object.fromEntries(detailsEntries);
            setIterationDetails(details);

            // 3) Crear un package usando el primero que venga de la API
            const firstHeader = headers?.[0];
            const firstDetail = firstHeader ? details[firstHeader.id] : null;
            const rows = firstDetail ? rowsFromIterationDetails(firstDetail) : [];

            const nextIndex = packages.length + 1;
            setPackages((prev) => [
                ...prev,
                {
                    id: crypto.randomUUID(),
                    name: `Number${nextIndex}`,
                    selected: true,
                    rows,
                },
            ]);
        } catch (e) {
            setError("No se pudo cargar la información de iteraciones.");
            console.error(e);
        } finally {
            setLoadingNewPackage(false);
        }
    };

    
    const addRow = (pkgId: string) =>
        setPackages((prev) =>
            prev.map((p) =>
                p.id === pkgId ? { ...p, rows: [...p.rows, { variable: "", value: "" }] } : p
            )
        );
    const deleteRow = (pkgId: string, rowIndex: number) =>
        setPackages((prev) =>
            prev.map((p) =>
                p.id === pkgId
                    ? { ...p, rows: p.rows.filter((_, i) => i !== rowIndex) }
                    : p
            )
        );

    const updateRow = (
        pkgId: string,
        rowIndex: number,
        field: keyof Row,
        value: string
    ) =>
        setPackages((prev) =>
            prev.map((p) =>
                p.id === pkgId
                    ? {
                        ...p,
                        rows: p.rows.map((r, i) => (i === rowIndex ? { ...r, [field]: value } : r)),
                    }
                    : p
            )
        );

    const updateName = (pkgId: string, name: string) =>
        setPackages((prev) => prev.map((p) => (p.id === pkgId ? { ...p, name } : p)));

    const toggleSelected = (pkgId: string) =>
        setPackages((prev) =>
            prev.map((p) => (p.id === pkgId ? { ...p, selected: !p.selected } : p))
        );

    const deletePackage = (pkgId: string) => {
        setPackages((prev) => prev.filter((p) => p.id !== pkgId));
    };
    const [openMenu, setOpenMenu] = useState<string | null>(null);


    return (
        <DashboardHeader pageType="api">
            {packages.length === 0 ? (
                // --- EMPTY STATE ---
                <div className="flex flex-col items-center justify-center min-h-[60vh] w-full text-center">
                    <Image
                        src={selectIterationDataIcon}
                        alt="Select a collection"
                        className="h-20 w-auto rounded-md p-2"
                    />
                    <h2 className="text-2xl font-bold text-[#5A6ACF] mb-2">Create data packages</h2>
                    <span className="block text-[#7B8CA6] text-base font-medium mb-6">
                        To use in your iterations
                    </span>

                    {error && <div className="text-red-600 text-sm mb-3">{error}</div>}

                    <div className="flex flex-row gap-4 mt-2 justify-center w-full">
                        <button
                            disabled={loadingNewPackage}
                            onClick={handleNewPackage}
                            className="flex items-center gap-2 bg-[#0A2342] text-white px-8 py-3 rounded-full font-semibold shadow hover:bg-[#18345A] transition-all text-lg disabled:opacity-60"
                        >
                            <span className="text-xl">+</span>
                            {loadingNewPackage ? "Creating..." : "New package"}
                        </button>
                        <button className="flex items-center gap-2 bg-white text-[#0A2342] px-8 py-3 rounded-full font-semibold border border-[#0A2342] shadow hover:bg-[#F5F8FB] transition-all text-lg">
                            Upload CSV
                        </button>
                    </div>
                </div>
            ) : (
                <>
                    {/* 🔹 SOLO aparece si hay packages */}
                    <h1 className="text-2xl font-bold text-[#0A2342]">Data packages</h1>
                    <p className="text-[#7B8CA6] mb-6">
                        Selected sets will be used in iterations.
                    </p>

                    <div className="space-y-6">
                        {packages.map((pkg) => (
                            <div
                                key={pkg.id}
                                className="rounded-2xl border border-[#E1E8F0] bg-white p-6"
                            >
                                {/* Header de la card */}
                                <div className="flex items-start gap-3">
                                    <input
                                        type="checkbox"
                                        className="mt-2 h-5 w-5 accent-[#0A2342] rounded"
                                        checked={pkg.selected}
                                        onChange={() => toggleSelected(pkg.id)}
                                    />
                                    <div className="flex-1">
                                        <TextInputWithClearButton
                                            id={`package-name-${pkg.id}`}
                                            label="Package name"
                                            placeholder="Number1"
                                            value={pkg.name}
                                            onChangeHandler={(e) => updateName(pkg.id, e.target.value)}
                                            isSearch={false}
                                        />
                                    </div>
                                    {/* 🔹 Botón Delete package con estilo */}
                                    <button
                                        onClick={() => {
                                            // aquí en vez de eliminar directo, abriremos el menú
                                            setOpenMenu(openMenu === pkg.id ? null : pkg.id);
                                        }}
                                        className="p-2 rounded-full hover:bg-gray-100"
                                    >
                                        <MoreVertical className="h-5 w-5 text-gray-600" />
                                    </button>


                                </div>

                                {/* Columnas */}

                                <div className="space-y-2">
                                    {pkg.rows.map((row, i) => (
                                        <div key={i} className="flex gap-2">
                                            <TextInputWithClearButton
                                                id={`row-variable-${pkg.id}-${i}`}
                                                type="text"
                                                inputMode="text"
                                                value={row.variable}
                                                onChangeHandler={(e) => updateRow(pkg.id, i, "variable", e.target.value)}
                                                placeholder="Enter variable"
                                                label="Variable"
                                                className="flex-1"
                                            />
                                            <TextInputWithClearButton
                                                id={`row-value-${pkg.id}-${i}`}
                                                type="text"
                                                inputMode="text"
                                                value={row.value}
                                                onChangeHandler={(e) => updateRow(pkg.id, i, "value", e.target.value)}
                                                placeholder="Enter value"
                                                label="Value"
                                                className="flex-1"
                                            />
                                            <button
                                                onClick={() => deleteRow(pkg.id, i)}
                                                className="px-2"
                                            >
                                                🗑
                                            </button>
                                        </div>
                                    ))}
                                </div>

                                {/* Add row */}
                                <button
                                    onClick={() => addRow(pkg.id)}
                                    className="inline-flex items-center gap-2 rounded-full border border-[#E1E8F0] px-4 py-2 text-[#0A2342] hover:bg-[#F5F8FB] mt-3"
                                >
                                    <span className="text-lg">＋</span> Add row
                                </button>
                            </div>
                        ))}

                        {/* Botones globales */}
                        <div className="flex gap-4">
                            <button
                                disabled={loadingNewPackage}
                                onClick={handleNewPackage}
                                className="flex items-center gap-2 bg-[#0A2342] text-white px-6 py-2.5 rounded-full font-semibold shadow hover:bg-[#18345A] transition-all disabled:opacity-60"
                            >
                                <span className="text-xl">+</span>
                                {loadingNewPackage ? "Creating..." : "New package"}
                            </button>
                            <button className="flex items-center gap-2 bg-white text-[#0A2342] px-6 py-2.5 rounded-full font-semibold border border-[#0A2342] shadow hover:bg-[#F5F8FB] transition-all">
                                Upload CSV
                            </button>
                        </div>
                    </div>
                </>
            )}
        </DashboardHeader>
    );
};

export default IterationDataPage;
