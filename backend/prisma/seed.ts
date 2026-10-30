import "dotenv/config";

import { randomUUID } from "node:crypto";

import { PrismaPg } from "@prisma/adapter-pg";
import { hashPassword } from "better-auth/crypto";

import { PrismaClient } from "../src/generated/prisma/client";

/**
 * Seed lengkap Nabungin.
 *
 * Mengisi SEMUA halaman aplikasi dengan data dummy yang realistis: dashboard,
 * transaksi, akun, kategori (+ sub-kategori), tag, budget, target tabungan,
 * transaksi berulang, laporan (tren berjalan), dan halaman pengaturan.
 *
 * Sifat idempoten: seluruh data keuangan milik user demo dihapus lebih dulu
 * (transaksi → jadwal berulang → budget → target → tag → kategori → akun),
 * lalu dibuat ulang secara deterministik. Aman dijalankan berulang kali.
 *
 * Jalankan:
 *   npm run db:seed             # dari root repo
 *   npx tsx prisma/seed.ts      # dari folder backend
 */

// ------------------------------------------------------------
// Konfigurasi (dapat dioverride lewat environment variable)
// ------------------------------------------------------------
const DEMO_NAME = process.env.SEED_DEMO_NAME ?? "Demo User";
const DEMO_EMAIL = process.env.SEED_DEMO_EMAIL ?? "demo@nabungin.app";
const DEMO_PASSWORD = process.env.SEED_DEMO_PASSWORD ?? "password1234";

/** Jumlah bulan riwayat transaksi (offset 0 = bulan berjalan). */
const HISTORY_MONTHS = 7;

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL is not set (dibutuhkan oleh seed).");
}

const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString }) });

// ------------------------------------------------------------
// Tipe lokal (struktural sama dengan enum Prisma)
// ------------------------------------------------------------
type AccountType = "CASH" | "BANK" | "EWALLET" | "CREDIT_CARD" | "INVESTMENT" | "LOAN";
type CategoryKind = "INCOME" | "EXPENSE";
type TxType = "INCOME" | "EXPENSE" | "TRANSFER";
type RecurFreq = "DAILY" | "WEEKLY" | "MONTHLY" | "YEARLY";

// ------------------------------------------------------------
// Helper acak deterministik (hasil seed selalu sama)
// ------------------------------------------------------------
function createRng(seed: number) {
  let state = seed >>> 0;
  return function next(): number {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const rng = createRng(20261015);

/** Bilangan bulat acak dalam rentang [min, max]. */
function randInt(min: number, max: number): number {
  return Math.floor(rng() * (max - min + 1)) + min;
}

/** Pilih satu elemen acak dari daftar. */
function pick<T>(items: readonly T[]): T {
  return items[Math.floor(rng() * items.length)];
}

/** Peluang `probability` (0–1) mengembalikan true. */
function chance(probability: number): boolean {
  return rng() < probability;
}

/** Bulatkan nominal uang agar terlihat natural (mis. kelipatan step terdekat). */
function roundTo(value: number, step = 500): number {
  return Math.round(value / step) * step;
}

// ------------------------------------------------------------
// Helper tanggal (semua tanggal disimpan pada tengah malam UTC agar
// konsisten dengan frontend yang mengirim "yyyy-MM-dd")
// ------------------------------------------------------------
const today = new Date();

/** Tanggal pada tengah malam UTC — konsisten dengan cara frontend mengirim "yyyy-MM-dd". */
function utcDate(year: number, monthIndex: number, day: number): Date {
  return new Date(Date.UTC(year, monthIndex, day));
}

/** Hari ke-`day` pada bulan `offset` bulan ke belakang (offset 0 = bulan berjalan). */
function dayInMonth(offset: number, day: number): Date {
  const base = new Date(today.getFullYear(), today.getMonth() - offset, 1);
  const lastDay = new Date(base.getFullYear(), base.getMonth() + 1, 0).getDate();
  return utcDate(base.getFullYear(), base.getMonth(), Math.min(day, lastDay));
}

/** Rentang penuh satu bulan (awal → akhir hari terakhir) untuk `offset` bulan ke belakang. */
function monthRange(offset: number): { start: Date; end: Date } {
  const base = new Date(today.getFullYear(), today.getMonth() - offset, 1);
  const year = base.getFullYear();
  const month = base.getMonth();
  return {
    start: utcDate(year, month, 1),
    end: new Date(Date.UTC(year, month + 1, 0, 23, 59, 59, 999)),
  };
}

/** Tambah `months` bulan pada sebuah tanggal (UTC, agar konsisten dengan data transaksi). */
function addMonths(date: Date, months: number): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + months, date.getUTCDate()));
}

/** True bila tanggal tidak melewati hari ini (agar tidak ada transaksi di masa depan). */
function isNotFuture(date: Date): boolean {
  const endOfToday = new Date(
    Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate(), 23, 59, 59),
  );
  return date.getTime() <= endOfToday.getTime();
}

/**
 * Hari `day` pada bulan `offset`. Untuk bulan berjalan, tanggal yang belum tiba
 * ditarik mundur ke hari ini agar transaksi tetap muncul walau seed dijalankan
 * di awal bulan.
 */
function scheduledDay(offset: number, day: number): Date {
  if (offset === 0) return dayInMonth(0, Math.min(day, today.getUTCDate()));
  return dayInMonth(offset, day);
}

// ------------------------------------------------------------
// Katalog data dummy
// ------------------------------------------------------------

/**
 * Akun keuangan (beragam tipe, termasuk satu akun arsip).
 *
 * `targetBalance` = saldo akhir yang diinginkan. Seed menghitung `openingBalance`
 * dari selisih seluruh transaksi yang dihasilkan, sehingga saldo tiap akun selalu
 * masuk akal (positif & konsisten) tanpa perlu menebak nominal awal.
 * Catatan: tipe `LOAN` tidak dipakai karena saldo pinjaman yang realistis butuh
 * `openingBalance` negatif, sedangkan form akun hanya menerima nilai ≥ 0.
 */
const ACCOUNTS: {
  name: string;
  type: AccountType;
  color: string;
  icon: string;
  targetBalance: bigint;
  isArchived?: boolean;
}[] = [
  {
    name: "Dompet Tunai",
    type: "CASH",
    color: "#22c55e",
    icon: "wallet",
    targetBalance: 2_500_000n,
  },
  {
    name: "Tabungan Utama",
    type: "BANK",
    color: "#3b82f6",
    icon: "landmark",
    targetBalance: 65_000_000n,
  },
  {
    name: "Rekening Gaji",
    type: "BANK",
    color: "#0ea5e9",
    icon: "building-2",
    targetBalance: 25_000_000n,
  },
  {
    name: "GoPay",
    type: "EWALLET",
    color: "#10b981",
    icon: "smartphone",
    targetBalance: 500_000n,
  },
  {
    name: "OVO",
    type: "EWALLET",
    color: "#8b5cf6",
    icon: "smartphone",
    targetBalance: 300_000n,
  },
  {
    name: "Kartu Kredit BNI",
    type: "CREDIT_CARD",
    color: "#ef4444",
    icon: "credit-card",
    targetBalance: -1_750_000n,
  },
  {
    name: "Reksa Dana Bibit",
    type: "INVESTMENT",
    color: "#6366f1",
    icon: "trending-up",
    targetBalance: 12_500_000n,
  },
  {
    name: "Dompet Lama (Arsip)",
    type: "CASH",
    color: "#f59e0b",
    icon: "wallet",
    targetBalance: 0n,
    isArchived: true,
  },
];

