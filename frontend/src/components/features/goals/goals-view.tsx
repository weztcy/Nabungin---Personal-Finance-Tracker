"use client";

import { useEffect, useState } from "react";

import { useRouter } from "next/navigation";

import { zodResolver } from "@hookform/resolvers/zod";
import {
  CheckIcon,
  Loader2Icon,
  MoreHorizontalIcon,
  PencilIcon,
  PlusIcon,
  Trash2Icon,
} from "lucide-react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { ConfirmDialog } from "@/components/confirm-dialog";
import {
  GoalFormDialog,
  type GoalItem,
  type SimpleAccountRef,
} from "@/components/features/goals/goal-form-dialog";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress, ProgressIndicator, ProgressTrack } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { goalContributionSchema, type GoalContributionValues } from "@/lib/validators/goal";
import { contributeToGoal, deleteGoal, toggleGoalCompleted } from "@/lib/actions/goal";

type GoalListItem = {
  id: string;
  name: string;
  targetAmount: number;
  savedAmount: number;
  savedLabel: string;
  targetLabel: string;
  percent: number;
  targetDateLabel: string | null;
  targetDate: string | null;
  color: string | null;
  accountId: string | null;
  accountName: string | null;
  isCompleted: boolean;
};

export function GoalsView({
  goals,
  accounts,
}: {
  goals: GoalListItem[];
  accounts: SimpleAccountRef[];
}) {
  const router = useRouter();
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<GoalItem | null>(null);
  const [deleting, setDeleting] = useState<GoalListItem | null>(null);
  const [contributing, setContributing] = useState<GoalListItem | null>(null);

  function openCreate() {
    setEditing(null);
    setFormOpen(true);
  }

  function openEdit(goal: GoalListItem) {
    setEditing({
      id: goal.id,
      name: goal.name,
      targetAmount: goal.targetAmount,
      savedAmount: goal.savedAmount,
      targetDate: goal.targetDate,
      color: goal.color,
      accountId: goal.accountId,
    });
    setFormOpen(true);
  }

  async function handleToggleComplete(goal: GoalListItem) {
    const result = await toggleGoalCompleted(goal.id);
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    toast.success(goal.isCompleted ? "Target dibuka kembali" : "Target ditandai selesai");
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="font-heading text-2xl font-semibold">Target Tabungan</h1>
          <p className="text-muted-foreground text-sm">
            Rencanakan dan kumpulkan dana untuk tujuan finansialmu.
          </p>
        </div>
        <Button onClick={openCreate}>
          <PlusIcon /> Tambah Target
        </Button>
      </div>

      {goals.length === 0 ? (
        <Card className="text-muted-foreground items-center p-10 text-center text-sm">
          Belum ada target tabungan. Klik â€œTambah Targetâ€ untuk membuatnya.
        </Card>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {goals.map((goal) => (
            <GoalCard
              key={goal.id}
              goal={goal}
              onEdit={openEdit}
              onDelete={setDeleting}
              onContribute={setContributing}
              onToggleComplete={handleToggleComplete}
            />
          ))}
        </div>
      )}

      <GoalFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        goal={editing}
        accounts={accounts}
        onSaved={() => router.refresh()}
      />

      <ContributeDialog
        goal={contributing}
        onOpenChange={(open) => !open && setContributing(null)}
        onDone={() => {
          setContributing(null);
          router.refresh();
        }}
      />

      <ConfirmDialog
        open={Boolean(deleting)}
        onOpenChange={(open) => !open && setDeleting(null)}
        title="Hapus target?"
        description={deleting ? `Target â€œ${deleting.name}â€ akan dihapus permanen.` : undefined}
        onConfirm={() => (deleting ? deleteGoal(deleting.id) : Promise.resolve({ ok: true }))}
        onDone={() => {
          setDeleting(null);
          router.refresh();
        }}
      />
    </div>
  );
}

