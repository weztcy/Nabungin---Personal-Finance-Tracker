import { Router } from "express";

import { OK } from "@/lib/http";
import { categoryFormSchema } from "@/lib/validators/category";
import { requireSession, type AuthedRequest } from "@/middleware/session";
import { prisma } from "@/prisma";

export const categoriesRouter = Router();

categoriesRouter.use(requireSession);

/** GET /api/categories â†’ daftar kategori milik user. */
categoriesRouter.get("/", async (req, res, next) => {
  try {
    const { user } = req as unknown as AuthedRequest;
    const categories = await prisma.category.findMany({
      where: { userId: user.id },
      orderBy: [{ kind: "asc" }, { name: "asc" }],
      select: { id: true, name: true, kind: true, color: true, icon: true, parentId: true },
    });
    res.json({ categories });
  } catch (error) {
    next(error);
  }
});

/** POST /api/categories â†’ buat kategori. */
categoriesRouter.post("/", async (req, res, next) => {
  try {
    const { user } = req as unknown as AuthedRequest;
    const parsed = categoryFormSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.issues[0]?.message ?? "Input tidak valid" });
      return;
    }

    const data = parsed.data;
    const duplicate = await prisma.category.findFirst({
      where: { userId: user.id, name: data.name, kind: data.kind },
      select: { id: true },
    });
    if (duplicate) {
      res.status(409).json({ error: "Kategori dengan nama & jenis ini sudah ada" });
      return;
    }

    if (data.parentId) {
      const parent = await prisma.category.findFirst({
        where: { id: data.parentId, userId: user.id },
        select: { id: true },
      });
      if (!parent) {
        res.status(400).json({ error: "Kategori induk tidak ditemukan" });
        return;
      }
    }

    const category = await prisma.category.create({
      data: {
        userId: user.id,
        name: data.name,
        kind: data.kind,
        color: data.color || null,
        icon: data.icon || null,
        parentId: data.parentId || null,
      },
    });

    res.status(201).json({ ...OK, id: category.id });
  } catch (error) {
    next(error);
  }
});

/** PUT /api/categories/:id â†’ perbarui kategori. */
categoriesRouter.put("/:id", async (req, res, next) => {
  try {
    const { user } = req as unknown as AuthedRequest;
    const { id } = req.params;
    const parsed = categoryFormSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.issues[0]?.message ?? "Input tidak valid" });
      return;
    }

    const existing = await prisma.category.findFirst({
      where: { id, userId: user.id },
      select: { id: true },
    });
    if (!existing) {
      res.status(404).json({ error: "Kategori tidak ditemukan" });
      return;
    }

    const data = parsed.data;
    const duplicate = await prisma.category.findFirst({
      where: { userId: user.id, name: data.name, kind: data.kind, NOT: { id } },
      select: { id: true },
    });
    if (duplicate) {
      res.status(409).json({ error: "Kategori dengan nama & jenis ini sudah ada" });
      return;
    }

    await prisma.category.update({
      where: { id },
      data: {
        name: data.name,
        kind: data.kind,
        color: data.color || null,
        icon: data.icon || null,
        parentId: data.parentId && data.parentId !== id ? data.parentId : null,
      },
    });

    res.json(OK);
  } catch (error) {
    next(error);
  }
});

/** DELETE /api/categories/:id â†’ hapus kategori (hanya bila belum dipakai). */
categoriesRouter.delete("/:id", async (req, res, next) => {
  try {
    const { user } = req as unknown as AuthedRequest;
    const { id } = req.params;

    const existing = await prisma.category.findFirst({
      where: { id, userId: user.id },
      select: { id: true },
    });
    if (!existing) {
      res.status(404).json({ error: "Kategori tidak ditemukan" });
      return;
    }

    const usedByTx = await prisma.transaction.count({
      where: { userId: user.id, categoryId: id },
    });
    if (usedByTx > 0) {
      res.status(409).json({
        error: "Kategori masih dipakai transaksi. Hapus/ubah transaksinya dulu.",
      });
      return;
    }

    await prisma.category.delete({ where: { id } });
    res.json(OK);
  } catch (error) {
    next(error);
  }
});
