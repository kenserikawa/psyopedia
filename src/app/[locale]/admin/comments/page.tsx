import { getTranslations } from "next-intl/server";
import type { Metadata } from "next";
import Link from "next/link";
import { getPendingComments } from "@/lib/queries";
import { CommentModeration } from "@/components/admin/CommentModeration";
import { buttonVariants } from "@/components/ui/button";

interface Props {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "admin" });
  return { title: t("comments") };
}

export default async function CommentModerationPage({ params }: Props) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "admin" });
  const comments = await getPendingComments();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">{t("comments")}</h1>
          <p className="mt-1 text-muted-foreground">
            {t("pendingCount", { count: comments.length })}
          </p>
        </div>
        <Link
          href={`/${locale}/admin`}
          className={buttonVariants({ variant: "outline" })}
        >
          Back to Dashboard
        </Link>
      </div>

      <CommentModeration
        comments={comments.map((c) => ({
          id: c.id,
          body: c.body,
          createdAt: c.createdAt,
          author: { name: c.author.name ?? null },
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
