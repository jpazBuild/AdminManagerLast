"use client";
type Props = {
  open: boolean;
  title: string;
  message: string;
  onCancel: () => void;
  onConfirm: () => void;
};
export default function ConfirmModal({ open, title, message, onCancel, onConfirm }: Props) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/30" onClick={onCancel} />
      <div className="relative z-10 w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
        <h3 className="text-lg font-semibold text-primary/90 text-center">{title}</h3>
        <p className="text-sm text-gray-500 my-4 text-center">{message}</p>
        <div className="flex items-center w-full gap-2">
          <button className="w-1/2 px-4 py-2 rounded-lg border text-sm hover:bg-gray-50" onClick={onCancel}>
            Cancel
          </button>
          <button className="w-1/2 px-4 py-2 rounded-lg bg-red-600 text-white text-sm hover:bg-red-700" onClick={onConfirm}>
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}
