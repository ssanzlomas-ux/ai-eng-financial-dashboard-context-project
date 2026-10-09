# Pruebas y verificación

- **Nombre:** Verificar el comportamiento en su capa más cercana.
- **Alcance:** Pruebas y comandos de verificación del frontend y backend.
- **Justificación:** El frontend usa Vitest para probar `financial-utils`; el backend usa `pytest` y `TestClient` en `backend/tests/test_routes.py`. El comando frontend está definido como `npm run test`; `verification.md` registra que el último intento no inició porque faltaba `vitest`.

## Guía

- Para cálculos, añade o ejecuta el test Vitest junto a la utilidad afectada.
- Para endpoints y filtros, añade o ejecuta pruebas `TestClient` en `backend/tests/test_routes.py`.
- Comprueba respuestas HTTP, forma del JSON y reglas funcionales; un `200` por sí solo no verifica el contenido.
- Informa por separado de pruebas ejecutadas y bloqueadas por dependencias; no describas una prueba no iniciada como aprobada.
