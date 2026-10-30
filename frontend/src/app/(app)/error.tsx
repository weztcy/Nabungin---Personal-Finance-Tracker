"use client";

import { useEffect } from "react";

import { AlertTriangleIcon, RefreshCwIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex items-center justify-center py-16">
      <Card className="max-w-md items-center gap-3 p-8 text-center">
        <span className="bg-destructive/10 text-destructive flex size-10 items-center justify-center rounded-full">
          <AlertTriangleIcon className="size-5" />
        </span>
        <h1 className="font-heading text-lg font-semibold">Terjadi kesalahan</h1>
        <p className="text-muted-foreground text-sm">
          Kami tidak bisa memuat halaman ini. Coba muat ulang; jika masih gagal, hubungi dukungan.
        </p>
        <Button onClick={reset} className="mt-2">
          <RefreshCwIcon /> Coba lagi
        </Button>
      </Card>
    </div>
  );
}
