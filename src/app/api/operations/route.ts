import { NextResponse } from "next/server";
import { getTranslations } from "next-intl/server";
import { getCatalogOperations } from "@/lib/queries";
import { parseCatalogFilters } from "@/lib/catalog";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const parsed = parseCatalogFilters(searchParams);
  if (!parsed.success) {
    const locale = searchParams.get("locale") === "es" ? "es" : "en";
    const t = await getTranslations({ locale, namespace: "catalog" });
    return NextResponse.json(
      { error: t("invalidFilters"), details: parsed.errors },
      { status: 400 }
    );
  }

  const { operations, total, page, pageSize, totalPages } =
    await getCatalogOperations(parsed.filters);
  return NextResponse.json(operations, {
    headers: {
      "X-Total-Count": String(total),
      "X-Page": String(page),
      "X-Page-Size": String(pageSize),
      "X-Total-Pages": String(totalPages),
    },
  });
}
