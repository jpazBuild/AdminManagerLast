import { useCallback, useState } from "react";
import { Upload } from "lucide-react";
import { toast } from "sonner";

const JSONDropzone = ({
  onJSONParsed,
  onFileInfoChange,
  acceptedFileTypes = ["application/json"],
}: {
  onJSONParsed: (data: any) => void;
  onFileInfoChange?: (info: { loaded: boolean; name: string }) => void;
  acceptedFileTypes?: string[];
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);

  const handleFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const json = JSON.parse(reader.result as string);
        onJSONParsed(json);
        setFileName(file.name);
        toast.success("JSON uploaded successfully!");
        onFileInfoChange?.({ loaded: true, name: file.name });
      } catch {
        toast.error("Invalid JSON format.");
        onFileInfoChange?.({ loaded: false, name: "" });
      }
    };
    reader.readAsText(file);
  };

  const handleDrop = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragging(false);

    const file = event.dataTransfer.files[0];
    if (file && file.type === "application/json") {
      handleFile(file);
    } else {
      toast.error("Please upload a valid .json file.");
    }
  }, [onJSONParsed]);

  return (
    <div
      onDrop={handleDrop}
      onDragOver={(e) => {
        e.preventDefault();
        setIsDragging(true);
      }}
      onDragLeave={() => setIsDragging(false)}
      className={`max-w-80 border-2 text-primary border-dashed hover:bg-primary/10 hover:border-primary rounded-md px-4 py-6 transition-colors cursor-pointer ${
        isDragging ? "border-primary bg-primary/10" : "border-primary/30 bg-white"
      }`}
    >
      <div className="flex flex-col items-center justify-center gap-2 text-sm text-primary/60">
        <Upload className="text-primary" size={20} />
        <p className="text-xs text-center">
          Drag and drop a <span className="font-medium">JSON</span> file here or click to browse
        </p>
        <input
          type="file"
          accept={acceptedFileTypes.join(",")}
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (!file) return;
            handleFile(file);
          }}
          className="hidden"
          id="json-upload"
        />
        <label htmlFor="json-upload" className="underline text-primary cursor-pointer text-xs">
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

export default JSONDropzone;
