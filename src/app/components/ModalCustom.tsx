import { useEffect, useRef, useState } from "react";
import { FaXmark } from "react-icons/fa6";

type ModalProps = {
  open: boolean;
  onClose?: () => void;
  children: React.ReactNode;
  width?: string;
  isDarkMode?: boolean;
  height?:string;
};

const ModalCustom: React.FC<ModalProps> = ({ open, onClose, children, width = "max-w-2xl" ,isDarkMode=false},height="max-h-[90vh]") => {
  const [show, setShow] = useState(open);
  const panelRef = useRef<HTMLDivElement | null>(null);
  const scrollYRef = useRef<number>(0);
  const titleId = "create-flow-title";

  useEffect(() => {
    const body = document.body;
    if (open) {
      setShow(true);
      scrollYRef.current = window.scrollY || window.pageYOffset || 0;
      body.style.position = "fixed";
      body.style.top = `-${scrollYRef.current}px`;
      body.style.width = "100%";
      body.style.overflow = "hidden";
    }
    return () => {
      body.style.position = "";
      const top = body.style.top;
      body.style.top = "";
      body.style.width = "";
      body.style.overflow = "";
      if (top) {
        const y = parseInt(top || "0") * -1;
        window.scrollTo(0, y || 0);
      }
    };
  }, [open]);

  const close = () => {
    setShow(false);
    setTimeout(() => onClose?.(), 150);
  };

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && close();
    window.addEventListener("keydown", onKey, { passive: true });
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
    >
      <div
        className={`fixed inset-0 blur-3xl ${isDarkMode ? "bg-black/5":"bg-primary/50"} transition-opacity duration-150 ${
          show ? "opacity-100" : "opacity-0"
        }`}
        onClick={close}
      />

      <div
        ref={panelRef}
        className={`relative z-50 w-full ${width} ${height} rounded-xl ${isDarkMode ? "bg-gray-900":"bg-white "} p-4 shadow-2xl transition-all duration-150 ${
          show ? "scale-100 opacity-100" : "scale-95 opacity-0"
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          aria-label="Close"
          onClick={close}
          className="absolute right-3 top-3 rounded-md p-2 hover:bg-slate-100 focus:outline-none"
        >
          <FaXmark className="w-4 h-4 text-slate-500" />
        </button>

        <div className="flex flex-col max-h-[90vh] overflow-y-auto">
          {children}
        </div>
      </div>
    </div>
  );
};

export default ModalCustom;
