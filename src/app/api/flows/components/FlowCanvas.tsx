import { Connector, FlowNode, User } from "@/types/types";
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import FlowCard from "./FlowCard";
import { Tag } from "../../hooks/useTags";
import axios from "axios";
import { URL_API_ALB } from "@/config";
import { toast } from "sonner";
import ModalCreateFlow from "./ModalCreateFlow";


type Props = {
    flow: FlowNode[];
    onOpenNode: (id: string) => void;
    onChangeUrl: (id: string, url: string) => void;
    onRemoveNode: (id: string) => void;
    onSendFlow: () => void;
    onCreateFlow?: () => void;
    openModalCreate: boolean;
    onCloseModalCreate?: () => void;
    setModalCreate: (open: boolean) => void;
    environment: any | null;
    refetchFlows: () => void;
    setCreateNewFlowOpen?: (open: boolean) => void;
    iterationData?: any;
};


type VisualNode = FlowNode & {
    _metaType?: "environment" | "iteration";
    _readonly?: boolean;
    _subtitle?: string;
};


type recalcParams = {
    setConnectors: (connectors: Connector[]) => void;
    containerRef: any;
    cardRefs: React.RefObject<(HTMLDivElement | null)[]>;
};


const recalc = ({ setConnectors, containerRef, cardRefs }: recalcParams) => {
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
                midY: r.top + r.height / 2
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

    const paths: Connector[] = [];
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
            const midX2 = x2 - 30;
            paths.push({ d: `M ${x1} ${y1} L ${midX2} ${y1} L ${midX2} ${y2} L ${x2} ${y2}` });
        }
    }

    setConnectors(paths);
};

type IterationRow = {
  iterationCount: number;
  id: string;
  createdBy: string;
  iterationData: Record<string, any>;
  order: number;
  apisScriptsName: string;
};

function formatIterationDataAll(
  rows: IterationRow[]
): { iterationData: Record<string, Record<string, any>> } {
  const sorted = [...rows].sort((a, b) => a.order - b.order);

  const out: Record<string, Record<string, any>> = {};
  for (const r of sorted) {
    out[`iteration${r.order}`] = r.iterationData ?? {};
  }

  return { iterationData: out };
}

