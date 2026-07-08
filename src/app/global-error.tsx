"use client";

// Catches errors thrown by the root layout itself, outside the [locale]
// segment — no i18n context is available here.
export default function GlobalError({ reset }: { reset: () => void }) {
  return (
    <html lang="en">
      <body style={{ fontFamily: "serif", background: "#0a0a0a", color: "#fafafa" }}>
        <div
          style={{
            minHeight: "100vh",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: "1rem",
            textAlign: "center",
            padding: "1rem",
          }}
        >
          <h1 style={{ fontSize: "1.5rem", fontWeight: 700 }}>Something went wrong</h1>
          <button
            onClick={reset}
            style={{
              border: "1px solid #525252",
              borderRadius: "6px",
              padding: "0.5rem 1rem",
              background: "transparent",
              color: "inherit",
              cursor: "pointer",
            }}
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
