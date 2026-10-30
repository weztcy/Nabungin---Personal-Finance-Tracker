import { AppShell } from "@/components/layout/app-shell";
import { requireSession } from "@/lib/session";

// Seluruh route di grup (app) bersifat per-user (butuh session cookie) & dinamis.
// `instant = false` meng-opt-outkan segment ini dari validasi instant-navigation
// (Cache Components), sehingga Next tidak lagi memunculkan insight "encountered
// uncached data during prerendering" untuk setiap halaman terautentikasi.
export const instant = false;

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const { user } = await requireSession();

  return (
    <AppShell
      user={{
        name: user.name,
        email: user.email,
        image: user.image,
      }}
    >
      {children}
    </AppShell>
  );
}
