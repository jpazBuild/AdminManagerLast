import TextInputWithClearButton from "@/app/components/InputClear";
import { Trash2Icon } from "lucide-react";
import { httpMethodsStyle } from "../../utils/colorMethods";
import { FlowNode } from "@/types/types";
import { ArrowSwapIcon } from "@/assets/apisImages/ExpandIcon";

type VisualNode = FlowNode & {
  _metaType?: "environment" | "iteration";
  _readonly?: boolean;
  _subtitle?: string;
};

const MethodPill: React.FC<{ method: string; darkMode?: boolean }> = ({ method, darkMode }) => {
  const neutralPill = darkMode
    ? "text-[11px] px-2 py-0.5 rounded bg-gray-800 text-gray-200 border border-gray-700"
    : "text-[11px] px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200";
  if (method === "ENV" || method === "DATA") {
    return <span className={neutralPill}>{method}</span>;
  }
  return <span className={`${httpMethodsStyle(method)} text-[11px] px-2 py-0.5 rounded`}>{method}</span>;
};

const FlowCard: React.FC<{
  node: VisualNode;
  onOpen: (id: string) => void;
  onChangeUrl: (id: string, url: string) => void;
  onRemove: (id: string) => void;
  darkMode?: boolean;
}> = ({ node, onOpen, onChangeUrl, onRemove, darkMode = false }) => {
  const readonly = !!node._readonly;
  const containerBorder = darkMode ? "border-gray-700" : node._metaType ? "border-primary/10" : "border-primary/20";
  const containerBg = darkMode ? "bg-gray-800" : "bg-white";
  const titleText = darkMode ? "text-gray-100" : "text-primary/85";
  const subText = darkMode ? "text-gray-300" : "text-primary/60";
  const iconText = darkMode ? "text-gray-200 hover:opacity-80" : "text-primary/85 hover:opacity-80";

  return (
    <div className={`rounded-lg border ${containerBg} shadow-sm px-4 py-3 min-w-[320px] ${containerBorder}`}>
      <div className="flex items-center justify-between gap-2 mb-2">
        <div className="flex items-center gap-2">
          <MethodPill method={node.method} darkMode={darkMode} />
          <div className="flex flex-col">
            <p className={`font-medium ${titleText}`}>{node.name}</p>
            {node._subtitle && <span className={`text-[11px] leading-none ${subText}`}>{node._subtitle}</span>}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {!readonly && (
            <button title="Open details" onClick={() => onOpen(node.id)} className={iconText}>
              <ArrowSwapIcon darkMode={darkMode} />
            </button>
          )}
          {!readonly && (
            <button title="Remove" onClick={() => onRemove(node.id)} className={iconText}>
              <Trash2Icon className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      <TextInputWithClearButton
        id={`flow-node-url-${node.id}`}
        value={node.url}
        onChangeHandler={(e) => onChangeUrl(node.id, e.target.value)}
        placeholder={readonly ? "" : "http://localhost:3000/"}
        disabled={readonly}
        className={darkMode ? "!bg-gray-900 !text-gray-100 !border !border-gray-700 placeholder:!text-gray-400" : ""}
      />
    </div>
  );
};

export default FlowCard;
