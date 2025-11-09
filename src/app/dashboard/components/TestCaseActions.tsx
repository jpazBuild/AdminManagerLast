import { useEffect, useState } from "react";
import { toast } from "sonner";
import { TestCase } from "../../../types/types";
import ModalCustom from "@/app/components/ModalCustom";
import { RiInformation2Line } from "react-icons/ri";

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

            <ModalCustom
                open={openDeleteDialog}
                onClose={() => setOpenDeleteDialog(false)}
                width="sm:max-w-md"
                isDarkMode={isDarkMode}
            >
                <div className="flex flex-col gap-4">
                    <div className="flex flex-col gap-2 justify-center">
                        <RiInformation2Line className="w-8 h-8 text-primary/60 mx-auto" />
                        <h2 className={`text-lg text-primary/80 text-center font-semibold ${baseText}`}>
                            Are you sure you want to delete this test case?
                        </h2>
                    </div>

                    <div className={`text-md px-1 text-center text-primary/50 ${baseTextMuted}`}>
                        You are about to delete the test case <strong>{test?.testCaseName}</strong>.
                    </div>

                    <div className="w-full mt-4 flex justify-center gap-2">
                        <button
                            onClick={() => setOpenDeleteDialog(false)}
                            className={`w-full border border-gray-300 ${isDarkMode ? "text-white/90" : ""} px-4 py-2 font-semibold rounded hover:bg-gray-100`}
                        >
                            Cancel
                        </button>
                        <button
                            onClick={onConfirmDelete}
                            disabled={!!isLoadingDelete}
                            className="w-full bg-red-500 text-white font-semibold px-4 py-2 rounded hover:bg-red-600 disabled:opacity-60"
                        >
                            {isLoadingDelete ? "Deleting..." : "Yes, Delete"}
                        </button>
                    </div>
                </div>

            </ModalCustom>



            <ModalCustom
                open={openUpdateDialog}
                onClose={() => setOpenUpdateDialog(false)}
                width="sm:max-w-lg"
                isDarkMode={isDarkMode}
            >

                <div className="flex flex-col gap-4">
                    <div className="flex flex-col gap-2 justify-center">
                        <RiInformation2Line className={`w-8 h-8 text-center self-center ${isDarkMode ?"text-gray-400":"text-primary/6"} mx-auto"`}/>
                        <h2 className={`text-lg text-primary/80 text-center font-semibold ${baseText}`}>
                            Are you sure you want to save these changes?
                        </h2>
                    </div>

                    <div className={`text-md px-1 text-center text-primary/50 ${baseTextMuted}`}>
                        Once saved, these changes cannot be undone.
                    </div>

                    <div className="w-full mt-4 flex justify-center gap-2">
                        <button
                            onClick={() => setOpenUpdateDialog(false)}
                            className={`w-full border border-gray-300 ${isDarkMode ? "text-white/90" : ""} px-4 py-2 font-semibold rounded hover:bg-gray-100`}
                        >
                            Cancel
                        </button>
                        <button
                            onClick={onConfirmUpdate}
                            disabled={!!isLoadingUpdate}
                            className={`w-full ${isDarkMode?"bg-primary-blue/80":"bg-primary/90"} font-semibold  text-white px-4 py-2 rounded hover:bg-primary/95 disabled:opacity-60`}
                        >
                            {isLoadingUpdate ? "Saving..." : "Save changes"}
                        </button>
                    </div>
                </div>
            </ModalCustom>
            <div className="w-full place-self-start flex justify-start gap-2 pt-1 ml-auto">
                {onUpdate && (
                    <button
                        className={`flex items-center shadow-md py-3 px-8 rounded-lg cursor-pointer gap-1 ${isDarkMode ? "text-white hover:text-white/80 bg-primary-blue/90" : "text-primary hover:text-primary/80 border-1"} text-sm`}
                        onClick={() => setOpenUpdateDialog(true)}
                    >
                        Save
                    </button>
                )}

                <button
                    className={`flex items-center p-1 px-3 rounded-md cursor-pointer gap-1 hover:bg-primary/5   ${isDarkMode ? "text-red-400 hover:text-red-700" : "text-red-600 hover:text-red-700"
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
