import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

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

  const { operationId, body: commentBody } = body as {
    operationId?: string;
    body?: string;
  };

  if (!operationId) {
    return NextResponse.json({ error: "operationId is required" }, { status: 400 });
  }

  if (!commentBody || commentBody.trim().length < 3) {
    return NextResponse.json(
      { error: "Comment body must be at least 3 characters" },
      { status: 400 }
    );
  }

  const comment = await prisma.comment.create({
    data: {
      body: commentBody.trim(),
      operationId,
      authorId: session.user.id,
      status: "PENDING",
    },
  });

  return NextResponse.json(comment, { status: 201 });
}
