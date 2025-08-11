"use client";
import { useEffect, useState } from "react";
import axios from "axios";
import {
    Tabs, TabsList, TabsTrigger, TabsContent,
} from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
    CheckCheck,
    CheckCircle,
    ChevronDown, ChevronRight, FolderArchiveIcon, PlayIcon,
    Trash2Icon, WorkflowIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { DashboardHeader } from "../Layouts/main";
import { URL_API_ALB, URL_API_RUNNER } from "@/config";
import { toast } from "sonner";
import { FaRegCircleXmark } from "react-icons/fa6";
import TextInputWithClearButton from "../components/InputClear";

type PostmanCollection = { id: string; name: string; uid: string };
type PostmanEnvironment = { id: string; name: string; uid: string };
type PostmanWorkspace = {
    id: string;
    name: string;
    collections?: PostmanCollection[];
    environments?: PostmanEnvironment[];
};
type PostmanTeam = {
    teamId: number;
    teamName: string;
    teamDomain: string;
    workspaces: PostmanWorkspace[];
};

const ApiFlowBuilder = () => {
    const [collections, setCollections] = useState<any[]>([]);
    const [flows, setFlows] = useState<any[]>([{ name: "Flow 1", apis: [] }]);
    const [selectedFlow, setSelectedFlow] = useState(0);
    const [response, setResponse] = useState<Record<number, any>>({});
    const [expandedCollection, setExpandedCollection] = useState<number | null>(null);
    const [expandedFolders, setExpandedFolders] = useState<Record<string, boolean>>({});
    const [allTeams, setAllTeams] = useState<PostmanTeam[]>([]);
    const [expandedTeams, setExpandedTeams] = useState<Record<number, boolean>>({});
    const [expandedWorkspaces, setExpandedWorkspaces] = useState<Record<string, boolean>>({});
    const [expandedCards, setExpandedCards] = useState<Record<number, boolean>>({});

    const [selectedEnv, setSelectedEnv] = useState<any | null>(null);            // NEW
    const [selectedCollection, setSelectedCollection] = useState<any | null>(null); // NEW
    const [wsMessages, setWsMessages] = useState<any[]>([]);
    const [ws, setWs] = useState<WebSocket | null>(null);

    useEffect(() => {
        return () => {
            if (ws) ws.close();
        };
    }, [selectedFlow, selectedCollection]);

    useEffect(() => {
        const fetchPostmanElements = async () => {
            const response = await axios.get(`${URL_API_ALB}getPostmanElements`)
            setAllTeams(response?.data.teams as PostmanTeam[])
        };
        fetchPostmanElements();
    }, []);

    useEffect(() => {
        const handleBeforeUnload = (event: BeforeUnloadEvent): void => {
            event.preventDefault();
            event.returnValue = "";
        };
        window.addEventListener("beforeunload", handleBeforeUnload);
        return (): void => window.removeEventListener("beforeunload", handleBeforeUnload);
    }, []);

    const addToFlow = (api: any) => {
        const up = [...flows];
        up[selectedFlow].apis.push({ ...api });
        setFlows(up);
    };

    const removeFromFlow = (i: number) => {
        const up = [...flows];
        up[selectedFlow].apis.splice(i, 1);
        setFlows(up);
        const r = { ...response }; delete r[i]; setResponse(r);
    };

    const updateFlowField = (i: number, field: string, value: any) => {
        const up = [...flows];
        const api = up[selectedFlow].apis[i];
        switch (field) {
            case "url": api.request.url.raw = value; break;
            case "headers": api.request.header = value; break;
            case "query": api.request.body.graphql.query = value; break;
            case "variables": api.request.body.graphql.variables = value; break;
            case "prerequest":
            case "test": {
                const ev = api.event?.find((e: any) => e.listen === field);
                if (ev?.script) ev.script.exec = value.split("\n");
                break;
            }
        }
        setFlows(up);
    };

    const fetchEnvironment = async (teamId: number, envUid: string, name: string) => {
        try {
            const { data } = await axios.post(`${URL_API_ALB}getPostmanEnvironment`, {
                teamId, environmentUid: envUid,
            });
            setSelectedEnv({ name, ...data })
        } catch (e) {
            console.error("Error loading env", e);
        }
    };



    const handleRunApis = () => {
        if (!selectedEnv || !selectedCollection) {
            alert("Select a collection and an environment first");
            return;
        }

        const env: Record<string, any> = {};

        selectedEnv?.values.forEach((v: any) => {
            if (v.enabled) {
                env[v.key] = v.value;
            }
        });

        const payload = {
            action: "runApis",
            id: "runApis Inline",
            apis: flows[selectedFlow].apis,
            env
        };

        if (!URL_API_RUNNER) {
            alert("WebSocket URL is not defined.");
            return;
        }

        const socket = new WebSocket(URL_API_RUNNER);

        socket.onopen = () => {
            socket.send(JSON.stringify(payload));

            setWsMessages([{ type: "info", message: "✅ Flow sent via WebSocket." }]);
        };

        socket.onmessage = (event) => {
            try {
                const message = JSON.parse(event.data);
                const { response, routeKey, connectionId, testCaseId } = message;
                console.log("WebSocket message received:", message);

                setWsMessages((prev) => [...prev, { ...message }]);

            } catch (err) {
                console.log("Invalid WebSocket message:", event.data);
                setWsMessages((prev) => [...prev, {
                    type: "error",
                    raw: event.data,
                    message: "Error parsing message."
                }]);
            }
        };

        socket.onerror = (err) => {
            console.log("WebSocket error:", err);
            setWsMessages((prev) => [...prev, { type: "error", message: "WebSocket error." }]);
        };

        socket.onclose = (event) => {
            const isTooBig = event.code === 1009;
            const message = isTooBig
                ? "🚫 WebSocket closed (code 1009): Payload too large. AWS limit is 32KB. Try sending fewer APIs or reduce data size."
                : `🛑 WebSocket closed (code ${event.code}): ${event.reason || "No reason provided by AWS."}`;

            toast.error(message)
            setWsMessages((prev) => [
                ...prev,
                {
                    type: isTooBig ? "error" : "info",
                    message,
                    raw: JSON.stringify({ code: event.code, reason: event.reason, wasClean: event.wasClean }),
                }
            ]);
        };

        setWs(socket);
    };



    const executeApi = async (api: any, idx: number) => {
        try {
            const headers = (api.request.header || []).reduce(
                (acc: any, h: any) => ({ ...acc, [h.key]: h.value }), {},
            );
            const body =
                api.request.body?.mode === "graphql"
                    ? {
                        query: api.request.body.graphql.query,
                        variables: JSON.parse(api.request.body.graphql.variables || "{}")
                    }
                    : api.request.body?.mode === "raw"
                        ? api.request.body.raw
                        : undefined;
            const res = await axios({ method: api.request.method, url: api.request.url.raw, headers, data: body });
            setResponse((p) => ({ ...p, [idx]: res.data }));
        } catch (e: any) { setResponse((p) => ({ ...p, [idx]: e.message })); }
    };

    const renderApiItem = (api: any, lvl = 0, path = "") => {
        const curPath = `${path}/${api.name}`;
        const padding = `pl-${Math.min(lvl * 4, 12)}`;
        if (api.item && Array.isArray(api.item))
            return (
                <div key={curPath} className="mt-2">
                    <button
                        onClick={() => setExpandedFolders((p) => ({ ...p, [curPath]: !p[curPath] }))}
                        className="flex cursor-pointer items-center gap-2 text-left text-sm font-medium hover:bg-muted p-2 rounded-md transition break-words"
                    >
                        {expandedFolders[curPath] ? <ChevronDown /> : <ChevronRight />}
                        <FolderArchiveIcon className="w-4 h-4" /> {api.name}
                    </button>
                    {expandedFolders[curPath] && (
                        <div className="">
                            {api.item.map((c: any) => renderApiItem(c, lvl + 1, curPath))}
                        </div>
                    )}
                </div>
            );

        return (
            <div
                key={curPath}
                onClick={() => addToFlow(api)}
                className={cn("cursor-pointer flex items-center gap-2 text-sm hover:bg-primary/10 rounded p-2 mt-1", padding)}
            >
                <MethodBadge method={api?.request?.method} />
                <span className="break-words">{api.name}</span>
            </div>
        );
    };

    const MethodBadge = ({ method }: { method: string }) => {
        const style =
            {
                GET: "bg-green-100 text-green-800", POST: "bg-blue-100 text-blue-800",
                PUT: "bg-yellow-100 text-yellow-800", DELETE: "bg-red-100 text-red-800",
            }[method?.toUpperCase()] || "bg-gray-100 text-gray-800";
        return <Badge variant="outline" className={cn("text-xs px-2 py-0.5 rounded", style)}>{method?.toUpperCase()}</Badge>;
    };

    return (
        <DashboardHeader>
            <div className="flex min-h-screen text-primary">
                <aside className="border-r border-primary/20 bg-white shadow min-h-screen sticky top-0">
                    <div className="p-4">
                        <Tabs defaultValue="collections" className="w-full pt-2">
                            <TabsList className="grid grid-cols-4 mb-2 text-primary/80">
                                <TabsTrigger value="collections">Collections</TabsTrigger>
                                <TabsTrigger value="teams">Teams</TabsTrigger>
                                <TabsTrigger value="envs">ENVs</TabsTrigger>
                                <TabsTrigger value="flows">Flows</TabsTrigger>
                            </TabsList>

                            <TabsContent value="collections">
                                <ScrollArea className="p-2">
                                    {collections.map((col, i) => (
                                        <div key={i} className="mb-1">
                                            <button
                                                onClick={() => setExpandedCollection(expandedCollection === i ? null : i)}
                                                className="w-full cursor-pointer flex justify-between items-center gap-2 text-sm font-semibold hover:bg-muted p-2 rounded-md"
                                            >
                                                <div className="flex items-center gap-2">
                                                    {expandedCollection === i ? <ChevronDown /> : <ChevronRight />}
                                                    {col.name || col.info?.name || "Unnamed Collection"}
                                                </div>
                                                {selectedCollection?.info?._postman_id === col.info?._postman_id && (
                                                    <div className="flex justify-between items-center gap-1 text-xs text-green-600">
                                                        <p>active</p>
                                                        <span className="bg-primary/90 rounded-full w-2 h-2"></span>
                                                    </div>
                                                )}
                                            </button>
                                            {expandedCollection === i && (
                                                <div className="">
                                                    {col.item.map((api: any) => renderApiItem(api, 0, `${i}`))}
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </ScrollArea>
                            </TabsContent>

                            <TabsContent value="teams">
                                <ScrollArea className="h-[calc(100vh-130px)] p-2">
                                    {allTeams.map((team) => (
                                        <div key={team.teamId} className="mb-2">
                                            <button
                                                onClick={() => setExpandedTeams((p) => ({ ...p, [team.teamId]: !p[team.teamId] }))}
                                                className="w-full cursor-pointer flex items-center gap-2 text-sm font-semibold hover:bg-muted p-2 rounded-md"
                                            >
                                                {expandedTeams[team.teamId] ? <ChevronDown /> : <ChevronRight />}
                                                {team.teamName}
                                            </button>

                                            {expandedTeams[team.teamId] && team.workspaces.map((ws) => {
                                                const wsKey = `${team.teamId}-${ws.id}`;
                                                return (
                                                    <div key={ws.id} className="ml-3 mt-1">
                                                        <button
                                                            onClick={() => setExpandedWorkspaces((p) => ({ ...p, [wsKey]: !p[wsKey] }))}
                                                            className="w-full cursor-pointer flex items-center gap-2 text-sm font-medium hover:bg-muted/50 p-2 rounded-md"
                                                        >
                                                            {expandedWorkspaces[wsKey] ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                                                            <WorkflowIcon className="w-4 h-4" /> {ws.name}
                                                        </button>

                                                        {expandedWorkspaces[wsKey] && (
                                                            <div className="ml-4 mt-1 space-y-1">
                                                                {ws.collections?.length && (
                                                                    <>
                                                                        <p className="text-xs font-semibold text-muted-foreground">Collections:</p>
                                                                        {ws.collections.map((c) => (
                                                                            <div
                                                                                key={c.id}
                                                                                className="cursor-pointer flex items-center gap-2 text-xs hover:bg-primary/10 rounded p-1 pl-2"
                                                                                onClick={async () => {
                                                                                    const { data } = await axios.post(`${URL_API_ALB}getPostmanCollection`,
                                                                                        { teamId: team.teamId, collectionUid: c.uid });
                                                                                    if (data?.item) {
                                                                                        setCollections((prev) => [...prev, { ...data }]);
                                                                                        setSelectedCollection(data);  // NEW
                                                                                        setExpandedCollection(collections.length);
                                                                                    }
                                                                                }}
                                                                            >
                                                                                <FolderArchiveIcon className="w-3 h-3" /> {c.name}
                                                                            </div>
                                                                        ))}
                                                                    </>
                                                                )}

                                                                {ws.environments?.length && (
                                                                    <>
                                                                        <p className="text-xs font-semibold text-muted-foreground mt-2">Environments:</p>
                                                                        {ws.environments.map((e) => (
                                                                            <div
                                                                                key={e.id}
                                                                                className="text-xs cursor-pointer justify-between hover:bg-primary/10 rounded p-1 pl-2 flex items-center gap-1"
                                                                                onClick={() => fetchEnvironment(team.teamId, e.uid, e.name)}
                                                                            >
                                                                                🌐 {e.name}
                                                                                {selectedEnv?.id === e.id && (
                                                                                    <div className="flex justify-between items-center gap-1 text-xs text-green-600">
                                                                                        <p>active</p>
                                                                                        <span className="bg-primary/90 rounded-full w-2 h-2"></span>
                                                                                    </div>
                                                                                )}
                                                                            </div>
                                                                        ))}
                                                                    </>
                                                                )}
                                                            </div>
                                                        )}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    ))}
                                </ScrollArea>
                            </TabsContent>

                            <TabsContent value="envs" className="h-full">
                                <div className="text-xs text-muted-foreground h-full flex flex-col">
                                    {selectedEnv ? (
                                        <>
                                            <p className="font-semibold text-primary mb-2">Current Environment:</p>
                                            <div className="space-y-2 pr-1 overflow-y-auto max-h-[calc(100vh-150px)]">
                                                {selectedEnv.values.map((env: any) => (
                                                    <div
                                                        key={env.key}
                                                        className="flex items-center gap-2 bg-white p-2 rounded border border-primary/20 shadow-sm hover:bg-primary/10 transition-colors"
                                                    >
                                                        <div className="flex flex-col gap-1 w-full">
                                                            <TextInputWithClearButton
                                                                id={`key-${env.key}`}
                                                                value={env.key}
                                                                placeholder={`Enter key for ${env.key}`}
                                                                defaultValue={env.key}
                                                                readOnly={true}
                                                            />
                                                            <TextInputWithClearButton
                                                                id={`Value-${env.value}`}
                                                                value={env.value}
                                                                placeholder={`Enter key for ${env.value}`}
                                                                defaultValue={env.value}
                                                                readOnly={true}
                                                            />

                                                        </div>
                                                        <label className="flex items-center gap-1 text-xs w-1/6 justify-end">
                                                            <input
                                                                type="checkbox"
                                                                defaultChecked={env.enabled}
                                                                className="accent-primary"
                                                            />
                                                        </label>
                                                    </div>
                                                ))}
                                            </div>
                                        </>
                                    ) : (
                                        <p>No environment selected.</p>
                                    )}
                                </div>
                            </TabsContent>


                            <TabsContent value="flows">
                                <p className="p-2 text-muted-foreground italic">Coming soon…</p>
                            </TabsContent>
                        </Tabs>
                    </div>
                </aside>

                <main className="flex-1 p-8 overflow-y-auto">
                    <div className="flex justify-between items-center mb-6">
                        <h1 className="text-3xl font-bold text-primary">Build Your API Flow</h1>
                        <div className="flex gap-2">
                            <Button onClick={handleRunApis} className="text-white cursor-pointer" disabled={!selectedEnv || !selectedCollection}>
                                <WorkflowIcon className="w-4 h-4" /> Send Flow
                            </Button>
                        </div>
                    </div>

                    <Tabs defaultValue="flow">
                        <TabsList className="mb-4">
                            <TabsTrigger value="flow">Flow Editor</TabsTrigger>
                            <TabsTrigger value="results">Execution Results</TabsTrigger>
                        </TabsList>

                        <TabsContent value="flow">
                            {flows[selectedFlow].apis.length === 0 ? (
                                <p className="text-muted-foreground">No APIs added yet.</p>
                            ) : (
                                <div className="space-y-4">
                                    {flows[selectedFlow].apis.map((api: any, idx: number) => (
                                        <Card key={idx} className="bg-white shadow-sm">
                                            <CardContent className="p-4">
                                                <div
                                                    onClick={() => setExpandedCards((p) => ({ ...p, [idx]: !p[idx] }))}
                                                    className="flex justify-between items-center cursor-pointer hover:bg-muted/20 p-2 rounded-md"
                                                >

                                                    <div className="flex items-center gap-2">
                                                        {expandedCards[idx] ? <ChevronDown /> : <ChevronRight />}
                                                        <MethodBadge method={api?.request?.method} />
                                                        <span className="font-semibold">{api.name}</span>
                                                        

                                                        
                                                    </div>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={(e) => { e.stopPropagation(); removeFromFlow(idx); }}
                                                        className="text-primary/50 hover:text-primary/60"
                                                    >
                                                        <Trash2Icon className="w-4 h-4" />
                                                    </Button>
                                                </div>

                                                {expandedCards[idx] && (
                                                    <>
                                                        <div className="flex items-center gap-2 mt-2">
                                                            <TextInputWithClearButton
                                                                id={`url-${idx}`}
                                                                value={api?.request?.url?.raw}
                                                                placeholder="Enter request URL"
                                                                defaultValue={api.request.url.raw}
                                                                onChangeHandler={(e) => updateFlowField(idx, "url", e.target.value)}
                                                                className="text-[14px]"
                                                                readOnly={false}
                                                            />
                                                            <Button variant="outline" className="cursor-pointer bg-primary/90 text-white font-semibold" size="icon" onClick={() => executeApi(api, idx)}>
                                                                <PlayIcon className="w-4 h-4" />
                                                            </Button>
                                                        </div>

                                                        <Tabs defaultValue="request" className="w-full">
                                                            <TabsList className="flex text-primary/70 gap-2">
                                                                <TabsTrigger value="headers">Headers</TabsTrigger>
                                                                <TabsTrigger value="prerequest">Pre‑Request</TabsTrigger>
                                                                <TabsTrigger value="request">Request</TabsTrigger>
                                                                <TabsTrigger value="response">Response</TabsTrigger>
                                                                <TabsTrigger value="test">Test</TabsTrigger>
                                                            </TabsList>

                                                            <TabsContent value="headers" className="mt-4">
                                                                <div className="space-y-2">
                                                                    {(api.request.header || []).map(
                                                                        (h: any, hIdx: number) => (
                                                                            <div key={hIdx} className="flex items-center gap-2">
                                                                                <TextInputWithClearButton
                                                                                    id={`header-key-${idx}-${hIdx}`}
                                                                                    value={h.key}
                                                                                    placeholder="Header Key"
                                                                                    defaultValue={h.key}
                                                                                    onChangeHandler={(e) => {
                                                                                        const up = [...api.request.header];
                                                                                        up[hIdx].key = e.target.value;
                                                                                        updateFlowField(idx, "headers", up);
                                                                                    }}
                                                                                    className="text-xs w-1/3 text-primary/90"
                                                                                    readOnly={false}
                                                                                />
                                                                                <TextInputWithClearButton
                                                                                    id={`header-value-${idx}-${hIdx}`}
                                                                                    value={h.value}
                                                                                    onChangeHandler={(e) => {
                                                                                        const up = [...api.request.header];
                                                                                        up[hIdx].value = e.target.value;
                                                                                        updateFlowField(idx, "headers", up);
                                                                                    }}
                                                                                    placeholder="Header Value"
                                                                                    className="text-xs w-2/3 text-primary/90"
                                                                                    readOnly={false}
                                                                                />
                                                                                
                                                                                <Button
                                                                                    variant="ghost"
                                                                                    size="icon"
                                                                                    onClick={() => {
                                                                                        const up = [...api.request.header];
                                                                                        up.splice(hIdx, 1);
                                                                                        updateFlowField(idx, "headers", up);
                                                                                    }}
                                                                                    className="cursor-pointer"
                                                                                >
                                                                                    <Trash2Icon className="w-4 h-4 text-primary/90" />
                                                                                </Button>
                                                                            </div>
                                                                        ),
                                                                    )}
                                                                    <Button
                                                                        variant="outline"
                                                                        size="sm"
                                                                        onClick={() =>
                                                                            updateFlowField(idx, "headers", [
                                                                                ...(api.request.header || []),
                                                                                { key: "", value: "" },
                                                                            ])
                                                                        }
                                                                        className="cursor-pointer bg-white/90"
                                                                    >
                                                                        Add Header
                                                                    </Button>
                                                                </div>
                                                            </TabsContent>

                                                            <TabsContent value="prerequest" className="mt-4">
                                                                <Textarea
                                                                    className="text-sm bg-primary/20 text-primary/90 border rounded p-2 mb-3"
                                                                    value={
                                                                        api?.event?.find((e: any) => e.listen === "prerequest")
                                                                            ?.script?.exec?.join("\n") || ""
                                                                    }
                                                                    onChange={(e) =>
                                                                        updateFlowField(idx, "prerequest", e.target.value)
                                                                    }
                                                                    rows={6}
                                                                />
                                                            </TabsContent>

                                                            <TabsContent value="request" className="mt-4">
                                                                {api.request.body?.graphql && (
                                                                    <>
                                                                        <label className="text-sm font-medium text-primary/70">
                                                                            GraphQL Query
                                                                        </label>
                                                                        <Textarea
                                                                            className="text-sm bg-primary/20 text-primary/90 border rounded p-2 mb-3"
                                                                            value={api.request.body.graphql.query}
                                                                            onChange={(e) =>
                                                                                updateFlowField(idx, "query", e.target.value)
                                                                            }
                                                                            rows={6}
                                                                        />
                                                                        <label className="text-sm font-medium text-primary/70">
                                                                            Variables
                                                                        </label>
                                                                        <Textarea
                                                                            className="text-sm bg-primary/20 text-primary/90 border rounded p-2"
                                                                            value={api.request.body.graphql.variables}
                                                                            onChange={(e) =>
                                                                                updateFlowField(idx, "variables", e.target.value)
                                                                            }
                                                                            rows={4}
                                                                        />
                                                                    </>
                                                                )}
                                                            </TabsContent>

                                                            <TabsContent value="response" className="mt-4">
                                                                <Textarea
                                                                    readOnly
                                                                    rows={10}
                                                                    className="text-sm bg-primary/20 text-primary/80 border rounded p-2 overflow-y-auto"
                                                                    value={JSON.stringify(response[idx] || {}, null, 2)}
                                                                />
                                                            </TabsContent>

                                                            <TabsContent value="test" className="mt-4">
                                                                <Textarea
                                                                    className="text-sm bg-primary/20 text-primary/90 border rounded p-2 mb-3"
                                                                    value={
                                                                        api?.event?.find((e: any) => e.listen === "test")
                                                                            ?.script?.exec?.join("\n") || ""
                                                                    }
                                                                    onChange={(e) =>
                                                                        updateFlowField(idx, "test", e.target.value)
                                                                    }
                                                                    rows={6}
                                                                />
                                                            </TabsContent>
                                                        </Tabs>
                                                    </>
                                                )}
                                            </CardContent>
                                        </Card>
                                    ))}
                                </div>
                            )}
                        </TabsContent>

                        <TabsContent value="results">
                            <ScrollArea className="overflow-auto space-y-4 pr-2 flex flex-col gap-2 ">

                                {wsMessages
                                    .filter((msg) => typeof msg?.response === "object" && msg?.response?.status)
                                    .map((msg, idx) => {
                                        // console.log("msg ", msg);

                                        // const requestBlock = msg?.response?.find((el: any) => el.type === "request");
                                        // if (!requestBlock) return null;
                                        msg = msg?.response

                                        // console.log("msg response ",msg?.response);

                                        return (
                                            <Card key={idx} className="mb-2">
                                                <CardContent className="p-4 text-primary">
                                                    <div
                                                        onClick={() =>
                                                            setExpandedCards((p) => ({ ...p, [idx]: !p[idx] }))
                                                        }
                                                        className="flex justify-between items-center cursor-pointer hover:bg-muted/20 p-2 rounded-md"
                                                    >
                                                        <div className="w-full flex flex-col gap-2">
                                                            <div className="flex items-center gap-2">
                                                                {expandedCards[idx] ? <ChevronDown /> : <ChevronRight />}
                                                                <span className="font-semibold">{msg?.name}</span>
                                                            </div>

                                                            {msg.status && (
                                                                <div className="w-full mt-4 flex items-center gap-2 text-xs">
                                                                    <Badge
                                                                        variant={
                                                                            msg?.status >= 200 && msg?.status < 300
                                                                                ? "default"
                                                                                : "destructive"
                                                                        }
                                                                        className="text-xs text-white"
                                                                    >
                                                                        Status: {msg.status}
                                                                    </Badge>
                                                                    {msg.item && (
                                                                        <span className="text-muted-foreground ml-2">{msg?.item}</span>
                                                                    )}
                                                                </div>
                                                            )}
                                                        </div>
                                                        {msg?.success && (
                                                            <CheckCircle className="text-green-500 w-5 h-5" />
                                                        )}
                                                        {!msg?.success && (
                                                            <FaRegCircleXmark className="text-red-500 w-5 h-5" />
                                                        )}
                                                    </div>

                                                    {expandedCards[idx] && (
                                                        <>
                                                            <div className="flex items-center gap-2 mt-2 mb-2">
                                                                <MethodBadge method={msg?.request?.method} />
                                                                <span className="text-xs text-muted-foreground break-all">
                                                                    {msg?.request?.url}
                                                                </span>
                                                            </div>
                                                            <Tabs defaultValue="request" className="w-full">
                                                                <TabsList className="flex border-b text-primary/70">
                                                                    <TabsTrigger value="headers-request">Headers-Request</TabsTrigger>
                                                                    <TabsTrigger value="request">Request</TabsTrigger>
                                                                    <TabsTrigger value="response">Response</TabsTrigger>

                                                                </TabsList>

                                                                <TabsContent value="headers-request" className="mt-4">
                                                                    <div className="space-y-2">
                                                                        {msg.request?.headers &&
                                                                            Object.entries(msg?.request?.headers).map(([key, value], hIdx) => (
                                                                                <div key={hIdx} className="flex items-center gap-2">
                                                                                    <Input
                                                                                        type="text"
                                                                                        value={key}
                                                                                        readOnly
                                                                                        placeholder="Header Key"
                                                                                        className="text-xs w-1/3 text-primary/90 bg-muted"
                                                                                    />
                                                                                    <Input
                                                                                        type="text"
                                                                                        value={String(value)}
                                                                                        readOnly
                                                                                        placeholder="Header Value"
                                                                                        className="text-xs w-2/3 text-primary/90 bg-muted"
                                                                                    />
                                                                                </div>
                                                                            ))}
                                                                    </div>
                                                                </TabsContent>

                                                                <TabsContent value="request" className="mt-4">
                                                                    {msg.request?.data?.query && (
                                                                        <div className="mt-4">
                                                                            <p className="text-xs font-medium text-muted-foreground mb-1">Query</p>
                                                                            <div className="bg-muted rounded p-2 text-xs font-mono whitespace-pre-wrap">
                                                                                {(() => {
                                                                                    const raw = msg?.request?.data?.query;
                                                                                    try {
                                                                                        const parsed = typeof raw === "string" ? JSON.parse(raw) : raw;
                                                                                        return JSON.stringify(parsed, null, 2);
                                                                                    } catch {
                                                                                        return String(raw);
                                                                                    }
                                                                                })()}
                                                                            </div>
                                                                        </div>
                                                                    )}

                                                                    {msg?.request?.data?.variables && (
                                                                        <div className="mt-4">
                                                                            <p className="text-xs font-medium text-muted-foreground mb-1">Variables</p>
                                                                            <div className="bg-muted rounded p-2 text-xs font-mono whitespace-pre-wrap">
                                                                                {(() => {
                                                                                    const raw = msg?.request?.data?.variables;
                                                                                    try {
                                                                                        const parsed = typeof raw === "string" ? JSON.parse(raw) : raw;
                                                                                        return JSON.stringify(parsed, null, 2);
                                                                                    } catch {
                                                                                        return String(raw);
                                                                                    }
                                                                                })()}
                                                                            </div>
                                                                        </div>
                                                                    )}
                                                                </TabsContent>


                                                                <TabsContent value="response" className="mt-4">
                                                                    {(msg?.response?.data || msg?.response) && (
                                                                        <div className="mt-4">
                                                                            <p className="text-xs font-medium text-muted-foreground mb-1">
                                                                                Response
                                                                            </p>
                                                                            <div className="bg-muted rounded p-2 text-xs font-mono whitespace-pre-wrap">
                                                                                {JSON.stringify(msg?.response?.data || msg?.response, null, 2) || "No response data"}
                                                                            </div>
                                                                        </div>
                                                                    )}
                                                                </TabsContent>



                                                            </Tabs>
                                                        </>
                                                    )}
                                                </CardContent>
                                            </Card>
                                        );
                                    })}

                            </ScrollArea>
                        </TabsContent>


                    </Tabs>
                </main>
            </div>
        </DashboardHeader>
    );
}

export default ApiFlowBuilder;