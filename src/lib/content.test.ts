import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { test } from "node:test";
import { ContentError, loadContent } from "./content/load";
import {
  getAllOperationSlugs,
  getCatalogSummaries,
  getDistinctActors,
  getHomepageData,
  getIcebergData,
  getOperationForLocale,
} from "./content/index";

type Meta = Record<string, unknown>;

function meta(slug: string, overrides: Meta = {}): Meta {
  return {
    slug,
    slugEs: `${slug}-es`,
    title: `Title ${slug}`,
    titleEs: `Título ${slug}`,
    aliases: [],
    icebergLevel: 1,
    era: "COLD_WAR",
    types: ["PROPAGANDA"],
    actors: ["CIA"],
    targets: ["Public"],
    outcome: "SUCCESSFUL",
    status: "DECLASSIFIED",
    excerpt: `Excerpt ${slug}`,
    excerptEs: `Resumen ${slug}`,
    publishedAt: "2026-03-29",
    tags: ["cia"],
    related: [],
    sources: [{ url: "https://example.org/doc", title: "Doc", type: "GOVERNMENT", credibility: 5 }],
    ...overrides,
  };
}

/** Crea un content/ temporal. `files` escribe (texto) o borra (null) rutas relativas al final. */
function fixture(metas: Meta[], options: { tags?: unknown; files?: Record<string, string | null> } = {}): string {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "psyopedia-content-"));
  fs.writeFileSync(path.join(dir, "tags.json"), JSON.stringify(options.tags ?? { cia: { name: "CIA", nameEs: "CIA" } }));
  fs.mkdirSync(path.join(dir, "operations"));
  for (const m of metas) {
    const folder = path.join(dir, "operations", String(m.slug));
    fs.mkdirSync(folder);
    fs.writeFileSync(path.join(folder, "meta.json"), JSON.stringify(m));
    fs.writeFileSync(path.join(folder, "body.en.md"), "## Overview\n\nBody.\n");
    fs.writeFileSync(path.join(folder, "body.es.md"), "## Resumen\n\nCuerpo.\n");
  }
  for (const [relative, text] of Object.entries(options.files ?? {})) {
    const file = path.join(dir, relative);
    if (text === null) {
      fs.rmSync(file);
    } else {
      fs.mkdirSync(path.dirname(file), { recursive: true });
      fs.writeFileSync(file, text);
    }
  }
  return dir;
}

function assertContentError(dir: string, file: string, ...fragments: string[]) {
  assert.throws(() => loadContent(dir), (error: unknown) => {
    assert.ok(error instanceof ContentError, `esperaba ContentError, llegó: ${String(error)}`);
    assert.ok(error.message.includes(file), error.message);
    for (const fragment of fragments) assert.ok(error.message.includes(fragment), error.message);
    return true;
  });
}

test("carga operaciones válidas y resuelve etiquetas, fuentes, fechas y relacionadas en los dos sentidos", () => {
  const dir = fixture([meta("alpha", { related: ["beta"] }), meta("beta", { updatedAt: "2026-04-01" })]);
  const { operations, summaries, tags } = loadContent(dir);
  assert.deepEqual(operations.map((o) => o.slug), ["alpha", "beta"]);
  assert.deepEqual(summaries.map((o) => o.slug), ["alpha", "beta"]);
  assert.deepEqual(tags, [{ id: "cia", slug: "cia", name: "CIA", nameEs: "CIA" }]);
  const [alpha, beta] = operations;
  assert.equal(alpha.id, "alpha");
  assert.deepEqual(alpha.tags, tags);
  assert.equal(alpha.bodyEn, "## Overview\n\nBody.");
  assert.equal(alpha.bodyEs, "## Resumen\n\nCuerpo.");
  assert.deepEqual(alpha.sources, [
    { id: "alpha-0", url: "https://example.org/doc", title: "Doc", type: "GOVERNMENT", credibility: 5 },
  ]);
  assert.equal(alpha.sourceCount, 1);
  assert.equal(alpha.coverImage, null);
  assert.equal(alpha.updatedAt, "2026-03-29");
  assert.equal(beta.updatedAt, "2026-04-01");
  assert.deepEqual(alpha.relatedOps.map((o) => o.slug), ["beta"]);
  assert.deepEqual(beta.relatedOps.map((o) => o.slug), ["alpha"]);
  assert.equal("bodyEn" in alpha.relatedOps[0], false);
  assert.equal("bodyEn" in summaries[0], false);
});

