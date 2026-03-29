import type { ReactNode } from "react";
import { requireModerator } from "@/lib/auth-utils";

interface Props {
  children: ReactNode;
  params: Promise<{ locale: string }>;
}

export default async function AdminLayout({ children, params }: Props) {
  const { locale } = await params;
  await requireModerator(locale);

  return <div className="container mx-auto px-4 py-8">{children}</div>;
}
