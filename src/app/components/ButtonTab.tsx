"use client";

import React from "react";

type ButtonTabProps = {
  label: string;
  value: string;
  isActive: boolean;
  onClick: (value: string) => void;
  isDarkMode?: boolean;
  underlineWidthClass?: string;
  className?: string;
  Icon?: React.ReactNode;
};

const ButtonTab: React.FC<ButtonTabProps> = ({
  label,
  value,
  isActive,
  onClick,
  isDarkMode = false,
  underlineWidthClass = "w-6",
  className = "text-[14px]",
  Icon = null,
}) => {
  return (
    <div className={`flex flex-col items-center gap-1 ${className}`}>
      <button
        type="button"
        onClick={() => onClick(value)}
        role="tab"
        aria-selected={isActive}
        className={`cursor-pointer flex gap-1 items-center px-4 py-2 font-semibold tracking-wide mt-4 rounded-lg transition-colors
          ${isDarkMode
            ? "bg-white text-[#021d3d] hover:bg-gray-200"
            : "bg-gray-100 text-primary hover:bg-gray-200"}`}
      >
        {Icon} {label}
      </button>
      <span
        className={`${underlineWidthClass} h-1 rounded-md transition-colors ${
          isActive ? "bg-[#3b5af1]" : "bg-gray-200"
        }`}
        aria-hidden="true"
      />
    </div>
  );
};

export default ButtonTab;