/** Kategori induk + sub-kategori (dihubungkan lewat `parent`). */
const CATEGORIES: {
  name: string;
  kind: CategoryKind;
  color: string;
  icon: string;
  parent?: string;
}[] = [
  // ---------------- EXPENSE ----------------
  { name: "Makanan & Minuman", kind: "EXPENSE", color: "#ef4444", icon: "utensils" },
  {
    name: "Makan di Luar",
    kind: "EXPENSE",
    color: "#f97316",
    icon: "utensils-crossed",
    parent: "Makanan & Minuman",
  },
  {
    name: "Belanja Bulanan",
    kind: "EXPENSE",
    color: "#fb7185",
    icon: "shopping-cart",
    parent: "Makanan & Minuman",
  },
  { name: "Transportasi", kind: "EXPENSE", color: "#f59e0b", icon: "car" },
  {
    name: "Bensin & Tol",
    kind: "EXPENSE",
    color: "#eab308",
    icon: "fuel",
    parent: "Transportasi",
  },
  {
    name: "Transport Online",
    kind: "EXPENSE",
    color: "#facc15",
    icon: "bike",
    parent: "Transportasi",
  },
  { name: "Belanja", kind: "EXPENSE", color: "#8b5cf6", icon: "shopping-bag" },
  { name: "Tagihan & Utilitas", kind: "EXPENSE", color: "#0ea5e9", icon: "receipt" },
  {
    name: "Listrik & Air",
    kind: "EXPENSE",
    color: "#38bdf8",
    icon: "zap",
    parent: "Tagihan & Utilitas",
  },
  {
    name: "Internet & Pulsa",
    kind: "EXPENSE",
    color: "#06b6d4",
    icon: "wifi",
    parent: "Tagihan & Utilitas",
  },
  { name: "Hiburan", kind: "EXPENSE", color: "#ec4899", icon: "film" },
  { name: "Kesehatan", kind: "EXPENSE", color: "#22c55e", icon: "heart-pulse" },
  { name: "Pendidikan", kind: "EXPENSE", color: "#6366f1", icon: "graduation-cap" },
  { name: "Sewa & Tempat Tinggal", kind: "EXPENSE", color: "#0d9488", icon: "home" },
  { name: "Cicilan & Utang", kind: "EXPENSE", color: "#a16207", icon: "landmark" },
  { name: "Donasi & Zakat", kind: "EXPENSE", color: "#14b8a6", icon: "heart-handshake" },
  { name: "Perawatan Diri", kind: "EXPENSE", color: "#d946ef", icon: "sparkles" },
  { name: "Lainnya", kind: "EXPENSE", color: "#64748b", icon: "circle-ellipsis" },
  // ---------------- INCOME ----------------
  { name: "Gaji", kind: "INCOME", color: "#16a34a", icon: "wallet" },
  { name: "Bonus", kind: "INCOME", color: "#22c55e", icon: "gift" },
  { name: "Investasi", kind: "INCOME", color: "#10b981", icon: "trending-up" },
  { name: "Dividen", kind: "INCOME", color: "#059669", icon: "line-chart", parent: "Investasi" },
  {
    name: "Bunga Bank",
    kind: "INCOME",
    color: "#34d399",
    icon: "piggy-bank",
    parent: "Investasi",
  },
  { name: "Penghasilan Sampingan", kind: "INCOME", color: "#4ade80", icon: "laptop" },
  { name: "Lainnya", kind: "INCOME", color: "#64748b", icon: "circle-ellipsis" },
];

/** Tag untuk menandai transaksi. */
const TAGS: { name: string; color: string }[] = [
  { name: "rutin", color: "#0ea5e9" },
  { name: "keluarga", color: "#ec4899" },
  { name: "kerja", color: "#8b5cf6" },
  { name: "liburan", color: "#f59e0b" },
  { name: "darurat", color: "#ef4444" },
];

/** Budget: bulan berjalan (offset 0) & bulan lalu (offset 1). */
const BUDGETS: {
  name: string;
  amount: bigint;
  frequency: RecurFreq;
  monthOffset: number;
  category?: string;
  account?: string;
}[] = [
  {
    name: "Budget Makan & Minum",
    amount: 2_500_000n,
    frequency: "MONTHLY",
    monthOffset: 0,
    category: "Makanan & Minuman",
  },
  {
    name: "Budget Transportasi",
    amount: 1_200_000n,
    frequency: "MONTHLY",
    monthOffset: 0,
    category: "Transportasi",
  },
  {
    name: "Budget Belanja",
    amount: 1_500_000n,
    frequency: "MONTHLY",
    monthOffset: 0,
    category: "Belanja",
  },
  {
    name: "Tagihan Bulanan",
    amount: 1_800_000n,
    frequency: "MONTHLY",
    monthOffset: 0,
    category: "Listrik & Air",
  },
  {
    name: "Budget Hiburan",
    amount: 600_000n,
    frequency: "MONTHLY",
    monthOffset: 0,
    category: "Hiburan",
  },
  {
    name: "Budget Kesehatan",
    amount: 500_000n,
    frequency: "MONTHLY",
    monthOffset: 0,
    category: "Kesehatan",
  },
  {
    name: "Sewa Tempat Tinggal",
    amount: 3_500_000n,
    frequency: "MONTHLY",
    monthOffset: 0,
    category: "Sewa & Tempat Tinggal",
  },
  {
    name: "Budget E-Wallet",
    amount: 1_000_000n,
    frequency: "MONTHLY",
    monthOffset: 0,
    account: "GoPay",
  },
  {
    name: "Budget Makan & Minum (bulan lalu)",
    amount: 2_400_000n,
    frequency: "MONTHLY",
    monthOffset: 1,
    category: "Makanan & Minuman",
  },
  {
    name: "Budget Transportasi (bulan lalu)",
    amount: 1_100_000n,
    frequency: "MONTHLY",
    monthOffset: 1,
    category: "Transportasi",
  },
];

