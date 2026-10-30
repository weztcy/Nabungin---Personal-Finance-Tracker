import { Router } from "express";

import { OK, iso, minorToNumber } from "@/lib/http";
import { toMinorUnits } from "@/lib/money";
import { goalContributionSchema, goalFormSchema } from "@/lib/validators/goal";
import { requireSession, type AuthedRequest } from "@/middleware/session";
import { prisma } from "@/prisma";
import { getGoalsWithProgress } from "@/services/finance";

export const goalsRouter = Router();

goalsRouter.use(requireSession);

/** GET /api/goals â†’ daftar target tabungan + progres. */
goalsRouter.get("/", async (req, res, next) => {
  try {
    const { user } = req as unknown as AuthedRequest;
    const goals = await getGoalsWithProgress(user.id);

    res.json({
      goals: goals.map((goal) => ({
        id: goal.id,
        name: goal.name,
        targetAmount: minorToNumber(goal.targetAmount),
        savedAmount: minorToNumber(goal.savedAmount),
        targetDate: iso(goal.targetDate),
        color: goal.color,
        isCompleted: goal.isCompleted,
        accountId: goal.accountId,
        accountName: goal.accountName,
        percent: goal.percent,
      })),
    });
  } catch (error) {
    next(error);
  }
});

/** POST /api/goals â†’ buat target. */
goalsRouter.post("/", async (req, res, next) => {
  try {
    const { user } = req as unknown as AuthedRequest;
    const parsed = goalFormSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.issues[0]?.message ?? "Input tidak valid" });
      return;
    }

    const data = parsed.data;
    if (data.accountId) {
      const account = await prisma.financeAccount.findFirst({
        where: { id: data.accountId, userId: user.id },
        select: { id: true },
      });
      if (!account) {
        res.status(400).json({ error: "Akun tidak ditemukan" });
        return;
      }
    }

    const goal = await prisma.goal.create({
      data: {
        userId: user.id,
        name: data.name,
        targetAmount: toMinorUnits(data.targetAmount),
        savedAmount: toMinorUnits(data.savedAmount),
        targetDate: data.targetDate ? new Date(data.targetDate) : null,
        color: data.color || null,
        accountId: data.accountId || null,
      },
    });

    res.status(201).json({ ...OK, id: goal.id });
  } catch (error) {
    next(error);
  }
});

/** PUT /api/goals/:id â†’ perbarui target. */
goalsRouter.put("/:id", async (req, res, next) => {
  try {
    const { user } = req as unknown as AuthedRequest;
    const { id } = req.params;
    const parsed = goalFormSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.issues[0]?.message ?? "Input tidak valid" });
      return;
    }

    const existing = await prisma.goal.findFirst({
      where: { id, userId: user.id },
      select: { id: true },
    });
    if (!existing) {
      res.status(404).json({ error: "Target tidak ditemukan" });
      return;
    }

    const data = parsed.data;
    if (data.accountId) {
      const account = await prisma.financeAccount.findFirst({
        where: { id: data.accountId, userId: user.id },
        select: { id: true },
      });
      if (!account) {
        res.status(400).json({ error: "Akun tidak ditemukan" });
        return;
      }
    }

    await prisma.goal.update({
      where: { id },
      data: {
        name: data.name,
        targetAmount: toMinorUnits(data.targetAmount),
        savedAmount: toMinorUnits(data.savedAmount),
        targetDate: data.targetDate ? new Date(data.targetDate) : null,
        color: data.color || null,
        accountId: data.accountId || null,
      },
    });

    res.json(OK);
  } catch (error) {
    next(error);
  }
});

/** POST /api/goals/:id/contribute â†’ tambah dana ke target. */
goalsRouter.post("/:id/contribute", async (req, res, next) => {
  try {
    const { user } = req as unknown as AuthedRequest;
    const { id } = req.params;
    const parsed = goalContributionSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.issues[0]?.message ?? "Input tidak valid" });
      return;
    }

    const existing = await prisma.goal.findFirst({
      where: { id, userId: user.id },
      select: { id: true, savedAmount: true },
    });
    if (!existing) {
      res.status(404).json({ error: "Target tidak ditemukan" });
      return;
    }

    await prisma.goal.update({
      where: { id },
      data: { savedAmount: existing.savedAmount + toMinorUnits(parsed.data.amount) },
    });

    res.json(OK);
  } catch (error) {
    next(error);
  }
});

/** POST /api/goals/:id/toggle-completed â†’ tandai selesai / buka kembali. */
goalsRouter.post("/:id/toggle-completed", async (req, res, next) => {
  try {
    const { user } = req as unknown as AuthedRequest;
    const { id } = req.params;

    const existing = await prisma.goal.findFirst({
      where: { id, userId: user.id },
      select: { id: true, isCompleted: true },
    });
    if (!existing) {
      res.status(404).json({ error: "Target tidak ditemukan" });
      return;
    }

    await prisma.goal.update({
      where: { id },
      data: { isCompleted: !existing.isCompleted },
    });

    res.json(OK);
  } catch (error) {
    next(error);
  }
});

/** DELETE /api/goals/:id â†’ hapus target. */
goalsRouter.delete("/:id", async (req, res, next) => {
  try {
    const { user } = req as unknown as AuthedRequest;
    const { id } = req.params;

    const existing = await prisma.goal.findFirst({
      where: { id, userId: user.id },
      select: { id: true },
    });
    if (!existing) {
      res.status(404).json({ error: "Target tidak ditemukan" });
      return;
    }

    await prisma.goal.delete({ where: { id } });
    res.json(OK);
  } catch (error) {
    next(error);
  }
});
