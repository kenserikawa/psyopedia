# Psyopedia Master Plan

> **For agentic workers:** This is a multi-phase project. Each phase has its own detailed implementation plan. Execute phases in order.

**Goal:** Build a bilingual (EN/ES) Next.js encyclopedia of psychological operations with interactive iceberg visualization, community contributions, and moderation system.

**Architecture:** Next.js 14 App Router with server components by default. PostgreSQL via Prisma ORM. NextAuth v5 for authentication. next-intl for i18n with locale-prefixed routing. shadcn/ui for design system. Full-text search via PostgreSQL tsvector.

**Tech Stack:** Next.js 14, TypeScript, Prisma, PostgreSQL, NextAuth v5, next-intl, shadcn/ui, Tailwind CSS, Zod, @vercel/og, MDX

---

## Phase Overview

### Phase 1: Foundation (this plan)
- Initialize Next.js project with all dependencies
- Prisma schema with all models and enums
- Environment validation with Zod
- Prisma singleton client
- next-intl middleware and locale routing
- i18n message files (EN/ES)
- Root layout with locale support
- Database migration and seed with 25 operations
- **Produces:** Project that builds, migrates, and seeds successfully

### Phase 2: Core Pages
- Homepage with hero, stats, featured operations
- Catalog page with filters (level, era, type, country, outcome, search)
- Operation detail page with MDX rendering, sources, related ops
- Programmatic pages for era, country, type
- **Produces:** Browsable site with all public pages

### Phase 3: Iceberg Visualization
- Interactive SVG iceberg component with 5 clickable zones
- Level labels and operation count per zone
- Scroll-triggered depth reveal animation
- Dedicated `/iceberg` page
- **Produces:** Working interactive iceberg on homepage and dedicated page

### Phase 4: Auth & User System
- NextAuth v5 configuration (Google + GitHub providers)
- User profile with reputation display
- Protected route middleware
- Role-based access (USER, MODERATOR, ADMIN)
- **Produces:** Working auth flow with role enforcement

### Phase 5: Contributions & Moderation
- Contribution form (new operation, edit, add source)
- Admin panel with dashboard, moderation queue
- Approve/reject workflow with reputation changes
- Comment system with moderation
- **Produces:** Full contribution lifecycle from submit to approve/reject

### Phase 6: API Routes & Search
- REST API endpoints for operations, contributions, comments
- Full-text search with PostgreSQL tsvector
- Search API endpoint
- **Produces:** Complete API layer and working search

### Phase 7: SEO & Polish
- generateMetadata for all pages
- JSON-LD Article schema on operation pages
- Dynamic OG image generation with @vercel/og
- XML sitemap generation
- robots.txt
- Share buttons
- **Produces:** Production-ready SEO, sitemap, and social sharing
