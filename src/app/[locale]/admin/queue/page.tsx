import { getTranslations } from "next-intl/server";
import type { Metadata } from "next";
import Link from "next/link";
import { getPendingContributions } from "@/lib/queries";
import { ModerationQueue } from "@/components/admin/ModerationQueue";
import { buttonVariants } from "@/components/ui/button";

interface Props {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "admin" });
  return { title: t("queue") };
}

export default async function ModerationQueuePage({ params }: Props) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "admin" });
  const contributions = await getPendingContributions();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">{t("queue")}</h1>
          <p className="mt-1 text-muted-foreground">
            {t("pendingCount", { count: contributions.length })}
          </p>
        </div>
        <Link
          href={`/${locale}/admin`}
          className={buttonVariants({ variant: "outline" })}
        >
          Back to Dashboard
        </Link>
      </div>

      <ModerationQueue
        contributions={contributions.map((c) => ({
          id: c.id,
          type: c.type,
          status: c.status,
          createdAt: c.createdAt,
          proposedData: c.proposedData,
          reviewNote: c.reviewNote ?? null,
          submittedBy: {
            name: c.submittedBy.name ?? null,
            email: c.submittedBy.email ?? null,
          },
          operation: c.operation
            ? { title: c.operation.title, slug: c.operation.slug }
            : null,
        }))}
        approveLabel={t("approve")}
        rejectLabel={t("reject")}
      />
    </div>
  );
}
