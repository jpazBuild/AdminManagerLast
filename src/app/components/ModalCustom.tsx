"use client";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { FaXmark } from "react-icons/fa6";

type ModalProps = {
  open: boolean;
  onClose?: () => void;
  children: React.ReactNode;
  width?: string;
  isDarkMode?: boolean;
  height?: string;
};

const ModalCustom: React.FC<ModalProps> = ({
  open,
  onClose,
  children,
  width = "max-w-2xl",
  isDarkMode = false,
  height = "max-h-[90vh]",
}) => {
  const [mounted, setMounted] = useState(false);
  const [show, setShow] = useState(open);
  const scrollYRef = useRef(0);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!open) return;
    const body = document.body;
    setShow(true);
    scrollYRef.current = window.scrollY || 0;
    body.style.position = "fixed";
    body.style.top = `-${scrollYRef.current}px`;
    body.style.width = "100%";
    body.style.overflow = "hidden";
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

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && handleClose();
    window.addEventListener("keydown", onKey, { passive: true });
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const handleClose = () => {
    setShow(false);
    setTimeout(() => onClose?.(), 150);
  };

  if (!mounted || !open) return null;

  const node = (
    <div
      className="fixed inset-0 z-[10000] flex items-center justify-center"
      role="dialog"
      aria-modal="true"
    >
      <div
        className={`fixed inset-0 z-[10000] ${isDarkMode ? "bg-black/50" : "bg-black/40"} transition-opacity duration-150 ${
          show ? "opacity-100" : "opacity-0"
        }`}
        onClick={handleClose}
      />

      <div
        className={`relative z-[10001] w-full ${width} ${height} rounded-2xl ${
          isDarkMode ? "bg-gray-900" : "bg-white"
        } p-4 shadow-2xl transition-all duration-150 ${
          show ? "scale-100 opacity-100" : "scale-95 opacity-0"
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          aria-label="Close"
          onClick={handleClose}
          className={`absolute right-3 top-3 rounded-md p-2 ${
            isDarkMode ? "hover:bg-white/10" : "hover:bg-slate-100"
          }`}
        >
          <FaXmark className={`w-4 h-4 ${isDarkMode ? "text-slate-300" : "text-slate-500"}`} />
        </button>

        <div className="flex flex-col max-h-[90vh] overflow-y-auto">
          {children}
        </div>
      </div>
    </div>
  );

  return createPortal(node, document.body);
};

export default ModalCustom;
