import { useCallback, useState } from "react";
import { Upload } from "lucide-react";
import { toast } from "sonner";

type FileDropzoneProps = {
  onFileParsed: (base64: string, file: File) => void;
  onFileInfoChange?: (info: { loaded: boolean; name: string }) => void;
  acceptedExtensions?: string[];
  acceptedMimeTypes?: string[];
  label?: string;
};

const FileDropzone = ({
  onFileParsed,
  onFileInfoChange,
  acceptedExtensions = [".json", ".csv"],
  acceptedMimeTypes = ["application/json", "text/csv"],
  label = "a file",
}: FileDropzoneProps) => {
  const [isDragging, setIsDragging] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);

  const isValidFile = (file: File) => {
    const extensionMatch = acceptedExtensions.some(ext => file.name.endsWith(ext));
    const mimeMatch = acceptedMimeTypes.includes(file.type);
    return extensionMatch || mimeMatch;
  };

  const handleFile = (file: File) => {
    if (!isValidFile(file)) {
      toast.error(`Invalid file type. Please upload ${acceptedExtensions.join(" or ")}`);
      onFileInfoChange?.({ loaded: false, name: "" });
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      if (result.startsWith("data:")) {
        onFileParsed(result, file);
        setFileName(file.name);
        toast.success(`${file.name} uploaded successfully!`);
        onFileInfoChange?.({ loaded: true, name: file.name });
      } else {
        toast.error("Could not read file as base64.");
      }
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragging(false);

    const file = event.dataTransfer.files[0];
    if (file) handleFile(file);
  }, []);

  return (
    <div
      onDrop={handleDrop}
      onDragOver={(e) => {
        e.preventDefault();
        setIsDragging(true);
      }}
      onDragLeave={() => setIsDragging(false)}
      className={`border-2 border-dashed rounded-md px-4 py-6 text-primary transition-colors cursor-pointer ${
        isDragging ? "border-primary bg-primary/10" : "border-primary/30 bg-white"
      }`}
    >
      <div className="flex flex-col items-center justify-center gap-2 text-sm text-primary/60">
        <Upload className="text-primary" size={20} />
        <p className="text-xs text-center">
          Drag and drop {label} here or click to browse
        </p>
        <input
          type="file"
          accept={acceptedExtensions.join(",")}
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleFile(file);
          }}
          className="hidden"
          id={`file-upload-${label}`}
        />
        <label htmlFor={`file-upload-${label}`} className="underline text-primary cursor-pointer text-xs">
          or select manually
        </label>
      </div>

      {fileName && (
        <div className="mt-4 text-center text-xs text-primary font-medium">
          Uploaded: <span className="text-primary/90">{fileName}</span>
        </div>
      )}
    </div>
  );
};

export default FileDropzone;
