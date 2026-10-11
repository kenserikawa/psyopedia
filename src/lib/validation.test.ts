import assert from "node:assert/strict";
import { test } from "node:test";
import {
  commentSchema,
  contributionSchema,
  editOperationSchema,
  moderationRequestSchema,
  newOperationSchema,
  operationFormData,
  sourceSchema,
} from "./validation";

const operation = {
  title: "Operation Example",
  titleEs: "Operación Ejemplo",
  bodyEn: "A documented operation.",
  excerpt: "An example.",
};

test("new operations normalize bilingual slugs and optional translations", () => {
  const parsed = newOperationSchema.parse(operation);
  assert.equal(parsed.slug, "operation-example");
  assert.equal(parsed.slugEs, "operacion-ejemplo");
  assert.equal(parsed.bodyEs, operation.bodyEn);
  assert.equal(parsed.excerptEs, operation.excerpt);
  assert.equal(parsed.icebergLevel, 3);
  assert.deepEqual(parsed.types, []);
});

test("contributions reject invalid shapes, enums, ranges, and protected fields", () => {
  for (const input of [null, [], "text", {}, { type: "EDIT_OPERATION", proposedData: {} }]) {
    assert.equal(contributionSchema.safeParse(input).success, false);
  }
  for (const fields of [
    { era: "INVALID" },
    { icebergLevel: 0 },
    { icebergLevel: 6 },
    { icebergLevel: 2.5 },
    { icebergLevel: NaN },
    { types: ["INVALID"] },
    { title: " " },
    { title: "!!!", titleEs: "" },
    { slug: "../../admin" },
    { moderationStatus: "APPROVED" },
    { contributedById: "someone-else" },
  ]) {
    assert.equal(newOperationSchema.safeParse({ ...operation, ...fields }).success, false);
  }
});

test("edits validate partial changes without injecting defaults", () => {
  assert.deepEqual(editOperationSchema.parse({ titleEs: "Nuevo título" }), {
    titleEs: "Nuevo título",
  });
  assert.equal(editOperationSchema.safeParse({}).success, false);
  assert.equal(editOperationSchema.safeParse({ viewCount: 100 }).success, false);
  assert.equal(editOperationSchema.safeParse({ title: "" }).success, false);
  assert.equal(contributionSchema.safeParse({
    type: "EDIT_OPERATION",
    operationId: "operation-id",
    proposedData: { excerpt: "Updated summary" },
  }).success, true);
});

test("sources require bounded credibility and HTTP(S) URLs", () => {
  assert.equal(sourceSchema.safeParse({
    sourceTitle: "A source",
    sourceUrl: "https://example.org/report",
  }).success, true);
  for (const fields of [
    { sourceUrl: "javascript:alert(1)" },
    { sourceUrl: "file:///report" },
    { sourceUrl: "not-a-url" },
    { credibility: 0 },
    { credibility: 6 },
    { credibility: 2.5 },
    { sourceType: "INVALID" },
  ]) {
    assert.equal(sourceSchema.safeParse({ sourceTitle: "A source", ...fields }).success, false);
  }
});

test("form conversion handles missing fields and rejects files or malformed numbers", () => {
  const form = new FormData();
  assert.doesNotThrow(() => operationFormData(form));
  assert.equal(newOperationSchema.safeParse(operationFormData(form)).success, false);
  Object.entries(operation).forEach(([key, value]) => form.set(key, value));
  form.set("actors", "CIA, , MI6 ");
  form.set("icebergLevel", "3abc");
  assert.equal(newOperationSchema.safeParse(operationFormData(form)).success, false);
  form.set("icebergLevel", "3");
  const parsed = newOperationSchema.parse(operationFormData(form));
  assert.deepEqual(parsed.actors, ["CIA", "MI6"]);
  form.set("title", new Blob(["not a title"]), "title.txt");
  assert.equal(newOperationSchema.safeParse(operationFormData(form)).success, false);
});

test("comments and review bodies reject null and incorrect runtime types", () => {
  for (const input of [null, { operationId: "id", body: 42 }, { operationId: "id", body: "  " }]) {
    assert.equal(commentSchema.safeParse(input).success, false);
  }
  assert.deepEqual(commentSchema.parse({ operationId: "id", body: " valid comment " }), {
    operationId: "id",
    body: "valid comment",
  });
  assert.equal(moderationRequestSchema.safeParse(null).success, false);
  assert.equal(moderationRequestSchema.safeParse({ status: "PENDING" }).success, false);
  assert.equal(moderationRequestSchema.safeParse({ status: "REJECTED", reviewNote: 42 }).success, false);
});
