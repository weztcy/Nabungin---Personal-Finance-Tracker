import type { Metadata } from "next";

import { SignUpForm } from "@/components/auth/sign-up-form";
import { requireGuest } from "@/lib/session";

export const metadata: Metadata = {
  title: "Daftar",
};

// requireGuest() membaca session cookie (uncached) di page ini, jadi page perlu
// opt-out dari validasi instant-navigation (Cache Components) agar Next tidak
// memunculkan insight "encountered uncached data during prerendering".
export const instant = false;

export default async function SignUpPage() {
  await requireGuest();

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2 text-center lg:text-left">
        <h1 className="font-heading text-2xl font-semibold">Buat akun Nabungin</h1>
        <p className="text-muted-foreground text-sm">
          Gratis, tanpa kartu kredit. Mulai kelola keuanganmu hari ini.
        </p>
      </div>
      <SignUpForm />
    </div>
  );
}
