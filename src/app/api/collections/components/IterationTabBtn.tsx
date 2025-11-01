import React from "react";

type IterationTabBtnProps = {
  idx: number;
  activeIdx: number;
  onSelect: (idx: number) => void;
  labelPrefix?: string;
  darkMode?: boolean;

};

const IterationTabBtn: React.FC<IterationTabBtnProps> = ({
  idx,
  activeIdx,
  onSelect,
  labelPrefix = "IT",
  darkMode = false
}) => (
  <button
    onClick={() => onSelect(idx)}
    className={`px-3 py-2 text-sm border-b-2 transition-colors ${activeIdx === idx
        ? `${darkMode ? "border-primary-blue text-white" : "border-primary-blue text-slate-800"}`
        : `${darkMode ? "border-transparent text-gray-400 hover:text-gray-200" : "border-transparent text-slate-500 hover:text-slate-700"}`
      }`}
  >
    {`${labelPrefix}${idx + 1}`}
  </button>
);

export default IterationTabBtn;
