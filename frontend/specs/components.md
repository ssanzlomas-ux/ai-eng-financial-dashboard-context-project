# Especificacion de componentes del dashboard

## Alcance y contratos

Esta especificacion describe los componentes de las tres funcionalidades solicitadas por producto. No afirma que esten implementados. Los contratos TypeScript de referencia son `DateRangeFilter`, `AlertsParams`, `TopCategoriesParams`, `FacetsResponse`, `AlertsResponse` y `TopCategoriesResponse`, definidos en `api-types.ts` y `param-types.ts`. `Category`, `BusinessType` y `OperationType` se reutilizan desde `frontend/src/lib/financial-types.ts`.

El dashboard actual solo consulta `/api/metrics`. Los endpoints de facets, alertas y categorias no estan conectados a la UI. La API genera datos simulados. El formato `YYYY-MM-DD` es un contrato de intercambio, no una validacion runtime provista por TypeScript.

## Filtro de fechas

### DateRangeFilterControl

**Proposito:** seleccionar un rango inclusivo que filtre el dashboard y la comparativa de negocios.

**Props:**

| Prop | Tipo | Uso |
|---|---|---|
| `value` | `DateRangeFilter` | Valores controlados `start_date` y `end_date`; cualquiera puede omitirse. |
| `facets` | `FacetsResponse \| null` | Proporciona los limites globales `min_date` y `max_date`. |
| `loading` | `boolean` | Indica que se estan cargando facets. |
| `error` | `string \| null` | Error al obtener facets o validar el rango. |
| `onChange` | `(value: DateRangeFilter) => void` | Notifica cambios de ambos valores. |

**Fuente e interaccion:** obtiene facets de `GET /api/metrics/facets`; muestra `min_date` y `max_date` como referencia junto a dos inputs de fecha. El valor serializado usa `YYYY-MM-DD`. Al cambiar un input, conserva el otro. Si ambos estan vacios, omite ambos parametros. Si solo uno tiene valor, envia solo ese limite. Si ambos tienen valor, los dos limites son inclusivos.

**Rango invalido:** si `start_date > end_date`, muestra un mensaje asociado al filtro y no dispara solicitudes de datos. El backend actual devuelve `200 []` para ese rango, aunque las reglas del repositorio piden `422`; no se debe depender de la respuesta vacia para validarlo. Esta spec requiere validacion de cliente y registra el `422` como contrato backend pendiente de alinear.

**Estados:** mientras se cargan facets, conserva el espacio del control y muestra estado de carga; ante error, muestra un mensaje y una accion de reintento. No habilita la seleccion hasta conocer el rango de referencia. Sin filtros activos, no muestra un estado de error ni reemplaza datos por una lista vacia.

**Criterios de aceptacion:**

- Muestra los limites globales de facets en formato de fecha.
- Puede enviar inicio, fin, ambos o ninguno; no transforma las fechas a otro huso horario.
- Rechaza localmente el rango invertido sin hacer fetch.
- El mismo componente y estado de rango se reutilizan en `/` y `/comparison`; la seleccion se conserva al navegar entre ambas rutas.

## Alertas de anomalias

### AlertsTable

**Proposito:** mostrar periodos cuyo gasto supera el umbral y permitir ajustar ese umbral.

**Props:**

| Prop | Tipo | Uso |
|---|---|---|
| `params` | `AlertsParams` | Umbral y filtros de fecha activos. La agrupacion se fija a `month` para esta tabla. |
| `entries` | `AlertsResponse \| null` | Filas recibidas de la API; `null` indica que aun no hay resultado cargado. |
| `loading` | `boolean` | Estado de la solicitud. |
| `error` | `string \| null` | Error de carga. |
| `onParamsChange` | `(params: AlertsParams) => void` | Actualiza el umbral y vuelve a consultar. |
| `onRetry` | `() => void` | Repite la solicitud tras un error. |

**Fuente e interaccion:** consulta `GET /api/metrics/alerts` con `threshold` y las fechas activas del filtro. El control de umbral es numerico, acepta de `0.01` a `1.0` y empieza en `0.3`. Ese rango es una restriccion de UI solicitada por producto; OpenAPI solo establece minimo `0` y default `0.3`. No se permite enviar valores fuera del rango del control.

