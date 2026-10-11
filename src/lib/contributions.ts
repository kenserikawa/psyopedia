import { prisma } from "@/lib/prisma";
import { contributionSchema, validationError } from "@/lib/validation";
import { revalidateModeration } from "@/lib/revalidation";

export async function createContribution(submittedById: string, input: unknown) {
  const parsed = contributionSchema.safeParse(input);
  if (!parsed.success) {
    return { error: validationError(parsed.error), status: 400 } as const;
  }

  const data = parsed.data;
  const result = await prisma.$transaction(async (tx) => {
    if (data.type !== "NEW_OPERATION") {
      const operation = await tx.operation.findUnique({
        where: { id: data.operationId, moderationStatus: "APPROVED" },
        select: { id: true },
      });
      if (!operation) {
        return { error: "Operation not found", status: 404 } as const;
      }
    }

    const contribution = await tx.contribution.create({
      data: {
        type: data.type,
        proposedData: data.proposedData,
        submittedById,
        ...(data.type !== "NEW_OPERATION" ? { operationId: data.operationId } : {}),
      },
    });
    await tx.user.update({
      where: { id: submittedById },
      data: { reputation: { increment: 1 } },
    });
    return { contribution } as const;
  });

  if ("contribution" in result) revalidateModeration();
  return result;
}
