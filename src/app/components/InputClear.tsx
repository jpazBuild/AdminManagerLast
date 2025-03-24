import React from "react";
import { AiOutlineClose } from "react-icons/ai";

interface TextInputWithClearButtonProps {
  label?: string;
  id: string;
  value: string;
  onChangeHandler: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  disabled?:any;
  type?:any;
}

const TextInputWithClearButton: React.FC<TextInputWithClearButtonProps> = ({
  label,
  id,
  value,
  onChangeHandler,
  placeholder,
  disabled,
  type="text"
}) => {
  const clearInput = () => {
    onChangeHandler({ target: { value: "" } } as React.ChangeEvent<HTMLInputElement>);
  };

  return (
    <div className="relative w-full">
      <label htmlFor={id} className="text-sm text-gray-400">
        {label}
      </label>
      <div className="relative">
        <input
          id={id}
          type={type}
          placeholder={placeholder}
          value={value}
          onChange={onChangeHandler}
          disabled={disabled}
          className="w-full p-2 pr-10 rounded-md text-[#223853] bg-white focus:outline-none focus:ring-2 focus:ring-[#223853]"
        />
        {value?.length > 0 && (
          <button
            type="button"
            onClick={clearInput}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-200"
          >
            <AiOutlineClose className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
};

export default TextInputWithClearButton;