La solicitud usa `group_by=month`, el default existente. El valor de threshold representa un ratio: `0.3` equivale a `30%`. Una fila es alerta cuando el aumento es estrictamente mayor que el threshold.

**Columnas y presentacion:**

| Columna | Campo | Formato |
|---|---|---|
| Periodo | `period` | Mes `YYYY-MM`. |
| Gasto registrado | `outcome_total` | Moneda USD con el formateador existente del dashboard. |
| Media de los 3 periodos anteriores | `baseline_average` | Moneda USD con el mismo formato. |
| Incremento | `increase_ratio` | Multiplicado por 100 y presentado como porcentaje con un decimal. |

**Discrepancia de contrato que bloquea la integracion:** actualmente `baseline_average` es la media de todos los periodos anteriores presentes despues del filtrado por fechas; no es una media movil de tres periodos. El PM requiere los tres meses calendario anteriores a cada mes de alerta. Para cumplirlo, el backend debe calcular esos tres meses incluso cuando queden antes del inicio visible y devolver las filas de alerta solo dentro del rango seleccionado. Hasta que esa semantica este implementada, la UI no debe etiquetar ni presentar el `baseline_average` actual como media de tres meses. Se conserva el campo existente de `AlertEntry`; no se inventa una propiedad API nueva. La documentacion actual de ese tipo describe la semantica vieja y tendra que alinearse cuando cambie el contrato.

**Estados:** muestra skeleton durante la carga; ante error conserva la tabla y muestra el error con opcion de reintentar. Si la respuesta es `[]`, mantiene encabezados y muestra el mensaje explicito: `No hay alertas para el rango y umbral seleccionados.` El cambio de fechas debe volver a consultar y reflejar el mismo rango usado por los KPI y graficos.

**Criterios de aceptacion:**

- Las cuatro columnas corresponden a los campos de `AlertEntry` sin cambiar sus nombres.
- El usuario puede ajustar el threshold dentro del rango de UI y ve la unidad porcentual correctamente.
- El resultado respeta el rango seleccionado y agrupa por mes.
- La media mostrada usa exactamente los tres meses anteriores, no todo el historial; hasta que backend lo cumpla, la limitacion queda visible y no se afirma que la integracion esta completa.
- El estado vacio es visible y distinto de loading y error.

## Comparativa B2B/B2C

### Navegacion y estado compartido

Se define `/` como dashboard principal y `/comparison` como pagina de comparativa, con un enlace de navegacion visible desde ambas paginas. La ruta debe poder abrirse directamente y respetar volver/avanzar del navegador. El frontend actual no tiene router y `package.json` no declara una dependencia de routing; esta spec fija las rutas publicas, pero deja la eleccion tecnica de routing para implementacion.

El rango seleccionado se comparte entre `/` y `/comparison` durante la navegacion de la aplicacion. Facets se carga una vez por sesion de pagina o se reutiliza desde estado compartido; cada vista usa el rango vigente en sus propias peticiones. Si no hay fechas, se omiten ambos parametros.

### BusinessIncomeTable

**Proposito:** mostrar el ranking de ingresos por categoria para un solo grupo de negocio. Se instancia una vez para B2B y otra para B2C.

**Props:**

| Prop | Tipo | Uso |
|---|---|---|
| `businessType` | `BusinessType` | Identifica la tabla como B2B o B2C. |
| `categories` | `Category[]` | Catalogo global de facets, no filtrado por negocio. |
| `entries` | `TopCategoriesResponse \| null` | Totales devueltos para el negocio actual. |
| `loading` | `boolean` | Estado de carga de esta tabla. |
| `error` | `string \| null` | Error de la peticion de este grupo. |
| `onRetry` | `() => void` | Reintenta la carga de este grupo. |

**Fuente e interaccion:** usa las categorias globales de `FacetsResponse.categories` como catalogo valido y una llamada a `GET /api/metrics/categories/top` con `operation_type=income`, `limit=5`, el rango compartido y el `business_type` correspondiente. Solo aparecen filas presentes en `TopCategoriesResponse`, ordenadas por `total_amount` descendente; no se anaden filas con cero para completar cinco. El catalogo global no implica que todas las categorias tengan ingresos en cada grupo.

