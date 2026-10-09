# Memoria del proyecto

Revision: 2026-10-09.

## Overview del producto

Dashboard web de métricas financieras con una API FastAPI. La interfaz obtiene movimientos de `/api/metrics`, calcula indicadores en el cliente y presenta cuatro KPI (ingresos, gastos, beneficio y margen), una serie mensual de ingresos/gastos y un gráfico mensual del margen. Implementa estados de carga y error. Fuentes: [frontend/src/App.tsx](../frontend/src/App.tsx), [frontend/src/components/dashboard/kpi-row.tsx](../frontend/src/components/dashboard/kpi-row.tsx), [frontend/src/components/dashboard/income-outcome-chart.tsx](../frontend/src/components/dashboard/income-outcome-chart.tsx), [frontend/src/components/dashboard/profit-percent-chart.tsx](../frontend/src/components/dashboard/profit-percent-chart.tsx).

Los cálculos agrupan por año y mes, ordenan cronológicamente, calculan el margen como beneficio dividido por ingresos (cero cuando no hay ingresos), y muestran el periodo según el primer y último mes de datos. Los importes se formatean en USD sin decimales y los porcentajes con un decimal. Fuentes: [frontend/src/lib/financial-utils.ts](../frontend/src/lib/financial-utils.ts), [frontend/src/lib/financial-types.ts](../frontend/src/lib/financial-types.ts).

### API disponible, no necesariamente expuesta por la UI

FastAPI ofrece `/health`, `/api/metrics`, `/api/metrics/facets`, `/api/metrics/summary`, `/api/metrics/categories/top`, `/api/metrics/comparison`, `/api/metrics/alerts`, `/api/metrics/b2b` y `/api/metrics/b2c`; Swagger y OpenAPI se sirven en `/docs` y `/openapi.json`. Las rutas incluyen filtros y resúmenes por fecha, categoría, operación, tipo de negocio y granularidad, según endpoint. La UI observada solo consume `/api/metrics`; no debe describirse el resto como controles disponibles en el dashboard. Fuente: [backend/app/routes.py](../backend/app/routes.py), consumo: [frontend/src/App.tsx](../frontend/src/App.tsx).

La API genera 360 movimientos simulados por llamada, 30 por cada mes del año; las rutas usan semilla 42, pero el calendario depende de `date.today()`. No es evidencia de datos financieros reales ni de persistencia. El endpoint de alertas compara gastos agrupados con promedios históricos y un umbral; el código no demuestra que use aprendizaje automático. Fuente: [backend/app/routes.py](../backend/app/routes.py).

## Stack tecnológico

### Frontend

- **Lenguaje y plataforma:** TypeScript/TSX, React y Node.js. React y React DOM están declarados en `dependencies`; el contenedor usa Node 24 Alpine. Fuentes: [frontend/package.json](../frontend/package.json), [frontend/Dockerfile](../frontend/Dockerfile).
- **UI y gráficos:** Recharts, Lucide React, `class-variance-authority`, `clsx` y `tailwind-merge`, declarados como dependencias de ejecución en [frontend/package.json](../frontend/package.json).
- **Desarrollo y build:** Vite, plugin React, Tailwind CSS con plugin de Vite, TypeScript, Vitest y ESLint están en `devDependencies`; los scripts `build`, `test` y `lint` están en [frontend/package.json](../frontend/package.json).
- **Configuración:** [frontend/vite.config.ts](../frontend/vite.config.ts) habilita React/Tailwind, el alias `@` y el proxy `/api` hacia `http://backend:8000`.

### Backend e infraestructura

- **Lenguaje y servidor:** Python 3.13 en la imagen `python:3.13-slim`; FastAPI y Uvicorn están en [backend/requirements.txt](../backend/requirements.txt). Los modelos de ruta usan Pydantic mediante FastAPI en [backend/app/routes.py](../backend/app/routes.py).
- **Herramientas declaradas junto al backend:** `debugpy`, `pytest`, `pytest-cov` y `httpx` también aparecen en `requirements.txt`; el archivo no separa dependencias de producción y desarrollo.
- **Ejecución local:** [docker-compose.yml](../docker-compose.yml) define frontend `5173` y backend `8000`, monta el código local y configura `depends_on`. [backend/Dockerfile](../backend/Dockerfile) ejecuta Uvicorn con recarga bajo `debugpy` y expone `5678`; [frontend/Dockerfile](../frontend/Dockerfile) arranca el servidor de desarrollo Vite en `5173`. Esta configuración acredita un entorno de desarrollo, no un despliegue de producción.

