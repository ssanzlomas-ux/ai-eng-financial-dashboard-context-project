# Hallazgos de ingeniería

## Reglas propuestas

### Backend

1. **Configurar CORS solo para los sitios autorizados.**
   - **Regla:** Mantén una lista explícita de orígenes permitidos; no combines un origen comodín con credenciales habilitadas.
   - **Hecho del repositorio:** La API configura `allow_origins=["*"]` y `allow_credentials=True`.
   - **Evidencia:** `backend/app/main.py:9-10`.

2. **No exponer el depurador fuera del entorno de desarrollo.**
   - **Regla:** Limita `debugpy` a desarrollo local o a una red de confianza; no publiques su puerto en entornos expuestos.
   - **Hecho del repositorio:** El comando del backend inicia `debugpy` escuchando en `0.0.0.0:5678`, y Compose publica el puerto `5678`.
   - **Evidencia:** `backend/Dockerfile:12`; `docker-compose.yml:18-20`.

### Frontend

1. **Activar y mantener las comprobaciones estrictas de TypeScript.**
   - **Regla:** Configura `"strict": true` para la aplicación y para la configuración de Vite, y conserva esas comprobaciones en cambios futuros.
   - **Hecho del repositorio:** `frontend/tsconfig.app.json` y `frontend/tsconfig.node.json` definen `compilerOptions`, pero no declaran `"strict": true`.
   - **Evidencia:** `frontend/tsconfig.app.json:2-25`; `frontend/tsconfig.node.json:2-24`.

2. **Comprobar la estructura de los datos recibidos antes de procesarlos.**
   - **Regla:** Valida en tiempo de ejecución el JSON de la API antes de tratarlo como `FinancialMovement[]`.
   - **Hecho del repositorio:** `fetchFinancialData` declara el tipo `Promise<FinancialMovement[]>` y retorna directamente `response.json()` sin validar su estructura.
   - **Evidencia:** `frontend/src/App.tsx:14-20`.

## Convenciones observadas

- **Contratos explícitos en la API.** `backend/app/routes.py` define modelos Pydantic para las respuestas, usa `Literal` para enums de operaciones/categorías y declara `response_model` en las rutas.
- **Cálculos del dashboard aislados y probados.** `frontend/src/lib/financial-utils.ts` contiene las agregaciones y formateadores; `frontend/src/lib/financial-utils.test.ts` los cubre con Vitest.
- **Pruebas HTTP del backend con TestClient.** `backend/tests/test_routes.py` valida status, forma de respuesta, filtros y orden cronológico.
- **Integración de desarrollo centralizada.** `frontend/vite.config.ts` define el alias `@` y proxya `/api` a `backend:8000`; `docker-compose.yml` configura esos dos servicios.
- **Periodo visible derivado de los datos.** `App.tsx` pasa `formatPeriod(monthlyData)` al encabezado y la utilidad cubre rangos y datos vacíos con tests.

## Riesgos adicionales observados

- **Límites de fechas sin validación cruzada.** Las rutas aceptan `start_date` y `end_date`, pero `filter_movements_by_date` solo aplica ambos límites; no rechaza un inicio posterior al fin. Evidencia: `backend/app/routes.py`.
- **Semilla aleatoria global.** `generate_mock_movements` llama `random.seed(seed)` y después usa las funciones globales de `random`; esto altera el estado aleatorio compartido del proceso. Evidencia: `backend/app/routes.py`.

Estos hallazgos son propuestas para el trabajo futuro, no afirmaciones de que las medidas recomendadas ya estén implementadas.
