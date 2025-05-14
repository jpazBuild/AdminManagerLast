import { useEffect, useState } from "react";
import Image from "next/image";
import StepCard from "./StepCard";
import { DataJsonStep, StepData } from "../home/types";

interface ReportUIProps {
    report?: { data: Array<{ indexStep?: number }> };
    testcaseId: string;
    darkMode?: boolean;
    dataStepsTotal: Array<{ indexStep: number }>;
    progressValue: number;
    data: Array<{ [key: string]: string | number | boolean | null }>;
}

const ReportUI = ({ report, testcaseId, dataStepsTotal, progressValue }: ReportUIProps) => {
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

    const groupedSteps = (report?.data ?? []).reduce((acc: Record<number, Array<{ indexStep: number }>>, step: { indexStep?: number }) => {
        if (step?.indexStep === undefined) return acc;

        if (!acc[step.indexStep]) {
            acc[step.indexStep] = [];
        }
        acc[step.indexStep].push(step as { indexStep: number });
        return acc;
    }, {});

    const firstExtraSteps: DataJsonStep | null = groupedSteps[0]?.at(-1) || null;
    
    const groupedIndices = Object.keys(groupedSteps)?.map(k => parseInt(k, 10));
    const dataIndices = dataStepsTotal.map((_,) => _.indexStep);
    const extraIndices = groupedIndices?.filter(
        index => !dataIndices.includes(index) && index !== 0
    );

    return (
        <>
            <div key={`report ${testcaseId}`} className="text-primary w-full p-6 shadow-md rounded-lg">
                <span className="mt-3 text-xl font-semibold tracking-wide">Report</span>
                <div className="flex flex-col gap-4">

                    {(firstExtraSteps) && (
                        <div key={`Step-${firstExtraSteps?.indexStep}`}>
                        <StepCard step={firstExtraSteps} stepData={firstExtraSteps as StepData} index={(firstExtraSteps?.indexStep ?? 0) + 1} handleImageClick={handleImageClick} />
                        </div>
                    )

                    }
                    {dataStepsTotal?.map((step: DataJsonStep, ) => {
                        const stepsForIndex = groupedSteps[step.indexStep ?? 0] || [];
                        const latestStep = stepsForIndex.at(-1);
                        return (

                            <div key={`Step-${step.indexStep}`}>
                                <StepCard step={latestStep as StepData}
                                stepData={step as StepData}
                                index={Number(step?.indexStep ?? 0) + 1} 
                                handleImageClick={handleImageClick} />

                            </div>


                        );
                    })}

                    {progressValue === 100 &&
                        extraIndices
                            .sort((a, b) => a - b)
                            .map((index) => {
                                const step = groupedSteps[index]?.at(-1);
                                if (!step) return null;                              

                                return (
                                    <div key={`Step-${step.indexStep}`}>
                                    <StepCard step={step as DataJsonStep}
                                    stepData={step as DataJsonStep}
                                    index={Number(step?.indexStep) + 1} 
                                    handleImageClick={handleImageClick} />
                                    </div>
                                    
                                );
                            })}


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
                            ×
                        </button>
                        <Image
                            src={selectedImage}
                            alt="Step screenshot"
                            width={800}
                            height={800}
                            className="rounded-md"
                            priority
                        />
                    </div>
                </div>
            )}
        </>

    );

}

export default ReportUI;