import type { Metadata } from "next";

import { RecurringView } from "@/components/features/recurring/recurring-view";
import { apiFetch } from "@/lib/api-server";
import { formatDate } from "@/lib/format";
import { formatIDR } from "@/lib/money";
import { RECUR_FREQ_LABELS, type RecurFreq } from "@/lib/validators/recurrence";
import { TX_TYPE_LABELS } from "@/lib/validators/transaction";
import { requireSession } from "@/lib/session";

export const metadata: Metadata = {
  title: "Transaksi Berulang",
};

export const instant = false;

type RecurrencesResponse = {
  recurrences: {
    id: string;
    name: string;
    type: string;
    amount: number;
    freq: string;
    interval: number;
    nextRunAt: string | null;
    accountId: string;
    accountName: string;
    toAccountId: string | null;
    toAccountName: string | null;
    categoryId: string | null;
    categoryName: string | null;
    categoryColor: string | null;
    note: string | null;
    isActive: boolean;
  }[];
};

type AccountsResponse = {
  accounts: { id: string; name: string; isArchived: boolean }[];
};

type CategoriesResponse = {
  categories: { id: string; name: string; kind: string }[];
};

export default async function RecurringPage() {
  await requireSession();

  const [recurrenceData, accountData, categoryData] = await Promise.all([
    apiFetch<RecurrencesResponse>("/api/recurrences"),
    apiFetch<AccountsResponse>("/api/accounts"),
    apiFetch<CategoriesResponse>("/api/categories"),
  ]);

  const items = recurrenceData.recurrences.map((r) => {
    const freqLabel = RECUR_FREQ_LABELS[r.freq as RecurFreq] ?? r.freq;
    const nextRun = r.nextRunAt ? new Date(r.nextRunAt) : new Date();
    return {
      id: r.id,
      name: r.name,
      type: r.type,
      amount: r.amount,
      amountLabel: formatIDR(BigInt(r.amount)),
      typeLabel: TX_TYPE_LABELS[r.type as keyof typeof TX_TYPE_LABELS] ?? r.type,
      scheduleLabel: r.interval > 1 ? `Setiap ${r.interval} ${freqLabel.toLowerCase()}` : freqLabel,
      nextRunLabel: formatDate(nextRun),
      nextRunAt: nextRun.toISOString().slice(0, 10),
      accountId: r.accountId,
      accountName: r.accountName,
      toAccountId: r.toAccountId,
      toAccountName: r.toAccountName,
      categoryId: r.categoryId,
      categoryName: r.categoryName,
      categoryColor: r.categoryColor,
      note: r.note,
      isActive: r.isActive,
      freq: r.freq,
      interval: r.interval,
    };
  });

  const accounts = accountData.accounts
    .filter((a) => !a.isArchived)
    .map((a) => ({ id: a.id, name: a.name }));

  const categories = categoryData.categories.map((c) => ({
    id: c.id,
    name: c.name,
    kind: c.kind,
  }));

  return <RecurringView recurrences={items} accounts={accounts} categories={categories} />;
}