/** Target tabungan (beragam progres, termasuk yang sudah tercapai). */
const GOALS: {
  name: string;
  targetAmount: bigint;
  savedAmount: bigint;
  monthsAhead: number | null;
  color: string;
  account?: string;
  isCompleted?: boolean;
}[] = [
  {
    name: "Dana Darurat 6 Bulan",
    targetAmount: 36_000_000n,
    savedAmount: 21_500_000n,
    monthsAhead: 10,
    color: "#22c55e",
    account: "Tabungan Utama",
  },
  {
    name: "Liburan ke Jepang",
    targetAmount: 25_000_000n,
    savedAmount: 8_750_000n,
    monthsAhead: 14,
    color: "#ec4899",
    account: "Tabungan Utama",
  },
  {
    name: "DP Rumah",
    targetAmount: 150_000_000n,
    savedAmount: 42_000_000n,
    monthsAhead: 30,
    color: "#0ea5e9",
    account: "Reksa Dana Bibit",
  },
  {
    name: "Laptop Kerja Baru",
    targetAmount: 18_000_000n,
    savedAmount: 15_300_000n,
    monthsAhead: 4,
    color: "#8b5cf6",
    account: "Tabungan Utama",
  },
  {
    name: "Motor Listrik",
    targetAmount: 22_000_000n,
    savedAmount: 3_300_000n,
    monthsAhead: 18,
    color: "#f59e0b",
  },
  {
    name: "Dana Pernikahan",
    targetAmount: 80_000_000n,
    savedAmount: 80_000_000n,
    monthsAhead: null,
    color: "#14b8a6",
    account: "Tabungan Utama",
    isCompleted: true,
  },
];

/** Jadwal transaksi berulang (tagihan langganan & rutinitas). */
const RECURRENCES: {
  name: string;
  type: TxType;
  amount: bigint;
  freq: RecurFreq;
  interval: number;
  /** MONTHLY/YEARLY: hari dalam bulan · WEEKLY: hari dalam minggu (1 = Senin). */
  nextRunDay: number;
  account: string;
  toAccount?: string;
  category?: string;
  note?: string;
  isActive?: boolean;
}[] = [
  {
    name: "Gaji Bulanan",
    type: "INCOME",
    amount: 12_500_000n,
    freq: "MONTHLY",
    interval: 1,
    nextRunDay: 3,
    account: "Rekening Gaji",
    category: "Gaji",
    note: "Transfer otomatis dari perusahaan",
  },
  {
    name: "Sewa Apartemen",
    type: "EXPENSE",
    amount: 3_500_000n,
    freq: "MONTHLY",
    interval: 1,
    nextRunDay: 5,
    account: "Rekening Gaji",
    category: "Sewa & Tempat Tinggal",
    note: "Transfer ke pemilik",
  },
  {
    name: "Langganan Netflix",
    type: "EXPENSE",
    amount: 186_000n,
    freq: "MONTHLY",
    interval: 1,
    nextRunDay: 12,
    account: "Kartu Kredit BNI",
    category: "Hiburan",
    note: "Paket Standar",
  },
  {
    name: "Langganan Spotify",
    type: "EXPENSE",
    amount: 54_990n,
    freq: "MONTHLY",
    interval: 1,
    nextRunDay: 8,
    account: "GoPay",
    category: "Hiburan",
    note: "Paket Premium",
  },
  {
    name: "Cicilan KPR",
    type: "EXPENSE",
    amount: 4_200_000n,
    freq: "MONTHLY",
    interval: 1,
    nextRunDay: 10,
    account: "Rekening Gaji",
    category: "Cicilan & Utang",
    note: "Angsuran rumah",
  },
  {
    name: "Tabungan Mingguan",
    type: "TRANSFER",
    amount: 500_000n,
    freq: "WEEKLY",
    interval: 1,
    nextRunDay: 1,
    account: "Rekening Gaji",
    toAccount: "Tabungan Utama",
    note: "Sisihkan otomatis tiap Senin",
  },
  {
    name: "Top Up E-Wallet",
    type: "TRANSFER",
    amount: 300_000n,
    freq: "WEEKLY",
    interval: 1,
    nextRunDay: 3,
    account: "Tabungan Utama",
    toAccount: "GoPay",
    note: "Dijeda sementara",
    isActive: false,
  },
  {
    name: "Bayar Air & Listrik",
    type: "EXPENSE",
    amount: 450_000n,
    freq: "MONTHLY",
    interval: 1,
    nextRunDay: 18,
    account: "Tabungan Utama",
    category: "Listrik & Air",
    note: "Token listrik + PDAM",
  },
];

// ------------------------------------------------------------
// Pembuat transaksi
// ------------------------------------------------------------
type Lookups = {
  account: Map<string, string>;
  category: Map<string, string>; // key: `${kind}:${name}`
};

type TxSeed = {
  type: TxType;
  amount: bigint;
  date: Date;
  account: string;
  toAccount?: string;
  category?: { kind: CategoryKind; name: string };
  note?: string;
  payee?: string;
  recurrence?: string; // nama jadwal berulang
  tags?: string[];
};

/** Kolam pengeluaran harian: bobot, kategori, nominal, akun, dan payee. */
type ExpensePool = {
  weight: number;
  categories: string[];
  min: number;
  max: number;
  step: number;
  accounts: string[];
  payees: readonly string[];
  notes: readonly string[];
  tags?: string[];
};

