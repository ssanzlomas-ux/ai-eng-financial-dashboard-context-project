# Registro de Verificación - Fase 1

## Resumen del Agente vs Evidencia Real
- [x] **Frontend Stack**: Verificado en `frontend/package.json` (React + Vite).
- [x] **Backend Stack**: Verificado en `backend/app/main.py` (FastAPI).
- [x] **Puertos**:
  - Backend: `8000` (Verificado en `docker-compose.yml` y `backend/Dockerfile`).
  - Frontend: `5173` (Verificado en `docker-compose.yml` y `frontend/Dockerfile`).
- [❌ -> ✅] **Base de datos**: El agente afirmó que usaba PostgreSQL. **FALSO**: `docker-compose.yml` no declara un servicio de base de datos, `backend/requirements.txt` no incluye un driver PostgreSQL y las rutas generan datos mock. No hay evidencia de que el proyecto use PostgreSQL.

## Verificacion del resumen del proyecto (2026-10-09)
- [x] **Flujo**: `frontend/index.html` carga `src/main.tsx` y `App.tsx` consulta `/api/metrics`; Vite proxya `/api` a `backend:8000`.
- [x] **Servicios**: Compose publica frontend en `5173` y backend en `8000`; FastAPI monta las rutas y genera movimientos mock.
- [x] **Arranque documentado**: `docker compose up --build`; API docs en `/docs`.
- [x] **Periodo**: La etiqueta se deriva del primer y ultimo mes recibido; el agrupamiento usa UTC para que las fechas ISO no cambien de mes segun la zona horaria.
- [?] **Prueba unitaria**: `npm --prefix frontend run test -- src/lib/financial-utils.test.ts` no pudo iniciar (`vitest: not found`).
- [x] **HTTP backend**: `curl` devolvio `200 OK` en `/health`, `/api/metrics`, `/api/metrics/facets`, `/api/metrics/summary`, `/api/metrics/categories/top`, `/api/metrics/comparison`, `/api/metrics/alerts`, `/api/metrics/b2b`, `/api/metrics/b2c`, `/docs` y `/openapi.json`. `/health` devolvio `{"status":"ok"}`.
- [?] **Proxy frontend**: `http://localhost:5173/api/metrics` agoto el timeout de 5 s sin recibir respuesta.
