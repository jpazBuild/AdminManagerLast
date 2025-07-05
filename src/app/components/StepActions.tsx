import { Button } from "@/components/ui/button";
import { Check, Clock, Wand2 } from "lucide-react";
import { useState } from "react";
import TextInputWithClearButton from "./InputClear";
import { FaXmark } from "react-icons/fa6";
import AddCustomStep from "./AddCustomStep";

const StepActions = ({ index, steps, test, setTestCasesData }: any) => {
    const [waitInputs, setWaitInputs] = useState<Record<number, string | undefined>>({});
    const [viewActionStep, setViewActionStep] = useState<'wait' | 'customStep' | 'none'>('none');

    const handleOpenCustom = (open: boolean) => {
        if (!open) {
            setViewActionStep('none');
        }
    };
    return (
        <div className="ml-2 mt-2 flex flex-col gap-4 items-start">
            <div className="flex gap-2">
                <Button
                    size="sm"
                    variant={"outline"}
                    className={`text-xs cursor-pointer w-fit cursor-pointer`}
                    onClick={() => {
                        setViewActionStep((prev) => prev === 'wait' ? 'none' : 'wait');
                        setWaitInputs((prev) => ({
                            ...prev,
                            [index]: "1000",
                        }));
                    }}
                >
                    <Clock className="mr-1 h-3 w-3" /> Add Wait
                </Button>

                <Button
                    size="sm"
                    variant={"outline"}
                    className={`text-xs cursor-pointer w-fit cursor-pointer`}
                    onClick={() => {
                        setViewActionStep((prev) => prev === 'customStep' ? 'none' : 'customStep')
                    }}
                >
                    <Wand2 className="mr-1 h-3 w-3" /> Add Custom Step
                </Button>
            </div>

            {viewActionStep === 'wait' && (
                <>
                    {waitInputs[index] !== undefined && (
                        <div className="flex gap-2 items-center mt-1">
                            <TextInputWithClearButton
                                id={`wait input ${waitInputs[index]}`}
                                type="number"
                                value={waitInputs[index]}
                                onChangeHandler={(e) =>
                                    setWaitInputs((prev) => ({
                                        ...prev,
                                        [index]: e.target.value,
                                    }))
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
                                            data: {
                                                attributes: {
                                                    value: String(ms),
                                                },
                                            },
                                            indexStep: 0,
                                        });

                                        const reindexed = newSteps.map((step, idx) => ({
                                            ...step,
                                            indexStep: idx + 1,
                                        }));

                                        test.stepsData = reindexed;
                                        setTestCasesData((prev: any) => {
                                            const updated = [...prev];
                                            updated[test.index] = {
                                                ...updated[test.index],
                                                stepsData: reindexed,
                                            };
                                            return updated;
                                        });

                                        setWaitInputs((prev) => ({ ...prev, [index]: undefined }));
                                    }
                                }}
                            >
                                <Check size={16} />
                            </button>
                            <button
                                className="text-xs cursor-pointer text-gray-400 hover:text-primary/70 p-1"
                                onClick={() =>
                                    setWaitInputs((prev) => ({
                                        ...prev,
                                        [index]: undefined,
                                    }))
                                }
                            >
                                <FaXmark size={16} />
                            </button>
                        </div>
                    )}
                </>
            )

            }

            {viewActionStep === 'customStep' && (
                <AddCustomStep
                    onAdd={(customStep) => {
                        const stepsToAdd = Array.isArray(customStep) ? customStep : [customStep];
                        const updatedSteps = [...steps];
                        updatedSteps.splice(index + 1, 0, ...stepsToAdd);
                        const reindexed = updatedSteps.map((step, idx) => ({
                            ...step,
                            indexStep: idx + 1,
                        }));
                        test.stepsData = reindexed;
                        setTestCasesData((prev: any) => {
                            const updated = [...prev];
                            updated[test.index] = {
                                ...updated[test.index],
                                stepsData: reindexed,
                            };
                            return updated;
                        });
                    }}
                    setOpen={handleOpenCustom}
                />


            )}

        </div>
    );
};

export default StepActions;