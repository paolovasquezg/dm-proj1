import { datos, encabezado, puntos, proceso, tabla, num, caja, graficar, barra, C } from "../comun.js";

export const diapos = [{
  etapa: "4 · KDD",
  async render(el) {
    el.innerHTML = encabezado("Pipeline KDD de Contrataciones",
      "Selección, limpieza y transformación. El resultado se guarda en parquet particionado por año y mes")
      + proceso([
        ["1. Selección", "Se descartan <code>estado</code> (100% nulo), <code>metodo</code> y <code>codigo_proceso</code>"],
        ["2. Limpieza", "Mayúsculas y sin espacios; texto sin tildes; montos ≤ 0 → nulo; fechas fuera de 2023–2025 fuera"],
        ["3. Moneda", "4,789 procesos en USD/EUR/… convertidos a soles con el tipo de cambio mensual del BCRP"],
        ["4. Transformación", "Una columna preparada por técnica (abajo)", true],
      ])
      + `<div class="fila">
        <div class="tarjeta"><h3>Filas en cada paso</h3><div id="t-pasos"></div></div>
        <div class="tarjeta"><h3>Columnas que se usan después</h3>${tabla([
          { c: "<code>shingles</code>", d: "trozos de 5 caracteres del texto", t: "Similitud" },
          { c: "<code>tokens</code>", d: "palabras sin conectores", t: "Vecinos (ANN)" },
          { c: "<code>postor_unico</code>", d: "1 si hubo un solo postor", t: "Flujos" },
          { c: "<code>canasta</code>", d: "ítems <code>met=</code>, <code>monto=</code>, <code>reg=</code>, <code>rubro=</code>, <code>comp=</code>", t: "Reglas" },
          { c: "<code>tramo_monto</code>", d: "6 rangos de monto", t: "Todas" },
        ], [["c", "Columna"], ["d", "Qué es"], ["t", "Técnica"]])}</div>
      </div>`
      + puntos([
        "<b>Pérdida mínima:</b> Solo 275 procesos (0.1%) tenían fechas 2026 erróneas.",
      ]);
    const pasos = await datos("04_kdd/a_transformaciones/pasos_limpieza");
    document.getElementById("t-pasos").innerHTML = tabla(pasos,
      [["paso", "Paso"], ["filas", "Filas", v => num(v)], ["perdidas", "Perdidas", v => v ? num(v) : "—"]]);
  },
}, {
  etapa: "4 · KDD",
  async render(el) {
    el.innerHTML = encabezado("Rendimiento Comparativo de Spark",
      "Tres agregaciones del EDA se escribieron con las tres APIs de Spark para comparar tiempo y esfuerzo")
      + `<div class="fila">${caja("g-spark", "Segundos por agregación", "mismo resultado exacto en las tres")}<div>`
      + puntos([
        "<b>Rendimiento:</b> DataFrame y SQL superan RDD entre 5× y 56×.",
        "<b>Costo RDD:</b> Serializa filas y exige cuatro pasos manuales.",
        "<b>Decisión:</b> DataFrame iguala SQL y sostiene todo el proyecto.",
        "<b>Particionado:</b> Un filtro mensual lee 1 de 36 carpetas.",
      ]) + "</div></div>";
    const t = await datos("03_eda/b_exploracion/tiempos_rdd_df_sql");
    const nombres = { procesos_por_entidad: "procesos por entidad", monto_por_anio: "monto por año", postor_unico_por_region: "postor único por región" };
    const x = t.map(r => nombres[r.agregacion] || r.agregacion);
    graficar("g-spark", [["rdd_s", "RDD", C.naranja], ["dataframe_s", "DataFrame", C.azul], ["sql_s", "SQL", C.aqua]].map(([k, n, c]) =>
      barra(x, t.map(r => r[k]), { name: n, marker: { color: c }, hovertemplate: `${n}: %{y:.2f} s<extra></extra>` })),
      { barmode: "group", yaxis: { title: "segundos" } });
  },
}];
