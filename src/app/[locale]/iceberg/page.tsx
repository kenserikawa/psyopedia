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

const LEVEL_LABELS: Record<string, Record<number, string>> = {
  en: {
    1: "Well-Known & Declassified",
    2: "Known but Underappreciated",
    3: "Leaked / Partially Verified",
    4: "Alleged",
    5: "Deep Conspiracy",
  },
  es: {
    1: "Conocidas y Desclasificadas",
    2: "Conocidas pero Subestimadas",
    3: "Filtradas / Parcialmente Verificadas",
    4: "Alegadas",
    5: "Conspiración Profunda",
  },
};

export default async function IcebergPage({ params }: Props) {
  const { locale } = await params;
  const data = await getIcebergData();
  const t = await getTranslations({ locale, namespace: "iceberg" });

  const levelStats = data.map((d) => ({
    level: d.level,
    count: d.count,
    featured: d.operations.map((op) =>
      locale === "es" ? op.titleEs : op.title
    ),
    label: LEVEL_LABELS[locale]?.[d.level] ?? LEVEL_LABELS.en[d.level],
  }));

  return (
    <div className="py-8">
      <div className="text-center mb-4">
        <h1 className="text-3xl font-bold sm:text-4xl">{t("title")}</h1>
        <p className="mt-2 text-lg text-muted-foreground">{t("subtitle")}</p>
      </div>
      <IcebergClientWrapper levelStats={levelStats} locale={locale} />
      <p className="mt-4 text-center text-sm text-muted-foreground">
        {t("clickToExplore")}
      </p>
    </div>
  );
}
