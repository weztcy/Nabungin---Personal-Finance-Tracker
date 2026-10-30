import { formatDate } from "@/lib/format";
import { prisma } from "@/prisma";
import { getSummary, type MonthlySummary } from "@/services/finance";

export type MonthRange = {
  key: string; // yyyy-MM
  label: string; // "Oktober 2026"
  start: Date;
  end: Date;
};

function pad(n: number): string {
  return String(n).padStart(2, "0");
}

/** Rentang satu bulan dari key `yyyy-MM`; jatuh ke bulan berjalan bila key tidak valid. */
export function monthRangeFromKey(key: string | undefined, now: Date = new Date()): MonthRange {
  let year = now.getFullYear();
  let month = now.getMonth();

  if (key && /^\d{4}-\d{2}$/.test(key)) {
    const [y, m] = key.split("-").map(Number);
    if (y >= 2000 && y <= 2100 && m >= 1 && m <= 12) {
      year = y;
      month = m - 1;
    }
  }

  const start = new Date(year, month, 1);
  const end = new Date(year, month + 1, 1);
  return {
    key: `${year}-${pad(month + 1)}`,
    label: formatDate(start, "MMMM yyyy"),
    start,
    end,
  };
}

/** Bulan sebelumnya / berikutnya dari sebuah key (untuk navigasi periode). */
export function adjacentMonthKey(key: string, delta: number): string {
  const [y, m] = key.split("-").map(Number);
  const date = new Date(y, m - 1 + delta, 1);
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}`;
}

export type TrendPoint = {
  key: string;
  label: string;
  income: bigint;
  expense: bigint;
  net: bigint;
};

/** Tren arus kas bulanan untuk `months` bulan terakhir (termasuk bulan berjalan). */
export async function getMonthlyTrend(
  userId: string,
  months: number,
  now: Date = new Date(),
): Promise<TrendPoint[]> {
  const buckets: MonthRange[] = [];
  for (let i = months - 1; i >= 0; i -= 1) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
    buckets.push(monthRangeFromKey(`${date.getFullYear()}-${pad(date.getMonth() + 1)}`, now));
  }

  const first = buckets[0];
  const last = buckets[buckets.length - 1];

  const txs = await prisma.transaction.findMany({
    where: {
      userId,
      type: { in: ["INCOME", "EXPENSE"] },
      date: { gte: first.start, lt: last.end },
    },
    select: { type: true, amount: true, date: true },
  });

  return buckets.map((bucket) => {
    let income = 0n;
    let expense = 0n;

    for (const tx of txs) {
      if (tx.date < bucket.start || tx.date >= bucket.end) continue;
      if (tx.type === "INCOME") income += tx.amount;
      else expense += tx.amount;
    }

    return {
      key: bucket.key,
      label: formatDate(bucket.start, "MMM"),
      income,
      expense,
      net: income - expense,
    };
  });
}

export type ReportPayload = {
  range: MonthRange;
  summary: MonthlySummary;
  trend: TrendPoint[];
};

/** Data lengkap halaman laporan untuk satu bulan. */
export async function getMonthlyReport(
  userId: string,
  monthKey: string | undefined,
  trendMonths = 6,
): Promise<ReportPayload> {
  const range = monthRangeFromKey(monthKey);
  const [summary, trend] = await Promise.all([
    getSummary(userId, range.start, range.end),
    getMonthlyTrend(userId, trendMonths),
  ]);

  return { range, summary, trend };
}
