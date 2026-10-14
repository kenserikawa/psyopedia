"use client";

import { useSearchParams } from "next/navigation";
import { CatalogFilters } from "@/components/catalog/CatalogFilters";
import { CatalogLayout } from "@/components/catalog/CatalogLayout";
import { CatalogResults } from "@/components/catalog/CatalogResults";
import { catalogSearchParams, filterCatalog, parseCatalogFilters } from "@/lib/catalog";
import type { OperationSummary } from "@/lib/catalog";

interface CatalogBrowserProps {
  operations: OperationSummary[];
  actors: string[];
  locale: string;
}

/** Aplica en el navegador los filtros de la URL sobre todas las operaciones. */
export function CatalogBrowser({ operations, actors, locale }: CatalogBrowserProps) {
  const searchParams = useSearchParams();
  const parsed = parseCatalogFilters(searchParams);
  const result = parsed.success ? filterCatalog(operations, { ...parsed.filters, locale }) : null;

  return (
    <CatalogLayout
      filters={<CatalogFilters locale={locale} actors={actors} />}
      results={
        <CatalogResults result={result} locale={locale} queryString={catalogSearchParams(searchParams).toString()} />
      }
    />
  );
}
