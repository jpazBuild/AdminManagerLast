import { RiInformation2Line } from "react-icons/ri";
import Modal from "./Modal";

type ModalBackCanvasProps = {
    modalSureBackListFlows: boolean;
    setModalSureBackListFlows: (val: boolean) => void;
    setCreateNewFlowOpen: (val: boolean) => void;
}


const ModalBackCanvas = ({ modalSureBackListFlows, setModalSureBackListFlows, setCreateNewFlowOpen }: ModalBackCanvasProps) => {

    return (
        <Modal
            open={modalSureBackListFlows}
            onClose={() => setModalSureBackListFlows(false)}
            title=""
        >
            <div className="flex flex-col gap-4 justify-end mt-4 text-primary/90">
                <RiInformation2Line className="w-8 h-8 text-primary/60 self-center" />
                <p className="self-center font-semibold text-[20px]">Are you sure you want to go back to the flows list?</p>
                <div className="flex gap-2 self-end">
                    <button
                        onClick={() => setModalSureBackListFlows(false)}
                        className="px-4 py-2 rounded-lg border border-gray-300 bg-white text-primary"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={() => {
                            setModalSureBackListFlows(false);
                            setCreateNewFlowOpen(false);
                        }}
                        className="px-4 py-2 rounded-lg bg-red-600 text-white font-semibold"
                    >
                        Yes, go back
                    </button>
                </div>
            </div>
        </Modal>
    )
}

export default ModalBackCanvas;