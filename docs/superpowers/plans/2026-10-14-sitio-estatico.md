# Psyopedia estática — plan de implementación

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Convertir Psyopedia en un sitio exportado a HTML puro, sin base de datos ni usuarios, con el contenido en ficheros del repo y desplegado en GitHub Pages.

**Architecture:** Un loader propio (`src/lib/content/`) lee y valida con Zod `content/` en el build y expone la misma API que el antiguo `queries.ts`. Next.js 16 exporta con `output: "export"`; el catálogo filtra en el navegador; las URLs salen de una sola variable (`NEXT_PUBLIC_SITE_URL`) cuya ruta es el `basePath`. Se elimina todo lo de usuarios (NextAuth, comentarios, contribuciones, admin) y la base de datos (Prisma, Postgres).

**Tech Stack:** Next.js 16.2.1 (App Router, Turbopack), React 19.2.4, next-intl 4.8, Zod 4.3, `next/og`, Node test runner + tsx, GitHub Actions + GitHub Pages.

**Spec:** `docs/superpowers/specs/2026-10-14-sitio-estatico-design.md`

## Global Constraints

- Rama de trabajo: `feat/sitio-estatico`. No se toca `master`.
- No se añade ninguna dependencia nueva de npm. Solo se eliminan.
- Node 22 en CI (`actions/setup-node` con `node-version: 22`).
- `next.config.ts`: `output: "export"`, `trailingSlash: true`, `images: { unoptimized: true }`.
- Una sola variable de entorno: `NEXT_PUBLIC_SITE_URL`. Por defecto `https://psyopedia.org`; en CI, la variable del repo `SITE_URL` o `https://kenserikawa.github.io/psyopedia`.
- Slugs (`slug`, `slugEs`, claves de `tags.json`): `^[a-z0-9]+(?:-[a-z0-9]+)*$`. La carpeta de cada operación se llama como su `slug`.
- El contenido real tiene **46 operaciones** y **43 etiquetas**; los tests lo fijan.
- `npm test` = `tsx --test src/lib/*.test.ts`. Los tests nuevos de unidad viven en `src/lib/*.test.ts` para no tocar el glob.
- Nunca ejecutar `next build` con `next dev` en marcha: comparten `.next` y se corrompen.
- Antes de levantar un servidor en un puerto: `ccres comprobar puerto:<n>`; si está libre, `ccres reservar puerto:<n> --hasta 2h --motivo "psyopedia estática"`, y `ccres liberar puerto:<n>` al terminar. Si está ocupado, no usarlo y avisar al usuario.
- Borrar ficheros versionados con `git rm -r`. Para lo no versionado (`src/generated/`) usar `rm -r`; si el permiso se deniega, pedir al usuario que lo ejecute con `! rm -r src/generated`.
- Cada commit termina con la línea `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>` (segundo `-m`).
- Mensajes de commit en español con prefijo convencional (`feat(...)`, `refactor`, `chore`, `docs`, `test`).
- Línea base medida antes de empezar: `npm run lint` 0 errores (4 avisos previos), `npx tsc --noEmit` limpio, `npm test` 20/20.

## Review Focus

1. **URLs viejas o editadas a mano en el catálogo** (`?sort=most-viewed`, `?page=99`, `?search=%20%20`): un orden que ya no existe muestra el aviso de filtros inválidos, una página fuera de rango se acota a la última y una búsqueda de solo espacios equivale a no buscar. → tests en la Task 6.
2. **Búsqueda con tildes y mayúsculas en cualquier dirección**: "OPERACIÓN" encuentra "Operacion Paperclip" y "operacion" encuentra "Operación INFEKTION". → test en la Task 6.
3. **Variantes de `NEXT_PUBLIC_SITE_URL`** (barra final, dominio raíz, vacía): nunca sale `//` en una URL, y el `basePath` es `/psyopedia` o `""`. → tests en la Task 4.
4. **Idiomas del navegador en la redirección de `/`** (`es-ES`, `es-419`, `ES`, `ca-ES`, lista vacía con `navigator.language`): solo el español como primera preferencia lleva a `/es/`. → test en la Task 4.
5. **Operación sin etiquetas, fuentes ni relacionadas**: carga con listas vacías, `sourceCount` 0 y sin relacionadas. → test en la Task 1.

---

## Mapa de ficheros

**Nuevos**

| Fichero | Responsabilidad |
|---------|-----------------|
| `content/tags.json` | Diccionario de etiquetas |
| `content/operations/<slug>/{meta.json,body.en.md,body.es.md}` | Una operación (×46) |
| `src/lib/content/enums.ts` | Enums de dominio (sustituyen a `@/generated/prisma/enums`); usable en cliente |
| `src/lib/content/types.ts` | `Tag`, `Source`, `OperationSummary`, `Operation`, `ContentStore` |
| `src/lib/content/schema.ts` | Esquemas Zod de `meta.json`, `tags.json` y cuerpos |
| `src/lib/content/load.ts` | `loadContent(dir)` y `ContentError` |
| `src/lib/content/index.ts` | API de servidor para páginas (lee `content/` una vez por proceso) |
| `src/lib/content.test.ts` | Tests del loader y de la API |
| `src/lib/site.ts` | `SITE_URL`, `BASE_PATH`, `pageUrl`, `asset`, `ogImageUrl`, `rootRedirectScript` |
| `src/lib/site.test.ts` | Tests de URLs y de la redirección de la raíz |
| `src/lib/og.tsx` | Plantillas de imagen OG (home y operación) |
| `src/components/catalog/CatalogLayout.tsx` | Maquetación del catálogo (filtros móvil/escritorio + resultados) |
| `src/components/catalog/CatalogResults.tsx` | Rejilla, aviso de filtros inválidos y paginación |
| `src/components/catalog/CatalogBrowser.tsx` | Cliente: lee la URL y filtra |
| `src/app/page.tsx` | Raíz `/`: redirección por idioma |
| `src/app/og/[locale]/home.png/route.ts` | OG de la home |
| `src/app/og/[locale]/catalog/[file]/route.ts` | OG de cada operación |
| `tests/static-export.test.ts` | Inspección de `out/` tras el build |
| `public/.nojekyll` | Evita Jekyll en GitHub Pages |
| `.github/workflows/deploy.yml` | Build, tests y despliegue |

**Se borran:** `src/app/api/`, `src/app/[locale]/admin/`, `src/app/[locale]/contribute/`, `src/app/[locale]/[...rest]/`, `src/app/[locale]/opengraph-image.tsx`, `src/middleware.ts`, `src/lib/{actions/,auth.ts,auth-utils.ts,comments.ts,contributions.ts,revalidation.ts,validation.ts,validation.test.ts,queries.ts,prisma.ts,env.ts}`, `src/components/{admin/,auth/,contribute/,operation/CommentSection.tsx}`, `src/types/next-auth.d.ts`, `tests/local.integration.test.ts`, `prisma/`, `prisma.config.ts`, `docker-compose.yml`, `src/generated/`.

---

### Task 1: Capa de contenido — enums, tipos, esquema y loader

**Files:**
- Create: `src/lib/content/enums.ts`, `src/lib/content/types.ts`, `src/lib/content/schema.ts`, `src/lib/content/load.ts`
- Test: `src/lib/content.test.ts`

**Interfaces:**
- Consumes: nada.
- Produces:
  - `enums.ts`: consts + tipos homónimos `Era`, `OperationType`, `Outcome`, `OperationStatus`, `SourceType`.
  - `types.ts`: `Tag { id, slug, name, nameEs }`, `Source { id, url: string | null, title, type: SourceType, credibility: number }`, `OperationSummary` (ver código), `Operation extends OperationSummary { bodyEn, bodyEs, sources: Source[], relatedOps: OperationSummary[] }`, `ContentStore { operations: Operation[]; summaries: OperationSummary[]; tags: Tag[] }`.
  - `load.ts`: `loadContent(dir: string): ContentStore`, `class ContentError extends Error` (mensaje `"<ruta del fichero>: <detalle>"`).
  - `schema.ts`: `metaSchema`, `tagsSchema`, `bodySchema`, `type Meta`.

- [ ] **Step 1: Escribir enums y tipos (sin comportamiento)**

`src/lib/content/enums.ts`:

```ts
// Enums de dominio. Mismo patrón que el cliente generado de Prisma (objeto const + tipo
// homónimo) para que Object.values(Era) y z.enum(Era) sigan funcionando. Sin dependencias:
// se puede importar desde componentes cliente.

export const Era = {
  WWII: "WWII",
  COLD_WAR: "COLD_WAR",
  MODERN: "MODERN",
  DIGITAL_AGE: "DIGITAL_AGE",
} as const;
export type Era = (typeof Era)[keyof typeof Era];

export const OperationType = {
  ASSASSINATION: "ASSASSINATION",
  PROPAGANDA: "PROPAGANDA",
  DECEPTION: "DECEPTION",
  INFLUENCE_OP: "INFLUENCE_OP",
  FALSE_FLAG: "FALSE_FLAG",
  INFILTRATION: "INFILTRATION",
  MIND_CONTROL: "MIND_CONTROL",
  SURVEILLANCE: "SURVEILLANCE",
  DISINFORMATION: "DISINFORMATION",
} as const;
export type OperationType = (typeof OperationType)[keyof typeof OperationType];

export const Outcome = {
  SUCCESSFUL: "SUCCESSFUL",
  FAILED: "FAILED",
  PARTIAL: "PARTIAL",
  ONGOING: "ONGOING",
  UNKNOWN: "UNKNOWN",
} as const;
export type Outcome = (typeof Outcome)[keyof typeof Outcome];

export const OperationStatus = {
  DECLASSIFIED: "DECLASSIFIED",
  LEAKED: "LEAKED",
  ALLEGED: "ALLEGED",
} as const;
export type OperationStatus = (typeof OperationStatus)[keyof typeof OperationStatus];

export const SourceType = {
  GOVERNMENT: "GOVERNMENT",
  ACADEMIC: "ACADEMIC",
  JOURNALISM: "JOURNALISM",
  BOOK: "BOOK",
  LEAKED_DOC: "LEAKED_DOC",
  VIDEO: "VIDEO",
  WEBSITE: "WEBSITE",
} as const;
export type SourceType = (typeof SourceType)[keyof typeof SourceType];
```

`src/lib/content/types.ts`:

```ts
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
```

- [ ] **Step 2: Escribir los tests del loader**

`src/lib/content.test.ts`:

```ts
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { test } from "node:test";
import { ContentError, loadContent } from "./content/load";

type Meta = Record<string, unknown>;

function meta(slug: string, overrides: Meta = {}): Meta {
  return {
    slug,
    slugEs: `${slug}-es`,
    title: `Title ${slug}`,
    titleEs: `Título ${slug}`,
    aliases: [],
    icebergLevel: 1,
    era: "COLD_WAR",
    types: ["PROPAGANDA"],
    actors: ["CIA"],
    targets: ["Public"],
    outcome: "SUCCESSFUL",
    status: "DECLASSIFIED",
    excerpt: `Excerpt ${slug}`,
    excerptEs: `Resumen ${slug}`,
    publishedAt: "2026-03-29",
    tags: ["cia"],
    related: [],
    sources: [{ url: "https://example.org/doc", title: "Doc", type: "GOVERNMENT", credibility: 5 }],
    ...overrides,
  };
}

/** Crea un content/ temporal. `files` escribe (texto) o borra (null) rutas relativas al final. */
function fixture(metas: Meta[], options: { tags?: unknown; files?: Record<string, string | null> } = {}): string {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "psyopedia-content-"));
  fs.writeFileSync(path.join(dir, "tags.json"), JSON.stringify(options.tags ?? { cia: { name: "CIA", nameEs: "CIA" } }));
  fs.mkdirSync(path.join(dir, "operations"));
  for (const m of metas) {
    const folder = path.join(dir, "operations", String(m.slug));
    fs.mkdirSync(folder);
    fs.writeFileSync(path.join(folder, "meta.json"), JSON.stringify(m));
    fs.writeFileSync(path.join(folder, "body.en.md"), "## Overview\n\nBody.\n");
    fs.writeFileSync(path.join(folder, "body.es.md"), "## Resumen\n\nCuerpo.\n");
  }
  for (const [relative, text] of Object.entries(options.files ?? {})) {
    const file = path.join(dir, relative);
    if (text === null) {
      fs.rmSync(file);
    } else {
      fs.mkdirSync(path.dirname(file), { recursive: true });
      fs.writeFileSync(file, text);
    }
  }
  return dir;
}

function assertContentError(dir: string, file: string, ...fragments: string[]) {
  assert.throws(() => loadContent(dir), (error: unknown) => {
    assert.ok(error instanceof ContentError, `esperaba ContentError, llegó: ${String(error)}`);
    assert.ok(error.message.includes(file), error.message);
    for (const fragment of fragments) assert.ok(error.message.includes(fragment), error.message);
    return true;
  });
}

test("carga operaciones válidas y resuelve etiquetas, fuentes, fechas y relacionadas en los dos sentidos", () => {
  const dir = fixture([meta("alpha", { related: ["beta"] }), meta("beta", { updatedAt: "2026-04-01" })]);
  const { operations, summaries, tags } = loadContent(dir);
  assert.deepEqual(operations.map((o) => o.slug), ["alpha", "beta"]);
  assert.deepEqual(summaries.map((o) => o.slug), ["alpha", "beta"]);
  assert.deepEqual(tags, [{ id: "cia", slug: "cia", name: "CIA", nameEs: "CIA" }]);
  const [alpha, beta] = operations;
  assert.equal(alpha.id, "alpha");
  assert.deepEqual(alpha.tags, tags);
  assert.equal(alpha.bodyEn, "## Overview\n\nBody.");
  assert.equal(alpha.bodyEs, "## Resumen\n\nCuerpo.");
  assert.deepEqual(alpha.sources, [
    { id: "alpha-0", url: "https://example.org/doc", title: "Doc", type: "GOVERNMENT", credibility: 5 },
  ]);
  assert.equal(alpha.sourceCount, 1);
  assert.equal(alpha.coverImage, null);
  assert.equal(alpha.updatedAt, "2026-03-29");
  assert.equal(beta.updatedAt, "2026-04-01");
  assert.deepEqual(alpha.relatedOps.map((o) => o.slug), ["beta"]);
  assert.deepEqual(beta.relatedOps.map((o) => o.slug), ["alpha"]);
  assert.equal("bodyEn" in alpha.relatedOps[0], false);
  assert.equal("bodyEn" in summaries[0], false);
});

test("una operación sin etiquetas, fuentes ni relacionadas es válida", () => {
  const [op] = loadContent(fixture([meta("bare", { tags: [], sources: [], related: [] })])).operations;
  assert.deepEqual(op.tags, []);
  assert.deepEqual(op.sources, []);
  assert.equal(op.sourceCount, 0);
  assert.deepEqual(op.relatedOps, []);
});

test("declarar la relación en las dos carpetas no la duplica", () => {
  const { operations } = loadContent(fixture([meta("alpha", { related: ["beta"] }), meta("beta", { related: ["alpha"] })]));
  assert.deepEqual(operations.map((o) => o.relatedOps.map((r) => r.slug)), [["beta"], ["alpha"]]);
});

test("rechaza un valor de enum inválido nombrando fichero y campo", () => {
  assertContentError(fixture([meta("alpha", { era: "MEDIEVAL" })]), "operations/alpha/meta.json", "era");
});

test("rechaza una carpeta que no coincide con el slug", () => {
  const dir = fixture([], {
    files: {
      "operations/other/meta.json": JSON.stringify(meta("alpha")),
      "operations/other/body.en.md": "Body",
      "operations/other/body.es.md": "Cuerpo",
    },
  });
  assertContentError(dir, "operations/other/meta.json", "slug", "no coincide");
});

test("rechaza slugEs repetidos", () => {
  assertContentError(
    fixture([meta("alpha", { slugEs: "mismo" }), meta("beta", { slugEs: "mismo" })]),
    "operations/beta/meta.json", "slugEs", "repetido",
  );
});

test("rechaza etiquetas que no existen en tags.json y etiquetas repetidas", () => {
  assertContentError(fixture([meta("alpha", { tags: ["cia", "mind-ctrl"] })]), "operations/alpha/meta.json", "tags[1]", "mind-ctrl", "tags.json");
  assertContentError(fixture([meta("alpha", { tags: ["cia", "cia"] })]), "operations/alpha/meta.json", "tags");
});

test("rechaza relacionadas inexistentes y la relación consigo misma", () => {
  assertContentError(fixture([meta("alpha", { related: ["ghost"] })]), "operations/alpha/meta.json", "related[0]", "ghost");
  assertContentError(fixture([meta("alpha", { related: ["alpha"] })]), "operations/alpha/meta.json", "related[0]", "misma");
});

test("rechaza cuerpos ausentes o vacíos", () => {
  assertContentError(fixture([meta("alpha")], { files: { "operations/alpha/body.en.md": null } }), "operations/alpha/body.en.md", "no existe");
  assertContentError(fixture([meta("alpha")], { files: { "operations/alpha/body.es.md": "  \n\n " } }), "operations/alpha/body.es.md");
});

test("rechaza fechas imposibles y URLs de fuente que no son http(s)", () => {
  assertContentError(fixture([meta("alpha", { publishedAt: "2026-02-30" })]), "operations/alpha/meta.json", "publishedAt");
  assertContentError(fixture([meta("alpha", { publishedAt: "2026-13-01" })]), "operations/alpha/meta.json", "publishedAt");
  assertContentError(
    fixture([meta("alpha", { sources: [{ url: "ftp://example.org", title: "Doc", type: "BOOK", credibility: 3 }] })]),
    "operations/alpha/meta.json", "sources[0].url",
  );
});

test("rechaza campos desconocidos, JSON roto y un tags.json inválido", () => {
  assertContentError(fixture([meta("alpha", { viewCount: 3 })]), "operations/alpha/meta.json", "viewCount");
  assertContentError(fixture([meta("alpha")], { files: { "operations/alpha/meta.json": "{ roto" } }), "operations/alpha/meta.json", "JSON");
  assertContentError(fixture([meta("alpha")], { tags: { cia: { name: "CIA" } } }), "tags.json", "nameEs");
});
```

