import { useTranslations } from "next-intl";
import { OperationCard } from "@/components/catalog/OperationCard";
import type { OperationSummary } from "@/lib/content/types";

interface RelatedOpsProps {
  operations: OperationSummary[];
  locale: string;
}

export function RelatedOps({ operations, locale }: RelatedOpsProps) {
  const tOp = useTranslations("operation");

  if (operations.length === 0) return null;

  return (
    <section>
      <h2 className="mb-4 text-xl font-semibold">{tOp("relatedOps")}</h2>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {operations.map((op) => (
          <OperationCard key={op.id} operation={op} locale={locale} />
        ))}
      </div>
    </section>
  );
}
