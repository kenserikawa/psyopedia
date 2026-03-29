# Phase 1: Foundation — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Initialize the Psyopedia Next.js project with Prisma schema, i18n routing, environment validation, and seed data for 25 operations across 5 iceberg levels.

**Architecture:** Next.js 14 App Router with TypeScript strict mode. Prisma ORM targeting PostgreSQL. next-intl for locale-prefixed routing (`/en`, `/es`). Zod for environment validation. shadcn/ui initialized but components added as needed in later phases.

**Tech Stack:** Next.js 14, TypeScript, Prisma, PostgreSQL, next-intl, shadcn/ui, Tailwind CSS, Zod

---

## File Structure

```
psyopedia/
├── prisma/
│   ├── schema.prisma              # Full database schema (all models + enums)
│   └── seed.ts                    # 25 seed operations + tags + sources
├── src/
│   ├── app/
│   │   ├── [locale]/
│   │   │   ├── layout.tsx         # Root locale layout (next-intl provider)
│   │   │   └── page.tsx           # Homepage placeholder
│   │   ├── layout.tsx             # Root HTML layout
│   │   └── globals.css            # Tailwind + shadcn globals
│   ├── lib/
│   │   ├── prisma.ts              # Prisma client singleton
│   │   └── env.ts                 # Zod environment validation
│   ├── i18n/
│   │   ├── request.ts             # next-intl request config
│   │   └── routing.ts             # next-intl routing config
│   └── middleware.ts              # next-intl locale middleware
├── messages/
│   ├── en.json                    # English UI strings
│   └── es.json                    # Spanish UI strings
├── .env                           # Environment variables (not committed)
├── .env.example                   # Template for environment variables
├── next.config.ts                 # Next.js config with next-intl plugin
├── tailwind.config.ts             # Tailwind config
├── tsconfig.json                  # TypeScript config (strict)
├── package.json                   # Dependencies and scripts
└── components.json                # shadcn/ui config
```

---

### Task 1: Initialize Next.js Project

**Files:**
- Create: `package.json`, `tsconfig.json`, `next.config.ts`, `tailwind.config.ts`, `src/app/layout.tsx`, `src/app/globals.css`

- [ ] **Step 1: Create Next.js project with TypeScript and App Router**

```bash
cd /home/ken/Desktop/html/psyopedia
npx create-next-app@latest . --typescript --tailwind --eslint --app --src-dir --import-alias "@/*" --use-npm --yes
```

Expected: Project scaffolded with `src/app/` directory structure, `package.json`, `tsconfig.json`, etc.

- [ ] **Step 2: Verify the project builds**

```bash
cd /home/ken/Desktop/html/psyopedia
npm run build
```

Expected: Build completes with no errors.

- [ ] **Step 3: Initialize git and commit**

```bash
cd /home/ken/Desktop/html/psyopedia
git init
git add -A
git commit -m "chore: initialize Next.js project with TypeScript and Tailwind"
```

---

### Task 2: Install All Phase 1 Dependencies

**Files:**
- Modify: `package.json`

- [ ] **Step 1: Install production dependencies**

```bash
cd /home/ken/Desktop/html/psyopedia
npm install prisma @prisma/client next-intl zod
```

- [ ] **Step 2: Install dev dependencies**

```bash
cd /home/ken/Desktop/html/psyopedia
npm install -D ts-node @types/node
```

- [ ] **Step 3: Initialize shadcn/ui**

```bash
cd /home/ken/Desktop/html/psyopedia
npx shadcn@latest init -d
```

This sets up `components.json`, updates `tailwind.config.ts` and `globals.css` for shadcn/ui theming.

- [ ] **Step 4: Initialize Prisma**

```bash
cd /home/ken/Desktop/html/psyopedia
npx prisma init
```

This creates `prisma/schema.prisma` and `.env` with `DATABASE_URL`.

- [ ] **Step 5: Commit**

```bash
cd /home/ken/Desktop/html/psyopedia
git add -A
git commit -m "chore: install prisma, next-intl, zod, shadcn/ui dependencies"
```

---

### Task 3: Environment Validation

**Files:**
- Create: `src/lib/env.ts`
- Create: `.env.example`

- [ ] **Step 1: Create .env.example**

Write `.env.example`:

```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/psyopedia?schema=public"

# NextAuth (Phase 4)
# NEXTAUTH_URL="http://localhost:3000"
# NEXTAUTH_SECRET=""
# GOOGLE_CLIENT_ID=""
# GOOGLE_CLIENT_SECRET=""
# GITHUB_CLIENT_ID=""
# GITHUB_CLIENT_SECRET=""
```

- [ ] **Step 2: Create Zod environment validation**

Write `src/lib/env.ts`:

```typescript
import { z } from "zod";

const envSchema = z.object({
  DATABASE_URL: z.string().url(),
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),
});

export const env = envSchema.parse(process.env);
```

- [ ] **Step 3: Update .env with real DATABASE_URL**

Ensure `.env` has a valid PostgreSQL connection string pointing to a local database named `psyopedia`. The exact value depends on the user's local Postgres setup:

```env
DATABASE_URL="postgresql://ken:@localhost:5432/psyopedia?schema=public"
```

- [ ] **Step 4: Add .env to .gitignore if not already there**

Check `.gitignore` — `create-next-app` should already include `.env*.local` but ensure `.env` itself is listed.

- [ ] **Step 5: Commit**

```bash
git add src/lib/env.ts .env.example .gitignore
git commit -m "feat: add Zod environment validation and .env.example"
```

---

### Task 4: Prisma Schema

**Files:**
- Modify: `prisma/schema.prisma`

- [ ] **Step 1: Write the complete Prisma schema**

Replace `prisma/schema.prisma` with the full schema:

```prisma
generator client {
  provider        = "prisma-client-js"
  previewFeatures = ["fullTextSearch"]
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// ─── Enums ──────────────────────────────────────────

enum Era {
  WWII
  COLD_WAR
  MODERN
  DIGITAL_AGE
}

enum OperationType {
  ASSASSINATION
  PROPAGANDA
  DECEPTION
  INFLUENCE_OP
  FALSE_FLAG
  INFILTRATION
  MIND_CONTROL
  SURVEILLANCE
  DISINFORMATION
}

enum Outcome {
  SUCCESSFUL
  FAILED
  PARTIAL
  ONGOING
  UNKNOWN
}

enum OperationStatus {
  DECLASSIFIED
  LEAKED
  ALLEGED
}

enum ModerationStatus {
  PENDING
  APPROVED
  REJECTED
}

enum SourceType {
  GOVERNMENT
  ACADEMIC
  JOURNALISM
  BOOK
  LEAKED_DOC
  VIDEO
  WEBSITE
}

enum ContributionType {
  NEW_OPERATION
  EDIT_OPERATION
  ADD_SOURCE
}

enum UserRole {
  USER
  MODERATOR
  ADMIN
}

// ─── Models ─────────────────────────────────────────

model Operation {
  id               String            @id @default(cuid())
  slug             String            @unique
  slugEs           String            @unique
  title            String
  titleEs          String
  aliases          String[]
  icebergLevel     Int               // 1-5
  era              Era
  types            OperationType[]
  actors           String[]          // countries, agencies
  targets          String[]          // civilian, military, etc.
  outcome          Outcome
  status           OperationStatus
  bodyEn           String            // MDX content
  bodyEs           String            // MDX content
  excerpt          String
  excerptEs        String
  coverImage       String?
  sources          Source[]
  relatedOps       Operation[]       @relation("RelatedOps")
  relatedTo        Operation[]       @relation("RelatedOps")
  tags             Tag[]
  contributions    Contribution[]
  comments         Comment[]
  viewCount        Int               @default(0)
  moderationStatus ModerationStatus  @default(APPROVED)
  contributedBy    User?             @relation("ContributedOperations", fields: [contributedById], references: [id])
  contributedById  String?
  createdAt        DateTime          @default(now())
  updatedAt        DateTime          @updatedAt
}

model Source {
  id          String     @id @default(cuid())
  url         String?
  title       String
  type        SourceType
  credibility Int        // 1-5
  operation   Operation  @relation(fields: [operationId], references: [id], onDelete: Cascade)
  operationId String
}

model Tag {
  id         String      @id @default(cuid())
  slug       String      @unique
  name       String
  nameEs     String
  operations Operation[]
}

model Contribution {
  id            String           @id @default(cuid())
  type          ContributionType
  operation     Operation?       @relation(fields: [operationId], references: [id])
  operationId   String?
  proposedData  Json             // full operation data for new entries
  diffData      Json?            // field-level diffs for edits
  reviewNote    String?
  status        ModerationStatus @default(PENDING)
  submittedBy   User             @relation("SubmittedContributions", fields: [submittedById], references: [id])
  submittedById String
  reviewedBy    User?            @relation("ReviewedContributions", fields: [reviewedById], references: [id])
  reviewedById  String?
  createdAt     DateTime         @default(now())
  updatedAt     DateTime         @updatedAt
}

model Comment {
  id          String           @id @default(cuid())
  body        String
  operation   Operation        @relation(fields: [operationId], references: [id], onDelete: Cascade)
  operationId String
  author      User             @relation(fields: [authorId], references: [id])
  authorId    String
  status      ModerationStatus @default(PENDING)
  createdAt   DateTime         @default(now())
}

model User {
  id                    String         @id @default(cuid())
  name                  String?
  email                 String         @unique
  emailVerified         DateTime?
  image                 String?
  role                  UserRole       @default(USER)
  reputation            Int            @default(0)
  contributions         Contribution[] @relation("SubmittedContributions")
  reviewedContributions Contribution[] @relation("ReviewedContributions")
  comments              Comment[]
  operationsAdded       Operation[]    @relation("ContributedOperations")
  accounts              Account[]
  sessions              Session[]
  createdAt             DateTime       @default(now())
}

model Account {
  id                String  @id @default(cuid())
  userId            String
  type              String
  provider          String
  providerAccountId String
  refresh_token     String?
  access_token      String?
  expires_at        Int?
  token_type        String?
  scope             String?
  id_token          String?
  session_state     String?
  user              User    @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([provider, providerAccountId])
}

model Session {
  id           String   @id @default(cuid())
  sessionToken String   @unique
  userId       String
  expires      DateTime
  user         User     @relation(fields: [userId], references: [id], onDelete: Cascade)
}

model VerificationToken {
  identifier String
  token      String   @unique
  expires    DateTime

  @@unique([identifier, token])
}
```

- [ ] **Step 2: Create the Prisma client singleton**

Write `src/lib/prisma.ts`:

```typescript
import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
```

- [ ] **Step 3: Create the PostgreSQL database**

```bash
createdb psyopedia
```

If the database already exists, this will error harmlessly.

- [ ] **Step 4: Run the initial migration**

```bash
cd /home/ken/Desktop/html/psyopedia
npx prisma migrate dev --name init
```

Expected: Migration created and applied, all tables created.

- [ ] **Step 5: Verify with Prisma Studio**

```bash
npx prisma studio
```

Expected: Opens browser showing all models with empty tables.

- [ ] **Step 6: Commit**

```bash
git add prisma/schema.prisma prisma/migrations/ src/lib/prisma.ts
git commit -m "feat: add complete Prisma schema with all models and enums"
```

---

### Task 5: Seed Data

**Files:**
- Create: `prisma/seed.ts`
- Modify: `package.json` (add prisma seed config)

- [ ] **Step 1: Add seed config to package.json**

Add to `package.json` at the top level:

```json
{
  "prisma": {
    "seed": "npx ts-node --compiler-options {\"module\":\"CommonJS\"} prisma/seed.ts"
  }
}
```

- [ ] **Step 2: Write the seed file**

Write `prisma/seed.ts` with 25 operations across 5 iceberg levels. Each entry includes: title, titleEs, slug, slugEs, icebergLevel, era, types, actors, targets, outcome, status, bodyEn, bodyEs, excerpt, excerptEs, aliases, and at least 2 sources.

```typescript
import { PrismaClient, Era, OperationType, Outcome, OperationStatus, SourceType } from "@prisma/client";

const prisma = new PrismaClient();

interface SeedOperation {
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
  bodyEn: string;
  bodyEs: string;
  excerpt: string;
  excerptEs: string;
  sources: { url: string | null; title: string; type: SourceType; credibility: number }[];
  tags: { slug: string; name: string; nameEs: string }[];
}

const operations: SeedOperation[] = [
  // ─── Level 1: Well-Known & Declassified ───────────
  {
    slug: "cointelpro",
    slugEs: "cointelpro",
    title: "COINTELPRO",
    titleEs: "COINTELPRO",
    aliases: ["Counter Intelligence Program"],
    icebergLevel: 1,
    era: Era.COLD_WAR,
    types: [OperationType.INFILTRATION, OperationType.SURVEILLANCE],
    actors: ["United States", "FBI"],
    targets: ["Civil rights groups", "Political activists", "Black Panther Party"],
    outcome: Outcome.SUCCESSFUL,
    status: OperationStatus.DECLASSIFIED,
    bodyEn: `## Overview

COINTELPRO (Counter Intelligence Program) was a series of covert and illegal projects conducted by the FBI aimed at surveilling, infiltrating, discrediting, and disrupting domestic American political organizations.

## Background

The program ran from 1956 to 1971 and targeted groups the FBI deemed "subversive," including civil rights leaders like Martin Luther King Jr., the Black Panther Party, the American Indian Movement, and anti-war protesters.

## Methods

- Infiltration of organizations with informants
- Psychological warfare through planted media stories
- Harassment through the legal system (false arrests, tax audits)
- Extralegal force including intimidation and violence
- "Black propaganda" — forged correspondence to create internal disputes

## Exposure

COINTELPRO was exposed in 1971 when the Citizens' Commission to Investigate the FBI burglarized an FBI office in Media, Pennsylvania, and leaked documents to the press.

## Legacy

