---
name: verify
description: Cómo compilar, servir y verificar el export estático de Psyopedia en local
---

# Verificar Psyopedia (export estático)

## Receta

No compiles con `next dev` en marcha: comparten `.next`.

```bash
export NEXT_PUBLIC_SITE_URL=http://localhost:4173/psyopedia
npm run build && npm run test:export

ccres comprobar puerto:4173 && ccres reservar puerto:4173 --hasta 2h --motivo "verificar psyopedia"
SITE=$(mktemp -d) && ln -s "$PWD/out" "$SITE/psyopedia"
python3 -m http.server 4173 --directory "$SITE" &
SERVER_PID=$!
# … verificar en http://localhost:4173/psyopedia/ …
kill $SERVER_PID; ccres liberar puerto:4173
```

Servir `out/` bajo `/psyopedia/` imita GitHub Pages (basePath incluido). `python3 -m http.server` redirige `/ruta` a `/ruta/` como Pages, pero no sirve `404.html` en rutas inexistentes: comprueba esa página abriendo `/psyopedia/404.html`.

## Flujos que merece la pena conducir
- `/psyopedia/` — redirige a `/psyopedia/es/` o `/psyopedia/en/` según el idioma del navegador.
- `/psyopedia/es/catalog/?level=3&sort=title` — filtros en el navegador; búsqueda con y sin tilde; paginación; recargar con query.
- `/psyopedia/es/catalog/operacion-paperclip/` y `/psyopedia/en/catalog/project-artichoke/` — relacionadas en los dos sentidos.
- `/psyopedia/es/iceberg/` — escena 3D (procedural, sin GLB); clic en una operación lleva a la ficha en español. Los errores de React en el canvas los captura `[locale]/error.tsx` ("Algo ha salido mal").
- `/psyopedia/og/es/catalog/operacion-paperclip.png` — imagen OG.
- `/psyopedia/{en,es}/legal/{privacy,terms}/` — contenido bilingüe inline en las páginas.

## Gotchas
- rtk (hook del usuario) comprime la salida de eslint, grep y otros; usa `rtk proxy <cmd>` para la salida cruda.
- `pkill -f "<patrón>"` puede matar el propio shell si su línea contiene el patrón: usa `pkill -f "[p]atrón"`.
- Los screenshots del MCP de navegador se guardan en la raíz del repo (ignorados por `/*.png`).
- Ruido esperado en consola: warnings de deprecación de THREE.Clock y toNonIndexed.
- `@react-three/postprocessing` hace `JSON.stringify(props)` en efectos envueltos: nunca pasar RefObjects como `ref` a Vignette/Noise/ChromaticAberration (React 19 mete ref en props) — usar callback refs (ver PostFX.tsx).
