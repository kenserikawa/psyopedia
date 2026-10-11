import Link from "next/link";
import { useTranslations } from "next-intl";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { OperationSummary } from "@/lib/catalog";

interface OperationCardProps {
  operation: OperationSummary;
  locale: string;
  queryString?: string;
}

const levelColors: Record<number, string> = {
  1: "bg-sky-100 text-sky-800",
  2: "bg-blue-100 text-blue-800",
  3: "bg-indigo-100 text-indigo-800",
  4: "bg-violet-100 text-violet-800",
  5: "bg-purple-100 text-purple-900",
};

export function OperationCard({ operation, locale, queryString }: OperationCardProps) {
  const t = useTranslations("enums");
  const tOp = useTranslations("operation");

  const title = locale === "es" ? operation.titleEs : operation.title;
  const excerpt = locale === "es" ? operation.excerptEs : operation.excerpt;
  const slug = locale === "es" ? operation.slugEs : operation.slug;

  return (
    <Link href={`/${locale}/catalog/${slug}${queryString ? `?${queryString}` : ""}`}>
      <Card className="h-full hover:shadow-md transition-shadow">
        <CardHeader className="pb-2">
          <div className="flex items-center gap-2 mb-1">
            <Badge variant="outline" className={levelColors[operation.icebergLevel] || ""}>
              {tOp("icebergLevel", { level: operation.icebergLevel })}
            </Badge>
            <Badge variant="secondary">{t(`era.${operation.era}`)}</Badge>
          </div>
          <CardTitle className="text-lg leading-tight">{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground line-clamp-3">{excerpt}</p>
          <div className="mt-3 flex flex-wrap gap-1">
            {operation.tags.slice(0, 3).map((tag) => (
              <Badge key={tag.id} variant="outline" className="text-xs">
                {locale === "es" ? tag.nameEs : tag.name}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
