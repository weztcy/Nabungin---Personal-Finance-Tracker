"use client";

import { Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";

import { formatIDR } from "@/lib/money";

export type CategorySlice = {
  name: string;
  value: number;
  color: string;
};

const FALLBACK = "#64748b";

export function CategoryDonut({ data }: { data: CategorySlice[] }) {
  if (data.length === 0) {
    return (
      <div className="text-muted-foreground flex h-64 items-center justify-center text-sm">
        Belum ada pengeluaran pada periode ini.
      </div>
    );
  }

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            dataKey="value"
            nameKey="name"
            innerRadius={56}
            outerRadius={88}
            paddingAngle={2}
            strokeWidth={0}
          >
            {data.map((slice) => (
              <Cell key={slice.name} fill={slice.color || FALLBACK} />
            ))}
          </Pie>
          <Tooltip
            formatter={(value) => formatIDR(BigInt(Math.round(Number(value ?? 0))))}
            contentStyle={{
              borderRadius: 12,
              border: "1px solid var(--border)",
              background: "var(--popover)",
              color: "var(--popover-foreground)",
              fontSize: 12,
            }}
          />
          <Legend
            verticalAlign="bottom"
            height={36}
            wrapperStyle={{ fontSize: 12 }}
            formatter={(value: string) => (value.length > 18 ? `${value.slice(0, 17)}…` : value)}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
