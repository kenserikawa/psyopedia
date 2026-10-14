import type { Metadata } from "next";
import { BASE_PATH, rootRedirectScript } from "@/lib/site";

export const metadata: Metadata = {
  title: "Psyopedia",
  robots: { index: false },
};

// Sin middleware no hay detección de idioma en el servidor: la raíz redirige en el navegador.
// El meta refresh va en <noscript> para que no compita con el script en redes lentas, y la
// página no carga CSS para que ninguna hoja de estilos retrase el script.
export default function RootPage() {
  const fallback = `${BASE_PATH}/en/`;

  return (
    <html lang="en">
      <head>
        <script dangerouslySetInnerHTML={{ __html: rootRedirectScript() }} />
        <noscript dangerouslySetInnerHTML={{ __html: `<meta http-equiv="refresh" content="0;url=${fallback}">` }} />
      </head>
      <body>
        <p>
          <a href={fallback}>Psyopedia</a>
        </p>
      </body>
    </html>
  );
}
