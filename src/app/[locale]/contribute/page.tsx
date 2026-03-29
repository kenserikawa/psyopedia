import { getTranslations } from "next-intl/server";
import { auth } from "@/lib/auth";
import type { Metadata } from "next";

interface Props {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "contribute" });
  return { title: t("title") };
}

export default async function ContributePage({ params }: Props) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "contribute" });
  const session = await auth();

  if (!session?.user) {
    return (
      <div className="container mx-auto px-4 py-20 text-center">
        <h1 className="text-3xl font-bold">{t("title")}</h1>
        <p className="mt-4 text-lg text-muted-foreground">{t("loginRequired")}</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold">{t("title")}</h1>
      <p className="mt-2 text-muted-foreground">{t("subtitle")}</p>
      <p className="mt-8 text-muted-foreground">Contribution form coming in Phase 5.</p>
    </div>
  );
}
