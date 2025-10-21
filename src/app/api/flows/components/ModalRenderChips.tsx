import { ModalTab } from "@/types/types";
import Modal from "./Modal";
import SyntaxHighlighter from "react-syntax-highlighter";
import { stackoverflowLight } from "react-syntax-highlighter/dist/esm/styles/hljs";

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
};


const ModalRenderChips = ({chipModal,getApiPiece,stateLabel,setChipModal,closeChipModal}:ModalRenderChipsProps) => {

    return (
        <Modal
            open={chipModal.open}
            onClose={closeChipModal}
            title={
                chipModal.stage === "pre"
                    ? "Pre-request"
                    : chipModal.stage === "post"
                        ? "Post-response"
                        : "Request"
            }
        >
            {(() => {
                if (!chipModal.flowId || !chipModal.apiName) return null;
                const piece = getApiPiece(chipModal.flowId, chipModal.apiName);
                const req = piece?.request;
                const test = piece?.test;

                const detailReq = req?.detail ?? {};
                const detailTest = test?.detail ?? {};

                const envObj =
                    chipModal.stage === "request"
                        ? detailReq?.env
                        : chipModal.stage === "post"
                            ? detailTest?.env
                            : undefined;

                const meta = chipModal.stage === "request"
                    ? {
                        Name: piece?.name ?? "—",
                        Status: typeof req?.status === "number" ? String(req.status) : "—",
                        Type: "request",
                        Success: stateLabel(req?.success),
                    }
                    : chipModal.stage === "post"
                        ? {
                            Name: piece?.name ?? "—",
                            Status: "—",
                            Type: "script(test)",
                            Success: stateLabel(test?.success),
                        }
                        : {
                            Name: piece?.name ?? "—",
                            Status: "—",
                            Type: "pre-request",
                            Success: "Pending/No data",
                        };

                const TabBtnSmall: React.FC<{ k: ModalTab; label: string }> = ({ k, label }) => (
                    <button
                        onClick={() => setChipModal(prev => ({ ...prev, tab: k }))}
                        className={`px-3 py-2 text-sm border-b-2 ${chipModal.tab === k ? "border-primary-blue text-slate-800" : "border-transparent text-slate-500"
                            }`}
                    >
                        {label}
                    </button>
                );

                const J = ({ obj }: { obj: any }) => (

                    <SyntaxHighlighter
                        language="json"
                        style={stackoverflowLight}
                        customStyle={{
                            backgroundColor: "transparent",
                            padding: "0",
                            margin: "0",
                            fontSize: 12,
                            lineHeight: "16px",
                        }}
                    >
                        {JSON.stringify(obj ?? {}, null, 2)}
                    </SyntaxHighlighter>
                );

                const errorFromReq = detailReq?.response?.error || detailReq?.error;
                const errorFromTest = detailTest?.error || detailTest?.__error;

                const errorData =
                    chipModal.stage === "request" ? errorFromReq : chipModal.stage === "post" ? errorFromTest : null;

                const metadataBlock = (
                    <div className="space-y-3">
                        {Object.entries(meta).map(([k, v]) => (
                            <div key={k}>
                                <div className="text-xs text-slate-500">{k}</div>
                                <div className="mt-1 rounded bg-slate-100 text-[13px] px-3 py-2">{String(v)}</div>
                            </div>
                        ))}
                        {chipModal.stage === "request" && (
                            <>
                                <div>
                                    <div className="text-xs text-slate-500">Request</div>
                                    <J obj={detailReq?.request} />
                                </div>
                                <div>
                                    <div className="text-xs text-slate-500">Response</div>
                                    <J obj={detailReq?.response} />
                                </div>
                            </>
                        )}
                        {chipModal.stage === "post" && (
                            <>
                                <div>
                                    <div className="text-xs text-slate-500">Script payload</div>
                                    <J obj={detailTest} />
                                </div>
                            </>
                        )}
                    </div>
                );

                const errorBlock = (
                    <div>
                        {errorData ? <J obj={errorData} /> : <div className="text-sm text-slate-500">No errors</div>}
                    </div>
                );

                const environmentBlock = <J obj={envObj} />;

                return (
                    <div>
                        <div className="flex items-center gap-4 border-b border-primary/20 mb-4">
                            <TabBtnSmall k="metadata" label="Metadata" />
                            <TabBtnSmall k="error" label="Error" />
                            <TabBtnSmall k="environment" label="Environment" />
                        </div>

                        {chipModal.tab === "metadata" && metadataBlock}
                        {chipModal.tab === "error" && errorBlock}
                        {chipModal.tab === "environment" && environmentBlock}
                    </div>
                );
            })()}
        </Modal>
    )
}

export default ModalRenderChips;