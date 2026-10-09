# Contratos de la API FastAPI

- **Nombre:** Contratos explícitos y validación de parámetros.
- **Alcance:** Rutas, parámetros y modelos de respuesta en `backend/app/routes.py`.
- **Justificación:** El módulo ya define modelos Pydantic, tipos cerrados con `Literal` y `response_model`; también acepta `start_date` y `end_date` sin validar que el inicio no sea posterior al fin.

## Guía

- Conserva modelos Pydantic y `response_model` en las rutas que devuelven estructuras conocidas.
- Usa `Literal` para parámetros con valores limitados, siguiendo `OperationType`, `Category`, `BusinessType` y `GroupBy`.
- Valida relaciones entre parámetros, en particular `start_date <= end_date`, antes de filtrar movimientos.
- Cuando cambies un contrato o filtro, añade una prueba de ruta con `TestClient` en `backend/tests/test_routes.py` que cubra código HTTP y contenido relevante.
