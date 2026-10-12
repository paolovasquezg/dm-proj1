import { datos, encabezado, puntos, caja, graficar, barraH, num, pct, C } from "../comun.js";

const D = "09_resumen";
const CORTO = { "error relativo medio": "error", "tasa de falsos positivos (final)": "falsos positivos", "sobreestimación media (apariciones)": "sobreestimación" };

export const diapos = [
  {
    etapa: "9 · Resumen",
    async render(el) {
      el.innerHTML = encabezado("Hallazgos Principales por Pregunta", "Qué responde cada pregunta")
        + `<div class="fila" style="--cols:3">
          <div class="tarjeta"><span class="etiqueta">P1 · Competencia</span>${puntos([
            "<b>Incidencia:</b> ~11% registra un solo postor cada año.",
            "<b>Método:</b> Directa 86.5% y Régimen Especial 80%.",
            "<b>Concentración:</b> Montos bajos, Lima, Tumbes, enero y diciembre.",
            "<b>Reincidencia:</b> 16.3% de postor único vs 11.9% inicial.",
          ])}</div>
          <div class="tarjeta"><span class="etiqueta">P2 · Fraccionamiento</span>${puntos([
            "<b>Repetición:</b> 1 de cada 6 tiene un gemelo en 15 días.",
            "<b>Alerta estricta:</b> Solo 0.66% cumple el patrón completo.",
            "<b>OEFA:</b> Concentra 90%; el resto suma 161 procesos.",
          ])}</div>
          <div class="tarjeta"><span class="etiqueta">P3 · Precios</span>${puntos([
            "<b>Rango central:</b> La mayoría paga 0.90×–1.25×.",
            "<b>Cola crítica:</b> 12% paga ≥2×.",
            "<b>Origen:</b> La brecha proviene de entidad y escala, no región.",
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
