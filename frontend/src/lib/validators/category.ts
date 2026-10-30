import { z } from "zod";

export const CATEGORY_KINDS = ["INCOME", "EXPENSE"] as const;

export const CATEGORY_KIND_LABELS: Record<(typeof CATEGORY_KINDS)[number], string> = {
  INCOME: "Pemasukan",
  EXPENSE: "Pengeluaran",
};

export const categoryFormSchema = z.object({
  name: z.string().trim().min(1, "Nama kategori wajib diisi").max(80),
  kind: z.enum(CATEGORY_KINDS),
  color: z.string().trim().max(20).optional().or(z.literal("")),
  icon: z.string().trim().max(40).optional().or(z.literal("")),
  parentId: z.string().trim().optional().or(z.literal("")),
});

export type CategoryFormValues = z.infer<typeof categoryFormSchema>;
