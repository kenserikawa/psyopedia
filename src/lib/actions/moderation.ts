"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@/generated/prisma/client";
import {
  contributionSchema,
  idSchema,
  moderationRequestSchema,
  validationError,
} from "@/lib/validation";
import { revalidateModeration, revalidateOperations } from "@/lib/revalidation";

export async function approveContribution(contributionId: string) {
  const session = await auth();
  if (
    !session?.user?.id ||
    (session.user.role !== "MODERATOR" && session.user.role !== "ADMIN")
  ) {
    return { error: "Not authorized" };
  }
  const id = idSchema.safeParse(contributionId);
  if (!id.success) return { error: validationError(id.error) };

  try {
    const result = await prisma.$transaction(async (tx) => {
      const contribution = await tx.contribution.findUnique({
        where: { id: id.data },
      });
      if (!contribution || contribution.status !== "PENDING") {
        return { error: "Contribution not found or already reviewed" };
      }

      const parsed = contributionSchema.safeParse({
        type: contribution.type,
        proposedData: contribution.proposedData,
        ...(contribution.operationId ? { operationId: contribution.operationId } : {}),
      });
      if (!parsed.success) return { error: validationError(parsed.error) };
      const data = parsed.data;

      if (data.type !== "NEW_OPERATION") {
        const operation = await tx.operation.findUnique({
          where: { id: data.operationId, moderationStatus: "APPROVED" },
          select: { id: true },
        });
        if (!operation) return { error: "Operation not found" };
      }

      // Claim the pending review under a row lock before applying any effects.
      const claimed = await tx.contribution.updateMany({
        where: { id: id.data, status: "PENDING" },
        data: { status: "APPROVED", reviewedById: session.user.id },
      });
      if (claimed.count !== 1) {
        return { error: "Contribution not found or already reviewed" };
      }

      if (data.type === "NEW_OPERATION") {
        await tx.operation.create({
          data: {
            ...data.proposedData,
            moderationStatus: "APPROVED",
            contributedById: contribution.submittedById,
          },
        });
      } else if (data.type === "EDIT_OPERATION") {
        await tx.operation.update({
          where: { id: data.operationId, moderationStatus: "APPROVED" },
          data: data.proposedData,
        });
      } else {
        await tx.source.create({
          data: {
            title: data.proposedData.sourceTitle,
            url: data.proposedData.sourceUrl,
            type: data.proposedData.sourceType,
            credibility: data.proposedData.credibility,
            operationId: data.operationId,
          },
        });
      }

      await tx.user.update({
        where: { id: contribution.submittedById },
        data: { reputation: { increment: data.type === "NEW_OPERATION" ? 10 : 5 } },
      });
      return { success: true };
    });

    if (result.success) {
      revalidateModeration();
      revalidateOperations();
    }
    return result;
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2002") {
        return { error: "An operation with this slug already exists. The contribution is still pending." };
      }
      if (error.code === "P2025" || error.code === "P2003") {
        return { error: "A referenced record no longer exists. The contribution was not approved." };
      }
    }
    throw error;
  }
}

export async function rejectContribution(contributionId: string, reviewNote?: string) {
  const session = await auth();
  if (
    !session?.user?.id ||
    (session.user.role !== "MODERATOR" && session.user.role !== "ADMIN")
  ) {
    return { error: "Not authorized" };
  }
  const id = idSchema.safeParse(contributionId);
  if (!id.success) return { error: validationError(id.error) };
  const parsed = moderationRequestSchema.safeParse({ status: "REJECTED", reviewNote });
  if (!parsed.success) return { error: validationError(parsed.error) };

  const result = await prisma.contribution.updateMany({
    where: { id: id.data, status: "PENDING" },
    data: {
      status: "REJECTED",
      reviewedById: session.user.id,
      reviewNote: parsed.data.reviewNote || null,
    },
  });
  if (result.count !== 1) {
    return { error: "Contribution not found or already reviewed" };
  }

  revalidateModeration();
  return { success: true };
}
