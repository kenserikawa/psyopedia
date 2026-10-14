"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { Menu, X } from "lucide-react";

export function MobileNav({ locale }: { locale: string }) {
  const t = useTranslations("nav");
  const [open, setOpen] = useState(false);

  const links = [
    { href: `/${locale}/catalog`, label: t("catalog") },
    { href: `/${locale}/iceberg`, label: t("iceberg"), icon: true },
  ];

  return (
    <div className="md:hidden">
      <button
        type="button"
        aria-label={open ? t("closeMenu") : t("openMenu")}
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:text-foreground transition-colors"
      >
        {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </button>

      {open && (
        <div className="absolute left-0 right-0 top-14 z-50 border-b bg-background shadow-md">
          <nav className="container mx-auto flex flex-col px-4 py-2">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className="flex items-center gap-2 border-b py-3 text-sm text-muted-foreground last:border-b-0 hover:text-foreground transition-colors"
              >
                {link.icon && (
                  <Image
                    src="/iceberg-emoji.png"
                    alt=""
                    width={18}
                    height={18}
                    style={{ width: 18, height: "auto" }}
                  />
                )}
                {link.label}
              </Link>
            ))}
          </nav>
        </div>
      )}
    </div>
  );
}
