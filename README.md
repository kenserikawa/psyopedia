# Psyopedia

Bilingual (EN/ES) encyclopedia of psychological operations throughout history — from declassified fact to deep-water allegation. Features a scroll-driven 3D iceberg that descends through five classification levels, a filterable catalog, community contributions with moderation, and locale-aware SEO.

## Stack

- **Next.js 16** (App Router, server components by default, TypeScript strict)
- **Prisma 7** + PostgreSQL (PrismaPg driver adapter, generated client at `src/generated/prisma`)
- **NextAuth v5** (JWT sessions, Google + GitHub OAuth)
- **next-intl** (locale-prefixed routing `/en`, `/es`)
- **React Three Fiber + drei + GSAP + Lenis** (procedural 3D iceberg, scroll-driven camera)
- **Tailwind CSS 4 + shadcn/ui**, EB Garamond via `next/font`

## Local development

```bash
npm install                        # runs prisma generate via postinstall
cp .env.example .env               # fill in DATABASE_URL at minimum
docker compose up -d               # local PostgreSQL (or use `npx prisma dev`)
npx prisma migrate dev             # apply migrations
npx prisma db seed                 # seed 25 operations (idempotent)
npm run dev                        # http://localhost:3000
```

OAuth variables are optional for local development — without them the site works read-only (no sign-in, contributions, or comments).

## Environment variables

| Variable | Required | Notes |
| --- | --- | --- |
| `DATABASE_URL` | yes | PostgreSQL connection string (validated at startup) |
| `SHADOW_DATABASE_URL` | dev only | Used by Prisma for migration diffing |
| `AUTH_SECRET` | production | `npx auth secret` or `openssl rand -base64 32` |
| `AUTH_GOOGLE_ID` / `AUTH_GOOGLE_SECRET` | for Google sign-in | Callback: `<origin>/api/auth/callback/google` |
| `AUTH_GITHUB_ID` / `AUTH_GITHUB_SECRET` | for GitHub sign-in | Callback: `<origin>/api/auth/callback/github` |
| `NEXT_PUBLIC_SITE_URL` | production | Canonical origin used by SEO/sitemap (defaults to `https://psyopedia.org`) |

## Deploying to production (Vercel + Neon)

1. **Database** — create a PostgreSQL instance (e.g. [Neon](https://neon.tech) free tier). Copy the pooled connection string.
2. **Repository** — push this repo to GitHub/GitLab.
3. **Vercel** — import the repo. Framework preset: Next.js. Set the environment variables from the table above (`DATABASE_URL`, `AUTH_SECRET`, `NEXT_PUBLIC_SITE_URL`, OAuth credentials).
4. **Migrations & seed** — run against the production database:
   ```bash
   DATABASE_URL=<prod-url> npx prisma migrate deploy
   DATABASE_URL=<prod-url> npx prisma db seed
   ```
5. **OAuth apps** — create production OAuth apps in Google Cloud Console and GitHub Developer Settings with the production callback URLs.
6. **Post-launch** — verify `https://<domain>/sitemap.xml` and `robots.txt`, then register the property in Google Search Console. Vercel Analytics is already mounted (cookieless).

## Useful commands

```bash
npm run build        # production build
npm run lint         # ESLint
npx prisma studio    # database GUI
npx prisma generate  # regenerate client after schema changes
```

## Project structure

See `CLAUDE.md` for a detailed architecture guide (routes, data-fetching patterns, i18n setup, Prisma 7 specifics). Legal pages live at `/[locale]/legal/privacy` and `/[locale]/legal/terms` — update the contact email placeholder (`contact@psyopedia.org`) before launch.
