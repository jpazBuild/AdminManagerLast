import { useCallback, useRef, useState, useId } from "react";
import { Upload } from "lucide-react";
import { toast } from "sonner";
import { CiSquareRemove } from "react-icons/ci";

type JSONDropzoneProps = {
  onJSONParsed: (data: any) => void;
  onFileInfoChange?: (info: { loaded: boolean; name: string }) => void;
  acceptedFileTypes?: string[];
  onClear?: () => void;
  isDarkMode?: boolean;
  inputId?: string;
  multiple?: boolean;
};

const JSONDropzone = ({
  onJSONParsed,
  onFileInfoChange,
  acceptedFileTypes = ["application/json"],
  onClear,
  isDarkMode = false,
  inputId,
  multiple = true,
}: JSONDropzoneProps) => {
  const [isDragging, setIsDragging] = useState(false);
  const [fileNames, setFileNames] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const autoId = useId();
  const resolvedId = inputId ?? `json-upload-${autoId}`;

  const acceptFile = useCallback(
    (f: File) => acceptedFileTypes.includes(f.type) || f.name.toLowerCase().endsWith(".json"),
    [acceptedFileTypes]
  );

  const handleFile = useCallback(
    (file: File) => {
      const reader = new FileReader();
      reader.onload = () => {
        try {
          const json = JSON.parse(String(reader.result));
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
    },
    [onJSONParsed, onFileInfoChange]
  );

  const openFileDialog = useCallback(() => {
    if (!fileInputRef.current) return;
    fileInputRef.current.value = "";
    fileInputRef.current.click();
  }, []);

  const handleDrop = useCallback(
    (event: React.DragEvent<HTMLDivElement>) => {
      event.preventDefault();
      setIsDragging(false);
      const files = Array.from(event.dataTransfer.files).filter(acceptFile);
      if (files.length === 0) {
        toast.error("Por favor, sube solo archivos .json");
        return;
      }
      files.forEach(handleFile);
      if (fileInputRef.current) fileInputRef.current.value = "";
    },
    [acceptFile, handleFile]
  );

  const clearFile = useCallback(() => {
    setFileNames([]);
    toast.info("JSON files removed.");
    onFileInfoChange?.({ loaded: false, name: "" });
    onClear?.();
    if (fileInputRef.current) fileInputRef.current.value = "";
  }, [onClear, onFileInfoChange]);

  const dzClsBase =
    "max-w-80 border-2 border-dashed rounded-md px-4 py-6 transition-colors cursor-pointer";
  const dzCls = isDarkMode
    ? `${dzClsBase} ${isDragging ? "border-blue-400 bg-blue-900/20 text-white" : "border-gray-500 bg-gray-800 text-gray-300 hover:bg-blue-900/10 hover:border-blue-400"}`
    : `${dzClsBase} text-primary ${isDragging ? "border-primary bg-primary/10" : "border-primary/30 bg-white hover:bg-primary/10 hover:border-primary"}`;

  const textCls = isDarkMode ? "text-gray-400" : "text-primary/60";
  const iconCls = isDarkMode ? "text-blue-400" : "text-primary";
  const fileNameCls = isDarkMode ? "text-gray-300" : "text-primary";
  const fileValCls = isDarkMode ? "text-white" : "text-primary/90";
  const removeBtnCls = isDarkMode
    ? "text-gray-400 self-center flex items-center gap-1 text-xs hover:text-gray-200 p-2 rounded-md border-2 border-gray-500 hover:border-gray-400 transition-colors"
    : "text-primary/70 self-center flex items-center gap-1 text-xs hover:text-primary/75 p-2 rounded-md border-2 border-primary/80 hover:border-primary transition-colors";

  return (
    <div
      onDrop={handleDrop}
      onDragOver={(e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = "copy";
        setIsDragging(true);
      }}
      onDragLeave={() => setIsDragging(false)}
      onClick={(e) => {
        if ((e.target as HTMLElement).closest("button")) return;
        openFileDialog();
      }}
      className={` ${dzCls}`}
      role="button"
      aria-label="Cargar JSON"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          openFileDialog();
        }
      }}
    >
      <div className={`flex flex-col items-center justify-center gap-2 text-sm ${textCls}`}>
        <Upload className={iconCls} size={20} />
        <p className="text-xs text-center">
          Drag and drop a <span className="font-medium">JSON</span> file here or click to browse
        </p>

        <input
          ref={fileInputRef}
          id={resolvedId}
          type="file"
          accept={acceptedFileTypes.join(",")}
          multiple={multiple}
          onChange={(e) => {
            const files = e.target.files;
            if (!files || files.length === 0) return;
            Array.from(files).forEach((file) => {
              if (acceptFile(file)) {
                handleFile(file);
              } else {
                toast.error(`El archivo ${file.name} no es JSON válido.`);
              }
            });
          }}
          className="hidden"
        />

        <button
          type="button"
          className={isDarkMode ? "underline text-blue-400 text-xs hover:text-blue-300"
                                : "underline text-primary text-xs hover:text-primary/80"}
          onClick={(e) => {
            e.stopPropagation();
            openFileDialog();
          }}
        >
          or select manually
        </button>
      </div>

      {fileNames.length > 0 && (
        <div className={`mt-4 flex flex-col text-center text-xs font-medium space-y-2 ${fileNameCls}`}>
          {fileNames.map((name, idx) => (
            <div key={idx}>
              Uploaded: <span className={fileValCls}>{name}</span>
            </div>
          ))}
          <button onClick={clearFile} className={removeBtnCls}>
            <CiSquareRemove className="w-4 h-4" /> Remove all uploaded JSONs
          </button>
        </div>
      )}
    </div>
  );
};

export default JSONDropzone;
