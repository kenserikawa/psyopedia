"use client";

import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { useCallback } from "react";

const IcebergScene = dynamic(() => import("./IcebergScene"), {
  ssr: false,
  loading: () => (
    <div className="h-[600px] w-full bg-[#0a1628] animate-pulse rounded-xl flex items-center justify-center">
      <span className="text-blue-400">Loading...</span>
    </div>
  ),
});

interface Props {
  levelStats: {
    level: number;
    count: number;
    featured: string[];
    label: string;
  }[];
  locale: string;
}

export default function IcebergClientWrapper({ levelStats, locale }: Props) {
  const router = useRouter();

  const handleLevelClick = useCallback(
    (level: number) => {
      router.push(`/${locale}/catalog?level=${level}`);
    },
    [router, locale]
  );

  return (
    <IcebergScene
      levelStats={levelStats}
      onLevelClick={handleLevelClick}
      height={600}
    />
  );
}
