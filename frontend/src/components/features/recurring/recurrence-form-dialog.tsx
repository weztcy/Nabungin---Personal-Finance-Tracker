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
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { toDateInputValue } from "@/lib/format";
import {
  RECUR_FREQS,
  RECUR_FREQ_LABELS,
  recurrenceFormSchema,
  type RecurrenceFormValues,
} from "@/lib/validators/recurrence";
import { TX_TYPES, TX_TYPE_LABELS } from "@/lib/validators/transaction";
import { createRecurrence, updateRecurrence } from "@/lib/actions/recurrence";

export type SimpleAccount = { id: string; name: string };
export type SimpleCategory = { id: string; name: string; kind: string };

export type RecurrenceItem = {
  id: string;
  name: string;
  type: string;
  amount: number; // major units
  freq: string;
  interval: number;
  nextRunAt: string; // yyyy-MM-dd
  accountId: string;
  toAccountId: string | null;
  categoryId: string | null;
  note: string | null;
  isActive: boolean;
};

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  recurrence?: RecurrenceItem | null;
  accounts: SimpleAccount[];
  categories: SimpleCategory[];
  onSaved?: () => void;
};

function buildEmpty(): RecurrenceFormValues {
  return {
    name: "",
    type: "EXPENSE",
    amount: "",
    freq: "MONTHLY",
    interval: "1",
    nextRunAt: toDateInputValue(),
    accountId: "",
    toAccountId: "",
    categoryId: "",
    note: "",
    isActive: true,
  };
}

export function RecurrenceFormDialog({
  open,
  onOpenChange,
  recurrence,
  accounts,
  categories,
  onSaved,
}: Props) {
  const [isPending, setIsPending] = useState(false);
  const isEdit = Boolean(recurrence);

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm<RecurrenceFormValues>({
    resolver: zodResolver(recurrenceFormSchema),
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
      recurrence
        ? {
            name: recurrence.name,
            type: recurrence.type as RecurrenceFormValues["type"],
            amount: String(recurrence.amount),
            freq: recurrence.freq as RecurrenceFormValues["freq"],
            interval: String(recurrence.interval),
            nextRunAt: recurrence.nextRunAt,
            accountId: recurrence.accountId,
            toAccountId: recurrence.toAccountId ?? "",
            categoryId: recurrence.categoryId ?? "",
            note: recurrence.note ?? "",
            isActive: recurrence.isActive,
          }
        : buildEmpty(),
    );
  }, [open, recurrence, reset]);

  async function onSubmit(values: RecurrenceFormValues) {
    setIsPending(true);
    const result = recurrence
      ? await updateRecurrence(recurrence.id, values)
      : await createRecurrence(values);
    setIsPending(false);

    if (!result.ok) {
      toast.error(result.error);
      return;
    }

    toast.success(isEdit ? "Transaksi berulang diperbarui" : "Transaksi berulang ditambahkan");
    onOpenChange(false);
    onSaved?.();
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {isEdit ? "Ubah Transaksi Berulang" : "Tambah Transaksi Berulang"}
          </DialogTitle>
          <DialogDescription>
            Jadwalkan transaksi otomatis yang berulang secara berkala.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4" noValidate>
          <div className="flex flex-col gap-2">
            <Label htmlFor="rec-name">Nama</Label>
            <Input
              id="rec-name"
              placeholder="mis. Langganan Internet"
              aria-invalid={!!errors.name}
              {...register("name")}
            />
            {errors.name && <p className="text-destructive text-xs">{errors.name.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <Label>Tipe</Label>
              <Controller
                control={control}
                name="type"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Pilih tipe" />
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
              <Label htmlFor="rec-amount">Jumlah (Rp)</Label>
              <Input
                id="rec-amount"
                type="number"
                inputMode="numeric"
                min={0}
                placeholder="0"
                aria-invalid={!!errors.amount}
                {...register("amount")}
              />
            </div>
          </div>
          {errors.amount && (
            <p className="text-destructive -mt-2 text-xs">{errors.amount.message}</p>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <Label>Frekuensi</Label>
              <Controller
                control={control}
                name="freq"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Pilih frekuensi" />
                    </SelectTrigger>
                    <SelectContent>
                      {RECUR_FREQS.map((f) => (
                        <SelectItem key={f} value={f}>
                          {RECUR_FREQ_LABELS[f]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="rec-interval">Setiap</Label>
              <Input
                id="rec-interval"
                type="number"
                inputMode="numeric"
                min={1}
                placeholder="1"
                aria-invalid={!!errors.interval}
                {...register("interval")}
              />
              {errors.interval && (
                <p className="text-destructive text-xs">{errors.interval.message}</p>
              )}
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="rec-next">Jadwal Berikutnya</Label>
            <Input
              id="rec-next"
              type="date"
              aria-invalid={!!errors.nextRunAt}
              {...register("nextRunAt")}
            />
            {errors.nextRunAt && (
              <p className="text-destructive text-xs">{errors.nextRunAt.message}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <Label>Akun</Label>
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
            {isTransfer ? (
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
            ) : (
              <div className="flex flex-col gap-2">
                <Label>Kategori</Label>
                <Controller
                  control={control}
                  name="categoryId"
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Tanpa kategori" />
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
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="rec-note">Catatan</Label>
            <Textarea id="rec-note" placeholder="Opsional" rows={2} {...register("note")} />
          </div>

          <Controller
            control={control}
            name="isActive"
            render={({ field }) => (
              <Label className="flex cursor-pointer items-center justify-between gap-4">
                <span>Aktifkan jadwal otomatis</span>
                <Switch checked={field.value ?? true} onCheckedChange={field.onChange} />
              </Label>
            )}
          />

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
