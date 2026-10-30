import { z } from "zod";

export const ACCOUNT_TYPES = [
  "CASH",
  "BANK",
  "EWALLET",
  "CREDIT_CARD",
  "INVESTMENT",
  "LOAN",
] as const;

export const ACCOUNT_TYPE_LABELS: Record<(typeof ACCOUNT_TYPES)[number], string> = {
  CASH: "Tunai",
  BANK: "Bank",
  EWALLET: "E-Wallet",
  CREDIT_CARD: "Kartu Kredit",
  INVESTMENT: "Investasi",
  LOAN: "Pinjaman",
};

export const accountFormSchema = z.object({
  name: z.string().trim().min(1, "Nama akun wajib diisi").max(80),
  type: z.enum(ACCOUNT_TYPES),
  color: z.string().trim().max(20).optional().or(z.literal("")),
  icon: z.string().trim().max(40).optional().or(z.literal("")),
  openingBalance: z
    .string()
    .trim()
    .min(1, "Saldo awal wajib diisi")
    .refine((value) => {
      const n = Number(value.replace(/[^\d.-]/g, ""));
      return Number.isFinite(n) && n >= 0;
    }, "Saldo awal tidak valid"),
});

export type AccountFormValues = z.infer<typeof accountFormSchema>;
