import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { getHomepageData } from "@/lib/queries";
import { SITE_URL } from "@/lib/seo";
import { HeroSection } from "@/components/home/HeroSection";
import { StatsBar } from "@/components/home/StatsBar";
import { FeaturedGrid } from "@/components/home/FeaturedGrid";

interface Props {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "home" });

  return {
    description: t("subtitle"),
    openGraph: {
      type: "website",
      siteName: "Psyopedia",
      title: "Psyopedia",
      description: t("subtitle"),
      url: `${SITE_URL}/${locale}`,
      locale: locale === "es" ? "es_ES" : "en_US",
    },
    twitter: {
      card: "summary_large_image",
      title: "Psyopedia",
      description: t("subtitle"),
    },
    alternates: {
      canonical: `${SITE_URL}/${locale}`,
      languages: {
        en: `${SITE_URL}/en`,
        es: `${SITE_URL}/es`,
      },
    },
  };
}

export default async function HomePage({ params }: Props) {
  const { locale } = await params;
  const { featuredOperations, stats } = await getHomepageData();

  return (
    <>
      <HeroSection locale={locale} />
      <StatsBar stats={stats} />
      <FeaturedGrid operations={featuredOperations} locale={locale} />
    </>
  );
}
