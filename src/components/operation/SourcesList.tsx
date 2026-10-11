import { useTranslations } from "next-intl";
import { Badge } from "@/components/ui/badge";
import type { Source } from "@/generated/prisma/client";

const credibilityConfig: Record<
  number,
  { label: string; className: string }
> = {
  1: { label: "Very Low", className: "bg-red-100 text-red-800" },
  2: { label: "Low", className: "bg-orange-100 text-orange-800" },
  3: { label: "Medium", className: "bg-yellow-100 text-yellow-800" },
  4: { label: "High", className: "bg-green-100 text-green-800" },
  5: { label: "Very High", className: "bg-emerald-100 text-emerald-800" },
};

interface SourcesListProps {
  sources: Source[];
}

const sourceTypeLabels: Record<string, string> = {
  GOVERNMENT: "Government",
  ACADEMIC: "Academic",
  JOURNALISM: "Journalism",
  BOOK: "Book",
  LEAKED_DOC: "Leaked Document",
  VIDEO: "Video",
  WEBSITE: "Website",
};

export function SourcesList({ sources }: SourcesListProps) {
  const tOp = useTranslations("operation");

  if (sources.length === 0) return null;

  return (
    <section>
      <h2 className="mb-4 text-xl font-semibold">{tOp("sources")}</h2>
      <ul className="space-y-3">
        {sources.map((source) => {
          const cred = credibilityConfig[source.credibility];
          return (
            <li
              key={source.id}
              className="flex flex-col gap-1 rounded-md border p-3"
            >
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="outline" className="text-xs">
                  {sourceTypeLabels[source.type] ?? source.type}
                </Badge>
                {cred && (
                  <Badge variant="outline" className={`text-xs ${cred.className}`}>
                    {cred.label}
                  </Badge>
                )}
              </div>
              {source.url ? (
                <a
                  href={source.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm font-medium text-blue-600 hover:underline dark:text-blue-400"
                >
                  {source.title}
                </a>
              ) : (
                <span className="text-sm font-medium">{source.title}</span>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
