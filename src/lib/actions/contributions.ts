"use server";

import { auth } from "@/lib/auth";
import { createContribution } from "@/lib/contributions";
import { operationFormData } from "@/lib/validation";

export async function submitNewOperation(_prevState: unknown, formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Not authenticated" };

  const result = await createContribution(session.user.id, {
    type: "NEW_OPERATION",
    proposedData: operationFormData(formData),
  });
  if ("error" in result) return { error: result.error };
  return { success: true };
}

export async function submitAddSource(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Not authenticated" };

  const credibility = formData.get("credibility");
  const result = await createContribution(session.user.id, {
    type: "ADD_SOURCE",
    operationId: formData.get("operationId"),
    proposedData: {
      sourceTitle: formData.get("sourceTitle"),
      sourceUrl: formData.get("sourceUrl") || null,
      sourceType: formData.get("sourceType") ?? undefined,
      credibility: typeof credibility === "string" ? Number(credibility) : credibility ?? undefined,
    },
  });
  if ("error" in result) return { error: result.error };
  return { success: true };
}
