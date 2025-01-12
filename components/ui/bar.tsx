"use client";

import * as React from "react";
import { Bar as RechartsBar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip } from "recharts";

interface BarProps {
  data: any[];
  index: string;
  categories: string[];
  colors?: string[];
  title?: string;
  valueFormatter?: (value: number) => string;
  stacked?: boolean;
  className?: string;
}

export function Bar({
  data,
  index,
  categories,
  colors = ["#0091ff"],
  title,
  valueFormatter = (value: number) => value.toString(),
  stacked = false,
  className,
}: BarProps) {
  return (
    <ResponsiveContainer width="100%" height={350} className={className}>
      <BarChart data={data}>
        <XAxis
          dataKey={index}
          stroke="#888888"
          fontSize={12}
          tickLine={false}
          axisLine={false}
        />
        <YAxis
          stroke="#888888"
          fontSize={12}
          tickLine={false}
          axisLine={false}
          tickFormatter={valueFormatter}
        />
        <Tooltip
          formatter={valueFormatter}
          cursor={{ fill: "transparent" }}
        />
        {categories.map((category, i) => (
          <RechartsBar
            key={category}
            dataKey={category}
            fill={colors[i % colors.length]}
            stackId={stacked ? "stack" : undefined}
            radius={[4, 4, 0, 0]}
          />
        ))}
      </BarChart>
    </ResponsiveContainer>
  );
} 