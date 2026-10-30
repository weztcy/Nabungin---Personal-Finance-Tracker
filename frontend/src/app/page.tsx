import { redirect } from "next/navigation";

import { getSession } from "@/lib/session";

// Route ini membaca session (data per-user, uncached) lalu me-redirect.
// `instant = false` meng-opt-outkan dari validasi instant-navigation (Cache Components)
// agar Next tidak memunculkan insight "encountered uncached data during prerendering".
export const instant = false;

export default async function HomePage() {
  const me = await getSession();
  redirect(me ? "/dashboard" : "/sign-in");
}
