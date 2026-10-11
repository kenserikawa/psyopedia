import { useTranslations } from "next-intl";
import { OperationCard } from "./OperationCard";
import type { OperationSummary } from "@/lib/catalog";

interface OperationGridProps {
  operations: OperationSummary[];
  locale: string;
  totalCount?: number;
  queryString?: string;
}

export function OperationGrid({ operations, locale, totalCount, queryString }: OperationGridProps) {
  const t = useTranslations("catalog");

  if (operations.length === 0) {
    return (
      <div className="py-12 text-center text-muted-foreground">
        {t("noResults")}
      </div>
    );
  }

  return (
    <div>
      <p className="mb-4 text-sm text-muted-foreground">
        {t("resultsCount", { count: totalCount ?? operations.length })}
      </p>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {operations.map((op) => (
          <OperationCard key={op.id} operation={op} locale={locale} queryString={queryString} />
        ))}
      </div>
    </div>
  );
}
