import { format, formatDistanceToNow, parseISO } from "date-fns";
import { id as idLocale } from "date-fns/locale";

/** Format tanggal Indonesia, mis. "15 Okt 2026". */
export function formatDate(value: Date | string, pattern = "d MMM yyyy"): string {
  const date = typeof value === "string" ? parseISO(value) : value;
  return format(date, pattern, { locale: idLocale });
}

/** Format tanggal + jam, mis. "15 Okt 2026 14:30". */
export function formatDateTime(value: Date | string): string {
  return formatDate(value, "d MMM yyyy HH:mm");
}

/** Relative time, mis. "3 hari yang lalu". */
export function formatRelative(value: Date | string): string {
  const date = typeof value === "string" ? parseISO(value) : value;
  return formatDistanceToNow(date, { addSuffix: true, locale: idLocale });
}

/** Ubah Date → string `yyyy-MM-dd` untuk input type="date". */
export function toDateInputValue(value: Date | string = new Date()): string {
  const date = typeof value === "string" ? parseISO(value) : value;
  return format(date, "yyyy-MM-dd");
}

/** Rentang bulan berjalan (awal & awal bulan berikutnya) untuk query ringkasan. */
export function currentMonthRange(now: Date = new Date()) {
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  return { start, end };
}
