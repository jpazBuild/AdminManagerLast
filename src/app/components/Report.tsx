import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import StepCard from "./StepCard";
import { StepData } from "../home/types";
import { FaXmark } from "react-icons/fa6";
import { FaSearchMinus, FaSearchPlus } from "react-icons/fa";

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
    stopped: any
}
interface ImageModalProps {
    isOpen: boolean;
    imageUrl: string;
    onClose: () => void;
}

export const ImageModalWithZoom = ({ isOpen, imageUrl, onClose }: ImageModalProps) => {
    const [isImageLoaded, setIsImageLoaded] = useState(false);
    const [showImage, setShowImage] = useState(false);
    const [zoom, setZoom] = useState(1);
    const [position, setPosition] = useState({ x: 0, y: 0 });
    const containerRef = useRef<HTMLDivElement>(null);
    const isDragging = useRef(false);
    const dragStart = useRef({ x: 0, y: 0 });

    useEffect(() => {
        if (isOpen && imageUrl) {
            setIsImageLoaded(false);
            setShowImage(false);
            setZoom(1);
            setPosition({ x: 0, y: 0 });

            const simulateDelay = 1000;

            const isBase64Raw = !imageUrl?.startsWith("http") && !imageUrl?.startsWith("data:image");
            const finalSrc = isBase64Raw ? `data:image/jpeg;base64,${imageUrl}` : imageUrl;

            const img = new window.Image();
            img.src = finalSrc;

            img.onload = () => {
                if (img.width > 1 && img.height > 1) {
                    setTimeout(() => {
                        setShowImage(true);
                    }, simulateDelay);
                }
            };

            img.onerror = () => {
                setShowImage(false);
            };

            const scrollTimer = setTimeout(() => {
                if (containerRef.current) {
                    containerRef.current.scrollTo({
                        top: 0,
                        left: 0,
                        behavior: "smooth",
                    });
                }
            }, simulateDelay);

            return () => {
                clearTimeout(scrollTimer);
            };
        }
    }, [isOpen, imageUrl]);


    const handleWheel = (e: React.WheelEvent) => {
        e.preventDefault();
        const delta = e.deltaY < 0 ? 0.1 : -0.1;
        setZoom((z) => Math.min(Math.max(z + delta, 1), 5));
    };

    const handleMouseDown = (e: React.MouseEvent) => {
        isDragging.current = true;
        dragStart.current = { x: e.clientX - position.x, y: e.clientY - position.y };
    };

    const handleMouseUp = () => {
        isDragging.current = false;
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        if (!isDragging.current) return;
        setPosition({
            x: e.clientX - dragStart.current.x,
            y: e.clientY - dragStart.current.y,
        });
    };

    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = "hidden";
        } else {
            document.body.style.overflow = "auto";
        }

        return () => {
            document.body.style.overflow = "auto";
        };
    }, [isOpen]);

    if (!isOpen) return null;

    return (
        <div
            className="fixed inset-0 bg-white bg-opacity-75 flex justify-center items-center z-50 "
            onClick={onClose}
        >
            <div
                className="relative bg-white p-4 rounded-md overflow-hidden max-w-[1280px] max-h-[800px]"
                onClick={(e) => e.stopPropagation()}
            >
                <button
                    onClick={onClose}
                    className="absolute cursor-pointer top-2 right-2 text-primary text-3xl font-bold z-20"
                >
                    <FaXmark />
                </button>

                {showImage && (
                    <div className="absolute bottom-4 right-4 z-20 flex gap-2 bg-white p-2 rounded-md shadow">
                        <button className="cursor-pointer" onClick={() => setZoom((z) => Math.max(z - 0.1, 1))}>
                            <FaSearchMinus />
                        </button>
                        <button className="cursor-pointer" onClick={() => setZoom((z) => Math.min(z + 0.1, 5))}>
                            <FaSearchPlus />
                        </button>
                    </div>
                )}

                {(!isImageLoaded || !showImage) && (
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

                {(showImage) && (
                    <div
                        ref={containerRef}
                        className="cursor-grab overflow-hidden w-auto h-auto relative"
                        onWheel={handleWheel}
                        onMouseDown={handleMouseDown}
                        onMouseUp={handleMouseUp}
                        onMouseMove={handleMouseMove}
                        onMouseLeave={handleMouseUp}
                    >
                        {imageUrl?.startsWith("http") ? (
                            <Image
                                src={imageUrl}
                                alt="Zoomable screenshot"
                                width={1280}
                                height={720}
                                loading="lazy"
                                onLoadingComplete={() => setIsImageLoaded(true)}
                                className="rounded-md select-none pointer-events-none object-contain w-auto h-auto max-w-full max-h-[90vh]"
                                style={{
                                    transform: `scale(${zoom}) translate(${position.x / zoom}px, ${position.y / zoom}px)`,
                                    transformOrigin: "top left",
                                    transition: "transform 0.1s ease-out",
                                }}
                                draggable={false}
                            />

                        ) : (
                            <img
                                src={`data:image/jpeg;base64,${imageUrl}`}
                                alt="Zoomable screenshot"
                                onLoad={() => setIsImageLoaded(true)}
                                className="rounded-md select-none pointer-events-none object-contain w-auto h-auto max-w-full max-h-[90vh]"
                                style={{
                                    transform: `scale(${zoom}) translate(${position.x / zoom}px, ${position.y / zoom}px)`,
                                    transformOrigin: "top left",
                                    transition: "transform 0.1s ease-out",
                                }}
                                draggable={false}
                            />
                        )}
                    </div>
                )}
            </div>
        </div>


    );
};
const ReportUI = ({
    report,
    testcaseId,
    dataStepsTotal,
    progressValue,
    stopped
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


    if (!report || typeof report !== "object") return null;

    const result: StepEvent[] = Object.values(report)
        .filter((step): step is StepEvent =>
            typeof step === "object" &&
            step !== null &&
            typeof (step as any)?.indexStep === "number"
        )
        .map((step) => {
            if (stopped && (step?.status === "processing" || !step.status)) {
                return { ...step, status: "stopped" }
            }
            return step
        });
    
    return (
        <>
            <div
                key={`report-${testcaseId}`}
                className="text-primary w-full p-1 shadow-md rounded-lg flex flex-col"
            >
                <span className="mt-3 text-xl font-semibold tracking-wide pb-2 mb-2 self-center text-primary/80">Report</span>
                <div className="flex flex-col gap-4">
                    {result?.map((step: StepEvent) => {
                        return (
                            <div key={`Step-${step.indexStep}`}>
                                <StepCard
                                    step={step as StepData}
                                    stepData={step as StepData}
                                    index={Number(step.indexStep) + 1}
                                    handleImageClick={() => handleImageClick(step?.screenshot)}
                                    stopped={stopped}
                                />
                            </div>
                        );
                    }
                    )}
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

export default ReportUI;


