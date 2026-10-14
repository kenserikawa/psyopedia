import { routing } from "@/i18n/routing";
import { getAllOperationSlugs, getOperationForLocale } from "@/lib/content";
import { operationImage } from "@/lib/og";

export const dynamicParams = false;

// Una carpeta propia evita que una operación con slug "home" pise la imagen de la home.
export function generateStaticParams() {
  return routing.locales.flatMap((locale) =>
    getAllOperationSlugs().map((op) => ({ locale, file: `${locale === "es" ? op.slugEs : op.slug}.png` })),
  );
}

export async function GET(_request: Request, { params }: { params: Promise<{ locale: string; file: string }> }) {
  const { locale, file } = await params;
  const operation = getOperationForLocale(locale, file.replace(/\.png$/, ""));
  if (!operation) return new Response("Not found", { status: 404 });
  return operationImage(operation, locale);
}
