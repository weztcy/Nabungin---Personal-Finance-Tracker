"use client";

import { createAuthClient } from "better-auth/react";

import { API_URL } from "@/lib/api-url";

/**
 * Client Better Auth frontend. `baseURL` menunjuk ke BACKEND (port 4000) →
 * seluruh request auth pergi ke `${API_URL}/api/auth/*`.
 * `withCredentials` membuat cookie session ikut terkirim (cross-origin).
 */
export const authClient = createAuthClient({
  baseURL: API_URL,
  fetchOptions: {
    credentials: "include",
  },
});

export const { signIn, signUp, signOut, useSession } = authClient;
