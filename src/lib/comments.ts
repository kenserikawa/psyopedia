import { prisma } from "@/lib/prisma";
import { commentSchema, validationError } from "@/lib/validation";
import { revalidateModeration } from "@/lib/revalidation";

export async function createComment(authorId: string, input: unknown) {
  const parsed = commentSchema.safeParse(input);
  if (!parsed.success) {
    return { error: validationError(parsed.error), status: 400 } as const;
  }
  const operation = await prisma.operation.findUnique({
    where: { id: parsed.data.operationId, moderationStatus: "APPROVED" },
    select: { id: true },
  });
  if (!operation) return { error: "Operation not found", status: 404 } as const;

  const comment = await prisma.comment.create({
    data: { ...parsed.data, authorId, status: "PENDING" },
  });
  revalidateModeration();
  return { comment } as const;
}