const EXPENSE_POOLS: ExpensePool[] = [
  {
    weight: 0.3,
    categories: ["Makanan & Minuman", "Makanan & Minuman", "Makan di Luar"],
    min: 25_000,
    max: 95_000,
    step: 500,
    accounts: ["Dompet Tunai", "GoPay", "OVO"],
    payees: [
      "Warung Bu Tini",
      "Kantin Kantor",
      "Warteg Bahari",
      "Sederhana Minang",
      "Bakso Pak Kumis",
      "Ayam Geprek Bensu",
      "GoFood - Nasi Padang",
      "GrabFood - KFC",
      "Bakmi GM",
      "Sate Taichan Goreng",
    ],
    notes: ["Makan siang", "Sarapan", "Makan malam", "Nasi bungkus", "Makan bareng tim"],
  },
  {
    weight: 0.14,
    categories: ["Makanan & Minuman", "Makan di Luar"],
    min: 18_000,
    max: 60_000,
    step: 500,
    accounts: ["GoPay", "OVO", "Dompet Tunai"],
    payees: [
      "Kopi Kenangan",
      "Kopi Janji Jiwa",
      "Starbucks",
      "Tuku Coffee",
      "Toko Kue Harum",
      "Chatime",
      "Mixue",
    ],
    notes: ["Kopi pagi", "Camilan sore", "Ngopi bareng klien", "Es krim"],
  },
  {
    weight: 0.09,
    categories: ["Makanan & Minuman", "Belanja Bulanan"],
    min: 150_000,
    max: 650_000,
    step: 1_000,
    accounts: ["Tabungan Utama", "Kartu Kredit BNI", "Dompet Tunai"],
    payees: [
      "Indomaret",
      "Alfamart",
      "Superindo",
      "Transmart",
      "Hypermart",
      "Pasar Minggu",
      "Toko Sayur Segar",
    ],
    notes: ["Belanja bulanan", "Belanja mingguan", "Sayur & buah", "Stok dapur"],
    tags: ["keluarga"],
  },
  {
    weight: 0.19,
    categories: ["Transportasi", "Transportasi", "Bensin & Tol", "Transport Online"],
    min: 12_000,
    max: 130_000,
    step: 500,
    accounts: ["Dompet Tunai", "GoPay", "OVO"],
    payees: [
      "Gojek",
      "Grab",
      "Blue Bird",
      "Ojek Online",
      "Parkir Mall",
      "SPBU Pertamina",
      "Shell",
      "KRL Commuter",
      "TransJakarta",
      "Tol Cipularang",
    ],
    notes: ["Ongkos ke kantor", "Antar jemput", "Isi bensin", "Tarif tol", "Parkir"],
    tags: ["rutin"],
  },
  {
    weight: 0.02,
    categories: ["Belanja"],
    min: 120_000,
    max: 950_000,
    step: 1_000,
    accounts: ["Kartu Kredit BNI", "Tabungan Utama", "GoPay"],
    payees: [
      "Tokopedia",
      "Shopee",
      "Lazada",
      "Uniqlo",
      "H&M",
      "Informa",
      "Ace Hardware",
      "Erafone",
    ],
    notes: ["Baju kerja", "Peralatan rumah", "Aksesori gadget", "Sepatu baru"],
  },
  {
    weight: 0.055,
    categories: ["Hiburan"],
    min: 45_000,
    max: 380_000,
    step: 1_000,
    accounts: ["GoPay", "Kartu Kredit BNI", "Dompet Tunai"],
    payees: [
      "Bioskop XXI",
      "CGV",
      "Steam",
      "Google Play",
      "Karaoke Happy Puppy",
      "Bowling Artha Gading",
      "Taman Impian Jaya",
    ],
    notes: ["Nonton bareng", "Main game", "Jalan-jalan akhir pekan", "Karaoke"],
  },
  {
    weight: 0.03,
    categories: ["Kesehatan"],
    min: 60_000,
    max: 420_000,
    step: 1_000,
    accounts: ["Dompet Tunai", "OVO", "Tabungan Utama"],
    payees: [
      "Apotek K24",
      "Kimia Farma",
      "Klinik Sehat",
      "Guardian",
      "RS Mitra Keluarga",
      "Dokter Gigi",
    ],
    notes: ["Obat batuk", "Vitamin", "Periksa dokter", "Scaling gigi"],
    tags: ["darurat"],
  },
  {
    weight: 0.03,
    categories: ["Perawatan Diri"],
    min: 50_000,
    max: 320_000,
    step: 1_000,
    accounts: ["GoPay", "Dompet Tunai", "OVO"],
    payees: ["Barbershop Gentleman", "Salon Cantik", "Wardah Store", "Sociolla", "Massage & Spa"],
    notes: ["Potong rambut", "Skincare", "Perawatan wajah"],
  },
  {
    weight: 0.02,
    categories: ["Donasi & Zakat"],
    min: 50_000,
    max: 500_000,
    step: 1_000,
    accounts: ["Tabungan Utama", "Dompet Tunai"],
    payees: [
      "Masjid Al-Ikhlas",
      "Dompet Dhuafa",
      "Rumah Zakat",
      "Yayasan Anak Yatim",
      "Donasi Bencana",
    ],
    notes: ["Infaq Jumat", "Zakat bulanan", "Sumbangan sosial"],
  },
  {
    weight: 0.015,
    categories: ["Pendidikan"],
    min: 100_000,
    max: 650_000,
    step: 1_000,
    accounts: ["Kartu Kredit BNI", "Tabungan Utama"],
    payees: ["Udemy Course", "Coursera", "Gramedia", "Skill Academy", "Workshop Online"],
    notes: ["Kelas online", "Buku referensi", "Workshop desain"],
  },
  {
    weight: 0.07,
    categories: ["Lainnya"],
    min: 15_000,
    max: 280_000,
    step: 500,
    accounts: ["Dompet Tunai", "Tabungan Utama", "GoPay"],
    payees: [
      "Biaya Admin Bank",
      "Iuran RT",
      "Sumbangan Tetangga",
      "Kado Ulang Tahun",
      "Servis Motor",
      "Laundry Kiloan",
      "Cuci Mobil",
      "Tukang Perbaikan",
    ],
    notes: ["Keperluan rumah", "Biaya tak terduga", "Servis rutin", "Laundry"],
  },
];

/** Pilih satu elemen acak berdasarkan bobot `weight`. */
function pickWeighted<T extends { weight: number }>(items: readonly T[]): T {
  const total = items.reduce((sum, item) => sum + item.weight, 0);
  let roll = rng() * total;
  for (const item of items) {
    roll -= item.weight;
    if (roll <= 0) return item;
  }
  return items[items.length - 1];
}

/** Nominal acak dalam rentang, dibulatkan ke `step` terdekat. */
function randMoney(min: number, max: number, step: number): number {
  return roundTo(min + rng() * (max - min), step);
}

/** Tambah `interval` periode sesuai frekuensi (mirip routes/recurrences.ts). */
function addInterval(date: Date, freq: RecurFreq, interval: number): Date {
  const next = new Date(date);
  switch (freq) {
    case "DAILY":
      next.setUTCDate(next.getUTCDate() + interval);
      break;
    case "WEEKLY":
      next.setUTCDate(next.getUTCDate() + 7 * interval);
      break;
    case "MONTHLY":
      next.setUTCMonth(next.getUTCMonth() + interval);
      break;
    case "YEARLY":
      next.setUTCFullYear(next.getUTCFullYear() + interval);
      break;
  }
  return next;
}

/** Seluruh jadwal dari `start` sampai sebelum `until`. */
function buildSchedule(start: Date, freq: RecurFreq, interval: number, until: Date): Date[] {
  const out: Date[] = [];
  let cursor = new Date(start);
  let guard = 0;
  while (cursor < until && guard < 2000) {
    out.push(new Date(cursor));
    cursor = addInterval(cursor, freq, interval);
    guard += 1;
  }
  return out;
}

/**
 * Transaksi tetap tiap bulan: gaji, bonus, sewa, cicilan, langganan, tagihan.
 * Inilah yang membuat halaman "Transaksi Berulang" punya padanan riwayat nyata.
 */
