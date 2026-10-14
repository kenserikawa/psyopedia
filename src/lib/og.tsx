import { ImageResponse } from "next/og";
import en from "../../messages/en.json";
import es from "../../messages/es.json";
import type { Operation } from "@/lib/content/types";
import { SITE_URL } from "@/lib/site";

const SIZE = { width: 1200, height: 630 };
const LEVEL_COLORS = ["#0EA5E9", "#3B82F6", "#6366F1", "#8B5CF6", "#7C3AED"];
const SITE_LABEL = SITE_URL.replace(/^https?:\/\//, "");
const BADGE = { background: "rgba(255,255,255,0.2)", padding: "4px 12px", borderRadius: "6px" };

const COPY = {
  en: {
    messages: en,
    subtitle: "A bilingual encyclopedia of psychological operations throughout history",
    explore: "Explore the iceberg",
    level: "Level",
    levels: ["Well-Known", "Underappreciated", "Leaked", "Alleged", "Deep Conspiracy"],
  },
  es: {
    messages: es,
    subtitle: "Una enciclopedia bilingüe de operaciones psicológicas a lo largo de la historia",
    explore: "Explora el iceberg",
    level: "Nivel",
    levels: ["Conocidas", "Subestimadas", "Filtradas", "Alegadas", "Conspiración Profunda"],
  },
};

const copyFor = (locale: string) => (locale === "es" ? COPY.es : COPY.en);

export function homeImage(locale: string): ImageResponse {
  const copy = copyFor(locale);

  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "60px",
          background: "linear-gradient(180deg, #0EA5E9 0%, #1E3A5F 45%, #0a1628 100%)",
          color: "white",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          <div style={{ fontSize: "84px", fontWeight: "bold", letterSpacing: "-2px" }}>PSYOPEDIA</div>
          <div style={{ fontSize: "32px", opacity: 0.85, lineHeight: 1.3, maxWidth: "900px" }}>{copy.subtitle}</div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
          <div style={{ display: "flex", gap: "10px" }}>
            {copy.levels.map((label, i) => (
              <span
                key={label}
                style={{ background: LEVEL_COLORS[i], padding: "6px 16px", borderRadius: "6px", fontSize: "20px" }}
              >
                {`${i + 1}. ${label}`}
              </span>
            ))}
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: "24px", opacity: 0.6 }}>
            <span>{copy.explore}</span>
            <span>{SITE_LABEL}</span>
          </div>
        </div>
      </div>
    ),
    SIZE,
  );
}

export function operationImage(operation: Operation, locale: string): ImageResponse {
  const copy = copyFor(locale);
  const { enums } = copy.messages;
  const level = operation.icebergLevel;
  const title = locale === "es" ? operation.titleEs : operation.title;
  const excerpt = locale === "es" ? operation.excerptEs : operation.excerpt;

  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "60px",
          background: `linear-gradient(135deg, ${LEVEL_COLORS[level - 1] ?? LEVEL_COLORS[1]} 0%, #1E293B 100%)`,
          color: "white",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <div style={{ display: "flex", gap: "12px", fontSize: "20px" }}>
            <span style={BADGE}>{`${copy.level} ${level}: ${copy.levels[level - 1]}`}</span>
            <span style={BADGE}>{enums.era[operation.era]}</span>
            <span style={BADGE}>{enums.status[operation.status]}</span>
          </div>
          <div style={{ fontSize: "56px", fontWeight: "bold", lineHeight: 1.1 }}>{title}</div>
          <div style={{ fontSize: "24px", opacity: 0.8, lineHeight: 1.4, maxHeight: "130px", overflow: "hidden" }}>
            {excerpt.length > 180 ? `${excerpt.slice(0, 180)}...` : excerpt}
          </div>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", fontSize: "24px" }}>
          <span style={{ fontWeight: "bold", fontSize: "32px" }}>PSYOPEDIA</span>
          <span style={{ opacity: 0.6 }}>{SITE_LABEL}</span>
        </div>
      </div>
    ),
    SIZE,
  );
}
