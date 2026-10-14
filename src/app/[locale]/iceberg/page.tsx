import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { getIcebergData } from "@/lib/content";
import { ogImageUrl, pageUrl } from "@/lib/site";
import IcebergJourneyWrapper from "@/components/iceberg/IcebergJourneyWrapper";

interface Props {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "iceberg" });
  return {
    title: t("title"),
    description: t("subtitle"),
    openGraph: {
      title: t("title"),
      description: t("subtitle"),
      images: [ogImageUrl(locale)],
    },
    alternates: {
      canonical: pageUrl(`/${locale}/iceberg`),
      languages: { en: pageUrl("/en/iceberg"), es: pageUrl("/es/iceberg") },
    },
  };
}

export default async function IcebergPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  const operations = getIcebergData().map((op) => ({
    id: op.id,
    title: locale === "es" ? op.titleEs : op.title,
    excerpt: locale === "es" ? op.excerptEs : op.excerpt,
    era: op.era,
    status: op.status,
    slug: locale === "es" ? op.slugEs : op.slug,
    icebergLevel: op.icebergLevel,
    types: op.types,
    outcome: op.outcome,
    actors: op.actors,
    sourceCount: op.sourceCount,
  }));

  return <IcebergJourneyWrapper operations={operations} locale={locale} />;
}
