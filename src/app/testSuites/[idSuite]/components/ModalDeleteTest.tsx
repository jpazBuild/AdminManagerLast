import ModalCustom from "@/app/components/ModalCustom";

type ModalDeleteTestProps = {
    openDeleteModal: boolean;
    setOpenDeleteModal: (open: boolean) => void;
    toDeleteId: string;
    confirmDelete: () => void;
    isDarkMode: boolean;
};

const ModalDeleteTest = ({
    openDeleteModal,
    setOpenDeleteModal,
    toDeleteId,
    confirmDelete,
    isDarkMode,
}:ModalDeleteTestProps) => {


    return (
        <ModalCustom
            open={openDeleteModal}
            onClose={() => setOpenDeleteModal(false)}
            isDarkMode={isDarkMode}
            width="max-w-md"
        >
            <div className={`p-4 ${isDarkMode ? "text-white" : "text-primary"}`}>
                <h3 className="text-lg font-semibold mb-2">Remove test from suite</h3>
                <p className="mb-4 text-sm opacity-80">
                    Are you sure you want to remove <span className="font-medium">{toDeleteId}</span> from this suite?
                </p>
                <div className="flex justify-end gap-2">
                    <button
                        className={`px-4 py-2 rounded-md border ${isDarkMode ? "border-gray-600" : "border-gray-300"}`}
                        onClick={() => setOpenDeleteModal(false)}
                    >
                        Cancel
                    </button>
                    <button
                        className={`px-4 py-2 rounded-md font-semibold ${isDarkMode ? "bg-red-700 hover:bg-red-800 text-white" : "bg-red-600 hover:bg-red-700 text-white"}`}
                        onClick={confirmDelete}
                    >
                        Delete
                    </button>
                </div>
            </div>
        </ModalCustom>
    )
}

export default ModalDeleteTest; 