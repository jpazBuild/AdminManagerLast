import { ModalTab } from "@/types/types";
import { PrismLight as SyntaxHighlighter } from 'react-syntax-highlighter';
import { stackoverflowLight } from "react-syntax-highlighter/dist/esm/styles/hljs";
import ModalCustom from "@/app/components/ModalCustom";

type ModalRenderChipsProps = {
    chipModal: {
        open: boolean;
        flowId?: any;
        apiName?: any;
        stage: "pre" | "request" | "post";
        tab: ModalTab;
    };
    getApiPiece: (flowId: string, apiName: string) => any;
    stateLabel: (state: boolean | undefined) => string;
    setChipModal: (val: (prev: any) => any) => void;
    closeChipModal: () => void;
    darkMode?: boolean;
};


const ModalRenderChips = ({ chipModal, getApiPiece, stateLabel, setChipModal, closeChipModal, darkMode }: ModalRenderChipsProps) => {

    return (
        <ModalCustom
            open={chipModal.open}
            onClose={closeChipModal}
            width="max-w-3xl"
            isDarkMode={darkMode}
        >
            <div className={`flex flex-col gap-4 p-6 ${darkMode ? "bg-gray-900 text-white/90" : "bg-white text-gray-900"}`}>
                <h2 className="text-lg font-semibold">Chips for {chipModal.apiName}</h2>
                <div className="max-h-[500px] overflow-y-auto">
                    <SyntaxHighlighter
                        language="javascript"
                        style={darkMode ? stackoverflowLight : stackoverflowLight}
                        customStyle={{ borderRadius: "0.5rem", padding: "1rem", fontSize: "0.875rem", backgroundColor: `${darkMode ? "#1e2939" : "#F3F6F9"}` }}
                    >
                        {getApiPiece(chipModal.flowId!, chipModal.apiName!)?.[`${chipModal?.stage}Chips`]?.length > 0
                            ? getApiPiece(chipModal.flowId!, chipModal.apiName!)?.[`${chipModal?.stage}Chips`]
                                .map((chip: any) => `{{${chip}}}`)
                                .join("\n")
                            : `// No chips available for the ${chipModal.stage} stage.`}
                    </SyntaxHighlighter>
                </div>
                <div className="flex justify-end mt-4">
                    <button
                        onClick={closeChipModal}
                        className={`px-4 py-2 rounded-md font-semibold ${darkMode ? "bg-primary-blue/90 text-white hover:opacity-95" : "bg-primary/90 text-white hover:opacity-95"
                            }`}
                    >
                        Close
                    </button>
                </div>
            </div>

        </ModalCustom>
    )
}

export default ModalRenderChips;