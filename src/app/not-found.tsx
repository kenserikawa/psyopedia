import Link from "next/link";
import "@/app/globals.css";

// Root-level 404 for paths outside the [locale] segment. The root layout is a
// pass-through, so this page must render its own <html> shell.
export default function RootNotFound() {
  return (
    <html lang="en">
      <body className="min-h-screen bg-background font-sans antialiased">
        <div className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center gap-4 px-4 text-center">
          <p className="font-mono text-sm uppercase tracking-widest text-muted-foreground">404</p>
          <h1 className="text-3xl font-bold">Page not found</h1>
          <Link href="/en" className="mt-4 rounded-md border px-4 py-2 text-sm">
            Back to the surface
          </Link>
        </div>
      </body>
    </html>
  );
}
