import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { getHomepageData } from "@/lib/content";
import { ogImageUrl, pageUrl } from "@/lib/site";
import { HeroSection } from "@/components/home/HeroSection";
import { StatsBar } from "@/components/home/StatsBar";
import { FeaturedGrid } from "@/components/home/FeaturedGrid";

interface Props {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "home" });
  const image = ogImageUrl(locale);

  return {
    description: t("subtitle"),
    openGraph: {
      type: "website",
      siteName: "Psyopedia",
      title: "Psyopedia",
      description: t("subtitle"),
      url: pageUrl(`/${locale}`),
      locale: locale === "es" ? "es_ES" : "en_US",
      images: [image],
    },
    twitter: {
      card: "summary_large_image",
      title: "Psyopedia",
      description: t("subtitle"),
      images: [image],
    },
    alternates: {
      canonical: pageUrl(`/${locale}`),
      languages: {
        en: pageUrl("/en"),
        es: pageUrl("/es"),
      },
    },
  };
}

export default async function HomePage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const { featuredOperations, stats } = getHomepageData();

  return (
    <>
      <HeroSection locale={locale} />
      <StatsBar stats={stats} />
      <FeaturedGrid operations={featuredOperations} locale={locale} />
    </>
  );
}
