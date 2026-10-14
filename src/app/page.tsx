import type { Metadata } from "next";
import { BASE_PATH, rootRedirectScript } from "@/lib/site";
import "@/app/globals.css";

export const metadata: Metadata = {
  title: "Psyopedia",
  robots: { index: false },
};

// Sin middleware no hay detección de idioma en el servidor: la raíz redirige en el navegador
// y, sin JavaScript, el meta refresh lleva a la versión en inglés.
export default function RootPage() {
  const fallback = `${BASE_PATH}/en/`;

  return (
    <html lang="en">
      <head>
        <script dangerouslySetInnerHTML={{ __html: rootRedirectScript() }} />
        <meta httpEquiv="refresh" content={`0;url=${fallback}`} />
      </head>
      <body className="min-h-screen bg-background font-sans antialiased">
        <p className="p-8 text-center">
          <a href={fallback}>Psyopedia</a>
        </p>
      </body>
    </html>
  );
}
