import { cache } from "react";

import { redirect } from "next/navigation";

import { apiFetch } from "@/lib/api-server";

export type MeResponse = {
  user: {
    id: string;
    name: string;
    email: string;
    image: string | null;
    baseCurrency: string;
    timezone: string;
    createdAt: string;
  };
  stats: {
    accounts: number;
    categories: number;
    transactions: number;
    budgets: number;
    goals: number;
    recurrences: number;
  };
};

/**
 * Ambil session (via backend `/api/me`) di server (RSC).
 * Di-cache per-request; mengembalikan `null` bila belum login.
 */
export const getSession = cache(async (): Promise<MeResponse | null> => {
  try {
    return await apiFetch<MeResponse>("/api/me");
  } catch {
    // 401 (belum login) maupun kegagalan koneksi ke backend → anggap belum login.
    return null;
  }
});

/** Seperti getSession, tapi redirect ke /sign-in bila belum login. */
export async function requireSession(): Promise<MeResponse> {
  const me = await getSession();
  if (!me) {
    redirect("/sign-in");
  }
  return me;
}

/** Seperti getSession, tapi redirect ke /dashboard bila sudah login. */
export async function requireGuest(): Promise<null> {
  const me = await getSession();
  if (me) {
    redirect("/dashboard");
  }
  return null;
}
