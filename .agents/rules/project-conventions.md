# Reglas propuestas para contribuidores y agents

Estas reglas son propuestas basadas en el código actual. Las observaciones de riesgo describen el estado existente; no significan que el control recomendado ya esté implementado.

## Backend

1. **Conserva contratos explícitos en las rutas.** Define respuestas con modelos Pydantic, usa `response_model` y limita valores de parámetros con `Literal` cuando el dominio es cerrado. Hecho: `backend/app/routes.py` declara `FinancialMovement`, modelos de métricas y tipos `OperationType`, `Category`, `BusinessType` y `GroupBy`.
2. **Valida los rangos de fechas.** Rechaza `start_date > end_date` antes de filtrar. Hecho: `filter_movements_by_date` aplica ambos límites, pero no comprueba su orden; las rutas aceptan las dos fechas.
3. **Restringe CORS a los orígenes necesarios.** No uses `"*"` con credenciales habilitadas. Hecho: `backend/app/main.py` configura `allow_origins=["*"]` y `allow_credentials=True`.
4. **Mantén el depurador fuera de servicios expuestos.** Ejecuta `debugpy` solo en desarrollo y no publiques su puerto en entornos expuestos. Hecho: `backend/Dockerfile` escucha en `0.0.0.0:5678` y `docker-compose.yml` publica `5678`.
5. **No alteres el generador aleatorio global.** Para datos seeded, usa una instancia local como `random.Random(seed)`. Hecho: `generate_mock_movements` llama `random.seed(seed)` y usa el generador global en `backend/app/routes.py`.

## Frontend

6. **Valida las respuestas de red en tiempo de ejecución.** Trata el JSON como desconocido hasta validar su forma; una anotación TypeScript no valida datos externos. Hecho: `fetchFinancialData` devuelve `response.json()` como `FinancialMovement[]` sin validar en `frontend/src/App.tsx`.
7. **Mantén el tipado estricto.** Habilita `strict` al endurecer la configuración y corrige los errores que revele; no reduzcas comprobaciones para silenciar incompatibilidades. Hecho: `frontend/tsconfig.app.json` y `frontend/tsconfig.node.json` no declaran `strict`.
8. **Aísla y prueba cálculos financieros.** Mantén agregaciones y formato en `frontend/src/lib/financial-utils.ts` y actualiza sus pruebas en `frontend/src/lib/financial-utils.test.ts`.
9. **Deriva el periodo visible de los datos.** Evita fijar años o periodos en la vista; conserva el comportamiento sin datos. Hecho: `frontend/src/App.tsx` deriva la etiqueta con `formatPeriod(monthlyData)` y las pruebas cubren rangos y datos vacíos.
10. **Usa la configuración de Vite para alias y API local.** Importa desde `@` y usa `/api` para el proxy de desarrollo, en vez de fijar el hostname del contenedor en componentes. Hecho: `frontend/vite.config.ts` define el alias `@` y proxya `/api` a `backend:8000`.

## Pruebas

11. **Añade pruebas cerca del contrato modificado.** Para lógica pura, sigue Vitest en `frontend/src/lib`; para rutas, usa `TestClient` en `backend/tests/test_routes.py` y comprueba código, forma de respuesta y filtros. Hecho: ambos patrones ya existen en esos archivos.