- [ ] **Step 3: Ejecutar los tests y verlos fallar**

Run: `npx tsx --test src/lib/content.test.ts`
Expected: FAIL — `Cannot find module './content/load'` (o `ERR_MODULE_NOT_FOUND`).

- [ ] **Step 4: Escribir el esquema**

`src/lib/content/schema.ts`:

```ts
import { z } from "zod";
import { Era, OperationStatus, OperationType, Outcome, SourceType } from "./enums";

// Primitivas heredadas del antiguo src/lib/validation.ts.
const titleSchema = z.string().trim().min(1).max(200);
const excerptSchema = z.string().trim().min(1).max(2000);
const slugSchema = z.string().min(1).max(200).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);
const namesSchema = z.array(z.string().trim().min(1).max(200)).max(50);
const httpUrlSchema = z.url({ protocol: /^https?$/ }).max(2048);

const dateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Formato YYYY-MM-DD")
  .refine((value) => {
    const time = Date.parse(value);
    return !Number.isNaN(time) && new Date(time).toISOString().slice(0, 10) === value;
  }, "Fecha inexistente");

const uniqueSlugs = z
  .array(slugSchema)
  .refine((values) => new Set(values).size === values.length, "Valores repetidos");

export const bodySchema = z.string().trim().min(1).max(100_000);

const sourceSchema = z.strictObject({
  url: httpUrlSchema.nullable(),
  title: titleSchema,
  type: z.enum(SourceType),
  credibility: z.number().int().min(1).max(5),
});

export const metaSchema = z.strictObject({
  slug: slugSchema,
  slugEs: slugSchema,
  title: titleSchema,
  titleEs: titleSchema,
  aliases: namesSchema,
  icebergLevel: z.number().int().min(1).max(5),
  era: z.enum(Era),
  types: z.array(z.enum(OperationType)).max(Object.keys(OperationType).length),
  actors: namesSchema,
  targets: namesSchema,
  outcome: z.enum(Outcome),
  status: z.enum(OperationStatus),
  excerpt: excerptSchema,
  excerptEs: excerptSchema,
  coverImage: z.string().min(1).nullable().optional(),
  publishedAt: dateSchema,
  updatedAt: dateSchema.nullable().optional(),
  tags: uniqueSlugs,
  related: uniqueSlugs,
  sources: z.array(sourceSchema),
});
export type Meta = z.infer<typeof metaSchema>;

export const tagsSchema = z.record(slugSchema, z.strictObject({ name: titleSchema, nameEs: titleSchema }));
```

- [ ] **Step 5: Escribir el loader**

`src/lib/content/load.ts`:

```ts
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
```

- [ ] **Step 6: Ejecutar los tests y verlos pasar**

Run: `npx tsx --test src/lib/content.test.ts`
Expected: PASS, 11 tests.

Run: `npm test && npx tsc --noEmit && npm run lint`
Expected: todos los tests pasan (20 previos + 11), tsc sin salida, lint con 0 errores.

- [ ] **Step 7: Commit**

```bash
git add src/lib/content src/lib/content.test.ts
git commit -m "feat(content): loader de contenido estático validado con Zod" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 2: Migración del seed a `content/`

**Files:**
- Create: `content/tags.json`, `content/operations/<slug>/{meta.json,body.en.md,body.es.md}` (×46)
- Create (fuera del repo, no se versiona): `<directorio temporal>/migrate-seed.mjs`
- Test: `src/lib/content.test.ts` (añadir un test)

**Interfaces:**
- Consumes: `loadContent` de la Task 1.
- Produces: el directorio `content/` real, del que dependen todas las tareas siguientes.

- [ ] **Step 1: Añadir el test del contenido real**

Al final de `src/lib/content.test.ts`:

```ts
test("el content/ real carga 46 operaciones con relaciones simétricas", () => {
  const { operations, tags } = loadContent(path.join(process.cwd(), "content"));
  assert.equal(operations.length, 46);
  assert.equal(tags.length, 43);
  for (const op of operations) {
    for (const related of op.relatedOps) {
      const other = operations.find((o) => o.slug === related.slug);
      assert.ok(other?.relatedOps.some((r) => r.slug === op.slug), `${op.slug} ↔ ${related.slug}`);
    }
  }
  const relatedOf = (slug: string) => operations.find((o) => o.slug === slug)?.relatedOps.map((o) => o.slug);
  assert.deepEqual(relatedOf("mkultra"), ["project-artichoke"]);
  assert.deepEqual(relatedOf("project-artichoke"), ["mkultra"]);
  assert.deepEqual(relatedOf("operation-mockingbird"), ["cointelpro"]);
  assert.deepEqual(relatedOf("internet-research-agency"), ["cambridge-analytica"]);
  assert.equal(operations.find((o) => o.slug === "operation-paperclip")?.slugEs, "operacion-paperclip");
  assert.equal(tags.find((t) => t.slug === "latin-america")?.nameEs, "Latinoamerica");
});
```

- [ ] **Step 2: Verlo fallar**

Run: `npx tsx --test src/lib/content.test.ts`
Expected: FAIL en el test nuevo con `ContentError: …/content/tags.json: no existe`.

- [ ] **Step 3: Escribir el script de migración desechable**

Créalo en un directorio temporal fuera del repo (el scratchpad de la sesión o `mktemp -d`), nunca dentro del repo. `migrate-seed.mjs`:

```js
// Script desechable: convierte el array de prisma/seed.ts en content/. Ejecutar desde la raíz del repo.
import fs from "node:fs";
import path from "node:path";

const source = fs.readFileSync("prisma/seed.ts", "utf8");
const start = source.indexOf("[", source.indexOf("const operations: SeedOperation[] ="));
const end = source.indexOf("\n];\n", start) + 2;
// Era.COLD_WAR, SourceType.BOOK… se evalúan a su propio nombre.
const enumStub = new Proxy({}, { get: (_target, key) => key });
const operations = new Function(
  "Era", "OperationType", "Outcome", "OperationStatus", "SourceType",
  `return ${source.slice(start, end)}`,
)(enumStub, enumStub, enumStub, enumStub, enumStub);

// Los tres pares que creaba main() en el seed.
const RELATED = {
  mkultra: ["project-artichoke"],
  cointelpro: ["operation-mockingbird"],
  "cambridge-analytica": ["internet-research-agency"],
};

// Como el seed, la primera aparición de cada etiqueta gana.
const tags = {};
for (const op of operations) for (const tag of op.tags) tags[tag.slug] ??= { name: tag.name, nameEs: tag.nameEs };

fs.mkdirSync("content/operations", { recursive: true });
fs.writeFileSync("content/tags.json", `${JSON.stringify(tags, null, 2)}\n`);

for (const op of operations) {
  const folder = path.join("content/operations", op.slug);
  fs.mkdirSync(folder, { recursive: true });
  const meta = {
    slug: op.slug,
    slugEs: op.slugEs,
    title: op.title,
    titleEs: op.titleEs,
    aliases: op.aliases,
    icebergLevel: op.icebergLevel,
    era: op.era,
    types: op.types,
    actors: op.actors,
    targets: op.targets,
    outcome: op.outcome,
    status: op.status,
    excerpt: op.excerpt,
    excerptEs: op.excerptEs,
    publishedAt: "2026-03-29",
    tags: op.tags.map((tag) => tag.slug),
    related: RELATED[op.slug] ?? [],
    sources: op.sources.map(({ url, title, type, credibility }) => ({ url, title, type, credibility })),
  };
  fs.writeFileSync(path.join(folder, "meta.json"), `${JSON.stringify(meta, null, 2)}\n`);
  fs.writeFileSync(path.join(folder, "body.en.md"), `${op.bodyEn.trim()}\n`);
  fs.writeFileSync(path.join(folder, "body.es.md"), `${op.bodyEs.trim()}\n`);
}
console.log(`${operations.length} operaciones, ${Object.keys(tags).length} etiquetas`);
```

- [ ] **Step 4: Ejecutar la migración**

Run (desde la raíz del repo): `node <ruta>/migrate-seed.mjs`
Expected: `46 operaciones, 43 etiquetas`

Run: `git status --short content | wc -l && cat content/operations/mkultra/meta.json && head -3 content/operations/mkultra/body.es.md`
Expected: `1` (directorio `content/` sin versionar), el `meta.json` de MKUltra con `"related": ["project-artichoke"]` y el cuerpo empezando por `## Resumen`.

- [ ] **Step 5: Verlo pasar**

Run: `npx tsx --test src/lib/content.test.ts`
Expected: PASS, 12 tests.

- [ ] **Step 6: Commit**

```bash
git add content src/lib/content.test.ts
git commit -m "feat(content): migra las 46 operaciones del seed a content/" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 3: API de contenido para las páginas

**Files:**
- Create: `src/lib/content/index.ts`
- Test: `src/lib/content.test.ts` (añadir tests)

**Interfaces:**
- Consumes: `loadContent`, tipos de la Task 1; `content/` de la Task 2.
- Produces (todas síncronas):
  - `getHomepageData(): { featuredOperations: OperationSummary[]; stats: { operationCount: number; eraCount: number; sourceCount: number } }`
  - `getCatalogSummaries(): OperationSummary[]`
  - `getDistinctActors(): string[]`
  - `getOperationForLocale(locale: string, slug: string): Operation | undefined` (busca por `slugEs` si `locale === "es"`)
  - `getAllOperationSlugs(): { slug: string; slugEs: string }[]`
  - `getIcebergData(): OperationSummary[]`

- [ ] **Step 1: Añadir los tests de la API**

En `src/lib/content.test.ts`, añade este import arriba:

```ts
import {
  getAllOperationSlugs,
  getCatalogSummaries,
  getDistinctActors,
  getHomepageData,
  getIcebergData,
  getOperationForLocale,
} from "./content/index";
```

Y al final:

```ts
test("la home muestra las 6 más recientes (desempate por nivel y título) y las estadísticas reales", () => {
  const { featuredOperations, stats } = getHomepageData();
  assert.equal(featuredOperations.length, 6);
  assert.deepEqual(stats, { operationCount: 46, eraCount: 4, sourceCount: 93 });
  for (let i = 1; i < featuredOperations.length; i++) {
    const [a, b] = [featuredOperations[i - 1], featuredOperations[i]];
    const ordered =
      a.publishedAt > b.publishedAt ||
      (a.publishedAt === b.publishedAt &&
        (a.icebergLevel < b.icebergLevel || (a.icebergLevel === b.icebergLevel && a.title.localeCompare(b.title) <= 0)));
    assert.ok(ordered, `${a.slug} antes que ${b.slug}`);
  }
});

test("busca la operación por el slug del idioma", () => {
  assert.equal(getOperationForLocale("es", "operacion-paperclip")?.slug, "operation-paperclip");
  assert.equal(getOperationForLocale("en", "operation-paperclip")?.slugEs, "operacion-paperclip");
  assert.equal(getOperationForLocale("en", "operacion-paperclip"), undefined);
  assert.equal(getOperationForLocale("es", "operation-paperclip"), undefined);
});

