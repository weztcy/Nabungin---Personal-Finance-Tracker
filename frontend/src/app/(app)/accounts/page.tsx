import type { Metadata } from "next";

import { AccountsView } from "@/components/features/accounts/accounts-view";
import { apiFetch } from "@/lib/api-server";
import { formatIDR } from "@/lib/money";
import { requireSession } from "@/lib/session";

export const metadata: Metadata = {
  title: "Akun",
};

export const instant = false;

type AccountsResponse = {
  accounts: {
    id: string;
    name: string;
    type: string;
    color: string | null;
    isArchived: boolean;
    openingBalance: number;
    balance: number;
  }[];
};

export default async function AccountsPage() {
  await requireSession();
  const { accounts } = await apiFetch<AccountsResponse>("/api/accounts");

  const items = accounts.map((account) => ({
    id: account.id,
    name: account.name,
    type: account.type,
    color: account.color,
    isArchived: account.isArchived,
    openingBalance: account.openingBalance,
    balanceLabel: formatIDR(BigInt(account.balance)),
    balanceNegative: account.balance < 0,
  }));

  return <AccountsView accounts={items} />;
}
