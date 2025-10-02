import { useEffect, useState } from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogFooter,
    DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { TestCase } from "../../../types/types";

interface Props {
    test: any;
    onDelete: (testCaseId: string) => void;
    onUpdate?: (test: TestCase) => void;
    isLoadingUpdate?: boolean;
    isLoadingDelete?: boolean;
    isDarkMode?: boolean;
}

const TestCaseActions = ({
    test,
    onDelete,
    onUpdate,
    isLoadingUpdate,
    isLoadingDelete,
    isDarkMode,
}: Props) => {
    const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
    const [openUpdateDialog, setOpenUpdateDialog] = useState(false);

    const baseText = isDarkMode ? "text-white" : "text-primary";
    const baseTextMuted = isDarkMode ? "text-white/80" : "text-primary/80";

    const onConfirmDelete = () => {
        if (!test?.id) {
            toast.error("No testCaseId found");
            return;
        }
        onDelete(test.id);
        setOpenDeleteDialog(false);
        if (!isLoadingDelete) {
            setOpenDeleteDialog(false);
        }
    };

    const onConfirmUpdate = () => {
        if (!onUpdate) return;

        const updated: TestCase = {
            ...test
        };

        onUpdate(updated);
        if (!isLoadingUpdate) {
            setOpenUpdateDialog(false);
        }
    };

    return (
        <div className="flex gap-2 px-2 bg-transparent w-full pt-2">
            <Dialog open={openDeleteDialog} onOpenChange={setOpenDeleteDialog}>
                <DialogContent className="sm:max-w-md bg-white flex flex-col justify-center">
                    <DialogHeader className="flex flex-col gap-2 justify-center">
                        <DialogTitle className={`text-lg !text-primary/80 text-center font-semibold ${baseText} break-words`}>
                            Are you sure you want to delete this test case?
                        </DialogTitle>
                    </DialogHeader>

                    <div className={`text-sm px-1 break-words text-center text-primary/50 ${baseTextMuted}`}>
                        You are about to delete the test case <strong>{test?.testCaseName}</strong>.
                    </div>

                    <DialogFooter className="w-full mt-4 flex justify-center gap-2">
                        <button
                            onClick={() => setOpenDeleteDialog(false)}
                            className="w-full border border-gray-300 px-4 py-2 rounded hover:bg-gray-100"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={onConfirmDelete}
                            disabled={!!isLoadingDelete}
                            className="w-full bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 disabled:opacity-60"
                        >
                            {isLoadingDelete ? "Deleting..." : "Yes, Delete"}
                        </button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={openUpdateDialog} onOpenChange={setOpenUpdateDialog}>
                <DialogContent className="sm:max-w-lg bg-white">
                    <DialogHeader className="flex flex-col gap-1">
                        <DialogTitle className={`text-lg font-semibold !text-primary/80 text-center ${baseText}`}>
                            Are you sure you want to save these changes?
                        </DialogTitle>
                        <p className={`text-sm text-primary/50  text-center ${baseTextMuted}`}>
                            Once saved, these changes cannot be undone.
                        </p>
                    </DialogHeader>


                    <DialogFooter className="mt-4 flex gap-2">
                        <button
                            onClick={() => setOpenUpdateDialog(false)}
                            className="w-full border border-gray-300 px-4 py-2 rounded hover:bg-gray-100"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={onConfirmUpdate}
                            disabled={!!isLoadingUpdate}
                            className="w-full bg-primary/90 text-white px-4 py-2 rounded hover:bg-primary/95 disabled:opacity-60"
                        >
                            {isLoadingUpdate ? "Saving..." : "Save changes"}
                        </button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <div className="w-full place-self-start flex justify-start gap-2 pt-1 ml-auto">
                {onUpdate && (
                    <button
                        className={`flex items-center shadow-md py-3 px-8 rounded-lg border-1 cursor-pointer gap-1 ${isDarkMode ? "text-white hover:text-white/80" : "text-primary hover:text-primary/80"} text-sm`}
                        onClick={() => setOpenUpdateDialog(true)}
                    >
                        Save
                    </button>
                )}

                <button
                    className={`flex items-center p-1 px-3 rounded-md cursor-pointer gap-1 hover:bg-primary/5   ${isDarkMode ? "text-white hover:text-white/80" : "text-red-600 hover:text-red-700"
                        } font-normal text-sm`}
                    onClick={() => setOpenDeleteDialog(true)}
                >
                    <span className="flex items-center">Delete</span>
                </button>
            </div>
        </div>
    );
};

export default TestCaseActions;
