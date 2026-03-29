"use client";

import dynamic from "next/dynamic";
import type { IcebergOperation } from "./IcebergScene";

const IcebergScene = dynamic(() => import("./IcebergScene"), {
  ssr: false,
  loading: () => (
    <div className="h-[650px] w-full bg-[#070f1e] animate-pulse rounded-xl flex items-center justify-center">
      <span className="text-blue-400">Loading...</span>
    </div>
  ),
});

interface Props {
  operations: IcebergOperation[];
  locale: string;
}

export default function IcebergClientWrapper({ operations, locale }: Props) {
  return (
    <IcebergScene
      operations={operations}
      locale={locale}
      height={650}
    />
  );
}
