"use client";

import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import axios from "axios";
import { URL_API_ALB } from "@/config";
import StepCard from "../../components/StepCard";
import { ImageModalWithZoom } from "../../components/Report";
import { DownloadIcon, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { buildStandaloneHtml } from "@/utils/buildHtmlreport";
import { DashboardHeader } from "@/app/Layouts/main";

type ReportEvent = {
    data: any;
    indexStep: number;
    action: string;
    description: string;
    status: string;
    screenshot?: string;
    isConditional?: boolean;
    time?: string | number;
};

type ReportHeader = {
    id: string;
    name: string;
    description?: string;
    createdAt?: number;
    createdBy?: string;
    groupName?: string;
    moduleName?: string;
    subModuleName?: string;
    tagNames?: string[];
};

type ReportManifest = {
    urlReport: string;
    key: string;
    type: string;
    id: string;
    timestamp: string;
    status: "passed" | "failed";
    reportName: string;
    header: ReportHeader[] | ReportHeader | undefined;
};

type ReportIndexApiResponse = Record<string, ReportManifest[]>;
type ReportFile = {
    events: ReportEvent[];
    type: string;
    id: string;
    timestamp: string;
    status: "passed" | "failed" | string;
    reportName: string;
};

const ensureIsoZ = (s?: string) => {
    if (!s) return s as any;
    if (/^\d{4}-\d{2}-\d{2}T/.test(s) && s.endsWith("Z")) return s;
    const d = new Date(s);
    return isNaN(d.getTime()) ? s : d.toISOString();
};

async function fetchSignedJson(url: string) {
    const resp = await fetch(url, { method: "GET" });
    if (!resp.ok) throw new Error(`S3 fetch failed: ${resp.status} ${resp.statusText}`);
    const ct = resp.headers.get("content-type") || "";
    return ct.includes("application/json")
        ? resp.json()
        : JSON.parse((await resp.text()) || "null");
}

function pickHeader(h?: ReportHeader[] | ReportHeader) {
    if (!h) return undefined;
    return Array.isArray(h) ? h[0] : h;
}

function downloadStringAsHtml(html: string, filename: string) {
    const blob = new Blob([html], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename.endsWith(".html") ? filename : `${filename}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 500);
}

async function inlineImages(root: HTMLElement) {
    const imgs = Array.from(root.querySelectorAll("img"));
    await Promise.all(
        imgs.map(async (img) => {
            const src = img.getAttribute("src");
            if (!src || src.startsWith("data:")) return;
            try {
                const resp = await fetch(src);
                const blob = await resp.blob();
                const reader = new FileReader();
                const dataUrl: string = await new Promise((resolve, reject) => {
                    reader.onloadend = () => resolve(String(reader.result));
                    reader.onerror = reject;
                    reader.readAsDataURL(blob);
                });
                img.setAttribute("src", dataUrl);
            } catch { }
        })
    );
}

const SingleReportPage = () => {
    const { idReport } = useParams<{ idReport: string }>();
    const router = useRouter();

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [manifest, setManifest] = useState<ReportManifest | null>(null);
    const [header, setHeader] = useState<ReportHeader | undefined>(undefined);
    const [file, setFile] = useState<ReportFile | null>(null);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedImage, setSelectedImage] = useState("");
    const containerRef = useRef<HTMLDivElement | null>(null);

    const back = async () => {
        await router.push("/reports");
    };

    useEffect(() => {
        let abort = false;

        const run = async () => {
            setLoading(true);
            setError(null);
            try {
                const url = `${String(URL_API_ALB)}getReports`;
                const payload = {
                    type: "tests-reports",
                    includeHeader: true,
                    id: idReport,
                };

                const res = await axios.post(url, payload);
                let indexData: ReportIndexApiResponse;

                if (res?.data?.responseSignedUrl) {
                    indexData = (await fetchSignedJson(String(res.data.responseSignedUrl))) as ReportIndexApiResponse;
                } else {
                    indexData = (res?.data ?? {}) as ReportIndexApiResponse;
                }
                if (abort) return;

                const allManifests: ReportManifest[] = Object.values(indexData || {}).flat() || [];
                if (allManifests.length === 0) {
                    throw new Error("No report manifests found for this id.");
                }

                allManifests.sort(
                    (a, b) => new Date(ensureIsoZ(b.timestamp)).getTime() - new Date(ensureIsoZ(a.timestamp)).getTime()
                );
                const mf = allManifests[0];
                const hdr = pickHeader(mf.header);

                setManifest(mf);
                setHeader(hdr);

                const reportResp = await fetch(mf.urlReport);
                if (!reportResp.ok) throw new Error(`Report fetch failed: ${reportResp.status}`);
                const reportJson = await reportResp.json();

                const fileNorm: ReportFile = {
                    events: Array.isArray(reportJson?.events) ? reportJson.events : [],
                    type: reportJson?.type ?? "",
                    id: reportJson?.id ?? "",
                    timestamp: reportJson?.timestamp ?? "",
                    status: reportJson?.status ?? "unknown",
                    reportName: reportJson?.reportName ?? "",
                };

                if (abort) return;
                setFile(fileNorm);
            } catch (e: any) {
                if (abort) return;
                console.error(e);
                setError(e?.message || "Failed to load report.");
            } finally {
                if (!abort) setLoading(false);
            }
        };

        run();
        return () => {
            abort = true;
        };
    }, [idReport]);

    const onImageClick = (src: string) => {
        setSelectedImage(src);
        setIsModalOpen(true);
    };
    const closeModal = () => {
        setIsModalOpen(false);
        setSelectedImage("");
    };

    const downloadRenderedHtml = useCallback(async () => {
        if (!file || !containerRef.current) {
            toast.error("Nothing to export");
            return;
        }
        const host = containerRef.current.cloneNode(true) as HTMLElement;
        await inlineImages(host).catch(() => { });
        const html = buildStandaloneHtml({
            file,
            bodyInnerHtml: host.outerHTML,
            extraHeadHtml: `
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">`,
            header,
        });
        const nice = `${(file.reportName || header?.name || idReport).replace(/\s+/g, "-")}-${new Date()
            .toISOString()
            .slice(0, 19)
            .replace(/[:T]/g, "-")}`;
        downloadStringAsHtml(html, `${nice}.html`);
        toast.success("HTML report downloaded");
    }, [file, header, idReport]);

    const title = useMemo(
        () => header?.name || file?.reportName || `Report ${idReport}`,
        [header?.name, file?.reportName, idReport]
    );

    return (

        <DashboardHeader>
            <div className="p-6 w-full lg:w-2/3 mx-auto">
                <div className="flex items-center justify-between mb-4">
                    <button
                        onClick={back}
                        className="flex items-center gap-2 text-sm px-3 py-2 rounded-md border hover:bg-gray-50"
                    >
                        <ArrowLeft className="h-4 w-4" />
                        Back
                    </button>

                    {file?.events?.length ? (
                        <button
                            onClick={downloadRenderedHtml}
                            className="flex items-center gap-2 text-sm px-3 py-2 rounded-md border border-primary/60 text-primary/70 hover:shadow"
                        >
                            <DownloadIcon className="h-4 w-4" />
                            HTML Report
                        </button>
                    ) : null}
                </div>

                <h1 className="text-2xl font-bold text-primary/85">{title}</h1>
                <div className="text-xs text-primary/50 mb-4">ID: {idReport}</div>

                {error && <div className="text-red-600 text-sm mb-4">{error}</div>}
                {loading && <div className="text-sm text-primary/70">Loading report…</div>}

                {!loading && !error && manifest && (
                    <div className={`rounded-md p-4 mb-4 ${manifest.status === "passed" ? "border-l-4 border-green-500" : "border-l-4 border-red-500"}`}>
                        <div className="text-sm text-gray-600">
                            <div><b>Status:</b> {manifest.status}</div>
                            <div><b>Timestamp:</b> {new Date(manifest.timestamp).toLocaleString()}</div>
                            {header?.groupName && <div><b>Group:</b> {header.groupName}</div>}
                            {header?.moduleName && <div><b>Module:</b> {header.moduleName}</div>}
                            {header?.subModuleName && <div><b>Submodule:</b> {header.subModuleName}</div>}
                        </div>
                    </div>
                )}

                {file && (
                    <div ref={containerRef} className="flex flex-col gap-2">
                        {file.events.map((ev, i) => (
                            <StepCard
                                key={`${ev.indexStep}-${i}`}
                                step={{ ...ev, time: ev.time !== undefined ? Number(ev.time) : undefined }}
                                stepData={ev.data}
                                index={i + 1}
                                handleImageClick={onImageClick}
                            />
                        ))}
                    </div>
                )}

                {isModalOpen && (
                    <ImageModalWithZoom isOpen={isModalOpen} imageUrl={selectedImage} onClose={closeModal} />
                )}
            </div>

        </DashboardHeader>

    );
};

export default SingleReportPage;
