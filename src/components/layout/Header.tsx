import Image from "next/image";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { MobileNav } from "@/components/layout/MobileNav";

export function Header({ locale }: { locale: string }) {
  const t = useTranslations("nav");
  const otherLocale = locale === "en" ? "es" : "en";

  return (
    <header className="relative border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-14 items-center justify-between px-4">
        <Link href={`/${locale}`} className="flex items-center gap-2 text-xl font-bold">
          <Image src="/logo.png" alt="Psyopedia" width={32} height={32} style={{ width: 32, height: 'auto' }} />
          Psyopedia
        </Link>
        <nav className="flex items-center gap-6 text-sm">
          <Link href={`/${locale}/catalog`} className="hidden md:inline text-muted-foreground hover:text-foreground transition-colors">
            {t("catalog")}
          </Link>
          <Link href={`/${locale}/iceberg`} className="hidden md:inline text-muted-foreground hover:text-foreground transition-colors">
            <Image src="/iceberg-emoji.png" alt={t("iceberg")} width={22} height={22} className="inline" style={{ width: 22, height: 'auto' }} />
          </Link>
          <Link
            href={`/${otherLocale}`}
            className="rounded-md border px-2 py-1 text-xs font-medium uppercase hover:bg-accent transition-colors"
          >
            {otherLocale}
          </Link>
          <MobileNav locale={locale} />
        </nav>
      </div>
    </header>
  );
}
