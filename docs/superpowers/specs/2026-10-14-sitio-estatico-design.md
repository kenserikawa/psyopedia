# Psyopedia estática — sin base de datos ni usuarios

**Fecha:** 2026-10-14
**Rama:** `feat/sitio-estatico`
**Rutas afectadas:** todas. Se eliminan `/api/*`, `/[locale]/admin/*` y `/[locale]/contribute`.
**Objetivo:** Convertir Psyopedia en un sitio exportado a HTML puro (`output: "export"`),
servido desde GitHub Pages, cuyo contenido sale de ficheros versionados en el repo. Sin
Postgres, sin Prisma, sin NextAuth y sin ninguna funcionalidad de usuario.

---

## 1. Resumen de decisiones (tomadas en brainstorming)

| Decisión | Elección |
|----------|----------|
| Usuarios | **Fuera por completo:** login, comentarios, contribuciones, moderación y panel de administración. |
| Tipo de build | **`output: "export"`.** El build falla si algo dinámico se cuela, así que el compilador garantiza la promesa de "estático". |
| Fuente de datos | **Una carpeta por operación:** `meta.json` + `body.en.md` + `body.es.md`, y un `tags.json` compartido. |
| Lectura del contenido | **Loader propio en build** (`src/lib/content/`), validado con Zod, con la misma API que el antiguo `queries.ts`. |
| Hosting | **GitHub Pages**, desplegado con GitHub Actions. |
| URL pública | **Configurable al compilar** con una sola variable, `NEXT_PUBLIC_SITE_URL`; el `basePath` sale de su ruta. Hoy `kenserikawa.github.io/psyopedia`; mañana un dominio propio sin tocar código. |
| Relacionadas | **Relación en los dos sentidos:** se declara una vez y aparece en ambas fichas. |
| Analítica | **Ninguna** de momento. Se elimina `@vercel/analytics`. |

### Lo que se pierde a sabiendas

- **Contador de visitas** y el orden "más vistas" en catálogo e iceberg.
- **Cabeceras HTTP propias:** GitHub Pages no las permite. Se pierden `X-Frame-Options`,
  `X-Content-Type-Options` y `Permissions-Policy`. En un sitio de solo lectura, sin sesiones
  ni formularios, el riesgo es bajo. `github.io` ya fuerza HTTPS.
- **Búsqueda en el cuerpo** de los artículos. Solo existía en `/api/search`, que no usaba
  ninguna página.
- **El motor de señales sociales** (`2026-09-19-motor-senales-sociales-design.md`) queda
  aparcado: necesita base de datos, cron y panel de administración.

---

## 2. Alcance

### Se elimina

| Ámbito | Ficheros |
|--------|----------|
| API | `src/app/api/**` (auth, comments, contributions, operations, search, og) |
| Páginas | `src/app/[locale]/admin/**`, `src/app/[locale]/contribute/`, `src/app/[locale]/[...rest]/` |
| Middleware | `src/middleware.ts` |
| Librerías | `src/lib/actions/`, `auth.ts`, `auth-utils.ts`, `comments.ts`, `contributions.ts`, `prisma.ts`, `revalidation.ts`, `env.ts`, `queries.ts`, `validation.ts` y `validation.test.ts` |
| Componentes | `src/components/admin/`, `auth/`, `contribute/`, `operation/CommentSection.tsx` |
| Base de datos | `prisma/` (schema, migraciones, seed), `prisma.config.ts`, `docker-compose.yml`, `src/generated/prisma` |
| Tests | `tests/local.integration.test.ts` (probaba HTTP contra Postgres) |
| Dependencias | `next-auth`, `@auth/prisma-adapter`, `prisma`, `@prisma/client`, `@prisma/adapter-pg`, `pg`, `dotenv`, `@vercel/analytics`, `@vercel/og`, y el script `postinstall` |
| Mensajes | Namespaces `contribute` y `admin` completos, y las claves sueltas de auth, comentarios, visitas y orden "más vistas" en `messages/en.json` y `messages/es.json` |

### Se mantiene, con los cambios que describe esta spec

Home, catálogo con filtros, ficha de operación, iceberg 3D, legales, imágenes OG, sitemap,
robots y páginas de error. Visualmente el sitio público no cambia, salvo lo que se pierde
(contador de visitas, enlace "Contribuir" y menú de usuario).

---

## 3. Modelo de contenido

