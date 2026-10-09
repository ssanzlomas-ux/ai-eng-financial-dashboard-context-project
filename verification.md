# Registro de Verificación - Fase 1

## Resumen del Agente vs Evidencia Real
- [x] **Frontend Stack**: Verificado en `frontend/package.json` (React + Vite).
- [x] **Backend Stack**: Verificado en `backend/app/main.py` (FastAPI).
- [x] **Puertos**:
  - Backend: `8000` (Verificado en `docker-compose.yml` y `backend/Dockerfile`).
  - Frontend: `5173` (Verificado en `docker-compose.yml` y `frontend/Dockerfile`).
- [❌ -> ✅] **Base de datos**: El agente afirmó que usaba PostgreSQL. **FALSO**: `docker-compose.yml` no declara un servicio de base de datos, `backend/requirements.txt` no incluye un driver PostgreSQL y las rutas generan datos mock. No hay evidencia de que el proyecto use PostgreSQL.

## Verificacion del resumen del proyecto (2026-10-09)
- [x] **Flujo**: `frontend/index.html` carga `src/main.tsx` y `App.tsx` consulta `/api/metrics`; Vite proxya `/api` a `host.docker.internal:8000`, publicado por el servicio backend.
- [x] **Servicios**: Compose publica frontend en `5173` y backend en `8000`; FastAPI monta las rutas y genera movimientos mock.
- [x] **Arranque documentado**: `docker compose up --build`; API docs en `/docs`.
- [x] **Periodo**: La etiqueta se deriva del primer y ultimo mes recibido; el agrupamiento usa UTC para que las fechas ISO no cambien de mes segun la zona horaria.
- [?] **Prueba unitaria**: `npm --prefix frontend run test -- src/lib/financial-utils.test.ts` no pudo iniciar (`vitest: not found`).
- [x] **HTTP backend**: `curl` devolvio `200 OK` en `/health`, `/api/metrics`, `/api/metrics/facets`, `/api/metrics/summary`, `/api/metrics/categories/top`, `/api/metrics/comparison`, `/api/metrics/alerts`, `/api/metrics/b2b`, `/api/metrics/b2c`, `/docs` y `/openapi.json`. `/health` devolvio `{"status":"ok"}`.
- [x] **Proxy frontend**: después de la corrección, `http://localhost:5173/api/metrics` respondió `200 OK` con JSON.

## Validación real de regla 8: proxy Vite

- **Tarea ejercitada:** seguir una llamada desde el navegador/proxy Vite hasta FastAPI. Antes del cambio, ambos contenedores compartían la red bridge y `backend` resolvía a `172.18.0.2`, pero las conexiones TCP frontend↔backend agotaban el timeout. Desde frontend, `http://172.18.0.1:8000/health` sí respondía `200`; la ruta del backend publicada en el host era accesible.
- **Cambio aplicado:** `frontend/vite.config.ts` envía `/api` a `http://host.docker.internal:8000`; `docker-compose.yml` añade `host.docker.internal:host-gateway` al frontend.
- **Resultado HTTP:** `/health` directo: `200` y `{"status":"ok"}`. `/api/metrics` directo: `200`, JSON con 360 movimientos. `/api/metrics` por `localhost:5173`: `200`, JSON con 360 movimientos y campos `create_date`, `amount`, `operation_type`, `category` y `business_type`. `localhost:5173/`: `200 text/html`.
- **Build:** `docker compose exec -T frontend npm run build` pasó (`tsc -b` y Vite); Vite mostró el warning existente de un chunk mayor de 500 kB.
- **Alcance:** esto valida la conectividad API directa y proxificada y que Vite sirve HTML; no es una prueba de renderizado visual completo en navegador. No se ejecutó Vitest para este cambio de configuración.
