import { useEffect, useRef, useState } from "react";
import { FaXmark } from "react-icons/fa6";
import { SearchField } from "@/app/components/SearchField";
import TextInputWithClearButton from "@/app/components/InputClear";
import ModalCustom from "@/app/components/ModalCustom";

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
  const titleId = "create-flow-title";

  
  
  return (
    <ModalCustom
      open={open}
      onClose={onClose}
    >

      <div className="mb-2 px-2">
        <h2 id={titleId} className="text-lg font-semibold text-primary">
          Create New Flow
        </h2>
        <p className="text-sm text-slate-500">
          Give your test a name, description, tags and the author. You can
          adjust advanced fields later if needed.
        </p>
      </div>

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

      <div className="mt-6 flex items-center justify-end gap-2 px-2">
        <button
          type="button"
          onClick={onClose}
          disabled={saving}
          className="inline-flex items-center justify-center rounded-xl border border-slate-300 bg-white px-8 py-3 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={onSave}
          disabled={saving}
          className="inline-flex items-center justify-center rounded-xl bg-[#3956E8] px-8 py-3 text-sm font-semibold text-white hover:opacity-95 disabled:opacity-50"
        >
          {saving ? "Saving..." : "Save"}
        </button>
      </div>
    </ModalCustom>
  );
};

export default ModalCreateFlow;