```
content/
├─ tags.json
└─ operations/
   └─ <slug>/                 # el nombre de la carpeta es el slug en inglés
      ├─ meta.json
      ├─ body.en.md
      └─ body.es.md
```

### `tags.json`

Diccionario de etiquetas indexado por slug:

```json
{
  "cia": { "name": "CIA", "nameEs": "CIA" },
  "mind-control": { "name": "Mind Control", "nameEs": "Control Mental" }
}
```

### `meta.json`

```json
{
  "slug": "mkultra",
  "slugEs": "mkultra",
  "title": "MKUltra",
  "titleEs": "MKUltra",
  "aliases": ["MK-Ultra", "Project MKUltra"],
  "icebergLevel": 1,
  "era": "COLD_WAR",
  "types": ["MIND_CONTROL"],
  "actors": ["United States", "CIA"],
  "targets": ["Civilians", "Military personnel", "Prisoners"],
  "outcome": "PARTIAL",
  "status": "DECLASSIFIED",
  "excerpt": "CIA's illegal mind control program…",
  "excerptEs": "Programa ilegal de control mental de la CIA…",
  "coverImage": null,
  "publishedAt": "2026-03-29",
  "updatedAt": null,
  "tags": ["cia", "mind-control"],
  "related": ["project-artichoke"],
  "sources": [
    {
      "url": "https://www.cia.gov/readingroom/collection/mkultra",
      "title": "CIA FOIA Reading Room: MKUltra",
      "type": "GOVERNMENT",
      "credibility": 5
    }
  ]
}
```

| Campo | Regla |
|-------|-------|
| `slug`, `slugEs` | `^[a-z0-9]+(?:-[a-z0-9]+)*$`, máx. 200 |
| `title`, `titleEs` | 1–200 caracteres |
| `excerpt`, `excerptEs` | 1–2000 caracteres |
| `aliases`, `actors`, `targets` | listas de 0–50 strings de 1–200 caracteres |
| `icebergLevel` | entero de 1 a 5 |
| `era`, `types[]`, `outcome`, `status`, `sources[].type` | valores de los enums de `src/lib/content/enums.ts` |
| `coverImage` | ruta relativa a `public/` o `null`; opcional |
| `publishedAt` | obligatoria, `YYYY-MM-DD` |
| `updatedAt` | opcional, `YYYY-MM-DD`; si falta, vale `publishedAt` |
| `tags[]` | claves existentes en `tags.json` |
| `related[]` | slugs en inglés de operaciones existentes, distintos del propio |
| `sources[]` | `url` http(s) o `null`, `title` de 1–200 caracteres, `credibility` entero de 1 a 5 |
| `body.en.md`, `body.es.md` | existen y no están vacíos (tras `trim`), máx. 100 000 caracteres |

Las reglas de campo reutilizan las primitivas de `src/lib/validation.ts` actual
(`titleSchema`, `slugSchema`, `namesSchema`, `httpUrlSchema`…). Se trasladan al esquema de
contenido antes de borrar ese fichero.

### Reglas entre ficheros

1. El nombre de cada carpeta coincide con su `slug`.
2. No hay `slug` ni `slugEs` repetidos.
3. Cada etiqueta referenciada existe en `tags.json`.
4. Cada operación de `related` existe.
5. **Simetría:** el loader une `related` en los dos sentidos. Si `mkultra` declara
   `project-artichoke`, la ficha de Artichoke también muestra MKUltra. Declararlo en las dos
   carpetas no duplica nada.

Si una regla falla, el loader lanza un error que nombra el fichero y el campo
(p. ej. `content/operations/mkultra/meta.json: tags[1] "mind-ctrl" no existe en tags.json`),
y el build se detiene.

---

## 4. Capa de contenido (`src/lib/content/`)

| Fichero | Responsabilidad | ¿Usable en cliente? |
|---------|-----------------|---------------------|
| `enums.ts` | `Era`, `OperationType`, `Outcome`, `OperationStatus` y `SourceType` como objetos `as const` con su tipo homónimo. Mismo patrón que `@/generated/prisma/enums`, para que `Object.values(Era)` y `z.enum(Era)` sigan funcionando. | Sí |
| `types.ts` | `Tag`, `Source`, `Operation` y `OperationSummary`. | Sí (solo tipos) |
| `schema.ts` | Esquemas Zod de `meta.json` y `tags.json`. | Sí |
| `load.ts` | `loadContent(dir)`: lee el directorio con `fs`, valida cada fichero, aplica las reglas entre ficheros y resuelve etiquetas y relacionadas. Pura respecto a `dir`, para poder testearla con carpetas de prueba. | No |
| `index.ts` | La API que usan las páginas. Llama a `loadContent("content")` una vez por proceso (memo a nivel de módulo). Solo la importan componentes de servidor; si un componente cliente la importara, el build fallaría por `fs`. | No |

