"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  Era,
  OperationType,
  Outcome,
  OperationStatus,
  SourceType,
} from "@/generated/prisma";
import { revalidatePath } from "next/cache";

export async function approveContribution(contributionId: string) {
  const session = await auth();
  if (
    !session?.user?.id ||
    (session.user.role !== "MODERATOR" && session.user.role !== "ADMIN")
  ) {
    return { error: "Not authorized" };
  }

  const contribution = await prisma.contribution.findUnique({
    where: { id: contributionId },
    include: { submittedBy: true },
  });

  if (!contribution || contribution.status !== "PENDING") {
    return { error: "Contribution not found or already reviewed" };
  }

  if (contribution.type === "NEW_OPERATION") {
    const data = contribution.proposedData as Record<string, unknown>;
    await prisma.operation.create({
      data: {
        slug: data.slug as string,
        slugEs: (data.slugEs as string) || (data.slug as string),
        title: data.title as string,
        titleEs: (data.titleEs as string) || (data.title as string),
        aliases: (data.aliases as string[]) || [],
        icebergLevel: (data.icebergLevel as number) || 3,
        era: ((data.era as Era) || "MODERN") as Era,
        types: ((data.types as OperationType[]) || []) as OperationType[],
        actors: (data.actors as string[]) || [],
        targets: (data.targets as string[]) || [],
        outcome: ((data.outcome as Outcome) || "UNKNOWN") as Outcome,
        status: ((data.status as OperationStatus) || "ALLEGED") as OperationStatus,
        bodyEn: (data.bodyEn as string) || "",
        bodyEs: (data.bodyEs as string) || "",
        excerpt: (data.excerpt as string) || "",
        excerptEs: (data.excerptEs as string) || "",
        moderationStatus: "APPROVED",
        contributedById: contribution.submittedById,
      },
    });

    // +10 reputation for approved new operation
    await prisma.user.update({
      where: { id: contribution.submittedById },
      data: { reputation: { increment: 10 } },
    });
  } else if (contribution.type === "ADD_SOURCE") {
    const data = contribution.proposedData as Record<string, unknown>;
    if (contribution.operationId) {
      await prisma.source.create({
        data: {
          title: data.sourceTitle as string,
          url: (data.sourceUrl as string) || null,
          type: ((data.sourceType as SourceType) || "WEBSITE") as SourceType,
          credibility: (data.credibility as number) || 3,
          operationId: contribution.operationId,
        },
      });

      // +5 reputation for approved source
      await prisma.user.update({
        where: { id: contribution.submittedById },
        data: { reputation: { increment: 5 } },
      });
    }
  }

  await prisma.contribution.update({
    where: { id: contributionId },
    data: {
      status: "APPROVED",
      reviewedById: session.user.id,
    },
  });

  revalidatePath("/admin");
  return { success: true };
}

export async function rejectContribution(
  contributionId: string,
  reviewNote?: string
) {
  const session = await auth();
  if (
    !session?.user?.id ||
    (session.user.role !== "MODERATOR" && session.user.role !== "ADMIN")
  ) {
    return { error: "Not authorized" };
  }

  await prisma.contribution.update({
    where: { id: contributionId },
    data: {
      status: "REJECTED",
      reviewedById: session.user.id,
      reviewNote: reviewNote || null,
    },
  });

  revalidatePath("/admin");
  return { success: true };
}
