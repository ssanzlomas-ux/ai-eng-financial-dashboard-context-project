# Resumen del producto

Fecha de revision: 2026-10-07.

## Resumen

Dashboard de metricas financieras construido con React y TypeScript, servido mediante Vite, y una API FastAPI. El codigo permite visualizar ingresos, gastos y beneficio a partir de movimientos simulados. No se ha demostrado su funcionamiento completo en ejecucion.

Este resumen distingue hechos de implementacion de resultados verificados. No atribuye usuarios, roles ni funcionalidades que no esten demostrados en el proyecto.

## Hechos del codigo

### Interfaz implementada

- Consulta `/api/metrics` y calcula los indicadores en el frontend.
- Presenta ingresos totales, gastos totales, beneficio y porcentaje de beneficio sobre ingresos.
- Incluye graficos mensuales de ingresos y gastos, y de porcentaje de beneficio.
- Implementa estados de carga y error al consultar la API.
- Agrupa los movimientos por ano y mes y ordena la serie cronologicamente. Si no hay ingresos, el porcentaje de beneficio es cero.
- Formatea importes en USD sin decimales y porcentajes con un decimal.

Fuentes: [frontend/src/App.tsx](../frontend/src/App.tsx), [frontend/src/lib/financial-utils.ts](../frontend/src/lib/financial-utils.ts) y [frontend/src/lib/financial-types.ts](../frontend/src/lib/financial-types.ts).

### Capacidades de la API

- Devuelve movimientos con fecha, importe, operacion, categoria y tipo de negocio B2B o B2C.
- Ofrece filtros por fechas, categoria y operacion en las rutas de movimientos, y rutas separadas para B2B y B2C.
- Expone opciones de filtro y limites de fechas mediante `/api/metrics/facets`.
- Genera resumenes por dia, semana o mes, categorias principales por importe y comparaciones de balance neto entre periodos.
- Calcula alertas de aumento de gastos respecto al promedio de periodos anteriores, usando un umbral; no es un modelo de inteligencia artificial.
- Incluye `/health`, que devuelve `{"status": "ok"}`.

La interfaz actual solo consulta `/api/metrics`: no se debe afirmar que ofrece controles para todos los filtros, comparaciones, categorias o alertas disponibles en la API.

Fuente: [backend/app/routes.py](../backend/app/routes.py). Consumo desde la interfaz: [frontend/src/App.tsx](../frontend/src/App.tsx).

### Datos y entorno

- El generador crea 360 movimientos ficticios: 30 por cada uno de los 12 meses. Las rutas usan la semilla 42; las fechas dependen de `date.today()`, por lo que la semilla no fija el calendario.
- La interfaz muestra el periodo a partir del primer y ultimo mes de movimientos recibidos; las fechas mock dependen de `date.today()`.
- No encontramos evidencia de PostgreSQL ni de persistencia de los movimientos; las rutas generan datos mock.
- Compose configura frontend en el puerto 5173 y backend en el 8000. El backend usa Uvicorn con recarga y publica el puerto 5678 de `debugpy`: es configuracion de desarrollo, no evidencia de un despliegue de produccion.

Fuentes: [backend/app/routes.py](../backend/app/routes.py), [frontend/src/App.tsx](../frontend/src/App.tsx), [docker-compose.yml](../docker-compose.yml), [backend/Dockerfile](../backend/Dockerfile) y [verification.md](../verification.md).

## Estado de verificacion

Existen pruebas frontend con Vitest y backend con pytest y `TestClient`. Se anadieron casos de movimientos vacios y de limites invalidos en categorias principales. Su presencia no demuestra que pasen.

Los ultimos intentos registrados en esta sesion quedaron bloqueados por dependencias ausentes:

| Comando | Resultado observado |
| --- | --- |
| `npm --prefix frontend run test -- src/lib/financial-utils.test.ts` | `vitest: not found` |
| `python -m pytest backend/tests/test_routes.py -k top_categories` | `No module named pytest` |
| `npm --prefix frontend run build` | `tsc: not found` |
| `npm --prefix frontend run lint` | `eslint: not found` |

`git diff --check` paso al revisar las pruebas anadidas. Es una comprobacion de formato del diff, no de comportamiento. No se ha verificado el flujo completo en navegador ni el arranque conjunto de los servicios.

Fuentes de las pruebas: [frontend/src/lib/financial-utils.test.ts](../frontend/src/lib/financial-utils.test.ts) y [backend/tests/test_routes.py](../backend/tests/test_routes.py).

## Limites y suposiciones

- No hay perfiles de usuario o roles de acceso demostrados que permitan definir un publico concreto.
- No esta demostrado que sea un sistema contable o bancario, ni que integre datos financieros reales.
- No se debe presentar como un producto listo para produccion ni como un sistema cuyas pruebas, compilacion y lint hayan pasado.
- Las recomendaciones de seguridad, tipado estricto y validacion JSON no son funcionalidades ya implementadas por el hecho de figurar en las reglas del repositorio.

Actualizar este documento cuando cambie el codigo o existan nuevos resultados de ejecucion; no convertir intenciones o recomendaciones en hechos.