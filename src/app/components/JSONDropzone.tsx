import { useCallback, useRef, useState } from "react";
import { Upload } from "lucide-react";
import { toast } from "sonner";
import { CiCircleRemove, CiSquareRemove } from "react-icons/ci";

const JSONDropzone = ({
  onJSONParsed,
  onFileInfoChange,
  acceptedFileTypes = ["application/json"],
  onClear,
  isDarkMode = false,
}: {
  onJSONParsed: (data: any) => void;
  onFileInfoChange?: (info: { loaded: boolean; name: string }) => void;
  acceptedFileTypes?: string[];
  onClear?: () => void;
  isDarkMode?: boolean;
}) => {
  const [isDragging, setIsDragging] = useState(false);
  // const [fileName, setFileName] = useState<string | null>(null);
  const [fileNames, setFileNames] = useState<string[]>([]);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const json = JSON.parse(reader.result as string);
        onJSONParsed(json);
        setFileNames((prev) => [...prev, file.name]);
        toast.success(`JSON "${file.name}" cargado!`);
        onFileInfoChange?.({ loaded: true, name: file.name });
      } catch {
        toast.error(`"${file.name}" no es JSON válido.`);
        onFileInfoChange?.({ loaded: false, name: "" });
      }
    };
    reader.readAsText(file);
  };
  const handleDrop = useCallback(
    (event: React.DragEvent<HTMLDivElement>) => {
      event.preventDefault();
      setIsDragging(false);

      const files = Array.from(event.dataTransfer.files);
      const jsonFiles = files.filter((f) => f.type === "application/json");

      if (jsonFiles.length === 0) {
        toast.error("Por favor, sube solo archivos .json");
        return;
      }

      jsonFiles.forEach((file) => handleFile(file));
      if (fileInputRef.current) fileInputRef.current.value = "";
    },
    [onJSONParsed]
  );


  const clearFile = () => {
    setFileNames([]);
    toast.info("JSON files removed.");
    onFileInfoChange?.({ loaded: false, name: "" });
    onClear?.();
    if (fileInputRef.current) fileInputRef.current.value = "";
  };


  const getDropzoneClasses = () => {
    const baseClasses = "max-w-80 border-2 border-dashed rounded-md px-4 py-6 transition-colors cursor-pointer";

    if (isDarkMode) {
      return `${baseClasses} ${isDragging
        ? "border-blue-400 bg-blue-900/20 text-white"
        : "border-gray-500 bg-gray-800 text-gray-300 hover:bg-blue-900/10 hover:border-blue-400"
        }`;
    } else {
      return `${baseClasses} text-primary ${isDragging
        ? "border-primary bg-primary/10"
        : "border-primary/30 bg-white hover:bg-primary/10 hover:border-primary"
        }`;
    }
  };

  const getTextClasses = () => {
    return isDarkMode
      ? "text-gray-400"
      : "text-primary/60";
  };

  const getIconClasses = () => {
    return isDarkMode
      ? "text-blue-400"
      : "text-primary";
  };

  const getLabelClasses = () => {
    return isDarkMode
      ? "underline text-blue-400 cursor-pointer text-xs hover:text-blue-300"
      : "underline text-primary cursor-pointer text-xs hover:text-primary/80";
  };

  const getFileNameClasses = () => {
    return isDarkMode
      ? "text-gray-300"
      : "text-primary";
  };

  const getFileNameValueClasses = () => {
    return isDarkMode
      ? "text-white"
      : "text-primary/90";
  };

  const getRemoveButtonClasses = () => {
    return isDarkMode
      ? "text-gray-400 self-center flex items-center gap-1 text-xs hover:text-gray-200 p-2 rounded-md border-2 border-gray-500 hover:border-gray-400 transition-colors"
      : "text-primary/70 self-center flex items-center gap-1 text-xs hover:text-primary/75 p-2 rounded-md border-2 border-primary/80 hover:border-primary transition-colors";
  };

  return (
    <div
      onDrop={handleDrop}
      onDragOver={(e) => {
        e.preventDefault();
        setIsDragging(true);
      }}
      onDragLeave={() => setIsDragging(false)}
      className={getDropzoneClasses()}
    >
      <div className={`flex flex-col items-center justify-center gap-2 text-sm ${getTextClasses()}`}>
        <Upload className={getIconClasses()} size={20} />
        <p className="text-xs text-center">
          Drag and drop a <span className="font-medium">JSON</span> file here or click to browse
        </p>

        <input
          ref={fileInputRef}
          type="file"
          accept={acceptedFileTypes.join(",")}
          multiple
          onChange={(e) => {
            const files = e.target.files;
            if (!files || files.length === 0) return;

            Array.from(files).forEach((file) => {
              if (file.type === "application/json") {
                handleFile(file);
              } else {
                toast.error(`El archivo ${file.name} no es JSON válido.`);
              }
            });

            e.target.value = "";
          }}
          className="hidden"
          id="json-upload"
        />
        <label htmlFor="json-upload" className={getLabelClasses()}>
          or select manually
        </label>
      </div>

      {fileNames.length > 0 && (
        <div className={`mt-4 flex flex-col text-center text-xs font-medium space-y-2 ${getFileNameClasses()}`}>
          {fileNames.map((name, idx) => (
            <div key={idx}>
              Uploaded: <span className={getFileNameValueClasses()}>{name}</span>
            </div>
          ))}
          <button
            onClick={clearFile}
            className={getRemoveButtonClasses()}
          >
            <CiSquareRemove className="w-4 h-4" /> Remove all uploaded JSONs
          </button>
        </div>
      )}

    </div>
  );
};

export default JSONDropzone;