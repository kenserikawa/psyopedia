import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { createContribution } from "@/lib/contributions";
import { getPendingContributions } from "@/lib/queries";

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

  const result = await createContribution(session.user.id, body);
  if ("error" in result) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }
  return NextResponse.json(result.contribution, { status: 201 });
}

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }
  if (session.user.role !== "MODERATOR" && session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Moderator access required" }, { status: 403 });
  }
  return NextResponse.json(await getPendingContributions());
}
