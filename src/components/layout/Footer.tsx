import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";

export function Footer() {
  const t = useTranslations("seo");
  const tFooter = useTranslations("footer");
  const locale = useLocale();

  return (
    <footer className="border-t py-6 text-center text-sm text-muted-foreground">
      <div className="container mx-auto flex flex-col items-center gap-2 px-4">
        <p>&copy; {new Date().getFullYear()} {t("siteName")}. {t("siteDescription")}</p>
        <nav className="flex gap-4">
          <Link href={`/${locale}/legal/privacy`} className="transition-colors hover:text-foreground">
            {tFooter("privacy")}
          </Link>
          <Link href={`/${locale}/legal/terms`} className="transition-colors hover:text-foreground">
            {tFooter("terms")}
          </Link>
        </nav>
      </div>
    </footer>
  );
}
