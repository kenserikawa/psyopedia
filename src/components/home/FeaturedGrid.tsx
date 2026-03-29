import { useTranslations } from "next-intl";
import { OperationCard } from "@/components/catalog/OperationCard";
import type { Operation, Tag } from "@/generated/prisma";

interface FeaturedGridProps {
  operations: (Operation & { tags: Tag[] })[];
  locale: string;
}

export function FeaturedGrid({ operations, locale }: FeaturedGridProps) {
  const t = useTranslations("home");

  return (
    <section className="container mx-auto px-4 py-12">
      <h2 className="mb-6 text-2xl font-bold">{t("featured")}</h2>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {operations.map((op) => (
          <OperationCard key={op.id} operation={op} locale={locale} />
        ))}
      </div>
    </section>
  );
}
