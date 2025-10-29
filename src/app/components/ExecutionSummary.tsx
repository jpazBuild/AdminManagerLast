"use client";
import { ResponsivePie } from "@nivo/pie";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type Props = {
  totalSuccess: number;
  totalFailed: number;
  totalPending: number;
  darkMode?: boolean;
};

type Slice = { id: string; label: string; value: number; color: string };

export function ExecutionSummary({
  totalSuccess,
  totalFailed,
  totalPending,
  darkMode = false,
}: Props) {
  const total = totalSuccess + totalFailed + totalPending;
  if (total === 0) return null;

  const data: Slice[] = [
    { id: "Success", label: "Success", value: totalSuccess, color: "#059669" },
    { id: "Failed", label: "Failed", value: totalFailed, color: "#DC2626" },
    { id: "Pending", label: "Pending", value: totalPending, color: "#FF9800" },
  ].filter((d) => d.value > 0);

  const textMain = darkMode ? "text-white" : "text-[#223853]";
  const textSub = darkMode ? "text-white/80" : "text-[#223853]";
  const cardBg = darkMode ? "bg-gray-800 border-white/10" : "bg-white";
  const centerText = darkMode ? "text-white" : "text-[#223853]";
  const tooltipBg = darkMode ? "#0B0E11" : "#f0f0f0";
  const tooltipColor = darkMode ? "#FFFFFF" : "#223853";
  const borderColor = darkMode ? "#0B0E11" : "#FFFFFF";
  const uiTextColor = darkMode ? "#FFFFFF" : "#223853";

  return (
    <Card className={`flex flex-col ${cardBg}`}>
      <CardHeader className={`items-center pb-0 ${textMain}`}>
        <CardTitle>Summary</CardTitle>
      </CardHeader>
      <CardContent className="flex-1 pb-0 flex flex-col items-center">
        <div className="relative w-[220px] h-[220px]">
          <ResponsivePie<Slice>
            data={data}
            margin={{ top: 24, right: 24, bottom: 24, left: 24 }}
            innerRadius={0.65}
            padAngle={1.5}
            colors={{ datum: "data.color" }}
            enableArcLabels={false}
            enableArcLinkLabels={false}
            borderWidth={2}
            borderColor={borderColor}
            theme={{
              text: { fill: uiTextColor },
              legends: { text: { fill: uiTextColor } },
              labels: { text: { fill: uiTextColor } },
              tooltip: {
                container: {
                  background: tooltipBg,
                  color: tooltipColor,
                  borderRadius: 8,
                  padding: 8,
                  boxShadow: "0 2px 8px rgba(0,0,0,0.2)",
                },
              },
            }}
            tooltip={({ datum }) => (
              <div
                className="px-3 py-2 rounded-lg shadow font-medium text-sm flex items-center"
                style={{ background: tooltipBg, color: tooltipColor }}
              >
                <span
                  className="inline-block w-3 h-3 rounded-full mr-2"
                  style={{ background: datum.color }}
                />
                {datum.label}: <b className="ml-1">{datum.value}</b>
                <span className="ml-2 text-xs opacity-70">
                  ({((datum.value / total) * 100).toFixed(0)}%)
                </span>
              </div>
            )}
            animate
          />

          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <span className={`text-3xl font-bold opacity-85 leading-tight ${centerText}`}>
              {total}
            </span>
            <span className={`text-base font-medium -mt-1 ${textSub}`}>Tests</span>
          </div>
        </div>

        <div className="flex justify-around w-full mt-3 text-xs">
          {data.map((entry) => {
            const percent = ((entry.value / total) * 100).toFixed(0);
            return (
              <span key={entry.id} className="flex items-center gap-2">
                <span
                  className="inline-block w-3 h-3 rounded-full"
                  style={{ background: entry.color }}
                />
                <span className={`font-medium ${textMain}`}>
                  {entry.label}: {entry.value}
                  <span className="text-[11px] opacity-70 ml-1">({percent}%)</span>
                </span>
              </span>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
