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
