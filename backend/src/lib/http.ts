/** Pembungkus response JSON + konversi nilai agar konsisten di seluruh route. */

/** Response sukses standar untuk mutasi: `{ ok: true }`. */
export const OK = { ok: true } as const;

/**
 * Konversi BigInt (minor units) → number agar aman di JSON.
 * Nilai finansial aplikasi ini jauh di bawah Number.MAX_SAFE_INTEGER.
 */
export function minorToNumber(value: bigint | null | undefined): number {
  return value === null || value === undefined ? 0 : Number(value);
}

/** Serialisasi tanggal ke ISO string (null-safe). */
export function iso(value: Date | null | undefined): string | null {
  return value ? value.toISOString() : null;
}
