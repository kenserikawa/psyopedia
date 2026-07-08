"use client";

import { useEffect } from "react";
import { useTranslations } from "next-intl";

export default function LocaleError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const t = useTranslations("errors");

  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="container mx-auto flex min-h-[60vh] flex-col items-center justify-center gap-4 px-4 text-center">
      <h1 className="text-3xl font-bold">{t("errorTitle")}</h1>
      <p className="max-w-md text-muted-foreground">{t("errorDescription")}</p>
      <button
        onClick={reset}
        className="mt-4 rounded-md border px-4 py-2 text-sm transition-colors hover:bg-accent"
      >
        {t("retry")}
      </button>
    </div>
  );
}
