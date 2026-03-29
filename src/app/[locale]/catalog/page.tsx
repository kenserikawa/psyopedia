import { Suspense } from "react";
import { getTranslations } from "next-intl/server";
import type { Metadata } from "next";
import { getCatalogOperations, getDistinctActors } from "@/lib/queries";
import type { CatalogFilters } from "@/lib/queries";
import { CatalogFilters as CatalogFiltersComponent } from "@/components/catalog/CatalogFilters";
import { OperationGrid } from "@/components/catalog/OperationGrid";
import type { Era, OperationType, Outcome } from "@/generated/prisma";

interface Props {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

function getString(
  value: string | string[] | undefined
): string | undefined {
  if (!value) return undefined;
  return Array.isArray(value) ? value[0] : value;
}

function getCommaSeparated(
  value: string | string[] | undefined
): string[] {
  const str = getString(value);
  if (!str) return [];
  return str.split(",").filter(Boolean);
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "catalog" });
  const tSeo = await getTranslations({ locale, namespace: "seo" });

  return {
    title: `${t("title")} | ${tSeo("siteName")}`,
    description: tSeo("siteDescription"),
  };
}

export default async function CatalogPage({ params, searchParams }: Props) {
  const { locale } = await params;
  const sp = await searchParams;

  const t = await getTranslations({ locale, namespace: "catalog" });

  // Parse searchParams into CatalogFilters
  const rawLevels = getCommaSeparated(sp.level);
  const rawEras = getCommaSeparated(sp.era);
  const rawTypes = getCommaSeparated(sp.type);
  const rawOutcomes = getCommaSeparated(sp.outcome);

  const filters: CatalogFilters = {
    search: getString(sp.search),
    levels: rawLevels.map(Number).filter((n) => !isNaN(n) && n >= 1 && n <= 5),
    eras: rawEras as Era[],
    types: rawTypes as OperationType[],
    outcomes: rawOutcomes as Outcome[],
    actor: getString(sp.actor),
    sort: getString(sp.sort),
  };

  // Fetch data in parallel
  const [operations, actors] = await Promise.all([
    getCatalogOperations(filters),
    getDistinctActors(),
  ]);

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Page title */}
      <h1 className="mb-8 text-3xl font-bold tracking-tight">
        {t("title")}
      </h1>

      <div className="flex gap-8">
        {/* Sidebar — hidden on mobile */}
        <div className="hidden w-64 shrink-0 md:block">
          <Suspense fallback={<div className="h-96 animate-pulse rounded-md bg-muted" />}>
            <CatalogFiltersComponent locale={locale} actors={actors} />
          </Suspense>
        </div>

        {/* Main content */}
        <main className="min-w-0 flex-1">
          <OperationGrid operations={operations} locale={locale} />
        </main>
      </div>
    </div>
  );
}
