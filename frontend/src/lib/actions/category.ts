import { apiMutate, type ActionResult } from "@/lib/api-client";

export async function createCategory(input: unknown): Promise<ActionResult> {
  return apiMutate("/api/categories", { method: "POST", body: input });
}

export async function updateCategory(id: string, input: unknown): Promise<ActionResult> {
  return apiMutate(`/api/categories/${id}`, { method: "PUT", body: input });
}

export async function deleteCategory(id: string): Promise<ActionResult> {
  return apiMutate(`/api/categories/${id}`, { method: "DELETE" });
}