function GoalCard({
  goal,
  onEdit,
  onDelete,
  onContribute,
  onToggleComplete,
}: {
  goal: GoalListItem;
  onEdit: (goal: GoalListItem) => void;
  onDelete: (goal: GoalListItem) => void;
  onContribute: (goal: GoalListItem) => void;
  onToggleComplete: (goal: GoalListItem) => void;
}) {
  const clamped = Math.min(Math.max(goal.percent, 0), 100);
  const reached = goal.percent >= 100;

  return (
    <Card className={cn("gap-3", goal.isCompleted && "opacity-60")}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2.5">
          <span
            className="size-3 shrink-0 rounded-full"
            style={{ backgroundColor: goal.color ?? "#64748b" }}
          />
          <div className="flex flex-col gap-0.5">
            <span className="font-medium">{goal.name}</span>
            <span className="text-muted-foreground text-xs">
              {goal.targetDateLabel ? `Target: ${goal.targetDateLabel}` : "Tanpa tenggat"}
              {goal.accountName ? ` Â· ${goal.accountName}` : ""}
            </span>
          </div>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger render={<Button variant="ghost" size="icon-sm" />}>
            <MoreHorizontalIcon />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onContribute(goal)}>
              <PlusIcon /> Tambah Dana
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onEdit(goal)}>
              <PencilIcon /> Ubah
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onToggleComplete(goal)}>
              <CheckIcon /> {goal.isCompleted ? "Buka Kembali" : "Tandai Selesai"}
            </DropdownMenuItem>
            <DropdownMenuItem variant="destructive" onClick={() => onDelete(goal)}>
              <Trash2Icon /> Hapus
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="flex flex-col gap-2">
        <div className="flex items-baseline justify-between gap-2">
          <span className="font-heading text-lg font-semibold">{goal.savedLabel}</span>
          <span className="text-muted-foreground text-xs">dari {goal.targetLabel}</span>
        </div>
        <Progress value={clamped}>
          <ProgressTrack className="h-2">
            <ProgressIndicator className={reached ? "bg-emerald-500" : "bg-primary"} />
          </ProgressTrack>
        </Progress>
        <span className={cn("text-xs", reached ? "text-emerald-600" : "text-muted-foreground")}>
          {goal.percent.toFixed(0)}% tercapai{reached ? " ðŸŽ‰" : ""}
        </span>
      </div>
    </Card>
  );
}

function ContributeDialog({
  goal,
  onOpenChange,
  onDone,
}: {
  goal: GoalListItem | null;
  onOpenChange: (open: boolean) => void;
  onDone: () => void;
}) {
  const [isPending, setIsPending] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<GoalContributionValues>({
    resolver: zodResolver(goalContributionSchema),
    defaultValues: { amount: "" },
  });

  useEffect(() => {
    if (goal) reset({ amount: "" });
  }, [goal, reset]);

  async function onSubmit(values: GoalContributionValues) {
    if (!goal) return;
    setIsPending(true);
    const result = await contributeToGoal(goal.id, values);
    setIsPending(false);

    if (!result.ok) {
      toast.error(result.error);
      return;
    }

    toast.success("Dana ditambahkan ke target");
    onOpenChange(false);
    onDone();
  }

  return (
    <Dialog open={Boolean(goal)} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Tambah Dana</DialogTitle>
          <DialogDescription>
            {goal ? `Tambahkan tabungan ke target â€œ${goal.name}â€.` : ""}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4" noValidate>
          <div className="flex flex-col gap-2">
            <Label htmlFor="contrib-amount">Jumlah (Rp)</Label>
            <Input
              id="contrib-amount"
              type="number"
              inputMode="numeric"
              min={0}
              placeholder="0"
              aria-invalid={!!errors.amount}
              {...register("amount")}
            />
            {errors.amount && <p className="text-destructive text-xs">{errors.amount.message}</p>}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Batal
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? <Loader2Icon className="animate-spin" /> : null}
              Tambah
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
