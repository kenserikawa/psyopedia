import { NextResponse } from "next/server";
import { getOperationBySlug } from "@/lib/queries";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;

  const operation = await getOperationBySlug(slug);

  if (!operation) {
    return NextResponse.json({ error: "Operation not found" }, { status: 404 });
  }

  return NextResponse.json(operation);
}
