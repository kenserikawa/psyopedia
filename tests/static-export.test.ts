// Inspecciona out/ tras `npm run build`. Ejecutar con el mismo NEXT_PUBLIC_SITE_URL que el build.
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { test } from "node:test";
import { loadContent } from "../src/lib/content/load";
import { BASE_PATH, SITE_URL, rootRedirectScript } from "../src/lib/site";

const OUT = path.join(process.cwd(), "out");
const content = loadContent(path.join(process.cwd(), "content"));
const exists = (relative: string) => fs.existsSync(path.join(OUT, relative));
const read = (relative: string) => fs.readFileSync(path.join(OUT, relative), "utf8");

test("el export contiene la estructura estática del sitio", () => {
  for (const relative of [
    "index.html", "404.html", "robots.txt", "sitemap.xml", ".nojekyll",
    "en/index.html", "es/index.html", "en/catalog/index.html", "es/catalog/index.html",
    "en/iceberg/index.html", "es/iceberg/index.html",
    "en/legal/privacy/index.html", "es/legal/privacy/index.html",
    "en/legal/terms/index.html", "es/legal/terms/index.html",
  ]) {
    assert.ok(exists(relative), relative);
  }
  assert.equal(exists("api"), false, "no debe quedar nada de /api");
});

test("cada operación tiene su ficha en los dos idiomas", () => {
  assert.equal(content.operations.length, 46);
  for (const op of content.operations) {
    assert.ok(exists(`en/catalog/${op.slug}/index.html`), op.slug);
    assert.ok(exists(`es/catalog/${op.slugEs}/index.html`), op.slugEs);
  }
});

test("el sitemap lista todas las fichas con basePath y barra final", () => {
  const xml = read("sitemap.xml");
  for (const op of content.operations) {
    assert.ok(xml.includes(`<loc>${SITE_URL}/en/catalog/${op.slug}/</loc>`), op.slug);
    assert.ok(xml.includes(`<loc>${SITE_URL}/es/catalog/${op.slugEs}/</loc>`), op.slugEs);
  }
});

test("la raíz redirige a la home localizada bajo el basePath", () => {
  const html = read("index.html");
  assert.ok(html.includes(`url=${BASE_PATH}/en/`), "falta el meta refresh");
  assert.ok(html.includes(rootRedirectScript()), "falta el script de idioma");
});

test("los assets de _next usan el mismo basePath que src/lib/site.ts", () => {
  assert.ok(read("en/index.html").includes(`"${BASE_PATH}/_next/static/`), "basePath distinto en next.config.ts");
});

test("el catálogo estático trae la primera página sin filtros", () => {
  const cards = read("en/catalog/index.html").match(new RegExp(`href="${BASE_PATH}/en/catalog/[a-z0-9-]+/?"`, "g")) ?? [];
  assert.ok(cards.length >= 12, `solo ${cards.length} enlaces a fichas`);
});

const PNG_SIGNATURE = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

test("las imágenes OG son ficheros PNG reales", () => {
  const files = [
    "og/en/home.png",
    "og/es/home.png",
    ...content.operations.flatMap((op) => [`og/en/catalog/${op.slug}.png`, `og/es/catalog/${op.slugEs}.png`]),
  ];
  for (const relative of files) {
    assert.ok(exists(relative), relative);
    assert.ok(fs.readFileSync(path.join(OUT, relative)).subarray(0, 8).equals(PNG_SIGNATURE), `${relative} no es PNG`);
  }
});

test("las páginas enlazan su imagen OG", () => {
  assert.ok(read("en/catalog/mkultra/index.html").includes(`${SITE_URL}/og/en/catalog/mkultra.png`));
  assert.ok(read("es/catalog/operacion-paperclip/index.html").includes(`${SITE_URL}/og/es/catalog/operacion-paperclip.png`));
  assert.ok(read("es/index.html").includes(`${SITE_URL}/og/es/home.png`));
  assert.ok(read("en/catalog/index.html").includes(`${SITE_URL}/og/en/home.png`));
});

test("en la raíz el meta refresh solo actúa sin JavaScript y nada bloquea el script de idioma", () => {
  const html = read("index.html");
  assert.match(html, /<noscript>\s*<meta http-equiv="refresh"/i, "el meta refresh debe ir dentro de <noscript>");
  assert.doesNotMatch(html.replace(/<noscript>[\s\S]*?<\/noscript>/gi, ""), /http-equiv="refresh"/i, "meta refresh fuera de <noscript>");
  const script = html.indexOf(rootRedirectScript());
  const stylesheet = html.search(/<link[^>]+rel="stylesheet"/i);
  assert.ok(stylesheet === -1 || stylesheet > script, "una hoja de estilos bloquea el script de idioma");
});
