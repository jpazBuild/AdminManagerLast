import { useCallback, useState } from "react";
import { Upload } from "lucide-react";
import { toast } from "sonner";

const JSONDropzone = ({ onJSONParsed }: { onJSONParsed: (data: any) => void }) => {
  const [isDragging, setIsDragging] = useState(false);

  const handleDrop = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragging(false);

    const file = event.dataTransfer.files[0];
    if (file && file.type === "application/json") {
      const reader = new FileReader();
      reader.onload = () => {
        try {
          const json = JSON.parse(reader.result as string);
          onJSONParsed(json);
          toast.success("JSON uploaded successfully!");
        } catch {
          toast.error("Invalid JSON format.");
        }
      };
      reader.readAsText(file);
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
      className={`border-2 text-primary border-dashed hover:bg-primary/10 hover:border-primary rounded-md px-4 py-6 transition-colors cursor-pointer ${
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
          accept="application/json"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (!file) return;

            const reader = new FileReader();
            reader.onload = () => {
              try {
                const json = JSON.parse(reader.result as string);
                onJSONParsed(json);
                toast.success("JSON uploaded successfully!");
              } catch {
                toast.error("Invalid JSON format.");
              }
            };
            reader.readAsText(file);
          }}
          className="hidden"
          id="json-upload"
        />
        <label htmlFor="json-upload" className="underline text-primary cursor-pointer text-xs">
          or select manually
        </label>
      </div>
    </div>
  );
};

export default JSONDropzone;
