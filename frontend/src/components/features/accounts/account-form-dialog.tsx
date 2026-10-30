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
import { COLOR_SWATCHES, DEFAULT_ACCOUNT_COLOR } from "@/lib/constants";
import { cn } from "@/lib/utils";
import {
  ACCOUNT_TYPES,
  ACCOUNT_TYPE_LABELS,
  accountFormSchema,
  type AccountFormValues,
} from "@/lib/validators/account";
import { createAccount, updateAccount } from "@/lib/actions/account";

export type AccountItem = {
  id: string;
  name: string;
  type: string;
  color: string | null;
  openingBalance: number;
};

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  account?: AccountItem | null;
  onSaved?: () => void;
};

const EMPTY: AccountFormValues = {
  name: "",
  type: "CASH",
  color: DEFAULT_ACCOUNT_COLOR,
  icon: "",
  openingBalance: "0",
};

export function AccountFormDialog({ open, onOpenChange, account, onSaved }: Props) {
  const [isPending, setIsPending] = useState(false);
  const isEdit = Boolean(account);

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm<AccountFormValues>({
    resolver: zodResolver(accountFormSchema),
    defaultValues: EMPTY,
  });

  useEffect(() => {
    if (!open) return;
    reset(
      account
        ? {
            name: account.name,
            type: account.type as AccountFormValues["type"],
            color: account.color ?? DEFAULT_ACCOUNT_COLOR,
            icon: "",
            openingBalance: String(account.openingBalance),
          }
        : EMPTY,
    );
  }, [open, account, reset]);

  async function onSubmit(values: AccountFormValues) {
    setIsPending(true);
    const result = account ? await updateAccount(account.id, values) : await createAccount(values);
    setIsPending(false);

    if (!result.ok) {
      toast.error(result.error);
      return;
    }

    toast.success(isEdit ? "Akun diperbarui" : "Akun ditambahkan");
    onOpenChange(false);
    onSaved?.();
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEdit ? "Ubah Akun" : "Tambah Akun"}</DialogTitle>
          <DialogDescription>
            {isEdit ? "Perbarui informasi akun keuanganmu." : "Buat akun keuangan baru."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4" noValidate>
          <div className="flex flex-col gap-2">
            <Label htmlFor="acc-name">Nama</Label>
            <Input
              id="acc-name"
              placeholder="mis. Rekening BCA"
              aria-invalid={!!errors.name}
              {...register("name")}
            />
            {errors.name && <p className="text-destructive text-xs">{errors.name.message}</p>}
          </div>

          <div className="flex flex-col gap-2">
            <Label>Tipe</Label>
            <Controller
              control={control}
              name="type"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Pilih tipe akun" />
                  </SelectTrigger>
                  <SelectContent>
                    {ACCOUNT_TYPES.map((type) => (
                      <SelectItem key={type} value={type}>
                        {ACCOUNT_TYPE_LABELS[type]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            {errors.type && <p className="text-destructive text-xs">{errors.type.message}</p>}
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="acc-opening">Saldo Awal (Rp)</Label>
            <Input
              id="acc-opening"
              type="number"
              inputMode="numeric"
              min={0}
              placeholder="0"
              aria-invalid={!!errors.openingBalance}
              {...register("openingBalance")}
            />
            {errors.openingBalance && (
              <p className="text-destructive text-xs">{errors.openingBalance.message}</p>
            )}
          </div>

          <div className="flex flex-col gap-2">
            <Label>Warna</Label>
            <Controller
              control={control}
              name="color"
              render={({ field }) => (
                <div className="flex flex-wrap gap-2">
                  {COLOR_SWATCHES.map((color) => (
                    <button
                      key={color}
                      type="button"
                      aria-label={`Warna ${color}`}
                      onClick={() => field.onChange(color)}
                      className={cn(
                        "ring-offset-background size-7 rounded-full ring-2 ring-offset-2 transition",
                        field.value === color ? "ring-foreground" : "ring-transparent",
                      )}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              )}
            />
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
