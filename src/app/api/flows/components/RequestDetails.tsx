import TextInputWithClearButton from "@/app/components/InputClear";
import { FlowNode } from "@/types/types";
import { ArrowLeft } from "lucide-react";
import { useState } from "react";
import { httpMethodsStyle } from "../../utils/colorMethods";
import CodeBox from "./CodeBox";
import TabBtn from "./TabBtn";

const RequestDetails: React.FC<{
    node: FlowNode;
    onBack: () => void;
    onUpdateNode: (patch: Partial<FlowNode>) => void;
}> = ({ node, onBack, onUpdateNode }) => {
    const [tab, setTab] = useState<"pre" | "request" | "post" | "headers" | "body" | "gqlvars">("body");

    const bodyRaw =
        node.rawNode?.request?.body?.mode === "graphql"
            ? node.rawNode?.request?.body?.graphql?.query ?? "{}"
            : node.rawNode?.request?.body?.raw ?? "{}";

    const gqlVars =
        node.rawNode?.request?.body?.mode === "graphql"
            ? node.rawNode?.request?.body?.graphql?.variables ?? "{}"
            : "{}";

    const headers =
        (node.rawNode?.request?.header ?? [])
            .map((h: any) => `${h?.key ?? ""}: ${h?.value ?? ""}`)
            .join("\n") || "// No headers";

    return (
        <div className="flex-1 flex flex-col gap-4">
            <div className="rounded-lg border border-primary/20 bg-white shadow-sm p-4">
                <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                        <button onClick={onBack} className="text-sm text-primary/80 hover:underline">
                            <ArrowLeft className="w-6 h-6 mr-1" />
                        </button>
                        <span className={`${httpMethodsStyle(node.method)}`}>{node.method}</span>

                        <h2 className="font-semibold text-primary/85">{node.name}</h2>
                    </div>

                </div>
                <TextInputWithClearButton
                    id="request-url"
                    value={node.url}
                    onChangeHandler={(e) => onUpdateNode({ url: e.target.value })}
                    placeholder="Enter request URL"
                />

                <div className="flex items-center gap-2 mt-4">
                    <TabBtn active={tab === "pre"} onClick={() => setTab("pre")}>
                        Pre-request
                    </TabBtn>
                    <TabBtn active={tab === "request"} onClick={() => setTab("request")}>
                        Request
                    </TabBtn>
                    <TabBtn active={tab === "post"} onClick={() => setTab("post")}>
                        Post-response
                    </TabBtn>
                    <TabBtn active={tab === "headers"} onClick={() => setTab("headers")}>
                        Headers
                    </TabBtn>
                    <TabBtn active={tab === "body"} onClick={() => setTab("body")}>
                        Body
                    </TabBtn>
                </div>

                <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-4">
                    {tab === "headers" && (
                        <>
                            <div className="md:col-span-2">
                                <CodeBox value={headers} />
                            </div>
                        </>
                    )}

                    {tab === "body" && (
                        <>
                            <CodeBox value={typeof bodyRaw === "string" ? bodyRaw : JSON.stringify(bodyRaw, null, 2)} />
                            <CodeBox value={typeof gqlVars === "string" ? gqlVars : JSON.stringify(gqlVars, null, 2)} />
                        </>
                    )}

                    {tab === "gqlvars" && (
                        <>
                            <div className="md:col-span-2">
                                <CodeBox value={typeof gqlVars === "string" ? gqlVars : JSON.stringify(gqlVars, null, 2)} />
                            </div>
                        </>
                    )}

                    {tab === "pre" && (
                        <div className="md:col-span-2">
                            <CodeBox value={"// Pre-request script"} />
                        </div>
                    )}

                    {tab === "request" && (
                        <div className="md:col-span-2">
                            <CodeBox value={JSON.stringify(node.rawNode?.request ?? {}, null, 2)} />
                        </div>
                    )}

                    {tab === "post" && (
                        <div className="md:col-span-2">
                            <CodeBox value={"// Post-response script"} />
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default RequestDetails;