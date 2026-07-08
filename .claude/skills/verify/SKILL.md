---
name: verify
description: Cómo compilar, lanzar y verificar Psyopedia en modo producción local
---

# Verificar Psyopedia (producción local)

## Requisitos
- PostgreSQL del proyecto: `docker compose up -d` (postgres:17 en 5432, credenciales psyopedia/psyopedia; el volumen `pgdata` ya contiene el seed).
- En modo producción NextAuth exige secreto: exporta `AUTH_SECRET` o el endpoint `/api/auth/session` devuelve 500 y ensucia la consola de todas las páginas.

## Receta
```bash
npm run build
AUTH_SECRET=$(openssl rand -base64 32) AUTH_TRUST_HOST=true PORT=3100 npm run start &
```

## Flujos que merece la pena conducir
- `/es/iceberg` — la escena 3D (procedural, sin GLB). Verificar visualmente con Playwright MCP + screenshot; los errores de React en el canvas los captura el error boundary de `[locale]/error.tsx` y muestran "Algo ha salido mal" en lugar de la escena.
- `/{en,es}/legal/{privacy,terms}` — contenido bilingüe inline en las pages.
- 404: `/es/lo-que-sea` (y rutas profundas `/es/a/b/c` vía catch-all `[...rest]`).
- Cabeceras de seguridad: `curl -sI` en cualquier ruta (definidas en `next.config.ts`).

## Gotchas
- rtk (hook del usuario) comprime salida de eslint/otros; usa `rtk proxy <cmd>` para salida cruda.
- Los screenshots del Playwright MCP se guardan en la raíz del repo (ignorados por `/*.png`).
- Ruido esperado en consola fuera de Vercel: 404 de `/_vercel/insights/script.js`; warnings de deprecación de THREE.Clock y toNonIndexed.
- `@react-three/postprocessing` hace `JSON.stringify(props)` en efectos envueltos: nunca pasar RefObjects como `ref` a Vignette/Noise/ChromaticAberration (React 19 mete ref en props) — usar callback refs (ver PostFX.tsx).
