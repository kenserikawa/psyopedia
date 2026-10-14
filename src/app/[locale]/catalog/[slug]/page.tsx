import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { getAllOperationSlugs, getOperationForLocale } from "@/lib/content";
import { OperationHeader } from "@/components/operation/OperationHeader";
import { OperationBody } from "@/components/operation/OperationBody";
import { SourcesList } from "@/components/operation/SourcesList";
import { RelatedOps } from "@/components/operation/RelatedOps";
import { ShareButtons } from "@/components/operation/ShareButtons";
import { generateOperationMetadata, generateOperationJsonLd, operationUrl } from "@/lib/seo";

interface Props {
  params: Promise<{ locale: string; slug: string }>;
}

export const dynamicParams = false;

export function generateStaticParams({ params }: { params: { locale: string } }) {
  return getAllOperationSlugs().map((op) => ({ slug: params.locale === "es" ? op.slugEs : op.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, slug } = await params;
  const operation = getOperationForLocale(locale, slug);

  if (!operation) {
    return { title: "Not Found" };
  }

  return generateOperationMetadata(operation, locale);
}

export default async function OperationDetailPage({ params }: Props) {
  const { locale, slug } = await params;
  setRequestLocale(locale);
  const operation = getOperationForLocale(locale, slug);

  if (!operation) {
    notFound();
  }

  const tOp = await getTranslations({ locale, namespace: "operation" });

  const bodyContent = locale === "es" ? operation.bodyEs : operation.bodyEn;

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(generateOperationJsonLd(operation, locale)).replace(/</g, "\\u003c"),
        }}
      />

      {/* Header */}
      <OperationHeader operation={operation} locale={locale} />

      {/* Share */}
      <div className="mt-6">
        <ShareButtons
          url={operationUrl(operation, locale)}
          title={locale === "es" ? operation.titleEs : operation.title}
        />
      </div>

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
      {operation.relatedOps.length > 0 && (
        <>
          <Separator className="my-6" />
          <RelatedOps operations={operation.relatedOps} locale={locale} />
        </>
      )}
    </div>
  );
}