### Tipos

- **`Tag`:** `{ id, slug, name, nameEs }`. `id` es el slug, para que los `key={tag.id}` actuales sigan valiendo.
- **`Source`:** `{ id, url, title, type, credibility }`, con `id = "<slug>-<índice>"`.
- **`Operation`:** todos los campos de `meta.json`, más `id` (el slug), `bodyEn`, `bodyEs`,
  `tags: Tag[]`, `sources: Source[]` y `relatedOps: OperationSummary[]`.
- **`OperationSummary`:** igual que `Operation` sin cuerpos, fuentes ni relacionadas, más
  `sourceCount: number`, que sustituye a `_count.sources`.

Desaparecen `viewCount`, `moderationStatus`, `contributedById`, `createdAt` y `_count`.
`createdAt` pasa a llamarse `publishedAt`.

### API (`index.ts`)

Las funciones son síncronas. Las llamadas con `await` existentes siguen funcionando, pero se
limpian al tocar cada página.

| Función | Sustituye a | La usan |
|---------|-------------|---------|
| `getHomepageData()` | igual | `/[locale]` — las 6 más recientes por `publishedAt` (empate: nivel y luego título) y las estadísticas (operaciones, eras distintas, fuentes) |
| `getCatalogSummaries()` | `getCatalogOperations` | `/[locale]/catalog` — **todas** las operaciones resumidas; el filtrado pasa al cliente (§6) |
| `getDistinctActors()` | igual | catálogo |
| `getOperationBySlug(slug)` / `getOperationBySlugEs(slugEs)` | igual | ficha y su imagen OG |
| `getAllOperationSlugs()` | igual | `generateStaticParams`, sitemap y OG |
| `getIcebergData()` | igual | `/[locale]/iceberg` — orden estable por `publishedAt` descendente y luego título |

Los componentes que hoy importan tipos o enums de `@/generated/prisma/*`
(`CatalogFilters`, `FeaturedGrid`, `OperationHeader`, `RelatedOps`, `SourcesList`,
`catalog.ts`, `seo.ts`) pasan a importarlos de `@/lib/content/types` y
`@/lib/content/enums`.

---

## 5. Rutas y páginas

### Todas

- **i18n sin middleware:** cada layout y página bajo `[locale]` llama a
  `setRequestLocale(locale)` antes de usar next-intl. `src/i18n/request.ts` no cambia.
- `[locale]/layout.tsx` y `catalog/[slug]/page.tsx` exportan `dynamicParams = false`.
- Se quitan `SessionProvider` y `<Analytics />` del layout, y `UserMenu` y el enlace
  "Contribuir" de `Header` y `MobileNav`.

### Ficha (`/[locale]/catalog/[slug]`)

- `generateStaticParams({ params: { locale } })` devuelve los slugs en inglés para `en` y
  los `slugEs` para `es`.
- Se quitan `headers()`, `after()`, `incrementOperationView`, `getApprovedComments` y
  `CommentSection`.
- `OperationHeader` deja de mostrar el contador de visitas.
- `seo.ts` usa `publishedAt` y `updatedAt` en el JSON-LD.

### Iceberg

Solo cambia el origen de los datos. `iceberg/page.tsx` ya entrega a los componentes el slug
del idioma de la página, así que la navegación a la ficha no se toca. (`IcebergScene` y
`IcebergClientWrapper` no los usa ninguna página; quedan como están.)

### Legales

- **Privacidad:** se reescribe en EN y ES. Sin cuentas, sin cookies, sin contenido de
  usuarios y sin analítica. GitHub (Pages) como único proveedor, con sus logs técnicos
  (IP, agente de usuario).
- **Términos:** pierden las cláusulas sobre contribuciones y comentarios de usuarios.
- El email de contacto sigue siendo el placeholder `contact@psyopedia.org`; sustituirlo es un
  paso pendiente del usuario, fuera de esta spec.

---

## 6. Catálogo filtrado en el navegador

