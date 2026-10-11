import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { approveContribution, rejectContribution } from "@/lib/actions/moderation";
import { moderationRequestSchema, validationError } from "@/lib/validation";

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

  const parsed = moderationRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: validationError(parsed.error) },
      { status: 400 }
    );
  }
  const { status, reviewNote } = parsed.data;

  const { id } = await params;

  let result: { error?: string; success?: boolean };
  if (status === "APPROVED") {
    result = await approveContribution(id);
  } else {
    result = await rejectContribution(id, reviewNote);
  }

  if (result.error) {
    const statusCode =
      result.error === "Not authorized" ? 403 : 400;
    return NextResponse.json({ error: result.error }, { status: statusCode });
  }

  return NextResponse.json({ status, contributionId: id });
}
