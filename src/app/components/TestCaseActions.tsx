import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogFooter, DialogTitle, DialogClose } from "@/components/ui/dialog";
import { FaTrashAlt, FaEdit } from "react-icons/fa";
import { toast } from "sonner";
import { TestCase } from "../home/types";
import { Edit2, Trash, Trash2Icon } from "lucide-react";

interface Props {
    test: any;
    onDelete: (testCaseId: string) => void;
    onUpdate: (test: TestCase) => void;
}

const TestCaseActions = ({ test, onDelete, onUpdate }: Props) => {
    const [openDialog, setOpenDialog] = useState(false);

    return (
        <div className="flex gap-2 px-2 mt-2">
            <Dialog open={openDialog} onOpenChange={setOpenDialog}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="text-lg font-semibold">
                            Are you sure you want to delete this test case?
                        </DialogTitle>
                    </DialogHeader>

                    <div className="text-sm text-muted-foreground px-1 breaks-words">
                        You are about to delete the test case <strong>{test?.testCaseName}</strong>.
                    </div>

                    <DialogFooter className="mt-4 flex justify-end gap-2">
                        <button
                            onClick={() => setOpenDialog(false)}
                            className="text-primary/80 px-4 py-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={() => {
                                if (test?.testCaseId) {
                                    onDelete(test.testCaseId);
                                    setOpenDialog(false);
                                } else {
                                    toast.error("No testCaseId found");
                                }
                            }}
                            className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
                        >
                            Yes, Delete
                        </button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <div className="place-self-end flex gap-2 mb-2">
                <button
                className="flex items-center gap-1 text-primary/80 text-sm hover:text-red-500"
                onClick={() => setOpenDialog(true)}
            >
                <Trash2Icon className="w-4 h-4" />
                Delete
            </button>

            <button
                className="flex items-center gap-1 text-primary/80 text-sm hover:text-primary"
                onClick={() => onUpdate(test)}
            >
                <Edit2 className="w-4 h-4" />
                Update
            </button>
            </div>
        </div>
    );
};

export default TestCaseActions;
