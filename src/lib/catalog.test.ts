import assert from "node:assert/strict";
import { test } from "node:test";
import { catalogSearchParams, filterCatalog, normalizeSearch, parseCatalogFilters } from "./catalog";
import type { CatalogFilters, OperationSummary } from "./catalog";

test("catalog parsing shares defaults and supports repeated or comma-separated filters", () => {
  const parsed = parseCatalogFilters(new URLSearchParams(
    "era=MODERN&era=COLD_WAR&level=1,3&level=3&status=ALLEGED&locale=es&q=example&page=2"
  ));
  assert.ok(parsed.success);
  assert.deepEqual(parsed.filters.eras, ["MODERN", "COLD_WAR"]);
  assert.deepEqual(parsed.filters.levels, [1, 3]);
  assert.deepEqual(parsed.filters.statuses, ["ALLEGED"]);
  assert.equal(parsed.filters.search, "example");
  assert.equal(parsed.filters.page, 2);
  assert.equal(parsed.filters.pageSize, 12);
  assert.equal(parsed.filters.locale, "es");
});

test("catalog rejects invalid enums, fractional levels, repeated scalar values and pagination", () => {
  for (const query of [
    "era=INVALID", "era=MODERN,INVALID", "type=INVALID", "outcome=INVALID",
    "status=INVALID", "level=0", "level=6", "level=2.5", "level=NaN",
    "page=0", "page=-1", "page=1.5", "page=Infinity", "page=1e6",
    "page=9007199254740992", "page=1&page=2",
    "pageSize=0", "pageSize=101", "pageSize=1.5",
    "locale=fr", "sort=INVALID", "search=first&q=second",
  ]) {
    const result = parseCatalogFilters(new URLSearchParams(query));
    assert.equal(result.success, false, query);
    if (!result.success) assert.ok(result.errors.length > 0);
  }
});

test("catalog parameter conversion preserves arrays and unrelated URL parameters", () => {
  const params = catalogSearchParams({
    era: ["MODERN", "COLD_WAR"],
    search: "two words",
    page: "2",
    utm_source: "reference",
    missing: undefined,
  });
  const copy = catalogSearchParams(params);
  copy.set("page", "3");
  assert.equal(params.get("page"), "2");
  assert.equal(copy.get("page"), "3");
  assert.deepEqual(copy.getAll("era"), ["MODERN", "COLD_WAR"]);
  assert.equal(copy.get("search"), "two words");
  assert.equal(copy.get("utm_source"), "reference");
  assert.equal(copy.has("missing"), false);
});

function summary(id: string, overrides: Partial<OperationSummary> = {}): OperationSummary {
  return {
    id, slug: id, slugEs: `${id}-es`, title: id, titleEs: id, aliases: [], icebergLevel: 1,
    era: "COLD_WAR", types: ["PROPAGANDA"], actors: ["CIA"], targets: [], outcome: "SUCCESSFUL",
    status: "DECLASSIFIED", excerpt: "", excerptEs: "", coverImage: null,
    publishedAt: "2026-03-29", updatedAt: "2026-03-29", tags: [], sourceCount: 0,
    ...overrides,
  };
}

const sample = [
  summary("paperclip", {
    title: "Operation Paperclip", titleEs: "Operacion Paperclip", era: "WWII", icebergLevel: 1,
    publishedAt: "2026-01-10", actors: ["United States", "OSS"],
  }),
  summary("infektion", {
    title: "Operation INFEKTION", titleEs: "Operación INFEKTION", aliases: ["Operation Denver"],
    types: ["DISINFORMATION"], icebergLevel: 2, publishedAt: "2026-02-10", actors: ["Soviet Union", "KGB"],
  }),
  summary("blue-beam", {
    title: "Project Blue Beam", titleEs: "Blue Beam (proyecto)", era: "MODERN", types: ["DECEPTION", "PROPAGANDA"],
    icebergLevel: 5, publishedAt: "2026-02-10", outcome: "UNKNOWN", status: "ALLEGED", actors: ["NASA"],
  }),
];
const ids = (filters: CatalogFilters) => filterCatalog(sample, filters).operations.map((o) => o.id);

test("filterCatalog busca sin distinguir tildes ni mayúsculas en títulos, resúmenes y alias", () => {
  assert.equal(normalizeSearch("  OPERACIÓN "), "operacion");
  assert.deepEqual(ids({ search: "operacion" }), ["infektion", "paperclip"]);
  assert.deepEqual(ids({ search: "OPERACIÓN" }), ["infektion", "paperclip"]);
  assert.deepEqual(ids({ search: "denver" }), ["infektion"]);
  assert.equal(filterCatalog(sample, { search: "   " }).total, 3);
});

test("filterCatalog combina filtros de nivel, era, tipo, resultado, estado y actor", () => {
  assert.deepEqual(ids({ levels: [1, 5] }), ["blue-beam", "paperclip"]);
  assert.deepEqual(ids({ eras: ["WWII"] }), ["paperclip"]);
  assert.deepEqual(ids({ types: ["DECEPTION", "DISINFORMATION"] }), ["blue-beam", "infektion"]);
  assert.deepEqual(ids({ outcomes: ["UNKNOWN"] }), ["blue-beam"]);
  assert.deepEqual(ids({ statuses: ["DECLASSIFIED"], actor: "KGB" }), ["infektion"]);
  assert.deepEqual(ids({ actor: "Nadie" }), []);
});

test("filterCatalog ordena con desempate estable por id y título según idioma", () => {
  assert.deepEqual(ids({ sort: "newest" }), ["blue-beam", "infektion", "paperclip"]);
  assert.deepEqual(ids({ sort: "oldest" }), ["paperclip", "blue-beam", "infektion"]);
  assert.deepEqual(ids({ sort: "level" }), ["paperclip", "infektion", "blue-beam"]);
  assert.deepEqual(ids({ sort: "title" }), ["infektion", "paperclip", "blue-beam"]);
  assert.deepEqual(ids({ sort: "title", locale: "es" }), ["blue-beam", "infektion", "paperclip"]);
});

test("filterCatalog pagina y acota la página fuera de rango", () => {
  const many = Array.from({ length: 25 }, (_, i) => summary(`op-${String(i).padStart(2, "0")}`));
  const first = filterCatalog(many, {});
  assert.deepEqual([first.total, first.page, first.pageSize, first.totalPages, first.operations.length], [25, 1, 12, 3, 12]);
  const last = filterCatalog(many, { page: 99 });
  assert.equal(last.page, 3);
  assert.deepEqual(last.operations.map((o) => o.id), ["op-24"]);
  assert.equal(filterCatalog(many, { pageSize: 100 }).totalPages, 1);
  assert.deepEqual(filterCatalog([], { page: 5 }), { operations: [], total: 0, page: 1, pageSize: 12, totalPages: 1 });
});

test("el orden por visitas ya no existe", () => {
  assert.equal(parseCatalogFilters(new URLSearchParams("sort=most-viewed")).success, false);
});
