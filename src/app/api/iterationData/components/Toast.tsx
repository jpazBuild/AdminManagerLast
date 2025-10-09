import { X } from "lucide-react";

const Toast = ({
  visible,
  message,
  variant = "success",
  onClose,
}: {
  visible: boolean;
  message: string;
  variant?: "success" | "error";
  onClose: () => void;
}) => {
  if (!visible) return null;
  return (
    <div className="mt-4">
      <div
        role="status"
        aria-live="polite"
        className={[
          "flex w-full items-center justify-between rounded-2xl px-5 py-3 shadow border",
          variant === "success"
            ? "border-green-200 bg-green-50 text-green-700"
            : "border-red-200 bg-red-50 text-red-700",
        ].join(" ")}
      >
        <span className="text-base font-semibold">{message}</span>
        <button onClick={onClose} aria-label="Close notification" className="rounded-full p-1 hover:bg-black/5">
          <X className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
}


export default Toast;