import { useEffect, useState } from "react";
import Image from "next/image";
import { Clock } from "lucide-react";

const ReportUI = ({ report, key, darkMode }: any) => {
    const [error, setError] = useState<string | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedImage, setSelectedImage] = useState<string>("");
    const [expandedStep, setExpandedStep] = useState<number | null>(null);


    const handleImageClick = (image: string) => {
        setSelectedImage(image);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setSelectedImage("");
    };
    const handleStepClick = (index: number) => {
        setExpandedStep(expandedStep === index ? null : index);
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

    const groupedSteps = (report?.data ?? []).reduce((acc: any, step: any) => {
        if (step?.indexStep === undefined) return acc;

        if (!acc[step.indexStep]) {
            acc[step.indexStep] = [];
        }
        acc[step.indexStep].push(step);
        return acc;
    }, {});

    return (
        <>
            <div key={key} className="text-[#051d3d] w-full p-6 shadow-md rounded-lg">
                <span className="mt-3 text-xl font-semibold tracking-wide">Report</span>
                <div className="mt-4">
                    {/* <h3 className="text-xl font-medium mb-4">Steps:</h3> */}
                    <div className="flex flex-col gap-4 p-2">
                        {Object.entries(groupedSteps).map(([indexStep, steps]: any) => {
                            const latestStep = steps[steps.length - 1];

                            const isStepSuccess = latestStep.status.toLowerCase() === "completed";
                            const isStepError = latestStep.status.toLowerCase() === "failed";
                            const isProcessing = latestStep.status.toLowerCase() === "processing";

                            return (
                                <div
                                    key={indexStep}
                                    className={`relative p-4 rounded-lg shadow-md transition-all ${darkMode ? "text-[#021d3d]" : ""
                                        } ${isStepSuccess
                                            ? "border-green-500 border-2 border-l-4"
                                            : isStepError
                                                ? "border-red-500 border-2 border-l-4"
                                                : isProcessing
                                                    ? "border-yellow-500 border-2 border-l-4"
                                                    : "border-gray-300"
                                        }`}
                                >
                                    <div className="absolute top-0 left-0 bg-blue-500 text-white px-3 py-1 text-sm font-semibold rounded-tl-xl rounded-br-full shadow-md">
                                        Step {Number(indexStep) + 1}
                                    </div>

                                    <div className="absolute top-2 right-2 flex items-center text-gray-600 text-sm">
                                        {isProcessing ? (
                                            <div className="w-4 h-4 border-2 border-gray-300 border-t-[#051d3d] rounded-full animate-spin" style={{ borderTopColor: "#051d3d" }}></div>
                                        ) : (
                                            <>
                                                <Clock className="w-4 h-4 mr-1" />
                                                {latestStep.time} ms
                                            </>
                                        )}
                                    </div>

                                    <p className="text-md mt-6 font-semibold break-words max-w-full">
                                        {latestStep.action || latestStep.step}
                                    </p>

                                    <p className="text-sm mt-2">
                                        <strong>Status:</strong> {latestStep.status}
                                    </p>

                                    {latestStep.result && (
                                        <p className="text-sm">
                                            <strong>Result:</strong> {latestStep.result}
                                        </p>
                                    )}

                                    {latestStep.action && (
                                        <p className="text-sm">
                                            <strong>Action:</strong> <p className="break-words">{latestStep.action}</p>
                                        </p>
                                    )}

                                    {latestStep.error && (
                                        <p className="text-sm text-red-500">
                                            <strong>Error:</strong> {latestStep.error}
                                        </p>
                                    )}

                                    {latestStep.screenshot && (
                                        <div className="flex justify-center mt-4">
                                            <div
                                                className="cursor-pointer"
                                                onClick={() =>
                                                    handleImageClick(
                                                        `data:image/png;base64,${latestStep.screenshot}`
                                                    )
                                                }
                                            >
                                                <Image
                                                    src={`data:image/png;base64,${latestStep.screenshot}`}
                                                    alt="Step screenshot"
                                                    width={256}
                                                    height={256}
                                                    className="rounded-lg object-cover"
                                                />
                                            </div>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>

            {isModalOpen && (
                <div
                    className="fixed inset-0 bg-[#021d3d] bg-opacity-75 flex justify-center items-center z-50"
                    onClick={handleCloseModal}
                >
                    <div
                        id="image-modal"
                        className="relative bg-white p-4 rounded-md"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <button
                            onClick={handleCloseModal}
                            className="absolute top-2 right-2 text-gray-600 text-3xl font-bold"
                        >
                            ×
                        </button>
                        <Image
                            src={selectedImage}
                            alt="Step screenshot"
                            width={800}
                            height={800}
                            className="rounded-md"
                        />
                    </div>
                </div>
            )}
        </>

    );

}

export default ReportUI;