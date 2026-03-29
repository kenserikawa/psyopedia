import { useTranslations } from "next-intl";

export function Footer() {
  const t = useTranslations("seo");

  return (
    <footer className="border-t py-6 text-center text-sm text-muted-foreground">
      <div className="container mx-auto px-4">
        <p>&copy; {new Date().getFullYear()} {t("siteName")}. {t("siteDescription")}</p>
      </div>
    </footer>
  );
}
