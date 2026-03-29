import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getPendingContributions } from "@/lib/queries";
import { ContributionType } from "@/generated/prisma";

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { type, proposedData, operationId } = body as {
    type?: string;
    proposedData?: unknown;
    operationId?: string;
  };

  if (!type || !proposedData) {
    return NextResponse.json(
      { error: "type and proposedData are required" },
      { status: 400 }
    );
  }

  const validTypes = Object.values(ContributionType);
  if (!validTypes.includes(type as ContributionType)) {
    return NextResponse.json(
      { error: `type must be one of: ${validTypes.join(", ")}` },
      { status: 400 }
    );
  }

  if (type === "ADD_SOURCE" && !operationId) {
    return NextResponse.json(
      { error: "operationId is required for ADD_SOURCE contributions" },
      { status: 400 }
    );
  }

  const contribution = await prisma.contribution.create({
    data: {
      type: type as ContributionType,
      proposedData,
      submittedById: session.user.id,
      ...(operationId ? { operationId } : {}),
    },
  });

  await prisma.user.update({
    where: { id: session.user.id },
    data: { reputation: { increment: 1 } },
  });

  return NextResponse.json(contribution, { status: 201 });
}

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  if (session.user.role !== "MODERATOR" && session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Moderator access required" }, { status: 403 });
  }

  const contributions = await getPendingContributions();

  return NextResponse.json(contributions);
}
