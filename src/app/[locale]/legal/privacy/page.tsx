import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";

const CONTACT_EMAIL = "contact@psyopedia.org";

type Section = { heading: string; paragraphs: string[] };

const content: Record<string, { title: string; updated: string; intro: string; sections: Section[] }> = {
  en: {
    title: "Privacy Policy",
    updated: "Last updated: October 14, 2026",
    intro:
      "Psyopedia is a bilingual encyclopedia of historical psychological operations. It is a static website: it has no accounts, no comments, and no forms. This policy explains the little data involved in visiting it.",
    sections: [
      {
        heading: "Data we collect",
        paragraphs: [
          "We do not ask for, collect, or store any personal data.",
          "Technical data: the site is hosted on GitHub Pages. GitHub logs the IP address of visitors for security purposes, as described in the GitHub Privacy Statement. We have no access to those logs.",
        ],
      },
      {
        heading: "Cookies and analytics",
        paragraphs: [
          "We do not set cookies and we do not use analytics, advertising, or tracking scripts. The language of the home page is chosen from your browser settings, inside your browser, and is not stored.",
        ],
      },
      {
        heading: "Third parties",
        paragraphs: [
          "The only provider involved is GitHub, Inc. (hosting), which may process data outside the EEA under standard contractual clauses. Links to external sources lead to sites with their own privacy policies.",
        ],
      },
      {
        heading: "Your rights",
        paragraphs: [
          `For any question about this policy or to exercise your data protection rights, write to ${CONTACT_EMAIL}. If you are in the EU/EEA you may also lodge a complaint with your supervisory authority.`,
        ],
      },
      {
        heading: "Changes",
        paragraphs: [
          "We may update this policy as the site evolves. Material changes will be announced on this page with a new revision date.",
        ],
      },
    ],
  },
  es: {
    title: "Política de privacidad",
    updated: "Última actualización: 14 de octubre de 2026",
    intro:
      "Psyopedia es una enciclopedia bilingüe de operaciones psicológicas históricas. Es un sitio web estático: no tiene cuentas, ni comentarios, ni formularios. Esta política explica los pocos datos que intervienen al visitarlo.",
    sections: [
      {
        heading: "Datos que recogemos",
        paragraphs: [
          "No pedimos, recogemos ni almacenamos ningún dato personal.",
          "Datos técnicos: el sitio está alojado en GitHub Pages. GitHub registra la dirección IP de los visitantes con fines de seguridad, como se describe en la Declaración de Privacidad de GitHub. No tenemos acceso a esos registros.",
        ],
      },
      {
        heading: "Cookies y analítica",
        paragraphs: [
          "No usamos cookies ni scripts de analítica, publicidad o seguimiento. El idioma de la página de inicio se elige a partir de la configuración de tu navegador, dentro de tu navegador, y no se guarda.",
        ],
      },
      {
        heading: "Terceros",
        paragraphs: [
          "El único proveedor que interviene es GitHub, Inc. (alojamiento), que puede tratar datos fuera del EEE bajo cláusulas contractuales tipo. Los enlaces a fuentes externas llevan a sitios con sus propias políticas de privacidad.",
        ],
      },
      {
        heading: "Tus derechos",
        paragraphs: [
          `Para cualquier duda sobre esta política o para ejercer tus derechos de protección de datos, escribe a ${CONTACT_EMAIL}. Si resides en la UE/EEE también puedes reclamar ante tu autoridad de control (en España, la AEPD).`,
        ],
      },
      {
        heading: "Cambios",
        paragraphs: [
          "Podremos actualizar esta política a medida que evolucione el sitio. Los cambios sustanciales se anunciarán en esta página con una nueva fecha de revisión.",
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

export default async function PrivacyPage({
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
