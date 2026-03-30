# TODO

## Iceberg 3D User Journey

Convert the iceberg into a scroll-driven 3D user journey:

- The camera starts at the tip of the iceberg and descends into the depths as the user scrolls down
- One scroll stop per iceberg level (5 levels total) — snapping or smooth pause at each
- Scrolling up reverses the journey back toward the surface
- At each level stop, operation dots expand with more detail (title, excerpt, era visible without hover)
- Very smooth camera animation between levels — cinematic, fluid transitions
- Each level needs a proper display name:
  - Level 1: Surface — Well-Known & Declassified
  - Level 2: Shallow — Known but Underappreciated
  - Level 3: Midwater — Leaked & Partially Verified
  - Level 4: Deep — Alleged & Unconfirmed
  - Level 5: Abyss — Deep Conspiracy
- Level name should fade in/out as the camera arrives at and leaves each zone
- Consider parallax effects, fog density increasing with depth, lighting getting darker

---

## Future Features (do not implement now)

The following features are planned for future iterations. Add `// TODO:` comments in the relevant files so the codebase is aware of upcoming surface areas when making architectural decisions.

---

### TODO-01 — Propaganda Techniques Encyclopedia

Build a `/techniques` section with dedicated pages per propaganda technique (Big Lie, False Flag, Astroturfing, Controlled Opposition, Firehose of Falsehood, etc.). Each technique page lists all operations that used it (many-to-many relation in Prisma). Technique <-> Operation relation must be added to the schema when implementing. Strong internal linking target — every operation detail page links to its techniques.

---

### TODO-02 — Declassified Auto-Generated Shareable Cards

For every operation, generate a downloadable "Declassified File" card styled as a redacted CIA document (monospace font, black redaction bars, watermark). Redaction bars are toggleable (dramatic reveal interaction). Two delivery methods: client-side via html-to-image, server-side via @vercel/og. Card includes: operation name, iceberg level badge, era, type, key facts, source count. Intended for social sharing (Instagram, X, Reddit) — primary viral loop.

---

### TODO-03 — Interactive PsyOps Timeline

Build a `/timeline` page with a horizontally scrollable timeline across all eras. Eras: Ancient -> WWI -> WWII -> Cold War -> Modern -> Digital Age (each a visual chapter). Operations plotted as events, color-coded by iceberg level. Zoom in/out by era, filterable by type/country/level. Candidate libraries: vis-timeline or custom React + Framer Motion implementation. Timeline entries link to operation detail pages.

---

### TODO-04 — "Detect the PsyOp" Quiz

Build a `/quiz` page with a gamified detection quiz. Show a historical headline, poster, or event description. User chooses: Real Event / PsyOp / Propaganda / Disinformation. Reveal answer with explanation + link to the full operation entry. Score tracked per session, shareable results card at the end. Community can submit new quiz questions via the contribution system (new ContributionType). Primary viral loop mechanic — optimize for social share CTAs on results screen.

---

### TODO-05 — Global PsyOps Map

Build a `/map` page with an interactive 3D globe. Each country colored by operation density (actor OR target). Arc lines connecting origin country -> target country per operation. Clicking a country filters to catalog scoped to that country. Time slider to animate operations appearing by decade. Candidate libraries: React Globe.gl or custom Three.js sphere scene. Low-count countries should still be clickable (show "no confirmed ops" state).

---

### TODO-06 — Actor & Agency Profiles

Add Actor model to Prisma schema (name, type: PERSON|AGENCY|ORGANIZATION, country, active era, description, image, sources). Many-to-many with Operation (already uses actors: String[] — migrate to relation). Build `/actors` index page and `/actors/[slug]` detail pages. Detail page: profile header, list of all linked operations, known techniques used, source-rated bibliography. Seed with key actors: CIA, KGB, MI6, NSA, GRU, Mossad, Edward Bernays, Allen Dulles, Josef Goebbels, Roger Stone, Christopher Steele.

---

### TODO-07 — Web of Influence (Network Graph)

Build a `/network` page with an interactive force-directed graph. Nodes: operations, agencies, actors, key figures. Edges: funded / inspired / covered-up / contradicted / ran-concurrently. Node size proportional to connection count. Clicking a node navigates to its detail page. Filter controls: by era, iceberg level, actor, country. Candidate libraries: React Force Graph (2D and 3D modes) or D3.js. Data model: add OperationRelation edge table to Prisma with relation type enum. Inspired by Mark Lombardi network drawings — cite this as design reference.

---

### TODO-08 — Scrollytelling Operation Pages

For Tier-1 flagship entries (Mincemeat, MKUltra, Mockingbird, Northwoods), build an enhanced scrollytelling layout as an alternative to the standard MDX body. As user scrolls: narrative progresses, background transitions between scenes, declassified document images fade in as evidence is cited, key document quotes appear as styled callout blocks, timeline markers animate on scroll entry. Add a boolean field `hasScrollytelling` to Operation model. Candidate library: Scrollama.js or pure Intersection Observer API. Standard MDX layout remains the default for all other entries.

---

### TODO-09 — "This Week in PsyOps History" Newsletter

Weekly newsletter delivered via Resend. Content: one deep-dive featured operation + 3 short briefings + "on this date in psyops history" section + newly approved community entries. Styled as a classified briefing document (HTML email template). Newsletter archive pages at `/newsletter/[issue-slug]` become SEO content. Subscription widget on homepage, operation detail pages, and quiz results screen. Add NewsletterSubscriber model to Prisma (email, locale, subscribedAt, confirmed).
