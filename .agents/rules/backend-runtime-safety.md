# Aislamiento del backend y herramientas de desarrollo

- **Nombre:** Limitar efectos globales y servicios de desarrollo.
- **Alcance:** Middleware, generación de datos y arranque del backend en `backend/app/main.py`, `backend/app/routes.py`, `backend/Dockerfile` y `docker-compose.yml`.
- **Justificación:** CORS permite `"*"` junto a credenciales; el contenedor inicia `debugpy` enlazado a `0.0.0.0:5678` y Compose publica ese puerto; el generador llama `random.seed(seed)` sobre el estado global.

## Guía

- Configura una lista explícita de orígenes CORS autorizados; no dejes el comodín con credenciales habilitadas.
- Mantén `debugpy` en desarrollo local o redes de confianza y no publiques su puerto en despliegues expuestos.
- Para datos deterministas, usa una instancia local como `random.Random(seed)` en vez de reseedear el generador global del proceso.
- Conserva el arranque normal del servicio en `app.main:app`; documenta por separado cualquier configuración exclusiva de desarrollo.
