import { z } from "zod";

/**
 * Validasi environment variables backend dengan Zod.
 * Dipanggil lazily via `getServerEnv()` agar error muncul saat benar-benar
 * dibutuhkan (bukan saat import).
 */

const serverSchema = z.object({
  DATABASE_URL: z
    .string()
    .min(1, "DATABASE_URL wajib diisi")
    .refine(
      (value) => value.startsWith("postgres://") || value.startsWith("postgresql://"),
      "DATABASE_URL harus berupa connection string PostgreSQL",
    ),
  BETTER_AUTH_SECRET: z
    .string()
    .min(16, "BETTER_AUTH_SECRET minimal 16 karakter (disarankan 32 byte acak)"),
  BETTER_AUTH_URL: z.string().url("BETTER_AUTH_URL harus berupa URL valid").optional(),
  CORS_ORIGIN: z.string().min(1).default("http://localhost:3000"),
  APP_NAME: z.string().min(1).default("Nabungin"),
  PORT: z.coerce.number().int().positive().default(4000),
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
});

export type ServerEnv = z.infer<typeof serverSchema>;

function formatIssues(error: z.ZodError): string {
  return error.issues
    .map((issue) => `  - ${issue.path.join(".") || "(root)"}: ${issue.message}`)
    .join("\n");
}

/** Baca & validasi env server. Melempar Error dengan pesan jelas bila tidak valid. */
export function getServerEnv(): ServerEnv {
  const parsed = serverSchema.safeParse({
    DATABASE_URL: process.env.DATABASE_URL,
    BETTER_AUTH_SECRET: process.env.BETTER_AUTH_SECRET,
    BETTER_AUTH_URL: process.env.BETTER_AUTH_URL,
    CORS_ORIGIN: process.env.CORS_ORIGIN,
    APP_NAME: process.env.APP_NAME,
    PORT: process.env.PORT,
    NODE_ENV: process.env.NODE_ENV,
  });

  if (!parsed.success) {
    throw new Error(`Environment backend tidak valid:\n${formatIssues(parsed.error)}`);
  }

  return parsed.data;
}

/** Daftar origin frontend yang diizinkan (dipisah koma di CORS_ORIGIN). */
export function corsOrigins(): string[] {
  return getServerEnv()
    .CORS_ORIGIN.split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);
}
