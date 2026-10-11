import assert from "node:assert/strict";
import { test } from "node:test";
import { catalogSearchParams, parseCatalogFilters } from "./catalog";

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
