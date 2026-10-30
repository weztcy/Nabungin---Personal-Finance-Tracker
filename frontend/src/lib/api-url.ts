/** URL dasar backend REST API. Diisi via NEXT_PUBLIC_API_URL. */
export const API_URL = (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000").replace(
  /\/$/,
  "",
);

/** Path endpoint auth Better Auth di backend. */
export const API_AUTH_PATH = "/api/auth";
