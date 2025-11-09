import CopyToClipboard from "@/app/components/CopyToClipboard";
import InteractionItem from "@/app/components/Interaction";
import StepActions from "@/app/components/StepActions";
import ReusableStepModal from "@/app/dashboard/components/ReusableStepModal";
import { PlusIcon, Settings } from "lucide-react";


type ShowStepsProps = {
    isDarkMode: boolean;
    testId: string;
    full: any;
    stepsBufById: Record<string, any[]>;
    setStepsBufById: (buf: any) => void;
    selectionModeById: Record<string, boolean>;
    toggleSelectionModeFor: (testId: string) => void;
    selectedStepsForReusableById: Record<string, number[]>;
    setSelectedStepsForReusableById: (sel: any) => void;
    showReusableModalById: Record<string, boolean>;
    setShowReusableModalFor: (testId: string, open: boolean) => void;
    handleCreateReusableStep: (testId: string, selectedIndexes: number[]) => void;
    setResponseStepsCompat: (testId: string, updater: (prev: any[]) => any[]) => void;
    transformedStepsToCopy: (steps: any[]) => any[];
    getStepSelectionClasses: (testId: string, stepIndex: number) => string;
    handleStepSelection: (testId: string, stepIndex: number) => void;
};

const ShowSteps = ({
    isDarkMode,
    testId,
    full,
    stepsBufById,
    setStepsBufById,
    selectionModeById,
    toggleSelectionModeFor,
    selectedStepsForReusableById,
    setSelectedStepsForReusableById,
    showReusableModalById,
    setShowReusableModalFor,
    handleCreateReusableStep,
    setResponseStepsCompat,
    transformedStepsToCopy,
    getStepSelectionClasses,
    handleStepSelection


}:ShowStepsProps) => {

    return (
        <div className="rounded-md p-3 space-y-3 max-h-[800px] overflow-y-auto">
            <div className={[
                "sticky top-0 z-10 px-2 py-2",
                isDarkMode ? "bg-gray-900/80 backdrop-blur border-b border-white/10" : "bg-white/80 backdrop-blur border-b border-slate-200"
            ].join(" ")}>
                <div className="flex flex-wrap items-center gap-4 justify-between">
                    <div className="flex items-center gap-2 font-semibold">
                        <button
                            onClick={() => toggleSelectionModeFor(testId)}
                            className={[
                                "border shadow-md cursor-pointer flex items-center px-4 py-1.5 rounded-md",
                                isDarkMode ? "bg-gray-800 text-white border-white/40" : "bg-gray-200 text-gray-900 border-primary/40",
                            ].join(" ")}
                        >
                            <Settings className="w-4 h-4 mr-1" />
                            {selectionModeById[testId] ? "Cancel Selection" : "Select Steps for Reusable"}
                        </button>

                        {selectionModeById[testId] && (selectedStepsForReusableById[testId]?.length || 0) > 0 && (
                            <button
                                onClick={() => setShowReusableModalFor(testId, true)}
                                className={`${isDarkMode ? "bg-primary-blue/60" : "bg-primary/90"} px-4 py-1.5 text-white cursor-pointer flex items-center rounded-md`}
                            >
                                <PlusIcon className="w-4 h-4 mr-1" />
                                Create Reusable ({selectedStepsForReusableById[testId]?.length || 0})
                            </button>
                        )}
                    </div>

                    <div className="flex items-center gap-2">
                        <div className={[
                            "rounded-md flex items-center gap-2 border-dashed border p-1",
                            isDarkMode ? "border-gray-600 text-white" : "border-primary/40 text-primary/90",
                        ].join(" ")}>
                            <span>Copy All steps</span>
                            <CopyToClipboard
                                text={JSON.stringify(transformedStepsToCopy(stepsBufById[testId] || []), null, 2)}
                                isDarkMode={isDarkMode}
                            />
                        </div>
                    </div>
                </div>
            </div>
            {(stepsBufById[testId] || []).map((step, i) => (
                <div key={i} className="flex flex-col gap-2">
                    <div
                        className={getStepSelectionClasses(testId, i)}
                        onClick={() => selectionModeById[testId] && handleStepSelection(testId, i)}
                    >
                        <InteractionItem
                            data={{ id: `${testId}-step-${i}`, ...step }}
                            index={i}
                            isDarkMode={isDarkMode}
                            test={full as any}
                            setTestCasesData={() => { }}
                            setResponseTest={() => { }}
                            onUpdate={(idx, newStep) => {
                                setStepsBufById((prev:any) => {
                                    const arr = [...(prev[testId] || [])];
                                    if (newStep?.type?.startsWith?.("STEPS") && Array.isArray(newStep?.stepsData)) {
                                        arr[idx] = { ...newStep };
                                    } else {
                                        arr[idx] = { ...arr[idx], ...newStep };
                                    }
                                    const next = arr.map((s: any, k: number) => ({ ...s, indexStep: k + 1 }));
                                    return { ...prev, [testId]: next };
                                });
                            }}
                            onDelete={(idx) => {
                                setStepsBufById((prev:any) => {
                                    const next = (prev[testId] || [])
                                        .filter((_:any, j:any) => j !== idx)
                                        .map((s: any, k: number) => ({ ...s, indexStep: k + 1 }));
                                    setSelectedStepsForReusableById((selPrev:any) => {
                                        const cur = selPrev[testId] || [];
                                        const fixed = cur
                                            .filter((n:any) => n !== idx)
                                            .map((n:any) => (n > idx ? n - 1 : n));
                                        return { ...selPrev, [testId]: fixed };
                                    });
                                    return { ...prev, [testId]: next };
                                });
                            }}
                        />
                    </div>

                    <StepActions
                        index={i}
                        steps={stepsBufById[testId] || []}
                        test={{ ...(full || {}), id: testId }}
                        setTestCasesData={() => { }}
                        setResponseTest={(updater: any) => setResponseStepsCompat(testId, updater)}
                        darkMode={isDarkMode}
                    />
                </div>
            ))}

            <ReusableStepModal
                isOpen={!!showReusableModalById[testId]}
                onClose={() => setShowReusableModalFor(testId, false)}
                selectedSteps={selectedStepsForReusableById[testId] || []}
                steps={stepsBufById[testId] || []}
                onCreateReusable={(payload: { selectedIndexes?: number[] }) => {
                    handleCreateReusableStep(testId, payload?.selectedIndexes || (selectedStepsForReusableById[testId] || []));
                }}
                isDarkMode={isDarkMode}
                responseTest={{ stepsData: stepsBufById[testId] || [] }}
                onSetResponseData={(next: any) =>
                    setStepsBufById((prev:any) => ({ ...prev, [testId]: Array.isArray(next?.stepsData) ? next.stepsData : (prev[testId] || []) }))
                }

            />
        </div>
    )
}

export default ShowSteps;