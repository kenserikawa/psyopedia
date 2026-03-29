import { prisma } from "@/lib/prisma";
import {
  Era,
  ModerationStatus,
  OperationType,
  Outcome,
  OperationStatus,
} from "@/generated/prisma";

export interface CatalogFilters {
  search?: string;
  levels?: number[];
  eras?: Era[];
  types?: OperationType[];
  outcomes?: Outcome[];
  statuses?: OperationStatus[];
  actor?: string;
  sort?: string;
}

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
      prisma.source.count(),
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
  const { search, levels, eras, types, outcomes, statuses, actor, sort } =
    filters;

  const where: NonNullable<Parameters<typeof prisma.operation.findMany>[0]>["where"] = {
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

  type OrderBy = NonNullable<Parameters<
    typeof prisma.operation.findMany
  >[0]>["orderBy"];

  let orderBy: OrderBy;
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
      orderBy = { title: "asc" };
      break;
    case "newest":
    default:
      orderBy = { createdAt: "desc" };
  }

  const operations = await prisma.operation.findMany({
    where,
    orderBy,
    include: {
      tags: true,
      _count: { select: { sources: true } },
    },
  });

  return operations;
}

// ─── Operation Detail ─────────────────────────────────

export async function getOperationBySlug(slug: string) {
  const operation = await prisma.operation.findUnique({
    where: { slug },
    include: {
      sources: true,
      tags: true,
      relatedOps: { include: { tags: true } },
    },
  });

  if (operation) {
    await prisma.operation.update({
      where: { slug },
      data: { viewCount: { increment: 1 } },
    });
  }

  return operation;
}

export async function getOperationBySlugEs(slugEs: string) {
  const operation = await prisma.operation.findUnique({
    where: { slugEs },
    include: {
      sources: true,
      tags: true,
      relatedOps: { include: { tags: true } },
    },
  });

  if (operation) {
    await prisma.operation.update({
      where: { slugEs },
      data: { viewCount: { increment: 1 } },
    });
  }

  return operation;
}

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
    },
    orderBy: { viewCount: "desc" },
  });

  return operations;
}

// ─── Admin Queries ────────────────────────────────────

export async function getAdminStats() {
  const [pendingContributions, pendingComments, totalOperations, totalUsers] =
    await Promise.all([
      prisma.contribution.count({ where: { status: "PENDING" } }),
      prisma.comment.count({ where: { status: "PENDING" } }),
      prisma.operation.count(),
      prisma.user.count(),
    ]);

  return { pendingContributions, pendingComments, totalOperations, totalUsers };
}

export async function getPendingContributions() {
  return prisma.contribution.findMany({
    where: { status: "PENDING" },
    include: { submittedBy: true, operation: true },
    orderBy: { createdAt: "desc" },
  });
}

export async function getAllOperationsAdmin() {
  return prisma.operation.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      slug: true,
      title: true,
      icebergLevel: true,
      era: true,
      status: true,
      moderationStatus: true,
      viewCount: true,
      createdAt: true,
    },
  });
}

// ─── Comment Queries ──────────────────────────────────

export async function getApprovedComments(operationId: string) {
  return prisma.comment.findMany({
    where: { operationId, status: "APPROVED" },
    include: { author: { select: { name: true, image: true } } },
    orderBy: { createdAt: "desc" },
  });
}

export async function getPendingComments() {
  return prisma.comment.findMany({
    where: { status: "PENDING" },
    include: {
      author: { select: { name: true } },
      operation: { select: { title: true, slug: true } },
    },
    orderBy: { createdAt: "desc" },
  });
}

// ─── Search ───────────────────────────────────────────

export async function searchOperations(query: string, locale: string = "en") {
  if (!query || query.trim().length < 2) {
    return [];
  }

  const searchTerm = query.trim();

  const operations = await prisma.operation.findMany({
    where: {
      moderationStatus: ModerationStatus.APPROVED,
      OR: [
        { title: { contains: searchTerm, mode: "insensitive" } },
        { titleEs: { contains: searchTerm, mode: "insensitive" } },
        { excerpt: { contains: searchTerm, mode: "insensitive" } },
        { excerptEs: { contains: searchTerm, mode: "insensitive" } },
        { aliases: { has: searchTerm } },
        { actors: { has: searchTerm } },
        { bodyEn: { contains: searchTerm, mode: "insensitive" } },
        { bodyEs: { contains: searchTerm, mode: "insensitive" } },
      ],
    },
    include: { tags: true },
    take: 20,
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
