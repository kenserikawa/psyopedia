import type { MetadataRoute } from "next";
import { getAllOperationSlugs } from "@/lib/queries";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://psyopedia.org";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const operations = await getAllOperationSlugs();

  const staticPages = ["", "/catalog", "/iceberg"].flatMap((path) =>
    ["en", "es"].map((locale) => ({
      url: `${SITE_URL}/${locale}${path}`,
      lastModified: new Date(),
      changeFrequency: "weekly" as const,
      priority: path === "" ? 1.0 : 0.8,
    }))
  );

  const operationPages = operations.flatMap((op) => [
    {
      url: `${SITE_URL}/en/catalog/${op.slug}`,
      lastModified: new Date(),
      changeFrequency: "monthly" as const,
      priority: 0.6,
    },
    {
      url: `${SITE_URL}/es/catalog/${op.slugEs}`,
      lastModified: new Date(),
      changeFrequency: "monthly" as const,
      priority: 0.6,
    },
  ]);

  return [...staticPages, ...operationPages];
}
