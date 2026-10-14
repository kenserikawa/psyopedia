import type { MetadataRoute } from "next";
import { getCatalogSummaries } from "@/lib/content";
import { pageUrl } from "@/lib/site";

export const dynamic = "force-static";

export default function sitemap(): MetadataRoute.Sitemap {
  const staticPages = ["", "/catalog", "/iceberg", "/legal/privacy", "/legal/terms"].flatMap((path) =>
    ["en", "es"].map((locale) => ({
      url: pageUrl(`/${locale}${path}`),
      changeFrequency: "weekly" as const,
      priority: path === "" ? 1.0 : 0.8,
    }))
  );

  const operationPages = getCatalogSummaries().flatMap((op) => [
    {
      url: pageUrl(`/en/catalog/${op.slug}`),
      lastModified: op.updatedAt,
      changeFrequency: "monthly" as const,
      priority: 0.6,
    },
    {
      url: pageUrl(`/es/catalog/${op.slugEs}`),
      lastModified: op.updatedAt,
      changeFrequency: "monthly" as const,
      priority: 0.6,
    },
  ]);

  return [...staticPages, ...operationPages];
}
