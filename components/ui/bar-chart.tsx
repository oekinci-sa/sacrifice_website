"use client"

import { Bar, BarChart as BaseBarChart, ResponsiveContainer, XAxis, YAxis, Tooltip } from "recharts"

interface BarChartProps {
  data: any[]
  index: string
  categories: string[]
  colors?: string[]
  valueFormatter?: (value: number) => string
  yAxisWidth?: number
}

export function BarChart({
  data,
  index,
  categories,
  colors = ["emerald"],
  valueFormatter = (value: number) => `${value}`,
  yAxisWidth = 40,
}: BarChartProps) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BaseBarChart data={data}>
        <XAxis dataKey={index} />
        <YAxis width={yAxisWidth} />
        <Tooltip
          content={({ active, payload }) => {
            if (active && payload && payload.length) {
              return (
                <div className="rounded-lg border bg-background p-2 shadow-sm">
                  <div className="grid grid-cols-2 gap-2">
                    <div className="flex flex-col">
                      <span className="text-[0.70rem] uppercase text-muted-foreground">
                        {index}
                      </span>
                      <span className="font-bold text-muted-foreground">
                        {payload[0].payload[index]}
                      </span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[0.70rem] uppercase text-muted-foreground">
                        {categories[0]}
                      </span>
                      <span className="font-bold">
                        {valueFormatter(payload[0].value as number)}
                      </span>
                    </div>
                  </div>
                </div>
              )
            }
            return null
          }}
        />
        <Bar
          dataKey={categories[0]}
          className={`fill-${colors[0]}-500`}
          radius={[4, 4, 0, 0]}
        />
      </BaseBarChart>
    </ResponsiveContainer>
  )
} 