function monthlyFixed(): TxSeed[] {
  const out: TxSeed[] = [];

  for (let offset = HISTORY_MONTHS - 1; offset >= 0; offset -= 1) {
    // --- Gaji bulanan (tanggal 3, kadang mundur 1–3 hari) ---
    const payDay = chance(0.25) ? 4 + randInt(0, 2) : 3;
    const salaryDate = scheduledDay(offset, payDay);
    if (isNotFuture(salaryDate)) {
      out.push({
        type: "INCOME",
        amount: BigInt(12_500_000 + randInt(0, 4) * 250_000),
        date: salaryDate,
        account: "Rekening Gaji",
        category: { kind: "INCOME", name: "Gaji" },
        note: "Gaji bulanan",
        payee: "PT Nusantara Digital",
        recurrence: "Gaji Bulanan",
        tags: ["kerja"],
      });
    }

    // --- Bonus kuartalan (setiap 3 bulan) ---
    if (offset % 3 === 0) {
      const bonusDate = scheduledDay(offset, 12);
      if (isNotFuture(bonusDate)) {
        out.push({
          type: "INCOME",
          amount: BigInt(roundTo(randInt(3, 9) * 1_000_000, 500_000)),
          date: bonusDate,
          account: "Rekening Gaji",
          category: { kind: "INCOME", name: "Bonus" },
          note: "Bonus performa kuartalan",
          payee: "PT Nusantara Digital",
          tags: ["kerja"],
        });
      }
    }

    // --- Sewa apartemen (tanggal 5) ---
    const rentDate = scheduledDay(offset, 5);
    if (isNotFuture(rentDate)) {
      out.push({
        type: "EXPENSE",
        amount: 3_500_000n,
        date: rentDate,
        account: "Rekening Gaji",
        category: { kind: "EXPENSE", name: "Sewa & Tempat Tinggal" },
        note: "Sewa apartemen bulanan",
        payee: "Bapak Hendra (pemilik)",
        recurrence: "Sewa Apartemen",
        tags: ["rutin"],
      });
    }

    // --- Cicilan KPR (tanggal 10) ---
    const kprDate = scheduledDay(offset, 10);
    if (isNotFuture(kprDate)) {
      out.push({
        type: "EXPENSE",
        amount: 4_200_000n,
        date: kprDate,
        account: "Rekening Gaji",
        category: { kind: "EXPENSE", name: "Cicilan & Utang" },
        note: "Angsuran KPR rumah",
        payee: "Bank Mandiri",
        recurrence: "Cicilan KPR",
        tags: ["rutin"],
      });
    }

    // --- Langganan digital ---
    const spotifyDate = scheduledDay(offset, 8);
    if (isNotFuture(spotifyDate)) {
      out.push({
        type: "EXPENSE",
        amount: 54_990n,
        date: spotifyDate,
        account: "GoPay",
        category: { kind: "EXPENSE", name: "Hiburan" },
        note: "Langganan Spotify Premium",
        payee: "Spotify",
        recurrence: "Langganan Spotify",
      });
    }

    const netflixDate = scheduledDay(offset, 12);
    if (isNotFuture(netflixDate)) {
      out.push({
        type: "EXPENSE",
        amount: 186_000n,
        date: netflixDate,
        account: "Kartu Kredit BNI",
        category: { kind: "EXPENSE", name: "Hiburan" },
        note: "Langganan Netflix",
        payee: "Netflix",
        recurrence: "Langganan Netflix",
      });
    }

    // --- Iuran lingkungan (tanggal 7) — kategori induk Tagihan & Utilitas ---
    const iuranDate = scheduledDay(offset, 7);
    if (isNotFuture(iuranDate)) {
      out.push({
        type: "EXPENSE",
        amount: BigInt(roundTo(randInt(150_000, 300_000), 5_000)),
        date: iuranDate,
        account: "Tabungan Utama",
        category: { kind: "EXPENSE", name: "Tagihan & Utilitas" },
        note: "Iuran keamanan & kebersihan",
        payee: "RT/RW Komplek",
        tags: ["rutin"],
      });
    }

    // --- Tagihan listrik & air (tanggal 18) ---
    const utilityDate = scheduledDay(offset, 18);
    if (isNotFuture(utilityDate)) {
      out.push({
        type: "EXPENSE",
        amount: BigInt(roundTo(randInt(380_000, 620_000), 5_000)),
        date: utilityDate,
        account: "Tabungan Utama",
        category: { kind: "EXPENSE", name: "Listrik & Air" },
        note: "Token listrik + tagihan PDAM",
        payee: "PLN & PDAM",
        recurrence: "Bayar Air & Listrik",
        tags: ["rutin"],
      });
    }

    // --- Internet & pulsa (tanggal 20) ---
    const internetDate = scheduledDay(offset, 20);
    if (isNotFuture(internetDate)) {
      out.push({
        type: "EXPENSE",
        amount: BigInt(roundTo(randInt(300_000, 420_000), 5_000)),
        date: internetDate,
        account: "Kartu Kredit BNI",
        category: { kind: "EXPENSE", name: "Internet & Pulsa" },
        note: "IndiHome + paket data",
        payee: "Telkom & Telkomsel",
        tags: ["rutin"],
      });
    }
  }

  return out;
}

/** Pengeluaran harian acak + pemasukan sampingan sesekali (per bulan). */
function dailyRandom(): TxSeed[] {
  const out: TxSeed[] = [];

  for (let offset = HISTORY_MONTHS - 1; offset >= 0; offset -= 1) {
    const { end } = monthRange(offset);
    const lastDay = end.getUTCDate();

    for (let day = 1; day <= lastDay; day += 1) {
      const date = scheduledDay(offset, day);
      if (!isNotFuture(date)) continue;

      // Akhir pekan lebih ramai belanja/hiburan, hari kerja lebih banyak transport.
      const weekend = date.getUTCDay() === 0 || date.getUTCDay() === 6;
      const count = weekend ? randInt(1, 3) : randInt(1, 2);

      for (let i = 0; i < count; i += 1) {
        const pool = pickWeighted(EXPENSE_POOLS);
        const category = pick(pool.categories);
        out.push({
          type: "EXPENSE",
          amount: BigInt(randMoney(pool.min, pool.max, pool.step)),
          date,
          account: pick(pool.accounts),
          category: { kind: "EXPENSE", name: category },
          note: pick(pool.notes),
          payee: pick(pool.payees),
          tags: pool.tags,
        });
      }

      // Pemasukan sampingan: proyek lepas / jual barang (jarang tapi rutin).
      if (chance(0.06)) {
        out.push({
          type: "INCOME",
          amount: BigInt(roundTo(randInt(400_000, 3_500_000), 50_000)),
          date,
          account: "Tabungan Utama",
          category: { kind: "INCOME", name: "Penghasilan Sampingan" },
          note: pick([
            "Proyek desain lepas",
            "Jasa konsultasi",
            "Jual barang bekas",
            "Honor mengajar",
          ]),
          payee: pick(["Klien Freelance", "Toko Online", "Komunitas"]),
        });
      }
    }

    // Dividen & bunga investasi (kuartalan).
    if (offset % 3 === 1) {
      const dividendDate = scheduledDay(offset, 15);
      if (isNotFuture(dividendDate)) {
        out.push({
          type: "INCOME",
          amount: BigInt(roundTo(randInt(350_000, 1_800_000), 50_000)),
          date: dividendDate,
          account: "Reksa Dana Bibit",
          category: { kind: "INCOME", name: "Dividen" },
          note: "Dividen reksa dana",
          payee: "Bibit",
        });
      }
    }
  }

  return out;
}

