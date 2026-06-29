import { ImageResponse } from "next/og";

export const alt = "Psyopedia";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const LEVEL_COLORS = ["#0EA5E9", "#3B82F6", "#6366F1", "#8B5CF6", "#7C3AED"];

const SUBTITLES: Record<string, string> = {
  en: "A bilingual encyclopedia of psychological operations throughout history",
  es: "Una enciclopedia bilingüe de operaciones psicológicas a lo largo de la historia",
};

const LEVEL_LABELS: Record<string, string[]> = {
  en: ["Well-Known", "Underappreciated", "Leaked", "Alleged", "Deep Conspiracy"],
  es: ["Conocidas", "Subestimadas", "Filtradas", "Alegadas", "Conspiración Profunda"],
};

export default async function OgImage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const subtitle = SUBTITLES[locale] ?? SUBTITLES.en;
  const labels = LEVEL_LABELS[locale] ?? LEVEL_LABELS.en;

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
          <div style={{ fontSize: "84px", fontWeight: "bold", letterSpacing: "-2px" }}>
            PSYOPEDIA
          </div>
          <div style={{ fontSize: "32px", opacity: 0.85, lineHeight: 1.3, maxWidth: "900px" }}>
            {subtitle}
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
          <div style={{ display: "flex", gap: "10px" }}>
            {labels.map((label, i) => (
              <span
                key={label}
                style={{
                  background: LEVEL_COLORS[i],
                  padding: "6px 16px",
                  borderRadius: "6px",
                  fontSize: "20px",
                }}
              >
                {i + 1}. {label}
              </span>
            ))}
          </div>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              fontSize: "24px",
              opacity: 0.6,
            }}
          >
            <span>{locale === "es" ? "Explora el iceberg" : "Explore the iceberg"}</span>
            <span>psyopedia.org</span>
          </div>
        </div>
      </div>
    ),
    { ...size }
  );
}
