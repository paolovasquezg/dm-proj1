import { datos, encabezado, puntos, caja, cifras, graficar, barra, barraH, linea, colores, num, C } from "../comun.js";

const D = "03_eda";

export const diapos = [
  {
    etapa: "3 · EDA",
    async render(el) {
      el.innerHTML = encabezado("Exploración: volumen y calidad de los datos",
        "Antes de minar, se mide cuánto hay y qué tan confiable es")
        + cifras([["236,229", "procesos en bruto"], ["8.8%", "casi-duplicados (9,276 grupos)"], ["16,203", "montos ≤ 0 (no informados)"], ["4,797", "procesos en otra moneda"]])
        + `<div class="fila">${caja("g-serie", "Procesos por mes")}${caja("g-nulos", "% de valores faltantes por columna")}</div>`
        + puntos([
          "<b>Flujo continuo:</b> ~6,500 procesos al mes, sin huecos; enero siempre es el mes más bajo",
          "<b>Faltantes:</b> <code>estado</code> nunca viene (se descarta); proveedor y monto adjudicado faltan en ~22% (procesos no adjudicados)",
          "<b>Casi-duplicados:</b> misma entidad, fecha, monto y texto bajo otro <code>ocid</code>; se conservan y se separan en la similitud",
        ]);
      const [serie, nulos] = await Promise.all([datos(`${D}/b_exploracion/serie_mensual`), datos(`${D}/a_entendimiento/nulos`)]);
      graficar("g-serie", [linea(serie.map(r => `${r.anio}-${String(r.mes).padStart(2, "0")}`), serie.map(r => r.count),
        { hovertemplate: "%{x}: %{y:,} procesos<extra></extra>" })], { xaxis: { type: "category", nticks: 9 } });
      const n = nulos.filter(r => r.pct_nulo > 0.5).sort((a, b) => a.pct_nulo - b.pct_nulo);
      graficar("g-nulos", [barraH(n.map(r => r.columna), n.map(r => r.pct_nulo),
        { marker: { color: n.map(r => r.pct_nulo > 50 ? C.rojo : C.azul) }, hovertemplate: "%{y}: %{x:.1f}%<extra></extra>" })],
        { xaxis: { ticksuffix: "%" }, margin: { l: 120 } });
    },
  },
  {
    etapa: "3 · EDA",
    async render(el) {
      el.innerHTML = encabezado("Exploración: los montos están muy concentrados",
        "La mediana es S/ 186 mil, pero unas pocas obras superan los S/ 1,000 millones")
        + `<div class="fila">${caja("g-hist", "Distribución del monto (escala logarítmica)")}${caja("g-cat", "Monto mediano por categoría (S/ miles)")}</div>`
        + puntos([
          "<b>Sesgo extremo:</b> en escala normal la media no sirve; en log₁₀ la distribución se ve simétrica, por eso se trabaja con <b>tramos de monto</b>",
          "<b>Obras ≈ 9x</b> el monto mediano de bienes y servicios, con muchos menos procesos: las comparaciones de precio deben hacerse <b>dentro de la misma categoría</b>",
        ]);
      const [hist, cat] = await Promise.all([datos(`${D}/b_exploracion/montos_hist_log10`), datos(`${D}/b_exploracion/monto_categoria`)]);
      const h = hist.filter(r => r.log10 >= 2);
      graficar("g-hist", [barra(h.map(r => r.log10), h.map(r => r.count),
        { hovertemplate: "≈ S/ 10^%{x}: %{y:,} procesos<extra></extra>" })],
        { xaxis: { title: "monto (S/)", tickvals: [2, 3, 4, 5, 6, 7, 8, 9], ticktext: ["100", "1 mil", "10 mil", "100 mil", "1 M", "10 M", "100 M", "1,000 M"] }, bargap: 0.05 });
      const nombres = { goods: "Bienes", services: "Servicios", works: "Obras" };
      graficar("g-cat", [barra(cat.map(r => nombres[r.categoria]), cat.map(r => r.monto_mediano / 1e3),
        { marker: { color: cat.map(r => r.categoria === "works" ? C.naranja : C.azul) }, text: cat.map(r => `${num(r.procesos)} procesos`),
          textposition: "outside", hovertemplate: "%{x}: S/ %{y:,.0f} mil<extra></extra>" })], { margin: { t: 24 }, yaxis: { range: [0, 1650] } });
    },
  },
  {
    etapa: "3 · EDA",
    async render(el) {
      el.innerHTML = encabezado("Exploración: la baja competencia tiene un patrón",
        "~11% de los procesos tiene un solo postor. No se reparte al azar: depende del método, del monto y de la región")
        + `<div class="fila" style="--cols:3">${caja("g-met", "% postor único por método", "", "alto")}${caja("g-tramo", "% postor único por tramo de monto", "monto referencial", "alto")}${caja("g-reg", "% postor único por región", "regiones con ≥ 500 procesos", "alto")}</div>`
        + puntos([
          "<b>El método lo explica casi todo:</b> Contratación Directa (86.5%), Régimen Especial (80%) y Convenio (54.6%) frente a 0.4–2.1% en métodos competitivos",
          "<b>Montos chicos:</b> bajo S/ 50 mil, más de la mitad de procesos tiene un solo postor",
          "<b>Región:</b> Tumbes (30.7%) y Lima (26.3%, con 68 mil procesos) duplican el promedio nacional",
        ]);
      const [met, tramo, reg] = await Promise.all([datos(`${D}/b_exploracion/competencia_metodo`),
        datos(`${D}/b_exploracion/competencia_tramo`), datos(`${D}/b_exploracion/competencia_region`)]);
      const m = met.slice(0, 11).reverse();
      graficar("g-met", [barraH(m.map(r => r.metodo_detalle.slice(0, 26)), m.map(r => r["%_postor_unico"]),
        { marker: { color: m.map(r => r["%_postor_unico"] > 50 ? C.naranja : C.azul) }, hovertemplate: "%{y}: %{x:.1f}%<extra></extra>" })],
        { xaxis: { ticksuffix: "%" }, margin: { l: 170 }, yaxis: { tickfont: { size: 10 } } });
      graficar("g-tramo", [barra(tramo.map(r => r.tramo.replace(/^\d_/, "")), tramo.map(r => r["%_postor_unico"]),
        { marker: { color: tramo.map(r => r["%_postor_unico"] > 50 ? C.naranja : C.azul) },
          hovertemplate: "%{x}: %{y:.1f}%<extra></extra>" })], { yaxis: { ticksuffix: "%" } });
      const r = reg.filter(x => x.procesos >= 500).slice(0, 8).reverse();
      graficar("g-reg", [barraH(r.map(x => x.region), r.map(x => x.pct_postor_unico),
        { hovertemplate: "%{y}: %{x:.1f}%<extra></extra>" })], { xaxis: { ticksuffix: "%" }, margin: { l: 110 } });
    },
  },
];
