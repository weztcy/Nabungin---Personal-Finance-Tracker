import type { Metadata } from "next";

import Link from "next/link";

import { PlusIcon } from "lucide-react";

import { AccountsSnapshot } from "@/components/features/dashboard/accounts-snapshot";
import { CashflowChart } from "@/components/features/dashboard/cashflow-chart";
import { CategoryDonut } from "@/components/features/dashboard/category-donut";
import { RecentTransactions } from "@/components/features/dashboard/recent-transactions";
import { SummaryCards, type SummaryCardItem } from "@/components/features/dashboard/summary-cards";
import { buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress, ProgressIndicator, ProgressTrack } from "@/components/ui/progress";
import { apiFetch } from "@/lib/api-server";
import { formatDate } from "@/lib/format";
import { formatIDR } from "@/lib/money";
import { requireSession } from "@/lib/session";
import { ACCOUNT_TYPE_LABELS } from "@/lib/validators/account";

export const metadata: Metadata = {
  title: "Dashboard",
};

export const instant = false;

type DashboardResponse = {
  month: { start: string | null; end: string | null };
  netWorth: number;
  activeAccountCount: number;
  summary: {
    income: number;
    expense: number;
    net: number;
    byCategory: { categoryId: string | null; name: string; color: string | null; total: number }[];
  };
  timeline: { date: string; income: number; expense: number }[];
  recentTransactions: {
    id: string;
    type: string;
    amount: number;
    date: string | null;
    payee: string | null;
    note: string | null;
    accountName: string;
    toAccountName: string | null;
    categoryName: string | null;
    categoryColor: string | null;
  }[];
  accounts: {
    id: string;
    name: string;
    type: string;
    color: string | null;
    isArchived: boolean;
    balance: number;
  }[];
  budgets: {
    id: string;
    name: string;
    amount: number;
    spent: number;
    remaining: number;
    percent: number;
  }[];
  goals: {
    id: string;
    name: string;
    targetAmount: number;
    savedAmount: number;
    percent: number;
    isCompleted: boolean;
  }[];
};

