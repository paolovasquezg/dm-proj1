Con el EDA y el proceso KDD ya planteado, se puede realiza el resto de los procesos, ya los de mineria de datos. Voy a hacer por ahora lo de itemsets frecuentes y reglas de asociacion. Entonces, primero lo que necesito que hagas es que leas el README, y te informes sobre todo lo avanzado y lo que necesito hallar; especificamente sobre lo relacionado a las reglas de asociacion.

La idea que tengo es tomar la canastas y filtrar aquellas que son de postor unico (lo que nos interesa), de ello tomar los itemsets frecuentes (definiendo el soporte minimo), y dado ello generar las reglas de asociacion con confianza, interes y lift. Igualmente te dejo las indicaciones del enunciado.

## Indicaciones del enunciado

- **Uso de Spark:** opcional (FP-Growth puede correrse con Spark MLlib o en local sobre una muestra).
- **Objetivo:** descubrir patrones de co-ocurrencia relevantes para las preguntas de interés del equipo.
- Definir y justificar un criterio propio para transformar cada registro en una transacción ("canasta" de ítems).
- Calcular conjuntos frecuentes con un algoritmo tipo Apriori sobre un subconjunto, y con FP-Growth sobre el dataset completo o una muestra mayor.
- Generar reglas evaluadas con soporte, confianza y lift, reportando al menos ocho reglas relevantes.
- Interpretar las reglas en el contexto real del dataset, más allá de la métrica.

Lo que pretendo es que sigas la estructura a manera de formato de los notebooks que ya he hecho: la numeracion, la extension de texto y de codigo. Procurar que el texto, a menos que no sea necesario, sea a manera de bullet points concisos para transmitir la información puntual y necesaria.

La estructura de carpetas que tengo planteada la siguiente:

- `04_Asociacion`
  - `a_canastas.ipynb` (filtrar las canastas con postor unico)
  - `b_itemsets.ipynb` (generar las canastas, usar por ejemplo FP-Growth -> o alguna opcion mas optima si es necesario)
  - `c_reglas.ipynb` (incluye el tema del confianza, interes y lift)
  - `d_analisis` (analisis sobre los resultados obtenidos)

Para cualquier parametro que tomes (por ejemplo el soporte minimo, confianza minima) dejalo justificado. No tiene que ser largo, solo puntual y conciso.

La idea es que cada notebook genere data que alimente el siguiente, dentro de la misma carpeta de `04_Asociacion` tener una carpeta de `temp` donde esta esa data temporal con la que se hace la alimentacion de un notebook a otro.

La data a usar esta en `data/final` y adicionalmente tambien te dejo el enunciado del trabajo a realizar en caso tengas dudas. Cualquier duda que tengas, porfavor hazmela saber y te la aclaro.

https://docs.google.com/document/d/1Wx4J9RWaxe0jTyZ1U2UKbmWD_vhFqq5D/edit?usp=drive_link&ouid=117787070913034951591&rtpof=true&sd=true

Eres libre de agregar lo que consideres neceseario a lo que tengo planteado.