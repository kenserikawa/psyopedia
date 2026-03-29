import { useTranslations } from "next-intl";

interface StatsBarProps {
  stats: { operationCount: number; eraCount: number; sourceCount: number };
}

export function StatsBar({ stats }: StatsBarProps) {
  const t = useTranslations("home.stats");

  const items = [
    { value: stats.operationCount, label: t("operations") },
    { value: stats.eraCount, label: t("eras") },
    { value: stats.sourceCount, label: t("sources") },
  ];

  return (
    <section className="border-y bg-muted/50 py-8">
      <div className="container mx-auto flex justify-center gap-12 px-4">
        {items.map((item) => (
          <div key={item.label} className="text-center">
            <div className="text-3xl font-bold">{item.value}</div>
            <div className="text-sm text-muted-foreground">{item.label}</div>
          </div>
        ))}
      </div>
    </section>
  );
}