The Church Committee hearings of 1975-1976 confirmed the program's existence and led to reforms in FBI oversight. However, critics argue similar tactics persist under different names.`,
    bodyEs: `## Resumen

COINTELPRO (Programa de Contrainteligencia) fue una serie de proyectos encubiertos e ilegales realizados por el FBI dirigidos a vigilar, infiltrar, desacreditar e interrumpir organizaciones politicas nacionales estadounidenses.

## Antecedentes

El programa funcionó de 1956 a 1971 y se dirigió a grupos que el FBI consideraba "subversivos," incluyendo lideres de derechos civiles como Martin Luther King Jr., el Partido de los Panteras Negras, el Movimiento Indígena Americano y los manifestantes contra la guerra.

## Metodos

- Infiltración de organizaciones con informantes
- Guerra psicológica a traves de historias plantadas en los medios
- Acoso a traves del sistema legal (arrestos falsos, auditorías fiscales)
- Fuerza extralegal incluyendo intimidación y violencia
- "Propaganda negra" — correspondencia falsificada para crear disputas internas

## Exposición

COINTELPRO fue expuesto en 1971 cuando la Comisión Ciudadana para Investigar al FBI robó una oficina del FBI en Media, Pensilvania, y filtró documentos a la prensa.

## Legado

Las audiencias del Comité Church de 1975-1976 confirmaron la existencia del programa y llevaron a reformas en la supervisión del FBI. Sin embargo, los críticos argumentan que tácticas similares persisten bajo diferentes nombres.`,
    excerpt: "FBI's covert program to surveil, infiltrate, and disrupt domestic political organizations from 1956 to 1971.",
    excerptEs: "Programa encubierto del FBI para vigilar, infiltrar e interrumpir organizaciones politicas nacionales de 1956 a 1971.",
    sources: [
      { url: "https://vault.fbi.gov/cointel-pro", title: "FBI Vault: COINTELPRO", type: SourceType.GOVERNMENT, credibility: 5 },
      { url: null, title: "The COINTELPRO Papers by Ward Churchill and Jim Vander Wall", type: SourceType.BOOK, credibility: 4 },
    ],
    tags: [
      { slug: "fbi", name: "FBI", nameEs: "FBI" },
      { slug: "civil-rights", name: "Civil Rights", nameEs: "Derechos Civiles" },
      { slug: "domestic-surveillance", name: "Domestic Surveillance", nameEs: "Vigilancia Nacional" },
    ],
  },
  {
    slug: "mkultra",
    slugEs: "mkultra",
    title: "MKUltra",
    titleEs: "MKUltra",
    aliases: ["MK-Ultra", "Project MKUltra"],
    icebergLevel: 1,
    era: Era.COLD_WAR,
    types: [OperationType.MIND_CONTROL],
    actors: ["United States", "CIA"],
    targets: ["Civilians", "Military personnel", "Prisoners"],
    outcome: Outcome.PARTIAL,
    status: OperationStatus.DECLASSIFIED,
    bodyEn: `## Overview

Project MKUltra was a top-secret CIA program that conducted illegal experiments on human subjects to develop mind control techniques using drugs, hypnosis, sensory deprivation, and psychological torture.

## Background

Initiated in 1953 during the Cold War, MKUltra was motivated by fears that the Soviet Union, China, and North Korea were using mind control on U.S. prisoners of war.

## Methods

- Administration of LSD and other psychoactive drugs to unwitting subjects
- Hypnosis and sensory deprivation experiments
- Electroshock therapy at extreme levels
- Verbal and sexual abuse as psychological tools
- Over 150 sub-projects at 80+ institutions

## Exposure

CIA Director Richard Helms ordered all MKUltra files destroyed in 1973. A cache of 20,000 documents survived due to a filing error and was discovered in 1977 via FOIA request.

## Legacy

The Church Committee and Rockefeller Commission investigations led to executive orders banning human experimentation without informed consent. MKUltra remains one of the most well-documented examples of government abuse of power.`,
    bodyEs: `## Resumen

El Proyecto MKUltra fue un programa ultrasecreto de la CIA que realizó experimentos ilegales en sujetos humanos para desarrollar tecnicas de control mental utilizando drogas, hipnosis, privación sensorial y tortura psicológica.

## Antecedentes

Iniciado en 1953 durante la Guerra Fría, MKUltra fue motivado por temores de que la Unión Sovietica, China y Corea del Norte estaban usando control mental en prisioneros de guerra estadounidenses.

## Metodos

- Administración de LSD y otras drogas psicoactivas a sujetos sin su conocimiento
- Experimentos de hipnosis y privación sensorial
- Terapia de electroshock a niveles extremos
- Abuso verbal y sexual como herramientas psicológicas
- Más de 150 subproyectos en 80+ instituciones

## Exposición

El director de la CIA, Richard Helms, ordenó destruir todos los archivos de MKUltra en 1973. Un archivo de 20,000 documentos sobrevivió debido a un error de archivo y fue descubierto en 1977 a traves de una solicitud FOIA.

## Legado

Las investigaciones del Comite Church y la Comisión Rockefeller llevaron a órdenes ejecutivas que prohibían la experimentación humana sin consentimiento informado.`,
    excerpt: "CIA's illegal mind control program using LSD, hypnosis, and psychological torture on unwitting human subjects.",
    excerptEs: "Programa ilegal de control mental de la CIA usando LSD, hipnosis y tortura psicológica en sujetos humanos sin su consentimiento.",
    sources: [
      { url: "https://www.cia.gov/readingroom/collection/mkultra", title: "CIA FOIA Reading Room: MKUltra", type: SourceType.GOVERNMENT, credibility: 5 },
      { url: null, title: "The Search for the Manchurian Candidate by John Marks", type: SourceType.BOOK, credibility: 4 },
    ],
    tags: [
      { slug: "cia", name: "CIA", nameEs: "CIA" },
      { slug: "mind-control", name: "Mind Control", nameEs: "Control Mental" },
      { slug: "human-experimentation", name: "Human Experimentation", nameEs: "Experimentacion Humana" },
    ],
  },
  {
    slug: "operation-paperclip",
    slugEs: "operacion-paperclip",
    title: "Operation Paperclip",
    titleEs: "Operacion Paperclip",
    aliases: ["Project Paperclip"],
    icebergLevel: 1,
    era: Era.WWII,
    types: [OperationType.INFILTRATION],
    actors: ["United States", "OSS", "JIOA"],
    targets: ["German scientists", "Military technology"],
    outcome: Outcome.SUCCESSFUL,
    status: OperationStatus.DECLASSIFIED,
    bodyEn: `## Overview

Operation Paperclip was a secret United States intelligence program in which more than 1,600 German scientists, engineers, and technicians were recruited from post-Nazi Germany to work for the U.S. government.

## Background

As World War II ended, the U.S. raced against the Soviet Union to capture German scientific expertise, particularly in rocketry, aerospace, and chemical weapons.

## Methods

- Whitewashing Nazi records to bypass President Truman's anti-Nazi directive
- Providing new identities and immigration paperwork
- Placing scientists in key positions at NASA, Fort Bliss, and other installations
- Suppressing war crimes records of recruited scientists

## Key Figures

- Wernher von Braun — former SS officer, became director of NASA's Marshall Space Flight Center
- Kurt Blome — Nazi biological weapons scientist, hired by the U.S. Army Chemical Corps
- Hubertus Strughold — "Father of Space Medicine," linked to Dachau experiments

## Legacy

Operation Paperclip fundamentally shaped U.S. space and military technology programs. It remains controversial for prioritizing scientific advancement over accountability for war crimes.`,
    bodyEs: `## Resumen

La Operación Paperclip fue un programa secreto de inteligencia de Estados Unidos en el que más de 1,600 científicos, ingenieros y tecnicos alemanes fueron reclutados de la Alemania post-nazi para trabajar para el gobierno estadounidense.

## Antecedentes

Al terminar la Segunda Guerra Mundial, EE.UU. compitió contra la Unión Sovietica para capturar la experiencia científica alemana, particularmente en cohetería, aeroespacial y armas químicas.

## Metodos

- Blanqueo de registros nazis para evadir la directiva anti-nazi del presidente Truman
- Proporcionar nuevas identidades y documentación migratoria
- Colocación de científicos en posiciones clave en la NASA, Fort Bliss y otras instalaciones
- Supresión de registros de crímenes de guerra de los científicos reclutados

## Legado

La Operación Paperclip dio forma fundamental a los programas de tecnología espacial y militar de EE.UU. Sigue siendo controversial por priorizar el avance científico sobre la responsabilidad por crímenes de guerra.`,
    excerpt: "Secret U.S. program that recruited 1,600+ German scientists from post-Nazi Germany, whitewashing their war records.",
    excerptEs: "Programa secreto de EE.UU. que reclutó a más de 1,600 científicos alemanes de la Alemania post-nazi, blanqueando sus registros de guerra.",
    sources: [
      { url: "https://www.archives.gov/iwg/declassified-records/rg-330-defense-secretary", title: "National Archives: Operation Paperclip Records", type: SourceType.GOVERNMENT, credibility: 5 },
      { url: null, title: "Operation Paperclip: The Secret Intelligence Program by Annie Jacobsen", type: SourceType.BOOK, credibility: 4 },
    ],
    tags: [
      { slug: "nasa", name: "NASA", nameEs: "NASA" },
      { slug: "wwii", name: "World War II", nameEs: "Segunda Guerra Mundial" },
      { slug: "recruitment", name: "Recruitment", nameEs: "Reclutamiento" },
    ],
  },
  {
    slug: "operation-northwoods",
    slugEs: "operacion-northwoods",
    title: "Operation Northwoods",
    titleEs: "Operacion Northwoods",
    aliases: [],
    icebergLevel: 1,
    era: Era.COLD_WAR,
    types: [OperationType.FALSE_FLAG, OperationType.DECEPTION],
    actors: ["United States", "Joint Chiefs of Staff"],
    targets: ["American public", "Cuba"],
    outcome: Outcome.FAILED,
    status: OperationStatus.DECLASSIFIED,
    bodyEn: `## Overview

Operation Northwoods was a proposed false flag operation against American citizens that originated within the U.S. Department of Defense in 1962. The proposals called for the CIA or other U.S. government operatives to both stage and actually commit acts of terrorism against American military and civilian targets, blaming them on the Cuban government.

## Proposals

- Staging mock attacks on U.S. military bases
- Sinking a U.S. Navy ship in Guantanamo Bay (with fake casualties)
- Hijacking planes and blaming Cuba
- Bombing Miami and Washington, D.C.
- Attacking Cuban refugee boats

## Rejection

President John F. Kennedy rejected the proposal and removed Chairman of the Joint Chiefs Lyman Lemnitzer from his position shortly after.

## Declassification

The documents were declassified in 1997 as part of the JFK Assassination Records Review Board process.`,
    bodyEs: `## Resumen

La Operación Northwoods fue una operación de falsa bandera propuesta contra ciudadanos estadounidenses que se originó dentro del Departamento de Defensa de EE.UU. en 1962. Las propuestas pedían que la CIA u otros operativos del gobierno escenificaran y realmente cometieran actos de terrorismo contra objetivos militares y civiles estadounidenses, culpando al gobierno cubano.

## Propuestas

- Escenificar ataques simulados a bases militares estadounidenses
- Hundir un barco de la Marina en la Bahía de Guantánamo (con víctimas falsas)
- Secuestrar aviones y culpar a Cuba
- Bombardear Miami y Washington, D.C.
- Atacar botes de refugiados cubanos

## Rechazo

El presidente John F. Kennedy rechazó la propuesta y removió al presidente del Estado Mayor Conjunto, Lyman Lemnitzer, de su posición poco despues.

## Desclasificación

Los documentos fueron desclasificados en 1997 como parte del proceso de la Junta de Revisión de Registros del Asesinato de JFK.`,
    excerpt: "Proposed 1962 false flag operation by the Joint Chiefs of Staff to stage terrorist attacks on U.S. soil and blame Cuba.",
    excerptEs: "Operación de falsa bandera propuesta en 1962 por el Estado Mayor Conjunto para escenificar ataques terroristas en suelo estadounidense y culpar a Cuba.",
    sources: [
      { url: "https://nsarchive2.gwu.edu/news/20010430/northwoods.pdf", title: "National Security Archive: Northwoods Document", type: SourceType.GOVERNMENT, credibility: 5 },
      { url: null, title: "Body of Secrets by James Bamford", type: SourceType.BOOK, credibility: 4 },
    ],
    tags: [
      { slug: "false-flag", name: "False Flag", nameEs: "Falsa Bandera" },
      { slug: "cuba", name: "Cuba", nameEs: "Cuba" },
      { slug: "military", name: "Military", nameEs: "Militar" },
    ],
  },
  {
    slug: "operation-mockingbird",
    slugEs: "operacion-sinsonte",
    title: "Operation Mockingbird",
    titleEs: "Operacion Sinsonte",
    aliases: [],
    icebergLevel: 1,
    era: Era.COLD_WAR,
    types: [OperationType.PROPAGANDA, OperationType.INFLUENCE_OP],
    actors: ["United States", "CIA"],
    targets: ["American media", "Public opinion"],
    outcome: Outcome.SUCCESSFUL,
    status: OperationStatus.DECLASSIFIED,
    bodyEn: `## Overview

Operation Mockingbird was an alleged large-scale CIA campaign to infiltrate and influence American media organizations during the Cold War. The CIA recruited leading American journalists and media organizations to become propaganda assets.

## Methods

- Direct recruitment of journalists as CIA assets
- Funding of student and cultural organizations as front groups
- Placement of stories in major publications
- Influence over editorial decisions at newspapers and wire services

## Key Details

At its peak, the operation allegedly included over 400 journalists and 25 major organizations including wire services, newspapers, magazines, and TV networks.

## Exposure

Details emerged through the Church Committee investigations in 1975, though the CIA has never fully acknowledged the operation's scope.`,
    bodyEs: `## Resumen

La Operación Sinsonte fue una presunta campaña a gran escala de la CIA para infiltrar e influir en las organizaciones de medios estadounidenses durante la Guerra Fría. La CIA reclutó a destacados periodistas y organizaciones de medios estadounidenses para convertirlos en activos de propaganda.

## Metodos

- Reclutamiento directo de periodistas como activos de la CIA
- Financiamiento de organizaciones estudiantiles y culturales como grupos fachada
- Colocación de historias en publicaciones importantes
- Influencia sobre decisiones editoriales en periódicos y servicios de noticias

## Detalles Clave

En su punto máximo, la operación presuntamente incluyó a más de 400 periodistas y 25 organizaciones importantes, incluyendo servicios de noticias, periódicos, revistas y cadenas de televisión.

## Exposición

Los detalles surgieron a traves de las investigaciones del Comite Church en 1975, aunque la CIA nunca ha reconocido completamente el alcance de la operación.`,
    excerpt: "CIA campaign to infiltrate American media, recruiting 400+ journalists and 25 organizations as propaganda assets.",
    excerptEs: "Campaña de la CIA para infiltrar los medios estadounidenses, reclutando a más de 400 periodistas y 25 organizaciones como activos de propaganda.",
    sources: [
      { url: null, title: "The Mighty Wurlitzer: How the CIA Played America by Hugh Wilford", type: SourceType.BOOK, credibility: 4 },
      { url: "https://www.intelligence.senate.gov/sites/default/files/94755_II.pdf", title: "Church Committee Final Report, Book II", type: SourceType.GOVERNMENT, credibility: 5 },
    ],
    tags: [
      { slug: "cia", name: "CIA", nameEs: "CIA" },
      { slug: "media-manipulation", name: "Media Manipulation", nameEs: "Manipulación de Medios" },
      { slug: "propaganda", name: "Propaganda", nameEs: "Propaganda" },
    ],
  },

  // ─── Level 2: Known but Underappreciated ──────────
  {
    slug: "operation-gladio",
    slugEs: "operacion-gladio",
    title: "Operation Gladio",
    titleEs: "Operacion Gladio",
    aliases: ["Stay-Behind Networks"],
    icebergLevel: 2,
    era: Era.COLD_WAR,
    types: [OperationType.FALSE_FLAG, OperationType.INFILTRATION],
    actors: ["NATO", "CIA", "MI6", "Italy"],
    targets: ["European civilians", "Left-wing parties"],
    outcome: Outcome.SUCCESSFUL,
    status: OperationStatus.DECLASSIFIED,
    bodyEn: `## Overview

Operation Gladio was a clandestine NATO "stay-behind" operation during the Cold War. Secret armies were established across Western Europe to resist a potential Soviet invasion, but evidence shows they were also involved in political manipulation and false-flag terrorism.

## Background

Organized beginning in the late 1940s, Gladio networks existed in nearly every Western European country, coordinated by NATO and funded primarily by the CIA.

## Revelations

Italian Prime Minister Giulio Andreotti confirmed Gladio's existence in 1990, triggering investigations across Europe. Links were discovered to major terrorist attacks including the 1980 Bologna railway station bombing that killed 85 people.

## Legacy

The European Parliament condemned the existence of these networks in 1990. Gladio remains one of the most significant confirmed examples of state-sponsored false-flag operations in modern history.`,
    bodyEs: `## Resumen

La Operación Gladio fue una operación clandestina de la OTAN de "redes de retaguardia" durante la Guerra Fría. Se establecieron ejércitos secretos en toda Europa Occidental para resistir una posible invasión sovietica, pero la evidencia muestra que también estuvieron involucrados en manipulación política y terrorismo de falsa bandera.

## Antecedentes

Organizadas a partir de finales de la decada de 1940, las redes Gladio existieron en casi todos los países de Europa Occidental, coordinadas por la OTAN y financiadas principalmente por la CIA.

## Revelaciones

El primer ministro italiano Giulio Andreotti confirmó la existencia de Gladio en 1990, desencadenando investigaciones en toda Europa. Se descubrieron vínculos con importantes ataques terroristas, incluyendo el bombardeo de la estación de tren de Bolonia en 1980 que mató a 85 personas.

## Legado

El Parlamento Europeo condenó la existencia de estas redes en 1990. Gladio sigue siendo uno de los ejemplos confirmados más significativos de operaciones de falsa bandera patrocinadas por estados en la historia moderna.`,
    excerpt: "NATO's clandestine stay-behind armies across Western Europe, linked to false-flag terrorism and political manipulation.",
    excerptEs: "Ejércitos clandestinos de retaguardia de la OTAN en toda Europa Occidental, vinculados al terrorismo de falsa bandera y la manipulación política.",
    sources: [
      { url: null, title: "NATO's Secret Armies: Operation Gladio and Terrorism in Western Europe by Daniele Ganser", type: SourceType.BOOK, credibility: 4 },
      { url: null, title: "European Parliament Resolution on Gladio, Nov 22, 1990", type: SourceType.GOVERNMENT, credibility: 5 },
    ],
    tags: [
      { slug: "nato", name: "NATO", nameEs: "OTAN" },
      { slug: "false-flag", name: "False Flag", nameEs: "Falsa Bandera" },
      { slug: "europe", name: "Europe", nameEs: "Europa" },
    ],
  },
  {
    slug: "gulf-of-tonkin",
    slugEs: "golfo-de-tonkin",
    title: "Gulf of Tonkin Incident",
    titleEs: "Incidente del Golfo de Tonkin",
    aliases: ["Tonkin Gulf Incident"],
    icebergLevel: 2,
    era: Era.COLD_WAR,
    types: [OperationType.FALSE_FLAG, OperationType.DECEPTION],
    actors: ["United States", "NSA", "U.S. Navy"],
    targets: ["American public", "U.S. Congress"],
    outcome: Outcome.SUCCESSFUL,
    status: OperationStatus.DECLASSIFIED,
    bodyEn: `## Overview

The Gulf of Tonkin incident refers to two reported confrontations between North Vietnamese and U.S. naval forces in August 1964. While the first incident was real, the second — used as the primary justification for escalating U.S. involvement in Vietnam — almost certainly did not occur.

## The Deception

NSA documents declassified in 2005 confirmed that the second attack on August 4, 1964 never happened. Intelligence was deliberately manipulated to support the Johnson administration's desire for congressional authorization to escalate military operations.

## Consequences

The Gulf of Tonkin Resolution, passed by Congress on August 7, 1964, gave President Johnson broad authority to escalate the Vietnam War without a formal declaration of war. This led to over a decade of conflict, 58,000 American and millions of Vietnamese deaths.

## Legacy

The incident is a landmark example of how intelligence manipulation can be used to manufacture consent for war.`,
    bodyEs: `## Resumen

El incidente del Golfo de Tonkin se refiere a dos confrontaciones reportadas entre fuerzas navales norvietnamitas y estadounidenses en agosto de 1964. Mientras el primer incidente fue real, el segundo — utilizado como justificación principal para escalar la participación de EE.UU. en Vietnam — casi con certeza no ocurrió.

## El Engaño

Documentos de la NSA desclasificados en 2005 confirmaron que el segundo ataque del 4 de agosto de 1964 nunca ocurrió. La inteligencia fue manipulada deliberadamente para apoyar el deseo de la administración Johnson de obtener autorización del Congreso para escalar las operaciones militares.

## Consecuencias

La Resolución del Golfo de Tonkin, aprobada por el Congreso el 7 de agosto de 1964, dio al presidente Johnson amplia autoridad para escalar la Guerra de Vietnam sin una declaración formal de guerra.

## Legado

El incidente es un ejemplo emblemático de cómo la manipulación de inteligencia puede usarse para fabricar consentimiento para la guerra.`,
    excerpt: "Fabricated 1964 naval confrontation used to justify U.S. escalation of the Vietnam War — the second attack never happened.",
    excerptEs: "Confrontación naval fabricada en 1964 usada para justificar la escalada de EE.UU. en la Guerra de Vietnam — el segundo ataque nunca ocurrió.",
    sources: [
      { url: "https://www.nsa.gov/portals/75/documents/news-features/declassified-documents/gulf-of-tonkin/articles/rel1_SIGINT_Rpt_TOG.pdf", title: "NSA Declassified Gulf of Tonkin Documents", type: SourceType.GOVERNMENT, credibility: 5 },
      { url: null, title: "The Fog of War (documentary, 2003)", type: SourceType.VIDEO, credibility: 4 },
    ],
    tags: [
      { slug: "vietnam", name: "Vietnam War", nameEs: "Guerra de Vietnam" },
      { slug: "nsa", name: "NSA", nameEs: "NSA" },
      { slug: "false-flag", name: "False Flag", nameEs: "Falsa Bandera" },
    ],
  },
  {
    slug: "operation-condor",
    slugEs: "operacion-condor",
    title: "Operation Condor",
    titleEs: "Operacion Condor",
    aliases: ["Plan Condor"],
    icebergLevel: 2,
    era: Era.COLD_WAR,
    types: [OperationType.ASSASSINATION, OperationType.INFILTRATION, OperationType.SURVEILLANCE],
    actors: ["United States", "CIA", "Argentina", "Chile", "Brazil", "Paraguay", "Uruguay", "Bolivia"],
    targets: ["Left-wing dissidents", "Civilians", "Political opposition"],
    outcome: Outcome.SUCCESSFUL,
    status: OperationStatus.DECLASSIFIED,
    bodyEn: `## Overview

Operation Condor was a campaign of political repression and state terror involving intelligence operations and assassination of opponents, jointly implemented by the right-wing dictatorships of the Southern Cone of South America during the 1970s and 1980s, with U.S. support.

## Scope

The operation coordinated the activities of military dictatorships in Argentina, Chile, Uruguay, Paraguay, Bolivia, and Brazil. An estimated 60,000 people were killed and 400,000 were imprisoned.

## U.S. Involvement

Declassified CIA and State Department documents confirmed active U.S. support through intelligence sharing, training, and financial assistance. Secretary of State Henry Kissinger was directly informed of the program.

## Legacy

Multiple trials have since convicted participants. In 2016, an Argentine court convicted 15 former military officers for crimes committed under Operation Condor.`,
    bodyEs: `## Resumen

La Operación Cóndor fue una campaña de represión política y terror estatal que involucró operaciones de inteligencia y asesinato de opositores, implementada conjuntamente por las dictaduras de derecha del Cono Sur de Sudamerica durante las decadas de 1970 y 1980, con apoyo de EE.UU.

## Alcance

La operación coordinó las actividades de dictaduras militares en Argentina, Chile, Uruguay, Paraguay, Bolivia y Brasil. Se estima que 60,000 personas fueron asesinadas y 400,000 fueron encarceladas.

## Participación de EE.UU.

Documentos desclasificados de la CIA y el Departamento de Estado confirmaron el apoyo activo de EE.UU. a traves del intercambio de inteligencia, entrenamiento y asistencia financiera. El Secretario de Estado Henry Kissinger fue informado directamente del programa.

## Legado

Múltiples juicios han condenado a los participantes. En 2016, un tribunal argentino condenó a 15 ex oficiales militares por crímenes cometidos bajo la Operación Cóndor.`,
    excerpt: "U.S.-backed campaign of political repression across South American dictatorships — 60,000 killed, 400,000 imprisoned.",
    excerptEs: "Campaña de represión política respaldada por EE.UU. en dictaduras sudamericanas — 60,000 muertos, 400,000 encarcelados.",
    sources: [
      { url: "https://nsarchive.gwu.edu/project/argentina-declassification-project", title: "National Security Archive: Argentina Declassification", type: SourceType.GOVERNMENT, credibility: 5 },
      { url: null, title: "Predatory States: Operation Condor and Covert War in Latin America by J. Patrice McSherry", type: SourceType.ACADEMIC, credibility: 4 },
    ],
    tags: [
      { slug: "cia", name: "CIA", nameEs: "CIA" },
      { slug: "latin-america", name: "Latin America", nameEs: "America Latina" },
      { slug: "assassination", name: "Assassination", nameEs: "Asesinato" },
    ],
  },
  {
    slug: "project-artichoke",
    slugEs: "proyecto-alcachofa",
    title: "Project Artichoke",
    titleEs: "Proyecto Alcachofa",
    aliases: ["Project Bluebird"],
    icebergLevel: 2,
    era: Era.COLD_WAR,
    types: [OperationType.MIND_CONTROL],
    actors: ["United States", "CIA"],
    targets: ["Prisoners of war", "Defectors", "Agents"],
    outcome: Outcome.PARTIAL,
    status: OperationStatus.DECLASSIFIED,
    bodyEn: `## Overview

Project Artichoke (originally Project Bluebird) was a CIA program that researched interrogation methods, including the use of drugs, hypnosis, and forced morphine addiction/withdrawal to extract information from subjects.

## Background

Running from 1951 to 1953, Artichoke was the direct predecessor to MKUltra. The program explored whether a person could be involuntarily made to perform an act of attempted assassination.

## Methods

- Forced administration of LSD, heroin, and other drugs
- Hypnosis combined with drug administration
- Sensory deprivation and isolation
- Electroshock and pain-based conditioning
- Experiments conducted on prisoners overseas with no legal oversight

## Legacy

Project Artichoke laid the groundwork for MKUltra and demonstrated the CIA's willingness to conduct unethical human experiments in the name of national security.`,
    bodyEs: `## Resumen

El Proyecto Alcachofa (originalmente Proyecto Bluebird) fue un programa de la CIA que investigó metodos de interrogatorio, incluyendo el uso de drogas, hipnosis y adicción/abstinencia forzada de morfina para extraer información de los sujetos.

## Antecedentes

Funcionando de 1951 a 1953, Alcachofa fue el predecesor directo de MKUltra. El programa exploró si una persona podría ser involuntariamente obligada a realizar un acto de intento de asesinato.

## Metodos

- Administración forzada de LSD, heroína y otras drogas
- Hipnosis combinada con administración de drogas
- Privación sensorial y aislamiento
- Electroshock y condicionamiento basado en dolor
- Experimentos realizados en prisioneros en el extranjero sin supervisión legal

## Legado

El Proyecto Alcachofa sentó las bases para MKUltra y demostró la voluntad de la CIA de llevar a cabo experimentos humanos no eticos en nombre de la seguridad nacional.`,
    excerpt: "CIA precursor to MKUltra using drugs, hypnosis, and forced addiction to develop interrogation and mind control techniques.",
    excerptEs: "Precursor de la CIA a MKUltra usando drogas, hipnosis y adicción forzada para desarrollar tecnicas de interrogatorio y control mental.",
    sources: [
      { url: "https://www.cia.gov/readingroom/document/cia-rdp83-01042r000800010003-1", title: "CIA Reading Room: Project Artichoke", type: SourceType.GOVERNMENT, credibility: 5 },
      { url: null, title: "A Terrible Mistake by H.P. Albarelli Jr.", type: SourceType.BOOK, credibility: 3 },
    ],
    tags: [
      { slug: "cia", name: "CIA", nameEs: "CIA" },
      { slug: "mind-control", name: "Mind Control", nameEs: "Control Mental" },
      { slug: "interrogation", name: "Interrogation", nameEs: "Interrogatorio" },
    ],
  },
  {
    slug: "jade-helm-15",
    slugEs: "jade-helm-15",
    title: "Jade Helm 15",
    titleEs: "Jade Helm 15",
    aliases: [],
    icebergLevel: 2,
    era: Era.MODERN,
    types: [OperationType.PROPAGANDA, OperationType.DISINFORMATION],
    actors: ["United States", "U.S. Special Operations Command"],
    targets: ["American public"],
    outcome: Outcome.PARTIAL,
    status: OperationStatus.DECLASSIFIED,
    bodyEn: `## Overview

Jade Helm 15 was a U.S. military training exercise conducted across several southwestern states in summer 2015. It became the subject of conspiracy theories alleging it was a cover for imposing martial law.

## The Exercise

A routine special operations training exercise involving approximately 1,200 service members conducting realistic military training on private and public land across Texas, Arizona, New Mexico, Utah, Colorado, Mississippi, and Florida.

## The Psyop Angle

What makes Jade Helm significant for psyop studies is not the exercise itself, but the information environment that formed around it. Russian-linked social media accounts were later found to have amplified conspiracy theories about the exercise, making it an early case study in foreign information warfare targeting domestic U.S. audiences.

## Legacy

A 2017 study found that Russian troll accounts had specifically targeted Jade Helm to test techniques that would later be used during the 2016 U.S. presidential election.`,
    bodyEs: `## Resumen

Jade Helm 15 fue un ejercicio de entrenamiento militar de EE.UU. realizado en varios estados del suroeste en el verano de 2015. Se convirtió en objeto de teorías conspirativas que alegaban que era una cobertura para imponer la ley marcial.

## El Ejercicio

Un ejercicio de entrenamiento de operaciones especiales de rutina que involucró aproximadamente a 1,200 miembros del servicio realizando entrenamiento militar realista en tierras públicas y privadas en Texas, Arizona, Nuevo Mexico, Utah, Colorado, Mississippi y Florida.

## El Ángulo Psyop

Lo que hace a Jade Helm significativo para los estudios de operaciones psicológicas no es el ejercicio en sí, sino el entorno informativo que se formó a su alrededor. Más tarde se descubrió que cuentas de redes sociales vinculadas a Rusia habían amplificado las teorías conspirativas sobre el ejercicio, convirtiendolo en un caso de estudio temprano de guerra informativa extranjera dirigida a audiencias nacionales estadounidenses.

## Legado

Un estudio de 2017 encontró que cuentas de trolls rusos habían atacado específicamente a Jade Helm para probar tecnicas que luego se utilizarían durante las elecciones presidenciales de EE.UU. de 2016.`,
    excerpt: "2015 U.S. military exercise that became a case study in Russian information warfare amplifying domestic conspiracy theories.",
    excerptEs: "Ejercicio militar de EE.UU. en 2015 que se convirtió en un caso de estudio en la guerra informativa rusa amplificando teorías conspirativas nacionales.",
    sources: [
      { url: null, title: "Information Warfare and the Jade Helm 15 Conspiracy (Journal of Strategic Studies)", type: SourceType.ACADEMIC, credibility: 4 },
      { url: null, title: "Computational Propaganda: Political Parties, Politicians, and Political Manipulation on Social Media (Oxford)", type: SourceType.ACADEMIC, credibility: 4 },
    ],
    tags: [
      { slug: "russia", name: "Russia", nameEs: "Rusia" },
      { slug: "disinformation", name: "Disinformation", nameEs: "Desinformación" },
      { slug: "social-media", name: "Social Media", nameEs: "Redes Sociales" },
    ],
  },

  // ─── Level 3: Leaked / Partially Verified ─────────
  {
    slug: "cambridge-analytica",
    slugEs: "cambridge-analytica",
    title: "Cambridge Analytica / Facebook",
    titleEs: "Cambridge Analytica / Facebook",
    aliases: ["Facebook Data Scandal"],
    icebergLevel: 3,
    era: Era.DIGITAL_AGE,
    types: [OperationType.INFLUENCE_OP, OperationType.SURVEILLANCE],
    actors: ["United Kingdom", "Cambridge Analytica", "SCL Group", "Facebook"],
    targets: ["Voters", "Social media users"],
    outcome: Outcome.SUCCESSFUL,
    status: OperationStatus.LEAKED,
    bodyEn: `## Overview

Cambridge Analytica was a British political consulting firm that harvested personal data from millions of Facebook users without their consent to build psychological profiles and target them with personalized political advertising.

## Methods

- Harvested data from 87 million Facebook profiles via a personality quiz app
- Built psychographic profiles based on OCEAN personality model
- Micro-targeted voters with personalized political ads
- Used techniques derived from military psychological operations (parent company SCL Group had defense contracts)

## Exposure

Whistleblower Christopher Wylie revealed the operation to The Guardian and The New York Times in March 2018, providing internal documents and testimony.

## Consequences

Cambridge Analytica shut down in May 2018. Facebook was fined $5 billion by the FTC. Multiple countries launched investigations. The scandal led to increased scrutiny of social media data practices globally.`,
    bodyEs: `## Resumen

Cambridge Analytica fue una firma británica de consultoría política que recopiló datos personales de millones de usuarios de Facebook sin su consentimiento para construir perfiles psicológicos y dirigirles publicidad política personalizada.

## Metodos

- Recopiló datos de 87 millones de perfiles de Facebook a traves de una aplicación de cuestionario de personalidad
- Construyó perfiles psicográficos basados en el modelo de personalidad OCEAN
- Micro-segmentó a votantes con anuncios políticos personalizados
- Utilizó tecnicas derivadas de operaciones psicológicas militares (la empresa matriz SCL Group tenía contratos de defensa)

## Exposición

El denunciante Christopher Wylie reveló la operación a The Guardian y The New York Times en marzo de 2018, proporcionando documentos internos y testimonio.

## Consecuencias

Cambridge Analytica cerró en mayo de 2018. Facebook fue multado con $5 mil millones por la FTC. Múltiples países lanzaron investigaciones.`,
    excerpt: "British firm that harvested 87 million Facebook profiles to build psychographic voter profiles using military psyop techniques.",
    excerptEs: "Firma británica que recopiló 87 millones de perfiles de Facebook para construir perfiles psicográficos de votantes usando tecnicas de operaciones psicológicas militares.",
    sources: [
      { url: null, title: "The Great Hack (Netflix documentary, 2019)", type: SourceType.VIDEO, credibility: 4 },
      { url: null, title: "Mindf*ck: Cambridge Analytica and the Plot to Break America by Christopher Wylie", type: SourceType.BOOK, credibility: 5 },
    ],
    tags: [
      { slug: "social-media", name: "Social Media", nameEs: "Redes Sociales" },
      { slug: "data-harvesting", name: "Data Harvesting", nameEs: "Cosecha de Datos" },
      { slug: "elections", name: "Elections", nameEs: "Elecciones" },
    ],
  },
  {
    slug: "internet-research-agency",
    slugEs: "agencia-de-investigacion-de-internet",
    title: "Internet Research Agency",
    titleEs: "Agencia de Investigacion de Internet",
    aliases: ["IRA", "Troll Farm", "Glavset"],
    icebergLevel: 3,
    era: Era.DIGITAL_AGE,
    types: [OperationType.DISINFORMATION, OperationType.INFLUENCE_OP, OperationType.PROPAGANDA],
    actors: ["Russia", "Internet Research Agency"],
    targets: ["American voters", "European public", "Social media users"],
    outcome: Outcome.SUCCESSFUL,
    status: OperationStatus.LEAKED,
    bodyEn: `## Overview

The Internet Research Agency (IRA) is a Russian company engaged in online influence operations on behalf of Russian business and political interests. Based in St. Petersburg, it employed hundreds of people to create fake social media accounts and spread disinformation.

## Methods

- Created thousands of fake social media accounts impersonating Americans
- Organized real-world political rallies in the U.S. through fake accounts
- Operated on every major platform: Facebook, Twitter, Instagram, YouTube, Reddit
- Used targeted advertising to amplify divisive content
- Created entire fake news websites

## Scale

The Mueller investigation found the IRA's budget was approximately $1.25 million per month by September 2016. They reached an estimated 126 million Americans on Facebook alone.

## Consequences

The U.S. Department of Justice indicted 13 Russian nationals and 3 Russian organizations in 2018. The operation demonstrated the vulnerability of open democracies to foreign information warfare.`,
    bodyEs: `## Resumen

La Agencia de Investigación de Internet (IRA) es una empresa rusa dedicada a operaciones de influencia en línea en nombre de intereses comerciales y políticos rusos. Con sede en San Petersburgo, empleó a cientos de personas para crear cuentas falsas en redes sociales y difundir desinformación.

## Metodos

- Creó miles de cuentas falsas en redes sociales haciendose pasar por estadounidenses
- Organizó manifestaciones políticas reales en EE.UU. a traves de cuentas falsas
- Operó en todas las plataformas principales: Facebook, Twitter, Instagram, YouTube, Reddit
- Utilizó publicidad dirigida para amplificar contenido divisivo
- Creó sitios web de noticias falsas completos

## Escala

La investigación de Mueller encontró que el presupuesto de la IRA era de aproximadamente $1.25 millones por mes para septiembre de 2016. Alcanzaron a un estimado de 126 millones de estadounidenses solo en Facebook.

## Consecuencias

El Departamento de Justicia de EE.UU. acusó a 13 ciudadanos rusos y 3 organizaciones rusas en 2018.`,
    excerpt: "Russian troll farm that spent $1.25M/month creating fake American social media accounts, reaching 126 million users on Facebook.",
    excerptEs: "Fábrica de trolls rusa que gastó $1.25M/mes creando cuentas falsas de redes sociales estadounidenses, alcanzando a 126 millones de usuarios en Facebook.",
    sources: [
      { url: null, title: "Report on the Investigation into Russian Interference in the 2016 Presidential Election (Mueller Report)", type: SourceType.GOVERNMENT, credibility: 5 },
      { url: null, title: "The Disinformation Age by W. Lance Bennett and Steven Livingston", type: SourceType.ACADEMIC, credibility: 4 },
    ],
    tags: [
      { slug: "russia", name: "Russia", nameEs: "Rusia" },
      { slug: "disinformation", name: "Disinformation", nameEs: "Desinformación" },
      { slug: "social-media", name: "Social Media", nameEs: "Redes Sociales" },
    ],
  },
  {
    slug: "nsa-prism",
    slugEs: "nsa-prism",
    title: "NSA PRISM Program",
    titleEs: "Programa PRISM de la NSA",
    aliases: ["PRISM", "Planning Tool for Resource Integration, Synchronization, and Management"],
    icebergLevel: 3,
    era: Era.DIGITAL_AGE,
    types: [OperationType.SURVEILLANCE],
    actors: ["United States", "NSA", "GCHQ"],
    targets: ["Global internet users", "Foreign nationals", "American citizens"],
    outcome: Outcome.SUCCESSFUL,
    status: OperationStatus.LEAKED,
    bodyEn: `## Overview

PRISM is a code name for a program under which the NSA collects internet communications from major U.S. technology companies. Leaked by Edward Snowden in 2013, it revealed mass surveillance of global communications.

## Methods

- Direct access to servers of Google, Facebook, Apple, Microsoft, Yahoo, and other tech companies
- Collection of emails, chat logs, video calls, photos, stored data, and file transfers
- Operated under Section 702 of the FISA Amendments Act
- Companion programs (UPSTREAM) tapped directly into undersea fiber optic cables

## Exposure

NSA contractor Edward Snowden leaked classified documents to journalists Glenn Greenwald and Laura Poitras in June 2013, revealing PRISM and dozens of other surveillance programs.

## Consequences

Global diplomatic fallout, tech industry encryption reforms, passage of the USA FREEDOM Act (2015), and ongoing debate about the balance between security and privacy.`,
    bodyEs: `## Resumen

PRISM es un nombre en clave para un programa bajo el cual la NSA recopila comunicaciones de internet de las principales empresas tecnológicas de EE.UU. Filtrado por Edward Snowden en 2013, reveló la vigilancia masiva de las comunicaciones globales.

## Metodos

- Acceso directo a servidores de Google, Facebook, Apple, Microsoft, Yahoo y otras empresas tecnológicas
- Recopilación de correos electrónicos, registros de chat, videollamadas, fotos, datos almacenados y transferencias de archivos
- Operado bajo la Sección 702 de la Ley de Enmiendas FISA
- Programas complementarios (UPSTREAM) se conectaban directamente a cables de fibra óptica submarinos

## Exposición

El contratista de la NSA Edward Snowden filtró documentos clasificados a los periodistas Glenn Greenwald y Laura Poitras en junio de 2013.

## Consecuencias

Consecuencias diplomáticas globales, reformas de encriptación en la industria tecnológica y la aprobación de la Ley USA FREEDOM (2015).`,
    excerpt: "NSA mass surveillance program collecting internet communications from Google, Facebook, Apple, and other tech companies — leaked by Snowden.",
    excerptEs: "Programa de vigilancia masiva de la NSA recopilando comunicaciones de internet de Google, Facebook, Apple y otras empresas tecnológicas — filtrado por Snowden.",
    sources: [
      { url: null, title: "Permanent Record by Edward Snowden", type: SourceType.BOOK, credibility: 5 },
      { url: null, title: "No Place to Hide by Glenn Greenwald", type: SourceType.JOURNALISM, credibility: 5 },
    ],
    tags: [
      { slug: "nsa", name: "NSA", nameEs: "NSA" },
      { slug: "domestic-surveillance", name: "Domestic Surveillance", nameEs: "Vigilancia Nacional" },
      { slug: "digital-privacy", name: "Digital Privacy", nameEs: "Privacidad Digital" },
    ],
  },
  {
    slug: "cia-torture-program",
    slugEs: "programa-de-tortura-cia",
    title: "CIA Enhanced Interrogation Program",
    titleEs: "Programa de Interrogatorio Mejorado de la CIA",
    aliases: ["CIA Torture Program", "RDI Program"],
    icebergLevel: 3,
    era: Era.MODERN,
    types: [OperationType.DECEPTION],
    actors: ["United States", "CIA"],
    targets: ["Terrorism suspects", "Detainees"],
    outcome: Outcome.FAILED,
    status: OperationStatus.DECLASSIFIED,
    bodyEn: `## Overview

The CIA's "enhanced interrogation" program was a systematic regime of torture applied to terrorism suspects detained at CIA black sites around the world following the September 11 attacks.

## Methods

- Waterboarding (simulated drowning)
- Sleep deprivation for up to 180 hours
- Stress positions and "walling" (slamming against walls)
- Confinement in small boxes
- Rectal feeding and hydration
- Use of black sites in Thailand, Poland, Romania, Lithuania, and other countries

## The Deception

The CIA misled Congress, the White House, and the public about the effectiveness of these techniques, claiming they produced unique intelligence. The 2014 Senate Intelligence Committee report concluded the techniques were ineffective and the CIA's claims were false.

## Legacy

The 2014 Senate Torture Report documented the program in detail. No CIA officials were prosecuted for the program.`,
    bodyEs: `## Resumen

El programa de "interrogatorio mejorado" de la CIA fue un regimen sistemático de tortura aplicado a sospechosos de terrorismo detenidos en sitios negros de la CIA alrededor del mundo tras los ataques del 11 de septiembre.

## Metodos

- Submarino (ahogamiento simulado)
- Privación del sueño hasta por 180 horas
- Posiciones de estres y "emparedamiento" (golpes contra paredes)
- Confinamiento en cajas pequeñas
- Alimentación e hidratación rectal
- Uso de sitios negros en Tailandia, Polonia, Rumanía, Lituania y otros países

## El Engaño

La CIA engañó al Congreso, la Casa Blanca y el público sobre la efectividad de estas tecnicas, afirmando que producían inteligencia única. El informe del Comite de Inteligencia del Senado de 2014 concluyó que las tecnicas eran ineficaces y las afirmaciones de la CIA eran falsas.

## Legado

El Informe de Tortura del Senado de 2014 documentó el programa en detalle. Ningún funcionario de la CIA fue procesado por el programa.`,
    excerpt: "CIA's post-9/11 torture program at global black sites — Senate report proved the agency lied about its effectiveness.",
    excerptEs: "Programa de tortura de la CIA post-11S en sitios negros globales — el informe del Senado demostró que la agencia mintió sobre su efectividad.",
    sources: [
      { url: null, title: "Senate Select Committee on Intelligence Study of the CIA's Detention and Interrogation Program", type: SourceType.GOVERNMENT, credibility: 5 },
      { url: null, title: "The Report (film, 2019)", type: SourceType.VIDEO, credibility: 3 },
    ],
    tags: [
      { slug: "cia", name: "CIA", nameEs: "CIA" },
      { slug: "torture", name: "Torture", nameEs: "Tortura" },
      { slug: "war-on-terror", name: "War on Terror", nameEs: "Guerra contra el Terror" },
    ],
  },
  {
    slug: "five-eyes",
    slugEs: "cinco-ojos",
    title: "Five Eyes Alliance",
    titleEs: "Alianza Cinco Ojos",
    aliases: ["FVEY", "UKUSA Agreement"],
    icebergLevel: 3,
    era: Era.COLD_WAR,
    types: [OperationType.SURVEILLANCE],
    actors: ["United States", "United Kingdom", "Canada", "Australia", "New Zealand"],
    targets: ["Global communications"],
    outcome: Outcome.ONGOING,
    status: OperationStatus.LEAKED,
    bodyEn: `## Overview

The Five Eyes is an intelligence alliance comprising Australia, Canada, New Zealand, the United Kingdom, and the United States. These countries are parties to the UKUSA Agreement, a treaty for joint cooperation in signals intelligence.

## How It Works

The Five Eyes framework allows member nations to circumvent domestic surveillance laws by having partner nations conduct surveillance on each other's citizens, then sharing the results. This creates a system where no nation technically violates its own laws.

## Scope

Revealed in detail by the Snowden leaks, the alliance operates programs like ECHELON (global signals interception), TEMPORA (UK fiber optic tapping), and coordinates through the NSA's XKEYSCORE system.

## Expanded Networks

Beyond Five Eyes, expanded alliances exist: Nine Eyes (adds Denmark, France, Netherlands, Norway) and Fourteen Eyes (adds Germany, Belgium, Italy, Spain, Sweden).`,
    bodyEs: `## Resumen

Los Cinco Ojos es una alianza de inteligencia que comprende Australia, Canadá, Nueva Zelanda, el Reino Unido y Estados Unidos. Estos países son partes del Acuerdo UKUSA, un tratado para la cooperación conjunta en inteligencia de señales.

## Cómo Funciona

El marco de los Cinco Ojos permite a las naciones miembro eludir las leyes de vigilancia nacional haciendo que las naciones socias vigilen a los ciudadanos de las demás y luego compartan los resultados.

## Alcance

Revelado en detalle por las filtraciones de Snowden, la alianza opera programas como ECHELON (interceptación global de señales), TEMPORA (intervención de fibra óptica del Reino Unido) y se coordina a traves del sistema XKEYSCORE de la NSA.

## Redes Expandidas

Más allá de los Cinco Ojos, existen alianzas ampliadas: Nueve Ojos (añade Dinamarca, Francia, Países Bajos, Noruega) y Catorce Ojos (añade Alemania, Belgica, Italia, España, Suecia).`,
    excerpt: "Intelligence alliance of 5 nations that circumvents domestic surveillance laws by spying on each other's citizens and sharing results.",
    excerptEs: "Alianza de inteligencia de 5 naciones que elude las leyes de vigilancia nacional espiando a los ciudadanos de las demás y compartiendo resultados.",
    sources: [
      { url: null, title: "The Snowden Files by Luke Harding", type: SourceType.JOURNALISM, credibility: 4 },
      { url: null, title: "@War: The Rise of the Military-Internet Complex by Shane Harris", type: SourceType.BOOK, credibility: 4 },
    ],
    tags: [
      { slug: "nsa", name: "NSA", nameEs: "NSA" },
      { slug: "domestic-surveillance", name: "Domestic Surveillance", nameEs: "Vigilancia Nacional" },
      { slug: "international", name: "International", nameEs: "Internacional" },
    ],
  },

  // ─── Level 4: Alleged ─────────────────────────────
  {
    slug: "narrative-control",
    slugEs: "control-narrativo",
    title: "Narrative Control Programs",
    titleEs: "Programas de Control Narrativo",
    aliases: ["Countering Disinformation", "Strategic Communication"],
    icebergLevel: 4,
    era: Era.DIGITAL_AGE,
    types: [OperationType.PROPAGANDA, OperationType.INFLUENCE_OP, OperationType.DISINFORMATION],
    actors: ["United States", "Department of Defense", "Department of State"],
    targets: ["Social media users", "Domestic and foreign audiences"],
    outcome: Outcome.ONGOING,
    status: OperationStatus.ALLEGED,
    bodyEn: `## Overview

Narrative Control refers to alleged ongoing government programs to shape public discourse online through coordinated information operations, content moderation pressure on tech companies, and government-funded "anti-disinformation" organizations.

## Allegations

- The "Twitter Files" (2022) revealed government agencies flagging content for removal
- The Global Engagement Center at the State Department funded organizations that created blacklists of media outlets
- The Department of Homeland Security's "Disinformation Governance Board" (briefly established in 2022)
- Military contractors developing social media influence tools (Ntrepid's sock puppet software)

## Debate

Proponents argue these programs are necessary to counter foreign disinformation. Critics contend they represent domestic censorship under the guise of security, violating the First Amendment.

## Current Status

Multiple lawsuits and congressional investigations are ongoing regarding the extent of government involvement in content moderation decisions.`,
    bodyEs: `## Resumen

El Control Narrativo se refiere a presuntos programas gubernamentales en curso para moldear el discurso público en línea a traves de operaciones de información coordinadas, presión de moderación de contenido sobre empresas tecnológicas y organizaciones "anti-desinformación" financiadas por el gobierno.

## Alegaciones

- Los "Archivos de Twitter" (2022) revelaron que agencias gubernamentales señalaban contenido para su eliminación
- El Centro de Compromiso Global del Departamento de Estado financió organizaciones que crearon listas negras de medios de comunicación
- La "Junta de Gobernanza de Desinformación" del Departamento de Seguridad Nacional (establecida brevemente en 2022)
- Contratistas militares desarrollando herramientas de influencia en redes sociales

## Debate

Los defensores argumentan que estos programas son necesarios para contrarrestar la desinformación extranjera. Los críticos sostienen que representan censura nacional bajo el pretexto de seguridad.

## Estado Actual

Múltiples demandas e investigaciones del Congreso están en curso.`,
    excerpt: "Alleged government programs shaping online discourse through content moderation pressure, anti-disinfo orgs, and social media influence tools.",
    excerptEs: "Presuntos programas gubernamentales que moldean el discurso en línea a traves de presión de moderación de contenido y herramientas de influencia en redes sociales.",
    sources: [
      { url: null, title: "The Twitter Files (multiple journalists, 2022-2023)", type: SourceType.JOURNALISM, credibility: 3 },
      { url: null, title: "Murthy v. Missouri, Supreme Court Case No. 23-411", type: SourceType.GOVERNMENT, credibility: 4 },
    ],
    tags: [
      { slug: "censorship", name: "Censorship", nameEs: "Censura" },
      { slug: "social-media", name: "Social Media", nameEs: "Redes Sociales" },
      { slug: "first-amendment", name: "First Amendment", nameEs: "Primera Enmienda" },
    ],
  },
  {
    slug: "brain-warfare",
    slugEs: "guerra-cerebral",
    title: "Brain Warfare / Neuro-Weapons",
    titleEs: "Guerra Cerebral / Neuro-Armas",
    aliases: ["Havana Syndrome", "Directed Energy Weapons"],
    icebergLevel: 4,
    era: Era.DIGITAL_AGE,
    types: [OperationType.MIND_CONTROL, OperationType.SURVEILLANCE],
    actors: ["Unknown", "Russia (alleged)", "United States"],
    targets: ["Diplomats", "Intelligence officers"],
    outcome: Outcome.UNKNOWN,
    status: OperationStatus.ALLEGED,
    bodyEn: `## Overview

"Brain warfare" encompasses alleged use of directed energy weapons and neurotechnology against individuals, most prominently manifested as "Havana Syndrome" — mysterious neurological symptoms experienced by U.S. diplomats and intelligence officers starting in 2016.

## Havana Syndrome

Beginning at the U.S. Embassy in Havana, Cuba in 2016, diplomats reported hearing strange sounds followed by headaches, dizziness, cognitive difficulties, and brain injuries. Cases have since been reported worldwide.

## Theories

- Directed microwave radiation weapons (supported by a 2020 National Academy of Sciences report)
- Sonic weapons
- Pesticide exposure (proposed by some researchers)
- Mass psychogenic illness (proposed by some skeptics)

## Current Status

A 2024 investigation by The Insider, 60 Minutes, and Der Spiegel linked some cases to a Russian GRU unit. The U.S. intelligence community remains divided on the cause.`,
    bodyEs: `## Resumen

La "guerra cerebral" abarca el presunto uso de armas de energía dirigida y neurotecnología contra individuos, manifestado más prominentemente como el "Síndrome de La Habana" — síntomas neurológicos misteriosos experimentados por diplomáticos y oficiales de inteligencia de EE.UU. desde 2016.

## Síndrome de La Habana

Comenzando en la Embajada de EE.UU. en La Habana, Cuba en 2016, los diplomáticos reportaron escuchar sonidos extraños seguidos de dolores de cabeza, mareos, dificultades cognitivas y lesiones cerebrales.

## Teorías

- Armas de radiación de microondas dirigidas (apoyado por un informe de la Academia Nacional de Ciencias de 2020)
- Armas sónicas
- Exposición a pesticidas (propuesto por algunos investigadores)
- Enfermedad psicogénica masiva (propuesto por algunos escepticos)

## Estado Actual

Una investigación de 2024 de The Insider, 60 Minutes y Der Spiegel vinculó algunos casos a una unidad del GRU ruso. La comunidad de inteligencia de EE.UU. permanece dividida sobre la causa.`,
    excerpt: "Alleged directed energy attacks causing neurological damage to diplomats — 'Havana Syndrome' linked to possible Russian GRU unit.",
    excerptEs: "Presuntos ataques de energía dirigida causando daño neurológico a diplomáticos — 'Síndrome de La Habana' vinculado a posible unidad del GRU ruso.",
    sources: [
      { url: null, title: "An Assessment of Illness in U.S. Government Employees (National Academy of Sciences, 2020)", type: SourceType.ACADEMIC, credibility: 5 },
      { url: null, title: "The Insider / 60 Minutes / Der Spiegel Joint Investigation (2024)", type: SourceType.JOURNALISM, credibility: 4 },
    ],
    tags: [
      { slug: "directed-energy", name: "Directed Energy", nameEs: "Energía Dirigida" },
      { slug: "russia", name: "Russia", nameEs: "Rusia" },
      { slug: "neuroscience", name: "Neuroscience", nameEs: "Neurociencia" },
    ],
  },
  {
    slug: "operation-earnest-voice",
    slugEs: "operacion-voz-sincera",
    title: "Operation Earnest Voice",
    titleEs: "Operacion Voz Sincera",
    aliases: ["OEV", "Sock Puppet Army"],
    icebergLevel: 4,
    era: Era.DIGITAL_AGE,
    types: [OperationType.PROPAGANDA, OperationType.INFLUENCE_OP],
    actors: ["United States", "U.S. Central Command"],
    targets: ["Foreign social media users"],
    outcome: Outcome.ONGOING,
    status: OperationStatus.ALLEGED,
    bodyEn: `## Overview

Operation Earnest Voice is an astroturfing campaign by the U.S. military, using software to create fake online personas (sock puppets) to influence internet conversations and spread pro-American messaging.

## Known Details

- $2.76 million contract awarded to Ntrepid Corporation in 2011
- Software allows one operator to manage up to 10 separate fake personas
- Each persona has a convincing background, history, and supporting details
- Designed to operate on foreign-language social media platforms

## Legal Framework

CENTCOM stated the program targets only foreign audiences and operates in foreign languages, making it legal under U.S. law (Smith-Mundt Act amendments). Critics argue the foreign/domestic firewall is technically impossible on the global internet.

## Significance

Operation Earnest Voice demonstrates that the same influence techniques attributed to foreign adversaries are also employed by the U.S. government.`,
    bodyEs: `## Resumen

La Operación Voz Sincera es una campaña de astroturfing del ejército de EE.UU., usando software para crear personalidades falsas en línea (marionetas) para influir en conversaciones de internet y difundir mensajes pro-estadounidenses.

## Detalles Conocidos

- Contrato de $2.76 millones otorgado a Ntrepid Corporation en 2011
- El software permite a un operador manejar hasta 10 personalidades falsas separadas
- Cada personalidad tiene un historial convincente y detalles de apoyo
- Diseñado para operar en plataformas de redes sociales en idiomas extranjeros

## Marco Legal

CENTCOM declaró que el programa se dirige solo a audiencias extranjeras y opera en idiomas extranjeros. Los críticos argumentan que la barrera extranjero/nacional es tecnicamente imposible en el internet global.

## Importancia

La Operación Voz Sincera demuestra que las mismas tecnicas de influencia atribuidas a adversarios extranjeros también son empleadas por el gobierno de EE.UU.`,
    excerpt: "U.S. military astroturfing program using software to manage fake online personas for pro-American influence on foreign social media.",
    excerptEs: "Programa de astroturfing del ejército de EE.UU. usando software para manejar personalidades falsas en línea para influencia pro-estadounidense en redes sociales extranjeras.",
    sources: [
      { url: null, title: "Revealed: US spy operation that manipulates social media (The Guardian, 2011)", type: SourceType.JOURNALISM, credibility: 4 },
      { url: null, title: "USCENTCOM Contract for Online Persona Management", type: SourceType.GOVERNMENT, credibility: 4 },
    ],
    tags: [
      { slug: "astroturfing", name: "Astroturfing", nameEs: "Astroturfing" },
      { slug: "social-media", name: "Social Media", nameEs: "Redes Sociales" },
      { slug: "military", name: "Military", nameEs: "Militar" },
    ],
  },
  {
    slug: "pegasus-spyware",
    slugEs: "software-espia-pegasus",
    title: "Pegasus Spyware",
    titleEs: "Software Espía Pegasus",
    aliases: ["NSO Group Spyware"],
    icebergLevel: 4,
    era: Era.DIGITAL_AGE,
    types: [OperationType.SURVEILLANCE],
    actors: ["Israel", "NSO Group", "Multiple governments"],
    targets: ["Journalists", "Activists", "Political opposition", "Heads of state"],
    outcome: Outcome.ONGOING,
    status: OperationStatus.LEAKED,
    bodyEn: `## Overview

Pegasus is a spyware tool developed by Israeli cyber-arms company NSO Group that can be covertly installed on smartphones to read messages, track location, access the camera and microphone, and harvest credentials — all without the target's knowledge.

## Methods

- Zero-click exploits requiring no user interaction
- Exploits in iMessage, WhatsApp, and other common apps
- Can extract messages from encrypted apps (Signal, WhatsApp, Telegram)
- Self-destructs when it detects analysis attempts

## Pegasus Project

In 2021, the Pegasus Project — a consortium of 17 media organizations — revealed a leaked list of 50,000+ phone numbers selected for potential surveillance by NSO Group clients across 45 countries.

## Targets

Confirmed targets include journalists, human rights lawyers, politicians (including French President Macron), and family members of murdered journalist Jamal Khashoggi.

## Consequences

The U.S. Commerce Department blacklisted NSO Group in 2021. Multiple lawsuits are pending, including one from Apple.`,
    bodyEs: `## Resumen

Pegasus es una herramienta de software espía desarrollada por la empresa israelí de ciberarmas NSO Group que puede instalarse secretamente en teléfonos inteligentes para leer mensajes, rastrear ubicación, acceder a la cámara y micrófono, y recopilar credenciales — todo sin el conocimiento del objetivo.

## Metodos

- Exploits de cero clic que no requieren interacción del usuario
- Exploits en iMessage, WhatsApp y otras aplicaciones comunes
- Puede extraer mensajes de aplicaciones encriptadas (Signal, WhatsApp, Telegram)
- Se autodestruye cuando detecta intentos de análisis

## Proyecto Pegasus

En 2021, el Proyecto Pegasus — un consorcio de 17 organizaciones de medios — reveló una lista filtrada de más de 50,000 números de teléfono seleccionados para posible vigilancia por clientes de NSO Group en 45 países.

## Consecuencias

El Departamento de Comercio de EE.UU. incluyó a NSO Group en su lista negra en 2021. Múltiples demandas están pendientes, incluyendo una de Apple.`,
    excerpt: "Israeli-built spyware that can silently infiltrate any smartphone — leaked list revealed 50,000+ targeted phone numbers across 45 countries.",
    excerptEs: "Software espía construido por Israel que puede infiltrar silenciosamente cualquier smartphone — lista filtrada reveló más de 50,000 números de teléfono objetivo en 45 países.",
    sources: [
      { url: null, title: "Pegasus Project (Forbidden Stories consortium, 2021)", type: SourceType.JOURNALISM, credibility: 5 },
      { url: null, title: "Forensic Methodology Report: How to catch NSO Group's Pegasus (Amnesty International)", type: SourceType.ACADEMIC, credibility: 5 },
    ],
    tags: [
      { slug: "spyware", name: "Spyware", nameEs: "Software Espía" },
      { slug: "israel", name: "Israel", nameEs: "Israel" },
      { slug: "digital-privacy", name: "Digital Privacy", nameEs: "Privacidad Digital" },
    ],
  },
  {
    slug: "qanon",
    slugEs: "qanon",
    title: "QAnon",
    titleEs: "QAnon",
    aliases: ["Q", "The Storm", "Where We Go One We Go All"],
    icebergLevel: 4,
    era: Era.DIGITAL_AGE,
    types: [OperationType.INFLUENCE_OP, OperationType.PROPAGANDA, OperationType.DISINFORMATION],
    actors: ["Unknown"],
    targets: ["American public", "Global public"],
    outcome: Outcome.ONGOING,
    status: OperationStatus.ALLEGED,
    bodyEn: `## Overview

QAnon is a decentralized political conspiracy theory and movement that emerged from anonymous posts on 4chan in October 2017 by a user claiming to be a high-level government insider with "Q" security clearance.

## The Psyop Question

Debate exists about whether QAnon represents:
- A grassroots conspiracy movement that grew organically
- A deliberate information operation (by unknown state or non-state actors)
- A combination: organic movement deliberately amplified by foreign actors

## Evidence of Amplification

Research has shown significant amplification of QAnon content by automated accounts and foreign-linked troll networks. Russian, Chinese, and Iranian state media have all promoted QAnon narratives.

## Impact

QAnon has been linked to multiple violent incidents, influenced elections, and was a driving force behind the January 6, 2021 Capitol breach. It has spread globally, with movements in dozens of countries.`,
    bodyEs: `## Resumen

QAnon es una teoría de conspiración política descentralizada y movimiento que surgió de publicaciones anónimas en 4chan en octubre de 2017 por un usuario que afirmaba ser un infiltrado gubernamental de alto nivel con autorización de seguridad "Q."

## La Pregunta Psyop

Existe debate sobre si QAnon representa:
- Un movimiento conspirativo de base que creció orgánicamente
- Una operación de información deliberada (por actores estatales o no estatales desconocidos)
- Una combinación: movimiento orgánico deliberadamente amplificado por actores extranjeros

## Evidencia de Amplificación

La investigación ha mostrado amplificación significativa del contenido QAnon por cuentas automatizadas y redes de trolls vinculadas al extranjero.

## Impacto

QAnon ha sido vinculado a múltiples incidentes violentos, influyó en elecciones y fue una fuerza impulsora detrás de la irrupción en el Capitolio del 6 de enero de 2021. Se ha extendido globalmente, con movimientos en docenas de países.`,
    excerpt: "Decentralized conspiracy movement from 4chan that may be a deliberate psyop — amplified by foreign troll networks, linked to Capitol breach.",
    excerptEs: "Movimiento conspirativo descentralizado de 4chan que podría ser una operación psicológica deliberada — amplificado por redes de trolls extranjeros, vinculado a la irrupción del Capitolio.",
    sources: [
      { url: null, title: "The Genesis of a Conspiracy Theory (The Atlantic, 2020)", type: SourceType.JOURNALISM, credibility: 4 },
      { url: null, title: "QAnon and the Emergence of the Disinformation Megaplex (Journal of Online Trust and Safety)", type: SourceType.ACADEMIC, credibility: 4 },
    ],
    tags: [
      { slug: "conspiracy", name: "Conspiracy Theory", nameEs: "Teoría Conspirativa" },
      { slug: "social-media", name: "Social Media", nameEs: "Redes Sociales" },
      { slug: "disinformation", name: "Disinformation", nameEs: "Desinformación" },
    ],
  },

  // ─── Level 5: Deep Conspiracy ─────────────────────
  {
    slug: "project-blue-beam",
    slugEs: "proyecto-rayo-azul",
    title: "Project Blue Beam",
    titleEs: "Proyecto Rayo Azul",
    aliases: [],
    icebergLevel: 5,
    era: Era.MODERN,
    types: [OperationType.DECEPTION, OperationType.PROPAGANDA],
    actors: ["Unknown", "NASA (alleged)"],
    targets: ["Global population"],
    outcome: Outcome.UNKNOWN,
    status: OperationStatus.ALLEGED,
    bodyEn: `## Overview

Project Blue Beam is a conspiracy theory that alleges NASA and the United Nations plan to implement a New Age religion with a simulated "Second Coming" using advanced holographic technology projected into the sky.

## The Theory

Originally proposed by Canadian journalist Serge Monast in 1994, the theory claims four steps:
1. Engineered earthquakes to reveal archaeological "discoveries" undermining existing religions
2. A "space show" using 3D holographic projections and sound to simulate divine events
3. Telepathic electronic two-way communication (ELF/VLF/LF waves)
4. Universal supernatural manifestations using electronic means

## Evidence Status

**No credible evidence supports this theory.** It is included in this database as an example of how psyop theories evolve and circulate, and to provide context for analyzing information reliability.

## Why It Matters for Study

Project Blue Beam demonstrates how conspiracy theories borrow real technological concepts (holographic projection, ELF waves) and extrapolate them into unfounded scenarios. Understanding this pattern is essential for information literacy.`,
    bodyEs: `## Resumen

El Proyecto Rayo Azul es una teoría conspirativa que alega que la NASA y las Naciones Unidas planean implementar una religión de la Nueva Era con una "Segunda Venida" simulada usando tecnología holográfica avanzada proyectada en el cielo.

## La Teoría

Propuesta originalmente por el periodista canadiense Serge Monast en 1994, la teoría afirma cuatro pasos:
1. Terremotos diseñados para revelar "descubrimientos" arqueológicos que socavan las religiones existentes
2. Un "espectáculo espacial" usando proyecciones holográficas 3D y sonido para simular eventos divinos
3. Comunicación electrónica telepática bidireccional (ondas ELF/VLF/LF)
4. Manifestaciones sobrenaturales universales usando medios electrónicos

## Estado de la Evidencia

**Ninguna evidencia creíble apoya esta teoría.** Se incluye en esta base de datos como ejemplo de cómo las teorías de operaciones psicológicas evolucionan y circulan.

## Por Que Importa para el Estudio

El Proyecto Rayo Azul demuestra cómo las teorías conspirativas toman conceptos tecnológicos reales y los extrapolan en escenarios infundados. Comprender este patrón es esencial para la alfabetización informativa.`,
    excerpt: "Conspiracy theory alleging NASA plans to simulate a 'Second Coming' via holograms — no credible evidence, but studied for information literacy.",
    excerptEs: "Teoría conspirativa que alega que la NASA planea simular una 'Segunda Venida' via hologramas — sin evidencia creíble, pero estudiada para alfabetización informativa.",
    sources: [
      { url: null, title: "Conspiracies and Conspiracy Theories in the Age of Trump (Palgrave Macmillan)", type: SourceType.ACADEMIC, credibility: 3 },
      { url: null, title: "Project Blue Beam original document by Serge Monast (1994)", type: SourceType.WEBSITE, credibility: 1 },
    ],
    tags: [
      { slug: "conspiracy", name: "Conspiracy Theory", nameEs: "Teoría Conspirativa" },
      { slug: "holographic", name: "Holographic Technology", nameEs: "Tecnología Holográfica" },
      { slug: "unverified", name: "Unverified", nameEs: "No Verificado" },
    ],
  },
  {
    slug: "silent-weapons-quiet-wars",
    slugEs: "armas-silenciosas-guerras-tranquilas",
    title: "Silent Weapons for Quiet Wars",
    titleEs: "Armas Silenciosas para Guerras Tranquilas",
    aliases: ["SWQW"],
    icebergLevel: 5,
    era: Era.COLD_WAR,
    types: [OperationType.MIND_CONTROL, OperationType.INFLUENCE_OP],
    actors: ["Unknown"],
    targets: ["Global population"],
    outcome: Outcome.UNKNOWN,
    status: OperationStatus.ALLEGED,
    bodyEn: `## Overview

"Silent Weapons for Quiet Wars" is a document, allegedly dated 1979, that describes a plan for social engineering and economic control of the population using advanced economic modeling and information warfare.

## The Document

Found allegedly in 1986 inside a surplus IBM copier, the document describes:
- Economic modeling as a weapon system
- Energy (money) as the medium of control
- Social engineering through media manipulation
- Keeping the public distracted and uneducated

## Evidence Status

**The document is almost certainly a hoax or work of political fiction.** No authenticated provenance exists. Linguistic analysis suggests it was written by a single author with libertarian political views, not a government committee.

## Why It Matters for Study

The document is a prime example of "leaked document" mythology in conspiracy culture. Its influence on subsequent conspiracy theories demonstrates how fabricated documents can shape real political movements.`,
    bodyEs: `## Resumen

"Armas Silenciosas para Guerras Tranquilas" es un documento, supuestamente fechado en 1979, que describe un plan de ingeniería social y control económico de la población usando modelado económico avanzado y guerra informativa.

## El Documento

Encontrado supuestamente en 1986 dentro de una copiadora IBM de excedente, el documento describe:
- Modelado económico como sistema de armas
- Energía (dinero) como medio de control
- Ingeniería social a traves de manipulación mediática
- Mantener al público distraído y sin educación

## Estado de la Evidencia

**El documento es casi con certeza un engaño o una obra de ficción política.** No existe procedencia autenticada. El análisis lingüístico sugiere que fue escrito por un solo autor con opiniones políticas libertarias, no por un comite gubernamental.

## Por Que Importa para el Estudio

El documento es un ejemplo principal de mitología de "documentos filtrados" en la cultura conspirativa.`,
    excerpt: "Alleged 1979 document describing social engineering via economics — almost certainly a hoax, but influential in conspiracy culture.",
    excerptEs: "Presunto documento de 1979 describiendo ingeniería social via economía — casi con certeza un engaño, pero influyente en la cultura conspirativa.",
    sources: [
      { url: null, title: "Conspiracy Theories in American History: An Encyclopedia (ABC-CLIO)", type: SourceType.ACADEMIC, credibility: 4 },
      { url: null, title: "Silent Weapons for Quiet Wars (original document, unverified)", type: SourceType.WEBSITE, credibility: 1 },
    ],
    tags: [
      { slug: "conspiracy", name: "Conspiracy Theory", nameEs: "Teoría Conspirativa" },
      { slug: "economic-control", name: "Economic Control", nameEs: "Control Económico" },
      { slug: "unverified", name: "Unverified", nameEs: "No Verificado" },
    ],
  },
  {
    slug: "monarch-programming",
    slugEs: "programacion-monarca",
    title: "Monarch Programming",
    titleEs: "Programacion Monarca",
    aliases: ["Project Monarch"],
    icebergLevel: 5,
    era: Era.COLD_WAR,
    types: [OperationType.MIND_CONTROL],
    actors: ["Unknown", "CIA (alleged)"],
    targets: ["Individuals"],
    outcome: Outcome.UNKNOWN,
    status: OperationStatus.ALLEGED,
    bodyEn: `## Overview

Monarch Programming is an alleged mind control technique that conspiracy theorists claim is a continuation of MKUltra, involving trauma-based programming to create dissociative identity states in victims.

## The Claims

- Use of systematic trauma to create "alters" (alternate personalities)
- Butterfly symbolism as programming trigger
- Entertainment industry as delivery mechanism
- Multi-generational programming of families

## Evidence Status

**There is no credible evidence that Monarch Programming exists as described.** No government documents, whistleblowers, or scientific evidence support these claims. It appears to be a conflation of real MKUltra history with unsubstantiated claims.

## Why It Matters for Study

Monarch Programming theory illustrates how confirmed operations (MKUltra) can serve as a kernel of truth that gets extrapolated into unfounded theories. The "seed of truth" pattern is one of the most common mechanisms for conspiracy theory propagation.`,
    bodyEs: `## Resumen

La Programación Monarca es una presunta tecnica de control mental que los teóricos de la conspiración afirman es una continuación de MKUltra, involucrando programación basada en trauma para crear estados de identidad disociativa en las víctimas.

## Las Afirmaciones

- Uso de trauma sistemático para crear "alters" (personalidades alternativas)
- Simbolismo de mariposa como disparador de programación
- Industria del entretenimiento como mecanismo de entrega
- Programación multigeneracional de familias

## Estado de la Evidencia

**No hay evidencia creíble de que la Programación Monarca exista como se describe.** Ningún documento gubernamental, denunciante o evidencia científica apoya estas afirmaciones.

## Por Que Importa para el Estudio

La teoría de la Programación Monarca ilustra cómo operaciones confirmadas (MKUltra) pueden servir como un núcleo de verdad que se extrapola en teorías infundadas.`,
    excerpt: "Alleged MKUltra continuation using trauma-based mind control — no credible evidence exists, but illustrates 'seed of truth' conspiracy patterns.",
    excerptEs: "Presunta continuación de MKUltra usando control mental basado en trauma — no existe evidencia creíble, pero ilustra patrones conspirativas de 'semilla de verdad'.",
    sources: [
      { url: null, title: "Conspiracy Culture: From Kennedy to The X-Files by Peter Knight", type: SourceType.ACADEMIC, credibility: 3 },
      { url: null, title: "The CIA Doctors by Colin A. Ross", type: SourceType.BOOK, credibility: 2 },
    ],
    tags: [
      { slug: "conspiracy", name: "Conspiracy Theory", nameEs: "Teoría Conspirativa" },
      { slug: "mind-control", name: "Mind Control", nameEs: "Control Mental" },
      { slug: "unverified", name: "Unverified", nameEs: "No Verificado" },
    ],
  },
  {
    slug: "chemtrail-theory",
    slugEs: "teoria-chemtrails",
    title: "Chemtrail Theory",
    titleEs: "Teoria de los Chemtrails",
    aliases: ["Chemical Trails", "Stratospheric Aerosol Injection Conspiracy"],
    icebergLevel: 5,
    era: Era.MODERN,
    types: [OperationType.DECEPTION],
    actors: ["Unknown"],
    targets: ["Global population"],
    outcome: Outcome.UNKNOWN,
    status: OperationStatus.ALLEGED,
    bodyEn: `## Overview

The chemtrail theory alleges that the condensation trails (contrails) left by aircraft are actually chemical or biological agents deliberately sprayed for purposes ranging from population control to weather modification.

## The Claims

- Aircraft release harmful chemicals into the atmosphere
- Purposes range from mind control to population reduction to weather manipulation
- Government agencies coordinate the spraying globally

## Evidence Status

**This theory has been thoroughly debunked by atmospheric scientists.** Contrails are well-understood condensation phenomena. A 2016 study surveying 77 atmospheric scientists found zero who supported the chemtrail hypothesis.

## The Interesting Kernel

While chemtrails as described are fiction, real programs DO exist:
- Cloud seeding is routinely used for weather modification
- The U.S. government DID spray chemicals on cities during Operation LAC (1957-58)
- Stratospheric aerosol injection IS being researched as a geoengineering approach

## Why It Matters for Study

Chemtrail theory demonstrates how real but limited programs can be extrapolated into global conspiracy narratives. The existence of Operation LAC provides conspiracy theorists with a factual anchor that makes the broader claims seem more plausible.`,
    bodyEs: `## Resumen

La teoría de los chemtrails alega que las estelas de condensación (contrails) dejadas por los aviones son en realidad agentes químicos o biológicos rociados deliberadamente para propósitos que van desde el control de la población hasta la modificación del clima.

## Las Afirmaciones

- Las aeronaves liberan químicos dañinos en la atmósfera
- Los propósitos van desde el control mental hasta la reducción de la población y la manipulación del clima
- Agencias gubernamentales coordinan la fumigación globalmente

## Estado de la Evidencia

**Esta teoría ha sido completamente desmentida por científicos atmosfericos.** Las estelas de condensación son fenómenos bien comprendidos.

## El Núcleo Interesante

Aunque los chemtrails como se describen son ficción, programas reales SÍ existen:
- La siembra de nubes se usa rutinariamente para la modificación del clima
- El gobierno de EE.UU. SÍ roció químicos en ciudades durante la Operación LAC (1957-58)
- La inyección de aerosoles estratosfericos SÍ se investiga como enfoque de geoingeniería

## Por Que Importa para el Estudio

La teoría de los chemtrails demuestra cómo programas reales pero limitados pueden extrapolarse en narrativas conspirativas globales.`,
    excerpt: "Debunked theory that aircraft contrails are chemical spraying — but real programs like Operation LAC provide factual anchors for the conspiracy.",
    excerptEs: "Teoría desmentida de que las estelas de aviones son fumigación química — pero programas reales como la Operación LAC proporcionan anclas factuales para la conspiración.",
    sources: [
      { url: null, title: "Quantifying expert consensus against the existence of a secret large-scale atmospheric spraying program (Environmental Research Letters, 2016)", type: SourceType.ACADEMIC, credibility: 5 },
      { url: null, title: "Operation LAC declassified documents (U.S. Army Chemical Corps)", type: SourceType.GOVERNMENT, credibility: 5 },
    ],
    tags: [
      { slug: "conspiracy", name: "Conspiracy Theory", nameEs: "Teoría Conspirativa" },
      { slug: "weather", name: "Weather Modification", nameEs: "Modificación del Clima" },
      { slug: "unverified", name: "Unverified", nameEs: "No Verificado" },
    ],
  },
  {
    slug: "constant-informational-struggle",
    slugEs: "lucha-informativa-constante",
    title: "Constant Informational Struggle",
    titleEs: "Lucha Informativa Constante",
    aliases: ["Information Confrontation", "Informatsionnoye Protivoborstvo"],
    icebergLevel: 5,
    era: Era.DIGITAL_AGE,
    types: [OperationType.PROPAGANDA, OperationType.INFLUENCE_OP, OperationType.DISINFORMATION],
    actors: ["Russia", "GRU", "FSB", "SVR"],
    targets: ["Western democracies", "NATO countries"],
    outcome: Outcome.ONGOING,
    status: OperationStatus.ALLEGED,
    bodyEn: `## Overview

"Constant Informational Struggle" refers to Russia's alleged doctrine of permanent, low-level information warfare against Western democracies — not as a series of discrete operations, but as a continuous state of conflict below the threshold of conventional war.

## The Doctrine

Russian military doctrine describes "information confrontation" (informatsionnoye protivoborstvo) as an ongoing activity that does not require a declaration of war. The Gerasimov Doctrine (2013) formalized the concept of non-linear warfare where information operations are primary.

## Alleged Components

- Continuous social media manipulation across all Western platforms
- Funding of extremist groups on both political flanks in target countries
- Hacking and strategic leaking of documents (DNC, Macron campaign)
- Cultivation of political assets and influence networks
- RT and Sputnik as state media platforms for narrative placement

## Why Level 5

This is placed at Level 5 not because the individual components are unproven (many are well-documented), but because the theory that these constitute a unified, permanent doctrine of civilizational conflict remains debated among intelligence analysts.`,
    bodyEs: `## Resumen

La "Lucha Informativa Constante" se refiere a la presunta doctrina de Rusia de guerra informativa permanente y de bajo nivel contra las democracias occidentales — no como una serie de operaciones discretas, sino como un estado continuo de conflicto por debajo del umbral de la guerra convencional.

## La Doctrina

La doctrina militar rusa describe la "confrontación informativa" (informatsionnoye protivoborstvo) como una actividad continua que no requiere declaración de guerra. La Doctrina Gerasimov (2013) formalizó el concepto de guerra no lineal donde las operaciones de información son primarias.

## Componentes Alegados

- Manipulación continua de redes sociales en todas las plataformas occidentales
- Financiamiento de grupos extremistas en ambos flancos políticos en países objetivo
- Hackeo y filtración estrategica de documentos
- Cultivo de activos políticos y redes de influencia
- RT y Sputnik como plataformas de medios estatales para colocación de narrativas

## Por Que Nivel 5

Se coloca en el Nivel 5 no porque los componentes individuales no estén probados (muchos están bien documentados), sino porque la teoría de que estos constituyen una doctrina unificada y permanente de conflicto civilizatorio sigue siendo debatida entre analistas de inteligencia.`,
    excerpt: "Russia's alleged doctrine of permanent information warfare against Western democracies — individual ops are proven, unified doctrine is debated.",
    excerptEs: "Presunta doctrina de Rusia de guerra informativa permanente contra democracias occidentales — operaciones individuales están probadas, la doctrina unificada es debatida.",
    sources: [
      { url: null, title: "The Gerasimov Doctrine by Valery Gerasimov (Military-Industrial Kurier, 2013)", type: SourceType.GOVERNMENT, credibility: 4 },
      { url: null, title: "Active Measures: The Secret History of Disinformation by Thomas Rid", type: SourceType.BOOK, credibility: 5 },
    ],
    tags: [
      { slug: "russia", name: "Russia", nameEs: "Rusia" },
      { slug: "information-warfare", name: "Information Warfare", nameEs: "Guerra Informativa" },
      { slug: "hybrid-warfare", name: "Hybrid Warfare", nameEs: "Guerra Híbrida" },
    ],
  },
];

