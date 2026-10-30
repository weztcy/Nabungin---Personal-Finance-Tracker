import { Router } from "express";

import { OK, iso, minorToNumber } from "@/lib/http";
import { toMinorUnits } from "@/lib/money";
import { transactionFormSchema } from "@/lib/validators/transaction";
import { requireSession, type AuthedRequest } from "@/middleware/session";
import { prisma } from "@/prisma";

export const transactionsRouter = Router();

transactionsRouter.use(requireSession);

/** Validasi bahwa akun & kategori milik user. Mengembalikan pesan error bila tidak. */
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

/** GET /api/transactions?take=200 â†’ daftar transaksi terbaru. */
transactionsRouter.get("/", async (req, res, next) => {
  try {
    const { user } = req as unknown as AuthedRequest;
    const take = Math.min(Number(req.query.take ?? 200) || 200, 500);

    const transactions = await prisma.transaction.findMany({
      where: { userId: user.id },
      orderBy: [{ date: "desc" }, { createdAt: "desc" }],
      take,
      select: {
        id: true,
        type: true,
        amount: true,
        date: true,
        accountId: true,
        toAccountId: true,
        categoryId: true,
        note: true,
        payee: true,
        account: { select: { name: true } },
        toAccount: { select: { name: true } },
        category: { select: { name: true, color: true } },
      },
    });

    res.json({
      transactions: transactions.map((tx) => ({
        id: tx.id,
        type: tx.type,
        amount: minorToNumber(tx.amount),
        date: iso(tx.date),
        accountId: tx.accountId,
        accountName: tx.account.name,
        toAccountId: tx.toAccountId,
        toAccountName: tx.toAccount?.name ?? null,
        categoryId: tx.categoryId,
        categoryName: tx.category?.name ?? null,
        categoryColor: tx.category?.color ?? null,
        note: tx.note,
        payee: tx.payee,
      })),
    });
  } catch (error) {
    next(error);
  }
});

/** POST /api/transactions â†’ buat transaksi. */
transactionsRouter.post("/", async (req, res, next) => {
  try {
    const { user } = req as unknown as AuthedRequest;
    const parsed = transactionFormSchema.safeParse(req.body);
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

    const tx = await prisma.transaction.create({
      data: {
        userId: user.id,
        type: data.type,
        amount: toMinorUnits(data.amount),
        date: new Date(data.date),
        accountId: data.accountId,
        toAccountId,
        categoryId,
        note: data.note || null,
        payee: data.payee || null,
      },
    });

    res.status(201).json({ ...OK, id: tx.id });
  } catch (error) {
    next(error);
  }
});

/** PUT /api/transactions/:id â†’ perbarui transaksi. */
transactionsRouter.put("/:id", async (req, res, next) => {
  try {
    const { user } = req as unknown as AuthedRequest;
    const { id } = req.params;
    const parsed = transactionFormSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.issues[0]?.message ?? "Input tidak valid" });
      return;
    }

    const existing = await prisma.transaction.findFirst({
      where: { id, userId: user.id },
      select: { id: true },
    });
    if (!existing) {
      res.status(404).json({ error: "Transaksi tidak ditemukan" });
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

    await prisma.transaction.update({
      where: { id },
      data: {
        type: data.type,
        amount: toMinorUnits(data.amount),
        date: new Date(data.date),
        accountId: data.accountId,
        toAccountId,
        categoryId,
        note: data.note || null,
        payee: data.payee || null,
      },
    });

    res.json(OK);
  } catch (error) {
    next(error);
  }
});

/** DELETE /api/transactions/:id â†’ hapus transaksi. */
transactionsRouter.delete("/:id", async (req, res, next) => {
  try {
    const { user } = req as unknown as AuthedRequest;
    const { id } = req.params;

    const existing = await prisma.transaction.findFirst({
      where: { id, userId: user.id },
      select: { id: true },
    });
    if (!existing) {
      res.status(404).json({ error: "Transaksi tidak ditemukan" });
      return;
    }

    await prisma.transaction.delete({ where: { id } });
    res.json(OK);
  } catch (error) {
    next(error);
  }
});
