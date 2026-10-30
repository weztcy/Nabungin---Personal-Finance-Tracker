import type { Metadata } from "next";

import { TransactionsView } from "@/components/features/transactions/transactions-view";
import { apiFetch } from "@/lib/api-server";
import { formatDate } from "@/lib/format";
import { requireSession } from "@/lib/session";

export const metadata: Metadata = {
  title: "Transaksi",
};

export const instant = false;

type TransactionsResponse = {
  transactions: {
    id: string;
    type: string;
    amount: number;
    date: string;
    accountId: string;
    accountName: string;
    toAccountId: string | null;
    toAccountName: string | null;
    categoryId: string | null;
    categoryName: string | null;
    categoryColor: string | null;
    note: string | null;
    payee: string | null;
  }[];
};

type AccountsResponse = {
  accounts: { id: string; name: string; isArchived: boolean }[];
};

type CategoriesResponse = {
  categories: { id: string; name: string; kind: string }[];
};

export default async function TransactionsPage() {
  await requireSession();

  const [txData, accountData, categoryData] = await Promise.all([
    apiFetch<TransactionsResponse>("/api/transactions?take=200"),
    apiFetch<AccountsResponse>("/api/accounts"),
    apiFetch<CategoriesResponse>("/api/categories"),
  ]);

  const items = txData.transactions.map((tx) => ({
    id: tx.id,
    type: tx.type,
    amount: tx.amount,
    dateLabel: formatDate(tx.date ?? new Date()),
    date: (tx.date ?? "").slice(0, 10),
    accountId: tx.accountId,
    accountName: tx.accountName,
    toAccountId: tx.toAccountId,
    toAccountName: tx.toAccountName,
    categoryId: tx.categoryId,
    categoryName: tx.categoryName,
    categoryColor: tx.categoryColor,
    note: tx.note,
    payee: tx.payee,
  }));

  const accounts = accountData.accounts
    .filter((a) => !a.isArchived)
    .map((a) => ({ id: a.id, name: a.name }));

  const categories = categoryData.categories.map((c) => ({
    id: c.id,
    name: c.name,
    kind: c.kind,
  }));

  return <TransactionsView transactions={items} accounts={accounts} categories={categories} />;
}
