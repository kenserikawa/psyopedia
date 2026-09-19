# Motor de señales sociales — detección de psyops emergentes

**Fecha:** 2026-09-19
**Rutas afectadas:** `/[locale]/admin/signals` (nueva), `/api/cron/signals` (nueva)
**Objetivo:** Dotar a Psyopedia de un motor de recogida de datos que rastree redes sociales
y prensa, detecte de forma determinista dónde se está acumulando sospecha organizada sobre
un fenómeno, y deje candidatos priorizados en una cola de moderación humana.

---

## 1. Resumen de decisiones (tomadas en brainstorming)

| Decisión | Elección |
|----------|----------|
| Producto final | **Cola de candidatos para moderación.** Nada llega al público sin que un humano lo revise y lo redacte. |
| Fuentes | **Bluesky + Reddit + GDELT** operativas desde el día uno (coste 0 €). **X** como adaptador inerte hasta que existan credenciales de pago. |
| Detección | **Solo heurística determinista.** Sin LLM: la máquina reúne evidencia y puntúa indicadores; no afirma nada. |
| Runtime | **Cron con polling**, sin proceso permanente. Mismo código en Vercel Cron, GitHub Actions o local. |
| Entidad catalogada | **El fenómeno de amplificación**, no la persona. |

### El hallazgo que ordena el diseño

Los casos que motivan el encargo (la oleada de apoyo online a Lindsay Clancy en enero de 2023,
la viralización de Tiffany Gomas "Plane Lady" en julio de 2023) comparten un rasgo decisivo:
**ninguno habría figurado en una watchlist previa**. Nadie puede enumerar por adelantado los
temas que se volverán sospechosos.

Pero en ambos casos la propia red pronunció la palabra: los replies a Plane Lady estaban
saturados de "this is a psyop", y el caso Clancy generó discurso explícito de fabricación
deliberada.

De ahí la inversión que hace viable todo lo demás: **el léxico no es de temas, es de sospecha**.
Eso convierte "detectar psyops" —imposible sin IA y peligroso con ella— en "detectar dónde se
está acumulando sospecha organizada", que es medible con aritmética.

### Restricción legal, no negociable

Las personas implicadas en estos fenómenos son privadas, vivas e identificables. Publicar que
alguien "es una psyop" es imputarle participación en una operación de engaño: difamación en
potencia, y bajo GDPR el art. 10 cubre además datos relativos a condenas penales.

El diseño responde cambiando **qué se cataloga**: la unidad es el fenómeno de amplificación
("la oleada de apoyo online a X"), y el nombre propio vive en `entities` como clave técnica
de agrupación. Ningún campo del esquema afirma que una persona forme parte de una operación.

---

## 2. Arquitectura

### Flujo

```
recolectores → normalizar → extraer entidades → agrupar → puntuar → cola
 (I/O, red)     (puro)        (puro)            (puro)     (puro)   (DB)
```

Solo la primera etapa toca la red; solo la última escribe estado. Las cinco intermedias son
funciones puras que reciben `SocialPost[]` y devuelven datos, testeables con `npm test` sin
base de datos ni red — igual que `catalog.test.ts` y `validation.test.ts` hoy.

### Ficheros nuevos

```
src/lib/signals/
├── collectors/
│   ├── types.ts        # interfaz Collector — el contrato
│   ├── bluesky.ts      # app.bsky.feed.searchPosts (app password)
│   ├── reddit.ts       # OAuth app-only, /search
│   ├── gdelt.ts        # GDELT DOC 2.0
│   └── x.ts            # inerte sin X_BEARER_TOKEN
├── lexicon.ts          # carga y casa el léxico de sospecha
├── entities.ts         # extracción de entidades co-ocurrentes
├── cluster.ts          # agrupación por entidad + ventana temporal
├── score.ts            # siete indicadores → 0-100
├── pipeline.ts         # orquestador de las cinco etapas
├── purge.ts            # retención y borrado por sujeto
└── *.test.ts

src/app/api/cron/signals/route.ts        # disparo protegido por CRON_SECRET
src/app/[locale]/admin/signals/page.tsx  # listado
src/app/[locale]/admin/signals/[id]/page.tsx
src/lib/actions/signals.ts               # descartar / seguir / promocionar
scripts/collect.ts                       # npm run signals:collect
tests/fixtures/signals/*.json            # respuestas reales capturadas
```

