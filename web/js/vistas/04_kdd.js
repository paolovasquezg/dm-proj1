import { datos, encabezado, puntos, proceso, tabla, num } from "../comun.js";

export const diapos = [{
  etapa: "4 · KDD",
  async render(el) {
    el.innerHTML = encabezado("KDD: de datos crudos a columnas listas para cada técnica",
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
        "<b>Se pierde muy poco:</b> solo 275 procesos (0.1%), con fecha de 2026 mal registrada",
        "<b>Partición por año y mes:</b> filtrar un mes lee 1 de 36 carpetas; clave para procesar la similitud mes a mes",
      ]);
    const pasos = await datos("04_kdd/a_transformaciones/pasos_limpieza");
    document.getElementById("t-pasos").innerHTML = tabla(pasos,
      [["paso", "Paso"], ["filas", "Filas", v => num(v)], ["perdidas", "Perdidas", v => v ? num(v) : "—"]]);
  },
}];