/** Transfer antar akun: tabungan mingguan, top up e-wallet, bayar kartu kredit. */
function transfers(): TxSeed[] {
  const out: TxSeed[] = [];

  for (let offset = HISTORY_MONTHS - 1; offset >= 0; offset -= 1) {
    // --- Tabungan mingguan (tiap Senin) ---
    const base = new Date(today.getFullYear(), today.getMonth() - offset, 1);
    const monthStart = utcDate(base.getFullYear(), base.getMonth(), 1);
    const firstMonday = new Date(monthStart);
    const delta = (8 - firstMonday.getUTCDay()) % 7; // 0 bila Senin
    firstMonday.setUTCDate(firstMonday.getUTCDate() + delta);

    for (const date of buildSchedule(firstMonday, "WEEKLY", 1, addMonths(monthStart, 1))) {
      if (!isNotFuture(date)) continue;
      out.push({
        type: "TRANSFER",
        amount: 500_000n,
        date,
        account: "Rekening Gaji",
        toAccount: "Tabungan Utama",
        note: "Sisihkan tabungan mingguan",
        recurrence: "Tabungan Mingguan",
      });
    }

    // --- Top up e-wallet (2× sebulan) ---
    for (const day of [6, 21]) {
      const date = scheduledDay(offset, day);
      if (!isNotFuture(date)) continue;
      out.push({
        type: "TRANSFER",
        amount: BigInt(roundTo(randInt(250_000, 600_000), 50_000)),
        date,
        account: "Tabungan Utama",
        toAccount: chance(0.6) ? "GoPay" : "OVO",
        note: "Top up dompet digital",
      });
    }

    // --- Bayar tagihan kartu kredit (tanggal 22) ---
    const cardDate = scheduledDay(offset, 22);
    if (isNotFuture(cardDate)) {
      out.push({
        type: "TRANSFER",
        amount: BigInt(roundTo(randInt(1_200_000, 2_800_000), 50_000)),
        date: cardDate,
        account: "Tabungan Utama",
        toAccount: "Kartu Kredit BNI",
        note: "Pembayaran tagihan kartu kredit",
        tags: ["rutin"],
      });
    }

    // --- Nabung ke reksa dana (tanggal 26) ---
    const investDate = scheduledDay(offset, 26);
    if (isNotFuture(investDate)) {
      out.push({
        type: "TRANSFER",
        amount: BigInt(roundTo(randInt(1_000_000, 3_000_000), 250_000)),
        date: investDate,
        account: "Tabungan Utama",
        toAccount: "Reksa Dana Bibit",
        note: "Auto-invest reksa dana",
        tags: ["rutin"],
      });
    }

    // --- Tarik tunai ATM (2× sebulan) ---
    for (const day of [3, 17]) {
      const date = scheduledDay(offset, day);
      if (!isNotFuture(date)) continue;
      out.push({
        type: "TRANSFER",
        amount: BigInt(roundTo(randInt(300_000, 1_000_000), 50_000)),
        date,
        account: "Rekening Gaji",
        toAccount: "Dompet Tunai",
        note: "Tarik tunai ATM",
      });
    }

    // --- Setor tunai ke rekening (sesekali) ---
    if (chance(0.5)) {
      const depositDate = scheduledDay(offset, randInt(11, 19));
      if (isNotFuture(depositDate)) {
        out.push({
          type: "TRANSFER",
          amount: BigInt(roundTo(randInt(200_000, 800_000), 50_000)),
          date: depositDate,
          account: "Dompet Tunai",
          toAccount: "Tabungan Utama",
          note: "Setor uang tunai",
        });
      }
    }
  }

  return out;
}

// ------------------------------------------------------------
// Seed utama
// ------------------------------------------------------------

/** Hapus seluruh data keuangan milik user (urutan mengikuti dependensi relasi). */
async function resetFinanceData(userId: string): Promise<void> {
  const transactions = await prisma.transaction.deleteMany({ where: { userId } });
  const recurrences = await prisma.recurrence.deleteMany({ where: { userId } });
  const budgets = await prisma.budget.deleteMany({ where: { userId } });
  const goals = await prisma.goal.deleteMany({ where: { userId } });
  const tags = await prisma.tag.deleteMany({ where: { userId } });
  const categories = await prisma.category.deleteMany({ where: { userId } });
  const accounts = await prisma.financeAccount.deleteMany({ where: { userId } });

  console.log(
    `   ⟲ bersihkan data lama: ${transactions.count} transaksi, ${recurrences.count} jadwal, ` +
      `${budgets.count} budget, ${goals.count} target, ${tags.count} tag, ` +
      `${categories.count} kategori, ${accounts.count} akun`,
  );
}

/** Upsert user demo + kredensial login (Better Auth menyimpan password di `account`). */
async function ensureUser(): Promise<string> {
  const hashedPassword = await hashPassword(DEMO_PASSWORD);

  const user = await prisma.user.upsert({
    where: { email: DEMO_EMAIL },
    update: { emailVerified: true, name: DEMO_NAME },
    create: {
      id: randomUUID(),
      name: DEMO_NAME,
      email: DEMO_EMAIL,
      emailVerified: true,
      baseCurrency: "IDR",
      timezone: "Asia/Jakarta",
    },
  });

  const existingCredential = await prisma.account.findFirst({
    where: { userId: user.id, providerId: "credential" },
  });

  if (existingCredential) {
    await prisma.account.update({
      where: { id: existingCredential.id },
      data: { password: hashedPassword },
    });
  } else {
    await prisma.account.create({
      data: {
        id: randomUUID(),
        accountId: user.id,
        providerId: "credential",
        userId: user.id,
        password: hashedPassword,
      },
    });
  }

  console.log(`   ✓ user ${user.email} + kredensial login`);
  return user.id;
}

/**
 * Buat semua akun keuangan; mengembalikan peta nama → id.
 *
 * `openingBalance` diisi 0 dulu; setelah transaksi dibuat, `reconcileBalances`
 * menetapkan saldo awal agar saldo akhir tiap akun sama dengan `targetBalance`.
 */
async function createAccounts(userId: string): Promise<Map<string, string>> {
  const map = new Map<string, string>();

  for (const [index, account] of ACCOUNTS.entries()) {
    const created = await prisma.financeAccount.create({
      data: {
        userId,
        name: account.name,
        type: account.type,
        color: account.color,
        icon: account.icon,
        openingBalance: 0n,
        isArchived: account.isArchived ?? false,
        sortOrder: index + 1,
      },
    });
    map.set(account.name, created.id);
  }

  console.log(`   ✓ ${ACCOUNTS.length} akun keuangan`);
  return map;
}

