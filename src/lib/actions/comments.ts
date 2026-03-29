"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function submitComment(operationId: string, body: string) {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: "Not authenticated" };
  }

  if (!body || body.trim().length < 3) {
    return { error: "Comment must be at least 3 characters" };
  }

  await prisma.comment.create({
    data: {
      body: body.trim(),
      operationId,
      authorId: session.user.id,
      status: "PENDING",
    },
  });

  revalidatePath(`/catalog`);
  return { success: true };
}

export async function moderateComment(
  commentId: string,
  status: "APPROVED" | "REJECTED"
) {
  const session = await auth();
  if (
    !session?.user?.id ||
    (session.user.role !== "MODERATOR" && session.user.role !== "ADMIN")
  ) {
    return { error: "Not authorized" };
  }

  await prisma.comment.update({
    where: { id: commentId },
    data: { status },
  });

  revalidatePath(`/catalog`);
  revalidatePath(`/admin`);
  return { success: true };
}
