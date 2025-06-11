import React from "react";
import { PieChart, Pie, Cell, Label } from "recharts";

type Props = {
  completed: number;
  failed: number;
  total: number;
};

const COLORS = ["#22c55e", "#ef4444", "#9ca3af"];

export const SummaryDonutChart = ({ completed, failed, total }: Props) => {
  const pending = Math.max(0, total - completed - failed);

  const data = [
    { name: "Passed", value: completed },
    { name: "Failed", value: failed },
    { name: "Pending", value: pending },
  ];

  return (
    <div className="w-12 h-12 flex items-center justify-center outline-none">
      <PieChart width={40} height={40}>
        <Pie
          data={data}
          innerRadius={12}
          outerRadius={18}
          paddingAngle={1}
          dataKey="value"
          stroke="none"
          style={{ outline: "none" }}
          tabIndex={-1}
        >
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={COLORS[index]} style={{ outline: "none" }}  tabIndex={-1} />
          ))}
          <Label
            value={total}
            position="center"
            fill="#374151"
            fontSize={10}
            style={{ outline: "none" }}
            tabIndex={-1}
          />
        </Pie>
      </PieChart>
    </div>
  );
};
