import Image from "next/image";
import { Clock, CodeIcon } from "lucide-react";
import { useMemo, useState } from "react";
import { httpMethodsStyle } from "../api/utils/colorMethods";
import TextInputWithClearButton from "./InputClear";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneLight } from "react-syntax-highlighter/dist/esm/styles/prism";
import ButtonTab from "./ButtonTab";
import ModalCustom from "./ModalCustom";

interface Step {
    status?: string;
    time?: number;
    action?: string;
    result?: string;
    error?: string;
    screenshot?: string;
    apisScriptsResult?: any;
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
    stopped?: boolean;
    darkMode?: boolean;
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


const StepCard = ({ step, stepData, index, handleImageClick, stopped = false,darkMode=false }: StepCardProps) => {
    const status = (step?.status ?? "").toLowerCase();
    const [activeTabApi, setActiveTabApi] = useState("request");
    const [openModalApi, setOpenModalApi] = useState(false);
    const isStepSuccess = status === "completed";
    const isStepError = status === "failed";
    const isProcessing = status === "processing";
    const isSkipped = status === "skipped";
    const isStopped = stopped;
    const gqlQuery = step.apisScriptsResult?.environment?.__request?.data?.query;
    const timeInSeconds = step?.time ? (Number(step.time) / 1000).toFixed(2) : null;
    const raw = step?.apisScriptsResult?.environment?.__request?.data

    const reqHeadersStr = useMemo(
        () => JSON.stringify(step?.apisScriptsResult?.environment?.__request?.headers, null, 2),
        [step?.apisScriptsResult?.environment?.__request?.headers]
    );

    return (
        <div
            key={`step-${index}`}
            className={`relative p-4 flex flex-col rounded-lg shadow-md transition-all ${darkMode ? "!text-white":"text-primary"} border-2 border-l-4 ${isStepSuccess
                ? "border-emerald-500"
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
                className={`absolute top-0 left-0 ${darkMode ? "bg-primary-blue/50" : "bg-primary"} text-white px-3 py-1 text-sm font-semibold shadow-md`}
                style={{ borderTopLeftRadius: "5px", borderBottomRightRadius: "20px" }}
            >
                Step {index}
            </div>

            <p className={`${darkMode ? "text-white/90":"text-primary/90"} mt-6 mb-2 whitespace-pre-wrap break-words`}>
                {step?.action ?? stepData?.action}
            </p>

            {step?.apisScriptsResult && (
                <button onClick={() => setOpenModalApi(true)} className="self-center  bg-primary/10 px-4 py-2 rounded-md mt-4 w-fit flex items-center gap-2">
                    <CodeIcon className="w-4 h-4" /> View API/Script details
                </button>
            )}

            {openModalApi && step?.apisScriptsResult && (


                <ModalCustom
                    open={openModalApi}
                    onClose={() => setOpenModalApi(false)}
                    width="!w-2/3"
                >
                    <div className="w-full">
                        <h2 className="text-xl font-bold text-primary/85">
                            API/Script Execution Details
                        </h2>

                        <div className=" p-2 bg-gray-100 rounded-md border border-gray-300 h-full text-primary/80">

                            <div className="flex flex-col h-full">
                                <div className="flex gap-2 items-center justify-center mb-2">
                                    {
                                        ["request", "response", "environment"].map((tab) => (
                                            <ButtonTab
                                                key={tab}
                                                value={tab}
                                                label={tab.charAt(0).toUpperCase() + tab.slice(1)}
                                                isActive={activeTabApi === tab}
                                                onClick={(val) => setActiveTabApi(val)}
                                                isDarkMode={false}
                                                className="text-[14px]"
                                                Icon={null}
                                            />
                                        ))

                                    }
                                </div>

                                {activeTabApi === "request" && (
                                    <>
                                        {step.apisScriptsResult?.environment?.__request?.url && (
                                            <div className="mt-2">
                                                <strong>Request URL:</strong>
                                                <pre className="whitespace-pre-wrap break-words text-sm">
                                                    {step.apisScriptsResult?.environment?.__request?.url}
                                                </pre>
                                            </div>
                                        )}

                                        {step.apisScriptsResult?.environment?.__request?.method && (
                                            <div className="mt-2">
                                                <strong>Request Method:</strong>
                                                <span
                                                    className={`ml-2 text-xs px-2 py-1 rounded ${httpMethodsStyle(
                                                        step.apisScriptsResult?.environment?.__request?.method?.toUpperCase()
                                                    )}`}
                                                >
                                                    {step.apisScriptsResult?.environment?.__request?.method?.toUpperCase()}
                                                </span>
                                            </div>
                                        )}

                                        <div className="flex flex-col gap-2">
                                            <strong className="mt-2">Request Headers:</strong>
                                            {Object.entries(step.apisScriptsResult?.environment?.__request?.headers || {}).length === 0 && (
                                                <p className="text-sm text-gray-500">No headers available.</p>
                                            )}
                                            {Object.entries(step.apisScriptsResult?.environment?.__request?.headers || {}).length > 0 && (
                                                <div className="p-2 flex flex-col gap-2 max-h-[600px] overflow-y-auto overflow-x-hidden mt-1">
                                                    {Object.entries(step.apisScriptsResult?.environment?.__request?.headers || {}).map(([key, value]) => (
                                                        <TextInputWithClearButton
                                                            label={key}
                                                            key={key}
                                                            placeholder=""
                                                            id={key}
                                                            type="text"
                                                            value={String(value)}
                                                            readOnly
                                                        />
                                                    ))}
                                                </div>
                                            )}
                                        </div>

                                        {gqlQuery && (
                                            <div className="mt-2">
                                                <strong>Request Query:</strong>
                                                <SyntaxHighlighter
                                                    language="graphql"
                                                    style={oneLight}
                                                    customStyle={{ borderRadius: "0.5rem", padding: "1rem", fontSize: "0.875rem" }}
                                                >
                                                    {gqlQuery}
                                                </SyntaxHighlighter>
                                            </div>
                                        )}
                                        {!gqlQuery &&
                                            raw && (
                                                <div className="mt-2">
                                                    <strong>Raw Request Body:</strong>
                                                    <SyntaxHighlighter
                                                        language="json"
                                                        style={oneLight}
                                                        customStyle={{ borderRadius: "0.5rem", padding: "1rem", fontSize: "0.875rem" }}
                                                    >
                                                        {JSON.stringify(raw, null, 2)}
                                                    </SyntaxHighlighter>
                                                </div>
                                            )
                                        }

                                        {step.apisScriptsResult?.environment?.__request?.data?.variables && (
                                            <div className="mt-2">
                                                <strong>Variables:</strong>
                                                <SyntaxHighlighter
                                                    language="json"
                                                    style={oneLight}
                                                    customStyle={{ borderRadius: "0.5rem", padding: "1rem", fontSize: "0.875rem" }}
                                                >
                                                    {JSON.stringify(
                                                        step.apisScriptsResult?.environment?.__request?.data.variables,
                                                        null,
                                                        2
                                                    )}
                                                </SyntaxHighlighter>

                                            </div>
                                        )}
                                    </>
                                )}
                                {activeTabApi === "response" && (
                                    <SyntaxHighlighter
                                        language="json"
                                        style={oneLight}
                                        customStyle={{ borderRadius: "0.5rem", padding: "1rem", fontSize: "0.875rem" }}
                                    >
                                        {JSON.stringify(
                                            step.apisScriptsResult?.environment?.__response?.json,
                                            null,
                                            2
                                        )}
                                    </SyntaxHighlighter>
                                )}
                                {activeTabApi === "environment" && (
                                    <>
                                        {Object.keys(step.apisScriptsResult?.environment?.environment || {}).length === 0 && (
                                            <p className="text-sm text-gray-500">No environment variables available.</p>
                                        )}
                                        {Object.entries(step.apisScriptsResult?.environment?.environment || {}).length > 0 && (
                                            <>
                                                <div className="flex flex-col gap-2 max-h-[600px] overflow-y-auto overflow-x-hidden">
                                                    {Object.entries(step.apisScriptsResult?.environment?.environment || {}).map(([key, value]) => (

                                                        <TextInputWithClearButton
                                                            label={key}
                                                            key={key}
                                                            placeholder=""
                                                            id={key}
                                                            type="text"
                                                            value={String(value)}
                                                            readOnly
                                                        />

                                                    ))}
                                                </div>
                                            </>

                                        )}
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                </ModalCustom>
               
            )}

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
                <div className={`absolute top-2 right-2 flex items-center ${darkMode ? "text-white/90":"text-primary/90"} text-sm`}>
                    <Clock className="w-4 h-4 mr-1" />
                    {timeInSeconds} s
                </div>
            )}
            {isProcessing && !isStopped && (
                <div className="absolute top-2 right-2">
                    <div className="w-5 h-5 border-4 border-gray-300 border-t-primary rounded-full animate-spin"></div>
                </div>
            )}
            {step?.screenshot && (
                <StepScreenshot step={step} handleImageClick={handleImageClick} />
            )}
        </div>
    );
};

export default StepCard;