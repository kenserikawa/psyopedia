import { ImageResponse } from "next/og";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

const levelLabels: Record<number, string> = {
  1: "Well-Known",
  2: "Underappreciated",
  3: "Leaked",
  4: "Alleged",
  5: "Deep Conspiracy",
};

const levelColors: Record<number, string> = {
  1: "#0EA5E9",
  2: "#3B82F6",
  3: "#6366F1",
  4: "#8B5CF6",
  5: "#7C3AED",
};

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;

  const operation = await prisma.operation.findUnique({
    where: { slug, moderationStatus: "APPROVED" },
    select: { title: true, icebergLevel: true, era: true, status: true, excerpt: true },
  });

  if (!operation) {
    return new Response("Not found", { status: 404 });
  }

  const bgColor = levelColors[operation.icebergLevel] || "#3B82F6";

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
          background: `linear-gradient(135deg, ${bgColor} 0%, #1E293B 100%)`,
          color: "white",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <div style={{ display: "flex", gap: "12px", fontSize: "20px" }}>
            <span
              style={{
                background: "rgba(255,255,255,0.2)",
                padding: "4px 12px",
                borderRadius: "6px",
              }}
            >
              Level {operation.icebergLevel}: {levelLabels[operation.icebergLevel]}
            </span>
            <span
              style={{
                background: "rgba(255,255,255,0.2)",
                padding: "4px 12px",
                borderRadius: "6px",
              }}
            >
              {operation.era.replace(/_/g, " ")}
            </span>
            <span
              style={{
                background: "rgba(255,255,255,0.2)",
                padding: "4px 12px",
                borderRadius: "6px",
              }}
            >
              {operation.status}
            </span>
          </div>
          <div style={{ fontSize: "56px", fontWeight: "bold", lineHeight: 1.1 }}>
            {operation.title}
          </div>
          <div
            style={{
              fontSize: "24px",
              opacity: 0.8,
              lineHeight: 1.4,
              maxHeight: "130px",
              overflow: "hidden",
            }}
          >
            {operation.excerpt.length > 180
              ? operation.excerpt.slice(0, 180) + "..."
              : operation.excerpt}
          </div>
        </div>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-end",
            fontSize: "24px",
          }}
        >
          <span style={{ fontWeight: "bold", fontSize: "32px" }}>PSYOPEDIA</span>
          <span style={{ opacity: 0.6 }}>psyopedia.org</span>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    }
  );
}
