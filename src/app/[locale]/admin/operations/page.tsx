import { getTranslations } from "next-intl/server";
import type { Metadata } from "next";
import Link from "next/link";
import { getAllOperationsAdmin } from "@/lib/queries";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";

interface Props {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "admin" });
  return { title: t("operations") };
}

function moderationBadgeVariant(status: string) {
  switch (status) {
    case "APPROVED":
      return "default" as const;
    case "PENDING":
      return "secondary" as const;
    case "REJECTED":
      return "destructive" as const;
    default:
      return "outline" as const;
  }
}

export default async function AdminOperationsPage({ params }: Props) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "admin" });
  const operations = await getAllOperationsAdmin();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">{t("operations")}</h1>
          <p className="mt-1 text-muted-foreground">
            {operations.length} total operations
          </p>
        </div>
        <Link
          href={`/${locale}/admin`}
          className={buttonVariants({ variant: "outline" })}
        >
          Back to Dashboard
        </Link>
      </div>

      <div className="rounded-lg border overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="px-4 py-3 text-left font-medium">Title</th>
              <th className="px-4 py-3 text-left font-medium hidden sm:table-cell">
                Era
              </th>
              <th className="px-4 py-3 text-center font-medium hidden md:table-cell">
                Level
              </th>
              <th className="px-4 py-3 text-left font-medium hidden lg:table-cell">
                Status
              </th>
              <th className="px-4 py-3 text-center font-medium hidden lg:table-cell">
                Views
              </th>
              <th className="px-4 py-3 text-left font-medium hidden xl:table-cell">
                Created
              </th>
              <th className="px-4 py-3 text-right font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {operations.length === 0 && (
              <tr>
                <td
                  colSpan={7}
                  className="px-4 py-8 text-center text-muted-foreground"
                >
                  No operations found.
                </td>
              </tr>
            )}
            {operations.map((op) => (
              <tr key={op.id} className="border-b last:border-0 hover:bg-muted/30">
                <td className="px-4 py-3 font-medium">
                  <div className="flex items-center gap-2">
                    {op.title}
                    <Badge
                      variant={moderationBadgeVariant(op.moderationStatus)}
                      className="text-xs hidden sm:inline-flex"
                    >
                      {op.moderationStatus}
                    </Badge>
                  </div>
                </td>
                <td className="px-4 py-3 text-muted-foreground hidden sm:table-cell">
                  {op.era}
                </td>
                <td className="px-4 py-3 text-center hidden md:table-cell">
                  <Badge variant="outline">{op.icebergLevel}</Badge>
                </td>
                <td className="px-4 py-3 text-muted-foreground hidden lg:table-cell">
                  {op.status}
                </td>
                <td className="px-4 py-3 text-center text-muted-foreground hidden lg:table-cell">
                  {op.viewCount}
                </td>
                <td className="px-4 py-3 text-muted-foreground hidden xl:table-cell">
                  {new Date(op.createdAt).toLocaleDateString()}
                </td>
                <td className="px-4 py-3 text-right">
                  <Link
                    href={`/${locale}/operation/${op.slug}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={buttonVariants({ variant: "ghost", size: "sm" })}
                  >
                    View
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
