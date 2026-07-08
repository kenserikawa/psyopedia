import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";

export default function NotFound() {
  const t = useTranslations("errors");
  const locale = useLocale();

  return (
    <div className="container mx-auto flex min-h-[60vh] flex-col items-center justify-center gap-4 px-4 text-center">
      <p className="font-mono text-sm uppercase tracking-widest text-muted-foreground">404</p>
      <h1 className="text-3xl font-bold">{t("notFoundTitle")}</h1>
      <p className="max-w-md text-muted-foreground">{t("notFoundDescription")}</p>
      <Link
        href={`/${locale}`}
        className="mt-4 rounded-md border px-4 py-2 text-sm transition-colors hover:bg-accent"
      >
        {t("backHome")}
      </Link>
    </div>
  );
}
