import { RiInformation2Line } from "react-icons/ri";
import ModalCustom from "@/app/components/ModalCustom";

type ModalBackCanvasProps = {
    modalSureBackListFlows: boolean;
    setModalSureBackListFlows: (val: boolean) => void;
    setCreateNewFlowOpen: (val: boolean) => void;
    darkMode?: boolean;
}


const ModalBackCanvas = ({ modalSureBackListFlows, setModalSureBackListFlows, setCreateNewFlowOpen,darkMode }: ModalBackCanvasProps) => {

    return (
        <ModalCustom 
            open={modalSureBackListFlows}
            onClose={() => setModalSureBackListFlows(false)}
            width="max-w-md"
        >
            <div className={`flex flex-col gap-4 p-6 ${darkMode ? "bg-gray-900 text-white/90" : "bg-white text-gray-900"}`}>
                <div className="flex items-center gap-3">
                    <RiInformation2Line className={`w-6 h-6 ${darkMode ? "text-yellow-400" : "text-yellow-500"}`} />
                    <h2 className="text-lg font-semibold">Are you sure you want to go back?</h2>
                </div>
                <p className="text-sm">
                    Any unsaved changes will be lost. Please make sure to save your work before proceeding.
                </p>
                <div className="flex justify-end gap-3 mt-4">
                    <button
                        onClick={() => setModalSureBackListFlows(false)}
                        className={`px-4 py-2 rounded-md font-semibold ${
                            darkMode ? "bg-gray-700 hover:bg-gray-600 text-white/90" : "bg-gray-200 hover:bg-gray-300 text-gray-900"
                        }`}
                    >
                        Cancel
                    </button>
                    <button
                        onClick={() => {
                            setModalSureBackListFlows(false);
                            setCreateNewFlowOpen(false);
                        }}
                        className={`px-4 py-2 rounded-md font-semibold ${
                            darkMode ? "bg-red-600 hover:bg-red-500 text-white/90" : "bg-red-500 hover:bg-red-400 text-white"
                        }`}
                    >
                        Yes, go back
                    </button>
                </div>
            </div>
        </ModalCustom>
    )
}

export default ModalBackCanvas;