# Convenciones para contribuidores y agents

Estas reglas se apoyan en el código actual. Las justificaciones describen hechos; no significan que los riesgos señalados ya estén corregidos.

## Principios de trabajo

### KISS y YAGNI
- Elige el cambio más pequeño que resuelva el requisito presente. No añadas capas, dependencias o abstracciones sin una necesidad concreta.
- Antes de generalizar, comprueba si hay más de un uso real que lo necesite. Si solo cambia un flujo, resuélvelo en ese flujo.

### Alcance y estilo
- Modifica solo los archivos que implementan el requisito y sus pruebas. No aproveches la tarea para refactorizar módulos vecinos.
- Sigue el estilo del archivo y conserva APIs existentes salvo que el requisito exija cambiarlas.
- No elimines ni debilites pruebas para hacer pasar un cambio; si una expectativa deja de ser válida, explica el cambio de comportamiento y actualiza la prueba correspondiente.

## Backend

### 1. Contratos y filtros de API
- **Cuándo aplica:** al añadir o modificar una ruta, un parámetro o un campo de respuesta.
- **Hecho del repo:** `backend/app/routes.py` define modelos Pydantic, `response_model` y tipos `Literal`; las rutas aceptan filtros de fechas.
- **Haz esto:** conserva un modelo de respuesta explícito y limita con `Literal` los parámetros de dominio cerrado. Si se reciben `start_date` y `end_date`, rechaza `start_date > end_date` con `422` antes de filtrar.
- **Compruébalo:** añade una prueba en `backend/tests/test_routes.py` que afirme status y contenido para los casos válidos y el rango invertido. Ejecuta `docker compose exec -T backend pytest -q tests/test_routes.py`.

### 2. CORS
- **Cuándo aplica:** al cambiar `CORSMiddleware` o los orígenes del dashboard.
- **Hecho del repo:** `backend/app/main.py` configura `allow_origins=["*"]` y `allow_credentials=True`.
- **Haz esto:** enumera los orígenes que realmente deben acceder a la API; no combines credenciales con el comodín `"*"`.
- **Compruébalo:** inspecciona la respuesta `OPTIONS` con el origen permitido y uno no permitido; confirma que solo el primero recibe `Access-Control-Allow-Origin`.

### 3. Depuración del backend
- **Cuándo aplica:** al modificar el arranque del backend, puertos o configuración de despliegue.
- **Hecho del repo:** `backend/Dockerfile` inicia `debugpy` en `0.0.0.0:5678` y `docker-compose.yml` publica `5678` junto a la API.
- **Haz esto:** conserva `debugpy` solo para desarrollo local o redes confiables. En un entorno expuesto, arranca Uvicorn sin `debugpy` y no publiques el puerto `5678`.
- **Compruébalo:** revisa el comando de arranque y la lista de puertos publicados para el entorno que estás modificando.

### 4. Datos seeded y estado aleatorio
- **Cuándo aplica:** al cambiar `generate_mock_movements` o `_build_movement` en `backend/app/routes.py`.
- **Hecho del repo:** `generate_mock_movements(seed=...)` llama `random.seed(seed)` y comparte el generador global de Python.
- **Haz esto:** crea `rng = random.Random(seed)` y pásalo a las funciones que generan movimientos; no reseedees el estado global.
- **Compruébalo:** añade tests que confirmen que la misma semilla genera los mismos movimientos y que `random.getstate()` no cambia tras generar datos.

## Frontend

### 5. Frontera de la API
- **Cuándo aplica:** al consumir o cambiar respuestas HTTP en `frontend/src/App.tsx`.
- **Hecho del repo:** `fetchFinancialData` retorna `response.json()` como `FinancialMovement[]`; TypeScript no valida el JSON en ejecución.
- **Haz esto:** trata el body como `unknown` y valida que sea una lista de objetos con `create_date` ISO válida, `amount` finito, `operation_type` en `income|outcome`, categoría conocida y negocio en `B2B|B2C` antes de llamar a los cálculos.
- **Compruébalo:** cubre al menos un registro válido, un body que no sea una lista y un registro con campo inválido en Vitest.

### 6. Tipado estricto
- **Cuándo aplica:** al modificar TypeScript o cualquiera de sus configuraciones.
- **Hecho del repo:** `frontend/tsconfig.app.json` y `frontend/tsconfig.node.json` no declaran `strict`.
- **Haz esto:** no añadas `any` ni aserciones para ocultar incertidumbre de tipos. Si la tarea toca configuración, habilita `strict` y corrige los errores del código afectado, sin relajar otras comprobaciones.
- **Compruébalo:** ejecuta `docker compose exec -T frontend npm run build`, que ejecuta `tsc -b` antes de Vite.

### 7. Cálculos financieros y periodos
- **Cuándo aplica:** al cambiar KPI, agrupaciones, formatos o etiquetas temporales.
- **Hecho del repo:** `frontend/src/lib/financial-utils.ts` contiene `computeKPIs`, `computeMonthlyData` y `formatPeriod`; sus pruebas están en `frontend/src/lib/financial-utils.test.ts`.
- **Haz esto:** mantén los cálculos independientes de React; deriva el periodo de los puntos calculados y conserva explícitamente los casos sin movimientos y sin ingresos.
- **Compruébalo:** añade el caso mínimo afectado al test vecino y ejecuta `docker compose exec -T frontend npm run test -- src/lib/financial-utils.test.ts`.

### 8. Alias y proxy de Vite
- **Cuándo aplica:** al añadir imports de módulos de `src` o cambiar la URL del backend en el frontend ejecutado con Docker Compose.
- **Hecho del repo:** `frontend/vite.config.ts` asigna `@` a `src` y proxya `/api` a `http://host.docker.internal:8000`; `docker-compose.yml` asigna `host.docker.internal:host-gateway` al frontend y `App.tsx` permite `VITE_API_BASE_URL`. Esta ruta por gateway se adoptó después de observar timeouts TCP entre los peers de la red bridge en este entorno.
- **Haz esto:** usa imports `@/...` y solicita `/api/...` desde los componentes. En Compose, conserva el proxy por `host.docker.internal` junto con el alias `host-gateway`; no fijes hostnames de infraestructura en componentes. Para otro modo de ejecución, configura explícitamente `VITE_API_BASE_URL` o el proxy adecuado a ese entorno.
- **Compruébalo:** desde el host, solicita `/api/metrics` directamente en `localhost:8000` y a través de `localhost:5173/api/metrics`; verifica status y JSON. Comprueba también `/` en `localhost:5173` y registra resultados. La prueba local y el motivo del target actual constan en `verification.md`; no generalices este comportamiento de red a todos los entornos Docker.

## Verificación común

### 9. Pruebas y resultados
- **Cuándo aplica:** en todo cambio de comportamiento, contrato o regla de negocio.
- **Hecho del repo:** el frontend usa Vitest (`frontend/package.json`); el backend usa pytest y `TestClient` (`backend/tests/test_routes.py`).
- **Haz esto:** ejecuta primero el test más cercano al cambio y después amplía la suite si tocaste comportamiento compartido. Si una dependencia falta, prueba en el servicio Compose correspondiente; no declares éxito si el comando no llegó a ejecutar tests.
- **Compruébalo:** informa el comando exacto, el resultado y cualquier warning o bloqueo. Para rutas, verifica tanto status como JSON y semántica; un `200` por sí solo no basta.
