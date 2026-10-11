"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createComment } from "@/lib/comments";
import { idSchema, moderationStatusSchema, validationError } from "@/lib/validation";
import { revalidateModeration } from "@/lib/revalidation";
import { revalidatePath } from "next/cache";

export async function submitComment(operationId: string, body: string) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Not authenticated" };

  const result = await createComment(session.user.id, { operationId, body });
  if ("error" in result) return { error: result.error };
  return { success: true };
}

export async function moderateComment(commentId: string, status: "APPROVED" | "REJECTED") {
  const session = await auth();
  if (
    !session?.user?.id ||
    (session.user.role !== "MODERATOR" && session.user.role !== "ADMIN")
  ) {
    return { error: "Not authorized" };
  }
  const id = idSchema.safeParse(commentId);
  if (!id.success) return { error: validationError(id.error) };
  const parsed = moderationStatusSchema.safeParse(status);
  if (!parsed.success) return { error: validationError(parsed.error) };

  const result = await prisma.comment.updateMany({
    where: { id: id.data, status: "PENDING" },
    data: { status: parsed.data },
  });
  if (result.count !== 1) return { error: "Comment not found or already reviewed" };

  revalidatePath("/[locale]/catalog/[slug]", "page");
  revalidateModeration();
  return { success: true };
}
