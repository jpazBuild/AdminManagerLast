"use client"
import React from "react";
import { ResponsivePie } from "@nivo/pie";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export function ExecutionSummary({ totalSuccess, totalFailed, totalPending }: any) {
  const total = totalSuccess + totalFailed + totalPending;
  const data = [
    { id: "Success", label: "Success", value: totalSuccess, color: "#4CAF50" },
    { id: "Failed", label: "Failed", value: totalFailed, color: "#F44336" },
    { id: "Pending", label: "Pending", value: totalPending, color: "#FF9800" },
  ].filter(entry => entry.value > 0);

  if (total === 0) return null;

  return (
    <Card className="flex flex-col">
      <CardHeader className="items-center pb-0 text-primary">
        <CardTitle>Summary</CardTitle>
      </CardHeader>
      <CardContent className="flex-1 pb-0 flex flex-col items-center">
        <div className="relative w-[220px] h-[220px]">
          <ResponsivePie
            data={data}
            margin={{ top: 24, right: 24, bottom: 24, left: 24 }}
            innerRadius={0.65}
            padAngle={1.5}
            colors={{ datum: "data.color" }}
            enableArcLabels={false}
            enableArcLinkLabels={false}
            borderWidth={2}
            borderColor="#fff"
            tooltip={({ datum }) => (
              <div className="px-3 py-2 rounded-lg bg-[#f0f0f0] text-[#223853] shadow font-medium text-sm">
                <span className="inline-block w-3 h-3 rounded-full mr-2" style={{ background: datum.color }} />
                {datum.label}: <b>{datum.value}</b>
              </div>
            )}
            animate={true}
          />
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <span className="text-3xl font-bold text-[#223853] opacity-85 leading-tight">{total}</span>
            <span className="text-[#223853] text-base font-medium -mt-1">Tests</span>
          </div>
        </div>
        <div className="flex justify-around w-full mt-3 text-xs">
          {data.map((entry) => (
            <span key={entry.id} className="flex items-center gap-2">
              <span className="inline-block w-3 h-3 rounded-full" style={{ background: entry.color }}></span>
              <span className="font-medium text-[#223853]">{entry.label}: {entry.value}</span>
            </span>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
