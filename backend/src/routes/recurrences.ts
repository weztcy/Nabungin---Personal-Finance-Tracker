import { Router } from "express";

import { OK, iso, minorToNumber } from "@/lib/http";
import { toMinorUnits } from "@/lib/money";
import { recurrenceFormSchema, type RecurFreq } from "@/lib/validators/recurrence";
import { requireSession, type AuthedRequest } from "@/middleware/session";
import { prisma } from "@/prisma";

export const recurrencesRouter = Router();

recurrencesRouter.use(requireSession);

/** Tambah satu periode ke tanggal sesuai frekuensi & interval. */
function advance(date: Date, freq: RecurFreq, interval: number): Date {
  const next = new Date(date);
  switch (freq) {
    case "DAILY":
      next.setDate(next.getDate() + interval);
      break;
    case "WEEKLY":
      next.setDate(next.getDate() + 7 * interval);
      break;
    case "MONTHLY":
      next.setMonth(next.getMonth() + interval);
      break;
    case "YEARLY":
      next.setFullYear(next.getFullYear() + interval);
      break;
  }
  return next;
}

async function assertOwnership(
  userId: string,
  accountId: string,
  toAccountId: string | null,
  categoryId: string | null,
): Promise<string | null> {
  const account = await prisma.financeAccount.findFirst({
    where: { id: accountId, userId },
    select: { id: true },
  });
  if (!account) return "Akun tidak ditemukan";

  if (toAccountId) {
    const toAccount = await prisma.financeAccount.findFirst({
      where: { id: toAccountId, userId },
      select: { id: true },
    });
    if (!toAccount) return "Akun tujuan tidak ditemukan";
  }

  if (categoryId) {
    const category = await prisma.category.findFirst({
      where: { id: categoryId, userId },
      select: { id: true },
    });
    if (!category) return "Kategori tidak ditemukan";
  }

  return null;
}

/** POST /api/recurrences â†’ buat jadwal berulang. */
recurrencesRouter.post("/", async (req, res, next) => {
  try {
    const { user } = req as unknown as AuthedRequest;
    const parsed = recurrenceFormSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.issues[0]?.message ?? "Input tidak valid" });
      return;
    }

    const data = parsed.data;
    const toAccountId = data.type === "TRANSFER" ? data.toAccountId || null : null;
    const categoryId = data.type === "TRANSFER" ? null : data.categoryId || null;

    const ownershipError = await assertOwnership(user.id, data.accountId, toAccountId, categoryId);
    if (ownershipError) {
      res.status(400).json({ error: ownershipError });
      return;
    }

    const recurrence = await prisma.recurrence.create({
      data: {
        userId: user.id,
        name: data.name,
        type: data.type,
        amount: toMinorUnits(data.amount),
        freq: data.freq,
        interval: Number(data.interval),
        nextRunAt: new Date(data.nextRunAt),
        accountId: data.accountId,
        toAccountId,
        categoryId,
        note: data.note || null,
        isActive: data.isActive ?? true,
      },
    });

    res.status(201).json({ ...OK, id: recurrence.id });
  } catch (error) {
    next(error);
  }
});

/** PUT /api/recurrences/:id â†’ perbarui jadwal berulang. */
recurrencesRouter.put("/:id", async (req, res, next) => {
  try {
    const { user } = req as unknown as AuthedRequest;
    const { id } = req.params;
    const parsed = recurrenceFormSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.issues[0]?.message ?? "Input tidak valid" });
      return;
    }

    const existing = await prisma.recurrence.findFirst({
      where: { id, userId: user.id },
      select: { id: true },
    });
    if (!existing) {
      res.status(404).json({ error: "Transaksi berulang tidak ditemukan" });
      return;
    }

    const data = parsed.data;
    const toAccountId = data.type === "TRANSFER" ? data.toAccountId || null : null;
    const categoryId = data.type === "TRANSFER" ? null : data.categoryId || null;

    const ownershipError = await assertOwnership(user.id, data.accountId, toAccountId, categoryId);
    if (ownershipError) {
      res.status(400).json({ error: ownershipError });
      return;
    }

    await prisma.recurrence.update({
      where: { id },
      data: {
        name: data.name,
        type: data.type,
        amount: toMinorUnits(data.amount),
        freq: data.freq,
        interval: Number(data.interval),
        nextRunAt: new Date(data.nextRunAt),
        accountId: data.accountId,
        toAccountId,
        categoryId,
        note: data.note || null,
        isActive: data.isActive ?? true,
      },
    });

    res.json(OK);
  } catch (error) {
    next(error);
  }
});

