import Link from "next/link";

import { ArrowRightIcon } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export type RecentTransactionItem = {
  id: string;
  type: string;
  amountLabel: string;
  dateLabel: string;
  title: string;
  subtitle: string;
  categoryColor: string | null;
};

const TYPE_LABELS: Record<string, string> = {
  INCOME: "Pemasukan",
  EXPENSE: "Pengeluaran",
  TRANSFER: "Transfer",
};

export function RecentTransactions({ items }: { items: RecentTransactionItem[] }) {
  return (
    <Card className="gap-0 p-0">
      <div className="flex items-center justify-between border-b px-4 py-3">
        <h2 className="font-heading text-sm font-semibold">Transaksi Terakhir</h2>
        <Link
          href="/transactions"
          className={cn(buttonVariants({ variant: "ghost", size: "xs" }), "text-muted-foreground")}
        >
          Lihat semua <ArrowRightIcon />
        </Link>
      </div>

      {items.length === 0 ? (
        <p className="text-muted-foreground px-4 py-8 text-center text-sm">
          Belum ada transaksi. Mulai catat pemasukan & pengeluaranmu.
        </p>
      ) : (
        <ul className="divide-y">
          {items.map((item) => (
            <li key={item.id} className="flex items-center justify-between gap-3 px-4 py-2.5">
              <div className="flex min-w-0 items-center gap-2.5">
                <span
                  className="size-2.5 shrink-0 rounded-full"
                  style={{ backgroundColor: item.categoryColor ?? "#64748b" }}
                />
                <div className="flex min-w-0 flex-col">
                  <span className="truncate text-sm font-medium">{item.title}</span>
                  <span className="text-muted-foreground truncate text-xs">
                    {item.dateLabel} · {item.subtitle}
                  </span>
                </div>
              </div>
              <div className="flex shrink-0 flex-col items-end gap-1">
                <span
                  className={cn(
                    "text-sm font-medium tabular-nums",
                    item.type === "INCOME" && "text-emerald-600",
                    item.type === "EXPENSE" && "text-destructive",
                  )}
                >
                  {item.type === "EXPENSE" ? "-" : item.type === "INCOME" ? "+" : ""}
                  {item.amountLabel}
                </span>
                <Badge variant="outline">{TYPE_LABELS[item.type] ?? item.type}</Badge>
              </div>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
