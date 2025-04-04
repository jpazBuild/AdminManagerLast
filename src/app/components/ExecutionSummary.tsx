"use client"
import * as React from "react"
import { Label, Pie, PieChart } from "recharts"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../../components/ui/card"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "../../components/ui/chart"

export function ExecutionSummary({ totalSuccess, totalFailed, totalPending, successRate }: any) {
  const totalTests = totalSuccess + totalFailed + totalPending;

  const chartData = [
    { category: "Success", count: totalSuccess, fill: "#4CAF50" },
    { category: "Failed", count: totalFailed, fill: "#F44336" },
    { category: "Pending", count: totalPending, fill: "#FF9800" },
  ];

  const chartConfig = {
    success: { label: "Success", color: "#4CAF50" },
    failure: { label: "Failed", color: "#F44336" },
    pending: { label: "Pending", color: "#FF9800" }
  };
  

  const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent, index }: any) => {
    if (percent === 0) return null
    const RADIAN = Math.PI / 180
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5
    const x = cx + radius * Math.cos(-midAngle * RADIAN)
    const y = cy + radius * Math.sin(-midAngle * RADIAN)
  
    return (
      <text
        x={x}
        y={y}
        fill="white"
        textAnchor={"middle"}
        dominantBaseline="central"
        className="p-2 text-xs font-semibold text-primary fill-primary"
      >
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    )
  }
  
  return (
    totalTests > 0 && (
      <Card className="flex flex-col text-primary">
        <CardHeader className="items-center pb-0">
          <CardTitle>Summary</CardTitle>
        </CardHeader>
        <CardContent className="flex-1 pb-0">
          <ChartContainer
            config={chartConfig}
            className="mx-auto aspect-square max-h-[250px]"
          >
            <PieChart className="text-primary">
              <ChartTooltip
                cursor={false}
                content={<ChartTooltipContent hideLabel />}
              />
              <Pie
                data={chartData}
                dataKey="count"
                nameKey="category"
                innerRadius={40}
                outerRadius={100}
                strokeWidth={5}
                label={renderCustomizedLabel}
                
              >
                <Label
                  content={({ viewBox }) => {
                    if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                      const { cx, cy } = viewBox
                      return (
                        <text
                          x={cx}
                          y={cy}
                          textAnchor="middle"
                          dominantBaseline="middle"
                          className="text-primary"
                        >
                          <tspan
                            x={cx}
                            y={(Number(cy) ?? 0) - 12}
                            className="!fill-primary text-3xl font-bold"
                          >
                            {totalTests.toLocaleString()}
                          </tspan>
                          <tspan
                            x={cx}
                            y={(Number(cy) ?? 0) + 12}
                            className="fill-primary/90 text-sm"
                          >
                            Tests
                          </tspan>
                        </text>
                      )
                    }
                    return null
                  }}
                />

              </Pie>
            </PieChart>
          </ChartContainer>
        </CardContent>
      </Card>
    )
  )
}

