"use client";

import { useState } from "react";

import { useRouter } from "next/navigation";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2Icon, SaveIcon } from "lucide-react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { authClient } from "@/lib/auth-client";
import { formatDate } from "@/lib/format";
import { profileFormSchema, type ProfileFormValues } from "@/lib/validators/profile";

export type SettingsProfile = {
  name: string;
  email: string;
  baseCurrency: string;
  timezone: string;
  createdAt: string;
};

export function ProfileForm({ profile }: { profile: SettingsProfile }) {
  const router = useRouter();
  const [isPending, setIsPending] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
  } = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: { name: profile.name },
  });

  async function onSubmit(values: ProfileFormValues) {
    setIsPending(true);
    const { error } = await authClient.updateUser({ name: values.name });
    setIsPending(false);

    if (error) {
      toast.error(error.message ?? "Gagal memperbarui profil");
      return;
    }

    toast.success("Profil diperbarui");
    router.refresh();
  }

  return (
    <Card className="gap-4">
      <div className="flex flex-col gap-0.5">
        <h2 className="font-heading text-sm font-semibold">Profil</h2>
        <p className="text-muted-foreground text-xs">Perbarui informasi akunmu.</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4" noValidate>
        <div className="flex flex-col gap-2">
          <Label htmlFor="profile-name">Nama</Label>
          <Input id="profile-name" aria-invalid={!!errors.name} {...register("name")} />
          {errors.name && <p className="text-destructive text-xs">{errors.name.message}</p>}
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="profile-email">Email</Label>
          <Input id="profile-email" value={profile.email} disabled readOnly />
          <p className="text-muted-foreground text-xs">
            Perubahan email belum didukung pada versi ini.
          </p>
        </div>

        <div>
          <Button type="submit" disabled={isPending || !isDirty}>
            {isPending ? <Loader2Icon className="animate-spin" /> : <SaveIcon />}
            Simpan Profil
          </Button>
        </div>
      </form>

      <Separator />

      <dl className="grid gap-3 text-sm sm:grid-cols-3">
        <div className="flex flex-col gap-0.5">
          <dt className="text-muted-foreground text-xs">Mata Uang Dasar</dt>
          <dd className="font-medium">{profile.baseCurrency}</dd>
        </div>
        <div className="flex flex-col gap-0.5">
          <dt className="text-muted-foreground text-xs">Zona Waktu</dt>
          <dd className="font-medium">{profile.timezone}</dd>
        </div>
        <div className="flex flex-col gap-0.5">
          <dt className="text-muted-foreground text-xs">Terdaftar Sejak</dt>
          <dd className="font-medium">{formatDate(profile.createdAt)}</dd>
        </div>
      </dl>
    </Card>
  );
}