### Punto de integración

El motor **llega hasta la puerta del sistema actual y no mete la mano dentro**. Promocionar un
cluster no crea una `Operation`: prerellena el formulario de contribución y entra en
`createContribution` y el flujo de aprobación existentes, sin modificarlos. Si el motor se
apaga, el catálogo sigue funcionando idéntico.

---

## 3. Modelo de datos

Cuatro modelos nuevos. Ninguna modificación destructiva de los existentes.

```prisma
enum SignalPlatform { BLUESKY REDDIT GDELT X }

enum SignalStatus {
  OPEN       // nuevo, sin revisar
  WATCHING   // el moderador lo sigue; protege sus posts de la purga
  DISMISSED  // ruido; silencia la entidad temporalmente
  PROMOTED   // convertido en contribución
}

model SocialPost {
  id              String   @id @default(cuid())
  platform        SignalPlatform
  externalId      String
  url             String
  authorHandle    String
  authorId        String?
  authorCreatedAt DateTime?        // clave para el indicador de edad de cuentas
  text            String
  lang            String?
  engagement      Int      @default(0)
  repostCount     Int      @default(0)
  postedAt        DateTime
  matchedTerms    String[]
  entities        String[]
  collectedAt     DateTime @default(now())
  clusters        SignalCluster[]

  @@unique([platform, externalId])  // re-ejecutar el cron nunca duplica
  @@index([postedAt])
  @@index([entities], type: Gin)
}

model SignalCluster {
  id                  String   @id @default(cuid())
  key                 String   @unique   // entidad normalizada + ventana
  label               String             // el fenómeno, redactable por el moderador
  entities            String[]
  platforms           SignalPlatform[]
  posts               SocialPost[]
  postCount           Int
  authorCount         Int
  firstSeenAt         DateTime
  lastSeenAt          DateTime
  score               Int                // 0-100
  indicators          Json               // desglose auditable de los siete
  status              SignalStatus @default(OPEN)
  reviewNote          String?
  reviewedBy          User?     @relation("ReviewedSignals", fields: [reviewedById], references: [id])
  reviewedById        String?
  promotedOperation   Operation? @relation("PromotedFromSignal", fields: [promotedOperationId], references: [id])
  promotedOperationId String?
  createdAt           DateTime @default(now())
  updatedAt           DateTime @updatedAt

  @@index([status, score])
}

model SuspicionTerm {
  id     String  @id @default(cuid())
  term   String
  lang   String              // "en" | "es"
  family String              // ACCUSATION | AUTHENTICITY | ATTRIBUTION | MEDIA
  weight Int     @default(1) // 1-3
  active Boolean @default(true)

  @@unique([term, lang])
}

model CollectorRun {
  id           String   @id @default(cuid())
  platform     SignalPlatform
  startedAt    DateTime @default(now())
  finishedAt   DateTime?
  postsFetched Int      @default(0)
  postsStored  Int      @default(0)
  postsInvalid Int      @default(0)
  cursor       String?  // paginación incremental; reanuda ejecuciones interrumpidas
  error        String?

  @@index([platform, startedAt])
}
```

`User` y `Operation` reciben únicamente las relaciones inversas correspondientes
(`reviewedSignals`, `promotedFromSignal`).

### Por qué el léxico vive en base de datos

`SuspicionTerm` es el dial principal del sistema y se va a tocar constantemente durante la
calibración. En base de datos se edita desde admin sin desplegar; hardcodeado obligaría a un
despliegue por cada ajuste.

### Retención

`SocialPost` que no pertenezca a ningún cluster en `WATCHING` o `PROMOTED` se borra a los
**60 días**. Es higiene de GDPR —se almacenan posts de personas identificables— y evita que la
tabla crezca sin control. La purga corre en el mismo cron, después del pipeline.

