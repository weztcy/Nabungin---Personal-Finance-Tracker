import { prismaAdapter } from "@better-auth/prisma-adapter";
import { betterAuth } from "better-auth";

import { corsOrigins, getServerEnv } from "@/env";
import { prisma } from "@/prisma";

/**
 * Better Auth untuk backend Express.
 *
 * Berjalan di Node (bukan Next.js) sehingga:
 * - `baseURL` = URL backend (http://localhost:4000); seluruh endpoint auth
 *   tersedia di `${baseURL}/api/auth/*` lewat `toNodeHandler`.
 * - Cookie diset langsung oleh handler (tidak butuh plugin `nextCookies`).
 * - `trustedOrigins` berisi origin frontend agar request cross-origin (fetch
 *   dengan `credentials: "include"`) diizinkan.
 */
const env = getServerEnv();

export const auth = betterAuth({
  appName: env.APP_NAME,
  baseURL: env.BETTER_AUTH_URL ?? `http://localhost:${env.PORT}`,
  secret: env.BETTER_AUTH_SECRET,
  trustedOrigins: corsOrigins(),
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),
  emailAndPassword: {
    enabled: true,
    minPasswordLength: 8,
    maxPasswordLength: 128,
  },
  user: {
    additionalFields: {
      baseCurrency: {
        type: "string",
        required: false,
        defaultValue: "IDR",
        input: true,
      },
      timezone: {
        type: "string",
        required: false,
        defaultValue: "Asia/Jakarta",
        input: true,
      },
    },
  },
  session: {
    expiresIn: 60 * 60 * 24 * 30, // 30 hari
    updateAge: 60 * 60 * 24, // refresh tiap 1 hari
  },
});

export type AuthSession = typeof auth.$Infer.Session;
