import Image from "next/image";
import Link from "next/link";
import { useTranslations } from "next-intl";

export function HeroSection({ locale }: { locale: string }) {
  const t = useTranslations("home");

  return (
    <section className="flex flex-col items-center justify-center gap-6 py-20 text-center">
      <Image src="/logo.png" alt="Psyopedia" width={120} height={120} priority />
      <h1 className="text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
        {t("title")}
      </h1>
      <p className="max-w-2xl text-lg text-muted-foreground">
        {t("subtitle")}
      </p>
      <div className="flex gap-4">
        <Link
          href={`/${locale}/catalog`}
          className="inline-flex h-10 items-center rounded-md bg-primary px-6 text-sm font-medium text-primary-foreground shadow hover:bg-primary/90 transition-colors"
        >
          {t("exploreCatalog")}
        </Link>
        <Link
          href={`/${locale}/iceberg`}
          className="inline-flex h-10 items-center rounded-md border border-input bg-background px-6 text-sm font-medium shadow-sm hover:bg-accent transition-colors"
        >
          {t("viewIceberg")}
        </Link>
      </div>
    </section>
  );
}
