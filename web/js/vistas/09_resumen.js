import { datos, encabezado, puntos, caja, graficar, barraH, num, pct, C } from "../comun.js";

const D = "09_resumen";
const CORTO = { "error relativo medio": "error", "tasa de falsos positivos (final)": "falsos positivos", "sobreestimación media (apariciones)": "sobreestimación" };

export const diapos = [
  {
    etapa: "9 · Resumen",
    async render(el) {
      el.innerHTML = encabezado("Principales hallazgos", "Qué responde cada pregunta")
        + `<div class="fila" style="--cols:3">
          <div class="tarjeta"><span class="etiqueta">P1 · Competencia</span>${puntos([
            "<b>~11%</b> de los procesos tiene un solo postor, cada año",
            "Lo explica el <b>método</b>: Contratación Directa 86.5%, Régimen Especial 80%",
            "Se concentra en <b>montos bajos</b>, Lima y Tumbes, enero y diciembre",
            "Los pares que <b>se repiten</b> tienen más postor único (16.3% vs 11.9%)",
          ])}</div>
          <div class="tarjeta"><span class="etiqueta">P2 · Fraccionamiento</span>${puntos([
            "<b>1 de cada 6</b> procesos tiene un gemelo casi idéntico en 15 días",
            "Solo <b>0.66%</b> cumple el patrón completo de compra dividida",
            "<b>OEFA aporta el 90%</b>; sin OEFA quedan 161 procesos en 32 entidades",
          ])}</div>
          <div class="tarjeta"><span class="etiqueta">P3 · Precios</span>${puntos([
            "La mayoría paga <b>lo mismo</b> que compras parecidas (0.90x–1.25x)",
            "<b>12%</b> paga el doble o más — la lista para revisar",
            "La diferencia es de <b>entidad</b> (escala de compra), no de región",
          ])}</div>
        </div>`
        + caja("g-tec", "Cuánto ahorra cada técnica frente al cálculo exacto (veces, log)", "comparaciones, tiempo o memoria según la técnica");
      const t = (await datos(`${D}/a_recuento/tecnicas_resumen`)).filter(r => r.tipo_ahorro !== "—").reverse();
      const col = { comparaciones: C.azul, tiempo: C.aqua, memoria: C.naranja };
      graficar("g-tec", [barraH(t.map(r => r.tecnica), t.map(r => r.ahorro_x), {
        marker: { color: t.map(r => col[r.tipo_ahorro]) }, text: t.map(r => `${num(r.ahorro_x)}x · ${CORTO[r.metrica_error] || r.metrica_error}: ${r.metrica_error.includes("falsos") ? pct(r.error * 100, 2) : num(r.error, r.error > 0.99 && r.error < 1 ? 4 : 3)}`),
        textposition: "outside", hovertemplate: "%{y}: %{x:.1f}x<extra></extra>" })],
        { xaxis: { type: "log", range: [0.4, 2.9], tickvals: [3, 10, 30, 100], ticktext: ["3x", "10x", "30x", "100x"] }, margin: { l: 140 } });
    },
  },
];
