import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ChevronDown, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

export function RenderWsMessage({ msg }: { msg: any }) {
  const [showHeaders, setShowHeaders] = useState(false);
  const [showVars, setShowVars] = useState(false);
  const [showJson, setShowJson] = useState(true);

  const res = msg?.response?.env?.__response;
  const req = msg?.response?.env?.__request;
  const vars = req?.data?.variables;
  const err = msg?.response?.env?.__error;
  const name = msg?.response?.name || msg.item;

  return (
    <div className="bg-background border border-border p-4 rounded-md text-sm shadow-sm space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-x-2 font-semibold text-primary text-base">
          <span>{name}</span>
          {msg?.response?.success !== undefined && (
            <Badge variant={msg.response.success ? "default" : "destructive"}>
              {msg.response.success ? "Success" : "Failed"}
            </Badge>
          )}
        </div>
        <Badge variant="outline" className="text-xs text-muted-foreground">
          {msg.routeKey}
        </Badge>
      </div>

      {/* Request Info */}
      {req && (
        <div className="space-y-1">
          <h4 className="text-sm font-semibold text-muted-foreground">Request</h4>
          <div className="flex items-center justify-between text-xs text-primary/80">
            <span className="font-mono bg-muted px-2 py-1 rounded text-[13px]">
              {req.method?.toUpperCase()}
            </span>
            <span className="ml-2 break-all text-muted-foreground">{req.url}</span>
          </div>
        </div>
      )}

      {/* Variables */}
      {vars && (
        <div className="space-y-1">
          <button
            onClick={() => setShowVars((s) => !s)}
            className="flex items-center gap-1 text-sm text-muted-foreground"
          >
            {showVars ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
            Variables
          </button>
          {showVars && (
            <div className="grid gap-1 border-l pl-4">
              {Object.entries(vars).map(([key, val]: [string, any]) => (
                <div key={key} className="flex justify-between text-xs">
                  <span className="text-muted-foreground">{key}</span>
                  <span className="font-medium text-primary">{JSON.stringify(val)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Response */}
      {res && (
        <div className="space-y-1">
          <h4 className="text-sm font-semibold text-muted-foreground">Response</h4>
          <div className="flex gap-2 text-xs">
            <span className="bg-muted px-2 py-1 rounded text-[13px] font-mono">
              {res.status} {res.statusText}
            </span>
            <span className="text-muted-foreground">Content-Type: {res.headers?.["content-type"]}</span>
          </div>

          <button
            onClick={() => setShowJson((s) => !s)}
            className="text-xs text-muted-foreground mt-1 flex items-center gap-1"
          >
            {showJson ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
            Show Response Body
          </button>

          {showJson && res.json && typeof res.json === "object" && (
            <div className="mt-1 grid gap-1 border-l pl-4">
              {Object.entries(res.json).map(([key, val]: [string, any]) => (
                <div key={key} className="flex justify-between text-xs">
                  <span className="text-muted-foreground">{key}</span>
                  <span className="text-primary font-medium">
                    {typeof val === "object" ? JSON.stringify(val) : String(val)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Headers */}
      {res?.headers && (
        <div className="space-y-1">
          <button
            onClick={() => setShowHeaders((s) => !s)}
            className="flex items-center gap-1 text-sm text-muted-foreground"
          >
            {showHeaders ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
            Headers
          </button>
          {showHeaders && (
            <div className="grid gap-1 border-l pl-4">
              {Object.entries(res.headers).map(([k, v]: [string, any]) => (
                <div key={k} className="flex justify-between text-xs">
                  <span className="text-muted-foreground">{k}</span>
                  <span className="text-muted-foreground">{String(v)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Error */}
      {err && (
        <div className="bg-red-100 text-red-800 p-2 rounded text-xs font-medium">
          ⚠️ Error: {err}
        </div>
      )}
    </div>
  );
}