```
catalog/page.tsx (servidor)
  ├─ getCatalogSummaries(), getDistinctActors()
  └─ <Suspense fallback={<CatalogView página 1 sin filtros />}>
       <CatalogBrowser operations={…} actors={…} locale={…} />   ("use client")
     </Suspense>
```

- `CatalogBrowser` lee `useSearchParams()`, aplica `parseCatalogFilters` (sin cambios de
  contrato) y `filterCatalog()`, y renderiza los filtros, `OperationGrid` y la paginación.
- El `fallback` de `Suspense` es la primera página sin filtros, así que el HTML estático trae
  contenido indexable aunque el visitante no ejecute JavaScript.
- `CatalogFilters` sigue como está: actualiza la URL con `router.push`.
- `OperationGrid` y `OperationCard` pasan a renderizarse también en cliente. Ya usan
  `useTranslations` y no tocan APIs de servidor, así que no hay que reescribirlos.
- Las URL siguen siendo `?level=3&era=COLD_WAR&page=2`. Un filtro inválido muestra el mismo
  aviso `invalidFilters` que hoy.

### `filterCatalog(operations, filters)` en `src/lib/catalog.ts`

Función pura que devuelve `{ operations, total, page, pageSize, totalPages }`, igual que
`getCatalogOperations`.

| Filtro | Comportamiento |
|--------|----------------|
| `search` | Coincidencia parcial sobre `title`, `titleEs`, `excerpt`, `excerptEs` y `aliases`, sin distinguir mayúsculas ni tildes (NFD + minúsculas en ambos lados) |
| `levels`, `eras`, `outcomes`, `statuses` | pertenencia (`in`) |
| `types` | intersección no vacía (`hasSome`) |
| `actor` | igualdad exacta dentro de `actors` |
| `sort` | `newest` / `oldest` por `publishedAt`, `level`, `title` (según idioma); empate por `id` ascendente |
| `page`, `pageSize` | `pageSize` entre 1 y 100 (por defecto 12); `page` se acota a `[1, totalPages]` |

`CATALOG_SORTS` queda en `["newest", "oldest", "level", "title"]`.

---

## 7. Imágenes OG

En GitHub Pages un fichero sin extensión se sirve como `application/octet-stream`, y los
crawlers sociales pueden no tratarlo como imagen. Por eso no se usan las convenciones
`opengraph-image.tsx`.

- **Dos route handlers** (`GET`, sin leer `Request`), que comparten plantillas en `src/lib/og.tsx`:
  - `src/app/og/[locale]/home.png/route.tsx` → `og/<locale>/home.png`.
  - `src/app/og/[locale]/catalog/[file]/route.tsx` → `og/<locale>/catalog/<slug>.png` (con
    `slugEs` en español). Ir en su propia carpeta evita que una operación con slug `home`
    pise la imagen de la home.
- **Diseño:** el de la home sale del actual `[locale]/opengraph-image.tsx` y el de las
  operaciones del actual `/api/og/[slug]`. Ahora los títulos y etiquetas de nivel salen en el
  idioma de la página.
- **Metadatos:** el layout, la home, el iceberg y `seo.ts` referencian la imagen de forma
  explícita con `ogImageUrl(locale, slug?)` de `src/lib/site.ts`.
- Se borra `src/app/[locale]/opengraph-image.tsx`.

**Verificado (2026-10-14)** con una app mínima de Next 16.2.1 y `output: "export"`,
`trailingSlash: true` y `basePath`: el route handler emite `out/og/en/home.png` como PNG real
(1200×630), y una carpeta de ruta estática `home.png/` también. No hace falta el plan B del
script.

---

## 8. URLs, `basePath`, raíz y 404

- **`trailingSlash: true`:** cada página se exporta como `<ruta>/index.html`, que es como
  GitHub Pages sirve un directorio sin redirecciones intermedias.
- **Una sola variable, `NEXT_PUBLIC_SITE_URL`.** El `basePath` es la ruta de esa URL:
  `https://kenserikawa.github.io/psyopedia` da `/psyopedia` y `https://psyopedia.org` da `""`.
  Con dos variables no se podría: en las expresiones de GitHub Actions un valor vacío cae al
  valor por defecto, así que el `basePath` vacío del dominio propio sería imposible.
