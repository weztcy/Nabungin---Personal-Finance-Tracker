"use client";

import { useSyncExternalStore } from "react";

const emptySubscribe = () => () => {};

/**
 * Menampilkan tahun berjalan dengan aman untuk prerendering (Next.js 16 + cacheComponents).
 * Nilai waktu hanya muncul di client (server snapshot `null`), sehingga tidak memblokir
 * static prerender dan tidak memicu hydration mismatch.
 */
export function CurrentYear() {
  const year = useSyncExternalStore<number | null>(
    emptySubscribe,
    () => new Date().getFullYear(),
    () => null,
  );

  if (year === null) return null;
  return <>{year}</>;
}
