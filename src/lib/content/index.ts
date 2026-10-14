// API de contenido para páginas y route handlers. Usa fs: solo se importa desde código de
// servidor (si un componente cliente la importara, el build fallaría).
import path from "node:path";
import { loadContent } from "./load";
import type { ContentStore, Operation, OperationSummary } from "./types";

let store: ContentStore | undefined;

function getStore(): ContentStore {
  store ??= loadContent(path.join(process.cwd(), "content"));
  return store;
}

const byNewest = (a: OperationSummary, b: OperationSummary) =>
  b.publishedAt.localeCompare(a.publishedAt) || a.icebergLevel - b.icebergLevel || a.title.localeCompare(b.title);

export function getHomepageData() {
  const { summaries, operations } = getStore();
  return {
    featuredOperations: [...summaries].sort(byNewest).slice(0, 6),
    stats: {
      operationCount: summaries.length,
      eraCount: new Set(summaries.map((op) => op.era)).size,
      sourceCount: operations.reduce((sum, op) => sum + op.sources.length, 0),
    },
  };
}

export function getCatalogSummaries(): OperationSummary[] {
  return getStore().summaries;
}

export function getDistinctActors(): string[] {
  return [...new Set(getStore().summaries.flatMap((op) => op.actors))].sort();
}

export function getOperationForLocale(locale: string, slug: string): Operation | undefined {
  return getStore().operations.find((op) => (locale === "es" ? op.slugEs : op.slug) === slug);
}

export function getAllOperationSlugs(): { slug: string; slugEs: string }[] {
  return getStore().summaries.map(({ slug, slugEs }) => ({ slug, slugEs }));
}

export function getIcebergData(): OperationSummary[] {
  return [...getStore().summaries].sort(
    (a, b) => b.publishedAt.localeCompare(a.publishedAt) || a.title.localeCompare(b.title),
  );
}

export type { Operation, OperationSummary, Source, Tag } from "./types";