## Estado actual

### Capacidades y gaps observables

- **Implementado en la UI:** carga `/api/metrics`, calcula y muestra KPI/gráficos y presenta estados de carga/error. No hay en `App.tsx` controles para los filtros, facets, comparaciones, categorías top o alertas de la API.
- **Datos:** las rutas generan movimientos simulados en memoria; no hay evidencia en los archivos revisados de base de datos o persistencia.
- **Frontera frontend/API:** `fetchFinancialData` tipa el resultado como `FinancialMovement[]`, pero retorna `response.json()` sin validación de estructura en tiempo de ejecución. Fuente: [frontend/src/App.tsx](../frontend/src/App.tsx).
- **Configuración de desarrollo/seguridad:** CORS permite `"*"` junto con credenciales en [backend/app/main.py](../backend/app/main.py). `debugpy` escucha en `0.0.0.0:5678` y Compose publica ese puerto en [backend/Dockerfile](../backend/Dockerfile) y [docker-compose.yml](../docker-compose.yml).
- **Tipado:** `strict` no está declarado en [frontend/tsconfig.app.json](../frontend/tsconfig.app.json) ni [frontend/tsconfig.node.json](../frontend/tsconfig.node.json).
- **Proxy:** aunque Vite configura el proxy, la comprobación registrada de `localhost:5173/api/metrics` agotó el timeout; véase [verification.md](../verification.md).

### Comprobaciones registradas

La presencia de tests no significa que se hayan ejecutado. [frontend/src/lib/financial-utils.test.ts](../frontend/src/lib/financial-utils.test.ts) usa Vitest y [backend/tests/test_routes.py](../backend/tests/test_routes.py) usa pytest con `TestClient`.

En [verification.md](../verification.md) se registran respuestas `200 OK` de `curl` para las rutas backend, `/docs` y `/openapi.json`; `/health` devolvió `{"status":"ok"}`. La misma nota registra timeout de 5 s en el proxy frontend y que `npm --prefix frontend run test -- src/lib/financial-utils.test.ts` no pudo iniciar en el host porque faltaba `vitest`.

Otros intentos locales registrados anteriormente quedaron bloqueados por dependencias ausentes: `python -m pytest backend/tests/test_routes.py -k top_categories` (`No module named pytest`), `npm --prefix frontend run build` (`tsc: not found`) y `npm --prefix frontend run lint` (`eslint: not found`). No hay en el registro una comprobación completa del flujo en navegador. No se presentan como aprobadas pruebas que no llegaron a ejecutarse.

### Prioridades candidatas, no roadmap

Derivadas de los gaps observados, sin representar compromisos aprobados:

1. Diagnosticar y volver a verificar el proxy Vite desde el navegador/host; la ruta directa del backend respondió, pero el proxy agotó el timeout.
2. Validar en ejecución la forma del JSON antes de procesarlo como `FinancialMovement[]`.
3. Aclarar la configuración destinada a producción: orígenes CORS, exposición de `debugpy` y opciones de TypeScript.
4. Separar dependencias de backend por entorno si el proyecto necesita un entorno de producción distinto del desarrollo actual.

## Límites de evidencia

- No hay evidencia revisada de perfiles, roles, clientes, usuarios objetivo, autenticación, integración con bancos, datos reales, persistencia o despliegue de producción; se consideran desconocidos.
- Las rutas disponibles en FastAPI no demuestran que exista una pantalla o flujo de usuario para consumirlas.
- Compose, Dockerfiles y una API accesible no acreditan por sí mismos una configuración de producción.
- Recomendaciones de seguridad, validación, tipado o prioridades futuras no son funcionalidades implementadas hasta que el código y su verificación lo demuestren.

Actualizar esta memoria cuando cambie la implementación o haya nuevos resultados verificables. Mantener separadas las observaciones estáticas, los intentos bloqueados y las comprobaciones ejecutadas.