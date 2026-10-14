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
- After deleting a route, `npx tsc --noEmit` can fail on stale `.next/dev/types` until `next dev` runs again; that cache is local only
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
