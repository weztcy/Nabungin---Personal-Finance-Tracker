import { prisma } from "@/prisma";

/**
 * Hitung saldo tiap akun keuangan dari openingBalance + seluruh transaksi.
 *
 * - INCOME  → +amount ke akun sumber
 * - EXPENSE → -amount dari akun sumber
 * - TRANSFER → -amount dari akun sumber, +amount ke akun tujuan
 */
export type AccountWithBalance = {
  id: string;
  name: string;
  type: string;
  color: string | null;
  icon: string | null;
  openingBalance: bigint;
  isArchived: boolean;
  sortOrder: number;
  balance: bigint;
};

export async function getAccountsWithBalances(userId: string): Promise<AccountWithBalance[]> {
  const accounts = await prisma.financeAccount.findMany({
    where: { userId },
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
  });

  const deltas = await prisma.transaction.groupBy({
    by: ["accountId", "type"],
    where: { userId },
    _sum: { amount: true },
  });

  const outgoing = await prisma.transaction.groupBy({
    by: ["toAccountId"],
    where: { userId, type: "TRANSFER", toAccountId: { not: null } },
    _sum: { amount: true },
  });

  const deltaByAccount = new Map<string, bigint>();
  const bump = (id: string, value: bigint) => {
    deltaByAccount.set(id, (deltaByAccount.get(id) ?? 0n) + value);
  };

  for (const row of deltas) {
    const amount = row._sum.amount ?? 0n;
    if (row.type === "INCOME") bump(row.accountId, amount);
    else if (row.type === "EXPENSE") bump(row.accountId, -amount);
    else bump(row.accountId, -amount); // TRANSFER keluar dari akun sumber
  }

  for (const row of outgoing) {
    if (row.toAccountId) bump(row.toAccountId, row._sum.amount ?? 0n);
  }

  return accounts.map((account) => ({
    id: account.id,
    name: account.name,
    type: account.type,
    color: account.color,
    icon: account.icon,
    openingBalance: account.openingBalance,
    isArchived: account.isArchived,
    sortOrder: account.sortOrder,
    balance: account.openingBalance + (deltaByAccount.get(account.id) ?? 0n),
  }));
}

/** Total kekayaan bersih (net worth) = jumlah saldo seluruh akun tidak diarsipkan. */
export async function getNetWorth(userId: string): Promise<bigint> {
  const accounts = await getAccountsWithBalances(userId);
  return accounts.filter((a) => !a.isArchived).reduce<bigint>((acc, a) => acc + a.balance, 0n);
}

export type MonthlySummary = {
  income: bigint;
  expense: bigint;
  net: bigint;
  byCategory: { categoryId: string | null; name: string; color: string | null; total: bigint }[];
};

/** Ringkasan pemasukan/pengeluaran pada rentang tanggal tertentu. */
export async function getSummary(userId: string, from: Date, to: Date): Promise<MonthlySummary> {
  const [incomeRows, expenseRows, grouping] = await Promise.all([
    prisma.transaction.aggregate({
      where: { userId, type: "INCOME", date: { gte: from, lt: to } },
      _sum: { amount: true },
    }),
    prisma.transaction.aggregate({
      where: { userId, type: "EXPENSE", date: { gte: from, lt: to } },
      _sum: { amount: true },
    }),
    prisma.transaction.groupBy({
      by: ["categoryId"],
      where: { userId, type: "EXPENSE", date: { gte: from, lt: to } },
      _sum: { amount: true },
    }),
  ]);

  const income = incomeRows._sum.amount ?? 0n;
  const expense = expenseRows._sum.amount ?? 0n;

  const categoryIds = grouping.map((g) => g.categoryId).filter((id): id is string => id !== null);

  const categories = await prisma.category.findMany({
    where: { id: { in: categoryIds } },
    select: { id: true, name: true, color: true },
  });

  const byCategory = grouping
    .map((g) => {
      const category = categories.find((c) => c.id === g.categoryId);
      return {
        categoryId: g.categoryId,
        name: category?.name ?? "Tanpa kategori",
        color: category?.color ?? null,
        total: g._sum.amount ?? 0n,
      };
    })
    .sort((a, b) => (b.total > a.total ? 1 : b.total < a.total ? -1 : 0));

  return { income, expense, net: income - expense, byCategory };
}

