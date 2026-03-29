import { getTranslations } from "next-intl/server";
import type { Metadata } from "next";

interface Props {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "admin" });
  return { title: t("dashboard") };
}

export default async function AdminDashboardPage({ params }: Props) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "admin" });

  return (
    <div>
      <h1 className="text-3xl font-bold">{t("dashboard")}</h1>
      <p className="mt-2 text-muted-foreground">Admin panel — moderation queue and operations management coming in Phase 5.</p>
    </div>
  );
}
