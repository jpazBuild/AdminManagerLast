import { FaXmark } from "react-icons/fa6";


const Modal: React.FC<{
    open: boolean;
    title?: string;
    onClose: () => void;
    children: React.ReactNode;
}> = ({ open, title, onClose, children }) => {
    if (!open) return null;
    return (
        <div className="fixed inset-0 z-[100] flex h-full items-center justify-center bg-primary/40">
            <div className="w-full  max-w-2xl rounded-2xl bg-white shadow-xl place-content-center overflow-auto">
                <div className="flex items-center justify-between px-5 py-4 border-b border-primary/20">
                    <div className="text-[15px] font-semibold text-slate-800">{title}</div>
                    <button
                        onClick={onClose}
                        className="rounded p-1.5 hover:bg-slate-100 focus:outline-none"
                        aria-label="Close"
                    >
                        <FaXmark className="w-5 h-5 text-primary/40" />
                    </button>
                </div>
                <div className="p-5 flex justify-center flex-col">{children}</div>
            </div>
        </div>
    );
};

export default Modal;