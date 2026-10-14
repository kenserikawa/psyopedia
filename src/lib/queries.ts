import { prisma } from "@/lib/prisma";
import { cache } from "react";
import { ModerationStatus, Prisma } from "@/generated/prisma/client";
import type { CatalogFilters } from "@/lib/catalog";

export type { CatalogFilters } from "@/lib/catalog";

const operationSummarySelect = {
  id: true,
  slug: true,
  slugEs: true,
  title: true,
  titleEs: true,
  excerpt: true,
  excerptEs: true,
  icebergLevel: true,
  era: true,
  status: true,
  types: true,
  actors: true,
  targets: true,
  outcome: true,
  aliases: true,
  coverImage: true,
  viewCount: true,
  createdAt: true,
  updatedAt: true,
  moderationStatus: true,
  tags: true,
  _count: { select: { sources: true } },
} satisfies Prisma.OperationSelect;

// ─── Homepage ────────────────────────────────────────

export async function getHomepageData() {
  const [featuredOperations, operationCount, eraRows, sourceCount] =
    await Promise.all([
      prisma.operation.findMany({
        where: { moderationStatus: ModerationStatus.APPROVED },
        orderBy: { createdAt: "desc" },
        take: 6,
        include: { tags: true },
      }),
      prisma.operation.count({
        where: { moderationStatus: ModerationStatus.APPROVED },
      }),
      prisma.operation.findMany({
        where: { moderationStatus: ModerationStatus.APPROVED },
        select: { era: true },
        distinct: ["era"],
      }),
      prisma.source.count({
        where: { operation: { moderationStatus: ModerationStatus.APPROVED } },
      }),
    ]);

  return {
    featuredOperations,
    stats: {
      operationCount,
      eraCount: eraRows.length,
      sourceCount,
    },
  };
}

// ─── Catalog ─────────────────────────────────────────

export async function getCatalogOperations(filters: CatalogFilters = {}) {
  const { search, levels, eras, types, outcomes, statuses, actor, sort, locale } =
    filters;

  const where: Prisma.OperationWhereInput = {
    moderationStatus: ModerationStatus.APPROVED,
  };

  if (search) {
    where.OR = [
      { title: { contains: search, mode: "insensitive" } },
      { titleEs: { contains: search, mode: "insensitive" } },
      { excerpt: { contains: search, mode: "insensitive" } },
      { excerptEs: { contains: search, mode: "insensitive" } },
    ];
  }

  if (levels && levels.length > 0) {
    where.icebergLevel = { in: levels };
  }

  if (eras && eras.length > 0) {
    where.era = { in: eras };
  }

  if (types && types.length > 0) {
    where.types = { hasSome: types };
  }

  if (outcomes && outcomes.length > 0) {
    where.outcome = { in: outcomes };
  }

  if (statuses && statuses.length > 0) {
    where.status = { in: statuses };
  }

  if (actor) {
    where.actors = { has: actor };
  }

  let orderBy: Prisma.OperationOrderByWithRelationInput;
  switch (sort) {
    case "oldest":
      orderBy = { createdAt: "asc" };
      break;
    case "most-viewed":
      orderBy = { viewCount: "desc" };
      break;
    case "level":
      orderBy = { icebergLevel: "asc" };
      break;
    case "title":
      orderBy = locale === "es" ? { titleEs: "asc" } : { title: "asc" };
      break;
    case "newest":
    default:
      orderBy = { createdAt: "desc" };
  }

  const pageSize = Math.min(100, Math.max(1, Math.trunc(filters.pageSize ?? 12)));
  const total = await prisma.operation.count({ where });
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const page = Math.min(totalPages, Math.max(1, Math.trunc(filters.page ?? 1)));
  const operations = await prisma.operation.findMany({
    where,
    orderBy: [orderBy, { id: "asc" }],
    select: operationSummarySelect,
    skip: (page - 1) * pageSize,
    take: pageSize,
  });

  return { operations, total, page, pageSize, totalPages };
}

// ─── Operation Detail ─────────────────────────────────

export const getOperationBySlug = cache(async (slug: string) => {
  return prisma.operation.findUnique({
    where: { slug, moderationStatus: ModerationStatus.APPROVED },
    include: {
      sources: true,
      tags: true,
      relatedOps: {
        where: { moderationStatus: ModerationStatus.APPROVED },
        include: { tags: true },
      },
    },
  });
});

export const getOperationBySlugEs = cache(async (slugEs: string) => {
  return prisma.operation.findUnique({
    where: { slugEs, moderationStatus: ModerationStatus.APPROVED },
    include: {
      sources: true,
      tags: true,
      relatedOps: {
        where: { moderationStatus: ModerationStatus.APPROVED },
        include: { tags: true },
      },
    },
  });
});

// ─── Static Generation Helpers ────────────────────────

export async function getAllOperationSlugs() {
  return prisma.operation.findMany({
    where: { moderationStatus: ModerationStatus.APPROVED },
    select: { slug: true, slugEs: true },
  });
}

// ─── Iceberg ─────────────────────────────────────────

export async function getIcebergData() {
  const operations = await prisma.operation.findMany({
    where: { moderationStatus: ModerationStatus.APPROVED },
    select: {
      id: true,
      icebergLevel: true,
      title: true,
      titleEs: true,
      slug: true,
      slugEs: true,
      excerpt: true,
      excerptEs: true,
      era: true,
      status: true,
      // Ficha del panel de hover: permite explorar sin abrir la operación.
      types: true,
      outcome: true,
      actors: true,
      _count: { select: { sources: true } },
    },
    orderBy: { viewCount: "desc" },
  });

  return operations;
}

// ─── Filter Helpers ───────────────────────────────────

export async function getDistinctActors(): Promise<string[]> {
  const rows = await prisma.operation.findMany({
    where: { moderationStatus: ModerationStatus.APPROVED },
    select: { actors: true },
  });

  const actorSet = new Set<string>();
  for (const row of rows) {
    for (const actor of row.actors) {
      if (actor) actorSet.add(actor);
    }
  }

  return Array.from(actorSet).sort();
}
