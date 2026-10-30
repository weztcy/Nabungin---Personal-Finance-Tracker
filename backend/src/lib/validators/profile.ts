import { z } from "zod";

export const CURRENCIES = ["IDR", "USD", "EUR", "SGD", "MYR", "JPY"] as const;

export const TIMEZONES = [
  "Asia/Jakarta",
  "Asia/Makassar",
  "Asia/Jayapura",
  "Asia/Singapore",
  "UTC",
] as const;

export const profileFormSchema = z.object({
  name: z.string().trim().min(1, "Nama wajib diisi").max(80, "Nama maksimal 80 karakter"),
});

export type ProfileFormValues = z.infer<typeof profileFormSchema>;
