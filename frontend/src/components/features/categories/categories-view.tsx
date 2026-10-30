"use client";

import { useState } from "react";

import { useRouter } from "next/navigation";

import { MoreHorizontalIcon, PencilIcon, PlusIcon, Trash2Icon } from "lucide-react";

import { ConfirmDialog } from "@/components/confirm-dialog";
import {
  CategoryFormDialog,
  type CategoryItem,
} from "@/components/features/categories/category-form-dialog";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { CATEGORY_KIND_LABELS } from "@/lib/validators/category";
import { deleteCategory } from "@/lib/actions/category";

type CategoryListItem = {
  id: string;
  name: string;
  kind: string;
  color: string | null;
  parentId: string | null;
};

export function CategoriesView({ categories }: { categories: CategoryListItem[] }) {
  const router = useRouter();
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<CategoryItem | null>(null);
  const [deleting, setDeleting] = useState<CategoryListItem | null>(null);

  function openCreate() {
    setEditing(null);
    setFormOpen(true);
  }

  function openEdit(category: CategoryListItem) {
    setEditing({
      id: category.id,
      name: category.name,
      kind: category.kind,
      color: category.color,
      parentId: category.parentId,
    });
    setFormOpen(true);
  }

  const expense = categories.filter((c) => c.kind === "EXPENSE");
  const income = categories.filter((c) => c.kind === "INCOME");

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="font-heading text-2xl font-semibold">Kategori</h1>
          <p className="text-muted-foreground text-sm">
            Kelompokkan transaksi dengan kategori pemasukan & pengeluaran.
          </p>
        </div>
        <Button onClick={openCreate}>
          <PlusIcon /> Tambah Kategori
        </Button>
      </div>

      {categories.length === 0 ? (
        <Card className="text-muted-foreground items-center p-10 text-center text-sm">
          Belum ada kategori. Klik â€œTambah Kategoriâ€ untuk membuatnya.
        </Card>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          <CategorySection
            title={CATEGORY_KIND_LABELS.EXPENSE}
            categories={expense}
            onEdit={openEdit}
            onDelete={setDeleting}
          />
          <CategorySection
            title={CATEGORY_KIND_LABELS.INCOME}
            categories={income}
            onEdit={openEdit}
            onDelete={setDeleting}
          />
        </div>
      )}

      <CategoryFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        category={editing}
        onSaved={() => router.refresh()}
      />

      <ConfirmDialog
        open={Boolean(deleting)}
        onOpenChange={(open) => !open && setDeleting(null)}
        title="Hapus kategori?"
        description={deleting ? `Kategori â€œ${deleting.name}â€ akan dihapus permanen.` : undefined}
        onConfirm={() => (deleting ? deleteCategory(deleting.id) : Promise.resolve({ ok: true }))}
        onDone={() => {
          setDeleting(null);
          router.refresh();
        }}
      />
    </div>
  );
}

function CategorySection({
  title,
  categories,
  onEdit,
  onDelete,
}: {
  title: string;
  categories: CategoryListItem[];
  onEdit: (category: CategoryListItem) => void;
  onDelete: (category: CategoryListItem) => void;
}) {
  return (
    <Card className="gap-0 p-0">
      <div className="flex items-center justify-between border-b px-4 py-3">
        <h2 className="font-heading text-sm font-semibold">{title}</h2>
        <span className="text-muted-foreground text-xs">{categories.length} kategori</span>
      </div>
      {categories.length === 0 ? (
        <p className="text-muted-foreground px-4 py-6 text-center text-sm">Belum ada kategori.</p>
      ) : (
        <ul className="divide-y">
          {categories.map((category) => (
            <li key={category.id} className="flex items-center justify-between gap-2 px-4 py-2.5">
              <div className="flex items-center gap-2.5">
                <span
                  className="size-3 shrink-0 rounded-full"
                  style={{ backgroundColor: category.color ?? "#64748b" }}
                />
                <span className="text-sm font-medium">{category.name}</span>
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger render={<Button variant="ghost" size="icon-sm" />}>
                  <MoreHorizontalIcon />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => onEdit(category)}>
                    <PencilIcon /> Ubah
                  </DropdownMenuItem>
                  <DropdownMenuItem variant="destructive" onClick={() => onDelete(category)}>
                    <Trash2Icon /> Hapus
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