test("una operación sin etiquetas, fuentes ni relacionadas es válida", () => {
  const [op] = loadContent(fixture([meta("bare", { tags: [], sources: [], related: [] })])).operations;
  assert.deepEqual(op.tags, []);
  assert.deepEqual(op.sources, []);
  assert.equal(op.sourceCount, 0);
  assert.deepEqual(op.relatedOps, []);
});

test("declarar la relación en las dos carpetas no la duplica", () => {
  const { operations } = loadContent(fixture([meta("alpha", { related: ["beta"] }), meta("beta", { related: ["alpha"] })]));
  assert.deepEqual(operations.map((o) => o.relatedOps.map((r) => r.slug)), [["beta"], ["alpha"]]);
});

test("rechaza un valor de enum inválido nombrando fichero y campo", () => {
  assertContentError(fixture([meta("alpha", { era: "MEDIEVAL" })]), "operations/alpha/meta.json", "era");
});

test("rechaza una carpeta que no coincide con el slug", () => {
  const dir = fixture([], {
    files: {
      "operations/other/meta.json": JSON.stringify(meta("alpha")),
      "operations/other/body.en.md": "Body",
      "operations/other/body.es.md": "Cuerpo",
    },
  });
  assertContentError(dir, "operations/other/meta.json", "slug", "no coincide");
});

test("rechaza slugEs repetidos", () => {
  assertContentError(
    fixture([meta("alpha", { slugEs: "mismo" }), meta("beta", { slugEs: "mismo" })]),
    "operations/beta/meta.json", "slugEs", "repetido",
  );
});

test("rechaza etiquetas que no existen en tags.json y etiquetas repetidas", () => {
  assertContentError(fixture([meta("alpha", { tags: ["cia", "mind-ctrl"] })]), "operations/alpha/meta.json", "tags[1]", "mind-ctrl", "tags.json");
  assertContentError(fixture([meta("alpha", { tags: ["cia", "cia"] })]), "operations/alpha/meta.json", "tags");
});

test("rechaza relacionadas inexistentes y la relación consigo misma", () => {
  assertContentError(fixture([meta("alpha", { related: ["ghost"] })]), "operations/alpha/meta.json", "related[0]", "ghost");
  assertContentError(fixture([meta("alpha", { related: ["alpha"] })]), "operations/alpha/meta.json", "related[0]", "misma");
});

test("rechaza cuerpos ausentes o vacíos", () => {
  assertContentError(fixture([meta("alpha")], { files: { "operations/alpha/body.en.md": null } }), "operations/alpha/body.en.md", "no existe");
  assertContentError(fixture([meta("alpha")], { files: { "operations/alpha/body.es.md": "  \n\n " } }), "operations/alpha/body.es.md");
});

test("rechaza fechas imposibles y URLs de fuente que no son http(s)", () => {
  assertContentError(fixture([meta("alpha", { publishedAt: "2026-02-30" })]), "operations/alpha/meta.json", "publishedAt");
  assertContentError(fixture([meta("alpha", { publishedAt: "2026-13-01" })]), "operations/alpha/meta.json", "publishedAt");
  assertContentError(
    fixture([meta("alpha", { sources: [{ url: "ftp://example.org", title: "Doc", type: "BOOK", credibility: 3 }] })]),
    "operations/alpha/meta.json", "sources[0].url",
  );
});

test("rechaza campos desconocidos, JSON roto y un tags.json inválido", () => {
  assertContentError(fixture([meta("alpha", { viewCount: 3 })]), "operations/alpha/meta.json", "viewCount");
  assertContentError(fixture([meta("alpha")], { files: { "operations/alpha/meta.json": "{ roto" } }), "operations/alpha/meta.json", "JSON");
  assertContentError(fixture([meta("alpha")], { tags: { cia: { name: "CIA" } } }), "tags.json", "nameEs");
});

