"use client";

import { useState } from "react";

import { useRouter } from "next/navigation";

import {
  MoreHorizontalIcon,
  PencilIcon,
  PlayIcon,
  PlusIcon,
  PowerIcon,
  Trash2Icon,
} from "lucide-react";
import { toast } from "sonner";

import { ConfirmDialog } from "@/components/confirm-dialog";
import {
  RecurrenceFormDialog,
  type RecurrenceItem,
  type SimpleAccount,
  type SimpleCategory,
} from "@/components/features/recurring/recurrence-form-dialog";
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
import { cn } from "@/lib/utils";
import {
  deleteRecurrence,
  runRecurrenceNow,
  toggleRecurrenceActive,
} from "@/lib/actions/recurrence";

type RecurrenceListItem = {
  id: string;
  name: string;
  type: string;
  amount: number;
  amountLabel: string;
  typeLabel: string;
  scheduleLabel: string;
  nextRunLabel: string;
  nextRunAt: string;
  accountId: string;
  accountName: string;
  toAccountId: string | null;
  toAccountName: string | null;
  categoryId: string | null;
  categoryName: string | null;
  categoryColor: string | null;
  note: string | null;
  isActive: boolean;
  freq: string;
  interval: number;
};

export function RecurringView({
  recurrences,
  accounts,
  categories,
}: {
  recurrences: RecurrenceListItem[];
  accounts: SimpleAccount[];
  categories: SimpleCategory[];
}) {
  const router = useRouter();
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<RecurrenceItem | null>(null);
  const [deleting, setDeleting] = useState<RecurrenceListItem | null>(null);

  function openCreate() {
    setEditing(null);
    setFormOpen(true);
  }

  function openEdit(item: RecurrenceListItem) {
    setEditing({
      id: item.id,
      name: item.name,
      type: item.type,
      amount: item.amount,
      freq: item.freq,
      interval: item.interval,
      nextRunAt: item.nextRunAt,
      accountId: item.accountId,
      toAccountId: item.toAccountId,
      categoryId: item.categoryId,
      note: item.note,
      isActive: item.isActive,
    });
    setFormOpen(true);
  }

  async function handleToggle(item: RecurrenceListItem) {
    const result = await toggleRecurrenceActive(item.id);
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    toast.success(item.isActive ? "Jadwal dijeda" : "Jadwal diaktifkan");
    router.refresh();
  }

  async function handleRunNow(item: RecurrenceListItem) {
    const result = await runRecurrenceNow(item.id);
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    toast.success("Transaksi dibuat & jadwal dimajukan");
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="font-heading text-2xl font-semibold">Transaksi Berulang</h1>
          <p className="text-muted-foreground text-sm">
            Otomatiskan transaksi rutin seperti gaji, langganan, atau cicilan.
          </p>
        </div>
        <Button onClick={openCreate}>
          <PlusIcon /> Tambah Jadwal
        </Button>
      </div>

      {recurrences.length === 0 ? (
        <Card className="text-muted-foreground items-center p-10 text-center text-sm">
          Belum ada jadwal berulang. Klik â€œTambah Jadwalâ€ untuk membuatnya.
        </Card>
      ) : (
        <div className="grid gap-3 lg:grid-cols-2">
          {recurrences.map((item) => (
            <Card key={item.id} className={cn("gap-3", !item.isActive && "opacity-60")}>
              <div className="flex items-start justify-between gap-2">
                <div className="flex flex-col gap-0.5">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{item.name}</span>
                    <Badge variant={item.isActive ? "secondary" : "outline"}>
                      {item.isActive ? "Aktif" : "Dijeda"}
                    </Badge>
                  </div>
                  <span className="text-muted-foreground text-xs">
                    {item.typeLabel} Â· {item.scheduleLabel}
                  </span>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger render={<Button variant="ghost" size="icon-sm" />}>
                    <MoreHorizontalIcon />
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => handleRunNow(item)}>
                      <PlayIcon /> Jalankan Sekarang
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleToggle(item)}>
                      <PowerIcon /> {item.isActive ? "Jeda" : "Aktifkan"}
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => openEdit(item)}>
                      <PencilIcon /> Ubah
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem variant="destructive" onClick={() => setDeleting(item)}>
                      <Trash2Icon /> Hapus
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              <div className="flex items-baseline justify-between gap-2">
                <span className="font-heading text-lg font-semibold">{item.amountLabel}</span>
                <span className="text-muted-foreground text-xs">
                  Berikutnya {item.nextRunLabel}
                </span>
              </div>

              <div className="text-muted-foreground flex flex-wrap gap-1.5 text-xs">
                <span className="bg-muted inline-flex items-center rounded-full px-2 py-0.5">
                  {item.accountName}
                  {item.toAccountName ? ` â†’ ${item.toAccountName}` : ""}
                </span>
                {item.categoryName && (
                  <span className="bg-muted inline-flex items-center gap-1.5 rounded-full px-2 py-0.5">
                    <span
                      className="size-2 rounded-full"
                      style={{ backgroundColor: item.categoryColor ?? "#64748b" }}
                    />
                    {item.categoryName}
                  </span>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}

      <RecurrenceFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        recurrence={editing}
        accounts={accounts}
        categories={categories}
        onSaved={() => router.refresh()}
      />

      <ConfirmDialog
        open={Boolean(deleting)}
        onOpenChange={(open) => !open && setDeleting(null)}
        title="Hapus jadwal berulang?"
        description={deleting ? `Jadwal â€œ${deleting.name}â€ akan dihapus permanen.` : undefined}
        onConfirm={() => (deleting ? deleteRecurrence(deleting.id) : Promise.resolve({ ok: true }))}
        onDone={() => {
          setDeleting(null);
          router.refresh();
        }}
      />
    </div>
  );
}
