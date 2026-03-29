import type { Operation } from "@/generated/prisma";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://psyopedia.org";

export function generateOperationJsonLd(operation: Operation, locale: string) {
  const title = locale === "es" ? operation.titleEs : operation.title;
  const description = locale === "es" ? operation.excerptEs : operation.excerpt;
  const slug = locale === "es" ? operation.slugEs : operation.slug;

  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: title,
    description,
    url: `${SITE_URL}/${locale}/catalog/${slug}`,
    datePublished: operation.createdAt,
    dateModified: operation.updatedAt,
    author: {
      "@type": "Organization",
      name: "Psyopedia",
    },
    publisher: {
      "@type": "Organization",
      name: "Psyopedia",
      url: SITE_URL,
    },
    inLanguage: locale === "es" ? "es" : "en",
    about: operation.types.map((t) => ({
      "@type": "Thing",
      name: t.replace("_", " "),
    })),
  };
}

export function generateOperationMetadata(operation: Operation, locale: string) {
  const title = locale === "es" ? operation.titleEs : operation.title;
  const description = locale === "es" ? operation.excerptEs : operation.excerpt;
  const slug = locale === "es" ? operation.slugEs : operation.slug;

  return {
    title,
    description,
    openGraph: {
      title: `${title} | Psyopedia`,
      description,
      type: "article" as const,
      url: `${SITE_URL}/${locale}/catalog/${slug}`,
      images: [`${SITE_URL}/api/og/${operation.slug}`],
    },
    twitter: {
      card: "summary_large_image" as const,
      title: `${title} | Psyopedia`,
      description,
    },
    alternates: {
      canonical: `${SITE_URL}/${locale}/catalog/${slug}`,
      languages: {
        en: `${SITE_URL}/en/catalog/${operation.slug}`,
        es: `${SITE_URL}/es/catalog/${operation.slugEs}`,
      },
    },
  };
}
