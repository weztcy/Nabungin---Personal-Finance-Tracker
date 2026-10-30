import { cookies } from "next/headers";

import { API_URL } from "@/lib/api-url";

/**
 * Fetch ke backend REST API dari SERVER (RSC / route handler).
 *
 * Cookie request saat ini diteruskan ke backend agar session Better Auth
 * dikenali — backend & frontend berada di origin berbeda (port berbeda),
 * jadi cookie tidak otomatis ikut pada fetch server-side.
 */
export async function apiFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  const cookieStore = await cookies();
  const cookieHeader = cookieStore.toString();

  const response = await fetch(`${API_URL}${path}`, {
    ...init,
    cache: "no-store",
    headers: {
      "content-type": "application/json",
      ...(cookieHeader ? { cookie: cookieHeader } : {}),
      ...(init.headers ?? {}),
    },
  });

  if (!response.ok) {
    const message = await safeErrorMessage(response);
    throw new ApiRequestError(response.status, message);
  }

  return (await response.json()) as T;
}

export class ApiRequestError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = "ApiRequestError";
    this.status = status;
  }
}

async function safeErrorMessage(response: Response): Promise<string> {
  try {
    const data = (await response.json()) as { error?: string };
    return data.error ?? `Permintaan gagal (${response.status})`;
  } catch {
    return `Permintaan gagal (${response.status})`;
  }
}

/** True bila error menandakan user belum login di backend. */
export function isUnauthorized(error: unknown): boolean {
  return error instanceof ApiRequestError && error.status === 401;
}
