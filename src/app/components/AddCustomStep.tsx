import { useEffect, useState } from "react";
import { Check } from "lucide-react";
import { FaXmark } from "react-icons/fa6";
import { toast } from "sonner";



const escapeInvalidBackslashes = (input: string): string =>{
  let out = "";
  let inString = false;
  let escape = false;
  let quoteChar = "";

  const valid = new Set(['"', '\\', '/', 'b', 'f', 'n', 'r', 't', 'u']);

  for (let i = 0; i < input.length; i++) {
    const ch = input[i];

    if (!inString) {
      if (ch === '"' || ch === "'") {
        inString = true;
        quoteChar = ch;
      }
      out += ch;
      continue;
    }

    if (escape) {
      if (!valid.has(ch)) out += '\\';
      out += ch;
      escape = false;
      continue;
    }

    if (ch === '\\') {
      escape = true;
      out += ch;
      continue;
    }

    if (ch === quoteChar) {
      inString = false;
      quoteChar = "";
    }

    out += ch;
  }
  return out;
}

const safeJSONParse = (text: string) => {
  try { return JSON.parse(text); } catch {}

  const fixed = escapeInvalidBackslashes(text);
  return JSON.parse(fixed);
}


const AddCustomStep = ({
  onAdd,
  setOpen,
  darkMode
}: {
  onAdd: (newStep: any) => void;
  setOpen: (open: boolean) => void;
  darkMode?: boolean;
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
      return safeJSONParse(trimmed);
    }

    if (trimmed?.startsWith("{")) {
      const validArrayString = `[${trimmed}]`;

      try {
        const parsed = safeJSONParse(validArrayString);
        if (Array.isArray(parsed)) return parsed;
      } catch (error){
        toast.error("Error parsing JSON array.");
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
        <div className={`${darkMode ? "bg-gray-800 text-white/90" : "bg-white text-primary"} flex flex-col gap-4 p-4 rounded-md shadow-md w-full`}>
          {stepsCount > 0 && (
            <p className="text-xs text-primary/70 mt-1">{stepsCount} step{stepsCount > 1 ? "s" : ""} parsed</p>
          )}
          <textarea
            value={jsonText}
            onChange={(e) => setJsonText(e.target.value)}
            placeholder="Paste one or more JSON steps here (e.g., {}, {})"
            className={`w-full h-48 p-2 border ${darkMode ? "bg-gray-900 border-gray-700 text-white/90" : "bg-white border-gray-300 text-primary"} rounded-md font-mono text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 resize-y`}
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
              className={`${darkMode ? "bg-gray-700 text-white/90 hover:bg-gray-600" : "bg-gray-200 text-primary hover:bg-gray-300"} shadow-md cursor-pointer px-2 py-1 rounded-md text-xs`}
              onClick={handleBeautify}
            >
              Beautify JSON
            </button>
            <div className="flex gap-2">
              <button
                className={`${darkMode ? "bg-primary text-white/90 hover:bg-primary/90 hover:text-white" : "bg-primary/80 text-white hover:bg-primary"} shadow-md cursor-pointer px-2 py-1 rounded-md text-xs flex items-center gap-1`}
                onClick={handleAdd}
              >
                <Check size={16} /> <span>Insert</span>
              </button>
              <button
                className={`${darkMode ? "bg-gray-700 text-white/90 hover:bg-gray-600" : "bg-gray-200 text-primary hover:bg-gray-300"} shadow-md cursor-pointer px-2 py-1 rounded-md text-xs flex items-center gap-1`}
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