async function main() {
  console.log("Seeding database...");

  // Upsert all tags first, collecting them for linking
  const tagMap = new Map<string, string>(); // slug -> id

  for (const op of operations) {
    for (const tag of op.tags) {
      if (!tagMap.has(tag.slug)) {
        const created = await prisma.tag.upsert({
          where: { slug: tag.slug },
          update: { name: tag.name, nameEs: tag.nameEs },
          create: { slug: tag.slug, name: tag.name, nameEs: tag.nameEs },
        });
        tagMap.set(tag.slug, created.id);
      }
    }
  }

  console.log(`Created ${tagMap.size} tags`);

  // Create operations with sources and tag connections
  for (const op of operations) {
    const tagIds = op.tags.map((t) => tagMap.get(t.slug)!).filter(Boolean);

    await prisma.operation.upsert({
      where: { slug: op.slug },
      update: {
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
        bodyEn: op.bodyEn,
        bodyEs: op.bodyEs,
        excerpt: op.excerpt,
        excerptEs: op.excerptEs,
        tags: { set: tagIds.map((id) => ({ id })) },
      },
      create: {
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
        bodyEn: op.bodyEn,
        bodyEs: op.bodyEs,
        excerpt: op.excerpt,
        excerptEs: op.excerptEs,
        tags: { connect: tagIds.map((id) => ({ id })) },
        sources: {
          create: op.sources.map((s) => ({
            url: s.url,
            title: s.title,
            type: s.type,
            credibility: s.credibility,
          })),
        },
      },
    });

    console.log(`  Seeded: ${op.title} (Level ${op.icebergLevel})`);
  }

  // Create some related operation links
  const cointelpro = await prisma.operation.findUnique({ where: { slug: "cointelpro" } });
  const mkultra = await prisma.operation.findUnique({ where: { slug: "mkultra" } });
  const artichoke = await prisma.operation.findUnique({ where: { slug: "project-artichoke" } });
  const mockingbird = await prisma.operation.findUnique({ where: { slug: "operation-mockingbird" } });
  const cambridge = await prisma.operation.findUnique({ where: { slug: "cambridge-analytica" } });
  const ira = await prisma.operation.findUnique({ where: { slug: "internet-research-agency" } });

  if (mkultra && artichoke) {
    await prisma.operation.update({
      where: { id: mkultra.id },
      data: { relatedOps: { connect: [{ id: artichoke.id }] } },
    });
  }
  if (cointelpro && mockingbird) {
    await prisma.operation.update({
      where: { id: cointelpro.id },
      data: { relatedOps: { connect: [{ id: mockingbird.id }] } },
    });
  }
  if (cambridge && ira) {
    await prisma.operation.update({
      where: { id: cambridge.id },
      data: { relatedOps: { connect: [{ id: ira.id }] } },
    });
  }

  console.log("\nSeed complete!");
  console.log(`  Operations: ${operations.length}`);
  console.log(`  Tags: ${tagMap.size}`);
  console.log(`  Sources: ${operations.reduce((sum, op) => sum + op.sources.length, 0)}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
```

- [ ] **Step 3: Run the seed**

```bash
cd /home/ken/Desktop/html/psyopedia
npx prisma db seed
```

Expected: Output showing all 25 operations seeded with tags and sources.

- [ ] **Step 4: Verify seed data**

```bash
cd /home/ken/Desktop/html/psyopedia
npx prisma studio
```

Check: Operations table has 25 rows, Tags table populated, Sources linked.

- [ ] **Step 5: Commit**

```bash
git add prisma/seed.ts package.json
git commit -m "feat: add seed data with 25 operations across 5 iceberg levels"
```

---

### Task 6: next-intl Setup

**Files:**
- Create: `src/i18n/routing.ts`
- Create: `src/i18n/request.ts`
- Create: `src/middleware.ts`
- Create: `messages/en.json`
- Create: `messages/es.json`
- Modify: `next.config.ts`

- [ ] **Step 1: Create the routing configuration**

Write `src/i18n/routing.ts`:

```typescript
import { defineRouting } from "next-intl/routing";

export const routing = defineRouting({
  locales: ["en", "es"],
  defaultLocale: "en",
});
```

- [ ] **Step 2: Create the request configuration**

Write `src/i18n/request.ts`:

```typescript
import { getRequestConfig } from "next-intl/server";
import { routing } from "./routing";

export default getRequestConfig(async ({ requestLocale }) => {
  let locale = await requestLocale;

  // Ensure valid locale
  if (!locale || !routing.locales.includes(locale as "en" | "es")) {
    locale = routing.defaultLocale;
  }

  return {
    locale,
    messages: (await import(`../../messages/${locale}.json`)).default,
  };
});
```

- [ ] **Step 3: Create the middleware**

Write `src/middleware.ts`:

```typescript
import createMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";

export default createMiddleware(routing);

export const config = {
  matcher: ["/((?!api|_next|_vercel|.*\\..*).*)"],
};
```

- [ ] **Step 4: Update next.config.ts**

Replace `next.config.ts`:

```typescript
import createNextIntlPlugin from "next-intl/plugin";
import type { NextConfig } from "next";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

const nextConfig: NextConfig = {};

export default withNextIntl(nextConfig);
```

- [ ] **Step 5: Create English messages**

Write `messages/en.json`:

```json
{
  "nav": {
    "home": "Home",
    "catalog": "Catalog",
    "iceberg": "The Iceberg",
    "contribute": "Contribute",
    "admin": "Admin",
    "signIn": "Sign In",
    "signOut": "Sign Out"
  },
  "home": {
    "title": "PsyOps Encyclopedia",
    "subtitle": "A comprehensive, bilingual database of psychological operations throughout history",
    "exploreCatalog": "Explore the Catalog",
    "viewIceberg": "View the Iceberg",
    "stats": {
      "operations": "Operations Documented",
      "eras": "Historical Eras",
      "sources": "Verified Sources",
      "contributors": "Contributors"
    },
    "featured": "Featured Operations",
    "recentlyAdded": "Recently Added"
  },
  "catalog": {
    "title": "Operations Catalog",
    "search": "Search operations...",
    "filters": {
      "icebergLevel": "Iceberg Level",
      "era": "Era",
      "type": "Type",
      "country": "Country",
      "outcome": "Outcome",
      "status": "Status",
      "clearAll": "Clear All Filters"
    },
    "sort": {
      "label": "Sort by",
      "newest": "Newest First",
      "oldest": "Oldest First",
      "mostViewed": "Most Viewed",
      "icebergLevel": "Iceberg Level",
      "title": "Title A-Z"
    },
    "noResults": "No operations found matching your filters.",
    "resultsCount": "{count} operations found"
  },
  "operation": {
    "sources": "Sources",
    "relatedOps": "Related Operations",
    "comments": "Comments",
    "suggestEdit": "Suggest an Edit",
    "share": "Share",
    "icebergLevel": "Iceberg Level {level}",
    "viewCount": "{count} views",
    "tags": "Tags"
  },
  "iceberg": {
    "title": "The Psyop Iceberg",
    "subtitle": "From well-known to deep conspiracy — explore five levels of psychological operations",
    "levels": {
      "1": "Well-Known & Declassified",
      "2": "Known but Underappreciated",
      "3": "Leaked / Partially Verified",
      "4": "Alleged",
      "5": "Deep Conspiracy"
    },
    "clickToExplore": "Click a level to explore"
  },
  "contribute": {
    "title": "Contribute",
    "subtitle": "Help expand the database by submitting new operations or corrections",
    "newOperation": "Submit New Operation",
    "editOperation": "Suggest an Edit",
    "addSource": "Add a Source",
    "thankYou": "Thank you! Your submission is under review.",
    "loginRequired": "Please sign in to contribute"
  },
  "admin": {
    "dashboard": "Dashboard",
    "queue": "Moderation Queue",
    "operations": "All Operations",
    "pendingCount": "{count} pending",
    "approve": "Approve",
    "reject": "Reject"
  },
  "enums": {
    "era": {
      "WWII": "World War II",
      "COLD_WAR": "Cold War",
      "MODERN": "Modern Era",
      "DIGITAL_AGE": "Digital Age"
    },
    "type": {
      "ASSASSINATION": "Assassination",
      "PROPAGANDA": "Propaganda",
      "DECEPTION": "Deception",
      "INFLUENCE_OP": "Influence Operation",
      "FALSE_FLAG": "False Flag",
      "INFILTRATION": "Infiltration",
      "MIND_CONTROL": "Mind Control",
      "SURVEILLANCE": "Surveillance",
      "DISINFORMATION": "Disinformation"
    },
    "outcome": {
      "SUCCESSFUL": "Successful",
      "FAILED": "Failed",
      "PARTIAL": "Partial",
      "ONGOING": "Ongoing",
      "UNKNOWN": "Unknown"
    },
    "status": {
      "DECLASSIFIED": "Declassified",
      "LEAKED": "Leaked",
      "ALLEGED": "Alleged"
    }
  },
  "seo": {
    "siteName": "Psyopedia",
    "siteDescription": "A comprehensive bilingual encyclopedia of psychological operations throughout history"
  }
}
```

- [ ] **Step 6: Create Spanish messages**

Write `messages/es.json`:

```json
{
  "nav": {
    "home": "Inicio",
    "catalog": "Catálogo",
    "iceberg": "El Iceberg",
    "contribute": "Contribuir",
    "admin": "Admin",
    "signIn": "Iniciar Sesión",
    "signOut": "Cerrar Sesión"
  },
  "home": {
    "title": "Enciclopedia de Operaciones Psicológicas",
    "subtitle": "Una base de datos bilingüe y completa de operaciones psicológicas a lo largo de la historia",
    "exploreCatalog": "Explorar el Catálogo",
    "viewIceberg": "Ver el Iceberg",
    "stats": {
      "operations": "Operaciones Documentadas",
      "eras": "Eras Históricas",
      "sources": "Fuentes Verificadas",
      "contributors": "Contribuidores"
    },
    "featured": "Operaciones Destacadas",
    "recentlyAdded": "Añadidas Recientemente"
  },
  "catalog": {
    "title": "Catálogo de Operaciones",
    "search": "Buscar operaciones...",
    "filters": {
      "icebergLevel": "Nivel del Iceberg",
      "era": "Era",
      "type": "Tipo",
      "country": "País",
      "outcome": "Resultado",
      "status": "Estado",
      "clearAll": "Limpiar Todos los Filtros"
    },
    "sort": {
      "label": "Ordenar por",
      "newest": "Más Recientes",
      "oldest": "Más Antiguos",
      "mostViewed": "Más Vistos",
      "icebergLevel": "Nivel del Iceberg",
      "title": "Título A-Z"
    },
    "noResults": "No se encontraron operaciones que coincidan con tus filtros.",
    "resultsCount": "{count} operaciones encontradas"
  },
  "operation": {
    "sources": "Fuentes",
    "relatedOps": "Operaciones Relacionadas",
    "comments": "Comentarios",
    "suggestEdit": "Sugerir una Edición",
    "share": "Compartir",
    "icebergLevel": "Nivel del Iceberg {level}",
    "viewCount": "{count} vistas",
    "tags": "Etiquetas"
  },
  "iceberg": {
    "title": "El Iceberg de las Operaciones Psicológicas",
    "subtitle": "De lo conocido a la conspiración profunda — explora cinco niveles de operaciones psicológicas",
    "levels": {
      "1": "Conocidas y Desclasificadas",
      "2": "Conocidas pero Subestimadas",
      "3": "Filtradas / Parcialmente Verificadas",
      "4": "Alegadas",
      "5": "Conspiración Profunda"
    },
    "clickToExplore": "Haz clic en un nivel para explorar"
  },
  "contribute": {
    "title": "Contribuir",
    "subtitle": "Ayuda a expandir la base de datos enviando nuevas operaciones o correcciones",
    "newOperation": "Enviar Nueva Operación",
    "editOperation": "Sugerir una Edición",
    "addSource": "Añadir una Fuente",
    "thankYou": "¡Gracias! Tu envío está en revisión.",
    "loginRequired": "Por favor inicia sesión para contribuir"
  },
  "admin": {
    "dashboard": "Panel de Control",
    "queue": "Cola de Moderación",
    "operations": "Todas las Operaciones",
    "pendingCount": "{count} pendientes",
    "approve": "Aprobar",
    "reject": "Rechazar"
  },
  "enums": {
    "era": {
      "WWII": "Segunda Guerra Mundial",
      "COLD_WAR": "Guerra Fría",
      "MODERN": "Era Moderna",
      "DIGITAL_AGE": "Era Digital"
    },
    "type": {
      "ASSASSINATION": "Asesinato",
      "PROPAGANDA": "Propaganda",
      "DECEPTION": "Engaño",
      "INFLUENCE_OP": "Operación de Influencia",
      "FALSE_FLAG": "Falsa Bandera",
      "INFILTRATION": "Infiltración",
      "MIND_CONTROL": "Control Mental",
      "SURVEILLANCE": "Vigilancia",
      "DISINFORMATION": "Desinformación"
    },
    "outcome": {
      "SUCCESSFUL": "Exitosa",
      "FAILED": "Fallida",
      "PARTIAL": "Parcial",
      "ONGOING": "En Curso",
      "UNKNOWN": "Desconocido"
    },
    "status": {
      "DECLASSIFIED": "Desclasificada",
      "LEAKED": "Filtrada",
      "ALLEGED": "Alegada"
    }
  },
  "seo": {
    "siteName": "Psyopedia",
    "siteDescription": "Una enciclopedia bilingüe completa de operaciones psicológicas a lo largo de la historia"
  }
}
```

- [ ] **Step 7: Commit**

```bash
git add src/i18n/ src/middleware.ts messages/ next.config.ts
git commit -m "feat: configure next-intl with EN/ES locale routing and message files"
```

---

### Task 7: App Layout with Locale Support

**Files:**
- Create: `src/app/[locale]/layout.tsx`
- Create: `src/app/[locale]/page.tsx`
- Modify: `src/app/layout.tsx`

- [ ] **Step 1: Update the root layout**

Replace `src/app/layout.tsx`:

```typescript
import type { ReactNode } from "react";

export default function RootLayout({ children }: { children: ReactNode }) {
  return children;
}
```

Note: The root layout becomes a pass-through. The locale layout handles `<html>` and `<body>`.

- [ ] **Step 2: Create the locale layout**

Write `src/app/[locale]/layout.tsx`:

```typescript
import type { ReactNode } from "react";
import type { Metadata } from "next";
import { NextIntlClientProvider } from "next-intl";
import { getMessages } from "next-intl/server";
import { notFound } from "next/navigation";
import { routing } from "@/i18n/routing";
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
          {children}
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
```

- [ ] **Step 3: Create the homepage placeholder**

Write `src/app/[locale]/page.tsx`:

```typescript
import { useTranslations } from "next-intl";

export default function HomePage() {
  const t = useTranslations("home");

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <h1 className="text-4xl font-bold">{t("title")}</h1>
      <p className="mt-4 text-xl text-muted-foreground">{t("subtitle")}</p>
    </main>
  );
}
```

- [ ] **Step 4: Verify the app builds and runs**

```bash
cd /home/ken/Desktop/html/psyopedia
npm run build
```

Expected: Build completes with no errors. Pages `/en` and `/es` are generated.

- [ ] **Step 5: Verify locale routing works**

```bash
cd /home/ken/Desktop/html/psyopedia
npm run dev
```

Visit `http://localhost:3000` → should redirect to `/en`.
Visit `http://localhost:3000/en` → English homepage.
Visit `http://localhost:3000/es` → Spanish homepage.

- [ ] **Step 6: Commit**

```bash
git add src/app/
git commit -m "feat: add locale-aware layout with next-intl provider and homepage placeholder"
```

---

### Task 8: Final Verification

- [ ] **Step 1: Clean build**

```bash
cd /home/ken/Desktop/html/psyopedia
rm -rf .next
npm run build
```

Expected: Build completes with zero errors.

- [ ] **Step 2: Verify database**

```bash
cd /home/ken/Desktop/html/psyopedia
npx prisma migrate status
```

Expected: All migrations applied.

- [ ] **Step 3: Verify seed data**

```bash
cd /home/ken/Desktop/html/psyopedia
npx prisma db seed
```

Expected: All 25 operations seeded (idempotent due to upserts).

- [ ] **Step 4: Run dev server and test**

```bash
npm run dev
```

Verify:
- `http://localhost:3000` redirects to `/en`
- `/en` shows English title "PsyOps Encyclopedia"
- `/es` shows Spanish title "Enciclopedia de Operaciones Psicológicas"

- [ ] **Step 5: Final commit if any fixes needed**

```bash
git add -A
git commit -m "chore: phase 1 foundation complete"
```

---

## Phase 1 Complete

After completing all tasks, the project should have:
- Next.js 14 with TypeScript, Tailwind, ESLint
- shadcn/ui initialized
- Prisma schema with all 10 models and 8 enums
- PostgreSQL database with migrations applied
- 25 seed operations across 5 iceberg levels with sources and tags
- next-intl configured with EN/ES locale routing
- Complete i18n message files for all UI strings
- Working homepage in both languages
- Zod environment validation
- Clean git history with semantic commits

**Next:** Create Phase 2 plan (Core Pages: Homepage, Catalog, Operation Detail).
