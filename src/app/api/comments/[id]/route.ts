import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { moderateComment } from "@/lib/actions/comments";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  if (session.user.role !== "MODERATOR" && session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Moderator access required" }, { status: 403 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { status } = body as { status?: string };

  if (status !== "APPROVED" && status !== "REJECTED") {
    return NextResponse.json(
      { error: "status must be APPROVED or REJECTED" },
      { status: 400 }
    );
  }

  const { id } = await params;

  const result = await moderateComment(id, status);

  if (result.error) {
    const statusCode = result.error === "Not authorized" ? 403 : 400;
    return NextResponse.json({ error: result.error }, { status: statusCode });
  }

  return NextResponse.json({ status, commentId: id });
}
