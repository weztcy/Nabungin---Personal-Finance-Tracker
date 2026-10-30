import { z } from "zod";

import { integerField, moneyField, optionalId } from "@/lib/validators/common";
import { TX_TYPES } from "@/lib/validators/transaction";

export const RECUR_FREQS = ["DAILY", "WEEKLY", "MONTHLY", "YEARLY"] as const;
export type RecurFreq = (typeof RECUR_FREQS)[number];

export const RECUR_FREQ_LABELS: Record<RecurFreq, string> = {
  DAILY: "Harian",
  WEEKLY: "Mingguan",
  MONTHLY: "Bulanan",
  YEARLY: "Tahunan",
};

export const recurrenceFormSchema = z
  .object({
    name: z.string().trim().min(1, "Nama wajib diisi").max(80),
    type: z.enum(TX_TYPES),
    amount: moneyField("Jumlah"),
    freq: z.enum(RECUR_FREQS),
    interval: integerField("Interval", 1),
    nextRunAt: z.string().min(1, "Tanggal jalan berikutnya wajib diisi"),
    accountId: z.string().min(1, "Akun wajib dipilih"),
    toAccountId: optionalId,
    categoryId: optionalId,
    note: z.string().trim().max(280, "Catatan maksimal 280 karakter").optional().or(z.literal("")),
    isActive: z.boolean().optional(),
  })
  .refine((data) => data.type !== "TRANSFER" || !!data.toAccountId, {
    message: "Pilih akun tujuan untuk transfer",
    path: ["toAccountId"],
  })
  .refine((data) => data.type !== "TRANSFER" || data.toAccountId !== data.accountId, {
    message: "Akun tujuan harus berbeda dari akun sumber",
    path: ["toAccountId"],
  });

export type RecurrenceFormValues = z.infer<typeof recurrenceFormSchema>;