/** Buat kategori (induk lebih dulu) + sub-kategori; mengembalikan peta `kind:nama` → id. */
async function createCategories(userId: string): Promise<Map<string, string>> {
  const map = new Map<string, string>();

  const ordered = [...CATEGORIES.filter((c) => !c.parent), ...CATEGORIES.filter((c) => c.parent)];

  for (const category of ordered) {
    const parentId = category.parent ? map.get(`${category.kind}:${category.parent}`) : undefined;
    const created = await prisma.category.create({
      data: {
        userId,
        name: category.name,
        kind: category.kind,
        color: category.color,
        icon: category.icon,
        parentId: parentId ?? null,
      },
    });
    map.set(`${category.kind}:${category.name}`, created.id);
  }

  const parents = CATEGORIES.filter((c) => c.parent).length;
  console.log(`   ✓ ${CATEGORIES.length} kategori (${parents} sub-kategori)`);
  return map;
}

/** Buat tag; mengembalikan peta nama → id. */
async function createTags(userId: string): Promise<Map<string, string>> {
  const map = new Map<string, string>();

  for (const tag of TAGS) {
    const created = await prisma.tag.create({
      data: { userId, name: tag.name, color: tag.color },
    });
    map.set(tag.name, created.id);
  }

  console.log(`   ✓ ${TAGS.length} tag`);
  return map;
}

/** Buat budget per periode (bulan berjalan & sebelumnya). */
async function createBudgets(userId: string, lookups: Lookups): Promise<void> {
  for (const budget of BUDGETS) {
    const { start, end } = monthRange(budget.monthOffset);
    const categoryId = budget.category
      ? (lookups.category.get(`EXPENSE:${budget.category}`) ?? null)
      : null;
    const accountId = budget.account ? (lookups.account.get(budget.account) ?? null) : null;

    await prisma.budget.create({
      data: {
        userId,
        name: budget.name,
        amount: budget.amount,
        periodStart: start,
        periodEnd: end,
        frequency: budget.frequency,
        categoryId,
        accountId,
      },
    });
  }

  console.log(`   ✓ ${BUDGETS.length} budget`);
}

/** Buat target tabungan. */
async function createGoals(userId: string, lookups: Lookups): Promise<void> {
  for (const goal of GOALS) {
    const accountId = goal.account ? (lookups.account.get(goal.account) ?? null) : null;
    const targetDate = goal.monthsAhead === null ? null : addMonths(today, goal.monthsAhead);

    await prisma.goal.create({
      data: {
        userId,
        name: goal.name,
        targetAmount: goal.targetAmount,
        savedAmount: goal.savedAmount,
        targetDate,
        color: goal.color,
        accountId,
        isCompleted: goal.isCompleted ?? false,
      },
    });
  }

  console.log(`   ✓ ${GOALS.length} target tabungan`);
}

/** Buat jadwal berulang; `nextRunAt` dihitung maju dari bulan lalu agar masuk akal. */
async function createRecurrences(userId: string, lookups: Lookups): Promise<void> {
  for (const recurrence of RECURRENCES) {
    const accountId = lookups.account.get(recurrence.account);
    if (!accountId) {
      throw new Error(
        `Akun "${recurrence.account}" tidak ditemukan untuk jadwal ${recurrence.name}`,
      );
    }

    const toAccountId = recurrence.toAccount
      ? (lookups.account.get(recurrence.toAccount) ?? null)
      : null;
    const categoryId =
      recurrence.type === "TRANSFER" || !recurrence.category
        ? null
        : (lookups.category.get(
            `${recurrence.type === "INCOME" ? "INCOME" : "EXPENSE"}:${recurrence.category}`,
          ) ?? null);

    // Jadwal berikutnya dihitung sesuai frekuensi.
    let nextRunAt: Date;
    if (recurrence.freq === "WEEKLY") {
      // `nextRunDay` = hari dalam minggu (0 = Minggu … 6 = Sabtu).
      const start = utcDate(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate());
      start.setUTCDate(start.getUTCDate() + 1);
      const target = recurrence.nextRunDay % 7;
      const shift = (target - start.getUTCDay() + 7) % 7;
      start.setUTCDate(start.getUTCDate() + shift);
      nextRunAt = start;
    } else if (recurrence.freq === "DAILY") {
      nextRunAt = utcDate(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate() + 1);
    } else {
      // MONTHLY / YEARLY memakai hari dalam bulan.
      nextRunAt = dayInMonth(0, recurrence.nextRunDay);
      while (nextRunAt <= today) {
        nextRunAt = addMonths(nextRunAt, 1);
      }
    }

    // `lastRunAt` = jadwal satu periode sebelumnya (bila sudah pernah berjalan).
    const previous = addInterval(nextRunAt, recurrence.freq, -recurrence.interval);
    const lastRunAt = previous < today ? previous : null;

    await prisma.recurrence.create({
      data: {
        userId,
        name: recurrence.name,
        type: recurrence.type,
        amount: recurrence.amount,
        freq: recurrence.freq,
        interval: recurrence.interval,
        nextRunAt,
        lastRunAt,
        isActive: recurrence.isActive ?? true,
        accountId,
        toAccountId,
        categoryId,
        note: recurrence.note ?? null,
      },
    });
  }

  const paused = RECURRENCES.filter((r) => r.isActive === false).length;
  console.log(`   ✓ ${RECURRENCES.length} jadwal berulang (${paused} dijeda)`);
}

/**
 * Validasi seluruh seed transaksi lalu simpan ke database.
 *
 * Label akun/kategori/jadwal diselesaikan menjadi id lewat `lookups`. Bila ada
 * referensi yang tidak dikenal, seed langsung gagal agar data demo tetap konsisten.
 */
async function createTransactions(
  userId: string,
  lookups: Lookups,
  recurrenceIds: Map<string, string>,
  tagIds: Map<string, string>,
  seeds: TxSeed[],
): Promise<number> {
  const recurrenceNames = new Set(RECURRENCES.map((r) => r.name));
  const rows: {
    userId: string;
    type: TxType;
    amount: bigint;
    date: Date;
    accountId: string;
    toAccountId: string | null;
    categoryId: string | null;
    note: string | null;
    payee: string | null;
    recurrenceId: string | null;
    tagIds: string[];
  }[] = [];

  for (const seed of seeds) {
    const accountId = lookups.account.get(seed.account);
    if (!accountId) throw new Error(`Akun tidak dikenal pada transaksi: "${seed.account}"`);

    let toAccountId: string | null = null;
    if (seed.type === "TRANSFER") {
      if (!seed.toAccount) throw new Error(`Transfer tanpa akun tujuan (${seed.account})`);
      toAccountId = lookups.account.get(seed.toAccount) ?? null;
      if (!toAccountId) throw new Error(`Akun tujuan tidak dikenal: "${seed.toAccount}"`);
    }

    let categoryId: string | null = null;
    if (seed.category) {
      categoryId = lookups.category.get(`${seed.category.kind}:${seed.category.name}`) ?? null;
      if (!categoryId) {
        throw new Error(`Kategori tidak dikenal: "${seed.category.kind}:${seed.category.name}"`);
      }
    }

    let recurrenceId: string | null = null;
    if (seed.recurrence) {
      if (!recurrenceNames.has(seed.recurrence)) {
        throw new Error(`Jadwal berulang tidak dikenal: "${seed.recurrence}"`);
      }
      recurrenceId = recurrenceIds.get(seed.recurrence) ?? null;
    }

    const resolvedTags = (seed.tags ?? []).map((name) => {
      const id = tagIds.get(name);
      if (!id) throw new Error(`Tag tidak dikenal: "${name}"`);
      return id;
    });

    rows.push({
      userId,
      type: seed.type,
      amount: seed.amount,
      date: seed.date,
      accountId,
      toAccountId,
      categoryId,
      note: seed.note ?? null,
      payee: seed.payee ?? null,
      recurrenceId,
      tagIds: resolvedTags,
    });
  }

  // Buat satu per satu agar relasi tag (`tags: { connect }`) ikut tersimpan.
  for (const row of rows) {
    const { tagIds: tagIdsForRow, ...data } = row;
    await prisma.transaction.create({
      data: {
        ...data,
        ...(tagIdsForRow.length > 0
          ? { tags: { connect: tagIdsForRow.map((id) => ({ id })) } }
          : {}),
      },
    });
  }

  return rows.length;
}

