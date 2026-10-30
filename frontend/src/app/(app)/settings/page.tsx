import type { Metadata } from "next";

import { ProfileForm } from "@/components/features/settings/profile-form";
import { Card } from "@/components/ui/card";
import { appName } from "@/lib/env";
import { requireSession } from "@/lib/session";

export const metadata: Metadata = {
  title: "Pengaturan",
};

export const instant = false;

export default async function SettingsPage() {
  const { user, stats } = await requireSession();

  const statItems = [
    { label: "Akun", value: stats.accounts },
    { label: "Kategori", value: stats.categories },
    { label: "Transaksi", value: stats.transactions },
    { label: "Budget", value: stats.budgets },
    { label: "Target Tabungan", value: stats.goals },
    { label: "Transaksi Berulang", value: stats.recurrences },
  ];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="font-heading text-2xl font-semibold">Pengaturan</h1>
        <p className="text-muted-foreground text-sm">
          Kelola profil dan lihat ringkasan data {appName()} milikmu.
        </p>
      </div>

      <ProfileForm
        profile={{
          name: user.name,
          email: user.email,
          baseCurrency: user.baseCurrency ?? "IDR",
          timezone: user.timezone ?? "Asia/Jakarta",
          createdAt: user.createdAt,
        }}
      />

      <Card className="gap-4">
        <div className="flex flex-col gap-0.5">
          <h2 className="font-heading text-sm font-semibold">Data Saya</h2>
          <p className="text-muted-foreground text-xs">
            Jumlah catatan yang saat ini tersimpan di akunmu.
          </p>
        </div>
        <dl className="grid gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {statItems.map((stat) => (
            <div key={stat.label} className="flex flex-col gap-0.5">
              <dt className="text-muted-foreground text-xs">{stat.label}</dt>
              <dd className="font-heading text-lg font-semibold tabular-nums">{stat.value}</dd>
            </div>
          ))}
        </dl>
      </Card>
    </div>
  );
}
