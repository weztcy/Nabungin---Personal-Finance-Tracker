import type { Metadata } from "next";

import { BudgetsView } from "@/components/features/budgets/budgets-view";
import { apiFetch } from "@/lib/api-server";
import { formatDate } from "@/lib/format";
import { formatIDR } from "@/lib/money";
import { requireSession } from "@/lib/session";

export const metadata: Metadata = {
  title: "Budget",
};

export const instant = false;

type BudgetsResponse = {
  budgets: {
    id: string;
    name: string;
    amount: number;
    periodStart: string | null;
    periodEnd: string | null;
    frequency: string;
    categoryId: string | null;
    categoryName: string | null;
    categoryColor: string | null;
    accountId: string | null;
    accountName: string | null;
    spent: number;
    remaining: number;
    percent: number;
  }[];
};

type CategoriesResponse = {
  categories: { id: string; name: string; kind: string }[];
};

type AccountsResponse = {
  accounts: { id: string; name: string; isArchived: boolean }[];
};

export default async function BudgetsPage() {
  await requireSession();

  const [budgetData, categoryData, accountData] = await Promise.all([
    apiFetch<BudgetsResponse>("/api/budgets"),
    apiFetch<CategoriesResponse>("/api/categories"),
    apiFetch<AccountsResponse>("/api/accounts"),
  ]);

  const items = budgetData.budgets.map((b) => {
    const start = b.periodStart ? new Date(b.periodStart) : new Date();
    const end = b.periodEnd ? new Date(b.periodEnd) : new Date();
    return {
      id: b.id,
      name: b.name,
      amount: b.amount,
      amountLabel: formatIDR(BigInt(b.amount)),
      spentLabel: formatIDR(BigInt(b.spent)),
      remainingLabel: formatIDR(BigInt(Math.abs(b.remaining))),
      percent: b.percent,
      over: b.remaining < 0,
      periodLabel: `${formatDate(start)} – ${formatDate(end)}`,
      periodStart: start.toISOString().slice(0, 10),
      periodEnd: end.toISOString().slice(0, 10),
      frequency: b.frequency,
      categoryId: b.categoryId,
      categoryName: b.categoryName,
      categoryColor: b.categoryColor,
      accountId: b.accountId,
      accountName: b.accountName,
    };
  });

  const categories = categoryData.categories
    .filter((c) => c.kind === "EXPENSE")
    .map((c) => ({ id: c.id, name: c.name }));

  const accounts = accountData.accounts
    .filter((a) => !a.isArchived)
    .map((a) => ({ id: a.id, name: a.name }));

  return <BudgetsView budgets={items} categories={categories} accounts={accounts} />;
}
