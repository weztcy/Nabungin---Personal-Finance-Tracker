import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";

import { Providers } from "@/components/providers";

import "./globals.css";

// Aplikasi ini 100% dinamis & per-user (semua halaman butuh session cookie).
// Dengan `cacheComponents: true` (default Next 16), akses data runtime seperti
// headers()/cookies() harus berada di dalam <Suspense> atau route ditandai blocking.
// Karena seluruh app memang dinamis, kita tandai subtree ini sebagai blocking-dynamic.
export const instant = false;

const geistSans = Geist({
  variable: "--font-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Nabungin — Personal Finance Tracker",
    template: "%s · Nabungin",
  },
  description:
    "Nabungin membantu kamu mencatat pemasukan, pengeluaran, budget, dan target tabungan dalam satu tempat.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="id"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
