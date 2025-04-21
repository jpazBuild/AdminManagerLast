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

export function ExecutionSummary({ totalSuccess, totalFailed, successRate }:any) {
  const totalTests = totalSuccess + totalFailed
  
  const chartData = [
    { category: "Success", count: totalSuccess, fill: "#4CAF50" },
    { category: "Failed", count: totalFailed, fill: "#F44336" }, 
  ]

  const chartConfig = {
    success: {
      label: "Success",
      color: "#4CAF50",
    },
    failure: {
      label: "Failed",
      color: "#F44336",
    },
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
                innerRadius={60}
                strokeWidth={5}
              >
                <Label
                  content={({ viewBox }) => {
                    if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                      return (
                        <text
                          x={viewBox.cx}
                          y={viewBox.cy}
                          textAnchor="middle"
                          dominantBaseline="middle"
                          className="text-primary"
                        >
                          <tspan
                            x={viewBox.cx}
                            y={viewBox.cy}
                            className="fill-foreground text-3xl font-bold text-primary"
                          >
                            {totalTests.toLocaleString()}
                          </tspan>
                          <tspan
                            x={viewBox.cx}
                            y={(viewBox.cy || 0) + 24}
                            className="fill-muted-foreground text-primary"
                          >
                            Tests
                          </tspan>
                        </text>
                      )
                    }
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