---

## 4. El léxico de sospecha

Bilingüe, con peso 1-3, en cuatro familias:

| Familia | Ejemplos | Peso |
|---|---|---|
| `ACCUSATION` | `psyop`, `false flag`, `crisis actor`, `staged`, `montaje`, `bandera falsa` | 3 |
| `AUTHENTICITY` | `this didn't happen`, `they're actors`, `not real`, `esto no pasó`, `está guionizado` | 2 |
| `ATTRIBUTION` | `glowie`, `spook`, `who's funding`, `cui bono`, `a quién beneficia` | 2 |
| `MEDIA` | `media blackout`, `why is nobody talking about`, `cortina de humo`, `distracción` | 1 |

Los pesos bajos existen porque términos como `actors` o `fed` generan muchísimo ruido en
solitario, pero suman valor cuando acompañan a un marcador fuerte.

**Anti-lista:** las operaciones ya catalogadas (`MKUltra`, `COINTELPRO`, `Northwoods`…) se
excluyen del disparo. Hablar de MKUltra no es una señal emergente: es el catálogo existente.
Se deriva de los `Operation.title`/`aliases` ya en base de datos, no de una lista manual.

---

## 5. Extracción de entidades y agrupación

Un post entra al pipeline por el léxico, pero se agrupa por **de quién o de qué habla**.

Sin librerías de NLP: n-gramas capitalizados de 1 a 3 tokens que no abran frase, más hashtags
normalizados, filtrados contra una lista de stopwords EN/ES. La normalización reutiliza la
lógica de `createSlug` de `src/lib/validation.ts` (NFD, sin diacríticos, minúsculas).

El método es tosco y producirá entidades basura. La basura no sobrevive al siguiente filtro:
**una entidad solo abre cluster si aparece en ≥8 posts de ≥5 autores distintos**. El ruido
aleatorio no supera ese corte, y el moderador ve los posts crudos de todas formas.

**Ventana de agrupación:** el día UTC. `SignalCluster.key` es `entidad + fecha del día UTC`, de
modo que re-ejecutar el cron varias veces al día actualiza el mismo cluster en lugar de
duplicarlo. Una entidad que reaparece al día siguiente abre un cluster nuevo, enlazado al
anterior por entidad compartida; eso es deliberado, porque una narrativa que rebrota tras
apagarse es en sí misma una señal distinta de una que nunca se apagó.

No se usan ventanas deslizantes: los indicadores comparan el día en curso contra días
completos previos, y un cubo diario fijo mantiene esa comparación estable entre ejecuciones.

---

## 6. Los siete indicadores

Cada uno puntúa 0-100; se combinan en suma ponderada. Todos deterministas, todos guardados
desglosados en `SignalCluster.indicators` para que la UI pueda responder *por qué* puntuó 74
y no solo *que* puntuó 74.

| # | Indicador | Qué mide | Peso inicial |
|---|---|---|---|
| 1 | Pico de volumen | posts/hora en la ventana de 24h contra la mediana de las 7 ventanas previas. Distingue narrativa emergente de tema perenne. | 25 |
| 2 | Densidad de sospecha | proporción de posts sobre la entidad con marcadores del léxico, ponderada por peso. Descarta lo que es tendencia sin que nadie sospeche. | 20 |
| 3 | Dispersión entre plataformas | en cuántas de las fuentes activas aparece. Saltar de Reddit a Bluesky a prensa pesa mucho más que vivir en un subreddit. | 15 |
| 4 | Concentración de autoría | índice tipo Herfindahl sobre autores. Si el 5% de las cuentas produce el 80% de los posts, es amplificación, no conversación. | 15 |
| 5 | Perfil de edad de cuentas | antigüedad mediana de los participantes contra la línea base de la plataforma. Indicador clásico de astroturfing. No aplica en GDELT. | 10 |
| 6 | Sincronía temporal | porcentaje de posts dentro de la ventana de 10 minutos más densa. Lo orgánico tiene cola larga; lo coordinado va en ráfaga. | 10 |
| 7 | Salto a medios | vía GDELT, latencia entre el primer post social y la primera noticia. Tanto un salto anormalmente rápido como un silencio prolongado son informativos. | 5 |

