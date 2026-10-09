# Tipos y lógica financiera del frontend

- **Nombre:** Mantener cálculos tipados, aislados y ligados a los datos.
- **Alcance:** `frontend/src/lib/financial-types.ts`, `frontend/src/lib/financial-utils.ts`, sus pruebas y los componentes que muestran sus resultados.
- **Justificación:** Los cálculos y formatos están aislados en `financial-utils.ts` y tienen pruebas vecinas; `App.tsx` deriva el periodo con `formatPeriod(monthlyData)`. Ninguno de los dos `tsconfig` activa `strict`.

## Guía

- Mantén agregaciones y formateadores como utilidades sin efectos de UI en `frontend/src/lib/financial-utils.ts`.
- Actualiza `frontend/src/lib/financial-utils.test.ts` para cambios de cálculo, fechas, formato o casos vacíos.
- Deriva etiquetas de periodo de las fechas agregadas; no introduzcas años o rangos fijos en la interfaz.
- Conserva y amplía el chequeo estricto de TypeScript; no rebajes opciones para silenciar errores de tipos.
