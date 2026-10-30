import type { Metadata } from "next";

import { CategoriesView } from "@/components/features/categories/categories-view";
import { apiFetch } from "@/lib/api-server";
import { requireSession } from "@/lib/session";

export const metadata: Metadata = {
  title: "Kategori",
};

export const instant = false;

type CategoriesResponse = {
  categories: {
    id: string;
    name: string;
    kind: string;
    color: string | null;
    parentId: string | null;
  }[];
};

export default async function CategoriesPage() {
  await requireSession();
  const { categories } = await apiFetch<CategoriesResponse>("/api/categories");

  const items = categories.map((c) => ({
    id: c.id,
    name: c.name,
    kind: c.kind,
    color: c.color,
    parentId: c.parentId,
  }));

  return <CategoriesView categories={items} />;
}
