// URLs públicas del sitio. Todo sale de NEXT_PUBLIC_SITE_URL y su ruta es el basePath:
//   https://kenserikawa.github.io/psyopedia → "/psyopedia"
//   https://psyopedia.org                   → ""
// next.config.ts repite el cálculo de BASE_PATH porque no puede importar módulos TS locales.

const DEFAULT_SITE_URL = "https://psyopedia.org";

export function normalizeSiteUrl(value: string | undefined): string {
  const url = new URL(value || DEFAULT_SITE_URL);
  return `${url.origin}${url.pathname}`.replace(/\/+$/, "");
}

export function basePathOf(siteUrl: string): string {
  return new URL(siteUrl).pathname.replace(/\/+$/, "");
}

export const SITE_URL = normalizeSiteUrl(process.env.NEXT_PUBLIC_SITE_URL);
export const BASE_PATH = basePathOf(SITE_URL);

/** URL absoluta de una página, con barra final (trailingSlash: true). */
export function pageUrl(path = "/", siteUrl = SITE_URL): string {
  return `${siteUrl}${`/${path}/`.replace(/\/{2,}/g, "/")}`;
}

/** Ruta de un fichero de public/ con el basePath delante: next/image y three.js no lo añaden. */
export function asset(path: string, basePath = BASE_PATH): string {
  return `${basePath}/${path.replace(/^\/+/, "")}`;
}

/** Imagen OG estática: la de la home o la de una operación (slug del idioma). */
export function ogImageUrl(locale: string, slug?: string, siteUrl = SITE_URL): string {
  return slug ? `${siteUrl}/og/${locale}/catalog/${slug}.png` : `${siteUrl}/og/${locale}/home.png`;
}

/** Script inline de la raíz: /es/ si el idioma preferido es español, /en/ en cualquier otro caso. */
export function rootRedirectScript(basePath = BASE_PATH): string {
  return `(function(){var l=(navigator.languages&&navigator.languages[0])||navigator.language||"";location.replace(${JSON.stringify(basePath)}+(/^es(-|$)/i.test(l)?"/es/":"/en/"));})();`;
}
