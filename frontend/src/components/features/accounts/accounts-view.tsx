"use client";

import { useState } from "react";

import { useRouter } from "next/navigation";

import {
  ArchiveIcon,
  ArchiveRestoreIcon,
  MoreHorizontalIcon,
  PencilIcon,
  PlusIcon,
  Trash2Icon,
} from "lucide-react";
import { toast } from "sonner";

import { ConfirmDialog } from "@/components/confirm-dialog";
import {
  AccountFormDialog,
  type AccountItem,
} from "@/components/features/accounts/account-form-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ACCOUNT_TYPE_LABELS } from "@/lib/validators/account";
import { cn } from "@/lib/utils";
import { deleteAccount, toggleAccountArchived } from "@/lib/actions/account";

type AccountListItem = {
  id: string;
  name: string;
  type: string;
  color: string | null;
  isArchived: boolean;
  openingBalance: number;
  balanceLabel: string;
  balanceNegative: boolean;
};

export function AccountsView({ accounts }: { accounts: AccountListItem[] }) {
  const router = useRouter();
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<AccountItem | null>(null);
  const [deleting, setDeleting] = useState<AccountListItem | null>(null);

  function openCreate() {
    setEditing(null);
    setFormOpen(true);
  }

  function openEdit(account: AccountListItem) {
    setEditing({
      id: account.id,
      name: account.name,
      type: account.type,
      color: account.color,
      openingBalance: account.openingBalance,
    });
    setFormOpen(true);
  }

  async function handleToggleArchive(account: AccountListItem) {
    const result = await toggleAccountArchived(account.id);
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    toast.success(account.isArchived ? "Akun diaktifkan kembali" : "Akun diarsipkan");
    router.refresh();
  }

  const active = accounts.filter((a) => !a.isArchived);
  const archived = accounts.filter((a) => a.isArchived);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="font-heading text-2xl font-semibold">Akun</h1>
          <p className="text-muted-foreground text-sm">
            Kelola akun keuanganmu â€” tunai, bank, e-wallet, dan lainnya.
          </p>
        </div>
        <Button onClick={openCreate}>
          <PlusIcon /> Tambah Akun
        </Button>
      </div>

      {accounts.length === 0 ? (
        <Card className="text-muted-foreground items-center p-10 text-center text-sm">
          Belum ada akun. Klik â€œTambah Akunâ€ untuk membuat akun pertamamu.
        </Card>
      ) : (
        <div className="flex flex-col gap-8">
          <AccountGrid
            title="Aktif"
            accounts={active}
            onEdit={openEdit}
            onArchive={handleToggleArchive}
            onDelete={setDeleting}
          />
          {archived.length > 0 && (
            <AccountGrid
              title="Diarsipkan"
              accounts={archived}
              onEdit={openEdit}
              onArchive={handleToggleArchive}
              onDelete={setDeleting}
            />
          )}
        </div>
      )}

      <AccountFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        account={editing}
        onSaved={() => router.refresh()}
      />

      <ConfirmDialog
        open={Boolean(deleting)}
        onOpenChange={(open) => !open && setDeleting(null)}
        title="Hapus akun?"
        description={
          deleting
            ? `Akun â€œ${deleting.name}â€ akan dihapus permanen. Tindakan ini tidak bisa dibatalkan.`
            : undefined
        }
        onConfirm={() => (deleting ? deleteAccount(deleting.id) : Promise.resolve({ ok: true }))}
        onDone={() => {
          setDeleting(null);
          router.refresh();
        }}
      />
    </div>
  );
}

function AccountGrid({
  title,
  accounts,
  onEdit,
  onArchive,
  onDelete,
}: {
  title: string;
  accounts: AccountListItem[];
  onEdit: (account: AccountListItem) => void;
  onArchive: (account: AccountListItem) => void;
  onDelete: (account: AccountListItem) => void;
}) {
  if (accounts.length === 0) return null;

  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-muted-foreground text-sm font-medium">{title}</h2>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {accounts.map((account) => (
          <Card key={account.id} className="gap-3">
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2.5">
                <span
                  className="size-3 shrink-0 rounded-full"
                  style={{ backgroundColor: account.color ?? "#64748b" }}
                />
                <div className="flex flex-col">
                  <span className="font-medium">{account.name}</span>
                  <span className="text-muted-foreground text-xs">
                    {ACCOUNT_TYPE_LABELS[account.type as keyof typeof ACCOUNT_TYPE_LABELS] ??
                      account.type}
                  </span>
                </div>
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger render={<Button variant="ghost" size="icon-sm" />}>
                  <MoreHorizontalIcon />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => onEdit(account)}>
                    <PencilIcon /> Ubah
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onArchive(account)}>
                    {account.isArchived ? <ArchiveRestoreIcon /> : <ArchiveIcon />}
                    {account.isArchived ? "Aktifkan" : "Arsipkan"}
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem variant="destructive" onClick={() => onDelete(account)}>
                    <Trash2Icon /> Hapus
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            <div className="flex items-baseline justify-between">
              <span
                className={cn(
                  "font-heading text-lg font-semibold",
                  account.balanceNegative && "text-destructive",
                )}
              >
                {account.balanceLabel}
              </span>
              {account.isArchived && <Badge variant="secondary">Arsip</Badge>}
            </div>
          </Card>
        ))}
      </div>
    </section>
  );
}