- **`src/lib/site.ts`** concentra las URL del sitio:
  - `SITE_URL`: la URL pública sin barra final (por defecto `https://psyopedia.org`).
    `seo.ts`, `robots.ts`, `sitemap.ts` y las páginas lo importan de aquí.
  - `BASE_PATH`: la ruta de `SITE_URL` sin barra final.
  - `pageUrl(path)`: URL absoluta con barra final. Lo usan las canónicas, `hreflang`, el
    sitemap, el JSON-LD y los botones de compartir.
  - `asset(path)`: antepone `BASE_PATH` a las rutas de `public/`. Lo necesitan `next/image` (`HeroSection`, `Header`, `MobileNav`; la
  documentación de Next 16 confirma que `next/image` no añade el `basePath`),
  `useTexture('/textures/waternormals.jpg')` en `OceanWater` y `coverImage` si se usa.
  `next/link` y `router.push` ya lo añaden solos.
- **Raíz `/`:** `src/app/page.tsx` estático que renderiza su propio `<html>` (el layout raíz
  es un pass-through). Lleva un script inline mínimo que redirige con `location.replace` a
  `<basePath>/es/` si `navigator.languages` empieza por `es`, y a `<basePath>/en/` en
  cualquier otro caso, más `<meta http-equiv="refresh" content="0;url=<basePath>/en/">` para
  cuando no hay JavaScript.
- **404:** GitHub Pages sirve un único `404.html` para todo el sitio. `src/app/not-found.tsx`
  pasa a ser bilingüe, con enlaces a `/en/` y `/es/`. `[locale]/not-found.tsx` se mantiene
  para los `notFound()` dentro de páginas.

---

## 9. Configuración y despliegue

### `next.config.ts`

```ts
// next.config.ts no puede importar módulos TS locales (verificado con Next 16.2.1):
// repite el cálculo de BASE_PATH de src/lib/site.ts. test:export comprueba que coinciden.
const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || "https://psyopedia.org").replace(/\/+$/, "");

const nextConfig: NextConfig = {
  output: "export",
  trailingSlash: true,
  basePath: new URL(SITE_URL).pathname.replace(/\/+$/, ""),
  images: { unoptimized: true },
  allowedDevOrigins: ["*.ngrok-free.app"],
};
```

Se eliminan `headers()` y `poweredByHeader`. El layout añade
`<meta name="referrer" content="strict-origin-when-cross-origin">`.

### `.github/workflows/deploy.yml`

- **Disparadores:** push a `master` y `workflow_dispatch`.
- **Permisos:** `contents: read`, `pages: write`, `id-token: write`; `concurrency: pages`.
- **Job `build`:** Node 22 → `npm ci` → `npm test` → `npm run lint` → `npm run build` →
  `npm run test:export` → `actions/upload-pages-artifact` (ruta `out`).
- **Job `deploy`:** `actions/deploy-pages`.
- **Variable de entorno del build:** `NEXT_PUBLIC_SITE_URL`, tomada de la variable del repo
  `SITE_URL` con valor por defecto `https://kenserikawa.github.io/psyopedia`.
- No se usa la opción `static_site_generator: next` de `configure-pages`: el `basePath` lo
  controlamos nosotros.

### Otros ficheros

- `public/.nojekyll` vacío, para que `_next/` se sirva aunque se publique desde una rama.
  Verificado: el export lo copia a `out/`.
- `.env.example` se queda solo con `NEXT_PUBLIC_SITE_URL`.
- **Dominio propio (futuro):** crear `public/CNAME` y poner la variable del repo `SITE_URL`
  a `https://<dominio>`. No requiere cambios de código.

### Pasos manuales del usuario

1. En el repo de GitHub: Settings → Pages → Source: **GitHub Actions**.
2. Push de la rama mergeada a `master`.

---

## 10. Migración del contenido

Un script de un solo uso, que no se versiona, convierte el array de `prisma/seed.ts` a
`content/`:

- Una carpeta por operación, con `meta.json` (campos de §3), `body.en.md` y `body.es.md`.
- `tags.json` con la unión de todas las etiquetas.
- `publishedAt: "2026-03-29"` en todas, la fecha en que entraron al repo.
- `related` con los tres pares que hoy crea el seed (`mkultra`→`project-artichoke`,
  `cointelpro`→`operation-mockingbird`, `cambridge-analytica`→`internet-research-agency`).

El resultado se valida con el propio loader y se revisa el diff antes de borrar `prisma/`.

---

## 11. Testing

### `npm test` (Node test runner + tsx)

