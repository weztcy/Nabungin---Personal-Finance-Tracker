import {
  ArrowDownRightIcon,
  ArrowUpRightIcon,
  PiggyBankIcon,
  ScaleIcon,
  TrendingDownIcon,
  TrendingUpIcon,
  WalletIcon,
  type LucideIcon,
} from "lucide-react";

import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export type SummaryIcon = "wallet" | "income" | "expense" | "net" | "savings";

const ICONS: Record<SummaryIcon, LucideIcon> = {
  wallet: WalletIcon,
  income: TrendingUpIcon,
  expense: TrendingDownIcon,
  net: ScaleIcon,
  savings: PiggyBankIcon,
};

export type SummaryCardItem = {
  label: string;
  value: string;
  hint?: string;
  tone?: "default" | "positive" | "negative";
  icon: SummaryIcon;
};

export function SummaryCards({ items }: { items: SummaryCardItem[] }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {items.map((item) => {
        const Icon = ICONS[item.icon];
        const tone = item.tone ?? "default";
        return (
          <Card key={item.label} className="gap-2">
            <div className="flex items-center justify-between gap-2">
              <span className="text-muted-foreground text-xs font-medium">{item.label}</span>
              <span
                className={cn(
                  "flex size-6 items-center justify-center rounded-md",
                  tone === "positive" && "bg-emerald-500/10 text-emerald-600",
                  tone === "negative" && "bg-destructive/10 text-destructive",
                  tone === "default" && "bg-muted text-muted-foreground",
                )}
              >
                <Icon className="size-3.5" />
              </span>
            </div>
            <span
              className={cn(
                "font-heading text-xl font-semibold tabular-nums",
                tone === "positive" && "text-emerald-600",
                tone === "negative" && "text-destructive",
              )}
            >
              {item.value}
            </span>
            {item.hint && (
              <span className="text-muted-foreground flex items-center gap-1 text-xs">
                {tone === "positive" ? (
                  <ArrowUpRightIcon className="size-3" />
                ) : tone === "negative" ? (
                  <ArrowDownRightIcon className="size-3" />
                ) : null}
                {item.hint}
              </span>
            )}
          </Card>
        );
      })}
    </div>
  );
}
