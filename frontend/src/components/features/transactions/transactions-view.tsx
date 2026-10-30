"use client";

import { useMemo, useState } from "react";

import { useRouter } from "next/navigation";

import {
  ArrowLeftRightIcon,
  MoreHorizontalIcon,
  PencilIcon,
  PlusIcon,
  Trash2Icon,
} from "lucide-react";

import { ConfirmDialog } from "@/components/confirm-dialog";
import {
  TransactionFormDialog,
  type SimpleAccount,
  type SimpleCategory,
  type TransactionItem,
} from "@/components/features/transactions/transaction-form-dialog";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { deleteTransaction } from "@/lib/actions/transaction";

type TxListItem = {
  id: string;
  type: string;
  amount: number;
  dateLabel: string;
  date: string;
  accountId: string;
  accountName: string;
  toAccountId: string | null;
  toAccountName: string | null;
  categoryId: string | null;
  categoryName: string | null;
  categoryColor: string | null;
  note: string | null;
  payee: string | null;
};

const FILTERS = ["ALL", "INCOME", "EXPENSE", "TRANSFER"] as const;
type Filter = (typeof FILTERS)[number];

const FILTER_LABELS: Record<Filter, string> = {
  ALL: "Semua",
  INCOME: "Pemasukan",
  EXPENSE: "Pengeluaran",
  TRANSFER: "Transfer",
};

function formatRupiah(n: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(n);
}

export function TransactionsView({
  transactions,
  accounts,
  categories,
}: {
  transactions: TxListItem[];
  accounts: SimpleAccount[];
  categories: SimpleCategory[];
}) {
  const router = useRouter();
  const [filter, setFilter] = useState<Filter>("ALL");
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<TransactionItem | null>(null);
  const [deleting, setDeleting] = useState<TxListItem | null>(null);

  const filtered = useMemo(
    () => (filter === "ALL" ? transactions : transactions.filter((t) => t.type === filter)),
    [transactions, filter],
  );

  function openCreate() {
    setEditing(null);
    setFormOpen(true);
  }

  function openEdit(tx: TxListItem) {
    setEditing({
      id: tx.id,
      type: tx.type,
      amount: tx.amount,
      date: tx.date,
      accountId: tx.accountId,
      toAccountId: tx.toAccountId,
      categoryId: tx.categoryId,
      note: tx.note,
      payee: tx.payee,
    });
    setFormOpen(true);
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="font-heading text-2xl font-semibold">Transaksi</h1>
          <p className="text-muted-foreground text-sm">
            Riwayat pemasukan, pengeluaran, dan transfer.
          </p>
        </div>
        <Button onClick={openCreate}>
          <PlusIcon /> Tambah Transaksi
        </Button>
      </div>

      <div className="bg-muted flex flex-wrap gap-1 rounded-lg p-1">
        {FILTERS.map((f) => (
          <button
            key={f}
            type="button"
            onClick={() => setFilter(f)}
            className={cn(
              "rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
              filter === f
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {FILTER_LABELS[f]}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <Card className="text-muted-foreground items-center p-10 text-center text-sm">
          Belum ada transaksi{filter !== "ALL" ? ` untuk filter ini` : ""}.
        </Card>
      ) : (
        <Card className="gap-0 p-0">
          <ul className="divide-y">
            {filtered.map((tx) => (
              <TransactionRow key={tx.id} tx={tx} onEdit={openEdit} onDelete={setDeleting} />
            ))}
          </ul>
        </Card>
      )}

      <TransactionFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        accounts={accounts}
        categories={categories}
        transaction={editing}
        onSaved={() => router.refresh()}
      />

      <ConfirmDialog
        open={Boolean(deleting)}
        onOpenChange={(open) => !open && setDeleting(null)}
        title="Hapus transaksi?"
        description="Transaksi ini akan dihapus permanen."
        onConfirm={() =>
          deleting ? deleteTransaction(deleting.id) : Promise.resolve({ ok: true })
        }
        onDone={() => {
          setDeleting(null);
          router.refresh();
        }}
      />
    </div>
  );
}

function TransactionRow({
  tx,
  onEdit,
  onDelete,
}: {
  tx: TxListItem;
  onEdit: (tx: TxListItem) => void;
  onDelete: (tx: TxListItem) => void;
}) {
  const isIncome = tx.type === "INCOME";
  const isTransfer = tx.type === "TRANSFER";

  return (
    <li className="flex items-center gap-3 px-4 py-3">
      <span
        className={cn(
          "flex size-9 shrink-0 items-center justify-center rounded-full",
          isIncome ? "bg-emerald-500/10 text-emerald-600" : "bg-muted text-muted-foreground",
        )}
        style={tx.categoryColor ? { color: tx.categoryColor } : undefined}
      >
        <ArrowLeftRightIcon className="size-4" />
      </span>

      <div className="flex min-w-0 flex-1 flex-col">
        <span className="truncate text-sm font-medium">
          {tx.categoryName ?? (isTransfer ? "Transfer" : "Tanpa kategori")}
        </span>
        <span className="text-muted-foreground truncate text-xs">
          {tx.dateLabel} Â· {tx.accountName}
          {isTransfer && tx.toAccountName ? ` â†’ ${tx.toAccountName}` : ""}
          {tx.payee ? ` Â· ${tx.payee}` : ""}
        </span>
      </div>

      <span
        className={cn(
          "font-heading text-sm font-semibold whitespace-nowrap",
          isIncome ? "text-emerald-600" : isTransfer ? "text-muted-foreground" : "text-foreground",
        )}
      >
        {isIncome ? "+" : isTransfer ? "" : "-"}
        {formatRupiah(tx.amount)}
      </span>

      <DropdownMenu>
        <DropdownMenuTrigger render={<Button variant="ghost" size="icon-sm" />}>
          <MoreHorizontalIcon />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => onEdit(tx)}>
            <PencilIcon /> Ubah
          </DropdownMenuItem>
          <DropdownMenuItem variant="destructive" onClick={() => onDelete(tx)}>
            <Trash2Icon /> Hapus
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </li>
  );
}
