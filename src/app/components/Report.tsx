import { useEffect, useState } from "react";
import Image from "next/image";
import { Clock } from "lucide-react";
import { Popover, PopoverTrigger, PopoverContent } from "@radix-ui/react-popover"; // Adjust the import path if necessary
import { FiTarget } from "react-icons/fi";

const ReportUI = ({ data, report, key, darkMode, dataStepsTotal }: any) => {
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
            <div key={key} className="text-primary w-full p-6 shadow-md rounded-lg">
                <span className="mt-3 text-xl font-semibold tracking-wide">Report</span>
                <div className="flex flex-col gap-4">
                    {dataStepsTotal?.map((step: any, index: number) => {
                        const stepsForIndex = groupedSteps[index] || [];
                        const latestStep = stepsForIndex.at(-1);
                        const isStepSuccess = latestStep?.status?.toLowerCase() === "completed";
                        const isStepError = latestStep?.status?.toLowerCase() === "failed";
                        const isProcessing = latestStep?.status?.toLowerCase() === "processing";
                        const isSkipped = latestStep?.status?.toLowerCase() === "skipped";
                        const timeInSeconds = latestStep ? (Number(latestStep.time) / 1000).toFixed(2) : null;
                        return (
                            <div
                                key={`${step.action}-${index}`}
                                id={`${step.action}-${index}`}
                                className={`relative p-4 flex flex-col rounded-lg shadow-md transition-all text-primary border-2 border-l-4 ${isStepSuccess
                                    ? "border-green-500"
                                    : isStepError
                                        ? "border-red-500"
                                        : isProcessing
                                            ? "border-yellow-500"
                                            : isSkipped
                                                ? "border-blue-500"
                                                : "border-gray-300"
                                    }`}
                            >
                                <div className="absolute top-0 left-0 bg-primary text-white px-3 py-1 text-sm font-semibold rounded-tl-xl rounded-br-full shadow-md">
                                    Step {Number(index) + 1}
                                </div>
                                {step?.data?.selectors?.length > 0 && (
                                    <div className="self-center">
                                        <Popover>
                                            <PopoverTrigger asChild>
                                                <button className="bg-primary text-white p-2 rounded-full shadow-md hover:bg-primary/90 transition">
                                                    <FiTarget size={18} />
                                                </button>
                                            </PopoverTrigger>
                                            <PopoverContent className="bg-white text-primary z-50 p-3 rounded-md shadow-lg min-w-[200px] max-w-[300px]">
                                                <h4 className="font-semibold text-sm mb-2">Selectors</h4>
                                                <ul className="text-sm space-y-1">
                                                    {step.data.selectors.map((selector: any, idx: number) => (
                                                        <li key={idx} className="border-b py-1">
                                                            <div className="text-xs text-primary break-words text-muted-foreground">
                                                                <strong>{selector.type}</strong>: {selector.locator}
                                                            </div>
                                                        </li>
                                                    ))}
                                                </ul>
                                            </PopoverContent>
                                        </Popover>
                                    </div>
                                )}
                                <p className="text-md text-primary mt-6 font-semibold break-words max-w-full">
                                    {groupedSteps[index]?.length > 1 ? latestStep?.action : step.action}
                                </p>
                                {latestStep && (
                                    <>
                                        <div className="absolute top-2 right-2 flex items-center text-primary/90 text-sm">
                                            {isProcessing ? (
                                                <div
                                                    className="w-5 h-5 border-4 border-gray-300 border-t-primary rounded-full animate-spin"
                                                    style={{ borderTopColor: "#223853" }}
                                                ></div>
                                            ) : (
                                                <>
                                                    <Clock className="w-4 h-4 mr-1" />
                                                    {timeInSeconds} s
                                                </>
                                            )}
                                        </div>


                                        <p className="text-sm mt-2 break-words">
                                            <strong>Status:</strong> {latestStep.status}
                                        </p>
                                        {latestStep.result && (
                                            <p className="text-sm break-words">
                                                <strong>Result:</strong> {latestStep.result}
                                            </p>
                                        )}

                                        {latestStep.error && (
                                            <p className="text-sm text-red-500 break-words">
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
                                                        className="rounded-lg object-cover cursor-pointer"
                                                    />
                                                </div>
                                            </div>
                                        )}
                                    </>
                                )}
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