test("expone slugs, resúmenes, actores e iceberg coherentes", () => {
  assert.equal(getAllOperationSlugs().length, 46);
  assert.equal(getCatalogSummaries().length, 46);
  assert.equal("bodyEn" in getCatalogSummaries()[0], false);
  const actors = getDistinctActors();
  assert.deepEqual(actors, [...new Set(actors)].sort());
  assert.ok(actors.includes("CIA"));
  const iceberg = getIcebergData();
  assert.equal(iceberg.length, 46);
  for (let i = 1; i < iceberg.length; i++) {
    const [a, b] = [iceberg[i - 1], iceberg[i]];
    assert.ok(
      a.publishedAt > b.publishedAt || (a.publishedAt === b.publishedAt && a.title.localeCompare(b.title) <= 0),
      `${a.slug} antes que ${b.slug}`,
    );
  }
});
```

- [ ] **Step 2: Verlos fallar**

Run: `npx tsx --test src/lib/content.test.ts`
Expected: FAIL — `Cannot find module './content/index'`.

- [ ] **Step 3: Implementar la API**

`src/lib/content/index.ts`:

```ts
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
```

- [ ] **Step 4: Verlos pasar**

Run: `npx tsx --test src/lib/content.test.ts`
Expected: PASS, 15 tests.

Run: `npx tsc --noEmit && npm run lint`
Expected: limpio y 0 errores.

- [ ] **Step 5: Commit**

```bash
git add src/lib/content/index.ts src/lib/content.test.ts
git commit -m "feat(content): API de lectura para home, catálogo, fichas e iceberg" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 4: URLs del sitio (`src/lib/site.ts`)

**Files:**
- Create: `src/lib/site.ts`
- Test: `src/lib/site.test.ts`

**Interfaces:**
- Consumes: nada.
- Produces:
  - `normalizeSiteUrl(value: string | undefined): string`, `basePathOf(siteUrl: string): string`
  - `SITE_URL: string` (sin barra final), `BASE_PATH: string` (`""` o `"/psyopedia"`)
  - `pageUrl(path?: string, siteUrl?: string): string` (absoluta, barra final)
  - `asset(path: string, basePath?: string): string`
  - `ogImageUrl(locale: string, slug?: string, siteUrl?: string): string` (`…/og/<locale>/home.png` o `…/og/<locale>/catalog/<slug>.png`)
  - `rootRedirectScript(basePath?: string): string`

- [ ] **Step 1: Escribir los tests**

`src/lib/site.test.ts`:

```ts
import assert from "node:assert/strict";
import { test } from "node:test";
import { asset, basePathOf, normalizeSiteUrl, ogImageUrl, pageUrl, rootRedirectScript } from "./site";

test("la URL del sitio se normaliza y su ruta es el basePath", () => {
  assert.equal(normalizeSiteUrl(undefined), "https://psyopedia.org");
  assert.equal(normalizeSiteUrl(""), "https://psyopedia.org");
  assert.equal(normalizeSiteUrl("https://psyopedia.org/"), "https://psyopedia.org");
  assert.equal(normalizeSiteUrl("https://kenserikawa.github.io/psyopedia/"), "https://kenserikawa.github.io/psyopedia");
  assert.equal(basePathOf("https://kenserikawa.github.io/psyopedia"), "/psyopedia");
  assert.equal(basePathOf("https://psyopedia.org"), "");
});

test("pageUrl deja una sola barra entre segmentos y siempre barra final", () => {
  const site = "https://kenserikawa.github.io/psyopedia";
  assert.equal(pageUrl("/", site), `${site}/`);
  assert.equal(pageUrl("/en", site), `${site}/en/`);
  assert.equal(pageUrl("en/catalog//mkultra/", site), `${site}/en/catalog/mkultra/`);
  assert.equal(pageUrl("/es/catalog/operacion-paperclip"), "https://psyopedia.org/es/catalog/operacion-paperclip/");
});

test("asset y ogImageUrl respetan el basePath", () => {
  assert.equal(asset("/logo.png", "/psyopedia"), "/psyopedia/logo.png");
  assert.equal(asset("textures/waternormals.jpg", ""), "/textures/waternormals.jpg");
  assert.equal(ogImageUrl("es", undefined, "https://x.test/p"), "https://x.test/p/og/es/home.png");
  assert.equal(ogImageUrl("en", "mkultra", "https://x.test/p"), "https://x.test/p/og/en/catalog/mkultra.png");
});

function redirectTarget(languages: string[], language = ""): string {
  let target = "";
  new Function("navigator", "location", rootRedirectScript("/psyopedia"))(
    { languages, language },
    { replace: (url: string) => { target = url; } },
  );
  return target;
}

test("la raíz redirige según el primer idioma preferido del navegador", () => {
  assert.equal(redirectTarget(["es-ES", "en"]), "/psyopedia/es/");
  assert.equal(redirectTarget(["es-419"]), "/psyopedia/es/");
  assert.equal(redirectTarget(["ES"]), "/psyopedia/es/");
  assert.equal(redirectTarget(["en-US", "es"]), "/psyopedia/en/");
  assert.equal(redirectTarget(["ca-ES"]), "/psyopedia/en/");
  assert.equal(redirectTarget([], "es"), "/psyopedia/es/");
  assert.equal(redirectTarget([], ""), "/psyopedia/en/");
});
```

- [ ] **Step 2: Verlos fallar**

Run: `npx tsx --test src/lib/site.test.ts`
Expected: FAIL — `Cannot find module './site'`.

- [ ] **Step 3: Implementar**

`src/lib/site.ts`:

```ts
// URLs públicas del sitio. Todo sale de NEXT_PUBLIC_SITE_URL y su ruta es el basePath:
//   https://kenserikawa.github.io/psyopedia → "/psyopedia"
//   https://psyopedia.org                   → ""
// next.config.ts repite el cálculo de BASE_PATH porque no puede importar módulos TS locales.

const DEFAULT_SITE_URL = "https://psyopedia.org";

export function normalizeSiteUrl(value: string | undefined): string {
  const url = new URL(value || DEFAULT_SITE_URL);
  return `${url.origin}${url.pathname}`.replace(/\/+$/, "");
}

export function basePathOf(siteUrl: string): string {
  return new URL(siteUrl).pathname.replace(/\/+$/, "");
}

export const SITE_URL = normalizeSiteUrl(process.env.NEXT_PUBLIC_SITE_URL);
export const BASE_PATH = basePathOf(SITE_URL);

/** URL absoluta de una página, con barra final (trailingSlash: true). */
export function pageUrl(path = "/", siteUrl = SITE_URL): string {
  return `${siteUrl}${`/${path}/`.replace(/\/{2,}/g, "/")}`;
}

/** Ruta de un fichero de public/ con el basePath delante: next/image y three.js no lo añaden. */
export function asset(path: string, basePath = BASE_PATH): string {
  return `${basePath}/${path.replace(/^\/+/, "")}`;
}

/** Imagen OG estática: la de la home o la de una operación (slug del idioma). */
export function ogImageUrl(locale: string, slug?: string, siteUrl = SITE_URL): string {
  return slug ? `${siteUrl}/og/${locale}/catalog/${slug}.png` : `${siteUrl}/og/${locale}/home.png`;
}

/** Script inline de la raíz: /es/ si el idioma preferido es español, /en/ en cualquier otro caso. */
export function rootRedirectScript(basePath = BASE_PATH): string {
  return `(function(){var l=(navigator.languages&&navigator.languages[0])||navigator.language||"";location.replace(${JSON.stringify(basePath)}+(/^es(-|$)/i.test(l)?"/es/":"/en/"));})();`;
}
```

- [ ] **Step 4: Verlos pasar**

Run: `npx tsx --test src/lib/site.test.ts && npm test && npx tsc --noEmit`
Expected: 4 tests de `site` en verde, `npm test` completo en verde, tsc limpio.

- [ ] **Step 5: Commit**

```bash
git add src/lib/site.ts src/lib/site.test.ts
git commit -m "feat(site): URLs del sitio derivadas de NEXT_PUBLIC_SITE_URL" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 5: Retirada de usuarios (auth, comentarios, contribuciones, admin, API)

Las páginas siguen leyendo de Prisma hasta la Task 6; aquí solo desaparece todo lo que necesita usuarios y la API REST.

**Files:**
- Delete: `src/app/api/`, `src/app/[locale]/admin/`, `src/app/[locale]/contribute/`, `src/lib/actions/`, `src/lib/auth.ts`, `src/lib/auth-utils.ts`, `src/lib/comments.ts`, `src/lib/contributions.ts`, `src/lib/revalidation.ts`, `src/lib/validation.ts`, `src/lib/validation.test.ts`, `src/components/admin/`, `src/components/auth/`, `src/components/contribute/`, `src/components/operation/CommentSection.tsx`, `src/types/next-auth.d.ts`, `tests/local.integration.test.ts`
- Modify: `src/app/[locale]/layout.tsx`, `src/app/[locale]/catalog/[slug]/page.tsx`, `src/components/layout/Header.tsx`, `src/components/layout/MobileNav.tsx`, `src/components/operation/OperationHeader.tsx`, `src/lib/queries.ts`, `messages/en.json`, `messages/es.json`, `package.json`

**Interfaces:**
- Consumes: nada de las tareas anteriores.
- Produces: un árbol sin NextAuth ni rutas de usuario. `queries.ts` conserva solo `getHomepageData`, `getCatalogOperations`, `getOperationBySlug`, `getOperationBySlugEs`, `getAllOperationSlugs`, `getIcebergData` y `getDistinctActors`.

- [ ] **Step 1: Borrar ficheros**

```bash
git rm -r -q src/app/api "src/app/[locale]/admin" "src/app/[locale]/contribute" src/lib/actions \
  src/lib/auth.ts src/lib/auth-utils.ts src/lib/comments.ts src/lib/contributions.ts src/lib/revalidation.ts \
  src/lib/validation.ts src/lib/validation.test.ts src/components/admin src/components/auth src/components/contribute \
  src/components/operation/CommentSection.tsx src/types/next-auth.d.ts tests/local.integration.test.ts
```

- [ ] **Step 2: Quitar el `SessionProvider` del layout**

En `src/app/[locale]/layout.tsx`, borra la línea `import { SessionProvider } from "@/components/auth/SessionProvider";` y sustituye:

```tsx
        <NextIntlClientProvider messages={messages}>
          <SessionProvider>
            <Header locale={locale} />
            <main className="flex-1">{children}</main>
            <Footer />
          </SessionProvider>
        </NextIntlClientProvider>
```

por:

```tsx
        <NextIntlClientProvider messages={messages}>
          <Header locale={locale} />
          <main className="flex-1">{children}</main>
          <Footer />
        </NextIntlClientProvider>
```

- [ ] **Step 3: Quitar "Contribuir" y el menú de usuario de la navegación**

En `src/components/layout/Header.tsx`, borra `import { UserMenu } from "@/components/auth/UserMenu";`, la línea `<UserMenu locale={locale} />` y el bloque:

```tsx
          <Link href={`/${locale}/contribute`} className="hidden md:inline text-muted-foreground hover:text-foreground transition-colors">
            {t("contribute")}
          </Link>
```

En `src/components/layout/MobileNav.tsx`, borra la entrada `{ href: `/${locale}/contribute`, label: t("contribute") },` del array `links`.

- [ ] **Step 4: Quitar el contador de visitas de la cabecera de la ficha**

En `src/components/operation/OperationHeader.tsx`, borra:

```tsx

      {/* View count */}
      <p className="text-xs text-muted-foreground">
        {tOp("viewCount", { count: operation.viewCount })}
      </p>
```

- [ ] **Step 5: Quitar comentarios y visitas de la ficha**

Sustituye `src/app/[locale]/catalog/[slug]/page.tsx` entero por (versión intermedia: sigue en Prisma hasta la Task 6):

```tsx
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import type { Metadata } from "next";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { getOperationBySlug, getOperationBySlugEs } from "@/lib/queries";
import { OperationHeader } from "@/components/operation/OperationHeader";
import { OperationBody } from "@/components/operation/OperationBody";
import { SourcesList } from "@/components/operation/SourcesList";
import { RelatedOps } from "@/components/operation/RelatedOps";
import { ShareButtons } from "@/components/operation/ShareButtons";
import { generateOperationMetadata, generateOperationJsonLd, SITE_URL } from "@/lib/seo";

interface Props {
  params: Promise<{ locale: string; slug: string }>;
}

async function fetchOperation(locale: string, slug: string) {
  return locale === "es" ? getOperationBySlugEs(slug) : getOperationBySlug(slug);
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, slug } = await params;
  const operation = await fetchOperation(locale, slug);

  if (!operation) {
    return { title: "Not Found" };
  }

  return generateOperationMetadata(operation, locale);
}

export default async function OperationDetailPage({ params }: Props) {
  const { locale, slug } = await params;
  const operation = await fetchOperation(locale, slug);

  if (!operation) {
    notFound();
  }

  const tOp = await getTranslations({ locale, namespace: "operation" });

  const bodyContent = locale === "es" ? operation.bodyEs : operation.bodyEn;
  const relatedOps = operation.relatedOps ?? [];

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(generateOperationJsonLd(operation, locale)).replace(/</g, "\\u003c"),
        }}
      />

      {/* Header */}
      <OperationHeader operation={operation} locale={locale} />

      {/* Share */}
      <div className="mt-6">
        <ShareButtons
          url={`${SITE_URL}/${locale}/catalog/${slug}`}
          title={locale === "es" ? operation.titleEs : operation.title}
        />
      </div>

      <Separator className="my-6" />

      {/* Tags */}
      {operation.tags.length > 0 && (
        <>
          <section>
            <h2 className="mb-3 text-base font-semibold">{tOp("tags")}</h2>
            <div className="flex flex-wrap gap-2">
              {operation.tags.map((tag) => (
                <Badge key={tag.id} variant="outline">
                  {locale === "es" ? tag.nameEs : tag.name}
                </Badge>
              ))}
            </div>
          </section>
          <Separator className="my-6" />
        </>
      )}

      {/* Body */}
      <OperationBody content={bodyContent} />

      {/* Sources */}
      {operation.sources.length > 0 && (
        <>
          <Separator className="my-6" />
          <SourcesList sources={operation.sources} />
        </>
      )}

      {/* Related operations */}
      {relatedOps.length > 0 && (
        <>
          <Separator className="my-6" />
          <RelatedOps operations={relatedOps} locale={locale} />
        </>
      )}
    </div>
  );
}
```

- [ ] **Step 6: Recortar `queries.ts`**

En `src/lib/queries.ts` borra, completas, las funciones `incrementOperationView`, `getAdminStats`, `getPendingContributions`, `getAllOperationsAdmin`, `getApprovedComments`, `getPendingComments` y `searchOperations`, junto con sus comentarios de sección (`// ─── Admin Queries`, `// ─── Comment Queries`, `// ─── Search`).

- [ ] **Step 7: Quitar los mensajes que ya no usa nadie**

