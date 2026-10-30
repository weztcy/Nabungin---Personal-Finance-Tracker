import { z } from "zod";

import { moneyField, optionalColor, optionalDate, optionalId } from "@/lib/validators/common";

export const goalFormSchema = z.object({
  name: z.string().trim().min(1, "Nama target wajib diisi").max(80),
  targetAmount: moneyField("Target dana"),
  savedAmount: moneyField("Dana terkumpul", { allowZero: true }),
  targetDate: optionalDate,
  color: optionalColor,
  accountId: optionalId,
});

export type GoalFormValues = z.infer<typeof goalFormSchema>;

export const goalContributionSchema = z.object({
  amount: moneyField("Jumlah setoran"),
});

export type GoalContributionValues = z.infer<typeof goalContributionSchema>;
