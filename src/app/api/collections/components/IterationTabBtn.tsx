import React from "react";

type IterationTabBtnProps = {
  idx: number;
  activeIdx: number;
  onSelect: (idx: number) => void;
  labelPrefix?: string;
};

const IterationTabBtn: React.FC<IterationTabBtnProps> = ({
  idx,
  activeIdx,
  onSelect,
  labelPrefix = "IT",
}) => (
  <button
    onClick={() => onSelect(idx)}
    className={`px-3 py-2 text-sm border-b-2 ${
      activeIdx === idx
        ? "border-primary-blue text-slate-800"
        : "border-transparent text-slate-500"
    }`}
  >
    {`${labelPrefix}${idx + 1}`}
  </button>
);

export default IterationTabBtn;
