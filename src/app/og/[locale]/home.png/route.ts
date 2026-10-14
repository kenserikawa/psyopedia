import { routing } from "@/i18n/routing";
import { homeImage } from "@/lib/og";

export const dynamicParams = false;

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function GET(_request: Request, { params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  return homeImage(locale);
}