const FlowCanvas: React.FC<Props> = ({
    flow,
    onOpenNode,
    onChangeUrl,
    onRemoveNode,
    onSendFlow,
    onCreateFlow,
    openModalCreate,
    onCloseModalCreate,
    setModalCreate,
    environment,
    refetchFlows,
    setCreateNewFlowOpen,
    iterationData
}) => {
    const containerRef = useRef<HTMLDivElement | null>(null);
    const cardRefs = useRef<(HTMLDivElement | null)[]>([]);
    const [connectors, setConnectors] = useState<Connector[]>([]);

    const setCardRef = (idx: number) => (el: HTMLDivElement | null) => {
        cardRefs.current[idx] = el;
    };
    const [saving, setSaving] = useState(false);

    const [tags, setTags] = useState<Tag[]>([]);
    const [loadingTags, setLoadingTags] = useState<boolean>(false);
    const [users, setUsers] = useState<any[]>([]);
    const [loadingUsers, setLoadingUsers] = useState<boolean>(false);
    const [nameFlow, setNameFlow] = useState<string>("");
    const [descriptionFlow, setDescriptionFlow] = useState<string>("");
    const [selectedTags, setSelectedTags] = useState<any>([]);
    const [selectedUser, setSelectedUser] = useState<any>(null);


    const isPlainObject = (v: any) => v && typeof v === "object" && !Array.isArray(v);
    const isEmptyObject = (v: any) => isPlainObject(v) && Object.keys(v).length === 0;


    const fetchTags = async () => {
        try {
            setLoadingTags(true);
            const response = await axios.post(`${URL_API_ALB}tags`, {});
            setTags(Array.isArray(response.data) ? (response.data as Tag[]) : []);
        } catch (error) {
            console.error("Error fetching tags:", error);
            toast.error("Error fetching tags");
        } finally {
            setLoadingTags(false);
        }
    };


    const fetchUsers = async () => {
        try {
            setLoadingUsers(true);
            const res = await axios.post(`${URL_API_ALB}users`, {});
            setUsers(Array.isArray(res.data) ? (res.data as User[]) : []);
        } catch (err) {
            console.error("Error fetching users:", err);
            toast.error("Error fetching users");
        } finally {
            setLoadingUsers(false);
        }
    };

    useEffect(() => {
        fetchTags();
        fetchUsers();
    }, []);

    const hasEnv = useMemo(() => {
        if (environment == null) return false;
        if (isEmptyObject(environment)) return false;
        return true;
    }, [environment]);

    const visibleFlow: VisualNode[] = useMemo(() => {
        const nodes: VisualNode[] = [];

        nodes.push(...(flow as VisualNode[]));

        return nodes;
    }, [flow, environment, hasEnv, iterationData]);

    useLayoutEffect(() => {
        recalc({ setConnectors, containerRef, cardRefs });
        const ro = new ResizeObserver(() => recalc({ setConnectors, containerRef, cardRefs }));
        const root = containerRef.current;
        if (root) ro.observe(root);

        cardRefs.current.forEach((el) => el && ro.observe(el));

        const onResize = () => recalc({ setConnectors, containerRef, cardRefs });
        window.addEventListener("resize", onResize);

        return () => {
            ro.disconnect();
            window.removeEventListener("resize", onResize);
        };
    }, [visibleFlow.length]);

    useEffect(() => {
        const id = requestAnimationFrame(() => {
            recalc({ setConnectors, containerRef, cardRefs });
        });
        return () => cancelAnimationFrame(id);
    }, [flow.length]);

    const handleAccordionToggle = () => {
        onCloseModalCreate?.();
    };




    const handleSaveTest = async () => {
        if (!hasEnv) {
            toast.error("No environment selected");
            return;
        }
        if (!Object.keys(environment || {}).length) {
            toast.error("No environment selected");
            return;
        }

        if (!nameFlow.trim()) {
            toast.error("Please enter a flow name");
            return;
        }
        if (!selectedUser) {
            toast.error("Please select a user (createdBy)");
            return;
        }

        const selectedUserName = users.find((u) => u.id === selectedUser)?.name || "Unknown";

        const iterationDataResponse: any =
            await (async () => {
                if (!iterationData) return null;
                try {
                    const { data } = await axios.post(`${URL_API_ALB}iterationData`, { id: iterationData?.id });
                    const rows = data?.iterationData ?? [];                    
                    return formatIterationDataAll(rows);
                } catch {
                    toast.error("No se pudo obtener el Iteration Data");
                    return null;
                }
            })();

        const apisList = flow.map(node => node.rawNode);
        
        const payload = {
            tagNames: [selectedTags],
            name: nameFlow,
            description: descriptionFlow,
            action: "runApis" as const,
            apis: apisList,
            collection: {
                item: apisList
            },
            createdBy: selectedUserName,
            temp: false,
            env: environment || {},
            iterationData: iterationDataResponse?.iterationData
        };

        if(iterationDataResponse == null) {
            delete payload.iterationData;
        }
        console.log("payload to save:", payload);

        try {
            setSaving(true);
            const { status, data } = await axios.put(`${URL_API_ALB}apisScripts`, payload);
            const ok = (data?.status ?? status) === 200 || status === 204;
            if (!ok) throw new Error("Failed to save test");
            toast.success("Test saved");
            onCloseModalCreate?.();
            setCreateNewFlowOpen?.(false);
            refetchFlows();
        } catch (err) {
            console.error(err);
            toast.error("Failed to save test");
        } finally {
            setSaving(false);
        }
    };


    const userOptions = useMemo(
        () => (users || []).map((u) => ({ label: u.name, value: u.id })),
        [users]
    );

    const tagsOptions = useMemo(
        () => (tags || []).map((t) => ({ label: t.name, value: t.id })),
        [tags]
    );



    return (
        <div className="w-full flex flex-col gap-4">
            <div ref={containerRef} className="relative flex items-start gap-6 flex-wrap">
                {visibleFlow.map((n, i) => (
                    <div key={n.id} ref={setCardRef(i)} className="relative z-30">
                        <FlowCard
                            node={n}
                            onOpen={onOpenNode}
                            onChangeUrl={onChangeUrl}
                            onRemove={onRemoveNode}
                        />
                    </div>
                ))}

                <svg className="pointer-events-none absolute inset-0 z-20" width="100%" height="100%">
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

            <div className="self-end flex gap-2 items-center pb-2">
                <button
                    onClick={() => setModalCreate(true)}
                    className={`border-primary-blue cursor-pointer text-primary/80 border-2 font-semibold px-5 py-2 rounded-2xl shadow-md
                        `}
                >
                    Save Flow
                </button>
                <button
                    onClick={onSendFlow}
                    className={`bg-primary-blue cursor-pointer border-primary-blue border-2 font-semibold text-white px-5 py-2 rounded-2xl shadow-md `}
                >
                    Run Flow
                </button>
            </div>

            {openModalCreate && environment && (
                <ModalCreateFlow
                    open={openModalCreate}
                    onClose={onCloseModalCreate}
                    saving={saving}
                    nameFlow={nameFlow}
                    setNameFlow={setNameFlow}
                    descriptionFlow={descriptionFlow}
                    setDescriptionFlow={setDescriptionFlow}
                    selectedTags={selectedTags}
                    setSelectedTags={setSelectedTags}
                    tagsOptions={tagsOptions}
                    selectedUser={selectedUser}
                    setSelectedUser={setSelectedUser}
                    userOptions={userOptions}
                    loadingTags={loadingTags}
                    loadingUsers={loadingUsers}
                    onSave={handleSaveTest}
                />
            )}
        </div>
    );
};

export default FlowCanvas;