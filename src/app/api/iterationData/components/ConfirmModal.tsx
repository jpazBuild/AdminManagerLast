import { AlertCircle, X } from "lucide-react";

export default function ConfirmModal({
  open,
  title,
  message,
  onCancel,
  onConfirm,
}: {
  open: boolean;
  title: string;
  message: string;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-black/30" onClick={onCancel} aria-hidden="true" />
      <div className="relative z-10 w-[min(560px,90vw)] rounded-2xl bg-white p-6 shadow-xl">
        <button onClick={onCancel} className="absolute right-4 top-4 rounded-full p-1 hover:bg-gray-100" aria-label="Close">
          <X className="h-5 w-5 text-gray-500" />
        </button>
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-red-50">
          <AlertCircle className="h-7 w-7 text-red-600" />
        </div>
        <h3 className="text-center text-xl font-semibold text-[#0A2342]">{title}</h3>
        <p className="mt-1 text-center text-[#7B8CA6]">{message}</p>
        <div className="mt-6 grid grid-cols-2 gap-3">
          <button onClick={onCancel} className="inline-flex items-center justify-center rounded-full border border-[#0A2342] px-6 py-2.5 font-semibold text-[#0A2342] hover:bg-gray-50">
            Cancel
          </button>
          <button onClick={onConfirm} className="inline-flex items-center justify-center rounded-full bg-red-600 px-6 py-2.5 font-semibold text-white hover:bg-red-700">
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}
