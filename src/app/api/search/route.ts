import { NextResponse } from "next/server";
import { searchOperations } from "@/lib/queries";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);

  const q = searchParams.get("q");
  const locale = searchParams.get("locale") || "en";

  // Validate query parameter
  if (!q || q.trim().length < 2) {
    return NextResponse.json(
      { error: "Search query must be at least 2 characters" },
      { status: 400 }
    );
  }

  const operations = await searchOperations(q, locale);

  // Transform response to include only needed fields
  const results = operations.map((op) => ({
    id: op.id,
    slug: op.slug,
    slugEs: op.slugEs,
    title: op.title,
    titleEs: op.titleEs,
    excerpt: op.excerpt,
    excerptEs: op.excerptEs,
    icebergLevel: op.icebergLevel,
    era: op.era,
    tags: op.tags,
  }));

  return NextResponse.json(results);
}
