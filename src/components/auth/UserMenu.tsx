"use client";

import { useSession, signOut } from "next-auth/react";
import Link from "next/link";
import Image from "next/image";

interface UserMenuProps {
  locale: string;
}

export function UserMenu({ locale }: UserMenuProps) {
  const { data: session, status } = useSession();

  if (status === "loading") {
    return (
      <div className="h-8 w-8 rounded-full bg-muted animate-pulse" />
    );
  }

  if (!session) {
    return (
      <Link
        href="/api/auth/signin"
        className="rounded-md border px-3 py-1.5 text-xs font-medium hover:bg-accent transition-colors"
      >
        Sign In
      </Link>
    );
  }

  const isModOrAdmin =
    session.user.role === "MODERATOR" || session.user.role === "ADMIN";

  return (
    <div className="flex items-center gap-3">
      {isModOrAdmin && (
        <Link
          href={`/${locale}/admin`}
          className="rounded-md border px-3 py-1.5 text-xs font-medium hover:bg-accent transition-colors"
        >
          Admin
        </Link>
      )}
      <span className="hidden text-sm text-muted-foreground sm:block">
        {session.user.name ?? session.user.email}
      </span>
      {session.user.image ? (
        <Image
          src={session.user.image}
          alt={session.user.name ?? "User avatar"}
          width={32}
          height={32}
          className="rounded-full"
        />
      ) : (
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-medium">
          {(session.user.name ?? session.user.email ?? "U")[0].toUpperCase()}
        </div>
      )}
      <button
        onClick={() => signOut()}
        className="rounded-md border px-3 py-1.5 text-xs font-medium hover:bg-accent transition-colors"
      >
        Sign Out
      </button>
    </div>
  );
}
