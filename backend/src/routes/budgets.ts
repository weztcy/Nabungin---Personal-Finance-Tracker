import { Router } from "express";

import { OK, iso, minorToNumber } from "@/lib/http";
import { toMinorUnits } from "@/lib/money";
import { budgetFormSchema } from "@/lib/validators/budget";
import { requireSession, type AuthedRequest } from "@/middleware/session";
import { prisma } from "@/prisma";
import { getBudgetsWithProgress } from "@/services/finance";

export const budgetsRouter = Router();

budgetsRouter.use(requireSession);

async function assertLinks(
  userId: string,
  categoryId: string | null,
  accountId: string | null,
): Promise<string | null> {
  if (categoryId) {
    const category = await prisma.category.findFirst({
      where: { id: categoryId, userId },
      select: { id: true },
    });
    if (!category) return "Kategori tidak ditemukan";
  }
  if (accountId) {
    const account = await prisma.financeAccount.findFirst({
      where: { id: accountId, userId },
      select: { id: true },
    });
    if (!account) return "Akun tidak ditemukan";
  }
  return null;
}

/** GET /api/budgets â†’ daftar budget + realisasi pada periodenya. */
budgetsRouter.get("/", async (req, res, next) => {
  try {
    const { user } = req as unknown as AuthedRequest;
    const budgets = await getBudgetsWithProgress(user.id);

    res.json({
      budgets: budgets.map((budget) => ({
        id: budget.id,
        name: budget.name,
        amount: minorToNumber(budget.amount),
        periodStart: iso(budget.periodStart),
        periodEnd: iso(budget.periodEnd),
        frequency: budget.frequency,
        categoryId: budget.categoryId,
        categoryName: budget.categoryName,
        categoryColor: budget.categoryColor,
        accountId: budget.accountId,
        accountName: budget.accountName,
        spent: minorToNumber(budget.spent),
        remaining: minorToNumber(budget.remaining),
        percent: budget.percent,
      })),
    });
  } catch (error) {
    next(error);
  }
});

/** POST /api/budgets â†’ buat budget. */
budgetsRouter.post("/", async (req, res, next) => {
  try {
    const { user } = req as unknown as AuthedRequest;
    const parsed = budgetFormSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.issues[0]?.message ?? "Input tidak valid" });
      return;
    }

    const data = parsed.data;
    const linkError = await assertLinks(user.id, data.categoryId || null, data.accountId || null);
    if (linkError) {
      res.status(400).json({ error: linkError });
      return;
    }

    const budget = await prisma.budget.create({
      data: {
        userId: user.id,
        name: data.name,
        amount: toMinorUnits(data.amount),
        periodStart: new Date(data.periodStart),
        periodEnd: new Date(data.periodEnd),
        frequency: data.frequency,
        categoryId: data.categoryId || null,
        accountId: data.accountId || null,
      },
    });

    res.status(201).json({ ...OK, id: budget.id });
  } catch (error) {
    next(error);
  }
});

/** PUT /api/budgets/:id â†’ perbarui budget. */
budgetsRouter.put("/:id", async (req, res, next) => {
  try {
    const { user } = req as unknown as AuthedRequest;
    const { id } = req.params;
    const parsed = budgetFormSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.issues[0]?.message ?? "Input tidak valid" });
      return;
    }

    const existing = await prisma.budget.findFirst({
      where: { id, userId: user.id },
      select: { id: true },
    });
    if (!existing) {
      res.status(404).json({ error: "Budget tidak ditemukan" });
      return;
    }

    const data = parsed.data;
    const linkError = await assertLinks(user.id, data.categoryId || null, data.accountId || null);
    if (linkError) {
      res.status(400).json({ error: linkError });
      return;
    }

    await prisma.budget.update({
      where: { id },
      data: {
        name: data.name,
        amount: toMinorUnits(data.amount),
        periodStart: new Date(data.periodStart),
        periodEnd: new Date(data.periodEnd),
        frequency: data.frequency,
        categoryId: data.categoryId || null,
        accountId: data.accountId || null,
      },
    });

    res.json(OK);
  } catch (error) {
    next(error);
  }
});

/** DELETE /api/budgets/:id â†’ hapus budget. */
budgetsRouter.delete("/:id", async (req, res, next) => {
  try {
    const { user } = req as unknown as AuthedRequest;
    const { id } = req.params;

    const existing = await prisma.budget.findFirst({
      where: { id, userId: user.id },
      select: { id: true },
    });
    if (!existing) {
      res.status(404).json({ error: "Budget tidak ditemukan" });
      return;
    }

    await prisma.budget.delete({ where: { id } });
    res.json(OK);
  } catch (error) {
    next(error);
  }
});