- **`src/lib/content/load.test.ts`:**
  - Con carpetas de prueba temporales, un caso por regla de §3 que comprueba que falla y que
    el mensaje nombra el fichero y el campo.
  - Un caso válido mínimo.
  - El `content/` real carga 25 operaciones, todas las relaciones son simétricas y no hay
    slugs repetidos.
- **`src/lib/catalog.test.ts`** (ampliado):
  - `filterCatalog`: cada filtro, búsqueda insensible a tildes y mayúsculas, los cuatro
    órdenes con su desempate, y paginación fuera de rango.
  - `parseCatalogFilters` rechaza `sort=most-viewed`.
- **`src/lib/iceberg-geometry.test.ts`:** sin cambios.

### `npm run test:export` (`tests/static-export.test.ts`)

Se ejecuta después de `npm run build` e inspecciona `out/`:

- Existen `index.html`, `404.html`, `robots.txt`, `sitemap.xml`, `.nojekyll`,
  `en/index.html`, `es/index.html`, `en/catalog/index.html`, `en/iceberg/index.html` y las
  legales.
- Existen las 50 fichas: `en/catalog/<slug>/index.html` y `es/catalog/<slugEs>/index.html`.
- `og/en/home.png`, `og/es/home.png` y `og/<locale>/catalog/<slug>.png` de cada operación
  empiezan por los bytes mágicos de PNG.
- Los assets de `_next/` del HTML llevan el `BASE_PATH` de `src/lib/site.ts`, lo que confirma
  que coincide con el calculado en `next.config.ts`.
- `sitemap.xml` contiene las URL de todas las fichas, con el `basePath` y la barra final.
- No existe `out/api/`.

### Verificación manual

Sin `next dev` en marcha (comparte `.next` con el build):

1. Build con `NEXT_PUBLIC_SITE_URL=http://localhost:4173/psyopedia`.
2. Servir `out/` bajo `/psyopedia/` imitando GitHub Pages.
3. Recorrer con Chrome DevTools: redirección de `/`, home EN/ES, catálogo (filtros,
   búsqueda con y sin tilde, paginación, recarga con query), ficha EN/ES con relacionadas en
   los dos sentidos, iceberg (incluido el clic a una ficha en español), 404, imágenes y textura con
   `basePath`, y consola sin errores.

---

## 12. Documentación

- **`README.md`:** desarrollo, estructura de `content/`, cómo añadir una operación,
  comandos y despliegue en GitHub Pages (variables, paso manual, dominio futuro).
- **`CLAUDE.md`:** arquitectura sin Prisma ni NextAuth, capa `src/lib/content/`, comandos
  actualizados y gotchas del export (`setRequestLocale`, `asset()`, `trailingSlash`).
- **Skill `.claude/skills/verify`:** `next start` deja de servir; se verifica sirviendo
  `out/`.
- **`2026-09-19-motor-senales-sociales-design.md`:** nota al principio indicando que queda
  aparcada porque requiere backend.

---

## 13. Fases de implementación (orden sugerido para el plan)

1. **Capa de contenido:** enums, tipos, esquema, loader y tests (TDD).
2. **Migración:** script desechable → `content/`, validado por el loader.
3. **Páginas sobre el loader:** home, ficha, iceberg, sitemap y robots.
4. **Catálogo en cliente:** `filterCatalog` (TDD) y `CatalogBrowser`.
5. **Retirada de usuarios y base de datos:** borrado de rutas, libs, componentes, mensajes,
   Prisma y dependencias.
6. **URLs y despliegue:** `basePath`, `asset()`, `pageUrl()`, raíz, 404, OG definitivas,
   `.nojekyll` y workflow.
7. **Legales y documentación.**
8. **Verificación:** `test:export` y recorrido manual.

---

## 14. Fuera de alcance (YAGNI)

- **Analítica** (GoatCounter o Cloudflare Web Analytics se pueden añadir con un script más adelante).
- **Comentarios externos** (Giscus) y **formulario de contribuciones** externo.
- **Búsqueda de texto completo** (Pagefind o similar).
- **Borradores** o campos de publicación programada en `meta.json`.
- **CMS** o editor visual del contenido.
- **Motor de señales sociales**.
- **Corregir las tildes que faltan** en los textos en español del seed ("Metodos",
  "Operacion"…): se migran tal cual y se corrigen en una tarea de contenido aparte.
