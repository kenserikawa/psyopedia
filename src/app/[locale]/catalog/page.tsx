import { Suspense } from "react";
import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { getCatalogSummaries, getDistinctActors } from "@/lib/content";
import { filterCatalog } from "@/lib/catalog";
import { CatalogBrowser } from "@/components/catalog/CatalogBrowser";
import { CatalogLayout } from "@/components/catalog/CatalogLayout";
import { CatalogResults } from "@/components/catalog/CatalogResults";

interface Props {
  params: Promise<{ locale: string }>;
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

export default async function CatalogPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "catalog" });
  const operations = getCatalogSummaries();
  const actors = getDistinctActors();

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="mb-8 text-3xl font-bold tracking-tight">{t("title")}</h1>
      {/* El HTML estático trae la primera página sin filtros; el cliente aplica los de la URL. */}
      <Suspense
        fallback={
          <CatalogLayout
            filters={<div className="h-96 animate-pulse rounded-md bg-muted" />}
            results={<CatalogResults result={filterCatalog(operations, { locale })} locale={locale} queryString="" />}
          />
        }
      >
        <CatalogBrowser operations={operations} actors={actors} locale={locale} />
      </Suspense>
    </div>
  );
}
