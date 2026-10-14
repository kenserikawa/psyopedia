import fs from "node:fs";
import path from "node:path";
import type { z } from "zod";
import { bodySchema, metaSchema, tagsSchema, type Meta } from "./schema";
import type { ContentStore, Operation, OperationSummary, Tag } from "./types";

/** Error de contenido: el mensaje empieza por la ruta del fichero culpable. */
export class ContentError extends Error {
  constructor(file: string, detail: string) {
    super(`${file}: ${detail}`);
    this.name = "ContentError";
  }
}

function formatPath(issuePath: readonly PropertyKey[]): string {
  return issuePath.reduce<string>(
    (acc, key) => (typeof key === "number" ? `${acc}[${key}]` : acc ? `${acc}.${String(key)}` : String(key)),
    "",
  );
}

function parse<T>(schema: z.ZodType<T>, value: unknown, file: string): T {
  const result = schema.safeParse(value);
  if (!result.success) {
    const issue = result.error.issues[0];
    throw new ContentError(file, `${formatPath(issue.path) || "(raíz)"}: ${issue.message}`);
  }
  return result.data;
}

function readText(file: string): string {
  try {
    return fs.readFileSync(file, "utf8");
  } catch {
    throw new ContentError(file, "no existe");
  }
}

function readJson(file: string): unknown {
  const text = readText(file);
  try {
    return JSON.parse(text);
  } catch (error) {
    throw new ContentError(file, `JSON inválido (${(error as Error).message})`);
  }
}

function toSummary(meta: Meta, tagBySlug: ReadonlyMap<string, Tag>): OperationSummary {
  return {
    id: meta.slug,
    slug: meta.slug,
    slugEs: meta.slugEs,
    title: meta.title,
    titleEs: meta.titleEs,
    aliases: meta.aliases,
    icebergLevel: meta.icebergLevel,
    era: meta.era,
    types: meta.types,
    actors: meta.actors,
    targets: meta.targets,
    outcome: meta.outcome,
    status: meta.status,
    excerpt: meta.excerpt,
    excerptEs: meta.excerptEs,
    coverImage: meta.coverImage ?? null,
    publishedAt: meta.publishedAt,
    updatedAt: meta.updatedAt ?? meta.publishedAt,
    tags: meta.tags.map((slug) => tagBySlug.get(slug)!),
    sourceCount: meta.sources.length,
  };
}

/** Lee y valida un directorio de contenido. Cualquier incoherencia lanza ContentError. */
export function loadContent(dir: string): ContentStore {
  const tagsFile = path.join(dir, "tags.json");
  const tags: Tag[] = Object.entries(parse(tagsSchema, readJson(tagsFile), tagsFile)).map(([slug, tag]) => ({
    id: slug,
    slug,
    name: tag.name,
    nameEs: tag.nameEs,
  }));
  const tagBySlug = new Map(tags.map((tag) => [tag.slug, tag]));

  const operationsDir = path.join(dir, "operations");
  if (!fs.existsSync(operationsDir)) throw new ContentError(operationsDir, "no existe");
  const folders = fs
    .readdirSync(operationsDir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort();

  const entries = folders.map((folder) => {
    const base = path.join(operationsDir, folder);
    const metaFile = path.join(base, "meta.json");
    const meta = parse(metaSchema, readJson(metaFile), metaFile);
    if (meta.slug !== folder) {
      throw new ContentError(metaFile, `slug: "${meta.slug}" no coincide con la carpeta "${folder}"`);
    }
    meta.tags.forEach((slug, index) => {
      if (!tagBySlug.has(slug)) throw new ContentError(metaFile, `tags[${index}]: "${slug}" no existe en tags.json`);
    });
    const bodyEnFile = path.join(base, "body.en.md");
    const bodyEsFile = path.join(base, "body.es.md");
    return {
      meta,
      metaFile,
      bodyEn: parse(bodySchema, readText(bodyEnFile), bodyEnFile),
      bodyEs: parse(bodySchema, readText(bodyEsFile), bodyEsFile),
    };
  });

  // El slug no puede repetirse porque es el nombre de la carpeta; el slugEs sí.
  const slugEsOwner = new Map<string, string>();
  for (const { meta, metaFile } of entries) {
    const owner = slugEsOwner.get(meta.slugEs);
    if (owner) throw new ContentError(metaFile, `slugEs: "${meta.slugEs}" repetido (también en ${owner})`);
    slugEsOwner.set(meta.slugEs, metaFile);
  }

  // La relación se declara una vez y se muestra en las dos fichas.
  const related = new Map(entries.map(({ meta }) => [meta.slug, new Set<string>()]));
  for (const { meta, metaFile } of entries) {
    meta.related.forEach((slug, index) => {
      if (slug === meta.slug) {
        throw new ContentError(metaFile, `related[${index}]: una operación no puede relacionarse consigo misma`);
      }
      const other = related.get(slug);
      if (!other) throw new ContentError(metaFile, `related[${index}]: "${slug}" no existe`);
      related.get(meta.slug)!.add(slug);
      other.add(meta.slug);
    });
  }

  const summaries = entries.map(({ meta }) => toSummary(meta, tagBySlug));
  const summaryBySlug = new Map(summaries.map((summary) => [summary.slug, summary]));
  const operations: Operation[] = entries.map(({ meta, bodyEn, bodyEs }, index) => ({
    ...summaries[index],
    bodyEn,
    bodyEs,
    sources: meta.sources.map((source, i) => ({ id: `${meta.slug}-${i}`, ...source })),
    relatedOps: [...related.get(meta.slug)!].sort().map((slug) => summaryBySlug.get(slug)!),
  }));

  return { operations, summaries, tags };
}
