import type { ReactNode } from "react";
import { useTranslations } from "next-intl";

/** Maquetación compartida por el HTML estático (servidor) y el catálogo filtrado (cliente). */
export function CatalogLayout({ filters, results }: { filters: ReactNode; results: ReactNode }) {
  const t = useTranslations("catalog");

  return (
    <div className="flex flex-col gap-8 md:flex-row">
      <details className="rounded-md border p-4 md:hidden">
        <summary className="cursor-pointer font-semibold">{t("filters.title")}</summary>
        <div className="mt-4">{filters}</div>
      </details>
      <div className="hidden w-64 shrink-0 md:block">{filters}</div>
      <main className="min-w-0 flex-1">{results}</main>
    </div>
  );
}