```bash
node -e '
const fs = require("node:fs");
for (const locale of ["en", "es"]) {
  const file = `messages/${locale}.json`;
  const m = JSON.parse(fs.readFileSync(file, "utf8"));
  delete m.contribute;
  delete m.admin;
  for (const key of ["contribute", "admin", "signIn", "signOut"]) delete m.nav[key];
  for (const key of ["comments", "suggestEdit", "viewCount"]) delete m.operation[key];
  fs.writeFileSync(file, JSON.stringify(m, null, 2) + "\n");
}'
```

- [ ] **Step 8: Quitar dependencias y el script de integración**

```bash
npm uninstall next-auth @auth/prisma-adapter
npm pkg delete scripts.test:integration
```

- [ ] **Step 9: Verificar que no queda rastro**

Run: `grep -rnE "next-auth|@/lib/(auth|validation|comments|contributions|revalidation)|CommentSection|UserMenu|SessionProvider|suggestEdit|/contribute" src messages package.json | grep -v "^src/app/robots.ts"`
Expected: sin salida. (`viewCount` sigue en `queries.ts`/`catalog.ts` y `/contribute` en `robots.ts` hasta la Task 6.)

Run: `grep -nE "viewCount|signIn|suggestEdit|\"contribute\"|\"admin\"" messages/en.json messages/es.json`
Expected: sin salida.

Run: `npx tsc --noEmit && npm run lint && npm test`
Expected: tsc limpio; lint 0 errores; tests en verde (los 4 de `validation.test.ts` desaparecen con el fichero).

- [ ] **Step 10: Commit**

```bash
git add -A src messages package.json package-lock.json tests
git commit -m "refactor: elimina usuarios, comentarios, contribuciones, admin y la API REST" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 6: Páginas y catálogo sobre `content/`

Todas las páginas pasan a leer de `@/lib/content` y el catálogo filtra en el navegador. Al final de la tarea `queries.ts` ya no lo usa nadie y se borra. Entre los Steps 4 y 14 `tsc` falla en los consumidores de Prisma; el commit intermedio del Step 5 lo asume y el final debe quedar limpio.

**Files:**
- Modify: `src/lib/catalog.ts`, `src/lib/catalog.test.ts`, `src/lib/seo.ts`, `src/components/catalog/CatalogFilters.tsx`, `src/components/home/FeaturedGrid.tsx`, `src/components/operation/RelatedOps.tsx`, `src/components/operation/OperationHeader.tsx`, `src/components/operation/SourcesList.tsx`, `src/app/[locale]/layout.tsx`, `src/app/[locale]/page.tsx`, `src/app/[locale]/catalog/page.tsx`, `src/app/[locale]/catalog/[slug]/page.tsx`, `src/app/[locale]/iceberg/page.tsx`, `src/app/sitemap.ts`, `src/app/robots.ts`, `messages/en.json`, `messages/es.json`
- Create: `src/components/catalog/CatalogLayout.tsx`, `src/components/catalog/CatalogResults.tsx`, `src/components/catalog/CatalogBrowser.tsx`
- Delete: `src/lib/queries.ts`

**Interfaces:**
- Consumes: API de la Task 3; `pageUrl`, `ogImageUrl`, `SITE_URL` de la Task 4.
- Produces:
  - `catalog.ts`: `CATALOG_SORTS = ["newest", "oldest", "level", "title"]`, `type CatalogSort`, `interface CatalogPage { operations; total; page; pageSize; totalPages }`, `normalizeSearch(value: string): string`, `filterCatalog(all: readonly OperationSummary[], filters?: CatalogFilters): CatalogPage`, y reexporta `type OperationSummary` desde `@/lib/content/types`.
  - `seo.ts`: `operationUrl(operation, locale): string`, `generateOperationJsonLd(operation, locale)`, `generateOperationMetadata(operation, locale)`. Ya no exporta `SITE_URL`.
  - `CatalogLayout({ filters, results })`, `CatalogResults({ result, locale, queryString })`, `CatalogBrowser({ operations, actors, locale })`.

- [ ] **Step 1: Escribir los tests de `filterCatalog`**

En `src/lib/catalog.test.ts`, cambia el import de la línea 3 por:

```ts
import { catalogSearchParams, filterCatalog, normalizeSearch, parseCatalogFilters } from "./catalog";
import type { CatalogFilters, OperationSummary } from "./catalog";
```

Y añade al final:

```ts
function summary(id: string, overrides: Partial<OperationSummary> = {}): OperationSummary {
  return {
    id, slug: id, slugEs: `${id}-es`, title: id, titleEs: id, aliases: [], icebergLevel: 1,
    era: "COLD_WAR", types: ["PROPAGANDA"], actors: ["CIA"], targets: [], outcome: "SUCCESSFUL",
    status: "DECLASSIFIED", excerpt: "", excerptEs: "", coverImage: null,
    publishedAt: "2026-03-29", updatedAt: "2026-03-29", tags: [], sourceCount: 0,
    ...overrides,
  };
}

const sample = [
  summary("paperclip", {
    title: "Operation Paperclip", titleEs: "Operacion Paperclip", era: "WWII", icebergLevel: 1,
    publishedAt: "2026-01-10", actors: ["United States", "OSS"],
  }),
  summary("infektion", {
    title: "Operation INFEKTION", titleEs: "Operación INFEKTION", aliases: ["Operation Denver"],
    types: ["DISINFORMATION"], icebergLevel: 2, publishedAt: "2026-02-10", actors: ["Soviet Union", "KGB"],
  }),
  summary("blue-beam", {
    title: "Project Blue Beam", titleEs: "Blue Beam (proyecto)", era: "MODERN", types: ["DECEPTION", "PROPAGANDA"],
    icebergLevel: 5, publishedAt: "2026-02-10", outcome: "UNKNOWN", status: "ALLEGED", actors: ["NASA"],
  }),
];
const ids = (filters: CatalogFilters) => filterCatalog(sample, filters).operations.map((o) => o.id);

test("filterCatalog busca sin distinguir tildes ni mayúsculas en títulos, resúmenes y alias", () => {
  assert.equal(normalizeSearch("  OPERACIÓN "), "operacion");
  assert.deepEqual(ids({ search: "operacion" }), ["infektion", "paperclip"]);
  assert.deepEqual(ids({ search: "OPERACIÓN" }), ["infektion", "paperclip"]);
  assert.deepEqual(ids({ search: "denver" }), ["infektion"]);
  assert.equal(filterCatalog(sample, { search: "   " }).total, 3);
});

test("filterCatalog combina filtros de nivel, era, tipo, resultado, estado y actor", () => {
  assert.deepEqual(ids({ levels: [1, 5] }), ["blue-beam", "paperclip"]);
  assert.deepEqual(ids({ eras: ["WWII"] }), ["paperclip"]);
  assert.deepEqual(ids({ types: ["DECEPTION", "DISINFORMATION"] }), ["blue-beam", "infektion"]);
  assert.deepEqual(ids({ outcomes: ["UNKNOWN"] }), ["blue-beam"]);
  assert.deepEqual(ids({ statuses: ["DECLASSIFIED"], actor: "KGB" }), ["infektion"]);
  assert.deepEqual(ids({ actor: "Nadie" }), []);
});

test("filterCatalog ordena con desempate estable por id y título según idioma", () => {
  assert.deepEqual(ids({ sort: "newest" }), ["blue-beam", "infektion", "paperclip"]);
  assert.deepEqual(ids({ sort: "oldest" }), ["paperclip", "blue-beam", "infektion"]);
  assert.deepEqual(ids({ sort: "level" }), ["paperclip", "infektion", "blue-beam"]);
  assert.deepEqual(ids({ sort: "title" }), ["infektion", "paperclip", "blue-beam"]);
  assert.deepEqual(ids({ sort: "title", locale: "es" }), ["blue-beam", "infektion", "paperclip"]);
});

test("filterCatalog pagina y acota la página fuera de rango", () => {
  const many = Array.from({ length: 25 }, (_, i) => summary(`op-${String(i).padStart(2, "0")}`));
  const first = filterCatalog(many, {});
  assert.deepEqual([first.total, first.page, first.pageSize, first.totalPages, first.operations.length], [25, 1, 12, 3, 12]);
  const last = filterCatalog(many, { page: 99 });
  assert.equal(last.page, 3);
  assert.deepEqual(last.operations.map((o) => o.id), ["op-24"]);
  assert.equal(filterCatalog(many, { pageSize: 100 }).totalPages, 1);
  assert.deepEqual(filterCatalog([], { page: 5 }), { operations: [], total: 0, page: 1, pageSize: 12, totalPages: 1 });
});

test("el orden por visitas ya no existe", () => {
  assert.equal(parseCatalogFilters(new URLSearchParams("sort=most-viewed")).success, false);
});
```

- [ ] **Step 2: Verlos fallar**

Run: `npx tsx --test src/lib/catalog.test.ts`
Expected: FAIL — `filterCatalog` / `normalizeSearch` no exportados.

- [ ] **Step 3: Reescribir `catalog.ts`**

Sustituye `src/lib/catalog.ts` entero por:

```ts
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
```

- [ ] **Step 4: Verlos pasar**

Run: `npx tsx --test src/lib/catalog.test.ts`
Expected: PASS, 8 tests.

- [ ] **Step 5: Commit intermedio**

```bash
git add src/lib/catalog.ts src/lib/catalog.test.ts
git commit -m "feat(catalog): filtrado, orden y paginación en memoria" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

- [ ] **Step 6: Filtros sin el orden por visitas**

En `src/components/catalog/CatalogFilters.tsx`:
- cambia `import { Era, OperationType, Outcome, OperationStatus } from "@/generated/prisma/enums";` por `import { Era, OperationType, Outcome, OperationStatus } from "@/lib/content/enums";`
- borra la línea `<SelectItem value="most-viewed">{t("sort.mostViewed")}</SelectItem>`

Y quita la clave de los mensajes:

```bash
node -e '
const fs = require("node:fs");
for (const locale of ["en", "es"]) {
  const file = `messages/${locale}.json`;
  const m = JSON.parse(fs.readFileSync(file, "utf8"));
  delete m.catalog.sort.mostViewed;
  fs.writeFileSync(file, JSON.stringify(m, null, 2) + "\n");
}'
```

- [ ] **Step 7: Componentes del catálogo**

`src/components/catalog/CatalogLayout.tsx`:

```tsx
import type { ReactNode } from "react";
import { useTranslations } from "next-intl";

/** Maquetación compartida por el HTML estático (servidor) y el catálogo filtrado (cliente). */
export function CatalogLayout({ filters, results }: { filters: ReactNode; results: ReactNode }) {
  const t = useTranslations("catalog");

  return (
    <div className="flex flex-col gap-8 md:flex-row">
      <details className="rounded-md border p-4 md:hidden">
        <summary className="cursor-pointer font-semibold">{t("filters.title")}</summary>
        <div className="mt-4">{filters}</div>
      </details>
      <div className="hidden w-64 shrink-0 md:block">{filters}</div>
      <main className="min-w-0 flex-1">{results}</main>
    </div>
  );
}
```

`src/components/catalog/CatalogResults.tsx`:

```tsx
import Link from "next/link";
import { useTranslations } from "next-intl";
import { OperationGrid } from "@/components/catalog/OperationGrid";
import type { CatalogPage } from "@/lib/catalog";

interface CatalogResultsProps {
  /** null cuando los filtros de la URL no son válidos. */
  result: CatalogPage | null;
  locale: string;
  queryString: string;
}

export function CatalogResults({ result, locale, queryString }: CatalogResultsProps) {
  const t = useTranslations("catalog");

  if (!result) {
    return (
      <p role="alert" className="rounded-md border border-destructive p-4 text-destructive">
        {t("invalidFilters")}
      </p>
    );
  }

  const pageHref = (page: number) => {
    const query = new URLSearchParams(queryString);
    query.set("page", String(page));
    return `/${locale}/catalog?${query}`;
  };

  return (
    <>
      <OperationGrid operations={result.operations} locale={locale} totalCount={result.total} queryString={queryString} />
      {result.totalPages > 1 && (
        <nav aria-label={t("pagination.label")} className="mt-8 flex flex-wrap items-center justify-center gap-4">
          {result.page > 1 && (
            <Link className="rounded-md border px-4 py-2 hover:bg-muted" href={pageHref(result.page - 1)} rel="prev">
              {t("pagination.previous")}
            </Link>
          )}
          <span aria-current="page">
            {t("pagination.page", { page: result.page, totalPages: result.totalPages })}
          </span>
          {result.page < result.totalPages && (
            <Link className="rounded-md border px-4 py-2 hover:bg-muted" href={pageHref(result.page + 1)} rel="next">
              {t("pagination.next")}
            </Link>
          )}
        </nav>
      )}
    </>
  );
}
```

`src/components/catalog/CatalogBrowser.tsx`:

```tsx
"use client";

import { useSearchParams } from "next/navigation";
import { CatalogFilters } from "@/components/catalog/CatalogFilters";
import { CatalogLayout } from "@/components/catalog/CatalogLayout";
import { CatalogResults } from "@/components/catalog/CatalogResults";
import { catalogSearchParams, filterCatalog, parseCatalogFilters } from "@/lib/catalog";
import type { OperationSummary } from "@/lib/catalog";

interface CatalogBrowserProps {
  operations: OperationSummary[];
  actors: string[];
  locale: string;
}

/** Aplica en el navegador los filtros de la URL sobre todas las operaciones. */
export function CatalogBrowser({ operations, actors, locale }: CatalogBrowserProps) {
  const searchParams = useSearchParams();
  const parsed = parseCatalogFilters(searchParams);
  const result = parsed.success ? filterCatalog(operations, { ...parsed.filters, locale }) : null;

  return (
    <CatalogLayout
      filters={<CatalogFilters locale={locale} actors={actors} />}
      results={
        <CatalogResults result={result} locale={locale} queryString={catalogSearchParams(searchParams).toString()} />
      }
    />
  );
}
```

- [ ] **Step 8: Página del catálogo**

Sustituye `src/app/[locale]/catalog/page.tsx` entero por:

```tsx
import { Suspense } from "react";
import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { getCatalogSummaries, getDistinctActors } from "@/lib/content";
import { filterCatalog } from "@/lib/catalog";
import { CatalogBrowser } from "@/components/catalog/CatalogBrowser";
import { CatalogLayout } from "@/components/catalog/CatalogLayout";
import { CatalogResults } from "@/components/catalog/CatalogResults";

interface Props {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "catalog" });
  const tSeo = await getTranslations({ locale, namespace: "seo" });

  return {
    title: t("title"),
    description: tSeo("siteDescription"),
  };
}

export default async function CatalogPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "catalog" });
  const operations = getCatalogSummaries();
  const actors = getDistinctActors();

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="mb-8 text-3xl font-bold tracking-tight">{t("title")}</h1>
      {/* El HTML estático trae la primera página sin filtros; el cliente aplica los de la URL. */}
      <Suspense
        fallback={
          <CatalogLayout
            filters={<div className="h-96 animate-pulse rounded-md bg-muted" />}
            results={<CatalogResults result={filterCatalog(operations, { locale })} locale={locale} queryString="" />}
          />
        }
      >
        <CatalogBrowser operations={operations} actors={actors} locale={locale} />
      </Suspense>
    </div>
  );
}
```

