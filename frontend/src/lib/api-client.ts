import { API_URL } from "@/lib/api-url";

export type ActionResult = { ok: true } | { ok: false; error: string };

/**
 * Pemanggil API dari CLIENT (browser). Cookie session ikut otomatis karena
 * `credentials: "include"` (frontend & backend same-site di localhost).
 *
 * Semua fungsi mengembalikan `ActionResult` agar UI bisa menampilkan pesan
 * error tanpa melempar exception (pola yang sama dengan server action lama).
 */
export async function apiMutate(
  path: string,
  init: { method: string; body?: unknown } = { method: "POST" },
): Promise<ActionResult> {
  try {
    const response = await fetch(`${API_URL}${path}`, {
      method: init.method,
      credentials: "include",
      headers: { "content-type": "application/json" },
      body: init.body === undefined ? undefined : JSON.stringify(init.body),
    });

    if (!response.ok) {
      const data = (await response.json().catch(() => null)) as { error?: string } | null;
      return { ok: false, error: data?.error ?? `Gagal (${response.status})` };
    }

    return { ok: true };
  } catch {
    return { ok: false, error: "Tidak dapat menghubungi server. Coba lagi." };
  }
}

/** GET dari client (jarang dipakai — data halaman diambil di server). */
export async function apiGet<T>(path: string): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    credentials: "include",
    headers: { "content-type": "application/json" },
  });
  if (!response.ok) {
    const data = (await response.json().catch(() => null)) as { error?: string } | null;
    throw new Error(data?.error ?? `Gagal (${response.status})`);
  }
  return (await response.json()) as T;
}
