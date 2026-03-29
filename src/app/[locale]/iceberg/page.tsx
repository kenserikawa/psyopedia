import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { getIcebergData } from "@/lib/queries";
import IcebergClientWrapper from "@/components/iceberg/IcebergClientWrapper";

interface Props {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "iceberg" });
  return { title: t("title") };
}

export default async function IcebergPage({ params }: Props) {
  const { locale } = await params;
  const rawOperations = await getIcebergData();
  const t = await getTranslations({ locale, namespace: "iceberg" });

  const operations = rawOperations.map((op) => ({
    id: op.id,
    title: locale === "es" ? op.titleEs : op.title,
    excerpt: locale === "es" ? op.excerptEs : op.excerpt,
    era: op.era,
    status: op.status,
    slug: locale === "es" ? op.slugEs : op.slug,
    icebergLevel: op.icebergLevel,
  }));

  return (
    <div className="py-8">
      <div className="text-center mb-4">
        <h1 className="text-3xl font-bold sm:text-4xl">{t("title")}</h1>
        <p className="mt-2 text-lg text-muted-foreground">{t("subtitle")}</p>
      </div>
      <IcebergClientWrapper operations={operations} locale={locale} />
      <p className="mt-4 text-center text-sm text-muted-foreground">
        {t("clickToExplore")}
      </p>
    </div>
  );
}
