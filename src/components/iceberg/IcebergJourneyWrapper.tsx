"use client";

import dynamic from "next/dynamic";
import type { IcebergOperation } from "./OperationDot";

const IcebergJourney = dynamic(() => import("./IcebergJourney"), {
  ssr: false,
  loading: () => <div className="h-screen bg-[#0a1628]" />,
});

interface Props {
  operations: IcebergOperation[];
  locale: string;
}

export default function IcebergJourneyWrapper({ operations, locale }: Props) {
  return <IcebergJourney operations={operations} locale={locale} />;
}
