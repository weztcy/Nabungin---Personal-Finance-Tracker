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
import {
  CATEGORY_KINDS,
  CATEGORY_KIND_LABELS,
  categoryFormSchema,
  type CategoryFormValues,
} from "@/lib/validators/category";
import { createCategory, updateCategory } from "@/lib/actions/category";

export type CategoryItem = {
  id: string;
  name: string;
  kind: string;
  color: string | null;
  parentId: string | null;
};

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  category?: CategoryItem | null;
  onSaved?: () => void;
};

const EMPTY: CategoryFormValues = {
  name: "",
  kind: "EXPENSE",
  color: DEFAULT_CATEGORY_COLOR,
  icon: "",
  parentId: "",
};

export function CategoryFormDialog({ open, onOpenChange, category, onSaved }: Props) {
  const [isPending, setIsPending] = useState(false);
  const isEdit = Boolean(category);

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm<CategoryFormValues>({
    resolver: zodResolver(categoryFormSchema),
    defaultValues: EMPTY,
  });

  useEffect(() => {
    if (!open) return;
    reset(
      category
        ? {
            name: category.name,
            kind: category.kind as CategoryFormValues["kind"],
            color: category.color ?? DEFAULT_CATEGORY_COLOR,
            icon: "",
            parentId: category.parentId ?? "",
          }
        : EMPTY,
    );
  }, [open, category, reset]);

  async function onSubmit(values: CategoryFormValues) {
    setIsPending(true);
    const result = category
      ? await updateCategory(category.id, values)
      : await createCategory(values);
    setIsPending(false);

    if (!result.ok) {
      toast.error(result.error);
      return;
    }

    toast.success(isEdit ? "Kategori diperbarui" : "Kategori ditambahkan");
    onOpenChange(false);
    onSaved?.();
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEdit ? "Ubah Kategori" : "Tambah Kategori"}</DialogTitle>
          <DialogDescription>
            {isEdit ? "Perbarui informasi kategori." : "Buat kategori pemasukan atau pengeluaran."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4" noValidate>
          <div className="flex flex-col gap-2">
            <Label htmlFor="cat-name">Nama</Label>
            <Input
              id="cat-name"
              placeholder="mis. Makanan & Minuman"
              aria-invalid={!!errors.name}
              {...register("name")}
            />
            {errors.name && <p className="text-destructive text-xs">{errors.name.message}</p>}
          </div>

          <div className="flex flex-col gap-2">
            <Label>Jenis</Label>
            <Controller
              control={control}
              name="kind"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Pilih jenis" />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORY_KINDS.map((kind) => (
                      <SelectItem key={kind} value={kind}>
                        {CATEGORY_KIND_LABELS[kind]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            {errors.kind && <p className="text-destructive text-xs">{errors.kind.message}</p>}
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
