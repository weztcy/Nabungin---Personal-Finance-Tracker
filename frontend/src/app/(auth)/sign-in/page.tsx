import { Suspense } from "react";

import type { Metadata } from "next";

import { SignInForm } from "@/components/auth/sign-in-form";
import { Skeleton } from "@/components/ui/skeleton";
import { requireGuest } from "@/lib/session";

export const metadata: Metadata = {
  title: "Masuk",
};

// requireGuest() membaca session cookie (uncached) di page ini, jadi page perlu
// opt-out dari validasi instant-navigation (Cache Components) agar Next tidak
// memunculkan insight "encountered uncached data during prerendering".
export const instant = false;

export default async function SignInPage() {
  await requireGuest();

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2 text-center lg:text-left">
        <h1 className="font-heading text-2xl font-semibold">Masuk ke Nabungin</h1>
        <p className="text-muted-foreground text-sm">
          Belum punya akun? Daftar gratis dan mulai menabung lebih terarah.
        </p>
      </div>
      <Suspense fallback={<Skeleton className="h-64 w-full" />}>
        <SignInForm />
      </Suspense>
      <div className="bg-muted/50 text-muted-foreground rounded-lg p-3 text-center text-xs">
        Akun demo: <span className="text-foreground font-medium">demo@nabungin.app</span> /{" "}
        <span className="text-foreground font-medium">password1234</span>
      </div>
    </div>
  );
}
