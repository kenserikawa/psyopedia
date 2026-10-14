import Image from "next/image";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { asset } from "@/lib/site";

export function HeroSection({ locale }: { locale: string }) {
  const t = useTranslations("home");

  return (
    <section className="container mx-auto px-4 py-16 sm:py-20">
      <div className="flex flex-col items-center gap-8 md:flex-row md:items-center md:justify-center md:gap-12">
        <Image
          src={asset("/lucid-psyduck.png")}
          alt="Psyopedia mascot"
          width={280}
          height={280}
          priority
          className="shrink-0"
          style={{ width: 280, height: 'auto' }}
        />
        <div className="flex flex-col items-center text-center md:items-start md:text-left">
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
            {t("title")}
          </h1>
          <p className="mt-4 max-w-lg text-lg text-muted-foreground">
            {t("subtitle")}
          </p>
          <div className="mt-6 flex gap-4">
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
        </div>
      </div>
    </section>
  );
}