/**
 * Hitung ulang `openingBalance` tiap akun agar saldo akhir = `targetBalance`.
 *
 * Saldo akhir = openingBalance + income − expense − transfer keluar + transfer masuk.
 * Karena openingBalance = targetBalance − delta, saldo akhir selalu tepat sama dengan
 * target (dan dijamin ≥ 0 untuk semua akun kecuali kartu kredit yang memang minus).
 */
async function reconcileBalances(userId: string, accountIds: Map<string, string>): Promise<void> {
  const deltas = await prisma.transaction.groupBy({
    by: ["accountId", "type"],
    where: { userId },
    _sum: { amount: true },
  });

  const incoming = await prisma.transaction.groupBy({
    by: ["toAccountId"],
    where: { userId, type: "TRANSFER", toAccountId: { not: null } },
    _sum: { amount: true },
  });

  const deltaByAccount = new Map<string, bigint>();
  const bump = (id: string, value: bigint) => {
    deltaByAccount.set(id, (deltaByAccount.get(id) ?? 0n) + value);
  };

  for (const row of deltas) {
    const amount = row._sum.amount ?? 0n;
    if (row.type === "INCOME") bump(row.accountId, amount);
    else bump(row.accountId, -amount);
  }
  for (const row of incoming) {
    if (row.toAccountId) bump(row.toAccountId, row._sum.amount ?? 0n);
  }

  for (const account of ACCOUNTS) {
    const id = accountIds.get(account.name);
    if (!id) continue;
    const openingBalance = account.targetBalance - (deltaByAccount.get(id) ?? 0n);
    await prisma.financeAccount.update({ where: { id }, data: { openingBalance } });
  }
}

/** Cetak ringkasan hasil seed untuk verifikasi cepat. */
async function printSummary(
  userId: string,
  transactionCount: number,
  accountIds: Map<string, string>,
): Promise<void> {
  const { start, end } = monthRange(0);

  const [income, expense, transfers] = await Promise.all([
    prisma.transaction.aggregate({
      where: { userId, type: "INCOME", date: { gte: start, lte: end } },
      _sum: { amount: true },
    }),
    prisma.transaction.aggregate({
      where: { userId, type: "EXPENSE", date: { gte: start, lte: end } },
      _sum: { amount: true },
    }),
    prisma.transaction.count({ where: { userId, type: "TRANSFER" } }),
  ]);

  const monthIncome = income._sum.amount ?? 0n;
  const monthExpense = expense._sum.amount ?? 0n;

  console.log("\n📊 Ringkasan data demo");
  console.log(
    `   transaksi: ${transactionCount} total (${transfers} transfer) · bulan ini: ` +
      `+${formatShort(monthIncome)} / −${formatShort(monthExpense)} = ${formatShort(monthIncome - monthExpense)}`,
  );

  const balances: string[] = [];
  for (const account of ACCOUNTS) {
    const id = accountIds.get(account.name);
    if (!id) continue;
    const row = await prisma.transaction.groupBy({
      by: ["type"],
      where: { userId, accountId: id },
      _sum: { amount: true },
    });
    let balance = 0n;
    for (const item of row) {
      const amount = item._sum.amount ?? 0n;
      balance += item.type === "INCOME" ? amount : -amount;
    }
    const received = await prisma.transaction.aggregate({
      where: { userId, type: "TRANSFER", toAccountId: id },
      _sum: { amount: true },
    });
    balance += received._sum.amount ?? 0n;
    const stored = await prisma.financeAccount.findUnique({
      where: { id },
      select: { openingBalance: true },
    });
    balance += stored?.openingBalance ?? 0n;
    balances.push(`${account.name}: ${formatShort(balance)}`);
  }
  console.log(`   saldo akhir → ${balances.join(" · ")}`);
}

/** Format rupiah ringkas, mis. "Rp65,0 jt". */
function formatShort(value: bigint): string {
  const negative = value < 0n;
  const abs = negative ? -value : value;
  const sign = negative ? "-" : "";
  if (abs >= 1_000_000_000n) return `${sign}Rp${(Number(abs) / 1_000_000_000).toFixed(1)} M`;
  if (abs >= 1_000_000n) return `${sign}Rp${(Number(abs) / 1_000_000).toFixed(1)} jt`;
  if (abs >= 1_000n) return `${sign}Rp${(Number(abs) / 1_000).toFixed(0)} rb`;
  return `${sign}Rp${abs}`;
}

async function main() {
  console.log("🌱 Seeding Nabungin (data demo lengkap)...");

  const userId = await ensureUser();
  await resetFinanceData(userId);

  const accountIds = await createAccounts(userId);
  const categoryIds = await createCategories(userId);
  const tagIds = await createTags(userId);

  const lookups: Lookups = { account: accountIds, category: categoryIds };

  await createBudgets(userId, lookups);
  await createGoals(userId, lookups);
  await createRecurrences(userId, lookups);

  const recurrenceIds = new Map<string, string>();
  for (const row of await prisma.recurrence.findMany({
    where: { userId },
    select: { id: true, name: true },
  })) {
    recurrenceIds.set(row.name, row.id);
  }

  const seeds = [...monthlyFixed(), ...dailyRandom(), ...transfers()];
  const total = await createTransactions(userId, lookups, recurrenceIds, tagIds, seeds);
  console.log(`   ✓ ${total} transaksi (${HISTORY_MONTHS} bulan riwayat)`);

  await reconcileBalances(userId, accountIds);
  await printSummary(userId, total, accountIds);

  console.log("\n✅ Seed selesai.");
  console.log(`   Login demo → email: ${DEMO_EMAIL}  password: ${DEMO_PASSWORD}`);
}

main()
  .catch((error) => {
    console.error("❌ Seed gagal:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