/** Timeline arus kas harian selama rentang tertentu (untuk chart). */
export async function getCashflowTimeline(userId: string, from: Date, to: Date) {
  const txs = await prisma.transaction.findMany({
    where: { userId, type: { in: ["INCOME", "EXPENSE"] }, date: { gte: from, lt: to } },
    select: { type: true, amount: true, date: true },
    orderBy: { date: "asc" },
  });

  const map = new Map<string, { income: bigint; expense: bigint }>();
  for (const tx of txs) {
    const key = tx.date.toISOString().slice(0, 10);
    const entry = map.get(key) ?? { income: 0n, expense: 0n };
    if (tx.type === "INCOME") entry.income += tx.amount;
    else entry.expense += tx.amount;
    map.set(key, entry);
  }

  return Array.from(map.entries()).map(([date, value]) => ({
    date,
    income: value.income,
    expense: value.expense,
  }));
}

export type BudgetWithProgress = {
  id: string;
  name: string;
  amount: bigint;
  periodStart: Date;
  periodEnd: Date;
  frequency: string;
  categoryId: string | null;
  categoryName: string | null;
  categoryColor: string | null;
  accountId: string | null;
  accountName: string | null;
  spent: bigint;
  remaining: bigint;
  percent: number;
};

/**
 * Daftar budget beserta realisasi belanja pada periodenya.
 * Realisasi dihitung dari transaksi EXPENSE di dalam rentang periode
 * (difilter per kategori &/atau akun bila budget diikat ke salah satunya).
 */
export async function getBudgetsWithProgress(userId: string): Promise<BudgetWithProgress[]> {
  const budgets = await prisma.budget.findMany({
    where: { userId },
    orderBy: [{ periodStart: "desc" }, { createdAt: "desc" }],
    include: {
      category: { select: { name: true, color: true } },
      account: { select: { name: true } },
    },
  });

  const result: BudgetWithProgress[] = [];

  for (const budget of budgets) {
    const agg = await prisma.transaction.aggregate({
      where: {
        userId,
        type: "EXPENSE",
        date: { gte: budget.periodStart, lte: budget.periodEnd },
        ...(budget.categoryId ? { categoryId: budget.categoryId } : {}),
        ...(budget.accountId ? { accountId: budget.accountId } : {}),
      },
      _sum: { amount: true },
    });

    const spent = agg._sum.amount ?? 0n;
    const remaining = budget.amount - spent;
    const percent = budget.amount > 0n ? Number((spent * 10000n) / budget.amount) / 100 : 0;

    result.push({
      id: budget.id,
      name: budget.name,
      amount: budget.amount,
      periodStart: budget.periodStart,
      periodEnd: budget.periodEnd,
      frequency: budget.frequency,
      categoryId: budget.categoryId,
      categoryName: budget.category?.name ?? null,
      categoryColor: budget.category?.color ?? null,
      accountId: budget.accountId,
      accountName: budget.account?.name ?? null,
      spent,
      remaining,
      percent,
    });
  }

  return result;
}

export type GoalWithProgress = {
  id: string;
  name: string;
  targetAmount: bigint;
  savedAmount: bigint;
  targetDate: Date | null;
  color: string | null;
  isCompleted: boolean;
  accountId: string | null;
  accountName: string | null;
  percent: number;
};

/** Daftar target tabungan beserta progresnya. */
export async function getGoalsWithProgress(userId: string): Promise<GoalWithProgress[]> {
  const goals = await prisma.goal.findMany({
    where: { userId },
    orderBy: [{ isCompleted: "asc" }, { createdAt: "desc" }],
    include: { account: { select: { name: true } } },
  });

  return goals.map((goal) => ({
    id: goal.id,
    name: goal.name,
    targetAmount: goal.targetAmount,
    savedAmount: goal.savedAmount,
    targetDate: goal.targetDate,
    color: goal.color,
    isCompleted: goal.isCompleted,
    accountId: goal.accountId,
    accountName: goal.account?.name ?? null,
    percent:
      goal.targetAmount > 0n ? Number((goal.savedAmount * 10000n) / goal.targetAmount) / 100 : 0,
  }));
}
