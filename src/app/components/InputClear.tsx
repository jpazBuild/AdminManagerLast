// import React, { useEffect, useRef, useState } from "react";
// import { AiOutlineClose } from "react-icons/ai";

// interface TextInputWithClearButtonProps {
//   label?: string;
//   id: string;
//   value: string;
//   onChangeHandler: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
//   placeholder: string;
//   type?: string;
//   disabled?: boolean;
//   className?: string;
//   rows?: number;
//   maxLength?: number;
//   minLength?: number;
//   autoComplete?: string;
//   autoFocus?: boolean;
//   readOnly?: boolean;
//   required?: boolean;
// }

// const TextInputWithClearButton: React.FC<TextInputWithClearButtonProps> = ({
//   label,
//   id,
//   value,
//   onChangeHandler,
//   placeholder,
// }) => {
//   const spanRef = useRef<HTMLSpanElement>(null);
//   const inputRef = useRef<HTMLInputElement>(null);
//   const [useTextarea, setUseTextarea] = useState(false);

//   useEffect(() => {
//     if (spanRef?.current && inputRef?.current) {
//       const textWidth = spanRef?.current.offsetWidth;
//       const inputWidth = inputRef?.current.offsetWidth - 40; // descontamos padding y botón
//       setUseTextarea(textWidth > inputWidth || value?.includes("\n"));
//     }
//   }, [value]);

//   const clearInput = () => {
//     onChangeHandler({ target: { value: "" } } as React.ChangeEvent<HTMLInputElement>);
//   };

//   const lineCount = value?.split("\n").length;

//   return (
//     <div className="relative w-full">
//       {label && (
//         <label htmlFor={id} className="text-sm text-primary/70">
//           {label}
//         </label>
//       )}
//       <div className="relative">
//         {useTextarea ? (
//           <textarea
//             id={id}
//             placeholder={placeholder}
//             value={value ?? ""}
//             rows={lineCount < 3 ? 3 : lineCount}
//             onChange={onChangeHandler}
//             className="w-full p-2 pr-10 rounded-md bg-primary/10 resize-none text-primary/80 focus:outline-none focus:ring-2 focus:ring-primary/90 shadow-md"
//           />
//         ) : (
//           <input
//             ref={inputRef}
//             id={id}
//             type="text"
//             placeholder={placeholder}
//             value={value ?? ""}
//             onChange={onChangeHandler}
//             className="w-full p-2 pr-10 rounded-md bg-primary/10 text-primary/80 focus:outline-none focus:ring-2 focus:ring-primary/90 shadow-md"
//           />
//         )}

//         {value?.length > 0 && (
//           <button
//             type="button"
//             onClick={clearInput}
//             className="absolute right-3 top-1/2 transform -translate-y-1/2 text-primary/80 hover:text-primary/90"
//           >
//             <AiOutlineClose className="w-4 h-4" />
//           </button>
//         )}

//         <span
//           ref={spanRef}
//           className="absolute invisible whitespace-pre font-mono text-xs px-2"
//         >
//           {value}
//         </span>
//       </div>
//     </div>
//   );
// };

// export default TextInputWithClearButton;


import React, { useEffect, useRef, useState } from "react";
import { AiOutlineClose } from "react-icons/ai";

interface TextInputWithClearButtonProps {
  label?: string;
  id: string;
  value: string;
  onChangeHandler: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  placeholder: string;
  type?: string;
  disabled?: boolean;
  className?: string;
  rows?: number;
  maxLength?: number;
  minLength?: number;
  autoComplete?: string;
  autoFocus?: boolean;
  readOnly?: boolean;
  required?: boolean;
}

const TextInputWithClearButton: React.FC<TextInputWithClearButtonProps> = ({
  label,
  id,
  value,
  onChangeHandler,
  placeholder,
  ...props
}) => {
  const spanRef = useRef<HTMLSpanElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [useTextarea, setUseTextarea] = useState(false);

  // Estado local y debounce
  const [localValue, setLocalValue] = useState(value ?? "");
  const debounceTimeout = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    setLocalValue(value ?? "");
  }, [value]);

  useEffect(() => {
    if (spanRef.current && inputRef.current) {
      const textWidth = spanRef.current.offsetWidth;
      const inputWidth = inputRef.current.offsetWidth - 40;
      setUseTextarea(textWidth > inputWidth || localValue.includes("\n"));
    }
  }, [localValue]);

  useEffect(() => {
    if (debounceTimeout.current) clearTimeout(debounceTimeout.current);
    debounceTimeout.current = setTimeout(() => {
      if (localValue !== value) {
        onChangeHandler({
          target: { value: localValue }
        } as React.ChangeEvent<HTMLInputElement>);
      }
    }, 200);
    return () => {
      if (debounceTimeout.current) {
        clearTimeout(debounceTimeout.current);
      }
    };
  }, [localValue]);

  const clearInput = () => setLocalValue("");

  const lineCount = localValue?.split("\n").length;

  return (
    <div className="relative w-full">
      {label && (
        <label htmlFor={id} className="text-sm text-primary/70">
          {label}
        </label>
      )}
      <div className="relative">
        {useTextarea ? (
          <textarea
            id={id}
            placeholder={placeholder}
            value={localValue}
            rows={lineCount < 3 ? 3 : lineCount}
            onChange={e => setLocalValue(e.target.value)}
            className="w-full p-2 pr-10 rounded-md bg-primary/10 resize-none text-primary/80 focus:outline-none focus:ring-2 focus:ring-primary/90 shadow-md"
          />
        ) : (
          <input
            ref={inputRef}
            id={id}
            type="text"
            placeholder={placeholder}
            value={localValue}
            onChange={e => setLocalValue(e.target.value)}
            className="w-full p-2 pr-10 rounded-md bg-primary/10 text-primary/80 focus:outline-none focus:ring-2 focus:ring-primary shadow-md decoration-none"
          />
        )}
        {localValue?.length > 0 && (
          <button
            type="button"
            onClick={clearInput}
            className="absolute cursor-pointer right-3 top-1/2 transform -translate-y-1/2 text-primary/80 hover:text-primary/90"
          >
            <AiOutlineClose className="w-4 h-4" />
          </button>
        )}
        <span
          ref={spanRef}
          className="absolute invisible whitespace-pre font-mono text-xs px-2"
        >
          {localValue}
        </span>
      </div>
    </div>
  );
};

export default TextInputWithClearButton;
