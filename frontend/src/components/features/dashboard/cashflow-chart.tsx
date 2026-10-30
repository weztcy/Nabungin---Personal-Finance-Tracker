"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { formatIDR } from "@/lib/money";

export type CashflowPoint = {
  label: string;
  income: number;
  expense: number;
};

export function CashflowChart({ data }: { data: CashflowPoint[] }) {
  if (data.length === 0) {
    return (
      <div className="text-muted-foreground flex h-64 items-center justify-center text-sm">
        Belum ada transaksi pada periode ini.
      </div>
    );
  }

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-border" />
          <XAxis
            dataKey="label"
            tickLine={false}
            axisLine={false}
            fontSize={12}
            className="fill-muted-foreground"
          />
          <YAxis
            tickLine={false}
            axisLine={false}
            fontSize={12}
            width={72}
            tickFormatter={(value: number) => formatIDR(BigInt(Math.round(value)))}
            className="fill-muted-foreground"
          />
          <Tooltip
            formatter={(value, name) => [
              formatIDR(BigInt(Math.round(Number(value ?? 0)))),
              name === "income" ? "Pemasukan" : "Pengeluaran",
            ]}
            contentStyle={{
              borderRadius: 12,
              border: "1px solid var(--border)",
              background: "var(--popover)",
              color: "var(--popover-foreground)",
              fontSize: 12,
            }}
          />
          <Legend
            formatter={(value: string) => (value === "income" ? "Pemasukan" : "Pengeluaran")}
            wrapperStyle={{ fontSize: 12 }}
          />
          <Bar dataKey="income" fill="#10b981" radius={[4, 4, 0, 0]} maxBarSize={28} />
          <Bar dataKey="expense" fill="#ef4444" radius={[4, 4, 0, 0]} maxBarSize={28} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
