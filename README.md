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
