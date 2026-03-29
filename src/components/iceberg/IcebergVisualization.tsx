"use client";

import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";

interface IcebergVisualizationProps {
  data: {
    level: number;
    count: number;
    operations: { title: string; titleEs: string }[];
  }[];
  locale: string;
}

// Zone geometry: each level is a trapezoid defined by [topLeftX, topRightX, bottomLeftX, bottomRightX, topY, bottomY]
const ZONES = [
  // Level 1: triangular tip above waterline
  { level: 1, topY: 20, bottomY: 160, topLeft: 270, topRight: 330, bottomLeft: 200, bottomRight: 400, color: "#E0F2FE", textColor: "#0C4A6E" },
  // Level 2: first underwater band
  { level: 2, topY: 160, bottomY: 300, topLeft: 200, topRight: 400, bottomLeft: 140, bottomRight: 460, color: "#BAE6FD", textColor: "#0C4A6E" },
  // Level 3
  { level: 3, topY: 300, bottomY: 440, topLeft: 140, topRight: 460, bottomLeft: 90, bottomRight: 510, color: "#7DD3FC", textColor: "#0C4A6E" },
  // Level 4
  { level: 4, topY: 440, bottomY: 580, topLeft: 90, topRight: 510, bottomLeft: 50, bottomRight: 550, color: "#38BDF8", textColor: "#082F49" },
  // Level 5: deepest and widest, with rounded bottom
  { level: 5, topY: 580, bottomY: 740, topLeft: 50, topRight: 550, bottomLeft: 30, bottomRight: 570, color: "#0284C7", textColor: "#E0F2FE" },
];

function trapezoidPoints(
  topLeft: number,
  topRight: number,
  bottomLeft: number,
  bottomRight: number,
  topY: number,
  bottomY: number
): string {
  return `${topLeft},${topY} ${topRight},${topY} ${bottomRight},${bottomY} ${bottomLeft},${bottomY}`;
}

export function IcebergVisualization({ data, locale }: IcebergVisualizationProps) {
  const router = useRouter();
  const t = useTranslations("iceberg");

  const dataMap = new Map(data.map((d) => [d.level, d]));

  const handleZoneClick = (level: number) => {
    router.push(`/${locale}/catalog?level=${level}`);
  };

  return (
    <svg
      viewBox="0 0 600 800"
      className="w-full max-w-lg"
      aria-label={t("title")}
      role="img"
    >
      <defs>
        {/* Sky-to-ocean background gradient */}
        <linearGradient id="bgGradient" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#BAE6FD" />
          <stop offset="20%" stopColor="#7DD3FC" />
          <stop offset="40%" stopColor="#0EA5E9" />
          <stop offset="100%" stopColor="#0C4A6E" />
        </linearGradient>
        {/* Subtle iceberg highlight overlay */}
        <linearGradient id="iceHighlight" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="white" stopOpacity="0.15" />
          <stop offset="50%" stopColor="white" stopOpacity="0.05" />
          <stop offset="100%" stopColor="white" stopOpacity="0.15" />
        </linearGradient>
        {/* Clip path to keep zone content inside iceberg bounds */}
        <clipPath id="icebergClip">
          <polygon points="270,20 330,20 570,740 30,740" />
        </clipPath>
      </defs>

      {/* Background */}
      <rect width="600" height="800" fill="url(#bgGradient)" />

      {/* Ocean surface shimmer lines */}
      <line x1="0" y1="155" x2="600" y2="155" stroke="white" strokeOpacity="0.2" strokeWidth="1" />
      <line x1="0" y1="165" x2="600" y2="165" stroke="white" strokeOpacity="0.15" strokeWidth="0.5" />

      {/* Iceberg zones */}
      {ZONES.map((zone) => {
        const zoneData = dataMap.get(zone.level);
        const count = zoneData?.count ?? 0;
        const ops = zoneData?.operations ?? [];
        const midY = (zone.topY + zone.bottomY) / 2;
        const midX = 300;
        const levelKey = String(zone.level) as "1" | "2" | "3" | "4" | "5";
        const levelLabel = t(`levels.${levelKey}`);
        const isAboveWater = zone.level === 1;

        return (
          <g
            key={zone.level}
            onClick={() => handleZoneClick(zone.level)}
            className="cursor-pointer group"
            role="button"
            aria-label={`${levelLabel} — ${count} operations`}
            tabIndex={0}
            onKeyDown={(e) => e.key === "Enter" && handleZoneClick(zone.level)}
          >
            {/* Zone fill */}
            <polygon
              points={trapezoidPoints(
                zone.topLeft,
                zone.topRight,
                zone.bottomLeft,
                zone.bottomRight,
                zone.topY,
                zone.bottomY
              )}
              fill={zone.color}
              stroke="white"
              strokeWidth="1.5"
              strokeOpacity="0.6"
              className="transition-opacity duration-200 opacity-85 group-hover:opacity-100"
            />

            {/* Highlight overlay */}
            <polygon
              points={trapezoidPoints(
                zone.topLeft,
                zone.topRight,
                zone.bottomLeft,
                zone.bottomRight,
                zone.topY,
                zone.bottomY
              )}
              fill="url(#iceHighlight)"
              className="pointer-events-none"
            />

            {/* Level label */}
            <text
              x={midX}
              y={midY - (ops.length > 0 ? 24 : 8)}
              textAnchor="middle"
              fontSize={isAboveWater ? "13" : "14"}
              fontWeight="700"
              fill={zone.textColor}
              className="pointer-events-none select-none"
            >
              {levelLabel} ({count})
            </text>

            {/* Operation titles */}
            {ops.slice(0, 3).map((op, i) => (
              <text
                key={i}
                x={midX}
                y={midY - 4 + i * 18}
                textAnchor="middle"
                fontSize="11"
                fill={zone.textColor}
                fillOpacity="0.85"
                className="pointer-events-none select-none"
              >
                {locale === "es" ? op.titleEs : op.title}
              </text>
            ))}
          </g>
        );
      })}

      {/* Waterline dashed rule */}
      <line
        x1="0"
        y1="160"
        x2="600"
        y2="160"
        stroke="#0369A1"
        strokeWidth="2"
        strokeDasharray="10,6"
        strokeOpacity="0.7"
      />

      {/* "WATER LINE" label */}
      <text x="8" y="155" fontSize="9" fill="#0369A1" fillOpacity="0.8" fontWeight="600" letterSpacing="1">
        WATER LINE
      </text>
    </svg>
  );
}
