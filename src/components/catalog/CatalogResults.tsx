import Link from "next/link";
import { useTranslations } from "next-intl";
import { OperationGrid } from "@/components/catalog/OperationGrid";
import type { CatalogPage } from "@/lib/catalog";

interface CatalogResultsProps {
  /** null cuando los filtros de la URL no son válidos. */
  result: CatalogPage | null;
  locale: string;
  queryString: string;
}

export function CatalogResults({ result, locale, queryString }: CatalogResultsProps) {
  const t = useTranslations("catalog");

  if (!result) {
    return (
      <p role="alert" className="rounded-md border border-destructive p-4 text-destructive">
        {t("invalidFilters")}
      </p>
    );
  }

  const pageHref = (page: number) => {
    const query = new URLSearchParams(queryString);
    query.set("page", String(page));
    return `/${locale}/catalog?${query}`;
  };

  return (
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
  );
}
