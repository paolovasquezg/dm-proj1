# P3 — Precios de referencia: resolución y conclusiones

**Pregunta:** en compras de objeto parecido, ¿cuánto varía el monto entre entidades y regiones?

**Técnica:** cada proceso se convierte en un vector TF-IDF a partir de sus `tokens`. Para una muestra de 19,860 consultas se buscan sus 10 vecinos más parecidos con **IVF** (vecinos aproximados), en lugar de compararlas contra los 231 mil procesos (KNN exacto o fuerza bruta).

## Qué hace cada notebook

| Notebook | Qué hace | Salida |
|---|---|---|
| `funciones` | Parámetros (4,096 dimensiones, 300 listas, `NPROBE=2`, `K=10`) y funciones de TF-IDF, coseno, IVF y top-K | — |
| `a_vectores_tfidf` | Convierte los `tokens` en vectores TF-IDF normalizados | `temp/a_vectores_tfidf/vectores/` |
| `b_indice_ivf` | Agrupa los vectores en 300 "barrios" con KMeans y anota en cuál vive cada proceso | `temp/b_indice_ivf/centroides/`, `temp/b_indice_ivf/listas/` |
| `c_busqueda_ann` | Busca los 10 vecinos de cada consulta revisando solo 2 barrios, por lotes, y lo compara contra la fuerza bruta | `temp/c_busqueda_ann/consultas/`, `temp/c_busqueda_ann/vecinos/` |
| `d_analisis_entidades_regiones` | Similitud por entidad y región, y variación del monto entre procesos casi iguales | — (gráficos) |

## Resultados de las técnicas

- **Vectores:** 231,171 en 44 s, con una mediana de 16 palabras activas. El coseno nativo coincide con el de Spark ML (diferencia de 5.5 × 10⁻¹⁷).
- **Índice IVF:** KMeans de 300 listas en 80 s. Las listas son muy desiguales: la mediana tiene 504 procesos y la más grande 26,608, porque las descripciones genéricas forman barrios enormes.
- **Búsqueda:** 19,860 consultas en 10 lotes, 482 s en total. Se obtuvieron 198,600 vecinos (10 por consulta, el 100% completas) y se evitó el **97.5%** de las comparaciones.
- **Velocidad vs. precisión:** IVF fue **15.6 veces más rápido** que la fuerza bruta (9.2 s frente a 143.8 s para 346 consultas), con un **recall@10 de 69%**: de cada 10 vecinos verdaderos encuentra unos 7. Los que pierde están en barrios no revisados. Subir `NPROBE` mejora el recall a cambio de tiempo.

## Resultados de P3

- **Cada entidad se parece sobre todo a sí misma.** Los vecinos de la misma entidad tienen un coseno promedio de 0.67 y el 31% son muy parecidos (≥ 0.8). Entre entidades distintas, el coseno promedio es 0.45 y solo el 3% son muy parecidos.
- **Pasa lo mismo con las regiones:** entre el 86% y el 99% de los pares muy parecidos de cada región son con la misma región.
- **Más procesos casi iguales dentro de una entidad:** OEFA (345 procesos, 3,251 pares, coseno 0.99, el mismo caso de P2), los GORE de Puno y Ayacucho, EsSalud, el Ejército y Petroperú.
- **Entre entidades distintas las coincidencias son pocas** y suelen ser instituciones relacionadas: Cortes Superiores con el Poder Judicial, hospitales regionales entre sí, un gobierno regional con su municipalidad provincial. El caso más alto es un instituto nacional de investigación con OEFA (31 pares con coseno 1.0, es decir, la misma plantilla de texto).
- **Variación del monto (10,299 consultas con monto comparable):** la mediana paga lo mismo que sus vecinos. La mitad central está entre **0.90x y 1.25x**, y los extremos (5%–95%) entre 0.36x y 3.6x. El **11.8%** paga 2 veces o más y el **3.2%**, 5 veces o más.
- **Ninguna región paga sistemáticamente más:** la mediana regional más alta es Azángaro, con ~1.13x.
- **Entidades por encima de sus vecinos:** Banco de la Nación (~1.45x), la Municipalidad de Challhuahuacho (~1.18x) y el GORE Madre de Dios (~1.13x; el 26% de sus consultas paga 2 veces o más).

## Cómo interpretarlo

- **Una diferencia de monto no es sobreprecio.** Los casos extremos son el mismo producto en **cantidades** distintas: inmunoglobulina 84x (CENARES compra para todo el país y un hospital de Tumbes para sí), insumos del Vaso de Leche 48x (San Martín de Porres frente a Camaná, poblaciones muy distintas), mesa quirúrgica 43x. El monto es total, no unitario.
- **El texto alcanza para encontrar compras parecidas, no para fijar precios de referencia.** Haría falta la cantidad o el precio unitario por ítem para que la comparación sea justa.
- **La variación existe caso por caso, no por región.** Los casos que pagan 2x o 5x sobre sus vecinos son una lista para revisar, no una conclusión de sobreprecio.

## Limitaciones

- El recall de 69% significa que algunos vecinos verdaderos no aparecen.
- La muestra es de ~20 mil consultas, no de los 231 mil procesos.
- El umbral "muy parecido" (coseno ≥ 0.8) y el mínimo de 20 consultas por región o entidad son decisiones del equipo.

## Nota técnica

La primera corrida guardó solo ~2 vecinos por consulta. La causa es un bug de Spark 3.5.0 (la versión de la imagen Docker): los joins con DataFrames en caché pueden perder filas. Se resolvió con `spark.sql.optimizer.canChangeCachedPlanOutputPartitioning = false`. Además, la búsqueda se hace por lotes de 2,000 consultas con broadcast explícito y la muestra de consultas se guarda en parquet, para que sea siempre la misma.
