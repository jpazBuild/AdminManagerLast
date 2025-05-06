import { useEffect, useState } from "react";
import { Check } from "lucide-react";
import { FaXmark } from "react-icons/fa6";
import { toast } from "sonner";

const AddCustomStep = ({
  onAdd,
  setOpen
}: {
  onAdd: (newStep: any) => void;
  setOpen: (open: boolean) => void;
}) => {
  const [jsonText, setJsonText] = useState("");
  const [stepsCount, setStepsCount] = useState(0);

  useEffect(() => {
    try {
      const count = parseMultipleJSONObjects(jsonText).length;
      setStepsCount(count);
    } catch {
      setStepsCount(0);
    }
  }, [jsonText]);

  const parseMultipleJSONObjects = (input: string): any[] => {
    const trimmed = input?.trim();

    if (trimmed?.startsWith("[")) {
      return JSON.parse(trimmed);
    }

    if (trimmed?.startsWith("{")) {
      const validArrayString = `[${trimmed}]`;

      try {
        const parsed = JSON.parse(validArrayString);
        if (Array.isArray(parsed)) return parsed;
      } catch {
        // Fallback to manual parsing
      }

      const objects: any[] = [];
      let buffer = "";
      let depth = 0;
      let inString = false;

      for (let i = 0; i < trimmed?.length; i++) {
        const char = trimmed[i];
        buffer += char;

        if (char === '"' && trimmed[i - 1] !== "\\") {
          inString = !inString;
        }

        if (!inString) {
          if (char === "{") depth++;
          if (char === "}") depth--;
        }

        if (depth === 0 && buffer.trim()) {
          try {
            objects.push(JSON.parse(buffer));
          } catch (err) {
            throw new Error(`Error parsing object: ${buffer}`);
          }
          buffer = "";
        }
      }

      if (depth !== 0) {
        throw new Error("Brackets not balanced. Check your JSON.");
      }

      return objects;
    }

    throw new Error("Input must start with '{' or '['.");
  };


  const handleAdd = () => {
    try {
      const stepsArray = parseMultipleJSONObjects(jsonText);
      onAdd(stepsArray);
      toast.success(`Added ${stepsArray.length} custom step(s)`);
      setJsonText("");
      setOpen(false);
    } catch (err: any) {
      toast.error(`Invalid JSON: ${err.message}`);
    }
  };

  const handleBeautify = () => {
    try {
      const stepsArray = parseMultipleJSONObjects(jsonText);
      const pretty = stepsArray.map(obj => JSON.stringify(obj, null, 2)).join(",\n\n");
      setJsonText(pretty);
    } catch (err: any) {
      toast.error(`Cannot beautify: ${err.message}`);
    }
  };

  return (
    <div className="flex flex-col gap-2 w-full">
        <div className="w-full p-3 mt-1 border rounded-md bg-white shadow-md flex flex-col gap-2 z-10">
          {stepsCount > 0 && (
            <p className="text-xs text-primary/70 mt-1">{stepsCount} step{stepsCount > 1 ? "s" : ""} parsed</p>
          )}
          <textarea
            value={jsonText}
            onChange={(e) => setJsonText(e.target.value)}
            placeholder="Paste one or more JSON steps here (e.g., {}, {})"
            className="w-full p-2 pr-10 break-words rounded-md resize-none text-primary focus:outline-none focus:ring-2 focus:ring-primary/90 shadow-md"
            rows={10}
            style={{
              whiteSpace: "pre-wrap",
              overflowX: "hidden",
              wordWrap: "break-word",
              fontFamily: "monospace",
            }}
          />
          

          <div className="flex justify-between items-center">
            <button
              className="text-xs text-primary/80 hover:text-primary/90"
              onClick={handleBeautify}
            >
              Beautify JSON
            </button>
            <div className="flex gap-2">
              <button
                className="shadow-md bg-primary/80 flex items-center gap-2 px-2 py-1 rounded-md text-xs text-white"
                onClick={handleAdd}
              >
                <Check size={16} /> <span>Insert</span>
              </button>
              <button
                className="shadow-md bg-white/80 border-2 border-primary/80 flex items-center gap-2 px-2 py-1 rounded-md text-xs text-primary/90"
                onClick={() => {
                  setOpen(false);
                  setJsonText("");
                }}
              >
                <FaXmark size={16} /> <span>Cancel</span>
              </button>
            </div>
          </div>
        </div>
    </div>
  );
};

export default AddCustomStep;
