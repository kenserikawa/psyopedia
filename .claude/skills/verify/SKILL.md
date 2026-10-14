---
name: verify
description: Cómo compilar, servir y verificar el export estático de Psyopedia en local
---

# Verificar Psyopedia (export estático)

## Receta

No compiles con `next dev` en marcha: comparten `.next`.

```bash
export NEXT_PUBLIC_SITE_URL=http://127.0.0.1:4280/psyopedia
npm run build && npm run test:export

ss -ltn | grep -q ":4280 " && echo "4280 ocupado por otro proceso"  # ccres no ve procesos sin reserva
ccres comprobar puerto:4280 && ccres reservar puerto:4280 --hasta 2h --motivo "verificar psyopedia"
SITE=$(mktemp -d) && ln -s "$PWD/out" "$SITE/psyopedia"
python3 -m http.server 4280 --bind 127.0.0.1 --directory "$SITE" &
SERVER_PID=$!
# … verificar en http://127.0.0.1:4280/psyopedia/ …
kill $SERVER_PID; ccres liberar puerto:4280
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
- No uses el 4173: es el puerto por defecto de `vite preview` y otros proyectos lo ocupan sin reservarlo en ccres. Un servidor ajeno con fallback SPA responde 200 a cualquier ruta; comprueba que `/psyopedia/no-existe/` da 404.
- Usa `127.0.0.1`, no `localhost`: Chrome puede resolver `localhost` a `::1` y hablar con otro servidor.
- Chrome headless ignora `--lang`; para probar la redirección en español usa `--accept-lang=es-ES,es` con un `--user-data-dir` nuevo.
- rtk (hook del usuario) comprime la salida de eslint, grep y otros; usa `rtk proxy <cmd>` para la salida cruda.
- `pkill -f "<patrón>"` mata el propio shell si su línea de comando contiene el patrón (también dentro de un heredoc): usa `pkill -f "[p]atrón"` en un comando aparte.
- Los screenshots del MCP de navegador se guardan en la raíz del repo (ignorados por `/*.png`).
- Ruido esperado en consola: warnings de deprecación de THREE.Clock y toNonIndexed.
- `@react-three/postprocessing` hace `JSON.stringify(props)` en efectos envueltos: nunca pasar RefObjects como `ref` a Vignette/Noise/ChromaticAberration (React 19 mete ref en props) — usar callback refs (ver PostFX.tsx).
