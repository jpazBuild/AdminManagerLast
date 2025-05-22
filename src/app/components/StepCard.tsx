import Image from "next/image";
import { Clock } from "lucide-react";
import { Popover, PopoverTrigger, PopoverContent } from "@radix-ui/react-popover";
import { FiTarget } from "react-icons/fi";

interface Step {
    status?: string;
    time?: number;
    action?: string;
    result?: string;
    error?: string;
    screenshot?: string;
}

interface StepData {
    data?: {
        selectors?: { type: string; locator: string }[];
    };
    action?: string;
}

interface StepCardProps {
    step: Step;
    stepData: StepData;
    index: number;
    handleImageClick: (image: string) => void;
}

const StepCard = ({ step, stepData, index, handleImageClick }: StepCardProps) => {
    const status = step?.status?.toLowerCase();
    const timeInSeconds = step?.time ? (Number(step.time) / 1000).toFixed(2) : null;
    const [isStepSuccess, isStepError, isProcessing, isSkipped] = ["completed", "failed", "processing", "skipped"].map(s => s === status);

    const cleanUrl = step?.screenshot?.replace(/^https?:\/\//, '');

    return (
        <div
            key={`step-${index}`}
            className={`relative p-4 flex flex-col rounded-lg shadow-md transition-all text-primary border-2 border-l-4 ${isStepSuccess
                ? "border-green-500"
                : isStepError
                    ? "border-red-500"
                    : isProcessing
                        ? "border-yellow-500"
                        : isSkipped
                            ? "border-blue-500"
                            : "border-gray-300"}`}
        >
            <div className="absolute top-0 left-0 bg-primary text-white px-3 py-1 text-sm font-semibold rounded-tl-xl rounded-br-full shadow-md">
                Step {index}
            </div>

            {Array.isArray(stepData?.data?.selectors) && stepData.data.selectors.length > 0 && (
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
                                {stepData?.data?.selectors.map((selector: { type: string; locator: string }, idx: number) => (
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
                {step?.action ?? stepData?.action}
            </p>
            <p className="text-sm mt-2 break-words">
                <strong>Status:</strong> {step?.status ?? "Pending"}
            </p>
            {step?.result && (
                <p className="text-sm break-words">
                    <strong>Result:</strong> {step?.result}
                </p>
            )}
            {step?.error && (
                <p className="text-sm text-red-500 break-words">
                    <strong>Error:</strong> {step?.error}
                </p>
            )}
            {timeInSeconds && !isProcessing && (
                <div className="absolute top-2 right-2 flex items-center text-primary/90 text-sm">
                    <Clock className="w-4 h-4 mr-1" />
                    {timeInSeconds} s
                </div>
            )}
            {isProcessing && (
                <div className="absolute top-2 right-2">
                    <div className="w-5 h-5 border-4 border-gray-300 border-t-primary rounded-full animate-spin"></div>
                </div>
            )}
            {step?.screenshot && (
                <div className="flex justify-center mt-4">
                    <div
                        className="cursor-pointer"
                        onClick={() => {                            
                            handleImageClick(`data:image/png;base64,${step.screenshot}`)
                        }}
                    >
                        <Image
                            src={
                                step.screenshot.startsWith("http")
                                    ? step.screenshot
                                    : `data:image/jpeg;base64,${step.screenshot}`
                            }
                            alt="Step screenshot"
                            width={256}
                            height={256}
                            className="rounded-lg object-cover cursor-pointer"
                            unoptimized
                        />
                    </div>
                </div>
            )}
        </div>
    );
};

export default StepCard;