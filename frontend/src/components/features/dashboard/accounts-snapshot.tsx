import Link from "next/link";

import { ArrowRightIcon, WalletIcon } from "lucide-react";

import { buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export type AccountSnapshotItem = {
  id: string;
  name: string;
  typeLabel: string;
  color: string | null;
  balanceLabel: string;
  negative: boolean;
};

export function AccountsSnapshot({ items }: { items: AccountSnapshotItem[] }) {
  return (
    <Card className="gap-0 p-0">
      <div className="flex items-center justify-between border-b px-4 py-3">
        <h2 className="font-heading text-sm font-semibold">Saldo Akun</h2>
        <Link
          href="/accounts"
          className={cn(buttonVariants({ variant: "ghost", size: "xs" }), "text-muted-foreground")}
        >
          Kelola <ArrowRightIcon />
        </Link>
      </div>

      {items.length === 0 ? (
        <p className="text-muted-foreground flex flex-col items-center gap-2 px-4 py-8 text-center text-sm">
          <WalletIcon className="size-5" />
          Belum ada akun. Tambahkan akun pertamamu.
        </p>
      ) : (
        <ul className="divide-y">
          {items.map((item) => (
            <li key={item.id} className="flex items-center justify-between gap-3 px-4 py-2.5">
              <div className="flex items-center gap-2.5">
                <span
                  className="size-2.5 shrink-0 rounded-full"
                  style={{ backgroundColor: item.color ?? "#64748b" }}
                />
                <div className="flex flex-col">
                  <span className="text-sm font-medium">{item.name}</span>
                  <span className="text-muted-foreground text-xs">{item.typeLabel}</span>
                </div>
              </div>
              <span
                className={cn(
                  "text-sm font-medium tabular-nums",
                  item.negative && "text-destructive",
                )}
              >
                {item.balanceLabel}
              </span>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
