# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## Build & Development Commands

```bash
npm run dev          # Start dev server (Turbopack, port 3000)
npm run build        # Production build
npm run start        # Start production server
npm run lint         # Run ESLint
npx prisma migrate dev --name <name>  # Create and apply a migration
npx prisma db seed   # Seed database (idempotent via upserts)
npx prisma studio    # Open Prisma Studio GUI
npx prisma generate  # Regenerate Prisma client (after schema changes)
```

## Architecture

**Bilingual psyops encyclopedia** — Next.js 16 App Router with server components by default. Two locales (EN/ES) via next-intl with locale-prefixed routing (`/en/...`, `/es/...`).

### Tech Stack
- **Next.js 16** with App Router, TypeScript strict
- **Prisma 7** with PostgreSQL (PrismaPg adapter) — generated client at `src/generated/prisma`
- **NextAuth v5** (beta) with Prisma adapter, JWT sessions, Google/GitHub providers
- **next-intl** for i18n — routing config at `src/i18n/`, messages at `messages/`
- **shadcn/ui** + Tailwind CSS 4 — components in `src/components/ui/`
- **@vercel/og** for dynamic OG image generation
- **EB Garamond** (serif) as primary typeface via `next/font/google`

### Key Patterns
- **Server components by default** — `"use client"` only for interactive components (filters, forms, auth menus)
- **Data fetching** — All Prisma queries centralized in `src/lib/queries.ts`, called directly in server components
- **Server actions** — Mutations in `src/lib/actions/` (contributions.ts, comments.ts, moderation.ts)
- **Auth helpers** — `src/lib/auth.ts` (NextAuth config), `src/lib/auth-utils.ts` (requireAuth/requireModerator/requireAdmin)
- **SEO** — `src/lib/seo.ts` for metadata/JSON-LD helpers, dynamic sitemap at `src/app/sitemap.ts`
- **Locale-aware content** — Operations have dual fields (title/titleEs, bodyEn/bodyEs, slug/slugEs); components select by locale prop

### Next.js 16 Gotchas
- **`params` and `searchParams` are Promises** — must be awaited in page/layout components: `const { locale } = await params;`
- **`middleware.ts` shows a deprecation warning** about migrating to `proxy` — this is cosmetic, middleware still works
- Read `node_modules/next/dist/docs/` for current API docs when unsure about conventions

### Prisma 7 Specifics
- Generator provider is `"prisma-client"` (not `"prisma-client-js"`)
- Client output at `src/generated/prisma` — import types and client from `@/generated/prisma`
- Requires PrismaPg driver adapter — see `src/lib/prisma.ts`
- Datasource URL configured in `prisma.config.ts` (not in schema's datasource block)
- Seed command configured in `prisma.config.ts` as `npx tsx prisma/seed.ts`

### Database
- Prisma schema at `prisma/schema.prisma` — 9 models, 8 enums
- Seed file at `prisma/seed.ts` — 25 operations across 5 iceberg levels
- Generated client is gitignored — `prisma generate` runs via postinstall

### Route Structure
- `/[locale]` — Homepage (hero, stats, featured ops)
- `/[locale]/catalog` — Catalog with filter sidebar (searchParams-driven)
- `/[locale]/catalog/[slug]` — Operation detail with body, sources, tags, comments
- `/[locale]/iceberg` — Interactive SVG iceberg visualization
- `/[locale]/contribute` — Contribution form (auth-gated)
- `/[locale]/admin/*` — Dashboard, moderation queue, operations, comments (MODERATOR/ADMIN only)
- `/api/operations`, `/api/search`, `/api/contributions`, `/api/comments` — REST API
- `/api/og/[slug]` — Dynamic OG image generation
- `/api/auth/[...nextauth]` — NextAuth endpoints

### Environment Variables
See `.env.example` for all variables. Only `DATABASE_URL` is validated at startup via Zod (`src/lib/env.ts`). Auth variables (AUTH_SECRET, AUTH_GOOGLE_ID/SECRET, AUTH_GITHUB_ID/SECRET) are optional for local dev without OAuth.
