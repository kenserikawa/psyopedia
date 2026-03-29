import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import type { Metadata } from "next";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { getOperationBySlug, getOperationBySlugEs, getApprovedComments } from "@/lib/queries";
import { OperationHeader } from "@/components/operation/OperationHeader";
import { OperationBody } from "@/components/operation/OperationBody";
import { SourcesList } from "@/components/operation/SourcesList";
import { RelatedOps } from "@/components/operation/RelatedOps";
import { CommentSection } from "@/components/operation/CommentSection";

interface Props {
  params: Promise<{ locale: string; slug: string }>;
}

async function fetchOperation(locale: string, slug: string) {
  try {
    if (locale === "es") {
      return await getOperationBySlugEs(slug);
    }
    return await getOperationBySlug(slug);
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, slug } = await params;
  const operation = await fetchOperation(locale, slug);

  if (!operation) {
    return { title: "Not Found" };
  }

  const tSeo = await getTranslations({ locale, namespace: "seo" });
  const title = locale === "es" ? operation.titleEs : operation.title;
  const description = locale === "es" ? operation.excerptEs : operation.excerpt;

  const enSlug = operation.slug;
  const esSlug = operation.slugEs;

  return {
    title: `${title} | ${tSeo("siteName")}`,
    description,
    openGraph: {
      title,
      description,
      siteName: tSeo("siteName"),
      locale: locale === "es" ? "es_ES" : "en_US",
    },
    alternates: {
      canonical: `/${locale}/catalog/${slug}`,
      languages: {
        en: `/en/catalog/${enSlug}`,
        es: `/es/catalog/${esSlug}`,
      },
    },
  };
}

export default async function OperationDetailPage({ params }: Props) {
  const { locale, slug } = await params;
  const operation = await fetchOperation(locale, slug);

  if (!operation) {
    notFound();
  }

  const tOp = await getTranslations({ locale, namespace: "operation" });

  const bodyContent = locale === "es" ? operation.bodyEs : operation.bodyEn;
  const relatedOps = operation.relatedOps ?? [];
  const comments = await getApprovedComments(operation.id);

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* Header */}
      <OperationHeader operation={operation} locale={locale} />

      <Separator className="my-6" />

      {/* Tags */}
      {operation.tags.length > 0 && (
        <>
          <section>
            <h2 className="mb-3 text-base font-semibold">{tOp("tags")}</h2>
            <div className="flex flex-wrap gap-2">
              {operation.tags.map((tag) => (
                <Badge key={tag.id} variant="outline">
                  {locale === "es" ? tag.nameEs : tag.name}
                </Badge>
              ))}
            </div>
          </section>
          <Separator className="my-6" />
        </>
      )}

      {/* Body */}
      <OperationBody content={bodyContent} />

      {/* Sources */}
      {operation.sources.length > 0 && (
        <>
          <Separator className="my-6" />
          <SourcesList sources={operation.sources} />
        </>
      )}

      {/* Related operations */}
      {relatedOps.length > 0 && (
        <>
          <Separator className="my-6" />
          <RelatedOps operations={relatedOps} locale={locale} />
        </>
      )}

      {/* Comments */}
      <Separator className="my-6" />
      <CommentSection
        operationId={operation.id}
        comments={comments.map((c) => ({
          id: c.id,
          body: c.body,
          author: { name: c.author.name ?? null },
          createdAt: c.createdAt,
          status: c.status,
        }))}
        locale={locale}
      />
    </div>
  );
}
