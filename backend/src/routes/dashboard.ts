import { Router } from "express";

import { iso, minorToNumber } from "@/lib/http";
import { requireSession, type AuthedRequest } from "@/middleware/session";
import { prisma } from "@/prisma";
import {
  getAccountsWithBalances,
  getBudgetsWithProgress,
  getCashflowTimeline,
  getGoalsWithProgress,
  getSummary,
} from "@/services/finance";

export const dashboardRouter = Router();

dashboardRouter.use(requireSession);

function currentMonthRange(now: Date = new Date()) {
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  return { start, end };
}

/**
 * GET /api/dashboard?month=yyyy-MM
 * Semua data yang dibutuhkan halaman dashboard dalam satu payload.
 */
dashboardRouter.get("/", async (req, res, next) => {
  try {
    const { user } = req as unknown as AuthedRequest;

    const monthParam = typeof req.query.month === "string" ? req.query.month : undefined;
    let { start, end } = currentMonthRange();
    if (monthParam && /^\d{4}-\d{2}$/.test(monthParam)) {
      const [y, m] = monthParam.split("-").map(Number);
      start = new Date(y, m - 1, 1);
      end = new Date(y, m, 1);
    }

    const [accounts, summary, timeline, recent, budgets, goals] = await Promise.all([
      getAccountsWithBalances(user.id),
      getSummary(user.id, start, end),
      getCashflowTimeline(user.id, start, end),
      prisma.transaction.findMany({
        where: { userId: user.id },
        orderBy: [{ date: "desc" }, { createdAt: "desc" }],
        take: 6,
        select: {
          id: true,
          type: true,
          amount: true,
          date: true,
          payee: true,
          note: true,
          account: { select: { name: true } },
          toAccount: { select: { name: true } },
          category: { select: { name: true, color: true } },
        },
      }),
      getBudgetsWithProgress(user.id),
      getGoalsWithProgress(user.id),
    ]);

    const netWorth = accounts
      .filter((a) => !a.isArchived)
      .reduce<bigint>((acc, a) => acc + a.balance, 0n);

    res.json({
      month: { start: iso(start), end: iso(end) },
      netWorth: minorToNumber(netWorth),
      activeAccountCount: accounts.filter((a) => !a.isArchived).length,
      summary: {
        income: minorToNumber(summary.income),
        expense: minorToNumber(summary.expense),
        net: minorToNumber(summary.net),
        byCategory: summary.byCategory.map((item) => ({
          categoryId: item.categoryId,
          name: item.name,
          color: item.color,
          total: minorToNumber(item.total),
        })),
      },
      timeline: timeline.map((point) => ({
        date: point.date,
        income: minorToNumber(point.income),
        expense: minorToNumber(point.expense),
      })),
      recentTransactions: recent.map((tx) => ({
        id: tx.id,
        type: tx.type,
        amount: minorToNumber(tx.amount),
        date: iso(tx.date),
        payee: tx.payee,
        note: tx.note,
        accountName: tx.account.name,
        toAccountName: tx.toAccount?.name ?? null,
        categoryName: tx.category?.name ?? null,
        categoryColor: tx.category?.color ?? null,
      })),
      accounts: accounts.map((account) => ({
        id: account.id,
        name: account.name,
        type: account.type,
        color: account.color,
        isArchived: account.isArchived,
        balance: minorToNumber(account.balance),
      })),
      budgets: budgets.map((budget) => ({
        id: budget.id,
        name: budget.name,
        amount: minorToNumber(budget.amount),
        spent: minorToNumber(budget.spent),
        remaining: minorToNumber(budget.remaining),
        percent: budget.percent,
        periodStart: iso(budget.periodStart),
        periodEnd: iso(budget.periodEnd),
      })),
      goals: goals.map((goal) => ({
        id: goal.id,
        name: goal.name,
        targetAmount: minorToNumber(goal.targetAmount),
        savedAmount: minorToNumber(goal.savedAmount),
        percent: goal.percent,
        isCompleted: goal.isCompleted,
      })),
    });
  } catch (error) {
    next(error);
  }
});
