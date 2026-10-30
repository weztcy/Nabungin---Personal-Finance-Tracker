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
import { COLOR_SWATCHES, DEFAULT_CATEGORY_COLOR } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { goalFormSchema, type GoalFormValues } from "@/lib/validators/goal";
import { createGoal, updateGoal } from "@/lib/actions/goal";

export type SimpleAccountRef = { id: string; name: string };

export type GoalItem = {
  id: string;
  name: string;
  targetAmount: number;
  savedAmount: number;
  targetDate: string | null;
  color: string | null;
  accountId: string | null;
};

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  goal?: GoalItem | null;
  accounts: SimpleAccountRef[];
  onSaved?: () => void;
};

const EMPTY: GoalFormValues = {
  name: "",
  targetAmount: "",
  savedAmount: "0",
  targetDate: "",
  color: DEFAULT_CATEGORY_COLOR,
  accountId: "",
};

export function GoalFormDialog({ open, onOpenChange, goal, accounts, onSaved }: Props) {
  const [isPending, setIsPending] = useState(false);
  const isEdit = Boolean(goal);

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm<GoalFormValues>({
    resolver: zodResolver(goalFormSchema),
    defaultValues: EMPTY,
  });

  useEffect(() => {
    if (!open) return;
    reset(
      goal
        ? {
            name: goal.name,
            targetAmount: String(goal.targetAmount),
            savedAmount: String(goal.savedAmount),
            targetDate: goal.targetDate ?? "",
            color: goal.color ?? DEFAULT_CATEGORY_COLOR,
            accountId: goal.accountId ?? "",
          }
        : EMPTY,
    );
  }, [open, goal, reset]);

  async function onSubmit(values: GoalFormValues) {
    setIsPending(true);
    const result = goal ? await updateGoal(goal.id, values) : await createGoal(values);
    setIsPending(false);

    if (!result.ok) {
      toast.error(result.error);
      return;
    }

    toast.success(isEdit ? "Target diperbarui" : "Target ditambahkan");
    onOpenChange(false);
    onSaved?.();
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEdit ? "Ubah Target Tabungan" : "Tambah Target Tabungan"}</DialogTitle>
          <DialogDescription>Rencanakan target menabung dan pantau progresnya.</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4" noValidate>
          <div className="flex flex-col gap-2">
            <Label htmlFor="goal-name">Nama Target</Label>
            <Input
              id="goal-name"
              placeholder="mis. Dana Darurat"
              aria-invalid={!!errors.name}
              {...register("name")}
            />
            {errors.name && <p className="text-destructive text-xs">{errors.name.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="goal-target">Target (Rp)</Label>
              <Input
                id="goal-target"
                type="number"
                inputMode="numeric"
                min={0}
                placeholder="0"
                aria-invalid={!!errors.targetAmount}
                {...register("targetAmount")}
              />
              {errors.targetAmount && (
                <p className="text-destructive text-xs">{errors.targetAmount.message}</p>
              )}
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="goal-saved">Terkumpul (Rp)</Label>
              <Input
                id="goal-saved"
                type="number"
                inputMode="numeric"
                min={0}
                placeholder="0"
                aria-invalid={!!errors.savedAmount}
                {...register("savedAmount")}
              />
              {errors.savedAmount && (
                <p className="text-destructive text-xs">{errors.savedAmount.message}</p>
              )}
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="goal-date">Target Tanggal (opsional)</Label>
            <Input id="goal-date" type="date" {...register("targetDate")} />
          </div>

          <div className="flex flex-col gap-2">
            <Label>Akun (opsional)</Label>
            <Controller
              control={control}
              name="accountId"
              render={({ field }) => (
                <Select value={field.value || ""} onValueChange={field.onChange}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Tanpa akun terikat" />
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
