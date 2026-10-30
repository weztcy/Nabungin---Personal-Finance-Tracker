import { apiMutate, type ActionResult } from "@/lib/api-client";

export async function createBudget(input: unknown): Promise<ActionResult> {
  return apiMutate("/api/budgets", { method: "POST", body: input });
}

export async function updateBudget(id: string, input: unknown): Promise<ActionResult> {
  return apiMutate(`/api/budgets/${id}`, { method: "PUT", body: input });
}

export async function deleteBudget(id: string): Promise<ActionResult> {
  return apiMutate(`/api/budgets/${id}`, { method: "DELETE" });
}