- [ ] **Step 9: Tipos de los componentes de operación**

- `src/components/home/FeaturedGrid.tsx`: sustituye `import type { Operation, Tag } from "@/generated/prisma/client";` por `import type { OperationSummary } from "@/lib/content/types";` y `operations: (Operation & { tags: Tag[] })[];` por `operations: OperationSummary[];`.
- `src/components/operation/RelatedOps.tsx`: el mismo cambio en sus dos líneas.
- `src/components/operation/OperationHeader.tsx`: sustituye `import type { Operation } from "@/generated/prisma/client";` por `import type { Operation } from "@/lib/content/types";`.
- `src/components/operation/SourcesList.tsx`: sustituye `import type { Source } from "@/generated/prisma/client";` por `import type { Source } from "@/lib/content/types";`.

- [ ] **Step 10: `seo.ts` sobre el contenido y las URLs nuevas**

Sustituye `src/lib/seo.ts` entero por:

```ts
import type { Operation } from "@/lib/content/types";
import { ogImageUrl, pageUrl } from "@/lib/site";

function localized(operation: Operation, locale: string) {
  const es = locale === "es";
  return {
    title: es ? operation.titleEs : operation.title,
    description: es ? operation.excerptEs : operation.excerpt,
    slug: es ? operation.slugEs : operation.slug,
  };
}

/** URL canónica de la ficha en el idioma dado. */
export function operationUrl(operation: Pick<Operation, "slug" | "slugEs">, locale: string): string {
  return pageUrl(`/${locale}/catalog/${locale === "es" ? operation.slugEs : operation.slug}`);
}

export function generateOperationJsonLd(operation: Operation, locale: string) {
  const { title, description } = localized(operation, locale);

  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: title,
    description,
    url: operationUrl(operation, locale),
    datePublished: operation.publishedAt,
    dateModified: operation.updatedAt,
    author: {
      "@type": "Organization",
      name: "Psyopedia",
    },
    publisher: {
      "@type": "Organization",
      name: "Psyopedia",
      url: pageUrl("/"),
    },
    inLanguage: locale === "es" ? "es" : "en",
    about: operation.types.map((t) => ({
      "@type": "Thing",
      name: t.replace("_", " "),
    })),
  };
}

export function generateOperationMetadata(operation: Operation, locale: string) {
  const { title, description, slug } = localized(operation, locale);
  const url = operationUrl(operation, locale);
  const image = ogImageUrl(locale, slug);

  return {
    title,
    description,
    openGraph: {
      title: `${title} | Psyopedia`,
      description,
      type: "article" as const,
      url,
      images: [image],
    },
    twitter: {
      card: "summary_large_image" as const,
      title: `${title} | Psyopedia`,
      description,
      images: [image],
    },
    alternates: {
      canonical: url,
      languages: {
        en: operationUrl(operation, "en"),
        es: operationUrl(operation, "es"),
      },
    },
  };
}
```

- [ ] **Step 11: Ficha, home e iceberg**

Sustituye `src/app/[locale]/catalog/[slug]/page.tsx` entero por:

```tsx
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { getAllOperationSlugs, getOperationForLocale } from "@/lib/content";
import { OperationHeader } from "@/components/operation/OperationHeader";
import { OperationBody } from "@/components/operation/OperationBody";
import { SourcesList } from "@/components/operation/SourcesList";
import { RelatedOps } from "@/components/operation/RelatedOps";
import { ShareButtons } from "@/components/operation/ShareButtons";
import { generateOperationMetadata, generateOperationJsonLd, operationUrl } from "@/lib/seo";

interface Props {
  params: Promise<{ locale: string; slug: string }>;
}

export const dynamicParams = false;

export function generateStaticParams({ params }: { params: { locale: string } }) {
  return getAllOperationSlugs().map((op) => ({ slug: params.locale === "es" ? op.slugEs : op.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, slug } = await params;
  const operation = getOperationForLocale(locale, slug);

  if (!operation) {
    return { title: "Not Found" };
  }

  return generateOperationMetadata(operation, locale);
}

export default async function OperationDetailPage({ params }: Props) {
  const { locale, slug } = await params;
  setRequestLocale(locale);
  const operation = getOperationForLocale(locale, slug);

  if (!operation) {
    notFound();
  }

  const tOp = await getTranslations({ locale, namespace: "operation" });

  const bodyContent = locale === "es" ? operation.bodyEs : operation.bodyEn;

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(generateOperationJsonLd(operation, locale)).replace(/</g, "\\u003c"),
        }}
      />

      {/* Header */}
      <OperationHeader operation={operation} locale={locale} />

      {/* Share */}
      <div className="mt-6">
        <ShareButtons
          url={operationUrl(operation, locale)}
          title={locale === "es" ? operation.titleEs : operation.title}
        />
      </div>

      <Separator className="my-6" />

      {/* Tags */}
      {operation.tags.length > 0 && (
        <>
          <section>
            <h2 className="mb-3 text-base font-semibold">{tOp("tags")}</h2>
            <div className="flex flex-wrap gap-2">
              {operation.tags.map((tag) => (
                <Badge key={tag.id} variant="outline">
                  {locale === "es" ? tag.nameEs : tag.name}
                </Badge>
              ))}
            </div>
          </section>
          <Separator className="my-6" />
        </>
      )}

      {/* Body */}
      <OperationBody content={bodyContent} />

      {/* Sources */}
      {operation.sources.length > 0 && (
        <>
          <Separator className="my-6" />
          <SourcesList sources={operation.sources} />
        </>
      )}

      {/* Related operations */}
      {operation.relatedOps.length > 0 && (
        <>
          <Separator className="my-6" />
          <RelatedOps operations={operation.relatedOps} locale={locale} />
        </>
      )}
    </div>
  );
}
```

Sustituye `src/app/[locale]/page.tsx` entero por:

```tsx
import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { getHomepageData } from "@/lib/content";
import { ogImageUrl, pageUrl } from "@/lib/site";
import { HeroSection } from "@/components/home/HeroSection";
import { StatsBar } from "@/components/home/StatsBar";
import { FeaturedGrid } from "@/components/home/FeaturedGrid";

interface Props {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "home" });
  const image = ogImageUrl(locale);

  return {
    description: t("subtitle"),
    openGraph: {
      type: "website",
      siteName: "Psyopedia",
      title: "Psyopedia",
      description: t("subtitle"),
      url: pageUrl(`/${locale}`),
      locale: locale === "es" ? "es_ES" : "en_US",
      images: [image],
    },
    twitter: {
      card: "summary_large_image",
      title: "Psyopedia",
      description: t("subtitle"),
      images: [image],
    },
    alternates: {
      canonical: pageUrl(`/${locale}`),
      languages: {
        en: pageUrl("/en"),
        es: pageUrl("/es"),
      },
    },
  };
}

export default async function HomePage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const { featuredOperations, stats } = getHomepageData();

  return (
    <>
      <HeroSection locale={locale} />
      <StatsBar stats={stats} />
      <FeaturedGrid operations={featuredOperations} locale={locale} />
    </>
  );
}
```

Sustituye `src/app/[locale]/iceberg/page.tsx` entero por:

```tsx
import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { getIcebergData } from "@/lib/content";
import { ogImageUrl, pageUrl } from "@/lib/site";
import IcebergJourneyWrapper from "@/components/iceberg/IcebergJourneyWrapper";

interface Props {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "iceberg" });
  return {
    title: t("title"),
    description: t("subtitle"),
    openGraph: {
      title: t("title"),
      description: t("subtitle"),
      images: [ogImageUrl(locale)],
    },
    alternates: {
      canonical: pageUrl(`/${locale}/iceberg`),
      languages: { en: pageUrl("/en/iceberg"), es: pageUrl("/es/iceberg") },
    },
  };
}

export default async function IcebergPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  const operations = getIcebergData().map((op) => ({
    id: op.id,
    title: locale === "es" ? op.titleEs : op.title,
    excerpt: locale === "es" ? op.excerptEs : op.excerpt,
    era: op.era,
    status: op.status,
    slug: locale === "es" ? op.slugEs : op.slug,
    icebergLevel: op.icebergLevel,
    types: op.types,
    outcome: op.outcome,
    actors: op.actors,
    sourceCount: op.sourceCount,
  }));

  return <IcebergJourneyWrapper operations={operations} locale={locale} />;
}
```

- [ ] **Step 12: Sitemap, robots y layout**

Sustituye `src/app/sitemap.ts` entero por:

```ts
import type { MetadataRoute } from "next";
import { getCatalogSummaries } from "@/lib/content";
import { pageUrl } from "@/lib/site";

export const dynamic = "force-static";

export default function sitemap(): MetadataRoute.Sitemap {
  const staticPages = ["", "/catalog", "/iceberg", "/legal/privacy", "/legal/terms"].flatMap((path) =>
    ["en", "es"].map((locale) => ({
      url: pageUrl(`/${locale}${path}`),
      changeFrequency: "weekly" as const,
      priority: path === "" ? 1.0 : 0.8,
    }))
  );

  const operationPages = getCatalogSummaries().flatMap((op) => [
    {
      url: pageUrl(`/en/catalog/${op.slug}`),
      lastModified: op.updatedAt,
      changeFrequency: "monthly" as const,
      priority: 0.6,
    },
    {
      url: pageUrl(`/es/catalog/${op.slugEs}`),
      lastModified: op.updatedAt,
      changeFrequency: "monthly" as const,
      priority: 0.6,
    },
  ]);

  return [...staticPages, ...operationPages];
}
```

Sustituye `src/app/robots.ts` entero por:

```ts
import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

export const dynamic = "force-static";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: "*", allow: "/" }],
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
```

En `src/app/[locale]/layout.tsx` cambia `import { SITE_URL } from "@/lib/seo";` por `import { SITE_URL } from "@/lib/site";`.

- [ ] **Step 13: Borrar `queries.ts`**

Run: `grep -rn "@/lib/queries" src`
Expected: sin salida.

```bash
git rm -q src/lib/queries.ts
```

- [ ] **Step 14: Verificar**

Run: `grep -rn "@/generated/prisma" src --include=*.ts --include=*.tsx | grep -v "^src/generated/" | grep -v "^src/lib/prisma.ts"`
Expected: sin salida.

Run: `npx tsc --noEmit && npm run lint && npm test`
Expected: tsc limpio; lint 0 errores; tests en verde.

Smoke en desarrollo (sin build en paralelo):

```bash
ccres comprobar puerto:3000 && ccres reservar puerto:3000 --hasta 2h --motivo "psyopedia estática: smoke"
npx next dev -p 3000 > /tmp/psyopedia-dev.log 2>&1 &
DEV_PID=$!
curl -s -o /dev/null --retry 60 --retry-connrefused --retry-delay 1 http://localhost:3000/en
for path in /en /es /en/catalog "/en/catalog?level=1&sort=title" /es/catalog/operacion-paperclip /en/catalog/project-artichoke /es/iceberg /sitemap.xml; do
  printf "%s %s\n" "$(curl -s -o /dev/null -w '%{http_code}' "http://localhost:3000$path")" "$path"
done
curl -s http://localhost:3000/en/catalog/project-artichoke | grep -o 'MKUltra' | head -1
kill $DEV_PID; ccres liberar puerto:3000
```

Expected: `200` en todas las rutas (o `307`/`308` seguido de 200 si el middleware redirige) y `MKUltra` en la ficha de Artichoke (relación en los dos sentidos). Si el puerto 3000 está ocupado, usa otro puerto libre y avísalo.

- [ ] **Step 15: Commit**

```bash
git add -A src messages
git commit -m "feat: páginas, catálogo y SEO leen de content/" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 7: Retirada de la base de datos

**Files:**
- Delete: `prisma/`, `prisma.config.ts`, `docker-compose.yml`, `src/lib/prisma.ts`, `src/lib/env.ts`, `src/generated/` (no versionado)
- Modify: `package.json`, `.gitignore`, `.env.example`

**Interfaces:**
- Consumes: Task 6 (nada importa ya Prisma).
- Produces: repo sin Prisma ni Postgres.

- [ ] **Step 1: Comprobar que nada usa Prisma**

Run: `grep -rnE "@/lib/(prisma|env)|@/generated/prisma|@prisma/" src --include=*.ts --include=*.tsx | grep -v "^src/generated/" | grep -vE "^src/lib/(prisma|env)\.ts:"`
Expected: sin salida.

- [ ] **Step 2: Borrar**

```bash
git rm -r -q prisma prisma.config.ts docker-compose.yml src/lib/prisma.ts src/lib/env.ts
rm -r src/generated
```

Si `rm -r` se deniega, pide al usuario que ejecute `! rm -r src/generated`.

- [ ] **Step 3: Dependencias, scripts y gitignore**

```bash
npm uninstall prisma @prisma/client @prisma/adapter-pg pg dotenv @vercel/og
npm pkg delete scripts.postinstall
```

En `.gitignore`, borra la línea `/src/generated/prisma`.

- [ ] **Step 4: `.env.example`**

Sustituye `.env.example` entero por (si el permiso de escritura sobre ficheros `.env*` se deniega, pide al usuario que lo haga):

```
# Public URL of the site. Its path is the basePath:
#   https://kenserikawa.github.io/psyopedia -> /psyopedia
#   https://psyopedia.org                   -> (none)
NEXT_PUBLIC_SITE_URL=https://psyopedia.org
```

- [ ] **Step 5: Verificar**

Run: `grep -rnE "@prisma/|generated/prisma|DATABASE_URL|\"prisma\"" src package.json next.config.ts`
Expected: sin salida. (Algún comentario puede mencionar Prisma como referencia histórica; eso no cuenta.)

Run: `npx tsc --noEmit && npm run lint && npm test`
Expected: limpio, 0 errores, verde.

- [ ] **Step 6: Commit**

```bash
git add -A prisma prisma.config.ts docker-compose.yml src package.json package-lock.json .gitignore .env.example
git commit -m "chore: elimina Prisma, Postgres y sus dependencias" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 8: Export estático

**Files:**
- Modify: `next.config.ts`, `src/app/[locale]/layout.tsx`, `src/app/[locale]/legal/privacy/page.tsx`, `src/app/[locale]/legal/terms/page.tsx`, `src/app/not-found.tsx`, `src/components/layout/Header.tsx`, `src/components/layout/MobileNav.tsx`, `src/components/home/HeroSection.tsx`, `src/components/iceberg/OceanWater.tsx`, `package.json`
- Create: `src/app/page.tsx`, `public/.nojekyll`, `tests/static-export.test.ts`
- Delete: `src/middleware.ts`, `src/app/[locale]/[...rest]/`, `src/app/[locale]/opengraph-image.tsx`

