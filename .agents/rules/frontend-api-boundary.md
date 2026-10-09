# Frontera de datos del frontend

- **Nombre:** Validar y enrutar las solicitudes de API desde la frontera.
- **Alcance:** `fetchFinancialData` en `frontend/src/App.tsx` y proxy/configuración en `frontend/vite.config.ts`.
- **Justificación:** `fetchFinancialData` devuelve `response.json()` como `FinancialMovement[]` sin validación en tiempo de ejecución. Vite configura `/api` hacia `http://backend:8000`; la prueba local agotó el timeout de cinco segundos, como registra `verification.md`.

## Guía

- Trata el cuerpo recibido como dato no confiable (`unknown`) y valida su estructura antes de pasarlo a los cálculos financieros.
- Mantén el manejo de respuestas HTTP no exitosas y de errores de red; no ocultes fallos de conexión.
- Usa `/api` mediante el proxy de Vite en desarrollo y `VITE_API_BASE_URL` cuando la configuración apunte a otro backend; evita fijar el hostname del contenedor en componentes.
- Al cambiar el proxy, comprueba tanto el endpoint directo de FastAPI como `http://localhost:5173/api/...`; no des por hecho que la configuración implica que el proxy está operativo.
