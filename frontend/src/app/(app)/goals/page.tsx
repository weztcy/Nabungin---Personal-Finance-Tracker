import type { Metadata } from "next";

import { GoalsView } from "@/components/features/goals/goals-view";
import { apiFetch } from "@/lib/api-server";
import { formatDate } from "@/lib/format";
import { formatIDR } from "@/lib/money";
import { requireSession } from "@/lib/session";

export const metadata: Metadata = {
  title: "Target Tabungan",
};

export const instant = false;

type GoalsResponse = {
  goals: {
    id: string;
    name: string;
    targetAmount: number;
    savedAmount: number;
    targetDate: string | null;
    color: string | null;
    isCompleted: boolean;
    accountId: string | null;
    accountName: string | null;
    percent: number;
  }[];
};

type AccountsResponse = {
  accounts: { id: string; name: string; isArchived: boolean }[];
};

export default async function GoalsPage() {
  await requireSession();

  const [goalData, accountData] = await Promise.all([
    apiFetch<GoalsResponse>("/api/goals"),
    apiFetch<AccountsResponse>("/api/accounts"),
  ]);

  const items = goalData.goals.map((g) => ({
    id: g.id,
    name: g.name,
    targetAmount: g.targetAmount,
    savedAmount: g.savedAmount,
    savedLabel: formatIDR(BigInt(g.savedAmount)),
    targetLabel: formatIDR(BigInt(g.targetAmount)),
    percent: g.percent,
    targetDateLabel: g.targetDate ? formatDate(g.targetDate) : null,
    targetDate: g.targetDate ? g.targetDate.slice(0, 10) : null,
    color: g.color,
    accountId: g.accountId,
    accountName: g.accountName,
    isCompleted: g.isCompleted,
  }));

  const accounts = accountData.accounts
    .filter((a) => !a.isArchived)
    .map((a) => ({ id: a.id, name: a.name }));

  return <GoalsView goals={items} accounts={accounts} />;
}
