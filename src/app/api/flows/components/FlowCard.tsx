import TextInputWithClearButton from "@/app/components/InputClear";
import { Trash2Icon } from "lucide-react";
import Image from "next/image";
import ExpandIcon from "../../../../assets/apisImages/ExpandArrow.svg";
import { httpMethodsStyle } from "../../utils/colorMethods";
import { FlowNode } from "@/types/types";

type VisualNode = FlowNode & {
  _metaType?: "environment" | "iteration";
  _readonly?: boolean;
  _subtitle?: string;
};

const neutralPill =
  "text-[11px] px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200";

const MethodPill: React.FC<{ method: string }> = ({ method }) => {
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
}> = ({ node, onOpen, onChangeUrl, onRemove }) => {
  const readonly = !!node._readonly;

  return (
    <div
      className={`rounded-lg border bg-white shadow-sm px-4 py-3 min-w-[320px] ${
        node._metaType ? "border-primary/10" : "border-primary/20"
      }`}
    >
      <div className="flex items-center justify-between gap-2 mb-2">
        <div className="flex items-center gap-2">
          <MethodPill method={node.method} />
          <div className="flex flex-col">
            <p className="font-medium text-primary/85">{node.name}</p>
            {node._subtitle && (
              <span className="text-[11px] text-primary/60 leading-none">{node._subtitle}</span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {!readonly && (
            <button
              title="Open details"
              onClick={() => onOpen(node.id)}
              className="hover:opacity-80 text-primary/85"
            >
              <Image src={ExpandIcon} alt="Expand" className="w-4 h-4" />
            </button>
          )}
          {!readonly && (
            <button title="Remove" onClick={() => onRemove(node.id)} className="hover:opacity-80 text-primary/85">
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
      />
    </div>
  );
};

export default FlowCard;
