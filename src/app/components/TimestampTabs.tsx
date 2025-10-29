import React, { useEffect, useState, useMemo } from "react";
import StepCard from "./StepCard";
import { ImageModalWithZoom } from "./Report";
import { ExecutionSummary } from "./ExecutionSummary";

export const TimestampTabs = ({ reports = [], onStatusComputed }: any) => {
    const [selectedIndex, setSelectedIndex] = useState(0);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedImage, setSelectedImage] = useState<string>("");

    const selectedReport = reports[selectedIndex];

    const reportStatus = useMemo(() => {
        return reports?.map((report: any) => {
            const latestStep = report?.events.at(report?.events?.length - 1);
            const completed = latestStep?.status === "completed";
            const failed = latestStep?.status === "failed";

            return {
                timestamp: report?.timestamp,
                completed,
                failed,
                total: report?.events?.length,
                successRate: ((completed ? 1 : 0) / report?.events?.length * 100).toFixed(2),
            };
        });
    }, [reports]);

    const { totalCompleted, totalFailed } = useMemo(() => {
        return reportStatus.reduce(
            (acc:any, curr:any) => {
                if (curr?.completed) acc.totalCompleted += 1;
                if (curr?.failed) acc.totalFailed += 1;
                return acc;
            },
            { totalCompleted: 0, totalFailed: 0 }
        );
    }, [reportStatus]);

    const totalReports = reports?.length;

    useEffect(() => {
        if (onStatusComputed) {
            onStatusComputed({
                totalCompleted,
                totalFailed,
                totalReports,
            });
        }
    }, [totalCompleted, totalFailed, totalReports, onStatusComputed]);

    const handleImageClick = (image: string) => {
        setSelectedImage(image);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setSelectedImage("");
    };

    useEffect(() => {
        if (!isModalOpen) return;
        const handleOutsideClick = (event: MouseEvent) => {
            const modal = document.getElementById("image-modal");
            if (modal && !modal.contains(event.target as Node)) {
                handleCloseModal();
            }
        };
        document.addEventListener("mousedown", handleOutsideClick);
        return () => {
            document.removeEventListener("mousedown", handleOutsideClick);
        };
    }, [isModalOpen]);

    return (
        <>
            <div className="w-full max-w-sm mx-auto mt-4 mb-4">
                <ExecutionSummary
                    totalSuccess={totalCompleted}
                    totalFailed={totalFailed}
                    totalPending={0}
                    darkMode={false}
                />
            </div>

            <div className="space-y-6">
                <div className="p-2 flex gap-3 overflow-x-auto pb-2">
                    {reports?.map((report: any, idx: number) => {
                        const statusEntry = reportStatus.find((r:any) => r?.timestamp === report?.timestamp);
                        const isCompleted = statusEntry?.completed;
                        const isFailed = statusEntry?.failed;

                        return (
                            <div key={report?.timestamp} className="flex flex-col items-center">
                                <button
                                    onClick={() => setSelectedIndex(idx)}
                                    className={`px-4 py-2 text-sm cursor-pointer rounded-md font-medium transition ${idx === selectedIndex
                                            ? "bg-primary text-white"
                                            : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                                        }`}
                                >
                                    {new Date(report?.timestamp).toLocaleString()}
                                </button>
                                <span
                                    className={`mt-1 w-5 h-1 rounded-full ${isCompleted ? "bg-green-500" : isFailed ? "bg-red-500" : "bg-gray-400"
                                        }`}
                                    title={isCompleted ? "Éxito" : isFailed ? "Fallo" : "Desconocido"}
                                ></span>
                            </div>
                        );
                    })}
                </div>

                <div className="rounded-md p-2 bg-white shadow-sm">
                    <h3 className="font-semibold text-primary/80 mb-2">
                        Report {new Date(selectedReport?.timestamp).toLocaleString()}
                    </h3>
                    <div className="p-2 text-sm text-gray-600 flex flex-col gap-4 max-h-[80vh] overflow-y-auto">
                        {selectedReport?.events.map((ev: any, idx: any) => (
                            <StepCard
                                key={ev?.indexStep}
                                step={ev}
                                stepData={ev?.data}
                                index={idx + 1}
                                handleImageClick={() => handleImageClick(ev?.screenshot)}
                            />
                        ))}
                    </div>
                </div>
            </div>

            {isModalOpen && (
                <ImageModalWithZoom
                    isOpen={isModalOpen}
                    imageUrl={selectedImage}
                    onClose={handleCloseModal}
                />
            )}
        </>
    );
};
