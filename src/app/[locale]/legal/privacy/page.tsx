import type { Metadata } from "next";

const CONTACT_EMAIL = "contact@psyopedia.org";

type Section = { heading: string; paragraphs: string[] };

const content: Record<string, { title: string; updated: string; intro: string; sections: Section[] }> = {
  en: {
    title: "Privacy Policy",
    updated: "Last updated: July 9, 2026",
    intro:
      "Psyopedia is a bilingual encyclopedia of historical psychological operations. This policy explains what personal data we process, why, and what rights you have over it.",
    sections: [
      {
        heading: "Data we collect",
        paragraphs: [
          "Account data: when you sign in with Google or GitHub we receive your name, email address, and avatar from the provider. We never see your password.",
          "Content you submit: contributions and comments you post are stored together with your account.",
          "Technical data: our hosting provider keeps standard server logs (IP address, user agent) for security purposes. Site analytics are cookieless and aggregated — we cannot identify individual visitors.",
        ],
      },
      {
        heading: "Why we process it",
        paragraphs: [
          "To operate your account and attribute your contributions (performance of the service you request).",
          "To moderate community content and keep the site safe (legitimate interest).",
          "To measure aggregate site usage and improve the encyclopedia (legitimate interest).",
        ],
      },
      {
        heading: "Cookies",
        paragraphs: [
          "We only use cookies that are strictly necessary for authentication sessions. We do not use advertising or cross-site tracking cookies.",
        ],
      },
      {
        heading: "Sharing and processors",
        paragraphs: [
          "We do not sell personal data. Data is processed by our infrastructure providers (hosting and database) and, for sign-in, by the OAuth provider you choose (Google or GitHub). These providers may process data outside the EEA under standard contractual clauses.",
        ],
      },
      {
        heading: "Retention",
        paragraphs: [
          "Account data is kept while your account exists. Published contributions may remain after account deletion in anonymized form, unless you request their removal.",
        ],
      },
      {
        heading: "Your rights",
        paragraphs: [
          `You can request access, rectification, deletion, portability, or object to processing at any time by writing to ${CONTACT_EMAIL}. If you are in the EU/EEA you may also lodge a complaint with your supervisory authority.`,
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
    updated: "Última actualización: 9 de julio de 2026",
    intro:
      "Psyopedia es una enciclopedia bilingüe de operaciones psicológicas históricas. Esta política explica qué datos personales tratamos, con qué finalidad y qué derechos tienes sobre ellos.",
    sections: [
      {
        heading: "Datos que recogemos",
        paragraphs: [
          "Datos de cuenta: al iniciar sesión con Google o GitHub recibimos tu nombre, dirección de correo y avatar del proveedor. Nunca vemos tu contraseña.",
          "Contenido que envías: las contribuciones y comentarios que publicas se almacenan asociados a tu cuenta.",
          "Datos técnicos: nuestro proveedor de hosting conserva registros estándar del servidor (dirección IP, agente de usuario) con fines de seguridad. La analítica del sitio no usa cookies y es agregada — no podemos identificar visitantes individuales.",
        ],
      },
      {
        heading: "Finalidades del tratamiento",
        paragraphs: [
          "Gestionar tu cuenta y atribuir tus contribuciones (ejecución del servicio que solicitas).",
          "Moderar el contenido de la comunidad y mantener el sitio seguro (interés legítimo).",
          "Medir el uso agregado del sitio y mejorar la enciclopedia (interés legítimo).",
        ],
      },
      {
        heading: "Cookies",
        paragraphs: [
          "Solo utilizamos cookies estrictamente necesarias para las sesiones de autenticación. No usamos cookies publicitarias ni de seguimiento entre sitios.",
        ],
      },
      {
        heading: "Destinatarios y encargados",
        paragraphs: [
          "No vendemos datos personales. Los datos son tratados por nuestros proveedores de infraestructura (hosting y base de datos) y, para el inicio de sesión, por el proveedor OAuth que elijas (Google o GitHub). Estos proveedores pueden tratar datos fuera del EEE bajo cláusulas contractuales tipo.",
        ],
      },
      {
        heading: "Conservación",
        paragraphs: [
          "Los datos de cuenta se conservan mientras exista tu cuenta. Las contribuciones publicadas pueden permanecer de forma anonimizada tras la eliminación de la cuenta, salvo que solicites su retirada.",
        ],
      },
      {
        heading: "Tus derechos",
        paragraphs: [
          `Puedes ejercer tus derechos de acceso, rectificación, supresión, portabilidad u oposición en cualquier momento escribiendo a ${CONTACT_EMAIL}. Si resides en la UE/EEE también puedes reclamar ante tu autoridad de control (en España, la AEPD).`,
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
