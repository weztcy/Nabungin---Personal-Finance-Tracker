"use client";

import { useSyncExternalStore } from "react";

import { MoonIcon, SunIcon } from "lucide-react";
import { useTheme } from "next-themes";

import { Button } from "@/components/ui/button";

const emptySubscribe = () => () => {};

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  // `useSyncExternalStore` memberi tahu apakah sudah berjalan di client, tanpa
  // memicu cascading render (aturan react-hooks/set-state-in-effect).
  const mounted = useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false,
  );

  const isDark = resolvedTheme === "dark";

  return (
    <Button
      variant="ghost"
      size="icon-sm"
      aria-label="Ganti tema"
      onClick={() => setTheme(isDark ? "light" : "dark")}
    >
      {mounted && isDark ? <SunIcon /> : <MoonIcon />}
    </Button>
  );
}
