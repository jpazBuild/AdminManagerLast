import TextInputWithClearButton from "@/app/components/InputClear";
import { Trash2Icon } from "lucide-react";
import Image from "next/image";
import ExpandIcon from "../../../../assets/apisImages/ExpandArrow.svg";
import { httpMethodsStyle } from "../../utils/colorMethods";
import { FlowNode } from "@/types/types";


const MethodPill: React.FC<{ method: string }> = ({ method }) => (
    <span className={`${httpMethodsStyle(method)} text-[11px] px-2 py-0.5 rounded`}>{method}</span>
);


const FlowCard: React.FC<{
    node: FlowNode;
    onOpen: (id: string) => void;
    onChangeUrl: (id: string, url: string) => void;
    onRemove: (id: string) => void;
}> = ({ node, onOpen, onChangeUrl, onRemove }) => {
    return (
        <div className="rounded-lg border border-primary/20 bg-white shadow-sm px-4 py-3 min-w-[320px]">
            <div className="flex items-center justify-between gap-2 mb-2">
                <div className="flex items-center gap-2">
                    <MethodPill method={node.method} />
                    <p className="font-medium text-primary/85">{node.name}</p>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        title="Open details"
                        onClick={() => onOpen(node.id)}
                        className="hover:opacity-80 text-primary/85"
                    >
                        <Image src={ExpandIcon} alt="Expand" className="w-4 h-4" />
                    </button>
                    <button title="Remove" onClick={() => onRemove(node.id)} className="hover:opacity-80 text-primary/85">
                        <Trash2Icon className="w-5 h-5" />
                    </button>
                </div>
            </div>
            <TextInputWithClearButton
                id={`flow-node-url-${node.id}`}
                value={node.url}
                onChangeHandler={(e) => onChangeUrl(node.id, e.target.value)}
                placeholder="http://localhost:3000/"
            />
        </div>
    );
};

export default FlowCard;