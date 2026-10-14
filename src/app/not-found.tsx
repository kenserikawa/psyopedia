import Link from "next/link";
import "@/app/globals.css";

// Única página 404 del export: GitHub Pages la sirve para cualquier ruta inexistente, en
// cualquier idioma. El layout raíz es un pass-through, así que renderiza su propio <html>.
export default function RootNotFound() {
  return (
    <html lang="en">
      <body className="min-h-screen bg-background font-sans antialiased">
        <div className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center gap-4 px-4 text-center">
          <p className="font-mono text-sm uppercase tracking-widest text-muted-foreground">404</p>
          <h1 className="text-3xl font-bold">Page not found</h1>
          <p lang="es" className="text-xl text-muted-foreground">
            Página no encontrada
          </p>
          <div className="mt-4 flex flex-wrap justify-center gap-3">
            <Link href="/en" className="rounded-md border px-4 py-2 text-sm">
              Back to the surface
            </Link>
            <Link href="/es" lang="es" className="rounded-md border px-4 py-2 text-sm">
              Volver a la superficie
            </Link>
          </div>
        </div>
      </body>
    </html>
  );
}
