# P2 — Fraccionamiento: resolución y conclusiones

**Pregunta:** ¿hay procesos casi idénticos de una misma entidad, en fechas cercanas y con montos bajos, que sugieran partir una compra para evitar un método más exigente?

**Técnica:** MinHash + LSH sobre los shingles de 5 caracteres (`data/final/`), con filtro de misma entidad y ventana de 15 días. Un par se registra si su Jaccard exacto es ≥ 0.90.

## Qué hace cada notebook

| Notebook | Qué hace | Salida |
|---|---|---|
| `p2_funciones` | Parámetros (`t=100`, `b=10`, `r=10`, 15 días, umbral 0.90) y funciones de MinHash, Jaccard y LSH | — |
| `a_firmas_minhash` | Calcula una firma MinHash de 100 valores por proceso y verifica que aproxima a Jaccard | `data/p2/firmas/` |
| `b_evaluacion_lsh` | En un mes (2024-06) compara LSH contra fuerza bruta para 4 configuraciones `(b, r)` | — (checkpoint) |
| `c_lsh_pares` | Corre LSH mes a mes y guarda los pares verificados ≥ 0.90 | `data/p2/pares/` |
| `d_entidades_rate` | Agrupa los pares, arma grupos de procesos y calcula el rate por entidad | `data/p2/entidades/` |

## Resultados de las técnicas

- **MinHash funciona:** 231,171 firmas en 139 s. El error medio frente al Jaccard exacto es 0.027, menor que el error teórico (0.05 con t = 100).
- **LSH no pierde pares:** en 2024-06, con `(10, 10)`, LSH propuso 10,203 candidatos en lugar de las 208,392 comparaciones de fuerza bruta (−95%) y encontró los 8,330 pares reales (recall 100%, precision 0.82).
- **`(5, 20)` tuvo mejor F1 (0.996)** porque casi todos los pares reales son idénticos (Jaccard = 1), pero perdió 20 pares. Se mantuvo `(10, 10)` porque un falso positivo solo cuesta tiempo de verificación, mientras que un falso negativo se pierde para siempre.
- **Escala:** los 36 meses se procesan en 252 s, ~7 s por mes.

## Resultados de P2

- **141,935 pares** ≥ 0.90, que involucran **36,740 procesos (15.9%)** de **2,336 entidades** (78% del total).
- **Rate global: 1 de cada 6 procesos** aparece en algún par. **Rate estricto** (sin pares de texto idéntico el mismo día): **1 de cada 15** (6.7%).
- **15,796 grupos**; el 87% son de 2 procesos. Hay grupos de hasta cientos de procesos.
- **El 23% de los pares (32,725) sube de tramo** si se suman sus montos, sobre todo de `<50k` a `50k–200k` (30,411 pares). Ese es el patrón típico de fraccionamiento.

## Cómo interpretarlo

- **Un solo caso domina los resultados.** OEFA concentra **114,841 de los 141,935 pares (81%)** y el 86% de sus procesos. Son cientos de contratos del mismo día con la misma descripción ("Servicio de supervisión ambiental", "…de fiscalización ambiental") y montos de S/ 3k–48k, en febrero y marzo de 2025. Eso explica los picos de esos meses (38k y 46k pares). Por su forma, se parece más a la contratación masiva de personas para servicios que a una compra partida, pero la técnica no puede distinguirlo: hay que revisarlo en el SEACE.
- **Sin OEFA el fenómeno sigue siendo amplio:** 27,094 pares y un rate de 14.8%. Entre las entidades con mayor rate (≥ 50 procesos) aparecen el GORE Ucayali (70%) y varios **institutos viales provinciales** (Pasco, Pachitea, Chachapoyas, Huancavelica, 50–67%). En estos últimos, una hipótesis a verificar es el mantenimiento de caminos contratado por tramo.
- **El 96% de los pares tiene texto idéntico.** La mayoría son descripciones plantilla repetidas, no variaciones sutiles. Los pares con texto distinto (~6,100) son los que de verdad aporta la similitud aproximada, y son los mejores candidatos para revisar caso por caso.
- **Ser similar no prueba fraccionamiento.** Un par detectado puede ser una republicación, varios lotes de una misma obra o un servicio recurrente legítimo. El resultado es una lista priorizada para auditar, no una acusación.

## Limitaciones

- `rate_estricto` solo excluye pares con texto idéntico **y** del mismo día. Los 90,241 pares idénticos en días distintos siguen contando.
- `monto_involucrado` suma `monto_suma` por par, así que un proceso que está en muchos pares se cuenta muchas veces (por ejemplo, OEFA figura con S/ 5,300 millones). **No debe leerse como monto real.** Para eso hay que sumar el monto de los procesos distintos.
- La ventana de 15 días y el umbral de 0.90 son decisiones del equipo. Otra ventana cambiaría los números.

## Nota técnica

La corrida completa fallaba por falta de memoria. Spark elegía *broadcast joins* porque los parquets de firmas son chicos comprimidos, pero descomprimidos pesan mucho más y saturaban el driver. Se resolvió desactivando el broadcast (`spark.sql.autoBroadcastJoinThreshold = -1`) y dándole 3 GB al driver.