recurrencesRouter.get("/", async (req, res, next) => {
  try {
    const { user } = req as unknown as AuthedRequest;
    const recurrences = await prisma.recurrence.findMany({
      where: { userId: user.id },
      orderBy: [{ isActive: "desc" }, { nextRunAt: "asc" }],
      select: {
        id: true,
        name: true,
        type: true,
        amount: true,
        freq: true,
        interval: true,
        nextRunAt: true,
        accountId: true,
        toAccountId: true,
        categoryId: true,
        note: true,
        isActive: true,
        account: { select: { name: true } },
        toAccount: { select: { name: true } },
        category: { select: { name: true, color: true } },
      },
    });

    res.json({
      recurrences: recurrences.map((r) => ({
        id: r.id,
        name: r.name,
        type: r.type,
        amount: minorToNumber(r.amount),
        freq: r.freq,
        interval: r.interval,
        nextRunAt: iso(r.nextRunAt),
        accountId: r.accountId,
        accountName: r.account.name,
        toAccountId: r.toAccountId,
        toAccountName: r.toAccount?.name ?? null,
        categoryId: r.categoryId,
        categoryName: r.category?.name ?? null,
        categoryColor: r.category?.color ?? null,
        note: r.note,
        isActive: r.isActive,
      })),
    });
  } catch (error) {
    next(error);
  }
});

/** POST /api/recurrences/:id/toggle-active â†’ jeda / aktifkan jadwal. */
recurrencesRouter.post("/:id/toggle-active", async (req, res, next) => {
  try {
    const { user } = req as unknown as AuthedRequest;
    const { id } = req.params;

    const existing = await prisma.recurrence.findFirst({
      where: { id, userId: user.id },
      select: { id: true, isActive: true },
    });
    if (!existing) {
      res.status(404).json({ error: "Transaksi berulang tidak ditemukan" });
      return;
    }

    await prisma.recurrence.update({
      where: { id },
      data: { isActive: !existing.isActive },
    });

    res.json(OK);
  } catch (error) {
    next(error);
  }
});

/** POST /api/recurrences/:id/run â†’ jalankan sekali sekarang & majukan jadwal. */
recurrencesRouter.post("/:id/run", async (req, res, next) => {
  try {
    const { user } = req as unknown as AuthedRequest;
    const { id } = req.params;

    const recurrence = await prisma.recurrence.findFirst({
      where: { id, userId: user.id },
    });
    if (!recurrence) {
      res.status(404).json({ error: "Transaksi berulang tidak ditemukan" });
      return;
    }

    const now = new Date();

    await prisma.$transaction([
      prisma.transaction.create({
        data: {
          userId: user.id,
          type: recurrence.type,
          amount: recurrence.amount,
          date: recurrence.nextRunAt,
          accountId: recurrence.accountId,
          toAccountId: recurrence.toAccountId,
          categoryId: recurrence.categoryId,
          note: recurrence.note,
          payee: recurrence.name,
          recurrenceId: recurrence.id,
        },
      }),
      prisma.recurrence.update({
        where: { id: recurrence.id },
        data: {
          lastRunAt: now,
          nextRunAt: advance(
            recurrence.nextRunAt,
            recurrence.freq as RecurFreq,
            recurrence.interval,
          ),
        },
      }),
    ]);

    res.json(OK);
  } catch (error) {
    next(error);
  }
});

/** DELETE /api/recurrences/:id â†’ hapus jadwal berulang. */
recurrencesRouter.delete("/:id", async (req, res, next) => {
  try {
    const { user } = req as unknown as AuthedRequest;
    const { id } = req.params;

    const existing = await prisma.recurrence.findFirst({
      where: { id, userId: user.id },
      select: { id: true },
    });
    if (!existing) {
      res.status(404).json({ error: "Transaksi berulang tidak ditemukan" });
      return;
    }

    await prisma.recurrence.delete({ where: { id } });
    res.json(OK);
  } catch (error) {
    next(error);
  }
});
