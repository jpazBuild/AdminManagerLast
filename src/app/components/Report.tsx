import { useEffect, useState } from "react";
import Image from "next/image";
import StepCard from "./StepCard";
import { DataJsonStep, StepData } from "../home/types";
import { FaXmark } from "react-icons/fa6";

interface StepEvent {
    indexStep: number;
    [key: string]: any;
}

interface ReportUIProps {
    report?: any;
    testcaseId: string;
    darkMode?: boolean;
    dataStepsTotal: Array<{ indexStep: number }>;
    progressValue: number;
    data: Array<{ [key: string]: string | number | boolean | null }>;
}

const ReportUI = ({
    report,
    testcaseId,
    dataStepsTotal,
    progressValue,
}: ReportUIProps) => {    
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedImage, setSelectedImage] = useState<string>("");

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

    // const firstExtraStep = report[0]

    // const groupedSteps: Record<number, Array<any>> = Array.isArray(report)
    //     ? report.reduce((acc: Record<number, Array<any>>, step: any) => {
    //         if (typeof step?.indexStep === "number") {
    //             if (!acc[step.indexStep]) acc[step.indexStep] = [];
    //             acc[step.indexStep].push(step);
    //         }
    //         return acc;
    //     }, {})
    //     : {};


    // const groupedIndices = Object.keys(groupedSteps).map((k) => parseInt(k, 10));

    // const dataIndices = dataStepsTotal.map((step) => step.indexStep);
    // const extraIndices = groupedIndices.filter(
    //     (index) => !dataIndices.includes(index) && index !== 0
    // );

    const result: StepEvent[] = Object.values(report)
        .filter((step): step is StepEvent => typeof step === "object" && step !== null && typeof (step as any).indexStep === "number")
        .map((step) => ({
            ...step
        }));

    return (
        <>
            <div
                key={`report-${testcaseId}`}
                className="text-primary w-full p-6 shadow-md rounded-lg"
            >
                <span className="mt-3 text-xl font-semibold tracking-wide">Report</span>
                <div className="flex flex-col gap-4">
                    {result?.map((step: StepEvent) => {
                        return (
                            <div key={`Step-${step.indexStep}`}>
                                <StepCard
                                    step={step as StepData}
                                    stepData={step as StepData}
                                    index={Number(step.indexStep) + 1}
                                    handleImageClick={() => handleImageClick(step?.screenshot)}
                                />
                            </div>
                        );
                    }
                    )}
                </div>
            </div>

            {isModalOpen && (
                <div
                    className="fixed inset-0 bg-primary bg-opacity-75 flex justify-center items-center z-50"
                    onClick={handleCloseModal}
                >
                    <div
                        id="image-modal"
                        className="relative bg-white p-4 rounded-md"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <button
                            onClick={handleCloseModal}
                            className="absolute top-2 right-2 text-primary text-3xl font-bold"
                        >
                            <FaXmark />
                        </button>
                        <Image
                            src={selectedImage}
                            alt="Step screenshot"
                            width={500}
                            height={500}
                            className="rounded-md"
                            priority
                        />
                    </div>
                </div>
            )}
        </>
    );
};

export default ReportUI;
