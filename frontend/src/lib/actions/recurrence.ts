import { apiMutate, type ActionResult } from "@/lib/api-client";

export async function createRecurrence(input: unknown): Promise<ActionResult> {
  return apiMutate("/api/recurrences", { method: "POST", body: input });
}

export async function updateRecurrence(id: string, input: unknown): Promise<ActionResult> {
  return apiMutate(`/api/recurrences/${id}`, { method: "PUT", body: input });
}

export async function toggleRecurrenceActive(id: string): Promise<ActionResult> {
  return apiMutate(`/api/recurrences/${id}/toggle-active`, { method: "POST" });
}

export async function runRecurrenceNow(id: string): Promise<ActionResult> {
  return apiMutate(`/api/recurrences/${id}/run`, { method: "POST" });
}

export async function deleteRecurrence(id: string): Promise<ActionResult> {
  return apiMutate(`/api/recurrences/${id}`, { method: "DELETE" });
}
