import Link from "next/link";
import { useTranslations } from "next-intl";
import { UserMenu } from "@/components/auth/UserMenu";

export function Header({ locale }: { locale: string }) {
  const t = useTranslations("nav");
  const otherLocale = locale === "en" ? "es" : "en";

  return (
    <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-14 items-center justify-between px-4">
        <Link href={`/${locale}`} className="text-xl font-bold">
          Psyopedia
        </Link>
        <nav className="flex items-center gap-6 text-sm">
          <Link href={`/${locale}/catalog`} className="text-muted-foreground hover:text-foreground transition-colors">
            {t("catalog")}
          </Link>
          <Link href={`/${locale}/iceberg`} className="text-muted-foreground hover:text-foreground transition-colors">
            {t("iceberg")}
          </Link>
          <Link href={`/${locale}/contribute`} className="text-muted-foreground hover:text-foreground transition-colors">
            {t("contribute")}
          </Link>
          <Link
            href={`/${otherLocale}`}
            className="rounded-md border px-2 py-1 text-xs font-medium uppercase hover:bg-accent transition-colors"
          >
            {otherLocale}
          </Link>
          <UserMenu locale={locale} />
        </nav>
      </div>
    </header>
  );
}
