import "dotenv/config";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { test } from "node:test";
import { encode } from "next-auth/jwt";

test("local catalog, publication, visits, validation, and atomic moderation", {
  skip: process.env.RUN_LOCAL_INTEGRATION !== "1",
}, async () => {
  const base = new URL(process.env.TEST_BASE_URL || "http://127.0.0.1:3100");
  const database = new URL(process.env.DATABASE_URL || "");
  const localHosts = new Set(["localhost", "127.0.0.1", "[::1]"]);
  assert.ok(localHosts.has(base.hostname) && localHosts.has(database.hostname),
    "Integration regressions may only run against a local server and database");
  const secret = process.env.TEST_AUTH_SECRET;
  assert.ok(secret, "TEST_AUTH_SECRET must match the local server AUTH_SECRET");
  const authSecret = secret;

  const { prisma } = await import("../src/lib/prisma");
  const prefix = `regression-${randomUUID()}`;
  const authorId = `${prefix}-author`;
  const moderatorId = `${prefix}-moderator`;
  const operationId = `${prefix}-operation`;
  const hiddenId = `${prefix}-hidden`;
  const createdSlug = `${prefix}-created`;

  async function cookie(id: string, role: string) {
    const token = await encode({
      token: { sub: id, role, reputation: 0 },
      secret: authSecret,
      salt: "authjs.session-token",
    });
    return `authjs.session-token=${token}`;
  }
  const authorCookie = await cookie(authorId, "USER");
  const moderatorCookie = await cookie(moderatorId, "MODERATOR");

  async function jsonRequest(path: string, method: string, body: unknown, session = authorCookie) {
    return fetch(new URL(path, base), {
      method,
      headers: { Cookie: session, "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  }
  async function submit(data: unknown) {
    const response = await jsonRequest("/api/contributions", "POST", data);
    assert.equal(response.status, 201, await response.clone().text());
    const contribution: { id: string } = await response.json();
    return contribution.id;
  }
  async function review(id: string, status = "APPROVED") {
    return jsonRequest(`/api/contributions/${id}`, "PATCH", { status }, moderatorCookie);
  }
  const operationData = {
    title: prefix,
    titleEs: prefix,
    aliases: [],
    icebergLevel: 2,
    era: "MODERN" as const,
    types: [],
    actors: [],
    targets: [],
    outcome: "UNKNOWN" as const,
    status: "ALLEGED" as const,
    bodyEn: "Regression article body.",
    bodyEs: "Artículo para regresiones.",
    excerpt: "Regression summary.",
    excerptEs: "Resumen para regresiones.",
  };

  try {
    await prisma.user.createMany({
      data: [
        { id: authorId, email: `${authorId}@example.invalid` },
        { id: moderatorId, email: `${moderatorId}@example.invalid`, role: "MODERATOR" },
      ],
    });
    await prisma.operation.createMany({
      data: [
        { ...operationData, id: operationId, slug: prefix, slugEs: `${prefix}-es` },
        { ...operationData, id: hiddenId, slug: `${prefix}-hidden`, slugEs: `${prefix}-hidden-es`, moderationStatus: "PENDING" },
      ],
    });
    await prisma.operation.update({
      where: { id: operationId },
      data: { relatedOps: { connect: { id: hiddenId } } },
    });

    const unauthenticated = await fetch(new URL("/api/contributions", base), {
      method: "POST", headers: { "Content-Type": "application/json" }, body: "{}",
    });
    assert.equal(unauthenticated.status, 401);
    for (const data of [null, { type: "NEW_OPERATION", proposedData: { title: 42 } }]) {
      assert.equal((await jsonRequest("/api/contributions", "POST", data)).status, 400);
    }
    assert.equal((await jsonRequest("/api/comments", "POST", {
      operationId, body: 42,
    })).status, 400);
    assert.equal((await jsonRequest("/api/comments", "POST", {
      operationId: hiddenId, body: "Must not be accepted",
    })).status, 404);

    for (const query of ["era=INVALID", "level=2.5", "pageSize=101"]) {
      assert.equal((await fetch(new URL(`/api/operations?${query}`, base))).status, 400);
    }
    for (const locale of ["en", "es"]) {
      const page = await fetch(new URL(`/${locale}/catalog?era=INVALID`, base));
      assert.equal(page.status, 200);
      assert.match(await page.text(), /role="alert"/);
    }
    const firstPage = await fetch(new URL("/api/operations?pageSize=1&page=1", base));
    const secondPage = await fetch(new URL("/api/operations?pageSize=1&page=2", base));
    const first: { id: string; bodyEn?: string }[] = await firstPage.json();
    const second: { id: string }[] = await secondPage.json();
    assert.equal(first.length, 1);
    assert.notEqual(first[0].id, second[0].id);
    assert.equal(first[0].bodyEn, undefined);
    assert.equal(firstPage.headers.get("X-Page-Size"), "1");
    assert.ok(Number(firstPage.headers.get("X-Total-Count")) >= 1);

    const initialOperation = await prisma.operation.findUniqueOrThrow({ where: { id: operationId } });
    const detail = await fetch(new URL(`/api/operations/${prefix}`, base));
    const article: { relatedOps: unknown[] } = await detail.json();
    assert.equal(detail.status, 200);
    assert.deepEqual(article.relatedOps, []);
    for (const status of ["PENDING", "REJECTED"] as const) {
      await prisma.operation.update({ where: { id: hiddenId }, data: { moderationStatus: status } });
      for (const path of [
        `/api/operations/${prefix}-hidden`,
        `/api/og/${prefix}-hidden`,
        `/en/catalog/${prefix}-hidden`,
        `/es/catalog/${prefix}-hidden-es`,
      ]) {
        const response = await fetch(new URL(path, base));
        assert.equal(response.status, 404, path);
        await response.arrayBuffer();
      }
    }
    assert.equal((await prisma.operation.findUniqueOrThrow({ where: { id: operationId } })).viewCount, initialOperation.viewCount);
    const prefetch = await fetch(new URL(`/en/catalog/${prefix}`, base), {
      headers: { purpose: "prefetch" },
    });
    await prefetch.text();
    assert.equal((await prisma.operation.findUniqueOrThrow({ where: { id: operationId } })).viewCount, initialOperation.viewCount);
    const page = await fetch(new URL(`/es/catalog/${prefix}-es`, base));
    assert.equal(page.status, 200);
    await page.text();
    // after() runs once the response completes; allow the local database write to finish.
    for (let attempt = 0; attempt < 30; attempt++) {
      const current = await prisma.operation.findUniqueOrThrow({ where: { id: operationId } });
      if (current.viewCount === initialOperation.viewCount + 1) break;
      await new Promise((resolve) => setTimeout(resolve, 50));
    }
    const viewed = await prisma.operation.findUniqueOrThrow({ where: { id: operationId } });
    assert.equal(viewed.viewCount, initialOperation.viewCount + 1);
    assert.equal(viewed.updatedAt.getTime(), initialOperation.updatedAt.getTime());

    const editId = await submit({
      type: "EDIT_OPERATION", operationId,
      proposedData: { titleEs: "Edición aprobada" },
    });
    assert.equal((await jsonRequest(`/api/contributions/${editId}`, "PATCH", { status: "APPROVED" })).status, 403);
    assert.equal((await review(editId)).status, 200);
    const edited = await prisma.operation.findUniqueOrThrow({ where: { id: operationId } });
    assert.equal(edited.titleEs, "Edición aprobada");
    assert.equal(edited.bodyEn, initialOperation.bodyEn);
    assert.equal((await review(editId, "REJECTED")).status, 400);

    const sourceId = await submit({
      type: "ADD_SOURCE", operationId,
      proposedData: { sourceTitle: "Regression source", sourceUrl: "https://example.org" },
    });
    const before = await prisma.user.findUniqueOrThrow({ where: { id: authorId } });
    const approvals = await Promise.all([review(sourceId), review(sourceId)]);
    assert.deepEqual(approvals.map((response) => response.status).sort(), [200, 400]);
    assert.equal(await prisma.source.count({ where: { operationId } }), 1);
    assert.equal((await prisma.user.findUniqueOrThrow({ where: { id: authorId } })).reputation, before.reputation + 5);

    const duplicateId = await submit({
      type: "NEW_OPERATION",
      proposedData: { ...operationData, slug: prefix, slugEs: `${prefix}-es` },
    });
    const beforeDuplicate = await prisma.user.findUniqueOrThrow({ where: { id: authorId } });
    assert.equal((await review(duplicateId)).status, 400);
    assert.equal((await prisma.contribution.findUniqueOrThrow({ where: { id: duplicateId } })).status, "PENDING");
    assert.equal((await prisma.user.findUniqueOrThrow({ where: { id: authorId } })).reputation, beforeDuplicate.reputation);
    assert.equal((await review(duplicateId, "REJECTED")).status, 200);

    const newId = await submit({
      type: "NEW_OPERATION",
      proposedData: { title: createdSlug, bodyEn: "New article.", excerpt: "New summary." },
    });
    assert.equal((await review(newId)).status, 200);
    const created = await prisma.operation.findUniqueOrThrow({ where: { slug: createdSlug } });
    assert.equal(created.contributedById, authorId);
    assert.equal(created.bodyEs, created.bodyEn);
  } finally {
    // Only remove this run's fixtures, never seed or user-owned records.
    await prisma.contribution.deleteMany({ where: { submittedById: authorId } });
    await prisma.operation.deleteMany({
      where: { OR: [{ id: { in: [operationId, hiddenId] } }, { contributedById: authorId }] },
    });
    await prisma.user.deleteMany({ where: { id: { in: [authorId, moderatorId] } } });
    await prisma.$disconnect();
  }
});
