"use client";

import { useEffect, useState } from "react";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2Icon } from "lucide-react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { currentMonthRange, toDateInputValue } from "@/lib/format";
import { budgetFormSchema, type BudgetFormValues } from "@/lib/validators/budget";
import { RECUR_FREQS, RECUR_FREQ_LABELS } from "@/lib/validators/recurrence";
import { createBudget, updateBudget } from "@/lib/actions/budget";

export type SimpleCategoryRef = { id: string; name: string };
export type SimpleAccountRef = { id: string; name: string };

export type BudgetItem = {
  id: string;
  name: string;
  amount: number;
  periodStart: string;
  periodEnd: string;
  frequency: string;
  categoryId: string | null;
  accountId: string | null;
};

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  budget?: BudgetItem | null;
  categories: SimpleCategoryRef[];
  accounts: SimpleAccountRef[];
  onSaved?: () => void;
};

function buildEmpty(): BudgetFormValues {
  const { start, end } = currentMonthRange();
  const lastDay = new Date(end.getFullYear(), end.getMonth(), 0);
  return {
    name: "",
    amount: "",
    periodStart: toDateInputValue(start),
    periodEnd: toDateInputValue(lastDay),
    frequency: "MONTHLY",
    categoryId: "",
    accountId: "",
  };
}

export function BudgetFormDialog({
  open,
  onOpenChange,
  budget,
  categories,
  accounts,
  onSaved,
}: Props) {
  const [isPending, setIsPending] = useState(false);
  const isEdit = Boolean(budget);

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm<BudgetFormValues>({
    resolver: zodResolver(budgetFormSchema),
    defaultValues: buildEmpty(),
  });

  useEffect(() => {
    if (!open) return;
    reset(
      budget
        ? {
            name: budget.name,
            amount: String(budget.amount),
            periodStart: budget.periodStart,
            periodEnd: budget.periodEnd,
            frequency: budget.frequency as BudgetFormValues["frequency"],
            categoryId: budget.categoryId ?? "",
            accountId: budget.accountId ?? "",
          }
        : buildEmpty(),
    );
  }, [open, budget, reset]);

  async function onSubmit(values: BudgetFormValues) {
    setIsPending(true);
    const result = budget ? await updateBudget(budget.id, values) : await createBudget(values);
    setIsPending(false);

    if (!result.ok) {
      toast.error(result.error);
      return;
    }

    toast.success(isEdit ? "Budget diperbarui" : "Budget ditambahkan");
    onOpenChange(false);
    onSaved?.();
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEdit ? "Ubah Budget" : "Tambah Budget"}</DialogTitle>
          <DialogDescription>
            Tetapkan batas pengeluaran untuk sebuah periode dan pantau realisasinya.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4" noValidate>
          <div className="flex flex-col gap-2">
            <Label htmlFor="bud-name">Nama Budget</Label>
            <Input
              id="bud-name"
              placeholder="mis. Belanja Bulanan"
              aria-invalid={!!errors.name}
              {...register("name")}
            />
            {errors.name && <p className="text-destructive text-xs">{errors.name.message}</p>}
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="bud-amount">Jumlah (Rp)</Label>
            <Input
              id="bud-amount"
              type="number"
              inputMode="numeric"
              min={0}
              placeholder="0"
              aria-invalid={!!errors.amount}
              {...register("amount")}
            />
            {errors.amount && <p className="text-destructive text-xs">{errors.amount.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="bud-start">Mulai</Label>
              <Input
                id="bud-start"
                type="date"
                aria-invalid={!!errors.periodStart}
                {...register("periodStart")}
              />
              {errors.periodStart && (
                <p className="text-destructive text-xs">{errors.periodStart.message}</p>
              )}
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="bud-end">Selesai</Label>
              <Input
                id="bud-end"
                type="date"
                aria-invalid={!!errors.periodEnd}
                {...register("periodEnd")}
              />
              {errors.periodEnd && (
                <p className="text-destructive text-xs">{errors.periodEnd.message}</p>
              )}
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <Label>Frekuensi</Label>
            <Controller
              control={control}
              name="frequency"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Pilih frekuensi" />
                  </SelectTrigger>
                  <SelectContent>
                    {RECUR_FREQS.map((freq) => (
                      <SelectItem key={freq} value={freq}>
                        {RECUR_FREQ_LABELS[freq]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <Label>Kategori (opsional)</Label>
              <Controller
                control={control}
                name="categoryId"
                render={({ field }) => (
                  <Select value={field.value || ""} onValueChange={field.onChange}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Semua kategori" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((category) => (
                        <SelectItem key={category.id} value={category.id}>
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label>Akun (opsional)</Label>
              <Controller
                control={control}
                name="accountId"
                render={({ field }) => (
                  <Select value={field.value || ""} onValueChange={field.onChange}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Semua akun" />
                    </SelectTrigger>
                    <SelectContent>
                      {accounts.map((account) => (
                        <SelectItem key={account.id} value={account.id}>
                          {account.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Batal
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? <Loader2Icon className="animate-spin" /> : null}
              {isEdit ? "Simpan" : "Tambah"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
