import { apiMutate, type ActionResult } from "@/lib/api-client";

export async function createTransaction(input: unknown): Promise<ActionResult> {
  return apiMutate("/api/transactions", { method: "POST", body: input });
}

export async function updateTransaction(id: string, input: unknown): Promise<ActionResult> {
  return apiMutate(`/api/transactions/${id}`, { method: "PUT", body: input });
}

export async function deleteTransaction(id: string): Promise<ActionResult> {
  return apiMutate(`/api/transactions/${id}`, { method: "DELETE" });
}
