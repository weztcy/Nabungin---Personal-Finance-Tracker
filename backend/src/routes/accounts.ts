import { Router } from "express";

import { OK, minorToNumber } from "@/lib/http";
import { toMinorUnits } from "@/lib/money";
import { accountFormSchema } from "@/lib/validators/account";
import { requireSession, type AuthedRequest } from "@/middleware/session";
import { prisma } from "@/prisma";
import { getAccountsWithBalances } from "@/services/finance";

export const accountsRouter = Router();

accountsRouter.use(requireSession);

/** GET /api/accounts â†’ daftar akun + saldo terhitung. */
accountsRouter.get("/", async (req, res, next) => {
  try {
    const { user } = req as unknown as AuthedRequest;
    const accounts = await getAccountsWithBalances(user.id);

    res.json({
      accounts: accounts.map((account) => ({
        id: account.id,
        name: account.name,
        type: account.type,
        color: account.color,
        icon: account.icon,
        isArchived: account.isArchived,
        sortOrder: account.sortOrder,
        openingBalance: minorToNumber(account.openingBalance),
        balance: minorToNumber(account.balance),
      })),
    });
  } catch (error) {
    next(error);
  }
});

/** POST /api/accounts â†’ buat akun baru. */
accountsRouter.post("/", async (req, res, next) => {
  try {
    const { user } = req as unknown as AuthedRequest;
    const parsed = accountFormSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.issues[0]?.message ?? "Input tidak valid" });
      return;
    }

    const data = parsed.data;
    const account = await prisma.financeAccount.create({
      data: {
        userId: user.id,
        name: data.name,
        type: data.type,
        color: data.color || null,
        icon: data.icon || null,
        openingBalance: toMinorUnits(data.openingBalance),
      },
    });

    res.status(201).json({ ...OK, id: account.id });
  } catch (error) {
    next(error);
  }
});

/** PUT /api/accounts/:id â†’ perbarui akun. */
accountsRouter.put("/:id", async (req, res, next) => {
  try {
    const { user } = req as unknown as AuthedRequest;
    const { id } = req.params;
    const parsed = accountFormSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.issues[0]?.message ?? "Input tidak valid" });
      return;
    }

    const existing = await prisma.financeAccount.findFirst({
      where: { id, userId: user.id },
      select: { id: true },
    });
    if (!existing) {
      res.status(404).json({ error: "Akun tidak ditemukan" });
      return;
    }

    const data = parsed.data;
    await prisma.financeAccount.update({
      where: { id },
      data: {
        name: data.name,
        type: data.type,
        color: data.color || null,
        icon: data.icon || null,
        openingBalance: toMinorUnits(data.openingBalance),
      },
    });

    res.json(OK);
  } catch (error) {
    next(error);
  }
});

/** POST /api/accounts/:id/toggle-archived â†’ aktifkan/arsipkan akun. */
accountsRouter.post("/:id/toggle-archived", async (req, res, next) => {
  try {
    const { user } = req as unknown as AuthedRequest;
    const { id } = req.params;

    const existing = await prisma.financeAccount.findFirst({
      where: { id, userId: user.id },
      select: { id: true, isArchived: true },
    });
    if (!existing) {
      res.status(404).json({ error: "Akun tidak ditemukan" });
      return;
    }

    await prisma.financeAccount.update({
      where: { id },
      data: { isArchived: !existing.isArchived },
    });

    res.json(OK);
  } catch (error) {
    next(error);
  }
});

/** DELETE /api/accounts/:id â†’ hapus akun (hanya bila belum dipakai transaksi). */
accountsRouter.delete("/:id", async (req, res, next) => {
  try {
    const { user } = req as unknown as AuthedRequest;
    const { id } = req.params;

    const existing = await prisma.financeAccount.findFirst({
      where: { id, userId: user.id },
      select: { id: true },
    });
    if (!existing) {
      res.status(404).json({ error: "Akun tidak ditemukan" });
      return;
    }

    const usedByTx = await prisma.transaction.count({
      where: { userId: user.id, OR: [{ accountId: id }, { toAccountId: id }] },
    });
    if (usedByTx > 0) {
      res.status(409).json({
        error: "Akun memiliki transaksi. Arsipkan saja agar riwayat tetap utuh.",
      });
      return;
    }

    await prisma.financeAccount.delete({ where: { id } });
    res.json(OK);
  } catch (error) {
    next(error);
  }
});