**Interfaces:**
- Consumes: `BASE_PATH`, `SITE_URL`, `asset`, `rootRedirectScript` (Task 4); `loadContent` (Task 1).
- Produces: `npm run build` genera `out/`; script `npm run test:export`.

- [ ] **Step 1: Escribir el test del export**

`tests/static-export.test.ts`:

```ts
// Inspecciona out/ tras `npm run build`. Ejecutar con el mismo NEXT_PUBLIC_SITE_URL que el build.
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { test } from "node:test";
import { loadContent } from "../src/lib/content/load";
import { BASE_PATH, SITE_URL, rootRedirectScript } from "../src/lib/site";

const OUT = path.join(process.cwd(), "out");
const content = loadContent(path.join(process.cwd(), "content"));
const exists = (relative: string) => fs.existsSync(path.join(OUT, relative));
const read = (relative: string) => fs.readFileSync(path.join(OUT, relative), "utf8");

test("el export contiene la estructura estática del sitio", () => {
  for (const relative of [
    "index.html", "404.html", "robots.txt", "sitemap.xml", ".nojekyll",
    "en/index.html", "es/index.html", "en/catalog/index.html", "es/catalog/index.html",
    "en/iceberg/index.html", "es/iceberg/index.html",
    "en/legal/privacy/index.html", "es/legal/privacy/index.html",
    "en/legal/terms/index.html", "es/legal/terms/index.html",
  ]) {
    assert.ok(exists(relative), relative);
  }
  assert.equal(exists("api"), false, "no debe quedar nada de /api");
});

test("cada operación tiene su ficha en los dos idiomas", () => {
  assert.equal(content.operations.length, 46);
  for (const op of content.operations) {
    assert.ok(exists(`en/catalog/${op.slug}/index.html`), op.slug);
    assert.ok(exists(`es/catalog/${op.slugEs}/index.html`), op.slugEs);
  }
});

test("el sitemap lista todas las fichas con basePath y barra final", () => {
  const xml = read("sitemap.xml");
  for (const op of content.operations) {
    assert.ok(xml.includes(`<loc>${SITE_URL}/en/catalog/${op.slug}/</loc>`), op.slug);
    assert.ok(xml.includes(`<loc>${SITE_URL}/es/catalog/${op.slugEs}/</loc>`), op.slugEs);
  }
});

test("la raíz redirige a la home localizada bajo el basePath", () => {
  const html = read("index.html");
  assert.ok(html.includes(`url=${BASE_PATH}/en/`), "falta el meta refresh");
  assert.ok(html.includes(rootRedirectScript()), "falta el script de idioma");
});

test("los assets de _next usan el mismo basePath que src/lib/site.ts", () => {
  assert.ok(read("en/index.html").includes(`"${BASE_PATH}/_next/static/`), "basePath distinto en next.config.ts");
});

test("el catálogo estático trae la primera página sin filtros", () => {
  const cards = read("en/catalog/index.html").match(new RegExp(`href="${BASE_PATH}/en/catalog/[a-z0-9-]+/?"`, "g")) ?? [];
  assert.ok(cards.length >= 12, `solo ${cards.length} enlaces a fichas`);
});
```

Añade el script:

```bash
npm pkg set scripts.test:export="tsx --test tests/static-export.test.ts"
npm pkg delete scripts.start
```

- [ ] **Step 2: Verlo fallar**

Run: `npm run test:export`
Expected: FAIL — falta `out/index.html` (o `out/` entero).

- [ ] **Step 3: `next.config.ts`**

Sustituye `next.config.ts` entero por:

```ts
import createNextIntlPlugin from "next-intl/plugin";
import type { NextConfig } from "next";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

// next.config.ts no puede importar módulos TS locales (verificado con Next 16.2.1): repite el
// cálculo de BASE_PATH de src/lib/site.ts. test:export comprueba que los dos coinciden.
const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || "https://psyopedia.org").replace(/\/+$/, "");

const nextConfig: NextConfig = {
  output: "export",
  trailingSlash: true,
  basePath: new URL(SITE_URL).pathname.replace(/\/+$/, ""),
  images: { unoptimized: true },
  allowedDevOrigins: ["*.ngrok-free.app"],
};

export default withNextIntl(nextConfig);
```

- [ ] **Step 4: Layout estático, sin analítica y con `Referrer-Policy`**

En `src/app/[locale]/layout.tsx`:
- borra `import { Analytics } from "@vercel/analytics/next";` y la línea `<Analytics />`;
- cambia `import { getMessages } from "next-intl/server";` por `import { getMessages, setRequestLocale } from "next-intl/server";`;
- justo encima de `export function generateStaticParams()` añade `export const dynamicParams = false;`;
- dentro de `metadata`, tras `openGraph: { … },`, añade `referrer: "strict-origin-when-cross-origin",`;
- en `LocaleLayout`, justo después del bloque `if (!routing.locales.includes(…)) { notFound(); }`, añade `setRequestLocale(locale);`.

```bash
npm uninstall @vercel/analytics
```

En `src/app/[locale]/legal/privacy/page.tsx` y `src/app/[locale]/legal/terms/page.tsx`: añade `import { setRequestLocale } from "next-intl/server";` y, en el componente de página, justo después de `const { locale } = await params;`, la línea `setRequestLocale(locale);`.

- [ ] **Step 5: `basePath` en imágenes y textura**

- `src/components/layout/Header.tsx`: añade `import { asset } from "@/lib/site";`; `src="/logo.png"` → `src={asset("/logo.png")}`; `src="/iceberg-emoji.png"` → `src={asset("/iceberg-emoji.png")}`.
- `src/components/layout/MobileNav.tsx`: añade `import { asset } from "@/lib/site";`; `src="/iceberg-emoji.png"` → `src={asset("/iceberg-emoji.png")}`.
- `src/components/home/HeroSection.tsx`: añade `import { asset } from "@/lib/site";`; `src="/lucid-psyduck.png"` → `src={asset("/lucid-psyduck.png")}`.
- `src/components/iceberg/OceanWater.tsx`: añade `import { asset } from '@/lib/site'` (el fichero usa comillas simples y sin punto y coma); `useTexture('/textures/waternormals.jpg')` → `useTexture(asset('/textures/waternormals.jpg'))`.

Run: `grep -rnE "src=\"/|useTexture\('/" src`
Expected: sin salida.

- [ ] **Step 6: Raíz, 404 y borrados**

`src/app/page.tsx`:

```tsx
import type { Metadata } from "next";
import { BASE_PATH, rootRedirectScript } from "@/lib/site";
import "@/app/globals.css";

export const metadata: Metadata = {
  title: "Psyopedia",
  robots: { index: false },
};

// Sin middleware no hay detección de idioma en el servidor: la raíz redirige en el navegador
// y, sin JavaScript, el meta refresh lleva a la versión en inglés.
export default function RootPage() {
  const fallback = `${BASE_PATH}/en/`;

  return (
    <html lang="en">
      <head>
        <script dangerouslySetInnerHTML={{ __html: rootRedirectScript() }} />
        <meta httpEquiv="refresh" content={`0;url=${fallback}`} />
      </head>
      <body className="min-h-screen bg-background font-sans antialiased">
        <p className="p-8 text-center">
          <a href={fallback}>Psyopedia</a>
        </p>
      </body>
    </html>
  );
}
```

Sustituye `src/app/not-found.tsx` entero por:

```tsx
import Link from "next/link";
import "@/app/globals.css";

// Única página 404 del export: GitHub Pages la sirve para cualquier ruta inexistente, en
// cualquier idioma. El layout raíz es un pass-through, así que renderiza su propio <html>.
export default function RootNotFound() {
  return (
    <html lang="en">
      <body className="min-h-screen bg-background font-sans antialiased">
        <div className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center gap-4 px-4 text-center">
          <p className="font-mono text-sm uppercase tracking-widest text-muted-foreground">404</p>
          <h1 className="text-3xl font-bold">Page not found</h1>
          <p lang="es" className="text-xl text-muted-foreground">
            Página no encontrada
          </p>
          <div className="mt-4 flex flex-wrap justify-center gap-3">
            <Link href="/en" className="rounded-md border px-4 py-2 text-sm">
              Back to the surface
            </Link>
            <Link href="/es" lang="es" className="rounded-md border px-4 py-2 text-sm">
              Volver a la superficie
            </Link>
          </div>
        </div>
      </body>
    </html>
  );
}
```

```bash
git rm -r -q src/middleware.ts "src/app/[locale]/[...rest]" "src/app/[locale]/opengraph-image.tsx"
touch public/.nojekyll
```

(La imagen OG de la home vuelve en la Task 9.)

- [ ] **Step 7: Build y test del export**

Asegúrate de que no hay un `next dev` en marcha: `pgrep -af "next dev"` no debe devolver nada (si lo hay, para ese proceso o avisa al usuario).

Run: `NEXT_PUBLIC_SITE_URL=https://kenserikawa.github.io/psyopedia npm run build`
Expected: build correcto; la tabla de rutas marca `/[locale]`, `/[locale]/catalog/[slug]` (92 rutas) como `●` (SSG) y el resto como `○`. Ninguna `ƒ` (dinámica).

Run: `NEXT_PUBLIC_SITE_URL=https://kenserikawa.github.io/psyopedia npm run test:export`
Expected: PASS, 6 tests.

Si el build falla con un error del tipo "used `headers`/`requestLocale` … couldn't be rendered statically", a esa página o layout le falta `setRequestLocale(locale)`.

- [ ] **Step 8: Verificar el resto**

Run: `npx tsc --noEmit && npm run lint && npm test`
Expected: limpio, 0 errores, verde.

- [ ] **Step 9: Commit**

```bash
git add -A next.config.ts src public/.nojekyll tests package.json package-lock.json
git commit -m "feat: export estático con basePath, redirección de raíz y 404 bilingüe" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 9: Imágenes OG estáticas

**Files:**
- Create: `src/lib/og.tsx`, `src/app/og/[locale]/home.png/route.ts`, `src/app/og/[locale]/catalog/[file]/route.ts`
- Modify: `src/app/[locale]/layout.tsx`, `tests/static-export.test.ts`

**Interfaces:**
- Consumes: `getAllOperationSlugs`, `getOperationForLocale` (Task 3); `ogImageUrl`, `SITE_URL` (Task 4); `routing` de `@/i18n/routing`.
- Produces: `homeImage(locale: string): ImageResponse`, `operationImage(operation: Operation, locale: string): ImageResponse`; ficheros `out/og/<locale>/home.png` y `out/og/<locale>/catalog/<slug>.png`.

- [ ] **Step 1: Ampliar el test del export**

Al final de `tests/static-export.test.ts`:

```ts
const PNG_SIGNATURE = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

test("las imágenes OG son ficheros PNG reales", () => {
  const files = [
    "og/en/home.png",
    "og/es/home.png",
    ...content.operations.flatMap((op) => [`og/en/catalog/${op.slug}.png`, `og/es/catalog/${op.slugEs}.png`]),
  ];
  for (const relative of files) {
    assert.ok(exists(relative), relative);
    assert.ok(fs.readFileSync(path.join(OUT, relative)).subarray(0, 8).equals(PNG_SIGNATURE), `${relative} no es PNG`);
  }
});

test("las páginas enlazan su imagen OG", () => {
  assert.ok(read("en/catalog/mkultra/index.html").includes(`${SITE_URL}/og/en/catalog/mkultra.png`));
  assert.ok(read("es/catalog/operacion-paperclip/index.html").includes(`${SITE_URL}/og/es/catalog/operacion-paperclip.png`));
  assert.ok(read("es/index.html").includes(`${SITE_URL}/og/es/home.png`));
  assert.ok(read("en/catalog/index.html").includes(`${SITE_URL}/og/en/home.png`));
});
```

- [ ] **Step 2: Verlo fallar**

Run: `NEXT_PUBLIC_SITE_URL=https://kenserikawa.github.io/psyopedia npm run test:export`
Expected: FAIL en los dos tests nuevos (`og/en/home.png` no existe; el catálogo no enlaza imagen).

- [ ] **Step 3: Plantillas**

`src/lib/og.tsx`:

```tsx
import { ImageResponse } from "next/og";
import en from "../../messages/en.json";
import es from "../../messages/es.json";
import type { Operation } from "@/lib/content/types";
import { SITE_URL } from "@/lib/site";

const SIZE = { width: 1200, height: 630 };
const LEVEL_COLORS = ["#0EA5E9", "#3B82F6", "#6366F1", "#8B5CF6", "#7C3AED"];
const SITE_LABEL = SITE_URL.replace(/^https?:\/\//, "");
const BADGE = { background: "rgba(255,255,255,0.2)", padding: "4px 12px", borderRadius: "6px" };

const COPY = {
  en: {
    messages: en,
    subtitle: "A bilingual encyclopedia of psychological operations throughout history",
    explore: "Explore the iceberg",
    level: "Level",
    levels: ["Well-Known", "Underappreciated", "Leaked", "Alleged", "Deep Conspiracy"],
  },
  es: {
    messages: es,
    subtitle: "Una enciclopedia bilingüe de operaciones psicológicas a lo largo de la historia",
    explore: "Explora el iceberg",
    level: "Nivel",
    levels: ["Conocidas", "Subestimadas", "Filtradas", "Alegadas", "Conspiración Profunda"],
  },
};

const copyFor = (locale: string) => (locale === "es" ? COPY.es : COPY.en);

export function homeImage(locale: string): ImageResponse {
  const copy = copyFor(locale);

  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "60px",
          background: "linear-gradient(180deg, #0EA5E9 0%, #1E3A5F 45%, #0a1628 100%)",
          color: "white",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          <div style={{ fontSize: "84px", fontWeight: "bold", letterSpacing: "-2px" }}>PSYOPEDIA</div>
          <div style={{ fontSize: "32px", opacity: 0.85, lineHeight: 1.3, maxWidth: "900px" }}>{copy.subtitle}</div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
          <div style={{ display: "flex", gap: "10px" }}>
            {copy.levels.map((label, i) => (
              <span
                key={label}
                style={{ background: LEVEL_COLORS[i], padding: "6px 16px", borderRadius: "6px", fontSize: "20px" }}
              >
                {`${i + 1}. ${label}`}
              </span>
            ))}
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: "24px", opacity: 0.6 }}>
            <span>{copy.explore}</span>
            <span>{SITE_LABEL}</span>
          </div>
        </div>
      </div>
    ),
    SIZE,
  );
}

export function operationImage(operation: Operation, locale: string): ImageResponse {
  const copy = copyFor(locale);
  const { enums } = copy.messages;
  const level = operation.icebergLevel;
  const title = locale === "es" ? operation.titleEs : operation.title;
  const excerpt = locale === "es" ? operation.excerptEs : operation.excerpt;

  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "60px",
          background: `linear-gradient(135deg, ${LEVEL_COLORS[level - 1] ?? LEVEL_COLORS[1]} 0%, #1E293B 100%)`,
          color: "white",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <div style={{ display: "flex", gap: "12px", fontSize: "20px" }}>
            <span style={BADGE}>{`${copy.level} ${level}: ${copy.levels[level - 1]}`}</span>
            <span style={BADGE}>{enums.era[operation.era]}</span>
            <span style={BADGE}>{enums.status[operation.status]}</span>
          </div>
          <div style={{ fontSize: "56px", fontWeight: "bold", lineHeight: 1.1 }}>{title}</div>
          <div style={{ fontSize: "24px", opacity: 0.8, lineHeight: 1.4, maxHeight: "130px", overflow: "hidden" }}>
            {excerpt.length > 180 ? `${excerpt.slice(0, 180)}...` : excerpt}
          </div>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", fontSize: "24px" }}>
          <span style={{ fontWeight: "bold", fontSize: "32px" }}>PSYOPEDIA</span>
          <span style={{ opacity: 0.6 }}>{SITE_LABEL}</span>
        </div>
      </div>
    ),
    SIZE,
  );
}
```

- [ ] **Step 4: Route handlers**

`src/app/og/[locale]/home.png/route.ts`:

```ts
import { routing } from "@/i18n/routing";
import { homeImage } from "@/lib/og";

