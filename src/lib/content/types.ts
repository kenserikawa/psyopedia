import type { Era, OperationStatus, OperationType, Outcome, SourceType } from "./enums";

export interface Tag {
  /** Igual al slug: mantiene válidos los key={tag.id} de los componentes. */
  id: string;
  slug: string;
  name: string;
  nameEs: string;
}

export interface Source {
  /** "<slug de la operación>-<índice>" */
  id: string;
  url: string | null;
  title: string;
  type: SourceType;
  credibility: number;
}

export interface OperationSummary {
  /** Igual al slug en inglés. */
  id: string;
  slug: string;
  slugEs: string;
  title: string;
  titleEs: string;
  aliases: string[];
  icebergLevel: number;
  era: Era;
  types: OperationType[];
  actors: string[];
  targets: string[];
  outcome: Outcome;
  status: OperationStatus;
  excerpt: string;
  excerptEs: string;
  coverImage: string | null;
  /** YYYY-MM-DD */
  publishedAt: string;
  /** YYYY-MM-DD; igual a publishedAt si meta.json no lo trae. */
  updatedAt: string;
  tags: Tag[];
  sourceCount: number;
}

export interface Operation extends OperationSummary {
  bodyEn: string;
  bodyEs: string;
  sources: Source[];
  relatedOps: OperationSummary[];
}

export interface ContentStore {
  /** Ordenadas por slug. */
  operations: Operation[];
  /** Mismo orden que operations, sin cuerpos, fuentes ni relacionadas. */
  summaries: OperationSummary[];
  tags: Tag[];
}
