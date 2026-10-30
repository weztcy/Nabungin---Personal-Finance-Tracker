import { z } from "zod";

/**
 * Validasi field uang berbentuk string (mendukung pemisah ribuan/desimal).
 * Selaras dengan pola di validators lain yang memakai string + refine,
 * lalu dikonversi ke BigInt minor units lewat `toMinorUnits()` di server action.
 */
export function moneyField(label: string, options: { allowZero?: boolean } = {}) {
  const { allowZero = false } = options;
  return z
    .string()
    .trim()
    .min(1, `${label} wajib diisi`)
    .refine((value) => {
      const n = Number(value.replace(/[^\d.-]/g, ""));
      return Number.isFinite(n) && (allowZero ? n >= 0 : n > 0);
    }, `${label} tidak valid`);
}

/** Validasi bilangan bulat positif berbentuk string (mis. interval pengulangan). */
export function integerField(label: string, min = 1) {
  return z
    .string()
    .trim()
    .min(1, `${label} wajib diisi`)
    .refine((value) => {
      const n = Number(value);
      return Number.isInteger(n) && n >= min;
    }, `${label} minimal ${min}`);
}

/** Field ID opsional (boleh kosong → dianggap null). */
export const optionalId = z.string().trim().optional().or(z.literal(""));

/** Field tanggal opsional (yyyy-MM-dd). */
export const optionalDate = z.string().trim().optional().or(z.literal(""));

/** Field warna opsional (hex/rgb). */
export const optionalColor = z.string().trim().max(20).optional().or(z.literal(""));