export const dynamicParams = false;

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function GET(_request: Request, { params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  return homeImage(locale);
}
```

`src/app/og/[locale]/catalog/[file]/route.ts`:

```ts
import { routing } from "@/i18n/routing";
import { getAllOperationSlugs, getOperationForLocale } from "@/lib/content";
import { operationImage } from "@/lib/og";

export const dynamicParams = false;

// Una carpeta propia evita que una operación con slug "home" pise la imagen de la home.
export function generateStaticParams() {
  return routing.locales.flatMap((locale) =>
    getAllOperationSlugs().map((op) => ({ locale, file: `${locale === "es" ? op.slugEs : op.slug}.png` })),
  );
}

export async function GET(_request: Request, { params }: { params: Promise<{ locale: string; file: string }> }) {
  const { locale, file } = await params;
  const operation = getOperationForLocale(locale, file.replace(/\.png$/, ""));
  if (!operation) return new Response("Not found", { status: 404 });
  return operationImage(operation, locale);
}
```

- [ ] **Step 5: Imagen por defecto en el layout**

En `src/app/[locale]/layout.tsx`, cambia `import { SITE_URL } from "@/lib/site";` por `import { ogImageUrl, SITE_URL } from "@/lib/site";` y sustituye el bloque `export const metadata: Metadata = { … };` por (el parámetro no usa `Props`, que exige `children`):

```tsx
export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const image = ogImageUrl(locale);

  return {
    metadataBase: new URL(SITE_URL),
    title: {
      template: "%s | Psyopedia",
      default: "Psyopedia",
    },
    description:
      "A comprehensive bilingual encyclopedia of psychological operations throughout history.",
    openGraph: {
      siteName: "Psyopedia",
      type: "website",
      images: [image],
    },
    twitter: {
      card: "summary_large_image",
      images: [image],
    },
    referrer: "strict-origin-when-cross-origin",
  };
}
```

- [ ] **Step 6: Build y test**

Run: `NEXT_PUBLIC_SITE_URL=https://kenserikawa.github.io/psyopedia npm run build && NEXT_PUBLIC_SITE_URL=https://kenserikawa.github.io/psyopedia npm run test:export`
Expected: la tabla de rutas incluye `/og/[locale]/home.png` (2) y `/og/[locale]/catalog/[file]` (92); test:export PASS, 8 tests.

Run: `file out/og/es/catalog/operacion-paperclip.png`
Expected: `PNG image data, 1200 x 630`.

- [ ] **Step 7: Verificar y commit**

Run: `npx tsc --noEmit && npm run lint && npm test`
Expected: limpio, 0 errores, verde.

```bash
git add -A src tests
git commit -m "feat(og): imágenes OG estáticas por idioma para home y fichas" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 10: Páginas legales sin cuentas ni cookies

**Files:**
- Modify: `src/app/[locale]/legal/privacy/page.tsx`, `src/app/[locale]/legal/terms/page.tsx`

**Interfaces:**
- Consumes: nada nuevo.
- Produces: textos legales coherentes con un sitio estático en GitHub Pages.

- [ ] **Step 1: Política de privacidad**

En `src/app/[locale]/legal/privacy/page.tsx` sustituye el objeto `content` entero (desde `const content: Record<…> = {` hasta su `};`) por:

```tsx
const content: Record<string, { title: string; updated: string; intro: string; sections: Section[] }> = {
  en: {
    title: "Privacy Policy",
    updated: "Last updated: October 14, 2026",
    intro:
      "Psyopedia is a bilingual encyclopedia of historical psychological operations. It is a static website: it has no accounts, no comments, and no forms. This policy explains the little data involved in visiting it.",
    sections: [
      {
        heading: "Data we collect",
        paragraphs: [
          "We do not ask for, collect, or store any personal data.",
          "Technical data: the site is hosted on GitHub Pages. GitHub logs the IP address of visitors for security purposes, as described in the GitHub Privacy Statement. We have no access to those logs.",
        ],
      },
      {
        heading: "Cookies and analytics",
        paragraphs: [
          "We do not set cookies and we do not use analytics, advertising, or tracking scripts. The language of the home page is chosen from your browser settings, inside your browser, and is not stored.",
        ],
      },
      {
        heading: "Third parties",
        paragraphs: [
          "The only provider involved is GitHub, Inc. (hosting), which may process data outside the EEA under standard contractual clauses. Links to external sources lead to sites with their own privacy policies.",
        ],
      },
      {
        heading: "Your rights",
        paragraphs: [
          `For any question about this policy or to exercise your data protection rights, write to ${CONTACT_EMAIL}. If you are in the EU/EEA you may also lodge a complaint with your supervisory authority.`,
        ],
      },
      {
        heading: "Changes",
        paragraphs: [
          "We may update this policy as the site evolves. Material changes will be announced on this page with a new revision date.",
        ],
      },
    ],
  },
  es: {
    title: "Política de privacidad",
    updated: "Última actualización: 14 de octubre de 2026",
    intro:
      "Psyopedia es una enciclopedia bilingüe de operaciones psicológicas históricas. Es un sitio web estático: no tiene cuentas, ni comentarios, ni formularios. Esta política explica los pocos datos que intervienen al visitarlo.",
    sections: [
      {
        heading: "Datos que recogemos",
        paragraphs: [
          "No pedimos, recogemos ni almacenamos ningún dato personal.",
          "Datos técnicos: el sitio está alojado en GitHub Pages. GitHub registra la dirección IP de los visitantes con fines de seguridad, como se describe en la Declaración de Privacidad de GitHub. No tenemos acceso a esos registros.",
        ],
      },
      {
        heading: "Cookies y analítica",
        paragraphs: [
          "No usamos cookies ni scripts de analítica, publicidad o seguimiento. El idioma de la página de inicio se elige a partir de la configuración de tu navegador, dentro de tu navegador, y no se guarda.",
        ],
      },
      {
        heading: "Terceros",
        paragraphs: [
          "El único proveedor que interviene es GitHub, Inc. (alojamiento), que puede tratar datos fuera del EEE bajo cláusulas contractuales tipo. Los enlaces a fuentes externas llevan a sitios con sus propias políticas de privacidad.",
        ],
      },
      {
        heading: "Tus derechos",
        paragraphs: [
          `Para cualquier duda sobre esta política o para ejercer tus derechos de protección de datos, escribe a ${CONTACT_EMAIL}. Si resides en la UE/EEE también puedes reclamar ante tu autoridad de control (en España, la AEPD).`,
        ],
      },
      {
        heading: "Cambios",
        paragraphs: [
          "Podremos actualizar esta política a medida que evolucione el sitio. Los cambios sustanciales se anunciarán en esta página con una nueva fecha de revisión.",
        ],
      },
    ],
  },
};
```

- [ ] **Step 2: Términos de uso**

En `src/app/[locale]/legal/terms/page.tsx` sustituye el objeto `content` entero por:

```tsx
const content: Record<string, { title: string; updated: string; intro: string; sections: Section[] }> = {
  en: {
    title: "Terms of Use",
    updated: "Last updated: October 14, 2026",
    intro:
      "By using Psyopedia you agree to these terms. Please read them — they are short and written for humans.",
    sections: [
      {
        heading: "Purpose of the site",
        paragraphs: [
          "Psyopedia is an educational and historical reference about psychological operations, propaganda, and information warfare. Entries are classified by how well documented they are — from declassified fact to unconfirmed allegation. An entry's presence is not an endorsement of its claims: lower-depth levels explicitly catalog allegations and conspiracy narratives as such, with source ratings.",
        ],
      },
      {
        heading: "Acceptable use",
        paragraphs: [
          "Do not scrape the site at abusive rates or attempt to disrupt the service.",
        ],
      },
      {
        heading: "Accuracy and liability",
        paragraphs: [
          "We work to source every entry, but historical material — especially leaked or alleged operations — is inherently uncertain. Content is provided \"as is\", without warranty. Psyopedia is not liable for decisions made based on the site's content.",
        ],
      },
      {
        heading: "Contact and changes",
        paragraphs: [
          `Questions about these terms, corrections, and suggestions for new entries: ${CONTACT_EMAIL}. We may update these terms; continued use after changes constitutes acceptance.`,
        ],
      },
    ],
  },
  es: {
    title: "Términos de uso",
    updated: "Última actualización: 14 de octubre de 2026",
    intro:
      "Al usar Psyopedia aceptas estos términos. Léelos — son breves y están escritos para humanos.",
    sections: [
      {
        heading: "Propósito del sitio",
        paragraphs: [
          "Psyopedia es una referencia educativa e histórica sobre operaciones psicológicas, propaganda y guerra de la información. Las entradas se clasifican según su nivel de documentación — desde hechos desclasificados hasta alegaciones sin confirmar. La presencia de una entrada no supone un respaldo de sus afirmaciones: los niveles más profundos catalogan explícitamente alegaciones y narrativas conspirativas como tales, con valoración de fuentes.",
        ],
      },
      {
        heading: "Uso aceptable",
        paragraphs: [
          "No hagas scraping a ritmos abusivos ni intentes interrumpir el servicio.",
        ],
      },
      {
        heading: "Exactitud y responsabilidad",
        paragraphs: [
          "Trabajamos para documentar cada entrada con fuentes, pero el material histórico — especialmente operaciones filtradas o alegadas — es intrínsecamente incierto. El contenido se ofrece \"tal cual\", sin garantías. Psyopedia no se hace responsable de decisiones tomadas a partir del contenido del sitio.",
        ],
      },
      {
        heading: "Contacto y cambios",
        paragraphs: [
          `Dudas sobre estos términos, correcciones y propuestas de nuevas entradas: ${CONTACT_EMAIL}. Podemos actualizar estos términos; el uso continuado tras los cambios implica su aceptación.`,
        ],
      },
    ],
  },
};
```

- [ ] **Step 3: Verificar**

Run: `grep -niE "account|cuenta|cookie.*authent|OAuth|Google|contribu|coment" "src/app/[locale]/legal/privacy/page.tsx" "src/app/[locale]/legal/terms/page.tsx"`
Expected: solo las frases que niegan cuentas/comentarios ("no accounts, no comments", "no tiene cuentas, ni comentarios"); ninguna mención a Google, OAuth ni contribuciones.

Run: `npx tsc --noEmit && npm run lint`
Expected: limpio, 0 errores.

- [ ] **Step 4: Commit**

```bash
git add "src/app/[locale]/legal"
git commit -m "docs(legal): privacidad y términos para un sitio estático sin cuentas" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 11: Despliegue en GitHub Pages y documentación

**Files:**
- Create: `.github/workflows/deploy.yml`
- Modify: `README.md`, `CLAUDE.md`, `.claude/skills/verify/SKILL.md`, `docs/superpowers/specs/2026-09-19-motor-senales-sociales-design.md`

**Interfaces:**
- Consumes: scripts `test`, `lint`, `build`, `test:export`.
- Produces: despliegue automático en cada push a `master`.

- [ ] **Step 1: Workflow**

`.github/workflows/deploy.yml`:

```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: [master]
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: pages
  cancel-in-progress: false

env:
  # Su ruta es el basePath. Para un dominio propio: variable del repo SITE_URL=https://<dominio> y public/CNAME.
  NEXT_PUBLIC_SITE_URL: ${{ vars.SITE_URL || 'https://kenserikawa.github.io/psyopedia' }}

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: npm
      - run: npm ci
      - run: npm test
      - run: npm run lint
      - run: npm run build
      - run: npm run test:export
      - uses: actions/upload-pages-artifact@v3
        with:
          path: out

  deploy:
    needs: build
    runs-on: ubuntu-latest
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    steps:
      - id: deployment
        uses: actions/deploy-pages@v4
```

- [ ] **Step 2: README**

Sustituye `README.md` entero por:

````markdown
# Psyopedia

Bilingual (EN/ES) encyclopedia of psychological operations throughout history — from declassified fact to deep-water allegation. Features a scroll-driven 3D iceberg that descends through five classification levels, a filterable catalog, and locale-aware SEO.

The site is fully static: Next.js exports plain HTML to `out/`, served from GitHub Pages. There is no database, no API, and no user accounts. All content lives in `content/`.

## Stack

- **Next.js 16** (App Router, `output: "export"`, TypeScript strict)
- **Content as files** (`content/`), validated with **Zod** at build time
- **next-intl** (locale-prefixed routing `/en`, `/es`)
- **React Three Fiber + drei + GSAP + Lenis** (procedural 3D iceberg, scroll-driven camera)
- **Tailwind CSS 4 + shadcn/ui**, EB Garamond via `next/font`

## Local development

```bash
npm install
npm run dev          # http://localhost:3000
```

No environment variables are needed for development.

## Content

```
content/
├─ tags.json                       # { "<slug>": { "name": "…", "nameEs": "…" } }
└─ operations/
   └─ <slug>/                      # folder name = English slug
      ├─ meta.json                 # everything except the article body
      ├─ body.en.md
      └─ body.es.md
```

To add an operation, create a folder with those three files. `meta.json` fields: `slug`, `slugEs`, `title`, `titleEs`, `aliases`, `icebergLevel` (1–5), `era`, `types`, `actors`, `targets`, `outcome`, `status`, `excerpt`, `excerptEs`, `publishedAt` (`YYYY-MM-DD`), optional `updatedAt` and `coverImage`, `tags` (keys of `tags.json`), `related` (English slugs; the link shows on both operations) and `sources` (`url` or `null`, `title`, `type`, `credibility` 1–5). Allowed enum values are in `src/lib/content/enums.ts`.

