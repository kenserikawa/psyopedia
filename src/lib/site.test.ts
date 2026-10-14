import assert from "node:assert/strict";
import { test } from "node:test";
import { asset, basePathOf, normalizeSiteUrl, ogImageUrl, pageUrl, rootRedirectScript } from "./site";

test("la URL del sitio se normaliza y su ruta es el basePath", () => {
  assert.equal(normalizeSiteUrl(undefined), "https://psyopedia.org");
  assert.equal(normalizeSiteUrl(""), "https://psyopedia.org");
  assert.equal(normalizeSiteUrl("https://psyopedia.org/"), "https://psyopedia.org");
  assert.equal(normalizeSiteUrl("https://kenserikawa.github.io/psyopedia/"), "https://kenserikawa.github.io/psyopedia");
  assert.equal(basePathOf("https://kenserikawa.github.io/psyopedia"), "/psyopedia");
  assert.equal(basePathOf("https://psyopedia.org"), "");
});

test("pageUrl deja una sola barra entre segmentos y siempre barra final", () => {
  const site = "https://kenserikawa.github.io/psyopedia";
  assert.equal(pageUrl("/", site), `${site}/`);
  assert.equal(pageUrl("/en", site), `${site}/en/`);
  assert.equal(pageUrl("en/catalog//mkultra/", site), `${site}/en/catalog/mkultra/`);
  assert.equal(pageUrl("/es/catalog/operacion-paperclip"), "https://psyopedia.org/es/catalog/operacion-paperclip/");
});

test("asset y ogImageUrl respetan el basePath", () => {
  assert.equal(asset("/logo.png", "/psyopedia"), "/psyopedia/logo.png");
  assert.equal(asset("textures/waternormals.jpg", ""), "/textures/waternormals.jpg");
  assert.equal(ogImageUrl("es", undefined, "https://x.test/p"), "https://x.test/p/og/es/home.png");
  assert.equal(ogImageUrl("en", "mkultra", "https://x.test/p"), "https://x.test/p/og/en/catalog/mkultra.png");
});

function redirectTarget(languages: string[], language = ""): string {
  let target = "";
  new Function("navigator", "location", rootRedirectScript("/psyopedia"))(
    { languages, language },
    { replace: (url: string) => { target = url; } },
  );
  return target;
}

test("la raíz redirige según el primer idioma preferido del navegador", () => {
  assert.equal(redirectTarget(["es-ES", "en"]), "/psyopedia/es/");
  assert.equal(redirectTarget(["es-419"]), "/psyopedia/es/");
  assert.equal(redirectTarget(["ES"]), "/psyopedia/es/");
  assert.equal(redirectTarget(["en-US", "es"]), "/psyopedia/en/");
  assert.equal(redirectTarget(["ca-ES"]), "/psyopedia/en/");
  assert.equal(redirectTarget([], "es"), "/psyopedia/es/");
  assert.equal(redirectTarget([], ""), "/psyopedia/en/");
});
