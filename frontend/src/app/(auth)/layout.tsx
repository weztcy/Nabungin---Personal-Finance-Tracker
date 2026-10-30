import Link from "next/link";

import { WalletIcon } from "lucide-react";

import { CurrentYear } from "@/components/current-year";

// Halaman auth memanggil requireGuest() (baca session cookie = uncached), jadi
// segment ini juga perlu opt-out dari validasi instant-navigation (Cache
// Components) agar Next tidak memunculkan insight "encountered uncached data
// during prerendering" untuk /sign-in dan /sign-up.
export const instant = false;

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid min-h-dvh lg:grid-cols-2">
      {/* Panel branding (desktop) */}
      <aside className="bg-primary text-primary-foreground relative hidden flex-col justify-between p-10 lg:flex">
        <Link href="/" className="flex items-center gap-2 text-lg font-semibold">
          <span className="bg-primary-foreground/15 flex size-9 items-center justify-center rounded-lg">
            <WalletIcon className="size-5" />
          </span>
          Nabungin
        </Link>
        <div className="max-w-md space-y-4">
          <h1 className="font-heading text-3xl leading-tight font-semibold">
            Kelola keuanganmu, satu langkah lebih rapi.
          </h1>
          <p className="text-primary-foreground/80">
            Catat pemasukan & pengeluaran, atur budget, dan pantau target tabunganmu — semuanya
            dalam satu tempat.
          </p>
        </div>
        <p className="text-primary-foreground/60 text-xs">
          © <CurrentYear /> Nabungin. Personal Finance Tracker.
        </p>
      </aside>

      {/* Panel form */}
      <main className="flex items-center justify-center p-6">
        <div className="w-full max-w-sm">{children}</div>
      </main>
    </div>
  );
}
