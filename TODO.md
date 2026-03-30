# TODO

## Scroll-Driven 3D Iceberg Journey

Transform the existing IcebergScene into a fully scroll-driven 3D cinematic experience. The camera starts at the tip of the iceberg above water and descends through 5 depth levels as the user scrolls down. Each level is a scroll stop with snapping behavior, expanding operation details, atmospheric depth changes, and cinematic transitions. Scrolling up reverses the journey.

### Dependencies

```bash
npm install gsap lenis zustand framer-motion
```

Use GSAP for camera animation and ScrollTrigger. Use Lenis for smooth scroll inertia. Zustand for shared state. Framer Motion for DOM label animations.

### Level Definitions

```ts
export const ICEBERG_LEVELS = [
  { level: 1, name: 'Surface',  subtitle: 'Well-Known & Declassified',    cameraY: 4,   cameraZ: 12, fogDensity: 0.008, ambientIntensity: 1.0,  accentColor: '#e0f4ff', labelColor: '#ffffff' },
  { level: 2, name: 'Shallow',  subtitle: 'Known but Underappreciated',   cameraY: -1,  cameraZ: 11, fogDensity: 0.018, ambientIntensity: 0.75, accentColor: '#7ec8e3', labelColor: '#b0e0ff' },
  { level: 3, name: 'Midwater', subtitle: 'Leaked & Partially Verified',  cameraY: -4,  cameraZ: 10, fogDensity: 0.035, ambientIntensity: 0.5,  accentColor: '#2e86ab', labelColor: '#7ecff5' },
  { level: 4, name: 'Deep',     subtitle: 'Alleged & Unconfirmed',        cameraY: -7,  cameraZ: 9,  fogDensity: 0.06,  ambientIntensity: 0.25, accentColor: '#1a3a5c', labelColor: '#3a7abf' },
  { level: 5, name: 'Abyss',    subtitle: 'Deep Conspiracy',              cameraY: -11, cameraZ: 8,  fogDensity: 0.12,  ambientIntensity: 0.08, accentColor: '#060d1a', labelColor: '#1a3a6e' },
] as const
```

### Architecture

Uses a **fixed-height scroll container** technique:
- `IcebergJourney.tsx` renders a tall div (`height: 500vh`) as the scroll track
- The `<Canvas>` is `position: sticky; top: 0` filling the viewport — never actually scrolls
- GSAP ScrollTrigger reads scroll position and drives: camera Y/Z position, fog density, ambient light intensity, active level state

### File Structure

```
components/iceberg/
├── IcebergJourney.tsx          # Root client component — scroll container + canvas
├── IcebergCanvas.tsx           # <Canvas> setup + scene composition
├── IcebergMesh.tsx             # Iceberg GLB model (adapt existing)
├── OceanWater.tsx              # Water surface (adapt existing)
├── CausticsLight.tsx           # Caustics (adapt existing)
├── OperationDot.tsx            # 3D dot per operation — expands when level active
├── DepthAtmosphere.tsx         # Fog, lighting, color changes driven by scroll
├── LevelLabel.tsx              # Full-screen fade-in/out level name (DOM overlay)
├── ScrollDepthIndicator.tsx    # Sidebar depth progress bar (DOM overlay)
├── useScrollCamera.ts          # GSAP ScrollTrigger → camera position hook
├── useIcebergStore.ts          # Zustand store for active level, progress, hovered op
└── constants.ts                # ICEBERG_LEVELS definition
```

### Key Behaviors

**Scroll camera** — GSAP ScrollTrigger with `scrub: 1.5` drives camera between level keyframes. Each level occupies 100vh (20% of 500vh). Camera interpolates Y and Z per level. Camera always looks 1.5 units below its position for natural downward gaze.

**Depth atmosphere** — Reads `scrollProgress` in `useFrame` via ref (not React state). Fog density increases from 0.008 (surface) to 0.12 (abyss). Ambient light dims from 1.0 to 0.08. Background darkens progressively. Point light shifts warm-white to cold-blue.

**Level labels** — DOM overlay using Framer Motion `AnimatePresence`. Large cinematic type with text-shadow. Fades in on level enter, fades out on leave. Shows level number, name, and subtitle.

**Operation dots** — `isLevelActive = false`: small dim sphere (0.08 radius). `isLevelActive = true`: animated expansion to 0.14 radius via spring, renders `<Html>` panel with title, excerpt (12 words), era badge. Click navigates to catalog. Positions are deterministic via id hash.

**Water transition** — Water visible only when `camera.position.y > -0.5`. Brief submersion distortion effect (radial blur + blue tint for 0.4s) when camera crosses waterline.

**Scroll snapping** — When scroll velocity drops below threshold between levels, snap to nearest level boundary (800ms ease-out via Lenis `scrollTo`).

**Parallax** — 200 point-particles as underwater debris/bioluminescence drift upward as scroll progresses. Iceberg mesh counter-scrolls at 30% camera speed. Caustic UV scroll speed increases at depth. Levels 4-5 add faint transparent ice wall planes on sides.

**Depth indicator** — Vertical progress bar on right side. Track with fill bar + 5 level dots. Active dot glows with level color. Depth percentage label in rotated mono font.

### Performance

- `React.memo` on OperationDot
- GSAP directly mutates `camera.position` — no React state
- `DepthAtmosphere` reads progress in `useFrame` via ref
- `dpr={[1, 1.5]}` cap
- Mobile: disable parallax particles, 3 dots per level max, skip DepthOfField

### Integration

In `app/[locale]/page.tsx` (or iceberg page):

```tsx
const IcebergJourney = dynamic(
  () => import('@/components/iceberg/IcebergJourney'),
  { ssr: false, loading: () => <div className="h-screen bg-[#0a1628]" /> }
)
```

Journey fills the scroll track (500vh), then page content continues below.

### Deliverables Checklist

- [ ] Scrolling down sinks camera from Level 1 to Level 5 smoothly
- [ ] Scrolling up reverses the journey correctly
- [ ] Camera interpolation is cinematic — no jitter, no abrupt jumps
- [ ] Fog density visibly increases between Level 1 and Level 5
- [ ] Ambient light dims progressively — Level 5 is near-dark
- [ ] Level name and subtitle fade in when camera arrives at each zone
- [ ] Level name fades out as camera leaves the zone
- [ ] Operation dots are dim in transit, expand when level is active
- [ ] Expanded dots show title, truncated excerpt, and era badge
- [ ] Water surface disappears cleanly below Y=0
- [ ] Submersion distortion effect fires once on waterline crossing
- [ ] ScrollDepthIndicator reflects current level and progress
- [ ] Scroll snapping settles at nearest level when scroll stops
- [ ] Parallax particle field creates sinking sensation
- [ ] `npm run build` passes — no SSR errors
- [ ] Mobile: reduced effects, still functional and performant

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
