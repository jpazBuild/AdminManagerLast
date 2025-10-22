import { useEffect, useRef, useState } from "react";
import { FaXmark } from "react-icons/fa6";
import { SearchField } from "@/app/components/SearchField";
import TextInputWithClearButton from "@/app/components/InputClear";

type ModalProps = {
  open: boolean;
  onClose?: () => void;
  saving: boolean;
  nameFlow: string;
  setNameFlow: (v: string) => void;
  descriptionFlow: string;
  setDescriptionFlow: (v: string) => void;
  selectedTags: any;
  setSelectedTags: (v: any) => void;
  tagsOptions: any;
  selectedUser: any;
  setSelectedUser: (v: any) => void;
  userOptions: { label: string; value: string | number }[];
  loadingTags: boolean;
  loadingUsers: boolean;
  onSave: () => void;
};

const ModalCreateFlow: React.FC<ModalProps> = ({
  open,
  onClose,
  saving,
  nameFlow,
  setNameFlow,
  descriptionFlow,
  setDescriptionFlow,
  selectedTags,
  setSelectedTags,
  tagsOptions,
  selectedUser,
  setSelectedUser,
  userOptions,
  loadingTags,
  loadingUsers,
  onSave,
}) => {
  const [show, setShow] = useState(open);
  const panelRef = useRef<HTMLDivElement | null>(null);
  const titleId = "create-flow-title";

  // Animación de entrada/salida y bloqueo de scroll
  useEffect(() => {
    if (open) {
      setShow(true);
      document.body.classList.add("overflow-hidden");
    }
    return () => {
      document.body.classList.remove("overflow-hidden");
    };
  }, [open]);

  const close = () => {
    // pequeña salida con anim y luego cerrar
    setShow(false);
    setTimeout(() => onClose?.(), 150);
  };

  // Cerrar con ESC
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // Cerrar con clic fuera
  const onBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    // Si el clic es en el backdrop y no dentro del panel
    if (e.target === e.currentTarget) close();
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center"
      onMouseDown={onBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
    >
      {/* Overlay */}
      <div
        className={`fixed inset-0 bg-black/50 transition-opacity duration-150 ${
          show ? "opacity-100" : "opacity-0"
        }`}
      />
      {/* Panel */}
      <div
        ref={panelRef}
        className={`relative z-[101] w-full max-w-2xl rounded-xl bg-white p-4 shadow-2xl transition-all duration-150
          ${show ? "scale-100 opacity-100" : "scale-95 opacity-0"}`}
        onMouseDown={(e) => e.stopPropagation()}
      >
        {/* Close (X) */}
        <button
          type="button"
          aria-label="Close"
          onClick={close}
          className="absolute right-3 top-3 rounded-md p-2 hover:bg-slate-100 focus:outline-none"
        >
          <FaXmark className="w-4 h-4 text-slate-500" />
        </button>

        {/* Header */}
        <div className="mb-2 px-2">
          <h2 id={titleId} className="text-lg font-semibold text-primary">
            Create New Flow
          </h2>
          <p className="text-sm text-slate-500">
            Give your test a name, description, tags and the author. You can
            adjust advanced fields later if needed.
          </p>
        </div>

        {/* Body */}
        <div className="flex flex-col gap-4 mt-4 w-full px-2 text-primary">
          <TextInputWithClearButton
            id="flowName"
            label="Flow Name"
            placeholder="Enter flow name"
            value={nameFlow}
            onChangeHandler={(e) => setNameFlow(e.target.value)}
          />

          <TextInputWithClearButton
            id="flowDescription"
            label="Flow Description"
            placeholder="Enter flow description"
            value={descriptionFlow}
            onChangeHandler={(e) => setDescriptionFlow(e.target.value)}
          />

          <SearchField
            value={selectedTags}
            placeholder="Select tags"
            label={loadingTags ? "Loading tags…" : "Select tags"}
            onChange={setSelectedTags}
            options={tagsOptions}
          />

          <SearchField
            value={selectedUser}
            placeholder="Select user"
            label={loadingUsers ? "Loading users…" : "Select user"}
            onChange={setSelectedUser}
            options={userOptions as any}
            className="z-20"
          />
        </div>

        {/* Footer */}
        <div className="mt-6 flex items-center justify-end gap-2 px-2">
          <button
            type="button"
            onClick={close}
            disabled={saving}
            className="inline-flex items-center justify-center rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onSave}
            disabled={saving}
            className="inline-flex items-center justify-center rounded-xl bg-[#3956E8] px-4 py-2 text-sm font-semibold text-white hover:opacity-95 disabled:opacity-50"
          >
            {saving ? "Saving..." : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ModalCreateFlow;
