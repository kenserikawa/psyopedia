import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { getIcebergData } from "@/lib/queries";
import { IcebergVisualization } from "@/components/iceberg/IcebergVisualization";

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
  const data = await getIcebergData();
  const t = await getTranslations({ locale, namespace: "iceberg" });

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold sm:text-4xl">{t("title")}</h1>
        <p className="mt-2 text-lg text-muted-foreground">{t("subtitle")}</p>
      </div>
      <div className="flex justify-center">
        <IcebergVisualization data={data} locale={locale} />
      </div>
      <p className="mt-4 text-center text-sm text-muted-foreground">
        {t("clickToExplore")}
      </p>
    </div>
  );
}
