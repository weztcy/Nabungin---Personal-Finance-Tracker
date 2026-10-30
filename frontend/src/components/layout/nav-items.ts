import {
  ArrowLeftRightIcon,
  BarChart3Icon,
  LayoutDashboardIcon,
  PiggyBankIcon,
  RepeatIcon,
  SettingsIcon,
  TagsIcon,
  TargetIcon,
  WalletIcon,
  type LucideIcon,
} from "lucide-react";

export type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
};

export const NAV_ITEMS: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboardIcon },
  { href: "/transactions", label: "Transaksi", icon: ArrowLeftRightIcon },
  { href: "/accounts", label: "Akun", icon: WalletIcon },
  { href: "/categories", label: "Kategori", icon: TagsIcon },
  { href: "/budgets", label: "Budget", icon: TargetIcon },
  { href: "/goals", label: "Target Tabungan", icon: PiggyBankIcon },
  { href: "/recurring", label: "Transaksi Berulang", icon: RepeatIcon },
  { href: "/reports", label: "Laporan", icon: BarChart3Icon },
  { href: "/settings", label: "Pengaturan", icon: SettingsIcon },
];
