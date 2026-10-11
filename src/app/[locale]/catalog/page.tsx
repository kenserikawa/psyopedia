import { Suspense } from "react";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import type { Metadata } from "next";
import { getCatalogOperations, getDistinctActors } from "@/lib/queries";
import { catalogSearchParams, parseCatalogFilters } from "@/lib/catalog";
import { CatalogFilters as CatalogFiltersComponent } from "@/components/catalog/CatalogFilters";
import { OperationGrid } from "@/components/catalog/OperationGrid";

interface Props {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "catalog" });
  const tSeo = await getTranslations({ locale, namespace: "seo" });

  return {
    title: t("title"),
    description: tSeo("siteDescription"),
  };
}

export default async function CatalogPage({ params, searchParams }: Props) {
  const { locale } = await params;
  const sp = await searchParams;

  const t = await getTranslations({ locale, namespace: "catalog" });

  const parsed = parseCatalogFilters(sp);
  const [result, actors] = await Promise.all([
    parsed.success ? getCatalogOperations({ ...parsed.filters, locale }) : Promise.resolve(null),
    getDistinctActors(),
  ]);
  const queryString = catalogSearchParams(sp).toString();
  const pageHref = (page: number) => {
    const query = catalogSearchParams(sp);
    query.set("page", String(page));
    return `/${locale}/catalog?${query}`;
  };

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Page title */}
      <h1 className="mb-8 text-3xl font-bold tracking-tight">
        {t("title")}
      </h1>

      <div className="flex flex-col gap-8 md:flex-row">
        <details className="rounded-md border p-4 md:hidden">
          <summary className="cursor-pointer font-semibold">
            {t("filters.title")}
          </summary>
          <div className="mt-4">
            <Suspense fallback={<div className="h-32 animate-pulse rounded-md bg-muted" />}>
              <CatalogFiltersComponent locale={locale} actors={actors} />
            </Suspense>
          </div>
        </details>
        <div className="hidden w-64 shrink-0 md:block">
          <Suspense fallback={<div className="h-96 animate-pulse rounded-md bg-muted" />}>
            <CatalogFiltersComponent locale={locale} actors={actors} />
          </Suspense>
        </div>

        {/* Main content */}
        <main className="min-w-0 flex-1">
          {!parsed.success && (
            <p role="alert" className="rounded-md border border-destructive p-4 text-destructive">
              {t("invalidFilters")}
            </p>
          )}
          {result && (
            <>
              <OperationGrid operations={result.operations} locale={locale} totalCount={result.total} queryString={queryString} />
              {result.totalPages > 1 && (
                <nav aria-label={t("pagination.label")} className="mt-8 flex flex-wrap items-center justify-center gap-4">
                  {result.page > 1 && (
                    <Link className="rounded-md border px-4 py-2 hover:bg-muted" href={pageHref(result.page - 1)} rel="prev">
                      {t("pagination.previous")}
                    </Link>
                  )}
                  <span aria-current="page">
                    {t("pagination.page", { page: result.page, totalPages: result.totalPages })}
                  </span>
                  {result.page < result.totalPages && (
                    <Link className="rounded-md border px-4 py-2 hover:bg-muted" href={pageHref(result.page + 1)} rel="next">
                      {t("pagination.next")}
                    </Link>
                  )}
                </nav>
              )}
            </>
          )}
        </main>
      </div>
    </div>
  );
}