**Atenuación del indicador 1:** una entidad sin histórico dispararía al máximo por definición.
Se atenúa exigiendo un volumen absoluto mínimo antes de conceder puntuación de pico completa.

**Indicadores no disponibles** (p. ej. edad de cuenta en GDELT) no puntúan cero: se excluyen y
los pesos restantes se renormalizan, para no penalizar a un cluster por la fuente en que vive.

### Umbral de entrada en la cola

`score ≥ 60` **y** `postCount ≥ 25` **y** `authorCount ≥ 10`, con tope de **20 candidatos al
día** ordenados por score.

El tope es deliberado: una cola que nadie puede revisar entera no es una cola, es un vertedero.

---

## 7. Calibración y validación

Los dos casos de referencia son de 2023, y **Reddit y GDELT conservan histórico buscable** de
esa época. Eso permite construir un modo backfill (`--since`/`--until`) y convertirlos en
tests de regresión literales:

> Ejecutado contra enero de 2023, el pipeline debe producir un cluster cuya entidad dominante
> sea `lindsay clancy`.
>
> Ejecutado contra julio de 2023, ídem con `tiffany gomas`.

Así la heurística deja de ser una invención y pasa a ser calibrable contra verdad conocida: si
no los detecta, los pesos están mal y el desglose de indicadores señala cuál. Bluesky queda
fuera de esta validación porque en 2023 era testimonial; Reddit basta.

### Falsos positivos esperados

Ficción y estrenos, deportes (`ese árbitro es un psyop`) y uso irónico del término, que es
masivo. Mitigación: cada `DISMISSED` incorpora la entidad a una lista de silenciados con
caducidad, de modo que no se vuelva a proponer la semana siguiente. La cola aprende de los
descartes sin necesidad de modelo.

---

## 8. Recolectores

```ts
interface Collector {
  platform: SignalPlatform;
  enabled(): boolean;
  collect(opts: { terms: string[]; since: Date; cursor?: string }):
    Promise<{ posts: RawPost[]; cursor?: string }>;
}
```

| Fuente | Acceso | Coste | Límite |
|---|---|---|---|
| Bluesky | App password de cuenta gratuita (`searchPosts` va autenticado) | 0 € | Holgado |
| Reddit | OAuth app-only `client_credentials` | 0 € | 100 req/min |
| GDELT | API pública sin clave | 0 € | Cortesía |
| X | Bearer token, tier de pago | ~200 €/mes | Bajo |

El adaptador de X se escribe completo, pero `enabled()` devuelve `false` sin `X_BEARER_TOKEN`:
queda inerte y no rompe nada. Activarlo es añadir una variable de entorno.

### Manejo de errores

- **Colector caído no aborta el pipeline.** Los demás continúan; el fallo se registra en
  `CollectorRun.error`. Con cuatro dependencias externas, que una falle es lo normal.
- **Validación Zod por colector** antes de normalizar. Si la API externa cambia de forma, los
  items inválidos se descartan y se cuentan en `postsInvalid`; nunca revienta la ejecución.
- **Rate limit:** backoff exponencial ante 429, con el cursor persistido para que una
  ejecución interrumpida reanude donde iba.

### Variables de entorno

`CRON_SECRET`, `BLUESKY_IDENTIFIER`, `BLUESKY_APP_PASSWORD`, `REDDIT_CLIENT_ID`,
`REDDIT_CLIENT_SECRET`, `REDDIT_USER_AGENT`, `X_BEARER_TOKEN` (opcional).

Se validan **al entrar al pipeline, no en `src/lib/env.ts`**. La web debe seguir arrancando sin
ninguna de ellas, igual que hoy arranca sin credenciales de OAuth.

---

## 9. Cola de moderación

