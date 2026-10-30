import { Router } from "express";

import { iso, minorToNumber } from "@/lib/http";
import { requireSession, type AuthedRequest } from "@/middleware/session";
import { adjacentMonthKey, getMonthlyReport } from "@/services/reports";

export const reportsRouter = Router();

reportsRouter.use(requireSession);

/**
 * GET /api/reports?month=yyyy-MM
 * Laporan bulanan: ringkasan, tren beberapa bulan, rincian per kategori.
 */
reportsRouter.get("/", async (req, res, next) => {
  try {
    const { user } = req as unknown as AuthedRequest;
    const month = typeof req.query.month === "string" ? req.query.month : undefined;

    const { range, summary, trend } = await getMonthlyReport(user.id, month);

    res.json({
      range: {
        key: range.key,
        label: range.label,
        start: iso(range.start),
        end: iso(range.end),
      },
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
      trend: trend.map((point) => ({
        key: point.key,
        label: point.label,
        income: minorToNumber(point.income),
        expense: minorToNumber(point.expense),
        net: minorToNumber(point.net),
      })),
      adjacent: {
        prev: adjacentMonthKey(range.key, -1),
        next: adjacentMonthKey(range.key, 1),
      },
    });
  } catch (error) {
    next(error);
  }
});