Cada fila muestra categoria, `total_amount` en USD y porcentaje del total de ingresos de ese grupo. El total se calcula sumando `total_amount` de todas las entradas recibidas para ese grupo; el porcentaje es `total_amount / totalGrupo * 100`. Con el catalogo actual de cinco categorias, `limit=5` cubre todas las categorias que pueden tener movimientos. Si el catalogo crece por encima de cinco, el endpoint debera permitir obtener un denominador completo o proveer el total del grupo.

**Estados:** skeleton mientras carga. Un error de B2B no oculta el resultado B2C, ni a la inversa; cada tabla ofrece reintento independiente. Una lista vacia conserva encabezado y muestra `No hay ingresos por categoria para este grupo y rango.` Si el total del grupo es cero, muestra total `0` y porcentaje `N/A`, sin dividir por cero.

### IncomeComparisonChart

**Proposito:** comparar los totales de ingresos de B2B y B2C en un unico grafico.

**Props:**

| Prop | Tipo | Uso |
|---|---|---|
| `totals` | `Record<BusinessType, number>` | Ingreso total calculado por grupo a partir de sus entradas de `TopCategoriesResponse`. |
| `loading` | `boolean` | Muestra skeleton mientras ambos totales estan disponibles. |
| `error` | `string \| null` | Error que impide calcular la comparacion completa. |

**Fuente e interaccion:** deriva ambos totales de las respuestas de categorias con `operation_type=income`; no consume `/api/metrics/comparison`. Ese endpoint calcula netos de periodos y no sirve para comparar ingresos B2B frente a B2C.

**Estados:** si falla cualquiera de las dos solicitudes, conserva la tabla del grupo que si cargo y reemplaza el grafico por un error con reintento. Si ambos resultados estan vacios, el grafico muestra dos totales cero y un estado sin datos asociado, sin inventar categorias.

### ComparisonPage

**Proposito:** componer el filtro compartido, las dos tablas y el unico grafico comparativo.

**Props:**

| Prop | Tipo | Uso |
|---|---|---|
| `facets` | `FacetsResponse \| null` | Limites globales del rango y catalogo de categorias. |
| `dateRange` | `DateRangeFilter` | Rango compartido actualmente seleccionado. |
| `b2bEntries` | `TopCategoriesResponse \| null` | Respuesta de top categories para B2B. |
| `b2cEntries` | `TopCategoriesResponse \| null` | Respuesta de top categories para B2C. |
| `loading` | `boolean` | Carga inicial de facets o de la pagina. |
| `error` | `string \| null` | Error general al cargar facets. Los errores de cada top se entregan a su tabla. |
| `onDateRangeChange` | `(range: DateRangeFilter) => void` | Actualiza el filtro compartido y recarga ambos grupos. |
| `onRetry` | `() => void` | Reintenta la carga general de la pagina. |

**Criterios de aceptacion:**

- `/comparison` es accesible desde la navegacion y muestra B2B y B2C en paralelo en pantallas amplias; en pantallas estrechas, las secciones se apilan sin perder el orden.
- El cambio de rango dispara ambas consultas con los mismos parametros de fechas y conserva las respuestas/estados independientes por grupo.
- Cada tabla presenta hasta cinco ingresos principales devueltos por el endpoint y un porcentaje calculado sobre el total de su grupo.
- Un grupo sin datos no impide inspeccionar el otro; total cero nunca produce `NaN` o infinito.
- Existe un solo grafico que compara los dos totales de ingresos. No se usa `/api/metrics/comparison`.
- El idioma de etiquetas sigue el ingles existente en el dashboard; la localizacion queda fuera de alcance.

## Dependencias y limites conocidos

- `GET /api/metrics/facets` entrega categorias globales y `min_date`/`max_date`; no ofrece facets por negocio.
- `GET /api/metrics/categories/top` devuelve solo categorias presentes, no rellena con ceros.
- `GET /api/metrics/alerts` requiere alinear la media de tres meses antes de conectar la tabla al requisito del PM.
- El backend debe validar el rango invertido con `422` segun las reglas del repo; la UI tambien evita enviar dicho rango.
- La UI actual no contiene estos componentes, no consume facets/alerts/top categories y no define rutas. Esta especificacion no afirma lo contrario.