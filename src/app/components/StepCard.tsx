import Image from "next/image";
import { Clock } from "lucide-react";
import { Popover, PopoverTrigger, PopoverContent } from "@radix-ui/react-popover";
import { FiTarget } from "react-icons/fi";
import { useState } from "react";

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
    stopped?: boolean; // Indicates if the step is stopped
}

const StepScreenshot = ({ step, handleImageClick }: any) => {
    const [isImageLoaded, setIsImageLoaded] = useState(false);

    if (!step?.screenshot) return null;

    const isUrl = step.screenshot?.startsWith("http");
    const imageSrc = isUrl
        ? step.screenshot
        : `data:image/jpeg;base64,${step.screenshot}`;
    return (
        <div className="flex justify-center mt-4">
            <div
                className="relative cursor-pointer w-[320px] h-[256px]"
                onClick={() => handleImageClick(imageSrc)}
            >
                {(!isImageLoaded) && (
                    <div className="w-auto h-auto bg-gray-200 rounded-md flex items-center justify-center p-12 animate-pulse">
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="w-32 h-32 text-gray-400"
                            fill="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path d="M21 19V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v14h18zM5 5h14v10l-4.5-6L9 17l-3-4z" />
                            <circle cx="15.5" cy="8.5" r="1.5" />
                        </svg>
                    </div>
                )}

                <Image
                    src={imageSrc}
                    alt="Step screenshot"
                    width={320}
                    height={256}
                    className={`rounded-lg object-contain z-10 transition-opacity duration-300 ${isImageLoaded ? "opacity-100" : "opacity-0"
                        }`}
                    onLoad={() => setIsImageLoaded(true)}
                    loading="lazy"
                    unoptimized
                />
            </div>
        </div>
    );
};

// interface StepCardProps {
//     step: StepData;
//     stepData: StepData;
//     index: number;
//     handleImageClick: () => void;
//     stopped?: boolean; // <--- agrega esto
// }

const StepCard = ({ step, stepData, index, handleImageClick, stopped = false }: StepCardProps) => {
    const status = (step?.status ?? "").toLowerCase();

    // Flags
    const isStepSuccess = status === "completed";
    const isStepError = status === "failed";
    const isProcessing = status === "processing";
    const isSkipped = status === "skipped";
    // Usamos la prop stopped para mostrar "Stopped" y estilos
    const isStopped = stopped;
    console.log("StepCard stopped:", stopped, "status:", status);

    const timeInSeconds = step?.time ? (Number(step.time) / 1000).toFixed(2) : null;

    return (
        <div
            key={`step-${index}`}
            className={`relative p-4 flex flex-col rounded-lg shadow-md transition-all text-primary border-2 border-l-4 ${isStepSuccess
                ? "border-green-500"
                : isStepError
                    ? "border-red-500"
                    : isStopped
                        ? "border-primary/50"
                        : isProcessing
                            ? "border-yellow-500"
                            : isSkipped
                                ? "border-blue-500"
                                : "border-primary/20"
                }`}
        >
            <div
                className="absolute top-0 left-0 bg-primary text-white px-3 py-1 text-sm font-semibold shadow-md"
                style={{ borderTopLeftRadius: "5px",borderBottomRightRadius: "20px" }}
            >
                Step {index}
            </div>
            <p className="text-md text-primary mt-6 font-semibold break-words max-w-full">
                {step?.action ?? stepData?.action}
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
            {isProcessing && !isStopped && (
                <div className="absolute top-2 right-2">
                    <div className="w-5 h-5 border-4 border-gray-300 border-t-primary rounded-full animate-spin"></div>
                </div>
            )}
            {/* {isStopped && (
                <div className="absolute bottom-2 right-2 text-gray-400 text-xs font-semibold">
                    <span>Stopped</span>
                </div>
            )} */}
            {step?.screenshot && (
                <StepScreenshot step={step} handleImageClick={handleImageClick} />
            )}
        </div>
    );
};


// const StepCard = ({ step, stepData, index, handleImageClick }: StepCardProps) => {
//     const status = step?.status?.toLowerCase();
//     const timeInSeconds = step?.time ? (Number(step.time) / 1000).toFixed(2) : null;
//     const [isStepSuccess, isStepError, isProcessing, isSkipped] = ["completed", "failed", "processing", "skipped"].map(s => s === status);

//     const cleanUrl = step?.screenshot?.replace(/^https?:\/\//, '');

//     return (
//         <div
//             key={`step-${index}`}
//             className={`relative p-4 flex flex-col rounded-lg shadow-md transition-all text-primary border-2 border-l-4 ${isStepSuccess
//                 ? "border-green-500"
//                 : isStepError
//                     ? "border-red-500"
//                     : isProcessing
//                         ? "border-yellow-500"
//                         : isSkipped
//                             ? "border-blue-500"
//                             : "border-gray-300"}`}
//         >
//             <div className="absolute top-0 left-0 bg-primary text-white px-3 py-1 text-sm font-semibold rounded-tl-xl rounded-br-full shadow-md">
//                 Step {index}
//             </div>

//             {Array.isArray(stepData?.data?.selectors) && stepData.data.selectors.length > 0 && (
//                 <div className="self-center">
//                     <Popover>
//                         <PopoverTrigger asChild>
//                             <button className="bg-primary cursor-pointer text-white p-2 rounded-full shadow-md hover:bg-primary/90 transition">
//                                 <FiTarget size={18} />
//                             </button>
//                         </PopoverTrigger>
//                         <PopoverContent className="bg-white text-primary z-50 p-3 rounded-md shadow-lg min-w-[200px] max-w-[300px]">
//                             <h4 className="font-semibold text-sm mb-2">Selectors</h4>
//                             <ul className="text-sm space-y-1">
//                                 {stepData?.data?.selectors.map((selector: { type: string; locator: string }, idx: number) => (
//                                     <li key={idx} className="border-b py-1">
//                                         <div className="text-xs text-primary break-words">
//                                             <strong>{selector.type}</strong>: {selector.locator}
//                                         </div>
//                                     </li>
//                                 ))}
//                             </ul>
//                         </PopoverContent>
//                     </Popover>
//                 </div>
//             )}

//             <p className="text-md text-primary mt-6 font-semibold break-words max-w-full">
//                 {step?.action ?? stepData?.action}
//             </p>
//             <p className="text-sm mt-2 break-words">
//                 <strong>Status:</strong> {step?.status ?? "Pending"}
//             </p>
//             {step?.result && (
//                 <p className="text-sm break-words">
//                     <strong>Result:</strong> {step?.result}
//                 </p>
//             )}
//             {step?.error && (
//                 <p className="text-sm text-red-500 break-words">
//                     <strong>Error:</strong> {step?.error}
//                 </p>
//             )}
//             {timeInSeconds && !isProcessing && (
//                 <div className="absolute top-2 right-2 flex items-center text-primary/90 text-sm">
//                     <Clock className="w-4 h-4 mr-1" />
//                     {timeInSeconds} s
//                 </div>
//             )}
//             {isProcessing && (
//                 <div className="absolute top-2 right-2">
//                     <div className="w-5 h-5 border-4 border-gray-300 border-t-primary rounded-full animate-spin"></div>
//                 </div>
//             )}
//             {step?.screenshot && (
//                 <StepScreenshot step={step} handleImageClick={handleImageClick} />
//             )}
//         </div>
//     );
// };

export default StepCard;