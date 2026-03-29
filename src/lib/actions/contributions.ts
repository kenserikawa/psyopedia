"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function submitNewOperation(_prevState: unknown, formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: "Not authenticated" };
  }

  const title = formData.get("title") as string;
  const titleEs = formData.get("titleEs") as string;

  const proposedData = {
    title,
    titleEs,
    slug: title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, ""),
    slugEs: titleEs
      ? titleEs
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/(^-|-$)/g, "")
      : "",
    icebergLevel: parseInt(formData.get("icebergLevel") as string, 10),
    era: formData.get("era") as string,
    types: formData.getAll("types") as string[],
    actors: (formData.get("actors") as string)
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean),
    targets: (formData.get("targets") as string)
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean),
    outcome: formData.get("outcome") as string,
    status: formData.get("status") as string,
    bodyEn: formData.get("bodyEn") as string,
    bodyEs: formData.get("bodyEs") as string,
    excerpt: formData.get("excerpt") as string,
    excerptEs: formData.get("excerptEs") as string,
  };

  // Basic validation
  if (!proposedData.title || !proposedData.bodyEn || !proposedData.excerpt) {
    return { error: "Title, body, and excerpt are required" };
  }

  await prisma.contribution.create({
    data: {
      type: "NEW_OPERATION",
      proposedData,
      submittedById: session.user.id,
    },
  });

  // Bump reputation by 1 for submission
  await prisma.user.update({
    where: { id: session.user.id },
    data: { reputation: { increment: 1 } },
  });

  revalidatePath("/admin");
  return { success: true };
}

export async function submitAddSource(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: "Not authenticated" };
  }

  const operationId = formData.get("operationId") as string;
  const proposedData = {
    sourceTitle: formData.get("sourceTitle") as string,
    sourceUrl: (formData.get("sourceUrl") as string) || null,
    sourceType: formData.get("sourceType") as string,
    credibility: parseInt(formData.get("credibility") as string, 10),
  };

  if (!proposedData.sourceTitle || !operationId) {
    return { error: "Source title and operation are required" };
  }

  await prisma.contribution.create({
    data: {
      type: "ADD_SOURCE",
      operationId,
      proposedData,
      submittedById: session.user.id,
    },
  });

  await prisma.user.update({
    where: { id: session.user.id },
    data: { reputation: { increment: 1 } },
  });

  revalidatePath("/admin");
  return { success: true };
}
