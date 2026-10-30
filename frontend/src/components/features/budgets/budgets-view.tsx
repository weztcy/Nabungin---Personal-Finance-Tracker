"use client";

import { useState } from "react";

import { useRouter } from "next/navigation";

import { MoreHorizontalIcon, PencilIcon, PlusIcon, Trash2Icon } from "lucide-react";

import { ConfirmDialog } from "@/components/confirm-dialog";
import {
  BudgetFormDialog,
  type BudgetItem,
  type SimpleAccountRef,
  type SimpleCategoryRef,
} from "@/components/features/budgets/budget-form-dialog";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Progress, ProgressIndicator, ProgressTrack } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { deleteBudget } from "@/lib/actions/budget";

type BudgetListItem = {
  id: string;
  name: string;
  amount: number;
  amountLabel: string;
  spentLabel: string;
  remainingLabel: string;
  percent: number;
  over: boolean;
  periodLabel: string;
  periodStart: string;
  periodEnd: string;
  frequency: string;
  categoryId: string | null;
  categoryName: string | null;
  categoryColor: string | null;
  accountId: string | null;
  accountName: string | null;
};

export function BudgetsView({
  budgets,
  categories,
  accounts,
}: {
  budgets: BudgetListItem[];
  categories: SimpleCategoryRef[];
  accounts: SimpleAccountRef[];
}) {
  const router = useRouter();
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<BudgetItem | null>(null);
  const [deleting, setDeleting] = useState<BudgetListItem | null>(null);

  function openCreate() {
    setEditing(null);
    setFormOpen(true);
  }

  function openEdit(budget: BudgetListItem) {
    setEditing({
      id: budget.id,
      name: budget.name,
      amount: budget.amount,
      periodStart: budget.periodStart,
      periodEnd: budget.periodEnd,
      frequency: budget.frequency,
      categoryId: budget.categoryId,
      accountId: budget.accountId,
    });
    setFormOpen(true);
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="font-heading text-2xl font-semibold">Budget</h1>
          <p className="text-muted-foreground text-sm">
            Tetapkan batas pengeluaran dan pantau realisasinya per periode.
          </p>
        </div>
        <Button onClick={openCreate}>
          <PlusIcon /> Tambah Budget
        </Button>
      </div>

      {budgets.length === 0 ? (
        <Card className="text-muted-foreground items-center p-10 text-center text-sm">
          Belum ada budget. Klik â€œTambah Budgetâ€ untuk membuatnya.
        </Card>
      ) : (
        <div className="grid gap-3 lg:grid-cols-2">
          {budgets.map((budget) => (
            <BudgetCard key={budget.id} budget={budget} onEdit={openEdit} onDelete={setDeleting} />
          ))}
        </div>
      )}

      <BudgetFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        budget={editing}
        categories={categories}
        accounts={accounts}
        onSaved={() => router.refresh()}
      />

      <ConfirmDialog
        open={Boolean(deleting)}
        onOpenChange={(open) => !open && setDeleting(null)}
        title="Hapus budget?"
        description={deleting ? `Budget â€œ${deleting.name}â€ akan dihapus permanen.` : undefined}
        onConfirm={() => (deleting ? deleteBudget(deleting.id) : Promise.resolve({ ok: true }))}
        onDone={() => {
          setDeleting(null);
          router.refresh();
        }}
      />
    </div>
  );
}

function BudgetCard({
  budget,
  onEdit,
  onDelete,
}: {
  budget: BudgetListItem;
  onEdit: (budget: BudgetListItem) => void;
  onDelete: (budget: BudgetListItem) => void;
}) {
  const clamped = Math.min(Math.max(budget.percent, 0), 100);

  return (
    <Card className="gap-3">
      <div className="flex items-start justify-between gap-2">
        <div className="flex flex-col gap-0.5">
          <span className="font-medium">{budget.name}</span>
          <span className="text-muted-foreground text-xs">{budget.periodLabel}</span>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger render={<Button variant="ghost" size="icon-sm" />}>
            <MoreHorizontalIcon />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onEdit(budget)}>
              <PencilIcon /> Ubah
            </DropdownMenuItem>
            <DropdownMenuItem variant="destructive" onClick={() => onDelete(budget)}>
              <Trash2Icon /> Hapus
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="flex flex-col gap-2">
        <div className="flex items-baseline justify-between gap-2">
          <span
            className={cn("font-heading text-lg font-semibold", budget.over && "text-destructive")}
          >
            {budget.spentLabel}
          </span>
          <span className="text-muted-foreground text-xs">dari {budget.amountLabel}</span>
        </div>
        <Progress value={clamped}>
          <ProgressTrack className="h-2">
            <ProgressIndicator className={cn(budget.over ? "bg-destructive" : "bg-emerald-500")} />
          </ProgressTrack>
        </Progress>
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground">{budget.percent.toFixed(0)}% terpakai</span>
          <span
            className={cn("font-medium", budget.over ? "text-destructive" : "text-emerald-600")}
          >
            {budget.over ? "Lebih " : "Sisa "}
            {budget.remainingLabel}
          </span>
        </div>
      </div>

      {(budget.categoryName || budget.accountName) && (
        <div className="text-muted-foreground flex flex-wrap gap-1.5 text-xs">
          {budget.categoryName && (
            <span className="bg-muted inline-flex items-center gap-1.5 rounded-full px-2 py-0.5">
              <span
                className="size-2 rounded-full"
                style={{ backgroundColor: budget.categoryColor ?? "#64748b" }}
              />
              {budget.categoryName}
            </span>
          )}
          {budget.accountName && (
            <span className="bg-muted inline-flex items-center rounded-full px-2 py-0.5">
              {budget.accountName}
            </span>
          )}
        </div>
      )}
    </Card>
  );
}
