import type { Metadata } from "next";

import { BarChart3Icon } from "lucide-react";

import { CategoryDonut } from "@/components/features/dashboard/category-donut";
import { MonthlyTrendChart } from "@/components/features/dashboard/monthly-trend-chart";
import { SummaryCards, type SummaryCardItem } from "@/components/features/dashboard/summary-cards";
import { MonthSwitcher } from "@/components/features/reports/month-switcher";
import { Card } from "@/components/ui/card";
import { Progress, ProgressIndicator, ProgressTrack } from "@/components/ui/progress";
import { apiFetch } from "@/lib/api-server";
import { formatIDR } from "@/lib/money";
import { requireSession } from "@/lib/session";

export const metadata: Metadata = {
  title: "Laporan",
};

export const instant = false;

type ReportsResponse = {
  range: { key: string; label: string; start: string | null; end: string | null };
  summary: {
    income: number;
    expense: number;
    net: number;
    byCategory: { categoryId: string | null; name: string; color: string | null; total: number }[];
  };
  trend: { key: string; label: string; income: number; expense: number; net: number }[];
  adjacent: { prev: string; next: string };
};

export default async function ReportsPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string }>;
}) {
  await requireSession();
  const { month } = await searchParams;

  const query = month ? `?month=${encodeURIComponent(month)}` : "";
  const { range, summary, trend, adjacent } = await apiFetch<ReportsResponse>(
    `/api/reports${query}`,
  );

  const currentKey = new Date().toISOString().slice(0, 7);
  const isFuture = range.key >= currentKey;

  const income = BigInt(summary.income);
  const expense = BigInt(summary.expense);
  const net = BigInt(summary.net);

  const summaryItems: SummaryCardItem[] = [
    {
      label: "Pemasukan",
      value: formatIDR(income),
      icon: "income",
      tone: income > 0n ? "positive" : "default",
      hint: "Total masuk periode ini",
    },
    {
      label: "Pengeluaran",
      value: formatIDR(expense),
      icon: "expense",
      tone: expense > 0n ? "negative" : "default",
      hint: "Total keluar periode ini",
    },
    {
      label: "Arus Kas Bersih",
      value: formatIDR(net),
      icon: "net",
      tone: net >= 0n ? "positive" : "negative",
      hint: net >= 0n ? "Surplus" : "Defisit",
    },
    {
      label: "Rasio Tabungan",
      value: income > 0n ? `${Math.round(Number((net * 10000n) / income) / 100)}%` : "—",
      icon: "savings",
      hint: "Dari total pemasukan",
    },
  ];

  const trendData = trend.map((point) => ({
    label: point.label,
    income: point.income,
    expense: point.expense,
  }));

  const slices = summary.byCategory.slice(0, 8).map((item) => ({
    name: item.name,
    value: item.total,
    color: item.color ?? "#64748b",
  }));

  const maxCategory = summary.byCategory[0]?.total ?? 0;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="font-heading text-2xl font-semibold">Laporan</h1>
          <p className="text-muted-foreground text-sm">
            Analisis arus kas dan pengeluaran per periode.
          </p>
        </div>
        <MonthSwitcher
          label={range.label}
          prevKey={adjacent.prev}
          nextKey={adjacent.next}
          disableNext={isFuture}
        />
      </div>

      <SummaryCards items={summaryItems} />

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="gap-3">
          <div className="flex flex-col gap-0.5">
            <h2 className="font-heading text-sm font-semibold">Tren 6 Bulan</h2>
            <p className="text-muted-foreground text-xs">
              Perbandingan pemasukan & pengeluaran bulanan.
            </p>
          </div>
          <MonthlyTrendChart data={trendData} />
        </Card>

        <Card className="gap-3">
          <div className="flex flex-col gap-0.5">
            <h2 className="font-heading text-sm font-semibold">Komposisi Pengeluaran</h2>
            <p className="text-muted-foreground text-xs">{range.label}</p>
          </div>
          <CategoryDonut data={slices} />
        </Card>
      </div>

      <Card className="gap-0 p-0">
        <div className="flex items-center gap-2 border-b px-4 py-3">
          <BarChart3Icon className="text-muted-foreground size-4" />
          <h2 className="font-heading text-sm font-semibold">Rincian per Kategori</h2>
        </div>

        {summary.byCategory.length === 0 ? (
          <p className="text-muted-foreground px-4 py-8 text-center text-sm">
            Tidak ada pengeluaran pada periode ini.
          </p>
        ) : (
          <ul className="divide-y">
            {summary.byCategory.map((item) => {
              const share = maxCategory > 0 ? (item.total / maxCategory) * 100 : 0;
              const pct = summary.expense > 0 ? (item.total / summary.expense) * 100 : 0;
              return (
                <li
                  key={item.categoryId ?? "uncategorized"}
                  className="flex flex-col gap-1.5 px-4 py-3"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <span
                        className="size-2.5 shrink-0 rounded-full"
                        style={{ backgroundColor: item.color ?? "#64748b" }}
                      />
                      <span className="text-sm font-medium">{item.name}</span>
                    </div>
                    <div className="flex items-baseline gap-2">
                      <span className="text-sm font-medium tabular-nums">
                        {formatIDR(BigInt(item.total))}
                      </span>
                      <span className="text-muted-foreground text-xs tabular-nums">
                        {pct.toFixed(1)}%
                      </span>
                    </div>
                  </div>
                  <Progress value={Math.min(Math.max(share, 0), 100)}>
                    <ProgressTrack className="h-1.5">
                      <ProgressIndicator style={{ backgroundColor: item.color ?? "#64748b" }} />
                    </ProgressTrack>
                  </Progress>
                </li>
              );
            })}
          </ul>
        )}
      </Card>
    </div>
  );
}
