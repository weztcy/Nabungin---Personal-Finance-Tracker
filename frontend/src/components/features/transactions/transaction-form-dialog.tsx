"use client";

import { useEffect, useMemo, useState } from "react";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2Icon } from "lucide-react";
import { Controller, useForm, useWatch } from "react-hook-form";
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
import { Textarea } from "@/components/ui/textarea";
import { toDateInputValue } from "@/lib/format";
import {
  TX_TYPES,
  TX_TYPE_LABELS,
  transactionFormSchema,
  type TransactionFormValues,
} from "@/lib/validators/transaction";
import { createTransaction, updateTransaction } from "@/lib/actions/transaction";

export type SimpleAccount = { id: string; name: string };
export type SimpleCategory = { id: string; name: string; kind: string };

export type TransactionItem = {
  id: string;
  type: string;
  amount: number; // major units (IDR)
  date: string; // yyyy-MM-dd
  accountId: string;
  toAccountId: string | null;
  categoryId: string | null;
  note: string | null;
  payee: string | null;
};

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  accounts: SimpleAccount[];
  categories: SimpleCategory[];
  transaction?: TransactionItem | null;
  onSaved?: () => void;
};

function buildEmpty(): TransactionFormValues {
  return {
    type: "EXPENSE",
    amount: "",
    date: toDateInputValue(),
    accountId: "",
    toAccountId: "",
    categoryId: "",
    note: "",
    payee: "",
  };
}

export function TransactionFormDialog({
  open,
  onOpenChange,
  accounts,
  categories,
  transaction,
  onSaved,
}: Props) {
  const [isPending, setIsPending] = useState(false);
  const isEdit = Boolean(transaction);

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm<TransactionFormValues>({
    resolver: zodResolver(transactionFormSchema),
    defaultValues: buildEmpty(),
  });

  const type = useWatch({ control, name: "type", defaultValue: "EXPENSE" });
  const isTransfer = type === "TRANSFER";
  const filteredCategories = useMemo(
    () => categories.filter((c) => c.kind === type),
    [categories, type],
  );

  useEffect(() => {
    if (!open) return;
    reset(
      transaction
        ? {
            type: transaction.type as TransactionFormValues["type"],
            amount: String(transaction.amount),
            date: transaction.date,
            accountId: transaction.accountId,
            toAccountId: transaction.toAccountId ?? "",
            categoryId: transaction.categoryId ?? "",
            note: transaction.note ?? "",
            payee: transaction.payee ?? "",
          }
        : buildEmpty(),
    );
  }, [open, transaction, reset]);

  async function onSubmit(values: TransactionFormValues) {
    setIsPending(true);
    const result = transaction
      ? await updateTransaction(transaction.id, values)
      : await createTransaction(values);
    setIsPending(false);

    if (!result.ok) {
      toast.error(result.error);
      return;
    }

    toast.success(isEdit ? "Transaksi diperbarui" : "Transaksi ditambahkan");
    onOpenChange(false);
    onSaved?.();
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Ubah Transaksi" : "Tambah Transaksi"}</DialogTitle>
          <DialogDescription>
            Catat pemasukan, pengeluaran, atau transfer antar akun.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4" noValidate>
          <div className="flex flex-col gap-2">
            <Label>Jenis</Label>
            <Controller
              control={control}
              name="type"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Pilih jenis" />
                  </SelectTrigger>
                  <SelectContent>
                    {TX_TYPES.map((t) => (
                      <SelectItem key={t} value={t}>
                        {TX_TYPE_LABELS[t]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="tx-amount">Jumlah (Rp)</Label>
            <Input
              id="tx-amount"
              type="number"
              inputMode="numeric"
              min={0}
              placeholder="0"
              aria-invalid={!!errors.amount}
              {...register("amount")}
            />
            {errors.amount && <p className="text-destructive text-xs">{errors.amount.message}</p>}
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="tx-date">Tanggal</Label>
            <Input id="tx-date" type="date" aria-invalid={!!errors.date} {...register("date")} />
            {errors.date && <p className="text-destructive text-xs">{errors.date.message}</p>}
          </div>

          <div className="flex flex-col gap-2">
            <Label>{isTransfer ? "Dari Akun" : "Akun"}</Label>
            <Controller
              control={control}
              name="accountId"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Pilih akun" />
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
            {errors.accountId && (
              <p className="text-destructive text-xs">{errors.accountId.message}</p>
            )}
          </div>

          {isTransfer && (
            <div className="flex flex-col gap-2">
              <Label>Ke Akun</Label>
              <Controller
                control={control}
                name="toAccountId"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Pilih akun tujuan" />
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
              {errors.toAccountId && (
                <p className="text-destructive text-xs">{errors.toAccountId.message}</p>
              )}
            </div>
          )}

          {!isTransfer && (
            <div className="flex flex-col gap-2">
              <Label>Kategori</Label>
              <Controller
                control={control}
                name="categoryId"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Tanpa kategori / pilih" />
                    </SelectTrigger>
                    <SelectContent>
                      {filteredCategories.map((category) => (
                        <SelectItem key={category.id} value={category.id}>
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
          )}

          <div className="flex flex-col gap-2">
            <Label htmlFor="tx-payee">Pihak / Sumber</Label>
            <Input id="tx-payee" placeholder="mis. Warung Sederhana" {...register("payee")} />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="tx-note">Catatan</Label>
            <Textarea id="tx-note" placeholder="Opsional" rows={2} {...register("note")} />
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
