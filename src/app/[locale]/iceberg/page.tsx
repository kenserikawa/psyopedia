import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { getIcebergData } from "@/lib/queries";
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
    },
    alternates: {
      canonical: `/${locale}/iceberg`,
      languages: { en: "/en/iceberg", es: "/es/iceberg" },
    },
  };
}

export default async function IcebergPage({ params }: Props) {
  const { locale } = await params;
  const rawOperations = await getIcebergData();

  const operations = rawOperations.map((op) => ({
    id: op.id,
    title: locale === "es" ? op.titleEs : op.title,
    excerpt: locale === "es" ? op.excerptEs : op.excerpt,
    era: op.era,
    status: op.status,
    slug: locale === "es" ? op.slugEs : op.slug,
    icebergLevel: op.icebergLevel,
  }));

  return <IcebergJourneyWrapper operations={operations} locale={locale} />;
}
