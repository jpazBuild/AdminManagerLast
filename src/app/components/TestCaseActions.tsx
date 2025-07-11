import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogFooter, DialogTitle, DialogClose } from "@/components/ui/dialog";
import { toast } from "sonner";
import { TestCase } from "../home/types";
import { Edit2, Trash2Icon } from "lucide-react";

interface Props {
    test: any;
    onDelete: (testCaseId: string) => void;
    onUpdate: (test: TestCase) => void;
    isLoadingUpdate?: boolean;
    isLoadingDelete?: boolean;
}

const TestCaseActions = ({ test, onDelete, onUpdate,isLoadingUpdate,isLoadingDelete }: Props) => {
    const [openDialog, setOpenDialog] = useState(false);

    
    return (
        <div className="flex gap-2 px-2 mt-2">
            <Dialog open={openDialog} onOpenChange={setOpenDialog}>
                <DialogContent className="sm:max-w-md bg-white">
                    <DialogHeader>
                        <DialogTitle className="text-lg font-semibold text-primary/80">
                            Are you sure you want to delete this test case?
                        </DialogTitle>
                    </DialogHeader>

                    <div className="text-sm px-1 breaks-words text-primary/60">
                        You are about to delete the test case <strong>{test?.testCaseName}</strong>.
                    </div>

                    <DialogFooter className="mt-4 flex justify-end gap-2">
                        <button
                            onClick={() => setOpenDialog(false)}
                            className="text-primary/80 cursor-pointer px-4 py-2 rounded hover:bg-gray-100"
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
                            className="bg-red-500 cursor-pointer text-white px-4 py-2 rounded hover:bg-red-600"
                        >
                            Yes, Delete
                        </button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <div className="place-self-end flex gap-2 mb-2">
                <button
                className="flex items-center cursor-pointer gap-1 text-primary/80 text-sm hover:text-red-500"
                onClick={() => setOpenDialog(true)}
            >
                <Trash2Icon className="w-4 h-4" />
                Delete
            </button>

            <button
                className="flex items-center cursor-pointer gap-1 text-primary/80 text-sm hover:text-primary"
                onClick={() => onUpdate(test)}
            >
                <Edit2 className="w-4 h-4" />
                {isLoadingUpdate ? (
                    <span className="text-primary/60">
                         Updating...   
                    </span> 
                ):(
                    "Update"
                )}
            </button>
            </div>
        </div>
    );
};

export default TestCaseActions;
