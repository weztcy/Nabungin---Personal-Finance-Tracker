import { apiMutate, type ActionResult } from "@/lib/api-client";

export async function createAccount(input: unknown): Promise<ActionResult> {
  return apiMutate("/api/accounts", { method: "POST", body: input });
}

export async function updateAccount(id: string, input: unknown): Promise<ActionResult> {
  return apiMutate(`/api/accounts/${id}`, { method: "PUT", body: input });
}

export async function toggleAccountArchived(id: string): Promise<ActionResult> {
  return apiMutate(`/api/accounts/${id}/toggle-archived`, { method: "POST" });
}

export async function deleteAccount(id: string): Promise<ActionResult> {
  return apiMutate(`/api/accounts/${id}`, { method: "DELETE" });
}
