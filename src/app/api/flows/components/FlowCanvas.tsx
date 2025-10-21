import { Connector, FlowNode } from "@/types/types";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import FlowCard from "./FlowCard";


const FlowCanvas: React.FC<{
    flow: FlowNode[];
    onOpenNode: (id: string) => void;
    onChangeUrl: (id: string, url: string) => void;
    onRemoveNode: (id: string) => void;
    onSendFlow: () => void;
}> = ({ flow, onOpenNode, onChangeUrl, onRemoveNode, onSendFlow }) => {
    const containerRef = useRef<HTMLDivElement | null>(null);
    const cardRefs = useRef<(HTMLDivElement | null)[]>([]);
    const [connectors, setConnectors] = useState<Connector[]>([]);

    const setCardRef = (idx: number) => (el: HTMLDivElement | null) => {
        cardRefs.current[idx] = el;
    };

    const recalc = () => {
        const root = containerRef.current;
        if (!root) return;

        const rootRect = root.getBoundingClientRect();

        type Measured = {
            idx: number;
            left: number;
            right: number;
            top: number;
            midY: number;
            bottom: number;
        };

        const items: Measured[] = cardRefs.current
            .map((el, idx) => {
                if (!el) return null;
                const r = el.getBoundingClientRect();
                return {
                    idx,
                    left: r.left,
                    right: r.right,
                    top: r.top,
                    bottom: r.bottom,
                    midY: r.top + r.height / 2,
                };
            })
            .filter(Boolean) as Measured[];

        if (items.length < 2) {
            setConnectors([]);
            return;
        }

        items.sort((a, b) => {
            const topDiff = a.top - b.top;
            if (Math.abs(topDiff) > 20) return topDiff;
            return a.left - b.left;
        });

        const paths = [];
        for (let i = 0; i < items.length - 1; i++) {
            const a = items[i];
            const b = items[i + 1];

            const x1 = a.right - rootRect.left;
            const y1 = a.midY - rootRect.top;
            const x2 = b.left - rootRect.left - 8;
            const y2 = b.midY - rootRect.top;

            if (Math.abs(y1 - y2) < 20) {
                const midX = (x1 + x2) / 2;
                paths.push({ d: `M ${x1} ${y1} L ${midX} ${y1} L ${midX} ${y2} L ${x2} ${y2}` });
            } else {
                const midX1 = x1 + 30;
                const midX2 = x2 - 30;
                paths.push({
                    d: `M ${x1} ${y1} L ${midX2} ${y1} L ${midX2} ${y2} L ${x2} ${y2}`
                });
            }
        }

        setConnectors(paths);
    };


    useLayoutEffect(() => {
        recalc();

        const ro = new ResizeObserver(() => recalc());
        const root = containerRef.current;
        if (root) ro.observe(root);
        cardRefs.current.forEach((el) => el && ro.observe(el));

        const onResize = () => recalc();
        window.addEventListener("resize", onResize);

        return () => {
            ro.disconnect();
            window.removeEventListener("resize", onResize);
        };
    }, [flow.length]);

    useEffect(() => {
        const id = requestAnimationFrame(recalc);
        return () => cancelAnimationFrame(id);
    });

    return (
        <div className="w-full flex flex-col gap-4">
            <div
                ref={containerRef}
                className="relative flex items-start gap-6 flex-wrap"
            >
                {flow.map((n, i) => (
                    <div key={n.id} ref={setCardRef(i)} className="relative z-30">
                        <FlowCard
                            node={n}
                            onOpen={onOpenNode}
                            onChangeUrl={onChangeUrl}
                            onRemove={onRemoveNode}
                        />
                    </div>
                ))}

                <svg
                    className="pointer-events-none absolute inset-0 z-20"
                    width="100%"
                    height="100%"
                >
                    {connectors.map((c, i) => (
                        <path
                            key={`conn-${i}`}
                            d={c.d}
                            fill="none"
                            stroke="rgba(57,86,232,0.45)"
                            strokeWidth={2}
                            strokeLinecap="round"
                        />
                    ))}
                </svg>
            </div>

            <div className="self-end pb-2">
                <button
                    onClick={onSendFlow}
                    className="bg-primary-blue text-white px-5 py-2 rounded-md shadow hover:opacity-95"
                >
                    Send flow
                </button>
            </div>
        </div>
    );
};

export default FlowCanvas;