// Recuentos derivados de content/: añadir una operación no debe romper los tests.
const CONTENT_DIR = path.join(process.cwd(), "content");
const operationFolderCount = fs
  .readdirSync(path.join(CONTENT_DIR, "operations"), { withFileTypes: true })
  .filter((entry) => entry.isDirectory()).length;

test("el content/ real carga todas sus carpetas con relaciones simétricas", () => {
  const { operations, tags } = loadContent(CONTENT_DIR);
  assert.equal(operations.length, operationFolderCount);
  assert.equal(tags.length, Object.keys(JSON.parse(fs.readFileSync(path.join(CONTENT_DIR, "tags.json"), "utf8"))).length);
  for (const op of operations) {
    for (const related of op.relatedOps) {
      const other = operations.find((o) => o.slug === related.slug);
      assert.ok(other?.relatedOps.some((r) => r.slug === op.slug), `${op.slug} ↔ ${related.slug}`);
    }
  }
  const relatedOf = (slug: string) => operations.find((o) => o.slug === slug)?.relatedOps.map((o) => o.slug);
  assert.deepEqual(relatedOf("mkultra"), ["project-artichoke"]);
  assert.deepEqual(relatedOf("project-artichoke"), ["mkultra"]);
  assert.deepEqual(relatedOf("operation-mockingbird"), ["cointelpro"]);
  assert.deepEqual(relatedOf("internet-research-agency"), ["cambridge-analytica"]);
  assert.equal(operations.find((o) => o.slug === "operation-paperclip")?.slugEs, "operacion-paperclip");
  assert.equal(tags.find((t) => t.slug === "latin-america")?.nameEs, "Latinoamérica");
});

test("la home muestra las 6 más recientes (desempate por nivel y título) y las estadísticas reales", () => {
  const { featuredOperations, stats } = getHomepageData();
  assert.equal(featuredOperations.length, 6);
  const { operations } = loadContent(CONTENT_DIR);
  assert.deepEqual(stats, {
    operationCount: operationFolderCount,
    eraCount: new Set(operations.map((op) => op.era)).size,
    sourceCount: operations.reduce((sum, op) => sum + op.sources.length, 0),
  });
  for (let i = 1; i < featuredOperations.length; i++) {
    const [a, b] = [featuredOperations[i - 1], featuredOperations[i]];
    const ordered =
      a.publishedAt > b.publishedAt ||
      (a.publishedAt === b.publishedAt &&
        (a.icebergLevel < b.icebergLevel || (a.icebergLevel === b.icebergLevel && a.title.localeCompare(b.title) <= 0)));
    assert.ok(ordered, `${a.slug} antes que ${b.slug}`);
  }
});

test("busca la operación por el slug del idioma", () => {
  assert.equal(getOperationForLocale("es", "operacion-paperclip")?.slug, "operation-paperclip");
  assert.equal(getOperationForLocale("en", "operation-paperclip")?.slugEs, "operacion-paperclip");
  assert.equal(getOperationForLocale("en", "operacion-paperclip"), undefined);
  assert.equal(getOperationForLocale("es", "operation-paperclip"), undefined);
});

test("expone slugs, resúmenes, actores e iceberg coherentes", () => {
  assert.equal(getAllOperationSlugs().length, operationFolderCount);
  assert.equal(getCatalogSummaries().length, operationFolderCount);
  assert.equal("bodyEn" in getCatalogSummaries()[0], false);
  const actors = getDistinctActors();
  assert.deepEqual(actors, [...new Set(actors)].sort());
  assert.ok(actors.includes("CIA"));
  const iceberg = getIcebergData();
  assert.equal(iceberg.length, operationFolderCount);
  for (let i = 1; i < iceberg.length; i++) {
    const [a, b] = [iceberg[i - 1], iceberg[i]];
    assert.ok(
      a.publishedAt > b.publishedAt || (a.publishedAt === b.publishedAt && a.title.localeCompare(b.title) <= 0),
      `${a.slug} antes que ${b.slug}`,
    );
  }
});
