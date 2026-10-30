/** Nama aplikasi (fallback "Nabungin" bila env kosong). */
export function appName(): string {
  return process.env.NEXT_PUBLIC_APP_NAME || "Nabungin";
}

/** Mata uang dasar default. */
export function baseCurrency(): string {
  return process.env.NEXT_PUBLIC_BASE_CURRENCY || "IDR";
}

/** Zona waktu default. */
export function timezone(): string {
  return process.env.NEXT_PUBLIC_TIMEZONE || "Asia/Jakarta";
}
