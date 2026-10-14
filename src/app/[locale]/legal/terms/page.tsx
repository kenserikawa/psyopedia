import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";

const CONTACT_EMAIL = "contact@psyopedia.org";

type Section = { heading: string; paragraphs: string[] };

const content: Record<string, { title: string; updated: string; intro: string; sections: Section[] }> = {
  en: {
    title: "Terms of Use",
    updated: "Last updated: October 14, 2026",
    intro:
      "By using Psyopedia you agree to these terms. Please read them — they are short and written for humans.",
    sections: [
      {
        heading: "Purpose of the site",
        paragraphs: [
          "Psyopedia is an educational and historical reference about psychological operations, propaganda, and information warfare. Entries are classified by how well documented they are — from declassified fact to unconfirmed allegation. An entry's presence is not an endorsement of its claims: lower-depth levels explicitly catalog allegations and conspiracy narratives as such, with source ratings.",
        ],
      },
      {
        heading: "Acceptable use",
        paragraphs: [
          "Do not scrape the site at abusive rates or attempt to disrupt the service.",
        ],
      },
      {
        heading: "Accuracy and liability",
        paragraphs: [
          "We work to source every entry, but historical material — especially leaked or alleged operations — is inherently uncertain. Content is provided \"as is\", without warranty. Psyopedia is not liable for decisions made based on the site's content.",
        ],
      },
      {
        heading: "Contact and changes",
        paragraphs: [
          `Questions about these terms, corrections, and suggestions for new entries: ${CONTACT_EMAIL}. We may update these terms; continued use after changes constitutes acceptance.`,
        ],
      },
    ],
  },
  es: {
    title: "Términos de uso",
    updated: "Última actualización: 14 de octubre de 2026",
    intro:
      "Al usar Psyopedia aceptas estos términos. Léelos — son breves y están escritos para humanos.",
    sections: [
      {
        heading: "Propósito del sitio",
        paragraphs: [
          "Psyopedia es una referencia educativa e histórica sobre operaciones psicológicas, propaganda y guerra de la información. Las entradas se clasifican según su nivel de documentación — desde hechos desclasificados hasta alegaciones sin confirmar. La presencia de una entrada no supone un respaldo de sus afirmaciones: los niveles más profundos catalogan explícitamente alegaciones y narrativas conspirativas como tales, con valoración de fuentes.",
        ],
      },
      {
        heading: "Uso aceptable",
        paragraphs: [
          "No hagas scraping a ritmos abusivos ni intentes interrumpir el servicio.",
        ],
      },
      {
        heading: "Exactitud y responsabilidad",
        paragraphs: [
          "Trabajamos para documentar cada entrada con fuentes, pero el material histórico — especialmente operaciones filtradas o alegadas — es intrínsecamente incierto. El contenido se ofrece \"tal cual\", sin garantías. Psyopedia no se hace responsable de decisiones tomadas a partir del contenido del sitio.",
        ],
      },
      {
        heading: "Contacto y cambios",
        paragraphs: [
          `Dudas sobre estos términos, correcciones y propuestas de nuevas entradas: ${CONTACT_EMAIL}. Podemos actualizar estos términos; el uso continuado tras los cambios implica su aceptación.`,
        ],
      },
    ],
  },
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const c = content[locale] ?? content.en;
  return { title: c.title, robots: { index: true } };
}

export default async function TermsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const c = content[locale] ?? content.en;

  return (
    <div className="container mx-auto max-w-3xl px-4 py-12">
      <h1 className="text-3xl font-bold">{c.title}</h1>
      <p className="mt-2 text-sm text-muted-foreground">{c.updated}</p>
      <p className="mt-6 text-muted-foreground">{c.intro}</p>
      {c.sections.map((section) => (
        <section key={section.heading} className="mt-8">
          <h2 className="text-xl font-semibold">{section.heading}</h2>
          {section.paragraphs.map((paragraph) => (
            <p key={paragraph} className="mt-3 leading-relaxed text-muted-foreground">
              {paragraph}
            </p>
          ))}
        </section>
      ))}
    </div>
  );
}
