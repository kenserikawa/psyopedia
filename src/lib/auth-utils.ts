import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";

export async function requireAuth(locale: string) {
  const session = await auth();
  if (!session?.user) {
    redirect(`/${locale}`);
  }
  return session;
}

export async function requireModerator(locale: string) {
  const session = await requireAuth(locale);
  if (session.user.role !== "MODERATOR" && session.user.role !== "ADMIN") {
    redirect(`/${locale}`);
  }
  return session;
}

export async function requireAdmin(locale: string) {
  const session = await requireAuth(locale);
  if (session.user.role !== "ADMIN") {
    redirect(`/${locale}`);
  }
  return session;
}
