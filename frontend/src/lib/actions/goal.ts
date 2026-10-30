import { apiMutate, type ActionResult } from "@/lib/api-client";

export async function createGoal(input: unknown): Promise<ActionResult> {
  return apiMutate("/api/goals", { method: "POST", body: input });
}

export async function updateGoal(id: string, input: unknown): Promise<ActionResult> {
  return apiMutate(`/api/goals/${id}`, { method: "PUT", body: input });
}

export async function contributeToGoal(id: string, input: unknown): Promise<ActionResult> {
  return apiMutate(`/api/goals/${id}/contribute`, { method: "POST", body: input });
}

export async function toggleGoalCompleted(id: string): Promise<ActionResult> {
  return apiMutate(`/api/goals/${id}/toggle-completed`, { method: "POST" });
}

export async function deleteGoal(id: string): Promise<ActionResult> {
  return apiMutate(`/api/goals/${id}`, { method: "DELETE" });
}
