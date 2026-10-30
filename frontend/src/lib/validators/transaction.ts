import { z } from "zod";

export const TX_TYPES = ["INCOME", "EXPENSE", "TRANSFER"] as const;

export const TX_TYPE_LABELS: Record<(typeof TX_TYPES)[number], string> = {
  INCOME: "Pemasukan",
  EXPENSE: "Pengeluaran",
  TRANSFER: "Transfer",
};

export const transactionFormSchema = z
  .object({
    type: z.enum(TX_TYPES),
    amount: z
      .string()
      .trim()
      .min(1, "Jumlah wajib diisi")
      .refine((value) => {
        const n = Number(value.replace(/[^\d.-]/g, ""));
        return Number.isFinite(n) && n > 0;
      }, "Jumlah harus lebih dari 0"),
    date: z.string().min(1, "Tanggal wajib diisi"),
    accountId: z.string().min(1, "Akun wajib dipilih"),
    toAccountId: z.string().trim().optional().or(z.literal("")),
    categoryId: z.string().trim().optional().or(z.literal("")),
    note: z.string().trim().max(280, "Catatan maksimal 280 karakter").optional().or(z.literal("")),
    payee: z
      .string()
      .trim()
      .max(120, "Nama pihak maksimal 120 karakter")
      .optional()
      .or(z.literal("")),
  })
  .refine((data) => data.type !== "TRANSFER" || !!data.toAccountId, {
    message: "Pilih akun tujuan untuk transfer",
    path: ["toAccountId"],
  })
  .refine((data) => data.type !== "TRANSFER" || data.toAccountId !== data.accountId, {
    message: "Akun tujuan harus berbeda dari akun sumber",
    path: ["toAccountId"],
  });

export type TransactionFormValues = z.infer<typeof transactionFormSchema>;
