# Phase 3: Iceberg Visualization — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build an interactive SVG iceberg visualization with 5 clickable depth zones showing operation counts, and a dedicated iceberg page.

**Architecture:** The iceberg is a server component that receives level data as props. Each zone is a clickable SVG region that navigates to the catalog filtered by that level. The iceberg page fetches counts from the database. A waterline separates Level 1 (above water) from Levels 2-5 (below water).

**Tech Stack:** Next.js 16, SVG, Tailwind CSS, next-intl

---

## File Structure

```
src/
├── app/[locale]/
│   └── iceberg/
│       └── page.tsx                    # Dedicated iceberg page
├── components/
│   └── iceberg/
│       ├── IcebergVisualization.tsx     # Main SVG iceberg (client component)
│       └── IcebergLevelZone.tsx         # Individual clickable zone
├── lib/
│   └── queries.ts                      # ADD: getIcebergData()
```

---

### Task 1: Add Iceberg Query

**Files:**
- Modify: `src/lib/queries.ts`

Add this function to the existing queries file:

```typescript
export async function getIcebergData() {
  const levels = await prisma.operation.groupBy({
    by: ["icebergLevel"],
    where: { moderationStatus: ModerationStatus.APPROVED },
    _count: true,
    orderBy: { icebergLevel: "asc" },
  });

  // Get a few featured operation titles per level
  const featured = await prisma.operation.findMany({
    where: { moderationStatus: ModerationStatus.APPROVED },
    select: { icebergLevel: true, title: true, titleEs: true, slug: true, slugEs: true },
    orderBy: { viewCount: "desc" },
  });

  return levels.map((level) => ({
    level: level.icebergLevel,
    count: level._count,
    operations: featured
      .filter((op) => op.icebergLevel === level.icebergLevel)
      .slice(0, 3),
  }));
}
```

Commit after adding.

---

### Task 2: Iceberg SVG Components

**Files:**
- Create: `src/components/iceberg/IcebergVisualization.tsx`
- Create: `src/components/iceberg/IcebergLevelZone.tsx`

The IcebergVisualization is a "use client" component (needs onClick for navigation).

The SVG iceberg:
- Total viewBox: 0 0 600 800
- Level 1 (tip above water): y=0 to y=160 — lightest blue/white, triangle tip
- Waterline at y=160 — dashed horizontal line
- Level 2: y=160 to y=320 — light blue
- Level 3: y=320 to y=480 — medium blue
- Level 4: y=480 to y=640 — dark blue
- Level 5: y=640 to y=800 — darkest blue/navy

Each zone:
- Trapezoid shape (wider as depth increases)
- Shows: level name, operation count, up to 3 operation titles
- Hover: slight opacity change
- Click: navigates to /[locale]/catalog?level={n}

Background: gradient from light sky above waterline to deep ocean below.

IcebergLevelZone props:
```typescript
interface IcebergLevelZoneProps {
  level: number;
  label: string;
  count: number;
  operationTitles: string[];
  y: number;
  height: number;
  topWidth: number;
  bottomWidth: number;
  fill: string;
  onClick: () => void;
}
```

IcebergVisualization props:
```typescript
interface IcebergVisualizationProps {
  data: {
    level: number;
    count: number;
    operations: { title: string; titleEs: string; slug: string; slugEs: string }[];
  }[];
  locale: string;
}
```

Commit after creating both.

---

### Task 3: Iceberg Page

**Files:**
- Create: `src/app/[locale]/iceberg/page.tsx`

Server component that:
- Fetches iceberg data via getIcebergData()
- Renders page title and subtitle from translations
- Renders IcebergVisualization with the data
- Has generateMetadata

Commit after creating.

---

### Task 4: Build Verification

- Build the project
- Verify /en/iceberg and /es/iceberg work
- Commit any fixes