`/[locale]/admin/signals`, junto a las secciones de admin existentes y con el mismo
`requireModerator` de `src/lib/auth-utils.ts`.

**Listado:** score, etiqueta, entidades, badges de plataforma, número de posts y minigráfica de
volumen. Filtrable por estado.

**Detalle:** desglose de los siete indicadores en barras, posts crudos con enlace al original,
distribución de edad de cuentas y línea temporal.

**Acciones** (server actions en `src/lib/actions/signals.ts`):

| Acción | Efecto |
|---|---|
| Descartar | `DISMISSED` + motivo; silencia la entidad con caducidad |
| Seguir | `WATCHING`; protege sus posts de la purga de 60 días |
| Promocionar | Abre el formulario de contribución prerellenado |

### La promoción

Promocionar **no crea una `Operation`**. Prerellena el formulario de contribución con lo que la
máquina puede saber sin inventar nada:

- `sources`: URLs del cluster como `Source` de tipo `WEBSITE`, credibilidad baja
- `title`: la etiqueta del cluster, editable
- `status`: `ALLEGED`
- `era`: `DIGITAL_AGE`
- `icebergLevel`: 4

El cuerpo bilingüe, los actores, los objetivos y el análisis los escribe el moderador. A partir
de ahí entra en `createContribution` y el flujo de aprobación existentes, sin tocarlos.

---

## 10. Protecciones legales y de privacidad

- **Purga a 60 días** de posts no vinculados a clusters seguidos o promocionados.
- **Borrado por sujeto:** acción de admin para eliminar por handle de autor o por entidad —
  necesario para atender un derecho de supresión.
- **Solo contenido público.** En X, solo vía API de pago: nada de scraping, ni por ToS ni por
  fragilidad técnica.
- **Ninguna ficha publicada sin autoría humana**, y siempre con `status: ALLEGED`.
- **`label` describe el fenómeno**; el nombre propio vive en `entities` como clave técnica.

---

## 11. Testing

| Nivel | Qué cubre | Comando |
|---|---|---|
| Unitario puro | Coincidencia de léxico, extracción de entidades, clustering, los siete indicadores por separado, umbral de corte | `npm test` |
| Colectores | Parseo y normalización contra fixtures JSON capturadas de las APIs reales, sin red | `npm test` |
| Integración | Backfill contra los casos Clancy y Gomas; purga y retención | `npm run test:integration` |

Los tests unitarios siguen el patrón existente: runner nativo de Node a través de `tsx`, sin
framework adicional.

---

## 12. Fases de implementación

1. **Esquema y migración** — cuatro modelos, relaciones inversas, seed del léxico inicial.
2. **Etapas puras** — `lexicon`, `entities`, `cluster`, `score`, con sus tests. Sin red, sin DB.
3. **Colectores** — interfaz, los tres gratuitos, fixtures y tests. X inerte.
4. **Pipeline y disparo** — orquestador, route handler con `CRON_SECRET`, `npm run signals:collect`.
5. **Calibración** — backfill contra 2023, ajuste de pesos, tests de regresión de Clancy y Gomas.
6. **Cola de moderación** — listado, detalle, las tres acciones.
7. **Promoción** — prerelleno del formulario de contribución.
8. **Retención** — purga a 60 días y borrado por sujeto.

Las fases 1-5 entregan un motor verificable sin UI. La 5 es la que decide si el enfoque
funciona: conviene no construir la UI antes de superarla.

---

## 13. Fuera de alcance (YAGNI)

- **LLM en cualquier etapa.** Sin modelo no hay riesgo de que la máquina afirme nada.
- **X en el arranque.** Adaptador escrito, desactivado.
- **TikTok.** Su Research API está restringida a instituciones acreditadas.
- **Sección pública de señales.** Todo pasa por moderación humana.
- **Análisis de imagen, vídeo o sentiment.**
- **Grafo de solapamiento de seguidores.** Es lo más tentador de la lista y lo más caro de
  hacer bien. Si los siete indicadores se quedan cortos, se añade después con datos reales que
  justifiquen el gasto.
