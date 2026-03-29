# Phase 2: Core Pages — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the three core public pages — Homepage with stats and featured operations, Catalog with filters/search/sort, and Operation detail page with body content, sources, related ops, and tags.

**Architecture:** Server components by default. Data fetched via Prisma in server components. Filters managed via URL searchParams (no client state). Client components only for interactive filter UI. shadcn/ui for all UI primitives. Locale-aware with next-intl translations.

**Tech Stack:** Next.js 16 App Router, Prisma 7, next-intl, shadcn/ui, Tailwind CSS

---

## File Structure

```
src/
├── app/[locale]/
│   ├── layout.tsx                          # UPDATE: add Header + Footer
│   ├── page.tsx                            # UPDATE: full homepage
│   └── catalog/
│       ├── page.tsx                        # Catalog page (server component)
│       └── [slug]/
│           └── page.tsx                    # Operation detail page
├── components/
│   ├── layout/
│   │   ├── Header.tsx                      # Nav bar with locale switcher
│   │   └── Footer.tsx                      # Site footer
│   ├── home/
│   │   ├── HeroSection.tsx                 # Hero with tagline + CTAs
│   │   ├── StatsBar.tsx                    # Operations/eras/sources counts
│   │   └── FeaturedGrid.tsx                # Featured operations grid
│   ├── catalog/
│   │   ├── CatalogFilters.tsx              # Client: filter sidebar
│   │   ├── OperationCard.tsx               # Single operation card
│   │   └── OperationGrid.tsx               # Grid of operation cards
│   └── operation/
│       ├── OperationHeader.tsx             # Title, badges, metadata
│       ├── OperationBody.tsx               # Rendered body content
│       ├── SourcesList.tsx                 # Sources with credibility
│       └── RelatedOps.tsx                  # Related operations cards
├── lib/
│   ├── queries.ts                          # All Prisma query functions
│   └── utils.ts                            # EXISTING: cn() utility
```

---

### Task 1: Install Required shadcn/ui Components

**Files:**
- Modify: `src/components/ui/` (new files added by shadcn CLI)

- [ ] **Step 1: Install shadcn/ui components needed for Phase 2**

```bash
cd /home/ken/Desktop/html/psyopedia
npx shadcn@latest add badge card input select checkbox separator
```

These provide: Badge (tags, status), Card (operation cards), Input (search), Select (sort), Checkbox (level filters), Separator (visual dividers).

- [ ] **Step 2: Commit**

```bash
git add src/components/ui/
git commit -m "chore: add shadcn/ui badge, card, input, select, checkbox, separator"
```

---

### Task 2: Data Query Layer

**Files:**
- Create: `src/lib/queries.ts`

- [ ] **Step 1: Create the query functions**

Write `src/lib/queries.ts`:

```typescript
import { prisma } from "@/lib/prisma";
import type { Era, OperationType, Outcome, OperationStatus } from "@/generated/prisma";

export async function getHomepageData() {
  const [operations, operationCount, sourceCount] = await Promise.all([
    prisma.operation.findMany({
      where: { moderationStatus: "APPROVED" },
      orderBy: { createdAt: "desc" },
      take: 6,
      include: { tags: true },
    }),
    prisma.operation.count({ where: { moderationStatus: "APPROVED" } }),
    prisma.source.count(),
  ]);

  const distinctEras = await prisma.operation.findMany({
    where: { moderationStatus: "APPROVED" },
    select: { era: true },
    distinct: ["era"],
  });

  return {
    featured: operations,
    stats: {
      operations: operationCount,
      eras: distinctEras.length,
      sources: sourceCount,
    },
  };
}

export interface CatalogFilters {
  search?: string;
  levels?: number[];
  eras?: Era[];
  types?: OperationType[];
  outcomes?: Outcome[];
  statuses?: OperationStatus[];
  actor?: string;
  sort?: string;
}

export async function getCatalogOperations(filters: CatalogFilters) {
  const where: Record<string, unknown> = {
    moderationStatus: "APPROVED" as const,
  };

  if (filters.levels && filters.levels.length > 0) {
    where.icebergLevel = { in: filters.levels };
  }

  if (filters.eras && filters.eras.length > 0) {
    where.era = { in: filters.eras };
  }

  if (filters.types && filters.types.length > 0) {
    where.types = { hasSome: filters.types };
  }

  if (filters.outcomes && filters.outcomes.length > 0) {
    where.outcome = { in: filters.outcomes };
  }

  if (filters.statuses && filters.statuses.length > 0) {
    where.status = { in: filters.statuses };
  }

  if (filters.actor) {
    where.actors = { has: filters.actor };
  }

  if (filters.search) {
    where.OR = [
      { title: { contains: filters.search, mode: "insensitive" } },
      { titleEs: { contains: filters.search, mode: "insensitive" } },
      { excerpt: { contains: filters.search, mode: "insensitive" } },
      { excerptEs: { contains: filters.search, mode: "insensitive" } },
    ];
  }

  let orderBy: Record<string, string> = { createdAt: "desc" };
  switch (filters.sort) {
    case "oldest":
      orderBy = { createdAt: "asc" };
      break;
    case "most-viewed":
      orderBy = { viewCount: "desc" };
      break;
    case "level":
      orderBy = { icebergLevel: "asc" };
      break;
    case "title":
      orderBy = { title: "asc" };
      break;
  }

  const operations = await prisma.operation.findMany({
    where,
    orderBy,
    include: { tags: true, _count: { select: { sources: true } } },
  });

  return operations;
}

export async function getOperationBySlug(slug: string) {
  return prisma.operation.update({
    where: { slug },
    data: { viewCount: { increment: 1 } },
    include: {
      sources: true,
      tags: true,
      relatedOps: {
        include: { tags: true },
      },
    },
  });
}

export async function getOperationBySlugEs(slugEs: string) {
  return prisma.operation.update({
    where: { slugEs },
    data: { viewCount: { increment: 1 } },
    include: {
      sources: true,
      tags: true,
      relatedOps: {
        include: { tags: true },
      },
    },
  });
}

export async function getAllOperationSlugs() {
  return prisma.operation.findMany({
    where: { moderationStatus: "APPROVED" },
    select: { slug: true, slugEs: true },
  });
}

export async function getDistinctActors() {
  const ops = await prisma.operation.findMany({
    where: { moderationStatus: "APPROVED" },
    select: { actors: true },
  });
  const actorSet = new Set<string>();
  for (const op of ops) {
    for (const actor of op.actors) {
      actorSet.add(actor);
    }
  }
  return Array.from(actorSet).sort();
}
```

- [ ] **Step 2: Commit**

```bash
git add src/lib/queries.ts
git commit -m "feat: add Prisma query layer for homepage, catalog, and operation detail"
```

---

### Task 3: Layout Components (Header + Footer)

**Files:**
- Create: `src/components/layout/Header.tsx`
- Create: `src/components/layout/Footer.tsx`
- Modify: `src/app/[locale]/layout.tsx`

- [ ] **Step 1: Create Header component**

Write `src/components/layout/Header.tsx`:

```tsx
import Link from "next/link";
import { useTranslations } from "next-intl";

export function Header({ locale }: { locale: string }) {
  const t = useTranslations("nav");
  const otherLocale = locale === "en" ? "es" : "en";

  return (
    <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-14 items-center justify-between px-4">
        <Link href={`/${locale}`} className="text-xl font-bold">
          Psyopedia
        </Link>
        <nav className="flex items-center gap-6 text-sm">
          <Link href={`/${locale}/catalog`} className="text-muted-foreground hover:text-foreground transition-colors">
            {t("catalog")}
          </Link>
          <Link href={`/${locale}/iceberg`} className="text-muted-foreground hover:text-foreground transition-colors">
            {t("iceberg")}
          </Link>
          <Link
            href={`/${otherLocale}`}
            className="rounded-md border px-2 py-1 text-xs font-medium uppercase hover:bg-accent transition-colors"
          >
            {otherLocale}
          </Link>
        </nav>
      </div>
    </header>
  );
}
```

- [ ] **Step 2: Create Footer component**

Write `src/components/layout/Footer.tsx`:

```tsx
import { useTranslations } from "next-intl";

export function Footer() {
  const t = useTranslations("seo");

  return (
    <footer className="border-t py-6 text-center text-sm text-muted-foreground">
      <div className="container mx-auto px-4">
        <p>&copy; {new Date().getFullYear()} {t("siteName")}. {t("siteDescription")}</p>
      </div>
    </footer>
  );
}
```

- [ ] **Step 3: Update locale layout to include Header and Footer**

Replace `src/app/[locale]/layout.tsx`:

```tsx
import type { ReactNode } from "react";
import type { Metadata } from "next";
import { NextIntlClientProvider } from "next-intl";
import { getMessages } from "next-intl/server";
import { notFound } from "next/navigation";
import { routing } from "@/i18n/routing";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import "@/app/globals.css";

type Props = {
  children: ReactNode;
  params: Promise<{ locale: string }>;
};

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export const metadata: Metadata = {
  title: {
    template: "%s | Psyopedia",
    default: "Psyopedia — PsyOps Encyclopedia",
  },
  description:
    "A comprehensive bilingual encyclopedia of psychological operations throughout history.",
};

export default async function LocaleLayout({ children, params }: Props) {
  const { locale } = await params;

  if (!routing.locales.includes(locale as "en" | "es")) {
    notFound();
  }

  const messages = await getMessages();

  return (
    <html lang={locale} suppressHydrationWarning>
      <body className="min-h-screen bg-background font-sans antialiased">
        <NextIntlClientProvider messages={messages}>
          <Header locale={locale} />
          <main className="flex-1">{children}</main>
          <Footer />
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
```

- [ ] **Step 4: Commit**

```bash
git add src/components/layout/ src/app/[locale]/layout.tsx
git commit -m "feat: add Header with nav/locale switcher and Footer"
```

---

### Task 4: Homepage Components + Operation Card

**Files:**
- Create: `src/components/home/HeroSection.tsx`
- Create: `src/components/home/StatsBar.tsx`
- Create: `src/components/home/FeaturedGrid.tsx`
- Create: `src/components/catalog/OperationCard.tsx`
- Create: `src/components/catalog/OperationGrid.tsx`
- Modify: `src/app/[locale]/page.tsx`

- [ ] **Step 1: Create HeroSection**

Write `src/components/home/HeroSection.tsx`:

```tsx
import Link from "next/link";
import { useTranslations } from "next-intl";

export function HeroSection({ locale }: { locale: string }) {
  const t = useTranslations("home");

  return (
    <section className="flex flex-col items-center justify-center gap-6 py-20 text-center">
      <h1 className="text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
        {t("title")}
      </h1>
      <p className="max-w-2xl text-lg text-muted-foreground">
        {t("subtitle")}
      </p>
      <div className="flex gap-4">
        <Link
          href={`/${locale}/catalog`}
          className="inline-flex h-10 items-center rounded-md bg-primary px-6 text-sm font-medium text-primary-foreground shadow hover:bg-primary/90 transition-colors"
        >
          {t("exploreCatalog")}
        </Link>
        <Link
          href={`/${locale}/iceberg`}
          className="inline-flex h-10 items-center rounded-md border border-input bg-background px-6 text-sm font-medium shadow-sm hover:bg-accent transition-colors"
        >
          {t("viewIceberg")}
        </Link>
      </div>
    </section>
  );
}
```

- [ ] **Step 2: Create StatsBar**

Write `src/components/home/StatsBar.tsx`:

```tsx
import { useTranslations } from "next-intl";

interface StatsBarProps {
  stats: { operations: number; eras: number; sources: number };
}

export function StatsBar({ stats }: StatsBarProps) {
  const t = useTranslations("home.stats");

  const items = [
    { value: stats.operations, label: t("operations") },
    { value: stats.eras, label: t("eras") },
    { value: stats.sources, label: t("sources") },
  ];

  return (
    <section className="border-y bg-muted/50 py-8">
      <div className="container mx-auto flex justify-center gap-12 px-4">
        {items.map((item) => (
          <div key={item.label} className="text-center">
            <div className="text-3xl font-bold">{item.value}</div>
            <div className="text-sm text-muted-foreground">{item.label}</div>
          </div>
        ))}
      </div>
    </section>
  );
}
```

- [ ] **Step 3: Create OperationCard**

Write `src/components/catalog/OperationCard.tsx`:

```tsx
import Link from "next/link";
import { useTranslations } from "next-intl";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Operation, Tag } from "@/generated/prisma";

interface OperationCardProps {
  operation: Operation & { tags: Tag[] };
  locale: string;
}

const levelColors: Record<number, string> = {
  1: "bg-sky-100 text-sky-800",
  2: "bg-blue-100 text-blue-800",
  3: "bg-indigo-100 text-indigo-800",
  4: "bg-violet-100 text-violet-800",
  5: "bg-purple-100 text-purple-900",
};

export function OperationCard({ operation, locale }: OperationCardProps) {
  const t = useTranslations("enums");
  const tOp = useTranslations("operation");

  const title = locale === "es" ? operation.titleEs : operation.title;
  const excerpt = locale === "es" ? operation.excerptEs : operation.excerpt;
  const slug = locale === "es" ? operation.slugEs : operation.slug;

  return (
    <Link href={`/${locale}/catalog/${slug}`}>
      <Card className="h-full hover:shadow-md transition-shadow">
        <CardHeader className="pb-2">
          <div className="flex items-center gap-2 mb-1">
            <Badge variant="outline" className={levelColors[operation.icebergLevel] || ""}>
              {tOp("icebergLevel", { level: operation.icebergLevel })}
            </Badge>
            <Badge variant="secondary">{t(`era.${operation.era}`)}</Badge>
          </div>
          <CardTitle className="text-lg leading-tight">{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground line-clamp-3">{excerpt}</p>
          <div className="mt-3 flex flex-wrap gap-1">
            {operation.tags.slice(0, 3).map((tag) => (
              <Badge key={tag.id} variant="outline" className="text-xs">
                {locale === "es" ? tag.nameEs : tag.name}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
```

- [ ] **Step 4: Create OperationGrid**

Write `src/components/catalog/OperationGrid.tsx`:

```tsx
import { useTranslations } from "next-intl";
import { OperationCard } from "./OperationCard";
import type { Operation, Tag } from "@/generated/prisma";

interface OperationGridProps {
  operations: (Operation & { tags: Tag[] })[];
  locale: string;
}

export function OperationGrid({ operations, locale }: OperationGridProps) {
  const t = useTranslations("catalog");

  if (operations.length === 0) {
    return (
      <div className="py-12 text-center text-muted-foreground">
        {t("noResults")}
      </div>
    );
  }

  return (
    <div>
      <p className="mb-4 text-sm text-muted-foreground">
        {t("resultsCount", { count: operations.length })}
      </p>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {operations.map((op) => (
          <OperationCard key={op.id} operation={op} locale={locale} />
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 5: Create FeaturedGrid**

Write `src/components/home/FeaturedGrid.tsx`:

```tsx
import { useTranslations } from "next-intl";
import { OperationCard } from "@/components/catalog/OperationCard";
import type { Operation, Tag } from "@/generated/prisma";

interface FeaturedGridProps {
  operations: (Operation & { tags: Tag[] })[];
  locale: string;
}

export function FeaturedGrid({ operations, locale }: FeaturedGridProps) {
  const t = useTranslations("home");

  return (
    <section className="container mx-auto px-4 py-12">
      <h2 className="mb-6 text-2xl font-bold">{t("featured")}</h2>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {operations.map((op) => (
          <OperationCard key={op.id} operation={op} locale={locale} />
        ))}
      </div>
    </section>
  );
}
```

- [ ] **Step 6: Update homepage page.tsx**

Replace `src/app/[locale]/page.tsx`:

```tsx
import { getHomepageData } from "@/lib/queries";
import { HeroSection } from "@/components/home/HeroSection";
import { StatsBar } from "@/components/home/StatsBar";
import { FeaturedGrid } from "@/components/home/FeaturedGrid";

interface Props {
  params: Promise<{ locale: string }>;
}

export default async function HomePage({ params }: Props) {
  const { locale } = await params;
  const { featured, stats } = await getHomepageData();

  return (
    <>
      <HeroSection locale={locale} />
      <StatsBar stats={stats} />
      <FeaturedGrid operations={featured} locale={locale} />
    </>
  );
}
```

- [ ] **Step 7: Commit**

```bash
git add src/components/home/ src/components/catalog/OperationCard.tsx src/components/catalog/OperationGrid.tsx src/app/[locale]/page.tsx src/lib/queries.ts
git commit -m "feat: add homepage with hero, stats, featured grid, and operation card components"
```

---

### Task 5: Catalog Filters (Client Component)

**Files:**
- Create: `src/components/catalog/CatalogFilters.tsx`

- [ ] **Step 1: Create the filter component**

Write `src/components/catalog/CatalogFilters.tsx`:

```tsx
"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { useCallback } from "react";

interface CatalogFiltersProps {
  locale: string;
  actors: string[];
}