export default async function DashboardPage() {
  await requireSession();

  const data = await apiFetch<DashboardResponse>("/api/dashboard");

  const start = data.month.start ? new Date(data.month.start) : new Date();

  const summaryItems: SummaryCardItem[] = [
    {
      label: "Kekayaan Bersih",
      value: formatIDR(BigInt(data.netWorth)),
      hint: `${data.activeAccountCount} akun aktif`,
      tone: data.netWorth < 0 ? "negative" : "default",
      icon: "wallet",
    },
    {
      label: "Pemasukan Bulan Ini",
      value: formatIDR(BigInt(data.summary.income)),
      hint: formatDate(start, "MMMM yyyy"),
      tone: data.summary.income > 0 ? "positive" : "default",
      icon: "income",
    },
    {
      label: "Pengeluaran Bulan Ini",
      value: formatIDR(BigInt(data.summary.expense)),
      hint: `${data.summary.byCategory.length} kategori`,
      tone: data.summary.expense > 0 ? "negative" : "default",
      icon: "expense",
    },
    {
      label: "Arus Kas Bersih",
      value: formatIDR(BigInt(data.summary.net)),
      hint: data.summary.net >= 0 ? "Surplus" : "Defisit",
      tone: data.summary.net >= 0 ? "positive" : "negative",
      icon: "net",
    },
  ];

  const timelineData = data.timeline.map((point) => ({
    label: formatDate(point.date, "d MMM"),
    income: point.income,
    expense: point.expense,
  }));

  const slices = data.summary.byCategory.slice(0, 8).map((item) => ({
    name: item.name,
    value: item.total,
    color: item.color ?? "#64748b",
  }));

  const recentItems = data.recentTransactions.map((tx) => ({
    id: tx.id,
    type: tx.type,
    amountLabel: formatIDR(BigInt(tx.amount)),
    dateLabel: formatDate(tx.date ?? new Date()),
    title: tx.categoryName ?? tx.payee ?? (tx.type === "TRANSFER" ? "Transfer" : "Tanpa kategori"),
    subtitle: tx.toAccountName ? `${tx.accountName} → ${tx.toAccountName}` : tx.accountName,
    categoryColor: tx.categoryColor,
  }));

  const accountItems = data.accounts
    .filter((account) => !account.isArchived)
    .slice(0, 6)
    .map((account) => ({
      id: account.id,
      name: account.name,
      typeLabel:
        ACCOUNT_TYPE_LABELS[account.type as keyof typeof ACCOUNT_TYPE_LABELS] ?? account.type,
      color: account.color,
      balanceLabel: formatIDR(BigInt(account.balance)),
      negative: account.balance < 0,
    }));

  const activeBudgets = data.budgets.slice(0, 4);
  const activeGoals = data.goals.filter((goal) => !goal.isCompleted).slice(0, 4);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="font-heading text-2xl font-semibold">Dashboard</h1>
          <p className="text-muted-foreground text-sm">
            Ringkasan keuanganmu bulan ini — {formatDate(start, "MMMM yyyy")}.
          </p>
        </div>
        <Link href="/transactions" className={buttonVariants()}>
          <PlusIcon /> Tambah Transaksi
        </Link>
      </div>

      <SummaryCards items={summaryItems} />

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="gap-3 lg:col-span-2">
          <div className="flex flex-col gap-0.5">
            <h2 className="font-heading text-sm font-semibold">Arus Kas Harian</h2>
            <p className="text-muted-foreground text-xs">Pemasukan vs pengeluaran bulan ini.</p>
          </div>
          <CashflowChart data={timelineData} />
        </Card>

        <Card className="gap-3">
          <div className="flex flex-col gap-0.5">
            <h2 className="font-heading text-sm font-semibold">Pengeluaran per Kategori</h2>
            <p className="text-muted-foreground text-xs">Bulan ini.</p>
          </div>
          <CategoryDonut data={slices} />
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="flex flex-col gap-4 lg:col-span-2">
          <RecentTransactions items={recentItems} />
        </div>
        <div className="flex flex-col gap-4">
          <AccountsSnapshot items={accountItems} />
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="gap-3">
          <div className="flex items-center justify-between">
            <h2 className="font-heading text-sm font-semibold">Budget Aktif</h2>
            <Link href="/budgets" className="text-muted-foreground text-xs hover:underline">
              Kelola
            </Link>
          </div>
          {activeBudgets.length === 0 ? (
            <p className="text-muted-foreground text-sm">Belum ada budget aktif.</p>
          ) : (
            <ul className="flex flex-col gap-3">
              {activeBudgets.map((budget) => (
                <li key={budget.id} className="flex flex-col gap-1.5">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium">{budget.name}</span>
                    <span className="text-muted-foreground text-xs tabular-nums">
                      {formatIDR(BigInt(budget.spent))} / {formatIDR(BigInt(budget.amount))}
                    </span>
                  </div>
                  <Progress value={Math.min(Math.max(budget.percent, 0), 100)}>
                    <ProgressTrack className="h-2">
                      <ProgressIndicator
                        className={budget.remaining < 0 ? "bg-destructive" : "bg-emerald-500"}
                      />
                    </ProgressTrack>
                  </Progress>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card className="gap-3">
          <div className="flex items-center justify-between">
            <h2 className="font-heading text-sm font-semibold">Target Tabungan</h2>
            <Link href="/goals" className="text-muted-foreground text-xs hover:underline">
              Kelola
            </Link>
          </div>
          {activeGoals.length === 0 ? (
            <p className="text-muted-foreground text-sm">Belum ada target tabungan.</p>
          ) : (
            <ul className="flex flex-col gap-3">
              {activeGoals.map((goal) => (
                <li key={goal.id} className="flex flex-col gap-1.5">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium">{goal.name}</span>
                    <span className="text-muted-foreground text-xs tabular-nums">
                      {formatIDR(BigInt(goal.savedAmount))} / {formatIDR(BigInt(goal.targetAmount))}
                    </span>
                  </div>
                  <Progress value={Math.min(Math.max(goal.percent, 0), 100)}>
                    <ProgressTrack className="h-2">
                      <ProgressIndicator className="bg-primary" />
                    </ProgressTrack>
                  </Progress>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </div>
  );
}
