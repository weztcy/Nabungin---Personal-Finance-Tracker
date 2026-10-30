"use client";

import Link from "next/link";

import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";

import { Button, buttonVariants } from "@/components/ui/button";

export function MonthSwitcher({
  label,
  prevKey,
  nextKey,
  disableNext,
}: {
  label: string;
  prevKey: string;
  nextKey: string;
  disableNext: boolean;
}) {
  return (
    <div className="flex items-center gap-2">
      <Link
        href={`/reports?month=${prevKey}`}
        className={buttonVariants({ variant: "outline", size: "icon-sm" })}
      >
        <ChevronLeftIcon />
        <span className="sr-only">Bulan sebelumnya</span>
      </Link>
      <span className="min-w-32 text-center text-sm font-medium">{label}</span>
      {disableNext ? (
        <Button variant="outline" size="icon-sm" disabled>
          <ChevronRightIcon />
          <span className="sr-only">Bulan berikutnya</span>
        </Button>
      ) : (
        <Link
          href={`/reports?month=${nextKey}`}
          className={buttonVariants({ variant: "outline", size: "icon-sm" })}
        >
          <ChevronRightIcon />
          <span className="sr-only">Bulan berikutnya</span>
        </Link>
      )}
    </div>
  );
}