export function CatalogFilters({ locale, actors }: CatalogFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const t = useTranslations("catalog");
  const tEnum = useTranslations("enums");

  const currentLevels = searchParams.get("level")?.split(",").map(Number).filter(Boolean) || [];
  const currentEras = searchParams.get("era")?.split(",").filter(Boolean) || [];
  const currentTypes = searchParams.get("type")?.split(",").filter(Boolean) || [];
  const currentOutcomes = searchParams.get("outcome")?.split(",").filter(Boolean) || [];
  const currentSearch = searchParams.get("q") || "";
  const currentSort = searchParams.get("sort") || "newest";
  const currentActor = searchParams.get("actor") || "";

  const updateParams = useCallback(
    (updates: Record<string, string | null>) => {
      const params = new URLSearchParams(searchParams.toString());
      for (const [key, value] of Object.entries(updates)) {
        if (value === null || value === "") {
          params.delete(key);
        } else {
          params.set(key, value);
        }
      }
      router.push(`/${locale}/catalog?${params.toString()}`);
    },
    [router, searchParams, locale]
  );

  const toggleArrayParam = useCallback(
    (key: string, value: string, current: string[]) => {
      const next = current.includes(value)
        ? current.filter((v) => v !== value)
        : [...current, value];
      updateParams({ [key]: next.length > 0 ? next.join(",") : null });
    },
    [updateParams]
  );

  const eras = ["WWII", "COLD_WAR", "MODERN", "DIGITAL_AGE"] as const;
  const types = [
    "ASSASSINATION", "PROPAGANDA", "DECEPTION", "INFLUENCE_OP",
    "FALSE_FLAG", "INFILTRATION", "MIND_CONTROL", "SURVEILLANCE", "DISINFORMATION",
  ] as const;
  const outcomes = ["SUCCESSFUL", "FAILED", "PARTIAL", "ONGOING", "UNKNOWN"] as const;

  return (
    <aside className="space-y-6">
      <div>
        <Input
          placeholder={t("search")}
          defaultValue={currentSearch}
          onChange={(e) => {
            const value = e.target.value;
            if (value.length === 0 || value.length >= 2) {
              updateParams({ q: value || null });
            }
          }}
        />
      </div>

      <div>
        <label className="mb-2 block text-sm font-medium">{t("sort.label")}</label>
        <Select value={currentSort} onValueChange={(v) => updateParams({ sort: v === "newest" ? null : v })}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="newest">{t("sort.newest")}</SelectItem>
            <SelectItem value="oldest">{t("sort.oldest")}</SelectItem>
            <SelectItem value="most-viewed">{t("sort.mostViewed")}</SelectItem>
            <SelectItem value="level">{t("sort.icebergLevel")}</SelectItem>
            <SelectItem value="title">{t("sort.title")}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Separator />

      <div>
        <h3 className="mb-2 text-sm font-medium">{t("filters.icebergLevel")}</h3>
        <div className="space-y-2">
          {[1, 2, 3, 4, 5].map((level) => (
            <label key={level} className="flex items-center gap-2 text-sm">
              <Checkbox
                checked={currentLevels.includes(level)}
                onCheckedChange={() =>
                  toggleArrayParam("level", String(level), currentLevels.map(String))
                }
              />
              Level {level}
            </label>
          ))}
        </div>
      </div>

      <Separator />

      <div>
        <h3 className="mb-2 text-sm font-medium">{t("filters.era")}</h3>
        <div className="space-y-2">
          {eras.map((era) => (
            <label key={era} className="flex items-center gap-2 text-sm">
              <Checkbox
                checked={currentEras.includes(era)}
                onCheckedChange={() => toggleArrayParam("era", era, currentEras)}
              />
              {tEnum(`era.${era}`)}
            </label>
          ))}
        </div>
      </div>

      <Separator />

      <div>
        <h3 className="mb-2 text-sm font-medium">{t("filters.type")}</h3>
        <div className="space-y-2">
          {types.map((type) => (
            <label key={type} className="flex items-center gap-2 text-sm">
              <Checkbox
                checked={currentTypes.includes(type)}
                onCheckedChange={() => toggleArrayParam("type", type, currentTypes)}
              />
              {tEnum(`type.${type}`)}
            </label>
          ))}
        </div>
      </div>

      <Separator />

      <div>
        <h3 className="mb-2 text-sm font-medium">{t("filters.outcome")}</h3>
        <div className="space-y-2">
          {outcomes.map((outcome) => (
            <label key={outcome} className="flex items-center gap-2 text-sm">
              <Checkbox
                checked={currentOutcomes.includes(outcome)}
                onCheckedChange={() => toggleArrayParam("outcome", outcome, currentOutcomes)}
              />
              {tEnum(`outcome.${outcome}`)}
            </label>
          ))}
        </div>
      </div>

      <Separator />

      <div>
        <h3 className="mb-2 text-sm font-medium">{t("filters.country")}</h3>
        <Select value={currentActor} onValueChange={(v) => updateParams({ actor: v === "all" ? null : v })}>
          <SelectTrigger>
            <SelectValue placeholder={t("filters.country")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            {actors.map((actor) => (
              <SelectItem key={actor} value={actor}>
                {actor}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {searchParams.toString() && (
        <button
          onClick={() => router.push(`/${locale}/catalog`)}
          className="w-full text-sm text-muted-foreground hover:text-foreground underline"
        >
          {t("filters.clearAll")}
        </button>
      )}
    </aside>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/catalog/CatalogFilters.tsx
git commit -m "feat: add catalog filter sidebar with search, sort, level, era, type, outcome, actor filters"
```

---

### Task 6: Catalog Page

**Files:**
- Create: `src/app/[locale]/catalog/page.tsx`

- [ ] **Step 1: Create the catalog page**

Write `src/app/[locale]/catalog/page.tsx`:

```tsx
import { Suspense } from "react";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { getCatalogOperations, getDistinctActors } from "@/lib/queries";
import type { CatalogFilters } from "@/lib/queries";
import type { Era, OperationType, Outcome, OperationStatus } from "@/generated/prisma";
import { CatalogFilters as CatalogFiltersUI } from "@/components/catalog/CatalogFilters";
import { OperationGrid } from "@/components/catalog/OperationGrid";

interface Props {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "catalog" });
  return {
    title: t("title"),
  };
}

export default async function CatalogPage({ params, searchParams }: Props) {
  const { locale } = await params;
  const sp = await searchParams;

  const filters: CatalogFilters = {
    search: typeof sp.q === "string" ? sp.q : undefined,
    levels: typeof sp.level === "string"
      ? sp.level.split(",").map(Number).filter(Boolean)
      : undefined,
    eras: typeof sp.era === "string"
      ? (sp.era.split(",") as Era[])
      : undefined,
    types: typeof sp.type === "string"
      ? (sp.type.split(",") as OperationType[])
      : undefined,
    outcomes: typeof sp.outcome === "string"
      ? (sp.outcome.split(",") as Outcome[])
      : undefined,
    statuses: typeof sp.status === "string"
      ? (sp.status.split(",") as OperationStatus[])
      : undefined,
    actor: typeof sp.actor === "string" ? sp.actor : undefined,
    sort: typeof sp.sort === "string" ? sp.sort : undefined,
  };

  const [operations, actors] = await Promise.all([
    getCatalogOperations(filters),
    getDistinctActors(),
  ]);

  const t = await getTranslations({ locale, namespace: "catalog" });

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="mb-8 text-3xl font-bold">{t("title")}</h1>
      <div className="flex gap-8">
        <div className="w-64 shrink-0 hidden md:block">
          <Suspense>
            <CatalogFiltersUI locale={locale} actors={actors} />
          </Suspense>
        </div>
        <div className="flex-1">
          <OperationGrid operations={operations} locale={locale} />
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/[locale]/catalog/page.tsx
git commit -m "feat: add catalog page with server-side filtered operations and sidebar filters"
```

---

### Task 7: Operation Detail Page

**Files:**
- Create: `src/app/[locale]/catalog/[slug]/page.tsx`
- Create: `src/components/operation/OperationHeader.tsx`
- Create: `src/components/operation/OperationBody.tsx`
- Create: `src/components/operation/SourcesList.tsx`
- Create: `src/components/operation/RelatedOps.tsx`

- [ ] **Step 1: Create OperationHeader**

Write `src/components/operation/OperationHeader.tsx`:

```tsx
import { useTranslations } from "next-intl";
import { Badge } from "@/components/ui/badge";
import type { Operation } from "@/generated/prisma";

const levelColors: Record<number, string> = {
  1: "bg-sky-100 text-sky-800",
  2: "bg-blue-100 text-blue-800",
  3: "bg-indigo-100 text-indigo-800",
  4: "bg-violet-100 text-violet-800",
  5: "bg-purple-100 text-purple-900",
};

interface OperationHeaderProps {
  operation: Operation;
  locale: string;
}

export function OperationHeader({ operation, locale }: OperationHeaderProps) {
  const t = useTranslations("enums");
  const tOp = useTranslations("operation");

  const title = locale === "es" ? operation.titleEs : operation.title;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <Badge className={levelColors[operation.icebergLevel] || ""}>
          {tOp("icebergLevel", { level: operation.icebergLevel })}
        </Badge>
        <Badge variant="secondary">{t(`era.${operation.era}`)}</Badge>
        <Badge variant="outline">{t(`status.${operation.status}`)}</Badge>
        <Badge variant="outline">{t(`outcome.${operation.outcome}`)}</Badge>
      </div>
      <h1 className="text-3xl font-bold sm:text-4xl">{title}</h1>
      {operation.aliases.length > 0 && (
        <p className="text-muted-foreground">
          Also known as: {operation.aliases.join(", ")}
        </p>
      )}
      <div className="flex flex-wrap gap-2 text-sm text-muted-foreground">
        {operation.types.map((type) => (
          <Badge key={type} variant="secondary" className="text-xs">
            {t(`type.${type}`)}
          </Badge>
        ))}
      </div>
      <div className="text-sm text-muted-foreground">
        <span className="font-medium">Actors:</span> {operation.actors.join(", ")}
        {operation.targets.length > 0 && (
          <>
            {" · "}
            <span className="font-medium">Targets:</span> {operation.targets.join(", ")}
          </>
        )}
      </div>
      <p className="text-sm text-muted-foreground">
        {tOp("viewCount", { count: operation.viewCount })}
      </p>
    </div>
  );
}
```

- [ ] **Step 2: Create OperationBody**

Write `src/components/operation/OperationBody.tsx`. This renders the markdown-style body content safely using React elements (no innerHTML):

```tsx
interface OperationBodyProps {
  content: string;
}

export function OperationBody({ content }: OperationBodyProps) {
  const lines = content.split("\n");

  return (
    <div className="space-y-2">
      {lines.map((line, i) => {
        if (line.startsWith("## ")) {
          return (
            <h2 key={i} className="mt-8 mb-3 text-xl font-semibold">
              {line.slice(3)}
            </h2>
          );
        }
        if (line.startsWith("- ")) {
          return (
            <li key={i} className="ml-4 list-disc text-sm leading-relaxed">
              {line.slice(2)}
            </li>
          );
        }
        if (line.trim() === "") {
          return null;
        }
        return (
          <p key={i} className="text-sm leading-relaxed">
            {line}
          </p>
        );
      })}
    </div>
  );
}
```

- [ ] **Step 3: Create SourcesList**

Write `src/components/operation/SourcesList.tsx`:

```tsx
import { useTranslations } from "next-intl";
import { Badge } from "@/components/ui/badge";
import type { Source } from "@/generated/prisma";

interface SourcesListProps {
  sources: Source[];
}

const credibilityLabels: Record<number, { label: string; color: string }> = {
  1: { label: "Very Low", color: "bg-red-100 text-red-800" },
  2: { label: "Low", color: "bg-orange-100 text-orange-800" },
  3: { label: "Medium", color: "bg-yellow-100 text-yellow-800" },
  4: { label: "High", color: "bg-green-100 text-green-800" },
  5: { label: "Very High", color: "bg-emerald-100 text-emerald-800" },
};

export function SourcesList({ sources }: SourcesListProps) {
  const t = useTranslations("operation");

  if (sources.length === 0) return null;

  return (
    <section>
      <h2 className="mb-4 text-xl font-semibold">{t("sources")}</h2>
      <ul className="space-y-3">
        {sources.map((source) => {
          const cred = credibilityLabels[source.credibility] || credibilityLabels[3];
          return (
            <li key={source.id} className="flex items-start gap-3 rounded-md border p-3">
              <div className="flex-1">
                {source.url ? (
                  <a
                    href={source.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm font-medium underline hover:no-underline"
                  >
                    {source.title}
                  </a>
                ) : (
                  <span className="text-sm font-medium">{source.title}</span>
                )}
                <div className="mt-1 flex gap-2">
                  <Badge variant="outline" className="text-xs">
                    {source.type.replace("_", " ")}
                  </Badge>
                  <Badge variant="outline" className={`text-xs ${cred.color}`}>
                    Credibility: {cred.label}
                  </Badge>
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
```

- [ ] **Step 4: Create RelatedOps**

Write `src/components/operation/RelatedOps.tsx`:

```tsx
import { useTranslations } from "next-intl";
import { OperationCard } from "@/components/catalog/OperationCard";
import type { Operation, Tag } from "@/generated/prisma";

interface RelatedOpsProps {
  operations: (Operation & { tags: Tag[] })[];
  locale: string;
}

export function RelatedOps({ operations, locale }: RelatedOpsProps) {
  const t = useTranslations("operation");

  if (operations.length === 0) return null;

  return (
    <section>
      <h2 className="mb-4 text-xl font-semibold">{t("relatedOps")}</h2>
      <div className="grid gap-4 sm:grid-cols-2">
        {operations.map((op) => (
          <OperationCard key={op.id} operation={op} locale={locale} />
        ))}
      </div>
    </section>
  );
}
```

- [ ] **Step 5: Create the operation detail page**

Write `src/app/[locale]/catalog/[slug]/page.tsx`:

```tsx
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { getOperationBySlug, getOperationBySlugEs } from "@/lib/queries";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { OperationHeader } from "@/components/operation/OperationHeader";
import { OperationBody } from "@/components/operation/OperationBody";
import { SourcesList } from "@/components/operation/SourcesList";
import { RelatedOps } from "@/components/operation/RelatedOps";

interface Props {
  params: Promise<{ locale: string; slug: string }>;
}

async function getOperation(locale: string, slug: string) {
  try {
    if (locale === "es") {
      return await getOperationBySlugEs(slug);
    }
    return await getOperationBySlug(slug);
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, slug } = await params;
  const operation = await getOperation(locale, slug);
  if (!operation) return { title: "Not Found" };

  const title = locale === "es" ? operation.titleEs : operation.title;
  const description = locale === "es" ? operation.excerptEs : operation.excerpt;

  return {
    title,
    description,
    openGraph: {
      title: `${title} | Psyopedia`,
      description,
      type: "article",
    },
    alternates: {
      canonical: `/${locale}/catalog/${slug}`,
      languages: {
        en: `/en/catalog/${operation.slug}`,
        es: `/es/catalog/${operation.slugEs}`,
      },
    },
  };
}

export default async function OperationDetailPage({ params }: Props) {
  const { locale, slug } = await params;
  const operation = await getOperation(locale, slug);

  if (!operation) {
    notFound();
  }

  const body = locale === "es" ? operation.bodyEs : operation.bodyEn;

  return (
    <div className="container mx-auto max-w-3xl px-4 py-8">
      <OperationHeader operation={operation} locale={locale} />

      <Separator className="my-6" />

      <div className="mb-6 flex flex-wrap gap-2">
        {operation.tags.map((tag) => (
          <Badge key={tag.id} variant="outline">
            {locale === "es" ? tag.nameEs : tag.name}
          </Badge>
        ))}
      </div>

      <OperationBody content={body} />

      <Separator className="my-8" />

      <SourcesList sources={operation.sources} />

      {operation.relatedOps.length > 0 && (
        <>
          <Separator className="my-8" />
          <RelatedOps operations={operation.relatedOps} locale={locale} />
        </>
      )}
    </div>
  );
}
```

- [ ] **Step 6: Verify build**

```bash
npm run build
```

Expected: Build completes with pages `/[locale]`, `/[locale]/catalog`, `/[locale]/catalog/[slug]`.

- [ ] **Step 7: Commit**

```bash
git add src/components/operation/ src/app/[locale]/catalog/
git commit -m "feat: add operation detail page with header, body, sources, related ops, and tags"
```

---

### Task 8: Final Build Verification

- [ ] **Step 1: Full build**

```bash
npm run build
```

Expected: No errors.

- [ ] **Step 2: Dev server smoke test**

```bash
npm run dev
```

Verify:
- `http://localhost:3000/en` — Shows homepage with hero, stats, 6 featured operations
- `http://localhost:3000/en/catalog` — Shows all 25 operations with filter sidebar
- `http://localhost:3000/en/catalog?level=1` — Shows only level 1 operations
- `http://localhost:3000/en/catalog/cointelpro` — Shows COINTELPRO detail page
- `http://localhost:3000/es/catalog/cointelpro` — Shows COINTELPRO in Spanish
- `http://localhost:3000/es` — Shows Spanish homepage

- [ ] **Step 3: Commit if any fixes needed**

```bash
git add -A
git commit -m "chore: phase 2 core pages complete"
```
