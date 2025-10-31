"use client";
import { useEffect, useMemo, useState } from "react";
import { DashboardHeader } from "../Layouts/main";
import axios from "axios";
import { URL_API_ALB } from "@/config";
import LoadingSkeleton from "../components/loadingSkeleton";
import NoData from "../components/NoData";
import Link from "next/link";
import { Trash2 } from "lucide-react";
import TextInputWithClearButton from "../components/InputClear";
import { SearchField } from "@/app/components/SearchField";
import { toast } from "sonner";

type Suite = {
    id: string;
    name: string;
    description?: string;
    tagNames?: string[];
    createdByName?: string;
    createdAt?: number | string;
};

const fmtDate = (ts?: number | string) => {
    if (!ts) return "";
    const n = typeof ts === "string" ? Number(ts) : ts;
    if (!Number.isFinite(n)) return "";
    try {
        return new Intl.DateTimeFormat("es-ES", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        }).format(n);
    } catch {
        return "";
    }
};

const TestSuitesPage = () => {
    const [isDarkMode, setIsDarkMode] = useState(false);
    const [testSuites, setTestSuites] = useState<Suite[]>([]);
    const [isLoadingSuites, setIsLoadingSuites] = useState(false);

    const [q, setQ] = useState("");
    const [tagFilter, setTagFilter] = useState("");
    const [creatorFilter, setCreatorFilter] = useState("");

    const chip = (dense?: boolean) =>
        isDarkMode
            ? `inline-block ${dense ? "text-xs" : "text-sm"} bg-gray-900 text-white px-2 py-1 rounded-md`
            : `inline-block ${dense ? "text-xs" : "text-sm"} bg-primary/20 text-primary px-2 py-1 rounded-md`;

    useEffect(() => {
        fetchDataSuites();
    }, []);

    const fetchDataSuites = async () => {
        try {
            setIsLoadingSuites(true);
            const response = await axios.post(`${URL_API_ALB}getTestSuiteHeaders`, {});
            setTestSuites(Array.isArray(response.data) ? response.data : []);
        } catch {
            toast.error("Error fetching test suites");
        } finally {
            setIsLoadingSuites(false);
        }
    };

    const deleteSuite = async (id: string) => {
        try {
            await axios.delete(`${URL_API_ALB}testSuite`, { data: { id } });
            toast.success("Suite deleted");
            await fetchDataSuites();
        } catch {
            toast.error("Failed to delete suite");
        }
    };

    const tagOptions = useMemo(() => {
        const set = new Set<string>();
        (testSuites || []).forEach((s) => (s.tagNames || []).forEach((t) => set.add(t)));
        return Array.from(set).map((t) => ({ label: t, value: t }));
    }, [testSuites]);

    const creatorOptions = useMemo(() => {
        const set = new Set<string>();
        (testSuites || []).forEach((s) => s.createdByName && set.add(s.createdByName));
        return Array.from(set).map((c) => ({ label: c, value: c }));
    }, [testSuites]);

    const filtered = useMemo(() => {
        return (testSuites || []).filter((s) => {
            const okName = q.trim()
                ? (s.name || "").toLowerCase().includes(q.toLowerCase()) ||
                (s.description || "").toLowerCase().includes(q.toLowerCase())
                : true;
            const okTag = tagFilter ? (s.tagNames || []).includes(tagFilter) : true;
            const okCreator = creatorFilter ? s.createdByName === creatorFilter : true;
            return okName && okTag && okCreator;
        });
    }, [testSuites, q, tagFilter, creatorFilter]);

    const surface = isDarkMode
        ? "bg-gray-800 border-gray-700 text-white"
        : "bg-white border-gray-200 text-primary";
    const subtle = isDarkMode ? "text-white/70" : "text-primary/70";
    const strong = isDarkMode ? "text-white" : "text-primary";

    return (
        <DashboardHeader onDarkModeChange={setIsDarkMode}>
            <div className="flex flex-col items-center w-full gap-4">
                <h1 className={`text-2xl font-semibold ${strong}`}>Test Suites</h1>
                <TextInputWithClearButton
                    id="q"
                    type="text"
                    inputMode="text"
                    placeholder="Search by name or description…"
                    label="Search"
                    onChangeHandler={(e) => setQ(e.target.value)}
                    value={q}
                    isSearch
                    isDarkMode={isDarkMode}
                />
                <div
                    className={`w-full rounded-2xl p-4 flex gap-3`}
                >
                    <SearchField
                        label="Filter by Tag"
                        value={tagFilter}
                        onChange={setTagFilter}
                        options={tagOptions}
                        placeholder="All tags"
                        darkMode={isDarkMode}
                    />
                    <SearchField
                        label="Filter by Creator"
                        value={creatorFilter}
                        onChange={setCreatorFilter}
                        options={creatorOptions}
                        placeholder="All creators"
                        darkMode={isDarkMode}
                    />
                </div>

                {isLoadingSuites && <LoadingSkeleton darkMode={isDarkMode} />}

                {!isLoadingSuites && filtered.length === 0 && (
                    <NoData darkMode={isDarkMode} text="No Test suites found." />
                )}

                {!isLoadingSuites && filtered.length > 0 && (
                    <div className="w-full mt-2 space-y-4">
                        {filtered.map((suite) => (
                            <div
                                key={suite.id}
                                className={`p-4 rounded-xl border ${surface}`}
                            >
                                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3">
                                    <div className="flex flex-col gap-2">
                                        <div className="flex items-center justify-between gap-3">
                                            <h2 className="text-xl font-semibold">{suite.name}</h2>

                                        </div>
                                        <p className={`mt-1 text-sm ${subtle}`}>
                                            {suite.description || "—"}
                                        </p>
                                        <div className="mt-2 flex flex-col gap-2">
                                            <span className={`${subtle} text-xs`}>ID: {suite.id}</span>

                                            <div className="flex flex-wrap gap-2 items-center">
                                                {(suite.tagNames || []).map((t) => (
                                                    <span key={t} className={`${isDarkMode ? "bg-gray-900":"bg-gray-300"} rounded-md  text-[14px] px-2 py-1`}>
                                                        {t}
                                                    </span>
                                                ))}
                                                {suite.createdByName && (
                                                    <span className={`${isDarkMode ? "bg-gray-700":"bg-gray-100"} rounded-md  text-[14px] px-2 py-1`}>By: {suite.createdByName}</span>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex flex-col items-center gap-8 h-full justify-between">
                                        <div className="flex gap-2">
                                            <Link
                                                href={`/testSuites/${suite.id}`}
                                                className={`px-3 py-2 rounded-md font-semibold ${isDarkMode
                                                    ? "bg-primary-blue/80 hover:bg-primary-blue/70 text-white"
                                                    : "bg-primary/90 hover:bg-primary/80 text-white"
                                                    }`}
                                            >
                                                View Details
                                            </Link>
                                            <button
                                                onClick={async () => {
                                                    if (
                                                        confirm(
                                                            `Delete test suite "${suite.name}"?\nThis action cannot be undone.`
                                                        )
                                                    ) {
                                                        await deleteSuite(suite.id);
                                                    }
                                                }}
                                                className={`cursor-pointer ${isDarkMode ? "bg-gray-700 hover:bg-gray-600" : "bg-gray-200 hover:bg-gray-300"} flex items-center gap-2 px-3 py-2 rounded-md`}
                                            >
                                                <Trash2 className="w-4 h-4 text-red-500" />
                                                <span className="text-sm">Delete</span>
                                            </button>
                                        </div>
                                        <div></div>
                                        <span className={`text-xs self-end ${subtle}`}>{fmtDate(suite.createdAt)}</span>

                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </DashboardHeader>
    );
};

export default TestSuitesPage;