If a file is invalid, `npm test` and `npm run build` fail with the file and the field at fault.

## Useful commands

```bash
npm run dev          # development server
npm run build        # static export to out/
npm run lint         # ESLint
npm test             # unit tests (content, catalog, site URLs, iceberg geometry)
npm run test:export  # checks out/ after a build — use the same NEXT_PUBLIC_SITE_URL as the build
```

## Deploying (GitHub Pages)

`.github/workflows/deploy.yml` runs tests, lint, build and `test:export` on every push to `master`, then publishes `out/`.

One-time setup: in the GitHub repository, **Settings → Pages → Source: GitHub Actions**.

The public URL comes from `NEXT_PUBLIC_SITE_URL`, and its path is the basePath. By default the workflow builds for `https://kenserikawa.github.io/psyopedia` (basePath `/psyopedia`).

**Custom domain:** add `public/CNAME` with the domain, set the repository variable `SITE_URL` to `https://<domain>` (Settings → Secrets and variables → Actions → Variables), and point the DNS to GitHub Pages. No code changes are needed.

GitHub Pages does not allow custom HTTP headers; the referrer policy is set with a `<meta>` tag.

## Project structure

See `CLAUDE.md` for the architecture guide. Legal pages live at `/[locale]/legal/privacy` and `/[locale]/legal/terms` — update the contact email placeholder (`contact@psyopedia.org`) before launch.
````

- [ ] **Step 3: CLAUDE.md**

Sustituye `CLAUDE.md` entero por:

````markdown
# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## Build & Development Commands

```bash
npm run dev          # Start dev server (Turbopack, port 3000)
npm run build        # Static export to out/ (output: "export")
npm run lint         # Run ESLint
npm test             # Unit tests with Node + tsx (content, catalog, site URLs, iceberg geometry)
npm run test:export  # Inspect out/ after a build (same NEXT_PUBLIC_SITE_URL as the build)
```

There is no `npm run start`: the build is plain HTML. Preview it by serving `out/` (see the `verify` skill).

## Architecture

**Bilingual psyops encyclopedia, fully static** — Next.js 16 App Router exported with `output: "export"` and served from GitHub Pages. No database, no users, no API. Two locales (EN/ES) via next-intl with locale-prefixed routing (`/en/...`, `/es/...`).

### Tech Stack
- **Next.js 16** with App Router, TypeScript strict, `output: "export"`, `trailingSlash: true`
- **Content as files** in `content/`, validated with **Zod** at build time
- **next-intl** for i18n — routing config at `src/i18n/`, messages at `messages/`
- **shadcn/ui** + Tailwind CSS 4 — components in `src/components/ui/`
- **next/og** for OG images, generated at build as real `.png` files
- **EB Garamond** (serif) as primary typeface via `next/font/google`

### Content
- `content/tags.json` — tag dictionary `{ "<slug>": { "name", "nameEs" } }`
- `content/operations/<slug>/meta.json` + `body.en.md` + `body.es.md` — one folder per operation; folder name = English slug
- `src/lib/content/`: `enums.ts` and `types.ts` (client-safe), `schema.ts` (Zod), `load.ts` (`loadContent(dir)`, throws `ContentError` naming file and field), `index.ts` (server-only API: `getHomepageData`, `getCatalogSummaries`, `getDistinctActors`, `getOperationForLocale`, `getAllOperationSlugs`, `getIcebergData`)
- `related` is declared once and shown on both operations
- An invalid content file stops `npm test` and the build

### 3D Iceberg Visualization
The `/[locale]/iceberg` route is a scroll-driven 3D experience built with:
- **@react-three/fiber + drei** for the Three.js scene (`src/components/iceberg/`)
- **GSAP + Lenis** for scroll-driven camera animation through 5 depth levels
- **Zustand** store (`useIcebergStore.ts`) tracks activeLevel, scrollProgress, hoveredOperationId
- Level config (camera positions, fog, colors) defined in `constants.ts`
- All iceberg components are client-side (`"use client"`)

### Key Patterns
- **Server components by default** — `"use client"` only for interactive components (catalog browser and filters, mobile nav, share buttons, iceberg 3D)
- **Data** — pages call `@/lib/content` directly; it reads `content/` once per build process. Never import it from a client component (it uses `fs`).
- **Catalog** — the server renders page 1 unfiltered as the `Suspense` fallback; `CatalogBrowser` reads the URL with `useSearchParams` and applies `parseCatalogFilters` + `filterCatalog` (`src/lib/catalog.ts`) in the browser
- **URLs** — `src/lib/site.ts`: `SITE_URL` and `BASE_PATH` come from `NEXT_PUBLIC_SITE_URL`. Use `pageUrl()` for absolute page URLs (trailing slash), `asset()` for files in `public/` (next/image and three.js do not add the basePath), `ogImageUrl()` for OG images
- **SEO** — `src/lib/seo.ts` for operation metadata/JSON-LD, static sitemap at `src/app/sitemap.ts`
- **Locale-aware content** — dual fields (title/titleEs, bodyEn/bodyEs, slug/slugEs); components select by locale prop
- **Tests** — `npm test` uses Node's built-in runner through tsx; `npm run test:export` checks the exported `out/`

### Static Export Gotchas
- Every layout and page under `[locale]` calls `setRequestLocale(locale)` before using next-intl; without it the route turns dynamic and the export fails
- Dynamic segments export `generateStaticParams` and `dynamicParams = false`
- No middleware: `/` is a static page that redirects with an inline script (`rootRedirectScript`) and a meta refresh fallback
- `next.config.ts` cannot import local TS modules: it repeats the `BASE_PATH` computation from `src/lib/site.ts` (`test:export` checks they match)
- OG images are route handlers under `src/app/og/` that emit `.png` files; do not use `opengraph-image.tsx` (GitHub Pages would serve an extensionless file)
- Never run `next build` while `next dev` is running: they share `.next`
- Read `node_modules/next/dist/docs/` for current API docs when unsure about conventions

### Route Structure
- `/` — static redirect to `/en/` or `/es/` by browser language
- `/[locale]` — Homepage (hero, stats, featured ops)
- `/[locale]/catalog` — Catalog with client-side filters and pagination (URL query driven)
- `/[locale]/catalog/[slug]` — Operation detail with body, sources, tags and related operations
- `/[locale]/iceberg` — Scroll-driven 3D experience (`IcebergJourneyWrapper` → `IcebergJourney`)
- `/[locale]/legal/{privacy,terms}` — Legal pages (bilingual content inline)
- `/og/[locale]/home.png`, `/og/[locale]/catalog/<slug>.png` — OG images
- `404.html` — single bilingual 404 (`src/app/not-found.tsx`)

### Environment Variables
Only `NEXT_PUBLIC_SITE_URL` (default `https://psyopedia.org`). Its path is the basePath: `https://kenserikawa.github.io/psyopedia` → `/psyopedia`. In CI it comes from the repository variable `SITE_URL`.

### Deployment
`.github/workflows/deploy.yml` tests, builds and publishes `out/` to GitHub Pages on every push to `master`. See README for the one-time setup and custom domains.

### next-intl Setup
- Plugin wraps Next config via `next-intl/plugin` pointing to `src/i18n/request.ts`
- Routing config (`src/i18n/routing.ts`): locales `["en", "es"]`, default `"en"`
- Message bundles at `messages/en.json` and `messages/es.json`
````

- [ ] **Step 4: Skill `verify`**

Sustituye `.claude/skills/verify/SKILL.md` entero por:

````markdown
---
name: verify
description: Cómo compilar, servir y verificar el export estático de Psyopedia en local
---

# Verificar Psyopedia (export estático)

## Receta

No compiles con `next dev` en marcha: comparten `.next`.

```bash
export NEXT_PUBLIC_SITE_URL=http://localhost:4173/psyopedia
npm run build && npm run test:export

ccres comprobar puerto:4173 && ccres reservar puerto:4173 --hasta 2h --motivo "verificar psyopedia"
SITE=$(mktemp -d) && ln -s "$PWD/out" "$SITE/psyopedia"
python3 -m http.server 4173 --directory "$SITE" &
SERVER_PID=$!
# … verificar en http://localhost:4173/psyopedia/ …
kill $SERVER_PID; ccres liberar puerto:4173
```

Servir `out/` bajo `/psyopedia/` imita GitHub Pages (basePath incluido). `python3 -m http.server` redirige `/ruta` a `/ruta/` como Pages, pero no sirve `404.html` en rutas inexistentes: comprueba esa página abriendo `/psyopedia/404.html`.

## Flujos que merece la pena conducir
- `/psyopedia/` — redirige a `/psyopedia/es/` o `/psyopedia/en/` según el idioma del navegador.
- `/psyopedia/es/catalog/?level=3&sort=title` — filtros en el navegador; búsqueda con y sin tilde; paginación; recargar con query.
- `/psyopedia/es/catalog/operacion-paperclip/` y `/psyopedia/en/catalog/project-artichoke/` — relacionadas en los dos sentidos.
- `/psyopedia/es/iceberg/` — escena 3D (procedural, sin GLB); clic en una operación lleva a la ficha en español. Los errores de React en el canvas los captura `[locale]/error.tsx` ("Algo ha salido mal").
- `/psyopedia/og/es/catalog/operacion-paperclip.png` — imagen OG.
- `/psyopedia/{en,es}/legal/{privacy,terms}/` — contenido bilingüe inline en las páginas.

## Gotchas
- rtk (hook del usuario) comprime la salida de eslint y otros; usa `rtk proxy <cmd>` para la salida cruda.
- Los screenshots del MCP de navegador se guardan en la raíz del repo (ignorados por `/*.png`).
- Ruido esperado en consola: warnings de deprecación de THREE.Clock y toNonIndexed.
- `@react-three/postprocessing` hace `JSON.stringify(props)` en efectos envueltos: nunca pasar RefObjects como `ref` a Vignette/Noise/ChromaticAberration (React 19 mete ref en props) — usar callback refs (ver PostFX.tsx).
````

- [ ] **Step 5: Aparcar la spec del motor de señales**

En `docs/superpowers/specs/2026-09-19-motor-senales-sociales-design.md`, inserta tras la primera línea (`# Motor de señales sociales — …`) una línea en blanco y:

```markdown
> **Aparcada (2026-10-14).** Psyopedia pasó a ser un sitio estático sin base de datos ni
> usuarios (`2026-10-14-sitio-estatico-design.md`). Este diseño necesita base de datos, cron y
> panel de administración; retomarlo exige reintroducir un backend.
```

- [ ] **Step 6: Verificar**

Run: `node -e 'const y=require("fs").readFileSync(".github/workflows/deploy.yml","utf8"); for (const k of ["npm ci","npm test","npm run lint","npm run build","npm run test:export","upload-pages-artifact","deploy-pages","NEXT_PUBLIC_SITE_URL"]) if(!y.includes(k)) throw new Error("falta "+k); console.log("ok")'`
Expected: `ok`

Run: `grep -nE "prisma|Prisma|NextAuth|DATABASE_URL|contribut" README.md CLAUDE.md .claude/skills/verify/SKILL.md`
Expected: sin salida.

- [ ] **Step 7: Commit**

```bash
git add .github/workflows/deploy.yml README.md CLAUDE.md .claude/skills/verify/SKILL.md docs/superpowers/specs/2026-09-19-motor-senales-sociales-design.md
git commit -m "docs: despliegue en GitHub Pages y documentación del sitio estático" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 12: Verificación final en navegador

**Files:** ninguno (solo verificación; si aparece un fallo, se corrige en su tarea de origen con un commit `fix:`).

**Interfaces:**
- Consumes: todo lo anterior.
- Produces: evidencia de que el export funciona bajo `/psyopedia/`.

- [ ] **Step 1: Build bajo el basePath de prueba**

```bash
pgrep -af "next dev"   # no debe devolver nada
export NEXT_PUBLIC_SITE_URL=http://localhost:4173/psyopedia
npm test && npm run lint && npm run build && npm run test:export
```

Expected: todo en verde; test:export 8/8.

- [ ] **Step 2: Servir como GitHub Pages**

```bash
ccres comprobar puerto:4173 && ccres reservar puerto:4173 --hasta 2h --motivo "psyopedia estática: verificación final"
SITE=$(mktemp -d) && ln -s "$PWD/out" "$SITE/psyopedia"
python3 -m http.server 4173 --directory "$SITE" > /tmp/psyopedia-serve.log 2>&1 &
curl -s -o /dev/null --retry 20 --retry-connrefused --retry-delay 1 http://localhost:4173/psyopedia/
```

- [ ] **Step 3: Recorrido con Chrome DevTools (MCP)**

Con `navigate_page`, `take_snapshot`, `list_console_messages` y `take_screenshot`, comprueba y anota el resultado de cada punto:

1. `http://localhost:4173/psyopedia/` termina en `/psyopedia/en/` (o `/es/` si el navegador está en español).
2. `/psyopedia/en/` y `/psyopedia/es/`: hero con la mascota visible (imagen con basePath), estadísticas `46` operaciones y 6 destacadas.
3. `/psyopedia/en/catalog/`: 12 tarjetas y paginación "Page 1 of 4". Marcar el nivel 3: la URL gana `?level=3` y el recuento cambia. Buscar `operacion` en `/psyopedia/es/catalog/`: aparecen Paperclip e INFEKTION. Recargar con la query: se conserva el filtro. `?sort=most-viewed`: aviso de filtros inválidos.
4. `/psyopedia/es/catalog/operacion-paperclip/`: ficha en español, fuentes, botón de compartir con URL `http://localhost:4173/psyopedia/es/catalog/operacion-paperclip/`.
5. `/psyopedia/en/catalog/project-artichoke/`: aparece MKUltra en relacionadas.
6. `/psyopedia/es/iceberg/`: la escena carga (sin "Algo ha salido mal"), el agua tiene textura y un clic en una operación abre su ficha en `/psyopedia/es/catalog/<slugEs>/`.
7. `/psyopedia/404.html`: 404 bilingüe con enlaces a `/psyopedia/en/` y `/psyopedia/es/`.
8. `/psyopedia/og/es/catalog/operacion-paperclip.png`: imagen con título y etiquetas en español.
9. Consola: sin errores (solo los warnings conocidos de THREE).

- [ ] **Step 4: Parar y liberar**

```bash
pkill -f "http.server 4173"; ccres liberar puerto:4173
```

- [ ] **Step 5: Resumen**

Informa al usuario de qué puntos pasaron y adjunta cualquier fallo con su evidencia. Recuérdale los pasos manuales: activar Pages con origen "GitHub Actions" y hacer merge/push a `master`.
