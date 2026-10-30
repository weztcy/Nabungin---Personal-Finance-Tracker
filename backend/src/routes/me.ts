import { Router } from "express";

import { requireSession, type AuthedRequest } from "@/middleware/session";
import { prisma } from "@/prisma";

export const meRouter = Router();

meRouter.use(requireSession);

/** GET /api/me â†’ profil user + jumlah data (untuk halaman pengaturan). */
meRouter.get("/", async (req, res, next) => {
  try {
    const { user } = req as unknown as AuthedRequest;

    const [profile, accounts, categories, transactions, budgets, goals, recurrences] =
      await Promise.all([
        prisma.user.findUnique({
          where: { id: user.id },
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
            baseCurrency: true,
            timezone: true,
            createdAt: true,
          },
        }),
        prisma.financeAccount.count({ where: { userId: user.id } }),
        prisma.category.count({ where: { userId: user.id } }),
        prisma.transaction.count({ where: { userId: user.id } }),
        prisma.budget.count({ where: { userId: user.id } }),
        prisma.goal.count({ where: { userId: user.id } }),
        prisma.recurrence.count({ where: { userId: user.id } }),
      ]);

    if (!profile) {
      res.status(404).json({ error: "User tidak ditemukan" });
      return;
    }

    res.json({
      user: {
        id: profile.id,
        name: profile.name,
        email: profile.email,
        image: profile.image,
        baseCurrency: profile.baseCurrency,
        timezone: profile.timezone,
        createdAt: profile.createdAt.toISOString(),
      },
      stats: {
        accounts,
        categories,
        transactions,
        budgets,
        goals,
        recurrences,
      },
    });
  } catch (error) {
    next(error);
  }
});
