import { useTranslations } from "next-intl";
import { Badge } from "@/components/ui/badge";
import type { Operation } from "@/generated/prisma";

const levelColors: Record<number, string> = {
  1: "bg-sky-100 text-sky-800",
  2: "bg-blue-100 text-blue-800",
  3: "bg-indigo-100 text-indigo-800",
  4: "bg-violet-100 text-violet-800",
  5: "bg-purple-100 text-purple-900",
};

interface OperationHeaderProps {
  operation: Operation;
  locale: string;
}

export function OperationHeader({ operation, locale }: OperationHeaderProps) {
  const t = useTranslations("enums");
  const tOp = useTranslations("operation");

  const title = locale === "es" ? operation.titleEs : operation.title;

  return (
    <header className="space-y-4">
      {/* Badges row */}
      <div className="flex flex-wrap items-center gap-2">
        <Badge
          variant="outline"
          className={levelColors[operation.icebergLevel] ?? ""}
        >
          {tOp("icebergLevel", { level: operation.icebergLevel })}
        </Badge>
        <Badge variant="secondary">{t(`era.${operation.era}`)}</Badge>
        <Badge variant="outline">{t(`status.${operation.status}`)}</Badge>
        <Badge variant="outline">{t(`outcome.${operation.outcome}`)}</Badge>
      </div>

      {/* Title */}
      <h1 className="text-3xl font-bold tracking-tight leading-tight">
        {title}
      </h1>

      {/* Aliases */}
      {operation.aliases.length > 0 && (
        <p className="text-sm text-muted-foreground">
          {operation.aliases.join(" · ")}
        </p>
      )}

      {/* Type badges */}
      {operation.types.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {operation.types.map((type) => (
            <Badge key={type} variant="secondary" className="text-xs">
              {t(`type.${type}`)}
            </Badge>
          ))}
        </div>
      )}

      {/* Actors + targets */}
      <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
        {operation.actors.length > 0 && (
          <span>
            <span className="font-medium text-foreground">Actors: </span>
            {operation.actors.join(", ")}
          </span>
        )}
        {operation.targets.length > 0 && (
          <span>
            <span className="font-medium text-foreground">Targets: </span>
            {operation.targets.join(", ")}
          </span>
        )}
      </div>

      {/* View count */}
      <p className="text-xs text-muted-foreground">
        {tOp("viewCount", { count: operation.viewCount })}
      </p>
    </header>
  );
}
