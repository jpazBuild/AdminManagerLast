import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Clock, Wand2, Layers, Edit, Save } from "lucide-react";
import { FaXmark } from "react-icons/fa6";
import { Check } from "lucide-react";
import TextInputWithClearButton from "./InputClear";
import AddCustomStep from "./AddCustomStep";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import axios from "axios";
import { toast } from "sonner";
import InteractionItem from "./Interaction";
import { URL_API_ALB } from "@/config";
import { checkConnection } from "@/utils/DBBUtils";

interface StepActionsProps {
    index: number;
    steps: any[];
    test: any;
    setTestCasesData?: React.Dispatch<React.SetStateAction<any[]>>;
    setResponseTest?: React.Dispatch<React.SetStateAction<any>>;
    showReusable?: boolean;
}

interface ReusableHeader {
    id: string;
    name: string;
    description?: string;
    createdBy?: string;
}

interface ReusableStep {
    action: string;
    indexStep: number;
    data: any;
    stepsId?: string;
}

const StepActions: React.FC<StepActionsProps> = ({
    index,
    steps,
    test,
    setTestCasesData,
    setResponseTest,
    showReusable = true
}) => {
    const [waitInputs, setWaitInputs] = useState<Record<number, string | undefined>>({});
    const [viewActionStep, setViewActionStep] = useState<
        "wait" | "customStep" | "none"
    >("none");

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [reusableList, setReusableList] = useState<ReusableHeader[]>([]);
    const [selectedReusable, setSelectedReusable] = useState<ReusableHeader | null>(
        null
    );
    const [selectedReusableSteps, setSelectedReusableSteps] = useState<ReusableStep[]>(
        []
    );
    const [loading, setLoading] = useState(false);
    const [reusable, setReusable] = useState<any>({});
    const [isEditingReusable, setIsEditingReusable] = useState(false);

    const insertStep = (newSteps: any[]) => {
        const reindexed = newSteps.map((step, idx) => {
            const { stepsId, ...rest } = step;
            return { ...rest, indexStep: idx + 1 };
        });

        if (setTestCasesData) {
            setTestCasesData((prev: any[]) => {
                const updated = [...prev];
                const idx = updated.findIndex((tc) => tc.testCaseId === test.testCaseId);
                if (idx >= 0) {
                    updated[idx] = { ...updated[idx], stepsData: reindexed };
                }
                return updated;
            });
        }

        setResponseTest?.((prev: any) => {
            if (!prev) return prev;
            return { ...prev, stepsData: reindexed };
        });
    };

    const insertReusableStep = (newSteps: ReusableStep[]) => {
        const reindexed = newSteps.map((step, idx) => {
            const { stepsId, ...rest } = step;
            return { ...rest, indexStep: idx + 1 };
        });
        setSelectedReusableSteps(reindexed);
        setReusable((prev: any) => ({
            ...prev,
            stepsData: reindexed,
        }));
    };

    const fetchReusableHeaders = async () => {
        try {
            setLoading(true);
            await checkConnection()
            const res = await axios.post(
                `${URL_API_ALB}getReusableStepsHeaders`,
                { onlyReusables: true }
            );
            setReusableList(res.data || []);
        } catch (err) {
            console.error(err);
            toast.error("Failed to load reusable steps");
        } finally {
            setLoading(false);
        }
    };

    const fetchReusableSteps = async (id: string) => {
        try {
            setLoading(true);
            await checkConnection()
            const res = await axios.post(`${URL_API_ALB}reusableSteps`, {
                getIndexOnly: false,
                id,
                includeStepsData: true,
                includeImages: true,
            });
            const stepsData = (res.data?.stepsData || []).map((step: any, idx: number) => {
                const { stepsId, ...rest } = step;
                return { ...rest, indexStep: idx + 1 };
            });
            setReusable(res.data);
            setSelectedReusableSteps(stepsData);
        } catch (err) {
            console.error(err);
            toast.error("Failed to load reusable step details");
        } finally {
            setLoading(false);
        }
    };

    const saveReusableChanges = async () => {
        if (!selectedReusable) return;
        try {
            await checkConnection()
            const payload = {
                id: selectedReusable.id,
                stepsData: selectedReusableSteps,
                name: reusable.name,
                tagIds: reusable.tagIds || [],
                tagNames: reusable.tagNames || [],
                deleteS3Images: reusable.deleteS3Images || false,
                temp: reusable.temp || false,
                updatedBy: reusable.createdBy || "jpaz",
                description: reusable.description || "",
            };

            console.log("Updating reusable step with payload:", payload);

            const res = await axios.patch(
                `${URL_API_ALB}reusableSteps`,
                payload
            );
            if (res.status === 200) {
                toast.success("Reusable updated successfully");
                setIsEditingReusable(false);
            }
        } catch (error) {
            console.error("Error updating reusable:", error);
            toast.error("Failed to update reusable");
        }
    };

    const ReusableStepActions = ({ idx }: { idx: number }) => {
        const [localWait, setLocalWait] = useState<string>("1000");
        const [showWait, setShowWait] = useState(false);
        const [showCustom, setShowCustom] = useState(false);

        return (
            <div className="flex flex-col gap-2 mb-2">
                <div className="flex gap-2">
                    <Button
                        size="sm"
                        variant="outline"
                        className="text-xs w-fit cursor-pointer shadow-md"
                        onClick={() => {
                            setShowWait(!showWait);
                            setShowCustom(false);
                        }}
                    >
                        <Clock className="mr-1 h-3 w-3" /> Add Wait
                    </Button>
                    <Button
                        size="sm"
                        variant="outline"
                        className="text-xs w-fit cursor-pointer"
                        onClick={() => {
                            setShowCustom(!showCustom);
                            setShowWait(false);
                        }}
                    >
                        <Wand2 className="mr-1 h-3 w-3" /> Add Custom Step
                    </Button>
                </div>

                {showWait && (
                    <div className="flex gap-2 items-center mt-1">
                        <TextInputWithClearButton
                            id={`wait-input-reusable-${idx}`}
                            type="number"
                            value={localWait}
                            onChangeHandler={(e) => setLocalWait(e.target.value)}
                            placeholder="Wait (ms)"
                        />
                        <button
                            className="text-xs cursor-pointer text-gray-400 hover:text-primary/70 p-1"
                            onClick={() => {
                                const ms = parseInt(localWait || "", 10);
                                if (!isNaN(ms)) {
                                    const newSteps = [...selectedReusableSteps];
                                    newSteps.splice(idx + 1, 0, {
                                        action: "wait",
                                        data: { attributes: { value: String(ms) } },
                                        indexStep: 0,
                                    });
                                    insertReusableStep(newSteps);
                                    setShowWait(false);
                                }
                            }}
                        >
                            <Check size={16} />
                        </button>
                        <button
                            className="text-xs cursor-pointer text-gray-400 hover:text-primary/70 p-1"
                            onClick={() => setShowWait(false)}
                        >
                            <FaXmark size={16} />
                        </button>
                    </div>
                )}

                {showCustom && (
                    <AddCustomStep
                        onAdd={(customStep) => {
                            const stepsToAdd = Array.isArray(customStep)
                                ? customStep
                                : [customStep];
                            const newSteps = [...selectedReusableSteps];
                            newSteps.splice(idx + 1, 0, ...stepsToAdd);
                            insertReusableStep(newSteps);
                            setShowCustom(false);
                        }}
                        setOpen={setShowCustom}
                    />
                )}
            </div>
        );
    };

    return (
        <div className="ml-2 mt-2 flex flex-col gap-4 items-start">
            <div className="flex gap-2">
                <Button
                    size="sm"
                    variant="outline"
                    className="text-xs w-fit cursor-pointer shadow-md"
                    onClick={() => {
                        setViewActionStep((prev) => (prev === "wait" ? "none" : "wait"));
                        setWaitInputs((prev) => ({ ...prev, [index]: "1000" }));
                    }}
                >
                    <Clock className="mr-1 h-3 w-3" /> Add Wait
                </Button>

                <Button
                    size="sm"
                    variant="outline"
                    className="text-xs w-fit cursor-pointer"
                    onClick={() => {
                        setViewActionStep((prev) =>
                            prev === "customStep" ? "none" : "customStep"
                        );
                    }}
                >
                    <Wand2 className="mr-1 h-3 w-3" /> Add Custom Step
                </Button>

                {showReusable && (
                    <Button
                        size="sm"
                        variant="outline"
                        className="text-xs w-fit cursor-pointer"
                        onClick={() => {
                            setIsModalOpen(true);
                            setSelectedReusable(null);
                            setSelectedReusableSteps([]);
                            fetchReusableHeaders();
                        }}
                    >
                        <Layers className="mr-1 h-3 w-3" /> Add Reusable Step
                    </Button>
                )}

            </div>

            {viewActionStep === "wait" && waitInputs[index] !== undefined && (
                <div className="flex gap-2 items-center mt-1">
                    <TextInputWithClearButton
                        id={`wait-input-${index}`}
                        type="number"
                        value={waitInputs[index]}
                        onChangeHandler={(e) =>
                            setWaitInputs((prev) => ({ ...prev, [index]: e.target.value }))
                        }
                        placeholder="Wait (ms)"
                    />
                    <button
                        className="text-xs cursor-pointer text-gray-400 hover:text-primary/70 p-1"
                        onClick={() => {
                            const ms = parseInt(waitInputs[index] || "", 10);
                            if (!isNaN(ms)) {
                                const newSteps = [...steps];
                                newSteps.splice(index + 1, 0, {
                                    action: "wait",
                                    data: { attributes: { value: String(ms) } },
                                    indexStep: 0,
                                });
                                insertStep(newSteps);
                                setWaitInputs((prev) => ({ ...prev, [index]: undefined }));
                            }
                        }}
                    >
                        <Check size={16} />
                    </button>
                    <button
                        className="text-xs cursor-pointer text-gray-400 hover:text-primary/70 p-1"
                        onClick={() =>
                            setWaitInputs((prev) => ({ ...prev, [index]: undefined }))
                        }
                    >
                        <FaXmark size={16} />
                    </button>
                </div>
            )}

            {viewActionStep === "customStep" && (
                <AddCustomStep
                    onAdd={(customStep) => {
                        const stepsToAdd = Array.isArray(customStep) ? customStep : [customStep];
                        const updatedSteps = [...steps];
                        updatedSteps.splice(index + 1, 0, ...stepsToAdd);
                        insertStep(updatedSteps);
                    }}
                    setOpen={(open) => !open && setViewActionStep("none")}
                />
            )}

            <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                <DialogContent className="max-w-4xl max-h-[85vh] overflow-hidden bg-white flex flex-col">
                    <div className="sticky top-0 z-30 flex justify-between items-center px-4 py-3 border-b bg-white">
                        {selectedReusable && (
                            <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setSelectedReusable(null)}
                            >
                                ← Back
                            </Button>
                        )}
                        <h2 className="text-lg font-semibold text-primary/80 flex-1 text-center">
                            {selectedReusable
                                ? `Reusable: ${selectedReusable.name}`
                                : "Select a Reusable Step"}
                        </h2>
                        <Button size="sm" variant="ghost" onClick={() => setIsModalOpen(false)}>
                            <FaXmark className="h-4 w-4" />
                        </Button>
                    </div>

                    <div className="flex-1 overflow-y-auto p-4 space-y-4">
                        {!selectedReusable ? (
                            <>
                                {loading && (
                                    <div className="text-center text-gray-400">Loading...</div>
                                )}
                                {reusableList.map((item) => (
                                    <div
                                        key={item.id}
                                        className="p-3 border rounded cursor-pointer hover:bg-gray-50"
                                        onClick={() => {
                                            setSelectedReusable(item);
                                            fetchReusableSteps(item.id);
                                        }}
                                    >
                                        <div className="font-medium">{item.name}</div>
                                        <div className="text-xs text-gray-500">
                                            {item.description || "No description"}
                                        </div>
                                    </div>
                                ))}
                            </>
                        ) : (
                            <>
                                {loading && (
                                    <div className="text-center text-gray-400">Loading steps...</div>
                                )}

                                <div className="flex gap-2 mb-2">
                                    <Button
                                        size="sm"
                                        variant={isEditingReusable ? "destructive" : "outline"}
                                        onClick={() => setIsEditingReusable(!isEditingReusable)}
                                    >
                                        <Edit className="mr-1 h-3 w-3" />{" "}
                                        {isEditingReusable ? "Cancel Edit" : "Edit Reusable"}
                                    </Button>
                                    {isEditingReusable && (
                                        <Button
                                            size="sm"
                                            variant="default"
                                            onClick={saveReusableChanges}
                                            className="text-xs text-white font-semibold w-fit cursor-pointer shadow-md"
                                        >
                                            <Save className="mr-1 h-3 w-3" /> Save Changes
                                        </Button>
                                    )}
                                </div>

                                {selectedReusableSteps.map((step, idx) => (
                                    <div key={idx} className="flex flex-col gap-2 border rounded p-2">
                                        <ReusableStepActions idx={idx - 1} />
                                        <InteractionItem
                                            data={{ id: `reusable-${selectedReusable.id}-step-${idx}`, ...step }}
                                            index={idx}
                                            onDelete={(indexToDelete) => {
                                                const newSteps = selectedReusableSteps
                                                    .filter((_, i) => i !== indexToDelete)
                                                    .map((s, k) => ({ ...s, indexStep: k + 1 }));
                                                insertReusableStep(newSteps);
                                            }}
                                            onUpdate={(indexToUpdate, updatedStep) => {
                                                const newSteps = [...selectedReusableSteps];
                                                newSteps[indexToUpdate] = {
                                                    ...newSteps[indexToUpdate],
                                                    ...updatedStep,
                                                };
                                                insertReusableStep(newSteps);
                                            }}
                                            isDarkMode={false}
                                            test={test}
                                        />
                                        <ReusableStepActions idx={idx} />
                                    </div>
                                ))}

                                <Button
                                    className="mt-3 font-semibold text-white/90 bg-primary hover:bg-primary/80"
                                    onClick={() => {
                                        if (!selectedReusable) return;

                                        const newStep = reusable;

                                        const updatedSteps = [...steps];
                                        updatedSteps.splice(index + 1, 0, newStep);

                                        const reindexedSteps = updatedSteps.map((step, idx) => ({
                                            ...step,
                                            indexStep: idx + 1,
                                        }));

                                        setResponseTest?.((prev: any) => {
                                            if (!prev) return prev;
                                            return { ...prev, stepsData: reindexedSteps };
                                        });

                                        setTestCasesData?.((prev: any[]) => {
                                            const updated = [...prev];
                                            const idxCase = updated.findIndex((tc) => tc.testCaseId === test.testCaseId);
                                            if (idxCase >= 0) {
                                                updated[idxCase] = { ...updated[idxCase], stepsData: reindexedSteps };
                                            }
                                            return updated;
                                        });

                                        setIsModalOpen(false);
                                        toast.success(`Reusable "${selectedReusable.name}" added`);
                                    }}
                                >
                                    Add This Reusable
                                </Button>
                            </>
                        )}
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default StepActions;
