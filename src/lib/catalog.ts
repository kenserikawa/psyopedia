import type { Operation, Tag } from "@/generated/prisma/client";
import { Era, OperationType, Outcome, OperationStatus } from "@/generated/prisma/enums";

export const CATALOG_SORTS = ["newest", "oldest", "most-viewed", "level", "title"] as const;
export const CATALOG_FILTER_PARAMS = ["search", "q", "level", "era", "type", "outcome", "status", "actor", "sort"] as const;

export interface CatalogFilters {
  search?: string;
  levels?: number[];
  eras?: Era[];
  types?: OperationType[];
  outcomes?: Outcome[];
  statuses?: OperationStatus[];
  actor?: string;
  sort?: (typeof CATALOG_SORTS)[number];
  page?: number;
  pageSize?: number;
  locale?: string;
}

export type OperationSummary = Pick<Operation,
  | "id" | "slug" | "slugEs" | "title" | "titleEs" | "excerpt" | "excerptEs"
  | "icebergLevel" | "era" | "status" | "types" | "actors" | "targets"
  | "outcome" | "aliases" | "coverImage" | "viewCount" | "createdAt"
  | "updatedAt" | "moderationStatus"
> & { tags: Tag[]; _count?: { sources: number } };

type CatalogSearchParams = URLSearchParams | Record<string, string | string[] | undefined>;

export function catalogSearchParams(input: CatalogSearchParams): URLSearchParams {
  if (input instanceof URLSearchParams) return new URLSearchParams(input);
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(input)) {
    for (const item of Array.isArray(value) ? value : value === undefined ? [] : [value]) {
      params.append(key, item);
    }
  }
  return params;
}

export type CatalogParseResult =
  | { success: true; filters: CatalogFilters }
  | { success: false; errors: { field: string; code: "invalid_value" }[] };

export function parseCatalogFilters(input: CatalogSearchParams): CatalogParseResult {
  const params = catalogSearchParams(input);
  const errors: { field: string; code: "invalid_value" }[] = [];
  const invalid = (field: string) => {
    if (!errors.some((error) => error.field === field)) {
      errors.push({ field, code: "invalid_value" });
    }
  };
  const single = (field: string) => {
    const values = params.getAll(field);
    if (values.length > 1) invalid(field);
    return values[0]?.trim();
  };
  const list = <T extends string>(field: string, allowed: readonly T[]): T[] => {
    const values = params.getAll(field).flatMap((value) => value.split(",").map((item) => item.trim()));
    const valid = values.filter((value): value is T => allowed.some((item) => item === value));
    if (values.length !== valid.length) invalid(field);
    return [...new Set(valid)];
  };
  const integer = (field: string, fallback: number, max: number) => {
    const value = single(field);
    if (value === undefined) return fallback;
    const number = Number(value);
    if (!/^\d+$/.test(value) || !Number.isSafeInteger(number) || number < 1 || number > max) {
      invalid(field);
      return fallback;
    }
    return number;
  };

  const search = single("search");
  const q = single("q");
  if (search !== undefined && q !== undefined && search !== q) invalid("search");
  const sort = single("sort") ?? "newest";
  const validSort = CATALOG_SORTS.find((value) => value === sort);
  if (!validSort) invalid("sort");
  const locale = single("locale");
  if (locale !== undefined && locale !== "en" && locale !== "es") invalid("locale");
  const filters: CatalogFilters = {
    search: search ?? q,
    levels: list("level", ["1", "2", "3", "4", "5"]).map(Number),
    eras: list("era", Object.values(Era)),
    types: list("type", Object.values(OperationType)),
    outcomes: list("outcome", Object.values(Outcome)),
    statuses: list("status", Object.values(OperationStatus)),
    actor: single("actor"),
    sort: validSort,
    page: integer("page", 1, Number.MAX_SAFE_INTEGER),
    pageSize: integer("pageSize", 12, 100),
    locale,
  };
  return errors.length ? { success: false, errors } : { success: true, filters };
}
