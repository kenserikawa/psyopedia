import type { Operation } from "@/lib/content/types";
import { ogImageUrl, pageUrl } from "@/lib/site";

function localized(operation: Operation, locale: string) {
  const es = locale === "es";
  return {
    title: es ? operation.titleEs : operation.title,
    description: es ? operation.excerptEs : operation.excerpt,
    slug: es ? operation.slugEs : operation.slug,
  };
}

/** URL canónica de la ficha en el idioma dado. */
export function operationUrl(operation: Pick<Operation, "slug" | "slugEs">, locale: string): string {
  return pageUrl(`/${locale}/catalog/${locale === "es" ? operation.slugEs : operation.slug}`);
}

export function generateOperationJsonLd(operation: Operation, locale: string) {
  const { title, description } = localized(operation, locale);

  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: title,
    description,
    url: operationUrl(operation, locale),
    datePublished: operation.publishedAt,
    dateModified: operation.updatedAt,
    author: {
      "@type": "Organization",
      name: "Psyopedia",
    },
    publisher: {
      "@type": "Organization",
      name: "Psyopedia",
      url: pageUrl("/"),
    },
    inLanguage: locale === "es" ? "es" : "en",
    about: operation.types.map((t) => ({
      "@type": "Thing",
      name: t.replace("_", " "),
    })),
  };
}

export function generateOperationMetadata(operation: Operation, locale: string) {
  const { title, description, slug } = localized(operation, locale);
  const url = operationUrl(operation, locale);
  const image = ogImageUrl(locale, slug);

  return {
    title,
    description,
    openGraph: {
      title: `${title} | Psyopedia`,
      description,
      type: "article" as const,
      url,
      images: [image],
    },
    twitter: {
      card: "summary_large_image" as const,
      title: `${title} | Psyopedia`,
      description,
      images: [image],
    },
    alternates: {
      canonical: url,
      languages: {
        en: operationUrl(operation, "en"),
        es: operationUrl(operation, "es"),
      },
    },
  };
}
