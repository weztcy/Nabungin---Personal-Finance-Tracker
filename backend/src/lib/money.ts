/**
 * Money utilities — semua nilai uang di aplikasi disimpan sebagai **BigInt minor units**.
 *
 * Untuk IDR (scale = 0), 1 minor unit = Rp1. Jangan pernah menyimpan uang sebagai `number`
 * floating point di database; gunakan helper di modul ini untuk konversi & format.
 */

export const DEFAULT_CURRENCY = "IDR";
export const DEFAULT_LOCALE = "id-ID";

/** Jumlah digit desimal (minor unit scale) per mata uang. */
export const CURRENCY_SCALE: Record<string, number> = {
  IDR: 0,
  JPY: 0,
  KRW: 0,
  USD: 2,
  EUR: 2,
  GBP: 2,
  SGD: 2,
  MYR: 2,
};

/** Ambil scale (jumlah desimal) untuk sebuah mata uang. Default 2. */
export function scaleFor(currency: string = DEFAULT_CURRENCY): number {
  return CURRENCY_SCALE[currency.toUpperCase()] ?? 2;
}

/**
 * Konversi nilai uang (number atau string desimal) menjadi BigInt minor units.
 *
 * - `toMinorUnits(1500)`              → `1500n` (IDR)
 * - `toMinorUnits("1500.50", "USD")`  → `150050n`
 *
 * Untuk mata uang dengan scale 0 (IDR), bagian desimal akan dipotong (truncate).
 * Input yang tidak valid akan melempar Error.
 */
export function toMinorUnits(value: number | string, currency: string = DEFAULT_CURRENCY): bigint {
  const scale = scaleFor(currency);
  const raw = typeof value === "number" ? value.toFixed(scale) : value.trim();

  if (raw === "") {
    throw new Error("Nilai uang tidak boleh kosong");
  }

  // hanya izinkan digit, pemisah ribuan/desimal, dan tanda minus di depan
  if (!/^-?[\d.,]+$/.test(raw)) {
    throw new Error(`Format uang tidak valid: "${value}"`);
  }

  const negative = raw.startsWith("-");
  const unsigned = negative ? raw.slice(1) : raw;

  const lastSep = Math.max(unsigned.lastIndexOf("."), unsigned.lastIndexOf(","));
  const hasSep = lastSep !== -1;
  const afterLast = hasSep ? unsigned.slice(lastSep + 1) : "";

  let intPart: string;
  let fracPart: string;

  if (!hasSep) {
    intPart = unsigned;
    fracPart = "";
  } else if (scale === 0 && afterLast.length === 3) {
    // IDR/JPY: anggap SEMUA pemisah sebagai pemisah ribuan (mis. "1.500" → 1500)
    intPart = unsigned.replace(/[.,]/g, "");
    fracPart = "";
  } else {
    // pemisah terakhir = desimal, sisanya pemisah ribuan
    intPart = unsigned.slice(0, lastSep).replace(/[.,]/g, "");
    fracPart = unsigned.slice(lastSep + 1).replace(/[.,]/g, "");
  }

  if (intPart === "") intPart = "0";
  fracPart = (fracPart + "0".repeat(scale)).slice(0, scale);

  const digits = intPart + fracPart;
  if (!/^\d+$/.test(digits)) {
    throw new Error(`Format uang tidak valid: "${value}"`);
  }

  const minor = BigInt(digits);
  return negative ? -minor : minor;
}

/**
 * Konversi BigInt minor units menjadi `number` (major unit).
 * Gunakan hanya untuk display/komputasi ringan — untuk penyimpanan tetap pakai BigInt.
 */
export function fromMinorUnits(amount: bigint, currency: string = DEFAULT_CURRENCY): number {
  const scale = scaleFor(currency);
  if (scale === 0) return Number(amount);
  return Number(amount) / 10 ** scale;
}

/** Format minor units menjadi string mata uang, mis. `Rp1.500`. */
export function formatMoney(
  amount: bigint,
  currency: string = DEFAULT_CURRENCY,
  locale: string = DEFAULT_LOCALE,
): string {
  const scale = scaleFor(currency);

  // IDR (scale 0): Intl.NumberFormat menerima BigInt langsung → presisi penuh terjaga.
  if (scale === 0) {
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency: currency.toUpperCase(),
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  }

  // scale > 0: konversi minor → major (mis. 150050 → 1500.50) lalu format.
  const major = Number(amount) / 10 ** scale;
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency: currency.toUpperCase(),
    minimumFractionDigits: scale,
    maximumFractionDigits: scale,
  }).format(major);
}

/** Shortcut format IDR. */
export function formatIDR(amount: bigint): string {
  return formatMoney(amount, "IDR", "id-ID");
}

/** Jumlahkan sekumpulan minor units. */
export function sum(amounts: readonly bigint[]): bigint {
  return amounts.reduce<bigint>((acc, n) => acc + n, 0n);
}

/** a - b untuk minor units. */
export function subtract(a: bigint, b: bigint): bigint {
  return a - b;
}

/** a + b untuk minor units. */
export function add(a: bigint, b: bigint): bigint {
  return a + b;
}

/** Nilai absolut. */
export function abs(amount: bigint): bigint {
  return amount < 0n ? -amount : amount;
}

/** Balik tanda (+/-). */
export function negate(amount: bigint): bigint {
  return -amount;
}

export function isZero(amount: bigint): boolean {
  return amount === 0n;
}

export function isNegative(amount: bigint): boolean {
  return amount < 0n;
}

export function isPositive(amount: bigint): boolean {
  return amount > 0n;
}

/**
 * Kalikan minor units dengan sebuah rasio (mis. untuk split/persentase),
 * membulatkan ke bawah. `ratio` contohnya 0.5 untuk setengah.
 */
export function applyRatio(amount: bigint, ratio: number): bigint {
  if (!Number.isFinite(ratio)) {
    throw new Error("Ratio harus berupa angka finite");
  }
  // gunakan basis 1e6 untuk presisi rasio yang wajar
  const scaled = BigInt(Math.round(ratio * 1_000_000));
  return (amount * scaled) / 1_000_000n;
}

/**
 * Persentase `part` terhadap `total` (0–100). Mengembalikan 0 jika total 0.
 */
export function percentageOf(part: bigint, total: bigint): number {
  if (total === 0n) return 0;
  return (Number(part) / Number(total)) * 100;
}
