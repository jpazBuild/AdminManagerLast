import { ChevronDown } from "lucide-react"
import { useState } from "react";
import SyntaxHighlighter from "react-syntax-highlighter";
import { stackoverflowLight } from "react-syntax-highlighter/dist/esm/styles/hljs";


type CollectionMainProps = {
    response?: any;
    children: React.ReactNode;
}


const CollectionMain = ({response,children}:CollectionMainProps) => {
    const [isOpen, setIsOpen] = useState(false);
    return (
        <div className="flex h-full w-full flex-col gap-4 overflow-hidden">
            <div className="flex w-full h-full border border-primary/20 rounded-md bg-white shadow-sm justify-center overflow-y-auto">
              {children}
            </div>

            <div className={`flex border border-primary/20 rounded-md bg-white shadow-sm flex-col ${isOpen ? "h-full" : ""}`}>
                <button
                    onClick={() => setIsOpen(!isOpen)}
                    className="flex-shrink-0 w-full flex items-center justify-between px-4 py-3 text-sm font-medium text-slate-800 hover:bg-slate-50 border-b border-primary/10"
                >
                    <span>Response · JSON</span>
                    <ChevronDown
                        className={`h-4 w-4 transition-transform ${isOpen ? "rotate-180" : ""}`}
                    />
                </button>

                {isOpen && (
                    <div className="w-full h-full flex  p-4 overflow-y-auto text-sm bg-slate-50">
                        {response ? (
                            <SyntaxHighlighter
                                language="json"
                                style={stackoverflowLight}
                                showLineNumbers
                                wrapLongLines
                                customStyle={{
                                    margin: 0,
                                    padding: "12px 16px",
                                    borderRadius: "0 0 0.375rem 0.375rem",
                                    background: "#ffffff",
                                    fontSize: "0.9rem",
                                    width: "100%",
                                    height: "100%",
                                }}
                                lineNumberStyle={{
                                    minWidth: "2ch",
                                    paddingRight: "12px",
                                    color: "#9AA0A6",
                                    userSelect: "none",
                                }}

                            >
                                {response}
                            </SyntaxHighlighter>
                        ) : (
                            <div className="w-full h-full flex flex-col items-center justify-center text-slate-400">
                                <span className="text-4xl mb-2">&lt;/&gt;</span>
                                <p>API response are shown here</p>
                            </div>
                        )}
                    </div>
                )

                }


            </div>
        </div>
    )
}

export default CollectionMain;