"use client"

import { Cell, Pie, PieChart as BasePieChart, ResponsiveContainer, Tooltip } from "recharts"

interface DonutChartProps {
  data: any[]
  index: string
  category: string
  colors?: string[]
  valueFormatter?: (value: number) => string
}

const COLORS = ["slate", "violet", "indigo", "rose", "cyan", "amber"]

export function DonutChart({
  data,
  index,
  category,
  colors = COLORS,
  valueFormatter = (value: number) => `${value}`,
}: DonutChartProps) {
  return (
    <ResponsiveContainer width="100%" height={200}>
      <BasePieChart>
        <Pie
          data={data}
          nameKey={index}
          dataKey={category}
          innerRadius="50%"
          outerRadius="80%"
          paddingAngle={2}
        >
          {data.map((_, idx) => (
            <Cell key={`cell-${idx}`} className={`fill-${colors[idx % colors.length]}-500`} />
          ))}
        </Pie>
        <Tooltip
          content={({ active, payload }) => {
            if (active && payload && payload.length) {
              const data = payload[0].payload
              return (
                <div className="rounded-lg border bg-background p-2 shadow-sm">
                  <div className="grid grid-cols-2 gap-2">
                    <div className="flex flex-col">
                      <span className="text-[0.70rem] uppercase text-muted-foreground">
                        {index}
                      </span>
                      <span className="font-bold text-muted-foreground">
                        {data[index]}
                      </span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[0.70rem] uppercase text-muted-foreground">
                        {category}
                      </span>
                      <span className="font-bold">
                        {valueFormatter(data[category])}
                      </span>
                    </div>
                  </div>
                </div>
              )
            }
            return null
          }}
        />
      </BasePieChart>
    </ResponsiveContainer>
  )
} 