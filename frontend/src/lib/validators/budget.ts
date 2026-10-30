import { z } from "zod";

import { moneyField, optionalId } from "@/lib/validators/common";
import { RECUR_FREQS } from "@/lib/validators/recurrence";

export const budgetFormSchema = z
  .object({
    name: z.string().trim().min(1, "Nama budget wajib diisi").max(80),
    amount: moneyField("Jumlah budget"),
    periodStart: z.string().min(1, "Tanggal mulai wajib diisi"),
    periodEnd: z.string().min(1, "Tanggal selesai wajib diisi"),
    frequency: z.enum(RECUR_FREQS),
    categoryId: optionalId,
    accountId: optionalId,
  })
  .refine((data) => new Date(data.periodEnd).getTime() >= new Date(data.periodStart).getTime(), {
    message: "Tanggal selesai harus setelah tanggal mulai",
    path: ["periodEnd"],
  });

export type BudgetFormValues = z.infer<typeof budgetFormSchema>;
