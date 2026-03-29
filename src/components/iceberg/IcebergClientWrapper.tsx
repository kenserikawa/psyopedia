"use client";

import dynamic from "next/dynamic";
import type { IcebergOperation } from "./IcebergScene";

const IcebergScene = dynamic(() => import("./IcebergScene"), {
  ssr: false,
  loading: () => (
    <div className="h-[650px] w-full" />
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
