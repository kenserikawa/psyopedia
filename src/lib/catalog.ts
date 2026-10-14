import { Era, OperationType, Outcome, OperationStatus } from "@/lib/content/enums";
import type { OperationSummary } from "@/lib/content/types";

export type { OperationSummary } from "@/lib/content/types";

export const CATALOG_SORTS = ["newest", "oldest", "level", "title"] as const;
export const CATALOG_FILTER_PARAMS = ["search", "q", "level", "era", "type", "outcome", "status", "actor", "sort"] as const;
export type CatalogSort = (typeof CATALOG_SORTS)[number];

export interface CatalogFilters {
  search?: string;
  levels?: number[];
  eras?: Era[];
  types?: OperationType[];
  outcomes?: Outcome[];
  statuses?: OperationStatus[];
  actor?: string;
  sort?: CatalogSort;
  page?: number;
  pageSize?: number;
  locale?: string;
}

export interface CatalogPage {
  operations: OperationSummary[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

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

/** Minúsculas y sin tildes, para comparar búsquedas en los dos idiomas. */
export function normalizeSearch(value: string): string {
  return value.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim();
}

const byId = (a: OperationSummary, b: OperationSummary) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0);

/** Filtra, ordena y pagina en memoria. Mismo contrato que la antigua consulta de Prisma. */
export function filterCatalog(all: readonly OperationSummary[], filters: CatalogFilters = {}): CatalogPage {
  const { levels, eras, types, outcomes, statuses, actor, sort = "newest", locale } = filters;
  const needle = normalizeSearch(filters.search ?? "");
  const matches = all.filter(
    (op) =>
      (!needle ||
        [op.title, op.titleEs, op.excerpt, op.excerptEs, ...op.aliases].some((text) =>
          normalizeSearch(text).includes(needle),
        )) &&
      (!levels?.length || levels.includes(op.icebergLevel)) &&
      (!eras?.length || eras.includes(op.era)) &&
      (!types?.length || op.types.some((type) => types.includes(type))) &&
      (!outcomes?.length || outcomes.includes(op.outcome)) &&
      (!statuses?.length || statuses.includes(op.status)) &&
      (!actor || op.actors.includes(actor)),
  );

  const compare: Record<CatalogSort, (a: OperationSummary, b: OperationSummary) => number> = {
    newest: (a, b) => b.publishedAt.localeCompare(a.publishedAt),
    oldest: (a, b) => a.publishedAt.localeCompare(b.publishedAt),
    level: (a, b) => a.icebergLevel - b.icebergLevel,
    title: (a, b) => (locale === "es" ? a.titleEs.localeCompare(b.titleEs) : a.title.localeCompare(b.title)),
  };
  const sorted = [...matches].sort((a, b) => compare[sort](a, b) || byId(a, b));

  const pageSize = Math.min(100, Math.max(1, Math.trunc(filters.pageSize ?? 12)));
  const total = sorted.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const page = Math.min(totalPages, Math.max(1, Math.trunc(filters.page ?? 1)));
  return { operations: sorted.slice((page - 1) * pageSize, page * pageSize), total, page, pageSize, totalPages };
}
